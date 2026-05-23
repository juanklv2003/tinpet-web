require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const http = require("http");
const { randomUUID } = require("crypto");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const { Server } = require("socket.io");
const { Expo } = require("expo-server-sdk");
const { OAuth2Client } = require("google-auth-library");
const { haversineDistance } = require("./lib/haversine");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Swagger imports
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const assistantRoutes = require("./routes/assistant.routes");
const knowledgeRoutes = require("./routes/knowledge.routes");
const adminRoutes = require("./routes/admin.routes");
const uploadRoutes = require("../routes/upload.ts");

const JWT_SECRET = process.env.JWT_SECRET || "tinpet-secret-key-2024";
const MAX_JSON_PAYLOAD = process.env.MAX_JSON_PAYLOAD || "10mb";
const MAX_PET_IMAGE_BYTES = Number(
  process.env.MAX_PET_IMAGE_BYTES || 4 * 1024 * 1024,
);
const MAX_PET_PHOTOS = Number(process.env.MAX_PET_PHOTOS || 10);

function estimateBase64Bytes(dataUrl) {
  if (typeof dataUrl !== "string" || !dataUrl.includes("base64,")) {
    return 0;
  }
  const base64 = dataUrl.split("base64,")[1] || "";
  const padding = (base64.match(/=+$/) || [""])[0].length;
  return Math.floor((base64.length * 3) / 4) - padding;
}

function parsePhotoUrlsFromImageField(raw) {
  if (!raw || typeof raw !== "string") return [];

  const trimmed = raw.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (item) => typeof item === "string" && item.trim().length > 0,
        );
      }
    } catch {
      return [trimmed];
    }
  }

  return [trimmed];
}

function toStoredImageField(photoUrls) {
  if (!Array.isArray(photoUrls) || photoUrls.length === 0) return null;
  if (photoUrls.length === 1) return photoUrls[0];
  return JSON.stringify(photoUrls);
}

// ── Push Notification Helper ─────────────────────────────────────
const expo = new Expo();

async function sendPushNotification(userId, title, body, data = {}) {
  try {
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user?.push_token) {
      console.log(`[Push] No push token for user ${userId}`);
      return;
    }

    if (!Expo.isExpoPushToken(user.push_token)) {
      console.error(`[Push] Invalid Expo push token for user ${userId}: ${user.push_token}`);
      return;
    }

    const message = {
      to: user.push_token,
      sound: { volume: 1 },
      title,
      body,
      data: {
        type: data.type || 'chat',
        conversationId: data.conversationId || null,
        matchId: data.matchId || null,
        petId: data.petId || null,
        petName: data.petName || null,
      },
      priority: 'high',
      channelId: data.channelId || 'messages',
    };

    const ticket = await expo.sendPushNotificationsAsync([message]);
    console.log(`[Push] Sent to user ${userId}:`, JSON.stringify(ticket));
    return ticket;
  } catch (error) {
    console.error(`[Push] Error sending to user ${userId}:`, error);
  }
}
global.sendPushNotification = sendPushNotification;

function normalizeIncomingPhotoUrls(aiProfile) {
  const fromArray = Array.isArray(aiProfile?.photoUrls)
    ? aiProfile.photoUrls.filter(
        (item) => typeof item === "string" && item.trim().length > 0,
      )
    : [];

  if (fromArray.length > 0) {
    return fromArray.slice(0, MAX_PET_PHOTOS);
  }

  if (typeof aiProfile?.photoUrl === "string" && aiProfile.photoUrl.trim()) {
    return [aiProfile.photoUrl.trim()];
  }

  return [];
}

function validatePhotoUrls(photoUrls) {
  if (!Array.isArray(photoUrls)) return null;

  if (photoUrls.length > MAX_PET_PHOTOS) {
    return `Maximo ${MAX_PET_PHOTOS} fotos por mascota.`;
  }

  for (const url of photoUrls) {
    if (typeof url !== "string") continue;
    if (url.startsWith("data:image/")) {
      const imageBytes = estimateBase64Bytes(url);
      if (imageBytes > MAX_PET_IMAGE_BYTES) {
        return `Imagen demasiado grande. Maximo permitido: ${Math.round(MAX_PET_IMAGE_BYTES / (1024 * 1024))}MB por foto.`;
      }
    }
  }

  return null;
}

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "TinPet API",
      version: "1.0.0",
      description: "API para la app TinPet - Tinder para mascotas",
      contact: {
        name: "API Support",
      },
    },
    servers: [
      {
        url: "http://10.13.30.253:3000",
        description: "Servidor de desarrollo",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "string" },
            email: { type: "string" },
            name: { type: "string" },
            role: { type: "string", enum: ["adopter", "shelter", "vet"] },
          },
        },
        Pet: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            species: { type: "string" },
            status: { type: "string" },
            breed: { type: "string", nullable: true },
            image_url: { type: "string", nullable: true },
            birth_date: { type: "string", format: "date", nullable: true },
            shelter_id: { type: "string" },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string" },
          },
        },
        RegisterRequest: {
          type: "object",
          required: ["email", "password", "name", "role"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 6 },
            name: { type: "string" },
            role: { type: "string", enum: ["adopter", "shelter", "vet"] },
          },
        },
        LoginResponse: {
          type: "object",
          properties: {
            token: { type: "string" },
            role: { type: "string" },
            name: { type: "string" },
          },
        },
        Match: {
          type: "object",
          properties: {
            id: { type: "string" },
            pet_id: { type: "string" },
            adopter_id: { type: "string" },
            status: {
              type: "string",
              enum: ["pending", "accepted", "rejected"],
            },
            pet_name: { type: "string", nullable: true },
            user_name: { type: "string", nullable: true },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Inicializamos Prisma y Express
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const app = express();

// Root endpoint para verificar que el servidor está vivo
app.get("/", (req, res) => {
  res.send("TinPet API está funcionando correctamente 🚀");
});

// Middlewares básicos
app.use(cors());
app.use(express.json({ limit: MAX_JSON_PAYLOAD }));
app.use(express.urlencoded({ extended: true, limit: MAX_JSON_PAYLOAD }));
app.use("/api/assistant", assistantRoutes);
app.use("/api/knowledge", knowledgeRoutes);
app.use("/api/admin", adminRoutes);

// Serve static files (uploaded images)
app.use("/public", express.static(path.join(__dirname, "../../public")));

app.use((err, req, res, next) => {
  if (err?.type === "entity.too.large") {
    return res.status(413).json({
      error: `Payload demasiado grande. Reduce la imagen o usa un máximo de ${MAX_JSON_PAYLOAD}.`,
    });
  }
  return next(err);
});

// --- SWAGGER UI ---
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// --- MIDDLEWARE DE AUTENTICACIÓN ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Token requerido" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Token inválido" });
    }
    req.user = user;
    next();
  });
};

function isProfessionalRole(role) {
  return role === "shelter" || role === "vet";
}

async function getProfessionalShelterProfile(user) {
  if (!user || !isProfessionalRole(user.role)) return null;

  const shelter = await prisma.shelters.findFirst({
    where: { user_id: user.sub },
  });
  if (shelter) return shelter;

  if (user.role !== "vet") return null;

  const vetClinic = await prisma.vet_clinics.findFirst({
    where: { user_id: user.sub },
  });
  if (!vetClinic) return null;

  // DEFERRED: add description, website, instagram, facebook here once shelters schema has those columns
  return prisma.shelters.create({
    data: {
      id: randomUUID(),
      user_id: user.sub,
      name: vetClinic.name,
      email: vetClinic.email,
      phone: vetClinic.phone,
      location: vetClinic.location,
    },
  });
}

// Cloudinary upload endpoint for authenticated web clients
app.use("/api/upload", authenticateToken, uploadRoutes);

// --- UPLOAD IMAGE (base64) ---
app.post("/api/uploads", authenticateToken, async (req, res) => {
  try {
    const fs = require("fs");
    const path = require("path");

    // Ensure uploads directory exists
    const uploadDir = path.join(__dirname, "../../public/uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    let base64Data, ext;

    if (req.body?.base64 && typeof req.body.base64 === "string") {
      base64Data = req.body.base64;
    } else if (req.body?.image && typeof req.body.image === "string") {
      base64Data = req.body.image;
    } else {
      return res
        .status(400)
        .json({ error: "Se requiere campo 'image' o 'base64'" });
    }

    if (base64Data.startsWith("data:")) {
      const match = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
      if (!match) {
        return res.status(400).json({ error: "Formato de imagen inválido" });
      }
      ext = match[1] === "jpeg" ? "jpg" : match[1];
      base64Data = match[2];
    } else {
      ext = "jpg";
    }

    const filename = `${randomUUID()}.${ext}`;
    const filepath = path.join(uploadDir, filename);
    fs.writeFileSync(filepath, base64Data, "base64");

    // Return full URL (use env or construct from request host)
    const baseUrl =
      process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
    const url = `${baseUrl}/public/uploads/${filename}`;

    return res.json({ url, filename });
  } catch (error) {
    console.error("Error uploading image:", error);
    return res.status(500).json({ error: "Error al subir la imagen" });
  }
});

// --- HELPER: Mapear pet al formato del frontend ---
const mapPetToFrontend = (pet) => ({
  ...(pet ?? {}),
  id: pet.id,
  name: pet.name,
  species: pet.species,
  status:
    pet.status === "disponible"
      ? "available"
      : pet.status === "adoptado"
        ? "adopted"
        : "pending",
  created_at: pet.created_at,
  shelter_id: pet.shelter_id,
  ai_profile: {
    ...(typeof pet.ai_profile === "object" && pet.ai_profile !== null
      ? pet.ai_profile
      : {}),
    breed: pet.breed || null,
    photoUrls: parsePhotoUrlsFromImageField(pet.image_url),
    photoUrl: parsePhotoUrlsFromImageField(pet.image_url)[0] || null,
    birthDate: pet.birth_date
      ? pet.birth_date.toISOString().split("T")[0]
      : null,
    intakeDate: pet.registration_date
      ? pet.registration_date.toISOString().split("T")[0]
      : null,
    vaccines: [],
    medicalHistory: [],
    inChargeEmployeeId: pet.in_charge_employee_id || null,
  },
});

// --- PETS ---

/**
 * @swagger
 * /api/pets:
 *   get:
 *     summary: Obtener todas las mascotas
 *     tags: [Pets]
 *     responses:
 *       200:
 *         description: Lista de mascotas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Pet'
 */
app.get("/api/pets", async (req, res) => {
  try {
    let whereClause = {};

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try {
        const payload = jwt.verify(token, JWT_SECRET);

        if (payload.role === "adopter") {
          const adopter = await prisma.adopters.findFirst({
            where: { user_id: payload.sub },
          });

          if (adopter) {
            whereClause = {
              status: "disponible",
              NOT: {
                matches: {
                  some: {
                    adopter_id: adopter.id,
                  },
                },
              },
            };
          } else {
            whereClause = { status: "disponible" };
          }
        }
      } catch {
        // If token is invalid on a public endpoint, return the default unfiltered feed.
      }
    }

    const allPets = await prisma.pets.findMany({ where: whereClause });
    res.json(allPets.map(mapPetToFrontend));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener las mascotas" });
  }
});

// GET /api/pets/mine - mascotas del shelter logueado
/**
 * @swagger
 * /api/pets/mine:
 *   get:
 *     summary: Obtener mascotas del refugio autenticado
 *     tags: [Pets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de mascotas del refugio
 *       403:
 *         description: Solo los refugios pueden acceder
 */
app.get("/api/pets/mine", authenticateToken, async (req, res) => {
  try {
    if (!isProfessionalRole(req.user.role)) {
      return res
        .status(403)
        .json({ error: "Solo refugios y veterinarias pueden gestionar mascotas" });
    }

    const shelter = await getProfessionalShelterProfile(req.user);

    if (!shelter) {
      return res.status(404).json({ error: "Perfil profesional no encontrado" });
    }

    const myPets = await prisma.pets.findMany({
      where: { shelter_id: shelter.id },
    });

    res.json(myPets.map(mapPetToFrontend));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener tus mascotas" });
  }
});

// POST /api/pets - crear mascota
/**
 * @swagger
 * /api/pets:
 *   post:
 *     summary: Crear una mascota (solo refugios)
 *     tags: [Pets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - species
 *             properties:
 *               name:
 *                 type: string
 *               species:
 *                 type: string
 *               status:
 *                 type: string
 *               ai_profile:
 *                 type: object
 *     responses:
 *       201:
 *         description: Mascota creada
 *       403:
 *         description: Solo los refugios pueden crear mascotas
 */
