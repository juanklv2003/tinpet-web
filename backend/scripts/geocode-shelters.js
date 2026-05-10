/**
 * One-time script to geocode shelter/vet text locations into lat/lng.
 * Uses Nominatim (OpenStreetMap) — FREE, no API key needed.
 * Rate-limited to 1 req/sec as per Nominatim usage policy.
 *
 * Usage: node scripts/geocode-shelters.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "TinpetApp/1.0 (geocoding script)";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function geocode(address) {
  if (!address || !address.trim()) return null;

  const params = new URLSearchParams({
    q: address + ", España",
    format: "json",
    limit: "1",
  });

  try {
    const response = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      console.error(`  [ERROR] HTTP ${response.status} for "${address}"`);
      return null;
    }

    const data = await response.json();
    if (data.length === 0) {
      console.error(`  [ERROR] No results for "${address}"`);
      return null;
    }

    return {
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon),
    };
  } catch (error) {
    console.error(`  [ERROR] Failed to geocode "${address}": ${error.message}`);
    return null;
  }
}

async function main() {
  console.log("=== Geocoding Shelter Locations ===\n");

  // Get all shelters with text location but no coordinates
  const shelters = await prisma.shelters.findMany({
    where: {
      location: { not: null },
      NOT: { location: "" },
      latitude: null,
    },
    select: { id: true, name: true, location: true },
  });

  console.log(`Found ${shelters.length} shelters to geocode:\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < shelters.length; i++) {
    const s = shelters[i];
    console.log(`[${i + 1}/${shelters.length}] ${s.name}`);
    console.log(`  Address: "${s.location}"`);

    // Respect Nominatim's 1 req/sec rate limit
    await sleep(1000);

    const coords = await geocode(s.location);
    if (coords) {
      await prisma.shelters.update({
        where: { id: s.id },
        data: {
          latitude: coords.latitude,
          longitude: coords.longitude,
        },
      });
      console.log(`  ✅ ${coords.latitude}, ${coords.longitude}`);
      successCount++;
    } else {
      console.log(`  ❌ Could not geocode`);
      failCount++;
    }
  }

  // Also check vet_clinics
  console.log("\n=== Checking Vet Clinics ===\n");
  const vets = await prisma.vet_clinics.findMany({
    where: {
      location: { not: null },
      NOT: { location: "" },
      latitude: null,
    },
    select: { id: true, name: true, location: true },
  });

  console.log(`Found ${vets.length} vet clinics to geocode:\n`);

  for (let i = 0; i < vets.length; i++) {
    const v = vets[i];
    console.log(`[${i + 1}/${vets.length}] ${v.name}`);
    console.log(`  Address: "${v.location}"`);

    await sleep(1000);

    const coords = await geocode(v.location);
    if (coords) {
      await prisma.vet_clinics.update({
        where: { id: v.id },
        data: {
          latitude: coords.latitude,
          longitude: coords.longitude,
        },
      });
      console.log(`  ✅ ${coords.latitude}, ${coords.longitude}`);
      successCount++;
    } else {
      console.log(`  ❌ Could not geocode`);
      failCount++;
    }
  }

  console.log("\n=== Done ===");
  console.log(`✅ ${successCount} geocoded successfully`);
  console.log(`❌ ${failCount} failed`);
  console.log(`📍 ${successCount + failCount} total processed`);

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Script failed:", error);
  process.exit(1);
});
