const express = require('express');
const prisma = require('../lib/prisma');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.get('/stats', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [totalUsers, activeShelters, monthlyAdoptions] = await Promise.all([
      prisma.users.count(),
      prisma.shelters.count(),
      prisma.pets.count({
        where: {
          status: 'adoptado',
          // Optionally add date filter if registration/adoption date is tracked
        }
      })
    ]);

    res.json({
      totalUsers,
      activeShelters,
      adoptionsThisMonth: monthlyAdoptions,
      openIncidents: 0 // Mock for now
    });
  } catch (err) {
    console.error('[Admin Stats Error]', err);
    res.status(500).json({ error: 'Error al obtener estadísticas de admin' });
  }
});

module.exports = router;
