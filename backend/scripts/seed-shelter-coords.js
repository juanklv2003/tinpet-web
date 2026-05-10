/**
 * Seed example coordinates for shelters (since their profile data
 * is stored in localStorage on the web frontend, not in the backend).
 *
 * Usage: node scripts/seed-shelter-coords.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const coords = {
  "refugio nene": { latitude: 42.0879, longitude: -8.6412 },   // Salceda de Caselas, Pontevedra
  "refugio carlos": { latitude: 40.4168, longitude: -3.7038 },  // Madrid
  "refugio aroa": { latitude: 41.3874, longitude: 2.1686 },     // Barcelona
};

async function main() {
  const result = await pool.query("SELECT id, name FROM shelters");
  
  for (const row of result.rows) {
    const match = coords[row.name.toLowerCase()];
    if (match) {
      await pool.query(
        "UPDATE shelters SET latitude = $1, longitude = $2 WHERE id = $3",
        [match.latitude, match.longitude, row.id]
      );
      console.log(`✅ ${row.name}: ${match.latitude}, ${match.longitude}`);
    } else {
      console.log(`⚠️  No coordinates for "${row.name}"`);
    }
  }

  await pool.end();
  console.log("\n✨ Done!");
}

main().catch(e => { console.error(e); process.exit(1); });