app.post("/api/pets", authenticateToken, async (req, res) => {
  try {
    if (!isProfessionalRole(req.user.role)) {
      return res
        .status(403)
        .json({ error: "Solo refugios y veterinarias pueden crear mascotas" });
    }

    const { name, species, status, description, ai_profile } = req.body;

    if (!name || !species) {
      return res.status(400).json({ error: "Nombre y especie son requeridos" });
    }

    const photoUrls = normalizeIncomingPhotoUrls(ai_profile);
    const validationError = validatePhotoUrls(photoUrls);
    if (validationError) {
      return res.status(413).json({ error: validationError });
    }

    const shelter = await getProfessionalShelterProfile(req.user);

    if (!shelter) {
      return res.status(404).json({ error: "Perfil profesional no encontrado" });
    }

    // Mapear status al formato de la DB
    const dbStatus =
      status === "available"
        ? "disponible"
        : status === "adopted"
          ? "adoptado"
          : "pendiente";

    // Extraer datos del ai_profile
    const petData = {
      name,
      species,
      status: dbStatus,
      description: description || null,
      shelter_id: shelter.id,
      breed: ai_profile?.breed || null,
      image_url: toStoredImageField(photoUrls),
      birth_date: ai_profile?.birthDate ? new Date(ai_profile.birthDate) : null,
      registration_date: new Date(),
      in_charge_employee_id: ai_profile?.inChargeEmployeeId || null,
      ai_profile: ai_profile || {},
    };

    const newPet = await prisma.pets.create({ data: petData });
    res.status(201).json(mapPetToFrontend(newPet));
  } catch (error) {
    console.error("Error al crear mascota:", error);
    res.status(500).json({ error: "Error al crear mascota" });
  }
});

// GET /api/pets/:id - ver una mascota
app.get("/api/pets/:id", authenticateToken, async (req, res) => {
  try {
    const pet = await prisma.pets.findUnique({
      where: { id: req.params.id }, include: { shelters: { include: { users: true } }, shelter_employees: true, medical_records: { orderBy: { created_at: 'desc' } } }
    });

    if (!pet) {
      return res.status(404).json({ error: "Mascota no encontrada" });
    }

    res.json(mapPetToFrontend(pet));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener la mascota" });
  }
});

// PATCH /api/pets/:id - actualizar mascota
app.patch("/api/pets/:id", authenticateToken, async (req, res) => {
  try {
    if (!isProfessionalRole(req.user.role)) {
      return res
        .status(403)
        .json({ error: "Solo refugios y veterinarias pueden actualizar mascotas" });
    }

    const { ai_profile, status, name, species, description } = req.body;
    const updateData = {};

    if (typeof name === "string" && name.trim()) {
      updateData.name = name.trim();
    }

    if (typeof species === "string" && species.trim()) {
      updateData.species = species.trim();
    }

    if (typeof description === "string") {
      updateData.description = description.trim() || null;
    }

    const existingPet = await prisma.pets.findUnique({ where: { id: req.params.id } });

    if (status) {
      updateData.status =
        status === "available"
          ? "disponible"
          : status === "adopted"
            ? "adoptado"
            : "pendiente";
    }

    // Marcar como adoptado: NO tocamos ai_profile aquí (Prisma client no lo conoce)
    // Se actualiza vía raw SQL después del update principal

    if (ai_profile) {
      updateData.ai_profile = ai_profile;

      if (typeof ai_profile.breed === "string")
        updateData.breed = ai_profile.breed || null;

      const photoUrls = normalizeIncomingPhotoUrls(ai_profile);
      const validationError = validatePhotoUrls(photoUrls);
      if (validationError) {
        return res.status(413).json({ error: validationError });
      }

      if (
        Array.isArray(ai_profile.photoUrls) ||
        typeof ai_profile.photoUrl === "string"
      ) {
        updateData.image_url = toStoredImageField(photoUrls);
      }

      if (typeof ai_profile.birthDate === "string" && ai_profile.birthDate) {
        updateData.birth_date = new Date(ai_profile.birthDate);
      }

      if (ai_profile.inChargeEmployeeId !== undefined) {
        updateData.in_charge_employee_id = ai_profile.inChargeEmployeeId;
      }
    }

    const updatedPet = await prisma.pets.update({
      where: { id: req.params.id },
      include: {
        shelters: { include: { users: true } },
        shelter_employees: true,
        medical_records: { orderBy: { created_at: "desc" } },
      },
      data: updateData,
    });

    // Si se marca como adoptado, persistir adoptionDate y adopterName en ai_profile
    // usando raw SQL porque el cliente Prisma generado no incluye ese campo en sus tipos
    let petToReturn = updatedPet;
    if (updateData.status === "adoptado") {
      const adoptionDate = req.body.adoptionDate || new Date().toISOString().split("T")[0];
      const adopterName = req.body.adopterName || null;
      const adoptionPatch = JSON.stringify({ adoptionDate, adopterName });
      await prisma.$executeRaw`
        UPDATE pets
        SET ai_profile = COALESCE(ai_profile, '{}')::jsonb || ${adoptionPatch}::jsonb
        WHERE id = ${req.params.id}::uuid
      `;
      // Refrescar el pet para que la respuesta incluya los datos actualizados
      const refreshed = await prisma.pets.findUnique({
        where: { id: req.params.id },
        include: {
          shelters: { include: { users: true } },
          shelter_employees: true,
          medical_records: { orderBy: { created_at: "desc" } },
        },
      });
      if (refreshed) petToReturn = refreshed;
    }

    // Emitir evento de socket siempre que cambie el status
    if (global.io) {
      global.io.emit("pet_status_updated", {
        petId: petToReturn.id,
        status: petToReturn.status,
      });

      // Si se marca como adoptado y tiene adoptante asignado, notificar por push
      if (petToReturn.status === "adoptado" && petToReturn.adopter_id) {
        const adopter = await prisma.adopters.findUnique({
          where: { id: petToReturn.adopter_id },
          include: { users: true },
        });

        if (adopter?.users?.id) {
          void sendPushNotification(
            adopter.users.id,
            "¡Adopción completada! 🐾",
            `La adopción de ${petToReturn.name} ha sido confirmada. ¡Valorá tu experiencia!`,
            {
              type: "adoption_completed",
              petId: petToReturn.id,
              petName: petToReturn.name,
            }
          );
        }
      }
    }

    res.json(mapPetToFrontend(petToReturn));
  } catch (error) {
    console.error("Error al actualizar mascota:", error);
    res.status(500).json({ error: "Error al actualizar mascota" });
  }
});

// DELETE /api/pets/:id - eliminar mascota
app.delete("/api/pets/:id", authenticateToken, async (req, res) => {
  try {
    if (!isProfessionalRole(req.user.role)) {
      return res
        .status(403)
        .json({ error: "Solo refugios y veterinarias pueden eliminar mascotas" });
    }

    await prisma.pets.delete({
      where: { id: req.params.id }
    });

    res.json({ message: "Mascota eliminada" });
  } catch (error) {
    console.error("Error al eliminar mascota:", error);
    res.status(500).json({ error: "Error al eliminar mascota" });
  }
});

// --- SWIPE & LIKES (Para app móvil) ---

/**
 * @swagger
 * /api/swipe:
 *   post:
 *     summary: Hacer swipe en una mascota (like/dislike)
 *     tags: [Swipe]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - petId
 *               - action
 *             properties:
 *               petId:
 *                 type: string
 *               action:
 *                 type: string
 *                 enum: [like, nope]
 *     responses:
 *       200:
 *         description: Swipe registrado
 *       401:
 *         description: No autorizado
 */
app.post("/api/swipe", authenticateToken, async (req, res) => {
  try {
    console.log("Swipe request:", req.body);
    console.log("User:", req.user);

    if (req.user.role !== "adopter") {
      return res
        .status(403)
        .json({ error: "Solo los adoptantes pueden hacer swipe" });
    }

    const { petId, action } = req.body;

    if (!petId || !action) {
      return res.status(400).json({ error: "petId y action son requeridos" });
    }

    if (!["like", "nope"].includes(action)) {
      return res.status(400).json({ error: 'Action debe ser "like" o "nope"' });
    }

    // Buscar el adoptante
    const adopter = await prisma.adopters.findFirst({
      where: { user_id: req.user.sub },
      orderBy: { created_at: "desc" },
    });

    console.log("Adopter found:", adopter);

    if (!adopter) {
      return res.status(404).json({
        error:
          "Adoptante no encontrado. Asegurate de registrarte como adoptante.",
      });
    }

    // Verificar que la mascota existe
    const pet = await prisma.pets.findUnique({
      where: { id: petId },
    });

    console.log("Pet found:", pet);

    if (!pet) {
      return res.status(404).json({ error: "Mascota no encontrada" });
    }

    // Verificar si el usuario está bloqueado por este refugio
    const isBlocked = await prisma.matches.findFirst({
      where: {
        adopter_id: adopter.id,
        interaction_type: "blocked",
        pets: {
          shelter_id: pet.shelter_id,
        },
      },
    });

    if (isBlocked) {
      return res.status(200).json({
        success: true,
        alreadyInteracted: true,
        message: "No puedes interactuar con mascotas de este refugio",
      });
    }

    const existingInteraction = await prisma.matches.findFirst({
      where: {
        adopter_id: adopter.id,
        pet_id: petId,
      },
    });

    if (existingInteraction) {
      return res.status(200).json({
        success: true,
        alreadyInteracted: true,
        matchId: existingInteraction.id,
        message: "Ya habias interactuado con esta mascota",
      });
    }

    // Crear el registro de match/solicitud
    const match = await prisma.matches.create({
      data: {
        pet_id: petId,
        adopter_id: adopter.id,
        interaction_type: action === "like" ? "pending" : "disliked",
      },
    });

    // Notificar en tiempo real al refugio dueño de la mascota
    if (action === "like") {
      try {
        const shelter = await prisma.shelters.findUnique({
          where: { id: pet.shelter_id },
        });
        if (shelter?.user_id) {
          global.io.to(`user:${shelter.user_id}`).emit("new_match_request", {
            matchId: match.id,
            petId: pet.id,
            petName: pet.name,
            adopterName: adopter.name,
          });
          void sendPushNotification(
            shelter.user_id,
            "¡Nueva solicitud de adopción!",
            `${adopter.name || "Un adoptante"} está interesado en ${pet.name || "tu mascota"}`,
            { type: "match_request", matchId: match.id, petName: pet.name }
          );
        }
      } catch (notifyErr) {
        // No bloqueamos la respuesta si falla la notificación
        console.error("Error al notificar match al refugio:", notifyErr);
      }
    }

    res.json({
      success: true,
      matchId: match.id,
      message:
        action === "like" ? "Te interesa esta mascota!" : "Ok, siguiente",
    });
  } catch (error) {
    console.error("Error en swipe:", error);
    res
      .status(500)
      .json({ error: "Error al registrar swipe: " + error.message });
  }
});

// --- BLOCKING ENDPOINTS ---
app.post(
  "/api/conversations/:id/block",
  authenticateToken,
  async (req, res) => {
    try {
      if (!isProfessionalRole(req.user.role)) {
        return res
          .status(403)
          .json({ error: "Solo refugios y veterinarias pueden bloquear usuarios" });
      }

      const conversationId = req.params.id;
      const conversation = await prisma.conversations.findUnique({
        where: { id: conversationId },
        include: { pet: true },
      });

      if (!conversation) {
        return res.status(404).json({ error: "Conversación no encontrada" });
      }

      const shelter = await getProfessionalShelterProfile(req.user);

      if (!shelter || shelter.id !== conversation.shelter_id) {
        return res
          .status(403)
          .json({
            error: "No tienes permiso para bloquear en esta conversación",
          });
      }

      // Encontramos todos los matches de este adoptante con cualquier mascota del shelter
      // O si ya existe uno, lo actualizamos. Sino creamos uno nuevo con interaction_type = "blocked"
      if (conversation.match_id) {
        await prisma.matches.upsert({
          where: { id: conversation.match_id },
          update: { interaction_type: "blocked" },
          create: {
            id: conversation.match_id,
            adopter_id: conversation.adopter_id,
            pet_id: conversation.pet_id,
            interaction_type: "blocked",
          },
        });
      } else {
        await prisma.matches.create({
          data: {
            adopter_id: conversation.adopter_id,
            pet_id: conversation.pet_id,
            interaction_type: "blocked",
          },
        });
      }

      const shelterPets = await prisma.pets.findMany({
        where: { shelter_id: shelter.id },
        select: { id: true },
      });

      const petIds = shelterPets.map((p) => p.id);

      await prisma.matches.updateMany({
        where: {
          adopter_id: conversation.adopter_id,
          pet_id: { in: petIds },
        },
        data: {
          interaction_type: "blocked",
        },
      });

      return res.json({
        success: true,
        message: "Usuario bloqueado exitosamente",
      });
    } catch (error) {
      console.error("Error al bloquear usuario:", error);
      return res
        .status(500)
        .json({ error: "Error interno al bloquear usuario" });
    }
  },
);

app.post(
  "/api/conversations/:id/unblock",
  authenticateToken,
  async (req, res) => {
    try {
      if (!isProfessionalRole(req.user.role)) {
        return res
          .status(403)
          .json({ error: "Solo refugios y veterinarias pueden desbloquear usuarios" });
      }

      const conversationId = req.params.id;
      const conversation = await prisma.conversations.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        return res.status(404).json({ error: "Conversación no encontrada" });
      }

      const shelter = await getProfessionalShelterProfile(req.user);

      if (!shelter || shelter.id !== conversation.shelter_id) {
        return res
          .status(403)
          .json({
            error: "No tienes permiso para desbloquear en esta conversación",
          });
      }

      const shelterPets = await prisma.pets.findMany({
        where: { shelter_id: shelter.id },
        select: { id: true },
      });

      const petIds = shelterPets.map((p) => p.id);

      await prisma.matches.updateMany({
        where: {
          adopter_id: conversation.adopter_id,
          pet_id: { in: petIds },
          interaction_type: "blocked",
        },
        data: {
          interaction_type: "pending",
        },
      });

      return res.json({
        success: true,
        message: "Usuario desbloqueado exitosamente",
      });
    } catch (error) {
      console.error("Error al desbloquear usuario:", error);
      return res
        .status(500)
        .json({ error: "Error interno al desbloquear usuario" });
    }
  },
);

