require('dotenv').config();
const { Pool } = require('pg');

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const userId = '2251da32-3360-46d0-aeb1-7dec4c87ec02';
  const rows = await pool.query('SELECT id, user_id, has_other_pets, other_pets_desc FROM adopters WHERE user_id = $1', [userId]);
  console.log(rows.rows);
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
