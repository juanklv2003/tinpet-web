require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const adopters = await prisma.adopters.findMany({ select: { id:true, kids_count: true, kids_ages: true, other_pets_desc: true } });
  console.dir(adopters, { depth: null });
}
main().catch(console.error).finally(() => prisma.$disconnect());