// --- ARCHIVE / UNARCHIVE ENDPOINTS ---
app.patch(
  "/api/conversations/:id/archive",
  authenticateToken,
  async (req, res) => {
    try {
      const conversationId = req.params.id;
      const userId = req.user.userId || req.user.sub;
      const { role } = req.user;

      const conversation = await prisma.conversations.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        return res.status(404).json({ error: "Conversación no encontrada" });
      }

      // Verify the user belongs to this conversation
      if (role === "adopter") {
        const adopter = await prisma.adopters.findFirst({
          where: { user_id: userId },
        });
        if (!adopter || adopter.id !== conversation.adopter_id) {
          return res.status(403).json({ error: "No tienes permiso para archivar esta conversación" });
        }
      } else if (isProfessionalRole(role)) {
        const shelter = await getProfessionalShelterProfile(req.user);
        if (!shelter || shelter.id !== conversation.shelter_id) {
          return res.status(403).json({ error: "No tienes permiso para archivar esta conversación" });
        }
      } else {
        return res.status(403).json({ error: "Rol no autorizado" });
      }

      await prisma.conversations.update({
        where: { id: conversationId },
        data: { archived: true },
      });

      return res.json({ success: true, message: "Conversación archivada" });
    } catch (error) {
      console.error("Error al archivar conversación:", error);
      return res.status(500).json({ error: "Error interno al archivar conversación" });
    }
  },
);

app.patch(
  "/api/conversations/:id/unarchive",
  authenticateToken,
  async (req, res) => {
    try {
      const conversationId = req.params.id;
      const userId = req.user.userId || req.user.sub;
      const { role } = req.user;

      const conversation = await prisma.conversations.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        return res.status(404).json({ error: "Conversación no encontrada" });
      }

      // Verify the user belongs to this conversation
      if (role === "adopter") {
        const adopter = await prisma.adopters.findFirst({
          where: { user_id: userId },
        });
        if (!adopter || adopter.id !== conversation.adopter_id) {
          return res.status(403).json({ error: "No tienes permiso para desarchivar esta conversación" });
        }
      } else if (isProfessionalRole(role)) {
        const shelter = await getProfessionalShelterProfile(req.user);
        if (!shelter || shelter.id !== conversation.shelter_id) {
          return res.status(403).json({ error: "No tienes permiso para desarchivar esta conversación" });
        }
      } else {
        return res.status(403).json({ error: "Rol no autorizado" });
      }

      await prisma.conversations.update({
        where: { id: conversationId },
        data: { archived: false },
      });

      return res.json({ success: true, message: "Conversación desarchivada" });
    } catch (error) {
      console.error("Error al desarchivar conversación:", error);
      return res.status(500).json({ error: "Error interno al desarchivar conversación" });
    }
  },
);

/**
 * @swagger
 * /api/likes:
 *   get:
 *     summary: Obtener historial de likes del adoptante
 *     tags: [Swipe]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de likes con estado
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   pet_id:
 *                     type: string
 *                   status:
 *                     type: string
 *                   created_at:
 *                     type: string
 *                   pet_name:
 *                     type: string
 *                   pet_image:
 *                     type: string
 *       401:
 *         description: No autorizado
 */
app.get("/api/likes", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "adopter") {
      return res
        .status(403)
        .json({ error: "Solo los adoptantes pueden ver sus likes" });
    }

    const adopter = await prisma.adopters.findFirst({
      where: { user_id: req.user.sub },
      orderBy: { created_at: "desc" },
    });

    if (!adopter) {
      return res.status(404).json({ error: "Adoptante no encontrado" });
    }

    const likes = await prisma.matches.findMany({
      where: {
        adopter_id: adopter.id,
        interaction_type: { not: "disliked" },
      },
      include: {
        pets: {
          select: {
            id: true,
            name: true,
            image_url: true,
            species: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    const result = likes.map((like) => {
      let status = "pending";
      if (like.interaction_type === "accepted") status = "approved";
      if (like.interaction_type === "rejected") status = "rejected";
      if (like.interaction_type === "disliked") status = "disliked";

      return {
        id: like.id,
        pet_id: like.pet_id,
        status,
        created_at: like.created_at,
        pet_name: like.pets?.name ?? null,
        pet_image:
          parsePhotoUrlsFromImageField(like.pets?.image_url)[0] ?? null,
        pet_species: like.pets?.species ?? null,
      };
    });

    res.json(result);
  } catch (error) {
    console.error("Error al obtener likes:", error);
    res.status(500).json({ error: "Error al obtener likes" });
  }
});

/**
 * @swagger
 * /api/pets-available:
 *   get:
 *     summary: Obtener mascotas disponibles para adopción (swipe)
 *     tags: [Pets]
 *     responses:
 *       200:
 *         description: Lista de mascotas disponibles
 */
app.get("/api/pets-available", async (req, res) => {
  try {
    let whereClause = { status: "disponible" };
    let adopterPref = null; // looking_for_species del adoptante

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try {
        const payload = jwt.verify(token, JWT_SECRET);

        if (payload.role === "adopter") {
          const adopter = await prisma.adopters.findFirst({
            where: { user_id: payload.sub },
          });

          if (adopter) {
            adopterPref = adopter.looking_for_species?.length ? adopter.looking_for_species : null;
            whereClause = {
              status: "disponible",
              NOT: {
                matches: {
                  some: {
                    adopter_id: adopter.id,
                  },
                },
              },
            };
          }
        }
      } catch {
        // If token is invalid on a public endpoint, keep default available-pets feed.
      }
    }

    let userLat = null;
    let userLng = null;
    const rawLat = req.query.lat;
    const rawLng = req.query.lng;

    if (rawLat != null && rawLng != null) {
      const parsedLat = parseFloat(rawLat);
      const parsedLng = parseFloat(rawLng);
      if (
        !isNaN(parsedLat) && !isNaN(parsedLng) &&
        parsedLat >= -90 && parsedLat <= 90 &&
        parsedLng >= -180 && parsedLng <= 180
      ) {
        userLat = parsedLat;
        userLng = parsedLng;
      }
    }

    const hasLocation = userLat !== null && userLng !== null;

    const pets = await prisma.pets.findMany({
      where: whereClause,
      include: {
        shelters: {
          select: { id: true, name: true, latitude: true, longitude: true, location: true, avatar_url: true, phone: true, user_id: true },
        },
        medical_records: {
          orderBy: { created_at: 'desc' },
          take: 1,
        },
      },
    });

    // Batch-fetch vet_clinics for source avatar lookup (vets create a shelters record without avatar_url)
    const shelterUserIds = pets.map(p => p.shelters?.user_id).filter(Boolean);
    let vetClinicAvatarMap = {};
    if (shelterUserIds.length > 0) {
      const vetClinics = await prisma.vet_clinics.findMany({
        where: { user_id: { in: [...new Set(shelterUserIds)] } },
        select: { user_id: true, description: true, website: true, instagram: true, facebook: true, avatar_url: true },
      });
      for (const vc of vetClinics) {
        vetClinicAvatarMap[vc.user_id] = vc.avatar_url;
      }
    }

    // Helper to parse vaccines field (can be JSON array string, comma-separated, or null)
    const parseVaccines = (raw) => {
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.filter(v => typeof v === 'string' && v.trim());
      } catch {
        // not JSON — try comma-separated
      }
      if (typeof raw === 'string') {
        return raw.split(',').map(v => v.trim()).filter(Boolean);
      }
      return null;
    };

    let result = pets.map((pet) => {
      const raw = (pet.species || "").toLowerCase().trim();
      // originalSpecies preserves the exact value stored in DB (for display when not a known canonical)
      const originalSpecies = (pet.species || "").trim();
      let species = originalSpecies || "other"; // fallback: keep original name, not collapse to "other"
      if (raw === "dog" || raw.includes("perro") || raw.includes("can"))
        species = "dog";
      else if (raw === "cat" || raw.includes("gato") || raw.includes("felino"))
        species = "cat";
      else if (
        raw === "bird" ||
        raw.includes("pájaro") ||
        raw.includes("pajaro") ||
        raw.includes("ave")
      )
        species = "bird";
      else if (raw === "rabbit" || raw.includes("conejo")) species = "rabbit";
      else if (
        raw === "reptile" ||
        raw.includes("reptil") ||
        raw.includes("serpiente") ||
        raw.includes("snake") ||
        raw.includes("tortuga") ||
        raw.includes("lagarto")
      )
        species = "reptile";

      let distanceKm = null;
      if (hasLocation && pet.shelters && pet.shelters.latitude != null && pet.shelters.longitude != null) {
        distanceKm = Math.round(
          haversineDistance(userLat, userLng, pet.shelters.latitude, pet.shelters.longitude) * 100
        ) / 100;
      }

      return {
        photos: (() => {
          const parsed = parsePhotoUrlsFromImageField(pet.image_url);
          return parsed.length > 0
            ? parsed
            : ["https://placedog.net/400/400?random"];
        })(),
        id: pet.id,
        name: pet.name,
        species,
        breed: pet.breed || null,
        age: pet.birth_date
          ? Math.floor(
              (new Date() - new Date(pet.birth_date)) /
                (365.25 * 24 * 60 * 60 * 1000),
            )
          : 1,
        description: pet.description || `${pet.name} es un/a ${pet.species} muy especial.`,
        source: {
          type: "shelter",
          id: pet.shelters?.id || "",
          name: pet.shelters?.name || "Veterinaria",
          location: pet.shelters?.location || null,
          phone: pet.shelters?.phone || null,
          avatar_url: pet.shelters?.avatar_url || vetClinicAvatarMap[pet.shelters?.user_id] || null,
        },
        distance_km: distanceKm,
        medical: pet.medical_records?.[0] ? {
          vaccines: parseVaccines(pet.medical_records[0].vaccines),
          notes: pet.medical_records[0].notes || null,
        } : null,
      };
    });

    // Filter by adopter species preference
    if (adopterPref && !adopterPref.includes('any')) {
      result = result.filter(p => adopterPref.includes(p.species));
    }

    if (hasLocation) {
      result.sort((a, b) => {
        if (a.distance_km === null && b.distance_km === null) return 0;
        if (a.distance_km === null) return 1;
        if (b.distance_km === null) return -1;
        return a.distance_km - b.distance_km;
      });
    }

    res.json({ pets: result });
  } catch (error) {
    console.error("Error al obtener mascotas disponibles:", error);
    res
      .status(500)
      .json({ error: "Error al obtener mascotas: " + error.message });
  }
});

/**
 * @swagger
 * /api/pets/{id}:
 *   get:
 *     summary: Obtener detalle de una mascota
 *     tags: [Pets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detalle de la mascota
 *       404:
 *         description: Mascota no encontrada
 */
app.get("/api/pets/:id", authenticateToken, async (req, res) => {
  try {
    const pet = await prisma.pets.findUnique({
      where: { id: req.params.id }, include: { shelters: { include: { users: true } }, shelter_employees: true, medical_records: { orderBy: { created_at: 'desc' } } }
    });

    if (!pet) {
      return res.status(404).json({ error: "Mascota no encontrada" });
    }

    res.json(pet);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener la mascota" });
  }
});

// --- SHELTER EMPLOYEES ---

// GET /api/employees - empleados del shelter
/**
 * @swagger
 * /api/employees:
 *   get:
 *     summary: Obtener empleados del refugio
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de empleados
 *       403:
 *         description: Solo los refugios pueden acceder
 */
app.get("/api/employees", authenticateToken, async (req, res) => {
  try {
    if (!isProfessionalRole(req.user.role)) {
      return res
        .status(403)
        .json({ error: "Solo refugios y veterinarias pueden gestionar empleados" });
    }

    const shelter = await getProfessionalShelterProfile(req.user);

    if (!shelter) {
      return res.status(404).json({ error: "Perfil profesional no encontrado" });
    }

    const employees = await prisma.shelter_employees.findMany({
      where: { shelter_id: shelter.id },
    });

    res.json(employees);
  } catch (error) {
    console.error("Error al obtener empleados:", error);
    res.status(500).json({ error: "Error al obtener los empleados" });
  }
});

