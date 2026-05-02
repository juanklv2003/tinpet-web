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
const { OAuth2Client } = require("google-auth-library");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Swagger imports
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

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
        url: "http://10.143.148.253:3000",
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

// Middlewares básicos
app.use(cors());
app.use(express.json({ limit: MAX_JSON_PAYLOAD }));
app.use(express.urlencoded({ extended: true, limit: MAX_JSON_PAYLOAD }));

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
      // Accept base64 data URL
      const match = req.body.base64.match(/^data:image\/(\w+);base64,(.+)$/);
      if (!match) {
        return res.status(400).json({ error: "Formato de imagen inválido" });
      }
      ext = match[1] === "jpeg" ? "jpg" : match[1];
      base64Data = match[2];
    } else {
      return res.status(400).json({ error: "Se requiere campo 'base64'" });
    }

    const filename = `${randomUUID()}.${ext}`;
    const filepath = path.join(uploadDir, filename);
    fs.writeFileSync(filepath, base64Data, "base64");

    // Return full URL (use env or construct from request host)
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
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
    // Solo shelters pueden tener mascotas
    if (req.user.role !== "shelter") {
      return res
        .status(403)
        .json({ error: "Solo los refugios pueden gestionar mascotas" });
    }

    // Buscar el shelter del usuario
    const shelter = await prisma.shelters.findFirst({
      where: { user_id: req.user.sub },
    });

    if (!shelter) {
      return res.status(404).json({ error: "Refugio no encontrado" });
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
    if (req.user.role !== "shelter") {
      return res
        .status(403)
        .json({ error: "Solo los refugios pueden crear mascotas" });
    }

    const { name, species, status, ai_profile } = req.body;

    if (!name || !species) {
      return res.status(400).json({ error: "Nombre y especie son requeridos" });
    }

    const photoUrls = normalizeIncomingPhotoUrls(ai_profile);
    const validationError = validatePhotoUrls(photoUrls);
    if (validationError) {
      return res.status(413).json({ error: validationError });
    }

    // Buscar el shelter del usuario
    const shelter = await prisma.shelters.findFirst({
      where: { user_id: req.user.sub },
    });

    if (!shelter) {
      return res.status(404).json({ error: "Refugio no encontrado" });
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
      shelter_id: shelter.id,
      breed: ai_profile?.breed || null,
      image_url: toStoredImageField(photoUrls),
      birth_date: ai_profile?.birthDate ? new Date(ai_profile.birthDate) : null,
      registration_date: new Date(),
      in_charge_employee_id: ai_profile?.inChargeEmployeeId || null,
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
      where: { id: req.params.id },
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
    if (req.user.role !== "shelter") {
      return res
        .status(403)
        .json({ error: "Solo los refugios pueden actualizar mascotas" });
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

    if (status) {
      updateData.status =
        status === "available"
          ? "disponible"
          : status === "adopted"
            ? "adoptado"
            : "pendiente";
    }

    if (ai_profile) {
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
      data: updateData,
    });

    res.json(mapPetToFrontend(updatedPet));
  } catch (error) {
    console.error("Error al actualizar mascota:", error);
    res.status(500).json({ error: "Error al actualizar mascota" });
  }
});

