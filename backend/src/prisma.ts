import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error('DATABASE_URL is required. Configure the Supabase Postgres connection string before starting the API.');
}

const prisma = new PrismaClient({
  datasources: { db: { url: dbUrl } },
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

export default prisma;

