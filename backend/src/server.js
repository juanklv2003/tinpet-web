require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const JWT_SECRET = process.env.JWT_SECRET || 'tinpet-secret-key-2024';

// Inicializamos Prisma y Express
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const app = express();

// Middlewares básicos
app.use(cors());
app.use(express.json());

// --- MIDDLEWARE DE AUTENTICACIÓN ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// --- HELPER: Mapear pet al formato del frontend ---
const mapPetToFrontend = (pet) => ({
  id: pet.id,
  name: pet.name,
  species: pet.species,
  status: pet.status === 'disponible' ? 'available' : 
          pet.status === 'adoptado' ? 'adopted' : 'pending',
  created_at: pet.created_at,
  ai_profile: {
    breed: pet.breed || null,
    photoUrl: pet.image_url || null,
    birthDate: pet.birth_date ? pet.birth_date.toISOString().split('T')[0] : null,
    intakeDate: pet.registration_date ? pet.registration_date.toISOString().split('T')[0] : null,
    vaccines: [],
    medicalHistory: [],
  }
});

// --- PETS ---

// GET /api/pets - todas las mascotas
app.get('/api/pets', async (req, res) => {
  try {
    const allPets = await prisma.pets.findMany();
    res.json(allPets.map(mapPetToFrontend));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener las mascotas' });
  }
});

// GET /api/pets/mine - mascotas del shelter logueado
app.get('/api/pets/mine', authenticateToken, async (req, res) => {
  try {
    // Solo shelters pueden tener mascotas
    if (req.user.role !== 'shelter') {
      return res.status(403).json({ error: 'Solo los refugios pueden gestionar mascotas' });
    }

    // Buscar el shelter del usuario
    const shelter = await prisma.shelters.findFirst({
      where: { user_id: req.user.sub }
    });

    if (!shelter) {
      return res.status(404).json({ error: 'Refugio no encontrado' });
    }

    const myPets = await prisma.pets.findMany({
      where: { shelter_id: shelter.id }
    });

    res.json(myPets.map(mapPetToFrontend));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener tus mascotas' });
  }
});

// POST /api/pets - crear mascota
app.post('/api/pets', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'shelter') {
      return res.status(403).json({ error: 'Solo los refugios pueden crear mascotas' });
    }

    const { name, species, status, ai_profile } = req.body;

    if (!name || !species) {
      return res.status(400).json({ error: 'Nombre y especie son requeridos' });
    }

    // Buscar el shelter del usuario
    const shelter = await prisma.shelters.findFirst({
      where: { user_id: req.user.sub }
    });

    if (!shelter) {
      return res.status(404).json({ error: 'Refugio no encontrado' });
    }

    // Mapear status al formato de la DB
    const dbStatus = status === 'available' ? 'disponible' : 
                     status === 'adopted' ? 'adoptado' : 'pendiente';

    // Extraer datos del ai_profile
    const petData = {
      name,
      species,
      status: dbStatus,
      shelter_id: shelter.id,
      breed: ai_profile?.breed || null,
      image_url: ai_profile?.photoUrl || null,
      birth_date: ai_profile?.birthDate ? new Date(ai_profile.birthDate) : null,
      registration_date: new Date(),
    };

    const newPet = await prisma.pets.create({ data: petData });
    res.status(201).json(mapPetToFrontend(newPet));
  } catch (error) {
    console.error('Error al crear mascota:', error);
    res.status(500).json({ error: 'Error al crear mascota' });
  }
});

// GET /api/pets/:id - ver una mascota
app.get('/api/pets/:id', authenticateToken, async (req, res) => {
  try {
    const pet = await prisma.pets.findUnique({
      where: { id: req.params.id }
    });

    if (!pet) {
      return res.status(404).json({ error: 'Mascota no encontrada' });
    }

    res.json(mapPetToFrontend(pet));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener la mascota' });
  }
});

