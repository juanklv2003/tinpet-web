const router       = require('express').Router();
const prisma       = require('../lib/prisma');
const authenticate = require('../middleware/authenticate');

// GET /api/pets  – todas las mascotas disponibles (público)
router.get('/', async (_req, res) => {
  try {
    const pets = await prisma.pets.findMany({ orderBy: { created_at: 'desc' } });
    res.json(pets);
  } catch (err) {
    console.error('[pets GET]', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// GET /api/pets/mine  – mascotas del refugio autenticado
router.get('/mine', authenticate, async (req, res) => {
  if (req.user.role !== 'shelter') {
    return res.status(403).json({ error: 'Solo los refugios pueden acceder a este recurso.' });
  }
  try {
    const shelter = await prisma.shelters.findUnique({ where: { user_id: req.user.sub } });
    if (!shelter) return res.status(404).json({ error: 'Refugio no encontrado.' });

    const pets = await prisma.pets.findMany({
      where: { shelter_id: shelter.id },
      orderBy: { created_at: 'desc' },
    });
    res.json(pets);
  } catch (err) {
    console.error('[pets/mine GET]', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// GET /api/pets/:id - obtener mascota por ID
router.get('/:id', async (req, res) => {
  try {
    const pet = await prisma.pets.findUnique({ where: { id: req.params.id } });
    if (!pet) return res.status(404).json({ error: 'Mascota no encontrada.' });
    res.json(pet);
  } catch (err) {
    if (err.code === 'P2023') return res.status(400).json({ error: 'ID inválido.' });
    console.error('[pets GET :id]', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// POST /api/pets  – añadir mascota (solo refugios)
router.post('/', authenticate, async (req, res) => {
  if (req.user.role !== 'shelter') {
    return res.status(403).json({ error: 'Solo los refugios pueden añadir mascotas.' });
  }
  const { name, species, status = 'available', ai_profile = {} } = req.body;
  if (!name || !species) return res.status(400).json({ error: 'name y species son obligatorios.' });

  try {
    const shelter = await prisma.shelters.findUnique({ where: { user_id: req.user.sub } });
    if (!shelter) return res.status(404).json({ error: 'Refugio no encontrado.' });

    require('fs').appendFileSync('post_log.txt', new Date().toISOString() + ' req.body: ' + JSON.stringify(req.body) + '\n');

    const pet = await prisma.pets.create({
      data: { shelter_id: shelter.id, name, species, status, ai_profile },
    });
    res.status(201).json(pet);
  } catch (err) {
    console.error('[pets POST]', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// PATCH /api/pets/:id  – actualizar mascota
router.patch('/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'shelter') {
    return res.status(403).json({ error: 'Acceso denegado.' });
  }
  try {
    const shelter = await prisma.shelters.findUnique({ where: { user_id: req.user.sub } });
    const pet     = await prisma.pets.findUnique({ where: { id: req.params.id } });

    if (!pet || pet.shelter_id !== shelter?.id) {
      return res.status(404).json({ error: 'Mascota no encontrada o sin permisos.' });
    }

    console.log('[PATCH /pets/:id] req.body:', JSON.stringify(req.body, null, 2));
    require('fs').appendFileSync('patch_log.txt', new Date().toISOString() + ' req.body: ' + JSON.stringify(req.body) + '\n');

    const updated = await prisma.pets.update({
      where: { id: req.params.id },
      data: req.body,
    });

    if (req.body.status && global.io) {
      global.io.emit('pet_status_updated', {
        petId: updated.id,
        status: updated.status,
        pet: updated,
      });

      // If adopted, notify the adopter if they exist
      if (updated.status === 'adoptado' && updated.adopter_id) {
        const adopter = await prisma.adopters.findUnique({ 
          where: { id: updated.adopter_id },
          include: { users: true }
        });
        
        if (adopter?.users?.id && global.sendPushNotification) {
          global.sendPushNotification(
            adopter.users.id,
            '¡Adopción completada! 🐾',
            `La adopción de ${updated.name} ha sido confirmada. ¡Valorá tu experiencia!`,
            { 
              type: 'adoption_completed', 
              petId: updated.id,
              petName: updated.name 
            }
          );
        }
      }
    }

    res.json(updated);
  } catch (err) {
    console.error('[pets PATCH]', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// DELETE /api/pets/:id  – eliminar mascota
router.delete('/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'shelter') {
    return res.status(403).json({ error: 'Acceso denegado.' });
  }
  try {
    const shelter = await prisma.shelters.findUnique({ where: { user_id: req.user.sub } });
    const pet     = await prisma.pets.findUnique({ where: { id: req.params.id } });

    if (!pet || pet.shelter_id !== shelter?.id) {
      return res.status(404).json({ error: 'Mascota no encontrada o sin permisos.' });
    }

    await prisma.pets.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    console.error('[pets DELETE]', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

module.exports = router;