// POST /api/employees - crear empleado
app.post("/api/employees", authenticateToken, async (req, res) => {
  try {
    if (!isProfessionalRole(req.user.role)) {
      return res
        .status(403)
        .json({ error: "Solo refugios y veterinarias pueden gestionar empleados" });
    }

    const { name, email, phone, birth_date, role } = req.body;

    if (!name) {
      return res.status(400).json({ error: "El nombre es requerido" });
    }

    const shelter = await getProfessionalShelterProfile(req.user);

    if (!shelter) {
      return res.status(404).json({ error: "Perfil profesional no encontrado" });
    }

    const employee = await prisma.shelter_employees.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        role: role || null,
        birth_date: birth_date ? new Date(birth_date) : null,
        shelter_id: shelter.id,
      },
    });

    res.status(201).json(employee);
  } catch (error) {
    console.error("Error al crear empleado:", error);
    res.status(500).json({ error: "Error al crear empleado" });
  }
});

// DELETE /api/employees/:id - eliminar empleado
app.delete("/api/employees/:id", authenticateToken, async (req, res) => {
  try {
    if (!isProfessionalRole(req.user.role)) {
      return res
        .status(403)
        .json({ error: "Solo refugios y veterinarias pueden gestionar empleados" });
    }

    await prisma.shelter_employees.delete({
      where: { id: req.params.id }
    });

    res.json({ message: "Empleado eliminado" });
  } catch (error) {
    console.error("Error al eliminar empleado:", error);
    res.status(500).json({ error: "Error al eliminar empleado" });
  }
});

// --- MATCHES ---

// GET /api/matches - solicitudes (likes) para mascotas del refugio autenticado
/**
 * @swagger
 * /api/matches:
 *   get:
 *     summary: Obtener solicitudes de adopción
 *     tags: [Matches]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de solicitudes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Match'
 *       403:
 *         description: Solo los refugios pueden acceder
 */
app.get("/api/matches", authenticateToken, async (req, res) => {
  try {
    if (!isProfessionalRole(req.user.role)) {
      return res
        .status(403)
        .json({ error: "Solo refugios y veterinarias pueden gestionar solicitudes" });
    }

    const shelter = await getProfessionalShelterProfile(req.user);

    if (!shelter) {
      return res.status(404).json({ error: "Perfil profesional no encontrado" });
    }

    const matches = await prisma.matches.findMany({
      where: {
        pets: {
          shelter_id: shelter.id,
        },
      },
      include: {
        pets: {
          select: { id: true, name: true },
        },
        adopters: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            phone: true,
            avatar_url: true,
            photos: true,
            description: true,
            housing_type: true,
            has_other_pets: true,
            other_pets_desc: true,
            pet_experience: true,
            has_children: true,
            kids_count: true,
            kids_ages: true,
            hours_at_home: true,
            work_from_home: true,
            hobbies: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    const payload = matches.map((match) => {
      const rawType = String(match.interaction_type || "").toLowerCase();
      const status =
        rawType === "accepted" || rawType === "aceptado"
          ? "accepted"
          : rawType === "rejected" || rawType === "rechazado"
            ? "rejected"
            : "pending";

      return {
        id: match.id,
        pet_id: match.pet_id,
        adopter_id: match.adopter_id,
        status,
        created_at: match.created_at,
        pet_name: match.pets?.name ?? null,
        user_name: match.adopters?.name ?? null,
        adopter: match.adopters
          ? {
              id: match.adopters.id,
              name: match.adopters.name,
              username: match.adopters.username,
              email: match.adopters.email,
              phone: match.adopters.phone,
              avatar_url: match.adopters.avatar_url,
              photos: match.adopters.photos,
              description: match.adopters.description,
              housing_type: match.adopters.housing_type,
              has_other_pets: match.adopters.has_other_pets,
              other_pets_desc: match.adopters.other_pets_desc,
              pet_experience: match.adopters.pet_experience,
              has_children: match.adopters.has_children,
              kids_count: match.adopters.kids_count,
              kids_ages: match.adopters.kids_ages,
              hours_at_home: match.adopters.hours_at_home,
              work_from_home: match.adopters.work_from_home,
              hobbies: match.adopters.hobbies,
            }
          : null,
      };
    });

    res.json(payload);
  } catch (error) {
    console.error("Error al obtener solicitudes:", error);
    res.status(500).json({ error: "Error al obtener las solicitudes" });
  }
});

// PATCH /api/matches/:id - aceptar/rechazar solicitud
/**
 * @swagger
 * /api/matches/{id}:
 *   patch:
 *     summary: Aceptar o rechazar una solicitud
 *     tags: [Matches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [accepted, rejected]
 *     responses:
 *       200:
 *         description: Solicitud actualizada
 *       400:
 *         description: Estado inválido
 */
app.patch("/api/matches/:id", authenticateToken, async (req, res) => {
  try {
    if (!isProfessionalRole(req.user.role)) {
      return res
        .status(403)
        .json({ error: "Solo refugios y veterinarias pueden gestionar solicitudes" });
    }

    const { status } = req.body;
    if (status !== "accepted" && status !== "rejected") {
      return res
        .status(400)
        .json({ error: "Estado no válido. Usa accepted o rejected." });
    }

    const shelter = await getProfessionalShelterProfile(req.user);

    if (!shelter) {
      return res.status(404).json({ error: "Perfil profesional no encontrado" });
    }

    const currentMatch = await prisma.matches.findUnique({
      where: { id: req.params.id },
      include: {
        pets: {
          select: { shelter_id: true, id: true, name: true },
        },
        adopters: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar_url: true,
            photos: true,
            description: true,
            housing_type: true,
            has_other_pets: true,
            other_pets_desc: true,
            pet_experience: true,
            has_children: true,
            hours_at_home: true,
            work_from_home: true,
            hobbies: true,
          },
        },
      },
    });

    if (!currentMatch) {
      return res
        .status(404)
        .json({ error: "Solicitud no encontrada" });
    }

    // Check ownership: shelter_id on the pet can be a shelter OR a vet_clinic UUID
    let isOwner = currentMatch.pets?.shelter_id === shelter.id;

    // For vets: the auto-created shelter record (from getProfessionalShelterProfile)
    // has a DIFFERENT UUID than the vet_clinic. Match against vet_clinics.id too.
    if (!isOwner && req.user.role === "vet") {
      const vetClinic = await prisma.vet_clinics.findFirst({
        where: { user_id: req.user.sub },
        select: { id: true },
      });
      if (vetClinic) {
        isOwner = currentMatch.pets?.shelter_id === vetClinic.id;
      }
    }

    if (!isOwner) {
      return res
        .status(404)
        .json({ error: "Solicitud no encontrada o sin permisos" });
    }

    const updated = await prisma.matches.update({
      where: { id: req.params.id },
      data: {
        interaction_type: status,
      },
      include: {
        pets: {
          select: { id: true, name: true },
        },
        adopters: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar_url: true,
            photos: true,
            description: true,
            housing_type: true,
            has_other_pets: true,
            other_pets_desc: true,
            pet_experience: true,
            has_children: true,
            hours_at_home: true,
            work_from_home: true,
            hobbies: true,
          },
        },
      },
    });

    // ── Notificar al adoptante por socket ─────────────────────────
    try {
      const adopterWithUser = await prisma.adopters.findUnique({
        where: { id: currentMatch.adopter_id },
        include: { users: true },
      });

      if (adopterWithUser?.users?.id) {
        const adopterUserId = adopterWithUser.users.id;

        if (status === "accepted") {
          global.io.to(`user:${adopterUserId}`).emit("match_approved", {
            matchId: currentMatch.id,
            petName: currentMatch.pets?.name || null,
          });
          void sendPushNotification(
            adopterUserId,
            "¡Nuevo Match! 🎉",
            `${currentMatch.pets?.name || "Una mascota"} aceptó tu solicitud de adopción`,
            { type: "match_approved", matchId: currentMatch.id, petName: currentMatch.pets?.name }
          );
        } else if (status === "rejected") {
          global.io.to(`user:${adopterUserId}`).emit("like_rejected", {
            petId: currentMatch.pet_id,
            petName: currentMatch.pets?.name || null,
          });
          void sendPushNotification(
            adopterUserId,
            "Solicitud no aceptada",
            `Tu solicitud para ${currentMatch.pets?.name || "una mascota"} no fue aceptada`,
            { type: "like_rejected", petId: currentMatch.pet_id, petName: currentMatch.pets?.name }
          );
        }
      }
    } catch (notifyErr) {
      console.error("Error al notificar al adoptante:", notifyErr);
    }

    // Si se acepta, crear conversación automáticamente
    if (status === "accepted") {
      // Evitar duplicados: verificar si ya existe una conversación para este match
      const existingConv = await prisma.conversations.findFirst({
        where: { match_id: currentMatch.id }
      });

      if (!existingConv) {
        const conversationData = {
          id: randomUUID(),
          adopter_id: currentMatch.adopter_id,
          pet_id: currentMatch.pet_id,
          match_id: currentMatch.id,
        };

        // Vets: usar vet_clinic_id en vez de shelter_id
        if (req.user.role === "vet") {
          const vetClinic = await prisma.vet_clinics.findFirst({
            where: { user_id: req.user.sub },
            select: { id: true },
          });
          if (vetClinic) {
            conversationData.vet_clinic_id = vetClinic.id;
          } else {
            conversationData.shelter_id = shelter.id;
          }
        } else {
          conversationData.shelter_id = shelter.id;
        }

        await prisma.conversations.create({ data: conversationData });
      }
    }
      // El estado de la mascota NO se cambia automáticamente.
      // El usuario (refugio/vet) debe actualizarlo manualmente desde el panel de mascotas
      // o desde el menú de 3 puntos en el chat.

    res.json({
      id: updated.id,
      pet_id: updated.pet_id,
      adopter_id: updated.adopter_id,
      status,
      created_at: updated.created_at,
      pet_name: updated.pets?.name ?? null,
      user_name: updated.adopters?.name ?? null,
      adopter: updated.adopters
        ? {
            id: updated.adopters.id,
            name: updated.adopters.name,
            email: updated.adopters.email,
            phone: updated.adopters.phone,
            avatar_url: updated.adopters.avatar_url,
            photos: updated.adopters.photos,
            description: updated.adopters.description,
            housing_type: updated.adopters.housing_type,
            has_other_pets: updated.adopters.has_other_pets,
            other_pets_desc: updated.adopters.other_pets_desc,
            pet_experience: updated.adopters.pet_experience,
            has_children: updated.adopters.has_children,
            hours_at_home: updated.adopters.hours_at_home,
            work_from_home: updated.adopters.work_from_home,
            hobbies: updated.adopters.hobbies,
          }
        : null,
      conversation_created: status === "accepted",
    });
  } catch (error) {
    console.error("Error al actualizar solicitud:", error);
    res.status(500).json({ error: "Error al actualizar la solicitud" });
  }
});

// --- ADOPTER MATCHES ---

/**
 * @swagger
 * /api/adopter/matches:
 *   get:
 *     summary: Obtener matches aprobados del adoptante
 *     tags: [Matches]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de matches aprobados
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: ID del match
 *                   pet_id:
 *                     type: string
 *                     description: ID de la mascota
 *                   pet_name:
 *                     type: string
 *                     description: Nombre de la mascota
 *                   pet_image:
 *                     type: string
 *                     description: URL de la imagen de la mascota
 *                   shelter_id:
 *                     type: string
 *                     description: ID del refugio
 *                   shelter_name:
 *                     type: string
 *                     description: Nombre del refugio
 *                   shelter_phone:
 *                     type: string
 *                     description: Teléfono del refugio
 *                   shelter_location:
 *                     type: string
 *                     description: Ubicación del refugio
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                     description: Fecha de creación del match
 */