// PATCH /api/pets/:id - actualizar mascota
app.patch('/api/pets/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'shelter') {
      return res.status(403).json({ error: 'Solo los refugios pueden actualizar mascotas' });
    }

    const { ai_profile, status, name, species } = req.body;
    const updateData = {};

    if (typeof name === 'string' && name.trim()) {
      updateData.name = name.trim();
    }

    if (typeof species === 'string' && species.trim()) {
      updateData.species = species.trim();
    }

    if (status) {
      updateData.status = status === 'available' ? 'disponible' : 
                          status === 'adopted' ? 'adoptado' : 'pendiente';
    }

    if (ai_profile) {
      if (typeof ai_profile.breed === 'string') updateData.breed = ai_profile.breed || null;
      if (typeof ai_profile.photoUrl === 'string') updateData.image_url = ai_profile.photoUrl || null;
      if (typeof ai_profile.birthDate === 'string' && ai_profile.birthDate) {
        updateData.birth_date = new Date(ai_profile.birthDate);
      }
    }

    const updatedPet = await prisma.pets.update({
      where: { id: req.params.id },
      data: updateData
    });

    res.json(mapPetToFrontend(updatedPet));
  } catch (error) {
    console.error('Error al actualizar mascota:', error);
    res.status(500).json({ error: 'Error al actualizar mascota' });
  }
});

// DELETE /api/pets/:id - eliminar mascota
app.delete('/api/pets/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'shelter') {
      return res.status(403).json({ error: 'Solo los refugios pueden eliminar mascotas' });
    }

    await prisma.pets.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Mascota eliminada' });
  } catch (error) {
    console.error('Error al eliminar mascota:', error);
    res.status(500).json({ error: 'Error al eliminar mascota' });
  }
});

// --- SHELTER EMPLOYEES ---

// GET /api/employees - empleados del shelter
app.get('/api/employees', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'shelter') {
      return res.status(403).json({ error: 'Solo los refugios pueden gestionar empleados' });
    }

    const shelter = await prisma.shelters.findFirst({
      where: { user_id: req.user.sub }
    });

    if (!shelter) {
      return res.status(404).json({ error: 'Refugio no encontrado' });
    }

    const employees = await prisma.shelter_employees.findMany({
      where: { shelter_id: shelter.id }
    });

    res.json(employees);
  } catch (error) {
    console.error('Error al obtener empleados:', error);
    res.status(500).json({ error: 'Error al obtener los empleados' });
  }
});

// POST /api/employees - crear empleado
app.post('/api/employees', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'shelter') {
      return res.status(403).json({ error: 'Solo los refugios pueden gestionar empleados' });
    }

    const { name, email, phone, birth_date } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    const shelter = await prisma.shelters.findFirst({
      where: { user_id: req.user.sub }
    });

    if (!shelter) {
      return res.status(404).json({ error: 'Refugio no encontrado' });
    }

    const employee = await prisma.shelter_employees.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        birth_date: birth_date ? new Date(birth_date) : null,
        shelter_id: shelter.id
      }
    });

    res.status(201).json(employee);
  } catch (error) {
    console.error('Error al crear empleado:', error);
    res.status(500).json({ error: 'Error al crear empleado' });
  }
});

// DELETE /api/employees/:id - eliminar empleado
app.delete('/api/employees/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'shelter') {
      return res.status(403).json({ error: 'Solo los refugios pueden gestionar empleados' });
    }

    await prisma.shelter_employees.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Empleado eliminado' });
  } catch (error) {
    console.error('Error al eliminar empleado:', error);
    res.status(500).json({ error: 'Error al eliminar empleado' });
  }
});

// --- MATCHES ---

// GET /api/matches - solicitudes (likes) para mascotas del refugio autenticado
app.get('/api/matches', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'shelter') {
      return res.status(403).json({ error: 'Solo los refugios pueden gestionar solicitudes' });
    }

    const shelter = await prisma.shelters.findFirst({
      where: { user_id: req.user.sub },
    });

    if (!shelter) {
      return res.status(404).json({ error: 'Refugio no encontrado' });
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
        created_at: 'desc',
      },
    });

    const payload = matches.map((match) => {
      const rawType = String(match.interaction_type || '').toLowerCase();
      const status =
        rawType === 'accepted' || rawType === 'aceptado'
          ? 'accepted'
          : rawType === 'rejected' || rawType === 'rechazado'
          ? 'rejected'
          : 'pending';

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
    console.error('Error al obtener solicitudes:', error);
    res.status(500).json({ error: 'Error al obtener las solicitudes' });
  }
});

