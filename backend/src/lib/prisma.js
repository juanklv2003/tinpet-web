require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
	throw new Error('DATABASE_URL is required to initialize Prisma');
}

const pool = new Pool({ 
	connectionString,
	max: 10,
	idleTimeoutMillis: 30000,
	connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
	console.error('Unexpected error on idle client', err);
});
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

module.exports = prisma;