app.get("/api/adopter/matches", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "adopter") {
      return res
        .status(403)
        .json({ error: "Solo los adoptantes pueden ver sus matches" });
    }

    const adopter = await prisma.adopters.findFirst({
      where: { user_id: req.user.sub },
      orderBy: { created_at: "desc" },
    });

    if (!adopter) {
      return res.status(404).json({ error: "Adoptante no encontrado" });
    }

    // Obtener matches aprobados (interaction_type = 'accepted')
    const matches = await prisma.matches.findMany({
      where: {
        adopter_id: adopter.id,
        interaction_type: "accepted",
      },
      include: {
        pets: {
          include: {
            shelters: {
              select: {
                id: true,
                name: true,
                phone: true,
                location: true,
              },
            },
            shelter_employees: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    const payload = matches.map((match) => {
      // Determinar el contacto (refugio o empleado)
      const contact = match.pets?.shelter_employees
        ? {
            type: "employee",
            id: match.pets.shelter_employees.id,
            name: match.pets.shelter_employees.name,
            phone: match.pets.shelter_employees.phone,
          }
        : {
            type: "shelter",
            id: match.pets?.shelters?.id ?? null,
            name: match.pets?.shelters?.name ?? null,
            phone: match.pets?.shelters?.phone ?? null,
            location: match.pets?.shelters?.location ?? null,
          };

      return {
        id: match.id,
        pet_id: match.pet_id,
        pet_name: match.pets?.name ?? null,
        pet_image:
          parsePhotoUrlsFromImageField(match.pets?.image_url)[0] ?? null,
        contact,
        shelter_id: match.pets?.shelters?.id ?? null,  // for reviews
        created_at: match.created_at,
      };
    });

    res.json(payload);
  } catch (error) {
    console.error("Error al obtener matches del adoptante:", error);
    res.status(500).json({ error: "Error al obtener los matches" });
  }
});

// --- CHAT ENDPOINTS ---

/**
 * @swagger
 * /api/conversations:
 *   get:
 *     summary: Obtener conversaciones del usuario
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 */
app.get("/api/conversations", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.sub;
    const { role } = req.user;
    let conversations = [];

    // Parse ?archived query param
    const archivedFilter =
      req.query.archived === "true"
        ? true
        : req.query.archived === "false"
          ? false
          : undefined;

    if (role === "adopter") {
      const adopter = await prisma.adopters.findFirst({
        where: { user_id: userId },
      });
      if (!adopter)
        return res.status(404).json({ error: "Adoptante no encontrado" });

      conversations = await prisma.conversations.findMany({
        where: {
          adopter_id: adopter.id,
          ...(archivedFilter !== undefined ? { archived: archivedFilter } : {}),
        },
        include: {
          shelter: {
            select: { id: true, name: true, phone: true, email: true, location: true, avatar_url: true },
          },
          vet_clinic: {
            select: { id: true, name: true, phone: true, email: true, location: true, description: true, website: true, instagram: true, facebook: true, avatar_url: true },
          },
          pet: { select: { id: true, name: true, image_url: true, status: true } },
          messages: {
            orderBy: { created_at: "desc" },
            take: 1,
          },
        },
        orderBy: { last_message_at: "desc" },
      });
    } else if (isProfessionalRole(role)) {
      const shelter = await getProfessionalShelterProfile(req.user);
      if (!shelter)
        return res.status(404).json({ error: "Perfil profesional no encontrado" });

      const conversationWhere = { ...(archivedFilter !== undefined ? { archived: archivedFilter } : {}) };

      // Vets: conversations are stored with vet_clinic_id, not shelter_id
      if (role === "vet") {
        const vetClinic = await prisma.vet_clinics.findFirst({
          where: { user_id: userId },
          select: { id: true },
        });
        if (vetClinic) {
          conversationWhere.vet_clinic_id = vetClinic.id;
        } else {
          conversationWhere.shelter_id = shelter.id;
        }
      } else {
        conversationWhere.shelter_id = shelter.id;
      }

      conversations = await prisma.conversations.findMany({
        where: conversationWhere,
        include: {
          adopter: {
            select: { id: true, name: true, email: true, avatar_url: true, photos: true },
          },
          pet: { select: { id: true, name: true, image_url: true, status: true } },
          messages: {
            orderBy: { created_at: "desc" },
            take: 1,
          },
        },
        orderBy: { last_message_at: "desc" },
      });
    }

    // Filtrar conversaciones duplicadas (por adopter_id y pet_id) conservando la más reciente
    const uniqueConversations = [];
    const seenChats = new Set();
    for (const conv of conversations) {
      // Usamos el adopter_id y pet_id como clave única. Si no hay pet_id, usamos el id de la conversación.
      const key = conv.pet_id && conv.adopter_id ? `${conv.adopter_id}-${conv.pet_id}` : conv.id;
      if (!seenChats.has(key)) {
        seenChats.add(key);
        uniqueConversations.push(conv);
      }
    }

    const payload = uniqueConversations.map((conv) => ({
      id: conv.id,
      match_id: conv.match_id,
      pet_id: conv.pet_id,
      pet_name: conv.pet?.name ?? null,
      pet_image: parsePhotoUrlsFromImageField(conv.pet?.image_url)[0] ?? null,
      pet_status: conv.pet?.status ?? null,
      archived: conv.archived,
      other_party: conv.vet_clinic
        ? {
            type: "vet",
            id: conv.vet_clinic.id,
            name: conv.vet_clinic.name,
            phone: conv.vet_clinic.phone,
            email: conv.vet_clinic.email,
            location: conv.vet_clinic.location,
            description: conv.vet_clinic.description,
            website: conv.vet_clinic.website,
            instagram: conv.vet_clinic.instagram,
            facebook: conv.vet_clinic.facebook,
            avatar: conv.vet_clinic.avatar_url ?? null,
          }
        : conv.shelter
          ? {
              type: "shelter",
              id: conv.shelter.id,
              name: conv.shelter.name,
              phone: conv.shelter.phone,
              email: conv.shelter.email,
              location: conv.shelter.location,
              avatar: conv.shelter.avatar_url ?? null,
            }
          : {
              type: "adopter",
              id: conv.adopter?.id,
              name: conv.adopter?.name,
              avatar:
                conv.adopter?.photos && conv.adopter.photos.length > 0
                  ? conv.adopter.photos[0]
                  : (conv.adopter?.avatar_url ?? null),
              avatar_url:
                conv.adopter?.photos && conv.adopter.photos.length > 0
                  ? conv.adopter.photos[0]
                  : (conv.adopter?.avatar_url ?? null),
              photos: conv.adopter?.photos ?? [],
            },
      last_message: conv.messages[0]
        ? {
            content: conv.messages[0].content,
            created_at: conv.messages[0].created_at,
            sender_role: conv.messages[0].sender_role,
          }
        : null,
      last_message_at: conv.last_message_at,
    }));

    res.json(payload);
  } catch (error) {
    console.error("Error al obtener conversaciones:", error);
    res.status(500).json({ error: "Error al obtener conversaciones" });
  }
});

/**
 * @swagger
 * /api/conversations/{id}/messages:
 *   get:
 *     summary: Obtener mensajes de una conversación
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 */
app.get(
  "/api/conversations/:id/messages",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.sub;
      const role = req.user?.role;

      // Verificar acceso a la conversación
      const conversation = await prisma.conversations.findUnique({
        where: { id },
        include: {
          adopter: { include: { users: true } },
          shelter: true,
          vet_clinic: true,
        },
      });

      if (!conversation)
        return res.status(404).json({ error: "Conversación no encontrada" });

      // Verificar permisos
      let hasAccess = false;
      if (role === "adopter" && conversation.adopter?.users?.id === userId)
        hasAccess = true;
      if (role === "shelter" && conversation.shelter?.user_id === userId)
        hasAccess = true;
      if (
        role === "vet" &&
        (conversation.vet_clinic?.user_id === userId ||
          conversation.shelter?.user_id === userId)
      )
        hasAccess = true;

      if (!hasAccess)
        return res
          .status(403)
          .json({ error: "No tienes acceso a esta conversación" });

      const messages = await prisma.messages.findMany({
        where: { conversation_id: id },
        orderBy: { created_at: "asc" },
      });

      // If conversation exists and user is authorized, an empty chat should return [] with 200.
      res.status(200).json(messages ?? []);
    } catch (error) {
      console.error("Error al obtener mensajes:", error);
      res.status(500).json({ error: "Error al obtener mensajes" });
    }
  },
);

/**
 * @swagger
 * /api/conversations/{id}/messages:
 *   post:
 *     summary: Enviar un mensaje
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 */
app.post(
  "/api/conversations/:id/messages",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { content } = req.body;
      const userId = req.user?.sub;
      const role = req.user?.role;

      if (!content || !content.trim()) {
        return res
          .status(400)
          .json({ error: "El mensaje no puede estar vacío" });
      }

      // Verificar acceso a la conversación
      const conversation = await prisma.conversations.findUnique({
        where: { id },
        include: {
          adopter: { include: { users: true } },
          shelter: true,
          vet_clinic: true,
        },
      });

      if (!conversation)
        return res.status(404).json({ error: "Conversación no encontrada" });

      // Determinar sender_id según el rol
      let senderId = null;
      let hasAccess = false;

      if (role === "adopter") {
        if (conversation.adopter?.users?.id === userId) {
          senderId = conversation.adopter.id;
          hasAccess = true;
        }
      } else if (role === "shelter") {
        if (conversation.shelter?.user_id === userId) {
          const employee = await prisma.shelter_employees.findFirst({
            where: { shelter_id: conversation.shelter.id },
          });
          senderId = employee?.id ?? conversation.shelter.id;
          hasAccess = true;
        }
      } else if (role === "vet") {
        if (conversation.vet_clinic?.user_id === userId) {
          const vetEmployee = await prisma.vet_employees.findFirst({
            where: { vet_clinic_id: conversation.vet_clinic.id },
          });
          senderId = vetEmployee?.id ?? conversation.vet_clinic.id;
          hasAccess = true;
        } else if (conversation.shelter?.user_id === userId) {
          const employee = await prisma.shelter_employees.findFirst({
            where: { shelter_id: conversation.shelter.id },
          });
          senderId = employee?.id ?? conversation.shelter.id;
          hasAccess = true;
        }
      }

      if (!hasAccess)
        return res
          .status(403)
          .json({ error: "No tienes acceso a esta conversación" });

      // Crear mensaje
      const message = await prisma.messages.create({
        data: {
          id: randomUUID(),
          conversation_id: id,
          sender_id: senderId,
          sender_role: role,
          content: content.trim(),
        },
      });

      // Actualizar last_message_at de la conversación
      await prisma.conversations.update({
        where: { id },
        data: { last_message_at: new Date() },
      });

      // Emitir por WebSocket (lo hago después de configurar socket.io)
      if (global.io) {
        global.io.to(`conversation:${id}`).emit("new_message", message);
        global.io.to(`conversation:${id}`).emit("receive_message", message);
      }

      // Enviar push al otro participante si no está conectado
      try {
        let otherUserId = null;
        let senderName = "";

        if (role === "adopter") {
          otherUserId = conversation.shelter?.user_id || conversation.vet_clinic?.user_id;
          senderName = conversation.adopter?.name || "Adoptante";
        } else if (role === "shelter" || role === "vet") {
          otherUserId = conversation.adopter?.users?.id;
          senderName = role === "shelter"
            ? (conversation.shelter?.name || "Refugio")
            : (conversation.vet_clinic?.name || "Veterinaria");
        }

        if (otherUserId) {
          void sendPushNotification(
            otherUserId,
            senderName,
            content.trim(),
            { type: "chat", conversationId: id }
          );
        }
      } catch (pushErr) {
        console.error("Error sending push notification for message:", pushErr);
      }

      res.status(201).json(message);
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
      res.status(500).json({ error: "Error al enviar mensaje" });
    }
  },
);

/**
 * @swagger
 * /api/conversations:
 *   post:
 *     summary: Crear o obtener conversación existente
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 */
app.post("/api/conversations", authenticateToken, async (req, res) => {
  try {
    const { match_id, pet_id } = req.body;
    const userId = req.user.userId || req.user.sub;
    const { role } = req.user;

    if (role !== "adopter") {
      return res
        .status(403)
        .json({ error: "Solo los adoptantes pueden iniciar conversaciones" });
    }

    const adopter = await prisma.adopters.findFirst({
      where: { user_id: userId },
    });
    if (!adopter)
      return res.status(404).json({ error: "Adoptante no encontrado" });

    // Obtener info del match para saber el shelter
    let match = null;
    let shelterId = null;
    let vetClinicId = null;
    let targetPetId = pet_id;

    if (match_id) {
      match = await prisma.matches.findUnique({
        where: { id: match_id },
        include: { pets: { include: { shelters: { include: { users: true } }, shelter_employees: true, medical_records: { orderBy: { created_at: 'desc' } } } } },
      });
      if (match) {
        shelterId = match.pets?.shelter_id;
        targetPetId = match.pet_id;
      }
    } else if (pet_id) {
      const pet = await prisma.pets.findUnique({
        where: { id: pet_id },
        include: { shelters: { include: { users: true } }, shelter_employees: true, medical_records: { orderBy: { created_at: 'desc' } } },
      });
      shelterId = pet?.shelter_id;
    }

    if (!shelterId && !vetClinicId) {
      return res
        .status(400)
        .json({ error: "No se encontró el refugio o clínica" });
    }

    // Buscar conversación existente
    let conversation = await prisma.conversations.findFirst({
      where: {
        adopter_id: adopter.id,
        shelter_id: shelterId,
        pet_id: targetPetId,
      },
    });

    if (!conversation) {
      // Crear nueva conversación
      conversation = await prisma.conversations.create({
        data: {
          id: randomUUID(),
          adopter_id: adopter.id,
          shelter_id: shelterId,
          pet_id: targetPetId,
          match_id: match_id,
        },
      });
    }

    res.status(201).json(conversation);
  } catch (error) {
    console.error("Error al crear conversación:", error);
    res.status(500).json({ error: "Error al crear conversación" });
  }
});

// --- STATS ---

// GET /api/stats - resumen del dashboard del refugio autenticado
app.get("/api/stats", authenticateToken, async (req, res) => {
  try {
    if (!isProfessionalRole(req.user.role)) {
      return res
        .status(403)
        .json({ error: "Solo los refugios y veterinarias pueden ver estadísticas" });
    }

    const shelter = await getProfessionalShelterProfile(req.user);

    if (!shelter) {
      return res.status(404).json({ error: "Perfil profesional no encontrado" });
    }

    const [totalPets, totalLikesReceived, closedAdoptions] = await Promise.all([
      prisma.pets.count({
        where: { shelter_id: shelter.id },
      }),
      prisma.matches.count({
        where: {
          pets: {
            shelter_id: shelter.id,
          },
          interaction_type: {
            in: ['pending', 'accepted', 'like']
          }
        },
      }),
      prisma.pets.count({
        where: {
          shelter_id: shelter.id,
          status: "adoptado",
        },
      }),
    ]);

    res.json({
      totalPets,
      totalLikesReceived,
      closedAdoptions,
    });
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    res.status(500).json({ error: "Error al obtener estadísticas" });
  }
});

