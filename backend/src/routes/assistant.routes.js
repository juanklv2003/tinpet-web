const router = require("express").Router();
const { randomUUID } = require("crypto");
const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");
const { DEFAULT_SYSTEM_PROMPT, sendGroqChatCompletion } = require("../lib/groq-assistant");

const JWT_SECRET = process.env.JWT_SECRET || "tinpet-secret-key-2024";

function getAuthUser(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function isProfessionalRole(role) {
  return role === "shelter" || role === "vet";
}

async function getProfessionalProfile(user) {
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

async function buildAuthenticatedContext(req) {
  const user = getAuthUser(req);
  if (!user || !isProfessionalRole(user.role)) return {};

  const profile = await getProfessionalProfile(user);
  if (!profile) return {};

  const pets = await prisma.pets.findMany({
    where: { shelter_id: profile.id },
    select: {
      id: true,
      name: true,
      species: true,
      breed: true,
      status: true,
      description: true,
      birth_date: true,
      created_at: true,
    },
    orderBy: { created_at: "desc" },
    take: 30,
  });

  const matches = await prisma.matches.findMany({
    where: {
      pets: {
        shelter_id: profile.id,
      },
    },
    select: {
      id: true,
      interaction_type: true,
      created_at: true,
      pets: {
        select: {
          id: true,
          name: true,
          species: true,
        },
      },
      adopters: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
    take: 30,
  });

  return {
    organization: {
      id: profile.id,
      name: profile.name,
      role: user.role,
    },
    organizationPets: pets.map((pet) => ({
      id: pet.id,
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      status: pet.status,
      description: pet.description,
      birthDate: pet.birth_date,
    })),
    organizationMatches: matches.map((match) => ({
      id: match.id,
      status: match.interaction_type,
      createdAt: match.created_at,
      petName: match.pets?.name,
      petSpecies: match.pets?.species,
      adopterName: match.adopters?.username || match.adopters?.name,
    })),
  };
}

function validateChatBody(body) {
  if (!body || typeof body !== "object") {
    return "Body must be a JSON object";
  }

  if (typeof body.message !== "string" || !body.message.trim()) {
    return "message is required";
  }

  if (body.conversationId != null && typeof body.conversationId !== "string") {
    return "conversationId must be a string when provided";
  }

  if (body.context != null && typeof body.context !== "object") {
    return "context must be an object when provided";
  }

  if (body.history != null && !Array.isArray(body.history)) {
    return "history must be an array when provided";
  }

  return null;
}

router.get("/health", (_req, res) => {
  const configured = Boolean(
    process.env.GROQ_IA_API_KEY?.trim() && process.env.GROQ_MODEL?.trim(),
  );

  res.json({
    ok: true,
    provider: "groq",
    model: process.env.GROQ_MODEL?.trim() || null,
    configured,
    systemPrompt: process.env.GROQ_SYSTEM_PROMPT?.trim() || DEFAULT_SYSTEM_PROMPT,
    knowledgeConfigured: Boolean(process.env.TINPET_ASSISTANT_KNOWLEDGE?.trim()),
  });
});

router.post("/chat", async (req, res) => {
  const validationError = validateChatBody(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const conversationId =
    typeof req.body.conversationId === "string" && req.body.conversationId.trim()
      ? req.body.conversationId.trim()
      : randomUUID();

  try {
    const authenticatedContext = await buildAuthenticatedContext(req);
    const result = await sendGroqChatCompletion({
      ...req.body,
      context: {
        ...(req.body.context || {}),
        ...authenticatedContext,
      },
    });

    return res.json({
      conversationId,
      reply: result.reply,
      sources: [],
    });
  } catch (error) {
    console.error("[assistant chat]", error);
    return res.status(502).json({
      error: "Assistant provider unavailable",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

module.exports = router;
