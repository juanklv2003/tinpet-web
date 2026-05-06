const prisma = require("./prisma");

const GROQ_BASE_URL =
  process.env.GROQ_BASE_URL?.trim() || "https://api.groq.com/openai/v1";
const DEFAULT_SYSTEM_PROMPT =
  "Eres el asistente oficial de TinPet Web. Responde en español, breve, útil y sin inventar datos. Si falta contexto, dilo claramente. Nunca menciones rutas internas, nombres de archivos, endpoints técnicos ni términos de implementación; traduce todo a lenguaje de cliente.";

function readRequiredEnv(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`${name} is required`);
  }
  return value.trim();
}

function readOptionalNumber(name, fallback) {
  const raw = process.env[name];
  if (!raw || !raw.trim()) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readOptionalString(name, fallback) {
  const value = process.env[name];
  if (!value || !value.trim()) return fallback;
  return value.trim();
}

function normalizeHistory(history, limit) {
  if (!Array.isArray(history) || history.length === 0) return [];

  return history
    .slice(-limit)
    .map((item) => {
      const role = item?.role;
      const content = typeof item?.content === "string" ? item.content.trim() : "";

      if (!content) return null;
      if (!["system", "user", "assistant"].includes(role)) return null;

      return { role, content };
    })
    .filter(Boolean);
}

async function fetchDatabaseKnowledge() {
  try {
    const knowledge = await prisma.assistant_knowledge.findMany({
      where: { isPublished: true },
      select: {
        title: true,
        content: true,
      },
      orderBy: { createdAt: "desc" },
      take: 12,
    });

    if (!knowledge || knowledge.length === 0) return "";

    const formatted = knowledge
      .map((item) => `${item.title}: ${item.content}`)
      .join("\n\n");

    return formatted;
  } catch (error) {
    console.error("[fetchDatabaseKnowledge]", error);
    return "";
  }
}

function buildContextText(context) {
  if (!context || typeof context !== "object") return "";

  const lines = [];

  if (typeof context.surface === "string" && context.surface.trim()) {
    lines.push(`Surface: ${context.surface.trim()}`);
  }

  if (typeof context.path === "string" && context.path.trim()) {
    lines.push(`Ruta actual: ${context.path.trim()}`);
  }

  if (typeof context.userName === "string" && context.userName.trim()) {
    lines.push(`Usuario: ${context.userName.trim()}`);
  }

  if (typeof context.platform === "string" && context.platform.trim()) {
    lines.push(`Plataforma: ${context.platform.trim()}`);
  }

  if (context.selectedPet && typeof context.selectedPet === "object") {
    const pet = context.selectedPet;
    lines.push(`Mascota: ${pet.name || "desconocida"}`);
    if (pet.id) lines.push(`ID mascota: ${pet.id}`);
    if (pet.species) lines.push(`Especie: ${pet.species}`);
    if (pet.description) lines.push(`Descripción: ${pet.description}`);
    if (pet.sourceName) lines.push(`Origen: ${pet.sourceName}`);
  }

  return lines.join("\n");
}

function buildTinpetKnowledgeText() {
  const knowledge = process.env.TINPET_ASSISTANT_KNOWLEDGE;
  if (!knowledge || !knowledge.trim()) return "";
  return knowledge.trim();
}

async function sendGroqChatCompletion(payload) {
  const apiKey = readRequiredEnv("GROQ_IA_API_KEY");
  const model = readRequiredEnv("GROQ_MODEL");
  const systemPrompt = readOptionalString("GROQ_SYSTEM_PROMPT", DEFAULT_SYSTEM_PROMPT);
  const temperature = readOptionalNumber("GROQ_TEMPERATURE", 0.4);
  const maxTokens = readOptionalNumber("GROQ_MAX_TOKENS", 700);
  const timeoutMs = readOptionalNumber("GROQ_TIMEOUT_MS", 15000);
  const historyLimit = readOptionalNumber("ASSISTANT_MAX_HISTORY_MESSAGES", 12);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const contextText = buildContextText(payload.context);
  // Fetch knowledge from database (or fallback to env var)
  const dbKnowledgeText = await fetchDatabaseKnowledge();
  const envKnowledgeText = buildTinpetKnowledgeText();
  const knowledgeText = dbKnowledgeText || envKnowledgeText;

  const messages = [
    {
      role: "system",
      content: [
        systemPrompt,
        knowledgeText ? `\nContexto de TinPet Web:\n${knowledgeText}` : "",
        contextText ? `\nContexto de la solicitud:\n${contextText}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    },
    ...normalizeHistory(payload.history, historyLimit),
    { role: "user", content: payload.message.trim() },
  ];

  try {
    const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message = data?.error?.message || `Groq request failed with status ${response.status}`;
      throw new Error(message);
    }

    const reply = data?.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      throw new Error("Groq returned an empty reply");
    }

    return { reply, raw: data };
  } finally {
    clearTimeout(timer);
  }
}

module.exports = {
  sendGroqChatCompletion,
  DEFAULT_SYSTEM_PROMPT,
};