// --- AUTH ---
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Faltan campos requeridos
 *       401:
 *         description: Credenciales inválidas
 */
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email y contraseña requeridos" });
  }

  try {
    const user = await prisma.users.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    let name = "";
    let avatar = null;
    let description = null;
    let vetEmail = null;
    let vetLocation = null;
    let vetPhone = null;
    let vetWebsite = null;
    let vetInstagram = null;
    let vetFacebook = null;
    if (user.role === "adopter") {
      const profile = await prisma.adopters.findFirst({
        where: { user_id: user.id },
      });
      name = profile?.name || "";
      avatar = profile?.avatar_url || null;
      description = profile?.description || null;
    } else if (user.role === "shelter") {
      const profile = await prisma.shelters.findFirst({
        where: { user_id: user.id },
      });
      name = profile?.name || "";
    } else if (user.role === "vet") {
      const profile = await prisma.vet_clinics.findFirst({
        where: { user_id: user.id },
      });
      name = profile?.name || "";
      avatar = profile?.avatar_url || null;
      description = profile?.description || null;
      vetEmail = profile?.email || null;
      vetLocation = profile?.location || null;
      vetPhone = profile?.phone || null;
      vetWebsite = profile?.website || null;
      vetInstagram = profile?.instagram || null;
      vetFacebook = profile?.facebook || null;
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role, name },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    const response = { token, role: user.role, name, avatar, description };
    if (user.role === "vet") {
      response.email = vetEmail ?? null;
      response.location = vetLocation ?? null;
      response.phone = vetPhone ?? null;
      response.website = vetWebsite ?? null;
      response.instagram = vetInstagram ?? null;
      response.facebook = vetFacebook ?? null;
      response.avatar_url = avatar;
    }
    res.json(response);
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
});

// --- GET ADOPTER PROFILE ---
app.get("/api/adopter/profile", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "adopter") {
      return res
        .status(403)
        .json({ error: "Solo los adoptantes pueden ver su perfil" });
    }

    const adopter = await prisma.adopters.findFirst({
      where: { user_id: req.user.sub },
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        user_id: true,
        name: true,
        username: true,
        email: true,
        description: true,
        birth_date: true,
        avatar_url: true,
        photos: true,
        hobbies: true,
        phone: true,
        housing_type: true,
        has_other_pets: true,
        other_pets_desc: true,
        kids_count: true,
        kids_ages: true,
        pet_experience: true,
        has_children: true,
        hours_at_home: true,
        work_from_home: true,
        looking_for_species: true,
        latitude: true,
        longitude: true,
        preferred_size: true,
        created_at: true,
      },
    });

    if (!adopter) {
      return res
        .status(404)
        .json({ error: "Perfil de adoptante no encontrado" });
    }

    return res.json({
      ...adopter,
      photo: adopter.avatar_url ?? null,
    });
  } catch (error) {
    console.error("Error al obtener perfil de adoptante:", error);
    return res
      .status(500)
      .json({ error: "Error al obtener perfil de adoptante" });
  }
});

// --- ADOPTER PROFILE ---
app.patch("/api/adopter/profile", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "adopter") {
      return res
        .status(403)
        .json({ error: "Solo los adoptantes pueden editar su perfil" });
    }

    const {
      name,
      username,
      email,
      description,
      birth_date,
      avatar_url,
      photo,
      photos,
      phone,
      hobbies,
      housing_type,
      has_other_pets,
      other_pets_desc,
      kids_count,
      kids_ages,
      pet_experience,
      has_children,
      hours_at_home,
      work_from_home,
      looking_for_species,
      preferred_size,
      latitude,
      longitude,
    } = req.body;

    const adopter = await prisma.adopters.findFirst({
      where: { user_id: req.user.sub },
      orderBy: { created_at: "desc" },
    });

    if (!adopter) {
      return res.status(404).json({ error: "Adoptante no encontrado" });
    }

    const data = {};

    if (typeof name === "string" && name.trim()) {
      data.name = name.trim();
    }

    if (typeof description === "string") {
      data.description = description.trim() || null;
    }

    const finalAvatarUrl = avatar_url !== undefined ? avatar_url : photo;
    if (finalAvatarUrl === null || finalAvatarUrl === "") {
      data.avatar_url = null;
    } else if (typeof finalAvatarUrl === "string" && finalAvatarUrl.trim()) {
      data.avatar_url = finalAvatarUrl.trim();
    }

    // Photos array (max 5)
    if (Array.isArray(photos)) {
      data.photos = photos.slice(0, 5);
    }

    if (
      typeof housing_type === "string" &&
      ["house", "apartment"].includes(housing_type)
    ) {
      data.housing_type = housing_type;
    }

    if (typeof has_other_pets === "boolean") {
      data.has_other_pets = has_other_pets;
    }

    if (Array.isArray(other_pets_desc)) {
      data.other_pets_desc = other_pets_desc
        .map((pet) => String(pet).trim())
        .filter(Boolean);
    } else if (typeof other_pets_desc === "string") {
      data.other_pets_desc = other_pets_desc.trim()
        ? [other_pets_desc.trim()]
        : [];
    } else if (other_pets_desc === null) {
      data.other_pets_desc = [];
    }

    if (
      typeof pet_experience === "string" &&
      ["none", "some", "lots"].includes(pet_experience)
    ) {
      data.pet_experience = pet_experience;
    }

    if (typeof has_children === "boolean") {
      data.has_children = has_children;
    }

    if (Number.isInteger(kids_count) && kids_count >= 0) {
      data.kids_count = kids_count;
    } else if (kids_count === null) {
      data.kids_count = null;
    }

    if (Array.isArray(kids_ages)) {
      data.kids_ages = kids_ages
        .map((age) => Number(age))
        .filter((age) => Number.isInteger(age) && age >= 0);
    } else if (kids_ages === null) {
      data.kids_ages = [];
    }

    if (
      typeof hours_at_home === "string" &&
      ["less4", "4to8", "more8", "always"].includes(hours_at_home)
    ) {
      data.hours_at_home = hours_at_home;
    }

    if (typeof work_from_home === "boolean") {
      data.work_from_home = work_from_home;
    }

    // Email
    if (typeof email === "string") {
      const targetEmail = email.trim().toLowerCase();
      if (targetEmail && targetEmail !== req.user.email.toLowerCase()) {
        const existingUser = await prisma.users.findUnique({
          where: { email: targetEmail }
        });
        if (existingUser && existingUser.id !== req.user.sub) {
          return res.status(400).json({ error: 'El email ya está registrado por otro usuario' });
        }
        await prisma.users.update({
          where: { id: req.user.sub },
          data: { email: targetEmail }
        });
      }
      data.email = targetEmail || null;
    }

    // Phone
    if (typeof phone === "string") {
      data.phone = phone.trim() || null;
    }

    // Birth date
    if (
      typeof birth_date === "string" &&
      birth_date.trim() &&
      !isNaN(Date.parse(birth_date))
    ) {
      data.birth_date = new Date(birth_date);
    } else if (
      birth_date === null ||
      (typeof birth_date === "string" && !birth_date.trim())
    ) {
      data.birth_date = null;
    }

    // Looking for species (array of strings, max 10)
    if (Array.isArray(looking_for_species)) {
      const validSpecies = [
        "dog",
        "cat",
        "bird",
        "rabbit",
        "reptile",
        "other",
        "any",
      ];
      data.looking_for_species = looking_for_species
        .filter(
          (s) =>
            typeof s === "string" && validSpecies.includes(s.toLowerCase()),
        )
        .map((s) => s.toLowerCase())
        .slice(0, 10);
    } else if (looking_for_species === null) {
      data.looking_for_species = [];
    }

    // Preferred size
    const validSizes = ["small", "medium", "large", "any"];
    if (
      typeof preferred_size === "string" &&
      validSizes.includes(preferred_size.toLowerCase())
    ) {
      data.preferred_size = preferred_size.toLowerCase();
    } else if (preferred_size === null) {
      data.preferred_size = null;
    }

    // Location coordinates
    if (typeof latitude === 'number' && !isNaN(latitude)) {
      if (latitude < -90 || latitude > 90) {
        return res.status(400).json({ error: 'Latitud debe estar entre -90 y 90' });
      }
      data.latitude = latitude;
    }
    if (typeof longitude === 'number' && !isNaN(longitude)) {
      if (longitude < -180 || longitude > 180) {
        return res.status(400).json({ error: 'Longitud debe estar entre -180 y 180' });
      }
      data.longitude = longitude;
    }

    if (Array.isArray(hobbies)) {
      data.hobbies = hobbies;
    }

    if (typeof username === "string" && username.trim()) {
      data.username = username.trim();
    }

    const updated = await prisma.adopters.update({
      where: { id: adopter.id },
      data,
      select: {
        id: true,
        user_id: true,
        name: true,
        username: true,
        email: true,
        description: true,
        birth_date: true,
        avatar_url: true,
        photos: true,
        hobbies: true,
        phone: true,
        housing_type: true,
        has_other_pets: true,
        other_pets_desc: true,
        kids_count: true,
        kids_ages: true,
        pet_experience: true,
        has_children: true,
        hours_at_home: true,
        work_from_home: true,
        looking_for_species: true,
        preferred_size: true,
        latitude: true,
        longitude: true,
        created_at: true,
      },
    });

    return res.json({
      ...updated,
      photo: updated.avatar_url ?? null,
    });
  } catch (error) {
    console.error("Error al actualizar perfil de adoptante:", error);
    console.error("Error details:", error?.message, error?.code, error?.meta);
    return res
      .status(500)
      .json({ error: "Error al actualizar perfil de adoptante" });
  }
});

// --- PUSH TOKEN ---
/**
 * @swagger
 * /api/users/{userId}/push-token:
 *   patch:
 *     summary: Actualizar el token de notificaciones push
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               push_token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token actualizado
 *       403:
 *         description: No autorizado
 */
app.patch(
  "/api/users/:userId/push-token",
  authenticateToken,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { push_token } = req.body;

      if (req.user.sub !== userId) {
        return res
          .status(403)
          .json({ error: "No puedes actualizar el token de otro usuario" });
      }

      if (!push_token) {
        return res.status(400).json({ error: "push_token es requerido" });
      }

      const user = await prisma.users.update({
        where: { id: userId },
        data: { push_token },
      });

      res.json({ success: true, message: "Token actualizado" });
    } catch (error) {
      console.error("Error al actualizar push token:", error);
      res.status(500).json({ error: "Error al actualizar token" });
    }
  },
);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar nuevo usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           example:
 *             email: "test@example.com"
 *             password: "password123"
 *             name: "Juan Perez"
 *             role: "adopter"
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 userId:
 *                   type: string
 *       400:
 *         description: Datos inválidos o email ya registrado
 */
app.post("/api/auth/register", async (req, res) => {
  const { email, password, name, role } = req.body;

  if (!email || !password || !name || !role) {
    return res.status(400).json({ error: "Faltan datos requeridos" });
  }

  try {
    const existingUser = await prisma.users.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return res.status(400).json({ error: "El email ya está registrado" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.users.create({
      data: {
        id: randomUUID(),
        email: email.toLowerCase(),
        password_hash: passwordHash,
        role: role.toLowerCase(),
      },
    });

    switch (role.toLowerCase()) {
      case "adopter":
        await prisma.adopters.create({
          data: {
            id: randomUUID(),
            user_id: user.id,
            name: name,
            email: email.toLowerCase(),
          },
        });
        break;
      case "shelter":
        await prisma.shelters.create({
          data: {
            id: randomUUID(),
            user_id: user.id,
            name: name,
            email: email.toLowerCase(),
          },
        });
        break;
      case "vet":
        await prisma.vet_clinics.create({
          data: {
            id: randomUUID(),
            user_id: user.id,
            name: name,
            email: email.toLowerCase(),
          },
        });
        break;
      default:
        return res.status(400).json({ error: "Rol inválido" });
    }

    res
      .status(201)
      .json({ message: "Usuario creado correctamente", userId: user.id });
  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({ error: "Error al registrar usuario" });
  }
});

// --- GOOGLE AUTH ---
/**
 * POST /api/auth/google
 * Verifica el id_token de Google, hace upsert del usuario y devuelve nuestro JWT.
 */
app.post("/api/auth/google", async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ error: "idToken es requerido" });
  }

  try {
    // Verificar el id_token con Google
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      return res.status(401).json({ error: "Token de Google inválido" });
    }

    const { email, name: googleName, picture, sub: googleId } = payload;
    const normalizedEmail = email.toLowerCase();

    // Buscar o crear usuario
    let user = await prisma.users.findUnique({
      where: { email: normalizedEmail },
    });

    let profileName = googleName || "";
    let avatarUrl = picture || null;
    let description = null;
    let isNewUser = false;

    if (!user) {
      // Crear nuevo usuario Google (sin password_hash, usamos google_id si la columna existe)
      isNewUser = true;
      user = await prisma.users.create({
        data: {
          id: randomUUID(),
          email: normalizedEmail,
          password_hash: "", // sin contraseña para usuarios Google
          role: "adopter", // Google Sign-In siempre crea adoptantes
        },
      });

      // Crear perfil de adoptante
      await prisma.adopters.create({
        data: {
          id: randomUUID(),
          user_id: user.id,
          name: profileName,
          email: normalizedEmail,
          avatar_url: avatarUrl,
        },
      });
    } else {
      // Usuario existente: obtener nombre/avatar del perfil
      if (user.role === "adopter") {
        const profile = await prisma.adopters.findFirst({
          where: { user_id: user.id },
          orderBy: { created_at: "desc" },
        });
        profileName = profile?.name || googleName || "";
        avatarUrl = profile?.avatar_url || picture || null;
      } else if (user.role === "shelter") {
        const profile = await prisma.shelters.findFirst({
          where: { user_id: user.id },
          orderBy: { created_at: "desc" },
        });
        profileName = profile?.name || googleName || "";
      } else if (user.role === "vet") {
        const profile = await prisma.vet_clinics.findFirst({
          where: { user_id: user.id },
          orderBy: { created_at: "desc" },
        });
        profileName = profile?.name || googleName || "";
        avatarUrl = profile?.avatar_url || picture || null;
        description = profile?.description || null;
      }
    }

    // Generar nuestro JWT propio
    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role, name: profileName },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    const response = {
      token,
      role: user.role,
      name: profileName,
      avatar: avatarUrl,
      isNewUser,
    };
    if (user.role === "vet") {
      response.description = description ?? null;
      response.avatar_url = avatarUrl;
    }
    return res.json(response);
  } catch (error) {
    console.error("Error en Google Auth:", error);
    return res
      .status(401)
      .json({ error: "Error al verificar token de Google" });
  }
});

