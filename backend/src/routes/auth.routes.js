const router   = require('express').Router();
const bcrypt   = require('bcrypt');
const jwt      = require('jsonwebtoken');
const prisma   = require('../lib/prisma');

const SALT_ROUNDS = 12;

// ─── Registro ─────────────────────────────────────────────────────────────────
// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password, name, role } = req.body;

  if (!email || !password || !name || !role) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
  }

  const validRoles = ['adopter', 'shelter', 'vet'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: 'Rol no válido.' });
  }

  try {
    const existing = await prisma.users.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existing) return res.status(409).json({ error: 'El email ya está registrado.' });

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.users.create({
      data: {
        email: email.trim().toLowerCase(),
        password_hash,
        role,
      },
    });

    // Insertar en la tabla específica del rol
    const roleInsert = {
      adopter: () => prisma.adopters.create({ data: { user_id: user.id, name, email: user.email } }),
      shelter: () => prisma.shelters.create({ data: { user_id: user.id, name, email: user.email } }),
      vet:     () => prisma.vet_clinics.create({ data: { user_id: user.id, name, email: user.email } }),
    };
    await roleInsert[role]();

    return res.status(201).json({ message: 'Usuario creado correctamente.' });
  } catch (err) {
    console.error('[register]', err);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// ─── Login ────────────────────────────────────────────────────────────────────
// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son obligatorios.' });
  }

  try {
    const user = await prisma.users.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user) return res.status(401).json({ error: 'Credenciales incorrectas.' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Credenciales incorrectas.' });

    // Obtener nombre del perfil según el rol
    const profileModel = { adopter: 'adopters', shelter: 'shelters', vet: 'vet_clinics' }[user.role];
    const profileData = await prisma[profileModel].findUnique({ where: { user_id: user.id } });
    const name = profileData?.name ?? '';

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role, name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({ token, role: user.role, name });
  } catch (err) {
    console.error('[login]', err);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

module.exports = router;
