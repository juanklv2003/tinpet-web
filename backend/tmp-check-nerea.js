require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

(async () => {
  const adopter = await prisma.adopters.findFirst({
    where: { name: { contains: 'Nerea', mode: 'insensitive' } },
    select: { id: true, name: true, avatar_url: true, photos: true, description: true, email: true, phone: true },
  });
  console.log(JSON.stringify(adopter, null, 2));
  await prisma.$disconnect();
  await pool.end();
})().catch(async (error) => {
  console.error(error);
  try { await prisma.$disconnect(); } catch {}
  try { await pool.end(); } catch {}
  process.exit(1);
});
