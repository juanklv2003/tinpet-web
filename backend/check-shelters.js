require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const shelters = await prisma.shelters.findMany();
  console.log('--- SHELTERS ---');
  console.dir(shelters, { depth: null });
  const users = await prisma.users.findMany();
  console.log('--- USERS ---');
  console.dir(users.map(u => ({ id: u.id, email: u.email, role: u.role })), { depth: null });
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});
