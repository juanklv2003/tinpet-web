require('dotenv').config();
const { Pool } = require('pg');

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const userId = '16382464-1d54-4ae2-b004-c06b1fb208de';
  const before = await pool.query('SELECT id, user_id, other_pets_desc FROM adopters WHERE user_id = $1', [userId]);
  console.log('before', before.rows);
  const updated = await pool.query('UPDATE adopters SET other_pets_desc = $1 WHERE user_id = $2 RETURNING id, user_id, other_pets_desc', [['perro', 'gato'], userId]);
  console.log('updated', updated.rows);
  const after = await pool.query('SELECT id, user_id, other_pets_desc FROM adopters WHERE user_id = $1', [userId]);
  console.log('after', after.rows);
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
