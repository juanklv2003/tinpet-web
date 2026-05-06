const router = require("express").Router();
const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");

const JWT_SECRET = process.env.JWT_SECRET || "tinpet-secret-key-2024";

// Middleware to verify JWT token
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

// Middleware to check admin role
const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin role required" });
  }
  next();
};

// GET /api/knowledge - List published knowledge entries
router.get("/", async (req, res) => {
  try {
    const { shelterId } = req.query;

    const whereClause = { isPublished: true };
    if (shelterId) {
      whereClause.shelter_id = shelterId;
    }

    const knowledge = await prisma.assistant_knowledge.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        content: true,
        category: true,
        shelter_id: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json(knowledge);
  } catch (error) {
    console.error("[knowledge list]", error);
    return res.status(500).json({ error: "Failed to fetch knowledge" });
  }
});

// GET /api/knowledge/search - Search knowledge by title or content
router.get("/search", async (req, res) => {
  try {
    const { q, shelterId } = req.query;

    if (!q || typeof q !== "string" || !q.trim()) {
      return res.status(400).json({ error: "Query parameter 'q' is required" });
    }

    const searchQuery = `%${q.trim()}%`;

    const knowledge = await prisma.assistant_knowledge.findMany({
      where: {
        isPublished: true,
        ...(shelterId && { shelter_id: shelterId }),
        OR: [
          { title: { ilike: searchQuery } },
          { content: { ilike: searchQuery } },
        ],
      },
      select: {
        id: true,
        title: true,
        content: true,
        category: true,
        shelter_id: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return res.json(knowledge);
  } catch (error) {
    console.error("[knowledge search]", error);
    return res.status(500).json({ error: "Search failed" });
  }
});

// POST /api/knowledge - Create knowledge entry (admin only)
router.post("/", requireAdmin, async (req, res) => {
  try {
    const { title, content, category, shelterId, isPublished } = req.body;

    // Validation
    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }
    if (!content || typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ error: "Content is required" });
    }

    // Check for duplicate (same shelter + title)
    const existing = await prisma.assistant_knowledge.findFirst({
      where: {
        title: title.trim(),
        shelter_id: shelterId || null,
      },
    });

    if (existing) {
      return res.status(409).json({ error: "Knowledge entry with this title already exists for this shelter" });
    }

    const knowledge = await prisma.assistant_knowledge.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        category: category ? category.trim() : null,
        shelter_id: shelterId || null,
        isPublished: isPublished !== false, // Default to true
      },
    });

    return res.status(201).json(knowledge);
  } catch (error) {
    console.error("[knowledge create]", error);
    return res.status(500).json({ error: "Failed to create knowledge entry" });
  }
});

// PATCH /api/knowledge/:id - Update knowledge entry (admin only)
router.patch("/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category, isPublished } = req.body;

    const existing = await prisma.assistant_knowledge.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: "Knowledge entry not found" });
    }

    const updateData = {};

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({ error: "Title must be a non-empty string" });
      }
      updateData.title = title.trim();
    }

    if (content !== undefined) {
      if (typeof content !== "string" || !content.trim()) {
        return res.status(400).json({ error: "Content must be a non-empty string" });
      }
      updateData.content = content.trim();
    }

    if (category !== undefined) {
      updateData.category = category ? category.trim() : null;
    }

    if (isPublished !== undefined) {
      updateData.isPublished = isPublished === true;
    }

    // If changing title, check for duplicate
    if (updateData.title && updateData.title !== existing.title) {
      const duplicate = await prisma.assistant_knowledge.findFirst({
        where: {
          title: updateData.title,
          shelter_id: existing.shelter_id,
          id: { not: id },
        },
      });

      if (duplicate) {
        return res.status(409).json({ error: "Knowledge entry with this title already exists for this shelter" });
      }
    }

    const updated = await prisma.assistant_knowledge.update({
      where: { id },
      data: updateData,
    });

    return res.json(updated);
  } catch (error) {
    console.error("[knowledge update]", error);
    return res.status(500).json({ error: "Failed to update knowledge entry" });
  }
});

// DELETE /api/knowledge/:id - Delete knowledge entry (admin only)
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.assistant_knowledge.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: "Knowledge entry not found" });
    }

    await prisma.assistant_knowledge.delete({
      where: { id },
    });

    return res.json({ message: "Knowledge entry deleted" });
  } catch (error) {
    console.error("[knowledge delete]", error);
    return res.status(500).json({ error: "Failed to delete knowledge entry" });
  }
});

module.exports = router;
