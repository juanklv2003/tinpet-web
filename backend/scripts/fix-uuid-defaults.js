require('dotenv').config();
const { Pool } = require('pg');

const statements = [
  'ALTER TABLE adopters ALTER COLUMN id SET DEFAULT gen_random_uuid()',
  'ALTER TABLE matches ALTER COLUMN id SET DEFAULT gen_random_uuid()',
  'ALTER TABLE medical_records ALTER COLUMN id SET DEFAULT gen_random_uuid()',
  'ALTER TABLE pets ALTER COLUMN id SET DEFAULT gen_random_uuid()',
  'ALTER TABLE shelter_employees ALTER COLUMN id SET DEFAULT gen_random_uuid()',
  'ALTER TABLE shelters ALTER COLUMN id SET DEFAULT gen_random_uuid()',
  'ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid()',
  'ALTER TABLE vet_clinics ALTER COLUMN id SET DEFAULT gen_random_uuid()',
  'ALTER TABLE vet_employees ALTER COLUMN id SET DEFAULT gen_random_uuid()',
];

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    for (const statement of statements) {
      await pool.query(statement);
      console.log(`OK: ${statement}`);
    }
    console.log('UUID defaults fixed successfully.');
  } catch (error) {
    console.error('Failed to fix UUID defaults:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