// DELETE /api/pets/:id - eliminar mascota
app.delete("/api/pets/:id", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "shelter") {
      return res
        .status(403)
        .json({ error: "Solo los refugios pueden eliminar mascotas" });
    }

    await prisma.pets.delete({
      where: { id: req.params.id },
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
    });

    console.log("Adopter found:", adopter);

    if (!adopter) {
      return res
        .status(404)
        .json({
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
          }
        }
      } catch {
        // If token is invalid on a public endpoint, keep default available-pets feed.
      }
    }

    // Obtener mascotas disponibles
    const pets = await prisma.pets.findMany({
      where: whereClause,
      include: {
        shelters: {
          select: { id: true, name: true },
        },
      },
    });

    const result = pets.map((pet) => ({
      photos: (() => {
        const parsed = parsePhotoUrlsFromImageField(pet.image_url);
        return parsed.length > 0
          ? parsed
          : ["https://placedog.net/400/400?random"];
      })(),
      id: pet.id,
      name: pet.name,
      species:
        pet.species === "dog" ? "dog" : pet.species === "cat" ? "cat" : "dog",
      age: pet.birth_date
        ? Math.floor(
            (new Date() - new Date(pet.birth_date)) /
              (365.25 * 24 * 60 * 60 * 1000),
          )
        : 1,
      description: `${pet.name} es un/a ${pet.species} muy especial. ${pet.breed ? `Raza: ${pet.breed}.` : ""}`,
      source: pet.shelters
        ? { type: "shelter", name: pet.shelters.name, id: pet.shelters.id }
        : { type: "vet", name: "Veterinaria", id: "" },
    }));

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
      where: { id: req.params.id },
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
    if (req.user.role !== "shelter") {
      return res
        .status(403)
        .json({ error: "Solo los refugios pueden gestionar empleados" });
    }

    const shelter = await prisma.shelters.findFirst({
      where: { user_id: req.user.sub },
    });

    if (!shelter) {
      return res.status(404).json({ error: "Refugio no encontrado" });
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
    if (req.user.role !== "shelter") {
      return res
        .status(403)
        .json({ error: "Solo los refugios pueden gestionar empleados" });
    }

    const { name, email, phone, birth_date, role } = req.body;

    if (!name) {
      return res.status(400).json({ error: "El nombre es requerido" });
    }

    const shelter = await prisma.shelters.findFirst({
      where: { user_id: req.user.sub },
    });

    if (!shelter) {
      return res.status(404).json({ error: "Refugio no encontrado" });
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
    if (req.user.role !== "shelter") {
      return res
        .status(403)
        .json({ error: "Solo los refugios pueden gestionar empleados" });
    }

    await prisma.shelter_employees.delete({
      where: { id: req.params.id },
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
    if (req.user.role !== "shelter") {
      return res
        .status(403)
        .json({ error: "Solo los refugios pueden gestionar solicitudes" });
    }

    const shelter = await prisma.shelters.findFirst({
      where: { user_id: req.user.sub },
    });

    if (!shelter) {
      return res.status(404).json({ error: "Refugio no encontrado" });
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
          select: { id: true, name: true },
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
    if (req.user.role !== "shelter") {
      return res
        .status(403)
        .json({ error: "Solo los refugios pueden gestionar solicitudes" });
    }

    const { status } = req.body;
    if (status !== "accepted" && status !== "rejected") {
      return res
        .status(400)
        .json({ error: "Estado no válido. Usa accepted o rejected." });
    }

    const shelter = await prisma.shelters.findFirst({
      where: { user_id: req.user.sub },
    });

    if (!shelter) {
      return res.status(404).json({ error: "Refugio no encontrado" });
    }

    const currentMatch = await prisma.matches.findUnique({
      where: { id: req.params.id },
      include: {
        pets: {
          select: { shelter_id: true, id: true, name: true },
        },
        adopters: {
          select: { id: true, name: true },
        },
      },
    });

    if (!currentMatch || currentMatch.pets?.shelter_id !== shelter.id) {
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
          select: { id: true, name: true },
        },
      },
    });

    // Si se acepta, crear conversación automáticamente
    if (status === "accepted") {
      await prisma.conversations.create({
        data: {
          id: randomUUID(),
          adopter_id: currentMatch.adopter_id,
          shelter_id: shelter.id,
          pet_id: currentMatch.pet_id,
          match_id: currentMatch.id,
        },
      });
      // Marcar la mascota como adoptada y asignar adopter_id
      try {
        await prisma.pets.update({
          where: { id: currentMatch.pet_id },
          data: {
            status: 'adoptado',
            adopter_id: currentMatch.adopter_id,
          },
        });

        // Rechazar otras solicitudes pendientes para la misma mascota
        await prisma.matches.updateMany({
          where: {
            pet_id: currentMatch.pet_id,
            id: { not: currentMatch.id },
            interaction_type: 'pending',
          },
          data: { interaction_type: 'rejected' },
        });
      } catch (e) {
        console.error('Error al marcar mascota como adoptada:', e);
      }
    }

    res.json({
      id: updated.id,
      pet_id: updated.pet_id,
      adopter_id: updated.adopter_id,
      status,
      created_at: updated.created_at,
      pet_name: updated.pets?.name ?? null,
      user_name: updated.adopters?.name ?? null,
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

    if (role === "adopter") {
      const adopter = await prisma.adopters.findFirst({
        where: { user_id: userId },
      });
      if (!adopter)
        return res.status(404).json({ error: "Adoptante no encontrado" });

      conversations = await prisma.conversations.findMany({
        where: { adopter_id: adopter.id },
        include: {
          shelter: {
            select: { id: true, name: true, phone: true, location: true },
          },
          vet_clinic: {
            select: { id: true, name: true, phone: true, location: true },
          },
          pet: { select: { id: true, name: true, image_url: true } },
          messages: {
            orderBy: { created_at: "desc" },
            take: 1,
          },
        },
        orderBy: { last_message_at: "desc" },
      });
    } else if (role === "shelter") {
      const shelter = await prisma.shelters.findFirst({
        where: { user_id: userId },
      });
      if (!shelter)
        return res.status(404).json({ error: "Refugio no encontrado" });

      conversations = await prisma.conversations.findMany({
        where: { shelter_id: shelter.id },
        include: {
          adopter: { select: { id: true, name: true, avatar_url: true } },
          pet: { select: { id: true, name: true, image_url: true } },
          messages: {
            orderBy: { created_at: "desc" },
            take: 1,
          },
        },
        orderBy: { last_message_at: "desc" },
      });
    }

    const payload = conversations.map((conv) => ({
      id: conv.id,
      pet_id: conv.pet_id,
      pet_name: conv.pet?.name ?? null,
      pet_image: parsePhotoUrlsFromImageField(conv.pet?.image_url)[0] ?? null,
      other_party: conv.shelter
        ? {
            type: "shelter",
            id: conv.shelter.id,
            name: conv.shelter.name,
            phone: conv.shelter.phone,
            location: conv.shelter.location,
          }
        : conv.vet_clinic
          ? {
              type: "vet",
              id: conv.vet_clinic.id,
              name: conv.vet_clinic.name,
              phone: conv.vet_clinic.phone,
              location: conv.vet_clinic.location,
            }
          : {
              type: "adopter",
              id: conv.adopter.id,
              name: conv.adopter.name,
              avatar: conv.adopter.avatar_url,
              avatar_url: conv.adopter.avatar_url,
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
      if (role === "vet" && conversation.vet_clinic?.user_id === userId)
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
        include: { pets: { include: { shelters: true } } },
      });
      if (match) {
        shelterId = match.pets?.shelter_id;
        targetPetId = match.pet_id;
      }
    } else if (pet_id) {
      const pet = await prisma.pets.findUnique({
        where: { id: pet_id },
        include: { shelters: true },
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
    if (req.user.role !== "shelter") {
      return res
        .status(403)
        .json({ error: "Solo los refugios pueden ver estadísticas" });
    }

    const shelter = await prisma.shelters.findFirst({
      where: { user_id: req.user.sub },
    });

    if (!shelter) {
      return res.status(404).json({ error: "Refugio no encontrado" });
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
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role, name },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({ token, role: user.role, name, avatar, description });
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
      select: {
        id: true,
        user_id: true,
        name: true,
        username: true,
        email: true,
        description: true,
        avatar_url: true,
        photos: true,
        hobbies: true,
        housing_type: true,
        has_other_pets: true,
        other_pets_desc: true,
        pet_experience: true,
        has_children: true,
        hours_at_home: true,
        work_from_home: true,
        created_at: true,
      },
    });

    if (!adopter) {
      return res.status(404).json({ error: "Perfil de adoptante no encontrado" });
    }

    return res.json(adopter);
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
      description,
      avatar_url,
      photos,
      hobbies,
      housing_type,
      has_other_pets,
      other_pets_desc,
      pet_experience,
      has_children,
      hours_at_home,
      work_from_home,
    } = req.body;

    const adopter = await prisma.adopters.findFirst({
      where: { user_id: req.user.sub },
    });

    if (!adopter) {
      return res.status(404).json({ error: "Adoptante no encontrado" });
    }

    const data = {};

    if (typeof name === "string" && name.trim()) {
      data.name = name.trim();
    }

    if (typeof description === "string") {
      data.description = description.trim();
    }

    if (avatar_url === null || avatar_url === "") {
      data.avatar_url = null;
    } else if (typeof avatar_url === "string" && avatar_url.trim()) {
      data.avatar_url = avatar_url.trim();
    }

    // Photos array (max 5)
    if (Array.isArray(photos)) {
      data.photos = photos.slice(0, 5);
    }

    if (typeof housing_type === "string" && ["house", "apartment"].includes(housing_type)) {
      data.housing_type = housing_type;
    }

    if (typeof has_other_pets === "boolean") {
      data.has_other_pets = has_other_pets;
    }

    if (typeof other_pets_desc === "string") {
      data.other_pets_desc = other_pets_desc.trim();
    }

    if (typeof pet_experience === "string" && ["none", "some", "lots"].includes(pet_experience)) {
      data.pet_experience = pet_experience;
    }

    if (typeof has_children === "boolean") {
      data.has_children = has_children;
    }

    if (typeof hours_at_home === "string" && ["less4", "4to8", "more8", "always"].includes(hours_at_home)) {
      data.hours_at_home = hours_at_home;
    }

    if (typeof work_from_home === "boolean") {
      data.work_from_home = work_from_home;
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
        description: true,
        avatar_url: true,
        photos: true,
        hobbies: true,
        housing_type: true,
        has_other_pets: true,
        other_pets_desc: true,
        pet_experience: true,
        has_children: true,
        hours_at_home: true,
        work_from_home: true,
      },
    });

    return res.json(updated);
  } catch (error) {
    console.error("Error al actualizar perfil de adoptante:", error);
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
    let isNewUser = false;

    if (!user) {
      // Crear nuevo usuario Google (sin password_hash, usamos google_id si la columna existe)
      isNewUser = true;
      user = await prisma.users.create({
        data: {
          id: randomUUID(),
          email: normalizedEmail,
          password_hash: "", // sin contraseña para usuarios Google
          role: "adopter",   // Google Sign-In siempre crea adoptantes
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
        });
        profileName = profile?.name || googleName || "";
        avatarUrl = profile?.avatar_url || picture || null;
      } else if (user.role === "shelter") {
        const profile = await prisma.shelters.findFirst({
          where: { user_id: user.id },
        });
        profileName = profile?.name || googleName || "";
      } else if (user.role === "vet") {
        const profile = await prisma.vet_clinics.findFirst({
          where: { user_id: user.id },
        });
        profileName = profile?.name || googleName || "";
      }
    }

    // Generar nuestro JWT propio
    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role, name: profileName },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    return res.json({
      token,
      role: user.role,
      name: profileName,
      avatar: avatarUrl,
      isNewUser,
    });
  } catch (error) {
    console.error("Error en Google Auth:", error);
    return res.status(401).json({ error: "Error al verificar token de Google" });
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

server.listen(PORT, () => {
  console.log(
    `🚀 Servidor backend con WebSocket en http://10.143.148.253:${PORT}`,
  );
});