// ── Push Token ───────────────────────────────────────────────────
/**
 * @swagger
 * /api/users/push-token:
 *   patch:
 *     summary: Actualizar el push token del usuario
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pushToken:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Token actualizado
 */
app.patch("/api/users/push-token", authenticateToken, async (req, res) => {
  try {
    const { pushToken } = req.body;
    const userId = req.user.sub;

    await prisma.users.update({
      where: { id: userId },
      data: { push_token: pushToken || null },
    });

    console.log(`[PushToken] ${pushToken ? "Registered" : "Unregistered"} for user ${userId}`);
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating push token:", error);
    res.status(500).json({ error: "Error al actualizar push token" });
  }
});

// ── Mark Conversation as Read ────────────────────────────────────
/**
 * @swagger
 * /api/conversations/{id}/read:
 *   patch:
 *     summary: Marcar conversación como leída
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Conversación marcada como leída
 */
app.patch("/api/conversations/:id/read", authenticateToken, async (req, res) => {
  try {
    const conversationId = req.params.id;
    const userId = req.user.sub;

    // Verify access to the conversation
    const conversation = await prisma.conversations.findUnique({
      where: { id: conversationId },
      include: {
        adopter: { include: { users: true } },
        shelter: true,
        vet_clinic: true,
      },
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversación no encontrada" });
    }

    let hasAccess = false;
    if (req.user.role === "adopter" && conversation.adopter?.users?.id === userId) hasAccess = true;
    if (req.user.role === "shelter" && conversation.shelter?.user_id === userId) hasAccess = true;
    if (
      req.user.role === "vet" &&
      (conversation.vet_clinic?.user_id === userId ||
        conversation.shelter?.user_id === userId)
    ) hasAccess = true;

    if (!hasAccess) {
      return res.status(403).json({ error: "No tienes acceso a esta conversación" });
    }

    // Mark all unread messages as read
    await prisma.messages.updateMany({
      where: {
        conversation_id: conversationId,
        sender_role: { not: req.user.role },
        read: false,
      },
      data: { read: true },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error marking conversation as read:", error);
    res.status(500).json({ error: "Error al marcar conversación como leída" });
  }
});

// --- ARRANCAR SERVIDOR CON SOCKET.IO ---
const PORT = 3000;
const server = http.createServer(app);

// Configurar Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Guardar io globalmente para usar en los endpoints REST
global.io = io;

// Autenticación de WebSocket
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error("Token requerido"));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error("Token inválido"));
  }
});

// Manejo de conexiones WebSocket
io.on("connection", async (socket) => {
  console.log(`🔌 Usuario conectado: ${socket.user.sub} (${socket.user.role})`);

  // Unir al socket a su sala personal para notificaciones directas
  socket.join(`user:${socket.user.sub}`);

  const handleJoinConversation = async (conversationId) => {
    try {
      // Verificar acceso a la conversación
      const conversation = await prisma.conversations.findUnique({
        where: { id: conversationId },
        include: {
          adopter: { include: { users: true } },
          shelter: true,
          vet_clinic: true,
        },
      });

      if (!conversation) {
        socket.emit("error", { message: "Conversación no encontrada" });
        return;
      }

      // Verificar permisos
      let hasAccess = false;
      if (
        socket.user.role === "adopter" &&
        conversation.adopter?.users?.id === socket.user.sub
      )
        hasAccess = true;
      if (
        socket.user.role === "shelter" &&
        conversation.shelter?.user_id === socket.user.sub
      )
        hasAccess = true;
      if (
        socket.user.role === "vet" &&
        conversation.vet_clinic?.user_id === socket.user.sub
      )
        hasAccess = true;

      if (!hasAccess) {
        socket.emit("error", {
          message: "No tienes acceso a esta conversación",
        });
        return;
      }

      socket.join(`conversation:${conversationId}`);
      console.log(
        `📥 ${socket.user.sub} se unió a conversación ${conversationId}`,
      );
      socket.emit("joined_conversation", { conversationId });
    } catch (error) {
      console.error("Error al unirse a conversación:", error);
      socket.emit("error", { message: "Error al unirse a la conversación" });
    }
  };

  // Unirse a sala de conversación
  socket.on("join_conversation", handleJoinConversation);
  socket.on("join_room", handleJoinConversation);

  const handleLeaveConversation = (conversationId) => {
    socket.leave(`conversation:${conversationId}`);
    console.log(
      `📤 ${socket.user.sub} salió de conversación ${conversationId}`,
    );
  };

  // Salir de sala de conversación
  socket.on("leave_conversation", handleLeaveConversation);
  socket.on("leave_room", handleLeaveConversation);

  // Enviar mensaje (alternativa a REST)
  socket.on("send_message", async (data) => {
    try {
      const { conversation_id, content } = data;

      if (!content || !content.trim()) {
        socket.emit("error", { message: "El mensaje no puede estar vacío" });
        return;
      }

      // Verificar acceso y crear mensaje
      const conversation = await prisma.conversations.findUnique({
        where: { id: conversation_id },
        include: {
          adopter: { include: { users: true } },
          shelter: true,
          vet_clinic: true,
        },
      });

      if (!conversation) {
        socket.emit("error", { message: "Conversación no encontrada" });
        return;
      }

      let senderId = null;
      if (
        socket.user.role === "adopter" &&
        conversation.adopter?.users?.id === socket.user.sub
      ) {
        senderId = conversation.adopter.id;
      } else if (
        socket.user.role === "shelter" &&
        conversation.shelter?.user_id === socket.user.sub
      ) {
        const employee = await prisma.shelter_employees.findFirst({
          where: { shelter_id: conversation.shelter.id },
        });
        senderId = employee?.id ?? conversation.shelter.id;
      } else if (
        socket.user.role === "vet" &&
        conversation.vet_clinic?.user_id === socket.user.sub
      ) {
        const vetEmployee = await prisma.vet_employees.findFirst({
          where: { vet_clinic_id: conversation.vet_clinic.id },
        });
        senderId = vetEmployee?.id ?? conversation.vet_clinic.id;
      }

      if (!senderId) {
        socket.emit("error", { message: "No tienes acceso" });
        return;
      }

      const message = await prisma.messages.create({
        data: {
          id: randomUUID(),
          conversation_id,
          sender_id: senderId,
          sender_role: socket.user.role,
          content: content.trim(),
        },
      });

      // Actualizar last_message_at
      await prisma.conversations.update({
        where: { id: conversation_id },
        data: { last_message_at: new Date() },
      });

      // Emitir a todos en la sala
      io.to(`conversation:${conversation_id}`).emit("new_message", message);
      io.to(`conversation:${conversation_id}`).emit("receive_message", message);

      // Enviar push al otro participante
      try {
        let otherUserId = null;
        let senderName = "";

        if (socket.user.role === "adopter") {
          otherUserId = conversation.shelter?.user_id || conversation.vet_clinic?.user_id;
          senderName = conversation.adopter?.name || "Adoptante";
        } else if (socket.user.role === "shelter" || socket.user.role === "vet") {
          otherUserId = conversation.adopter?.users?.id;
          senderName = socket.user.role === "shelter"
            ? (conversation.shelter?.name || "Refugio")
            : (conversation.vet_clinic?.name || "Veterinaria");
        }

        if (otherUserId) {
          void sendPushNotification(
            otherUserId,
            senderName,
            content.trim(),
            { type: "chat", conversationId: conversation_id }
          );
        }
      } catch (pushErr) {
        console.error("Error sending push via socket:", pushErr);
      }
    } catch (error) {
      console.error("Error al enviar mensaje por socket:", error);
      socket.emit("error", { message: "Error al enviar mensaje" });
    }
  });

  // Desconexión
  socket.on("disconnect", () => {
    console.log(`🔴 Usuario desconectado: ${socket.user.sub}`);
  });
});