// PATCH /api/matches/:id - aceptar/rechazar solicitud
app.patch('/api/matches/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'shelter') {
      return res.status(403).json({ error: 'Solo los refugios pueden gestionar solicitudes' });
    }

    const { status } = req.body;
    if (status !== 'accepted' && status !== 'rejected') {
      return res.status(400).json({ error: 'Estado no válido. Usa accepted o rejected.' });
    }

    const shelter = await prisma.shelters.findFirst({
      where: { user_id: req.user.sub },
    });

    if (!shelter) {
      return res.status(404).json({ error: 'Refugio no encontrado' });
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
      return res.status(404).json({ error: 'Solicitud no encontrada o sin permisos' });
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

    res.json({
      id: updated.id,
      pet_id: updated.pet_id,
      adopter_id: updated.adopter_id,
      status,
      created_at: updated.created_at,
      pet_name: updated.pets?.name ?? null,
      user_name: updated.adopters?.name ?? null,
    });
  } catch (error) {
    console.error('Error al actualizar solicitud:', error);
    res.status(500).json({ error: 'Error al actualizar la solicitud' });
  }
});

// --- STATS ---

// GET /api/stats - resumen del dashboard del refugio autenticado
app.get('/api/stats', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'shelter') {
      return res.status(403).json({ error: 'Solo los refugios pueden ver estadísticas' });
    }

    const shelter = await prisma.shelters.findFirst({
      where: { user_id: req.user.sub },
    });

    if (!shelter) {
      return res.status(404).json({ error: 'Refugio no encontrado' });
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
          status: 'adoptado',
        },
      }),
    ]);

    res.json({
      totalPets,
      totalLikesReceived,
      closedAdoptions,
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// --- AUTH ---
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña requeridos' });
  }

  try {
    const user = await prisma.users.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    let name = '';
    if (user.role === 'adopter') {
      const profile = await prisma.adopters.findFirst({ where: { user_id: user.id } });
      name = profile?.name || '';
    } else if (user.role === 'shelter') {
      const profile = await prisma.shelters.findFirst({ where: { user_id: user.id } });
      name = profile?.name || '';
    } else if (user.role === 'vet') {
      const profile = await prisma.vet_clinics.findFirst({ where: { user_id: user.id } });
      name = profile?.name || '';
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role, name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, role: user.role, name });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name, role } = req.body;

  if (!email || !password || !name || !role) {
    return res.status(400).json({ error: 'Faltan datos requeridos' });
  }

  try {
    const existingUser = await prisma.users.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.users.create({
      data: {
        id: randomUUID(),
        email: email.toLowerCase(),
        password_hash: passwordHash,
        role: role.toLowerCase()
      }
    });

    switch (role.toLowerCase()) {
      case 'adopter':
        await prisma.adopters.create({
          data: {
            id: randomUUID(),
            user_id: user.id,
            name: name,
            email: email.toLowerCase()
          }
        });
        break;
      case 'shelter':
        await prisma.shelters.create({
          data: {
            id: randomUUID(),
            user_id: user.id,
            name: name,
            email: email.toLowerCase()
          }
        });
        break;
      case 'vet':
        await prisma.vet_clinics.create({
          data: {
            id: randomUUID(),
            user_id: user.id,
            name: name,
            email: email.toLowerCase()
          }
        });
        break;
      default:
        return res.status(400).json({ error: 'Rol inválido' });
    }

    res.status(201).json({ message: 'Usuario creado correctamente', userId: user.id });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

// --- ARRANCAR SERVIDOR ---
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend volando en http://localhost:${PORT}`);
});
