const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function dump() {
  try {
    const profiles = await prisma.adopters.findMany({
       take: 5,
       orderBy: { created_at: 'desc' },
       select: {
         id: true,
         user_id: true,
         name: true,
         has_other_pets: true,
         other_pets_desc: true,
         has_children: true,
         kids_count: true,
         kids_ages: true,
       }
    });
    console.log('--- ADOPTER PROFILES IN DB ---');
    console.log(JSON.stringify(profiles, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

dump();