app.put('/api/shelters/profile', authenticateToken, async (req, res) => {
  try {
    if (!isProfessionalRole(req.user.role)) return res.status(403).json({ error: 'Acceso denegado' });
    const { name, email, location, phone, description, website, avatar_url } = req.body;
    const shelter = await prisma.shelters.findFirst({ where: { user_id: req.user.sub } });
    if (!shelter) return res.status(404).json({ error: 'Refugio no encontrado' });
    
    // Check and update email in users table if changed
    if (email && email.trim().toLowerCase() !== req.user.email.toLowerCase()) {
      const targetEmail = email.trim().toLowerCase();
      const existingUser = await prisma.users.findUnique({
        where: { email: targetEmail }
      });
      if (existingUser && existingUser.id !== req.user.sub) {
        return res.status(400).json({ error: 'El email ya está registrado por otro usuario' });
      }
      await prisma.users.update({
        where: { id: req.user.sub },
        data: { email: targetEmail }
      });
    }

    const updated = await prisma.shelters.update({ 
      where: { id: shelter.id }, 
      data: { 
        name, 
        email: email ? email.trim().toLowerCase() : undefined, 
        location, 
        phone, 
        description, 
        website, 
        avatar_url 
      } 
    });
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Vet Profile Endpoints ────────────────────────────────────────

function serializeJsonField(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'string') return val;
  return JSON.stringify(val);
}

function parseJsonField(val) {
  if (!val) return null;
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return null; }
}

function mapVetClinicToFrontend(vc) {
  return {
    id: vc.id,
    name: vc.name,
    description: vc.description || null,
    avatar_url: vc.avatar_url || null,
    address: vc.address || vc.location || null,
    phone: vc.phone || null,
    email: vc.email || null,
    website: vc.website || null,
    hours: parseJsonField(vc.hours),
    services: parseJsonField(vc.services),
    certifications: parseJsonField(vc.certifications),
    photos: Array.isArray(vc.photos) ? vc.photos.map(url => ({ url, caption: '', isPrimary: false })) : null,
    social_links: parseJsonField(vc.social_links),
    location: vc.latitude != null && vc.longitude != null
      ? { latitude: vc.latitude, longitude: vc.longitude }
      : null,
    created_at: vc.created_at,
    updated_at: vc.updated_at,
  };
}

// GET /api/vet/profile — nuevo endpoint unificado
app.get('/api/vet/profile', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'vet') return res.status(403).json({ error: 'Acceso denegado' });
    const profile = await prisma.vet_clinics.findFirst({
      where: { user_id: req.user.sub },
    });
    if (!profile) return res.status(404).json({ error: 'Veterinaria no encontrada' });
    res.json(mapVetClinicToFrontend(profile));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/vet/profile — nuevo endpoint unificado con campos completos
app.patch('/api/vet/profile', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'vet') return res.status(403).json({ error: 'Acceso denegado' });
    const vetClinic = await prisma.vet_clinics.findFirst({ where: { user_id: req.user.sub } });
    if (!vetClinic) return res.status(404).json({ error: 'Veterinaria no encontrada' });

    const {
      name, email, address, phone, description, avatar_url,
      website, instagram, facebook,
      hours, services, certifications, photos, social_links,
      location,
    } = req.body;

    const data = {};
    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email;
    if (address !== undefined) data.address = address;
    if (phone !== undefined) data.phone = phone;
    if (description !== undefined) data.description = description;
    if (avatar_url !== undefined) data.avatar_url = avatar_url;
    if (website !== undefined) data.website = website;
    if (instagram !== undefined) data.instagram = instagram;
    if (facebook !== undefined) data.facebook = facebook;
    if (hours !== undefined) data.hours = serializeJsonField(hours);
    if (services !== undefined) data.services = serializeJsonField(services);
    if (certifications !== undefined) data.certifications = serializeJsonField(certifications);
    if (social_links !== undefined) data.social_links = serializeJsonField(social_links);
    if (photos !== undefined) {
      data.photos = Array.isArray(photos) ? photos.map(p => typeof p === 'string' ? p : (p.url || p)) : [];
    }
    if (location !== undefined) {
      data.latitude = location?.latitude ?? null;
      data.longitude = location?.longitude ?? null;
    }

    const updated = await prisma.vet_clinics.update({
      where: { id: vetClinic.id },
      data,
    });
    res.json(mapVetClinicToFrontend(updated));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/shelter/{id}/public — perfil público del refugio
app.get('/api/shelter/:id/public', async (req, res) => {
  try {
    const profile = await prisma.shelters.findUnique({
      where: { id: req.params.id },
    });
    if (!profile) return res.status(404).json({ error: 'Refugio no encontrado' });
    res.json(profile);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/vet/{id}/public — perfil público de la veterinaria
app.get('/api/vet/:id/public', async (req, res) => {
  try {
    const profile = await prisma.vet_clinics.findUnique({
      where: { id: req.params.id },
    });
    if (!profile) return res.status(404).json({ error: 'Veterinaria no encontrada' });
    res.json(mapVetClinicToFrontend(profile));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/shelters/profile', authenticateToken, async (req, res) => {
  try {
    if (!isProfessionalRole(req.user.role)) return res.status(403).json({ error: 'Acceso denegado' });
    const profile = await prisma.shelters.findFirst({
      where: { user_id: req.user.sub },
    });
    if (!profile) return res.status(404).json({ error: 'Refugio no encontrado' });
    res.json(profile);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Backward compatibility: keep old URLs
app.get('/api/vet-clinics/profile', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'vet') return res.status(403).json({ error: 'Acceso denegado' });
    const profile = await prisma.vet_clinics.findFirst({
      where: { user_id: req.user.sub },
    });
    if (!profile) return res.status(404).json({ error: 'Veterinaria no encontrada' });
    res.json(profile);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/vet-clinics/profile', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'vet') return res.status(403).json({ error: 'Acceso denegado' });
    const { name, email, location, phone, description, avatar_url, website, instagram, facebook, address, hours, services, certifications, photos, social_links } = req.body;
    const vetClinic = await prisma.vet_clinics.findFirst({ where: { user_id: req.user.sub } });
    if (!vetClinic) return res.status(404).json({ error: 'Veterinaria no encontrada' });

    // Check and update email in users table if changed
    if (email !== undefined && email !== null) {
      const targetEmail = email.trim().toLowerCase();
      if (targetEmail && targetEmail !== req.user.email.toLowerCase()) {
        const existingUser = await prisma.users.findUnique({
          where: { email: targetEmail }
        });
        if (existingUser && existingUser.id !== req.user.sub) {
          return res.status(400).json({ error: 'El email ya está registrado por otro usuario' });
        }
        await prisma.users.update({
          where: { id: req.user.sub },
          data: { email: targetEmail }
        });
      }
    }

    const data = {};
    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email ? email.trim().toLowerCase() : null;
    if (location !== undefined) data.location = location;
    if (address !== undefined) data.address = address;
    if (phone !== undefined) data.phone = phone;
    if (description !== undefined) data.description = description;
    if (avatar_url !== undefined) data.avatar_url = avatar_url;
    if (website !== undefined) data.website = website;
    if (instagram !== undefined) data.instagram = instagram;
    if (facebook !== undefined) data.facebook = facebook;
    if (hours !== undefined) data.hours = serializeJsonField(hours);
    if (services !== undefined) data.services = serializeJsonField(services);
    if (certifications !== undefined) data.certifications = serializeJsonField(certifications);
    if (social_links !== undefined) data.social_links = serializeJsonField(social_links);
    if (photos !== undefined) {
      data.photos = Array.isArray(photos) ? photos.map(p => typeof p === 'string' ? p : (p.url || p)) : [];
    }

    const updated = await prisma.vet_clinics.update({
      where: { id: vetClinic.id },
      data,
    });
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// REVIEWS — Sistema de valoraciones estilo Wallapop
// ─────────────────────────────────────────────────────────────────────────────

// Helper: enrich reviewer info (name + avatar) for a single review
async function enrichReviewer(review) {
  const r = review;
  let reviewerName = "Usuario";
  let reviewerAvatar = null;

  if (r.reviewer_role === "adopter") {
    const a = await prisma.adopters.findUnique({
      where: { id: r.reviewer_id },
      select: { name: true, username: true, avatar_url: true, photos: true },
    });
    reviewerName = a?.username || a?.name || "Adoptante";
    // Priority: adopters often store profile pics in photos array
    if (Array.isArray(a?.photos) && a.photos.length > 0) {
      reviewerAvatar = a.photos[0];
    } else if (a?.avatar_url) {
      reviewerAvatar = parsePhotoUrlsFromImageField(a.avatar_url)[0] || null;
    }
  } else if (r.reviewer_role === "vet") {
    // Vet reviewer → reviewer_id is a shelter record (created by getProfessionalShelterProfile)
    const s = await prisma.shelters.findUnique({
      where: { id: r.reviewer_id },
      select: { name: true, avatar_url: true, user_id: true },
    });
    reviewerName = s?.name || "Veterinaria";
    if (s?.avatar_url) {
      reviewerAvatar = parsePhotoUrlsFromImageField(s.avatar_url)[0] || null;
    }
    // Fallback: look up the actual vet_clinic via user_id for the real avatar
    if (!reviewerAvatar && s?.user_id) {
      const v = await prisma.vet_clinics.findFirst({
        where: { user_id: s.user_id },
        select: { avatar_url: true },
      });
      if (v?.avatar_url) {
        reviewerAvatar = parsePhotoUrlsFromImageField(v.avatar_url)[0] || null;
      }
    }
  } else {
    // Shelter reviewer (or unknown fallback)
    const s = await prisma.shelters.findUnique({
      where: { id: r.reviewer_id },
      select: { name: true, avatar_url: true },
    });
    reviewerName = s?.name || "Refugio";
    reviewerAvatar = s?.avatar_url
      ? (parsePhotoUrlsFromImageField(s.avatar_url)[0] || null)
      : null;
  }

  return { ...r, reviewer_name: reviewerName, reviewer_avatar: reviewerAvatar };
}

// GET /api/reviews/me/received  — must be BEFORE /:targetId to avoid conflict
app.get("/api/reviews/me/received", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.sub;
    const role   = req.user.role;
    let targetId;
    if (role === "adopter") {
      const adopter = await prisma.adopters.findFirst({ where: { user_id: userId } });
      if (!adopter) return res.status(404).json({ error: "Adoptante no encontrado." });
      targetId = adopter.id;
    } else {
      const shelter = await getProfessionalShelterProfile(req.user);
      if (!shelter) return res.status(404).json({ error: "Perfil no encontrado." });
      targetId = shelter.id;
    }
    const reviews = await prisma.reviews.findMany({ where: { target_id: targetId }, orderBy: { created_at: "desc" } });
    const enriched = await Promise.all(reviews.map(enrichReviewer));
    const total = reviews.length;
    const average = total > 0 ? Math.round((reviews.reduce((acc, r) => acc + r.rating, 0) / total) * 10) / 10 : null;
    res.json({ reviews: enriched, averageRating: average, totalCount: total });
  } catch (err) { console.error("[GET /api/reviews/me/received]", err); res.status(500).json({ error: "Error al obtener valoraciones recibidas." }); }
});

// GET /api/reviews/check/:matchId — must be BEFORE /:targetId
app.get("/api/reviews/check/:matchId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.sub, role = req.user.role, matchId = req.params.matchId;
    let reviewerId;
    if (role === "adopter") {
      const adopter = await prisma.adopters.findFirst({ where: { user_id: userId } });
      if (!adopter) return res.status(404).json({ error: "Adoptante no encontrado." });
      reviewerId = adopter.id;
    } else {
      const shelter = await getProfessionalShelterProfile(req.user);
      if (!shelter) return res.status(404).json({ error: "Perfil no encontrado." });
      reviewerId = shelter.id;
    }
    const existing = await prisma.reviews.findFirst({ where: { reviewer_id: reviewerId, match_id: matchId } });
    res.json({ hasReviewed: !!existing, review: existing || null });
  } catch (err) { console.error("[GET /api/reviews/check/:matchId]", err); res.status(500).json({ error: "Error al verificar valoración." }); }
});

// GET /api/reviews/:targetId — public
app.get("/api/reviews/:targetId", async (req, res) => {
  try {
    const { targetId } = req.params;
    const reviews = await prisma.reviews.findMany({ where: { target_id: targetId }, orderBy: { created_at: "desc" } });
    const enriched = await Promise.all(reviews.map(enrichReviewer));
    const total = reviews.length;
    const average = total > 0 ? Math.round((reviews.reduce((acc, r) => acc + r.rating, 0) / total) * 10) / 10 : null;
    res.json({ reviews: enriched, averageRating: average, totalCount: total });
  } catch (err) { console.error("[GET /api/reviews/:targetId]", err); res.status(500).json({ error: "Error al obtener valoraciones." }); }
});

// POST /api/reviews — crear valoración
app.post("/api/reviews", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.sub, role = req.user.role;
    const { target_id, target_role, match_id, rating, comment } = req.body;
    if (!target_id || !target_role || !match_id) return res.status(400).json({ error: "target_id, target_role y match_id son obligatorios." });
    const ratingNum = Number(rating);
    if (!ratingNum || ratingNum < 1 || ratingNum > 5) return res.status(400).json({ error: "rating debe ser un número entre 1 y 5." });
    let reviewer_id;
    if (role === "adopter") {
      const adopter = await prisma.adopters.findFirst({ where: { user_id: userId } });
      if (!adopter) return res.status(404).json({ error: "Adoptante no encontrado." });
      reviewer_id = adopter.id;
    } else if (role === "shelter" || role === "vet") {
      const shelter = await getProfessionalShelterProfile(req.user);
      if (!shelter) return res.status(404).json({ error: "Perfil profesional no encontrado." });
      reviewer_id = shelter.id;
    } else {
      return res.status(403).json({ error: "Rol no autorizado." });
    }
    const match = await prisma.matches.findUnique({ where: { id: match_id } });
    if (!match || match.interaction_type !== "accepted") return res.status(400).json({ error: "Solo se puede valorar un match aceptado." });
    if (role === "adopter" && match.adopter_id !== reviewer_id) return res.status(403).json({ error: "No perteneces a este match." });
    let review;
    try {
      review = await prisma.reviews.create({ data: { reviewer_id, reviewer_role: role, target_id, target_role, match_id, rating: ratingNum, comment: comment?.trim() || null } });
    } catch (e) {
      if (e.code === "P2002") return res.status(409).json({ error: "Ya has valorado esta relación." });
      throw e;
    }
    res.status(201).json(review);
  } catch (err) { console.error("[POST /api/reviews]", err); res.status(500).json({ error: "Error al crear la valoración." }); }
});

// ── Job: borrar mascotas adoptadas hace más de 7 días ────────────────────────
const ADOPTION_CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // cada 24 horas
const ADOPTION_EXPIRY_DAYS = 7;

async function cleanupAdoptedPets() {
  try {
    console.log("[cleanup] Buscando mascotas adoptadas para borrar...");
    // Usar raw SQL para acceder a ai_profile (el cliente Prisma generado no lo incluye en tipos)
    const adoptedPets = await prisma.$queryRaw`
      SELECT id, name, ai_profile
      FROM pets
      WHERE status = 'adoptado'
    `;

    const now = Date.now();
    const expiryMs = ADOPTION_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

    const idsToDelete = adoptedPets
      .filter((pet) => {
        const profile =
          typeof pet.ai_profile === "object" && pet.ai_profile !== null
            ? pet.ai_profile
            : {};
        const adoptionDate = profile.adoptionDate;
        if (!adoptionDate || typeof adoptionDate !== "string") return false;
        const adoptedAt = new Date(adoptionDate).getTime();
        return !isNaN(adoptedAt) && now - adoptedAt >= expiryMs;
      })
      .map((pet) => pet.id);

    if (idsToDelete.length === 0) {
      console.log("[cleanup] No hay mascotas para borrar.");
      return;
    }

    await prisma.pets.deleteMany({ where: { id: { in: idsToDelete } } });
    console.log(`[cleanup] Borradas ${idsToDelete.length} mascota(s) adoptadas con más de ${ADOPTION_EXPIRY_DAYS} días.`);
  } catch (err) {
    console.error("[cleanup] Error en el job de limpieza:", err);
  }
}

// Ejecutar al arrancar el servidor (por si el server estuvo caído) y luego cada 24h
cleanupAdoptedPets();
setInterval(cleanupAdoptedPets, ADOPTION_CLEANUP_INTERVAL_MS);

server.listen(PORT, () => {
  console.log(
    `🚀 Servidor backend con WebSocket en http://192.168.5.103:${PORT}`,
  );
});
