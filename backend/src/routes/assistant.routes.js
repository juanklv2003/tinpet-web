const router = require("express").Router();
const { randomUUID } = require("crypto");
const { DEFAULT_SYSTEM_PROMPT, sendGroqChatCompletion } = require("../lib/groq-assistant");

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
    const result = await sendGroqChatCompletion(req.body);

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