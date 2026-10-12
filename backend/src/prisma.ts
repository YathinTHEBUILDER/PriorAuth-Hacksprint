import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

function resolveDatabaseUrl(): string | undefined {
  // If running on Vercel Serverless environment
  if (process.env.VERCEL) {
    const tmpDbPath = '/tmp/dev.db';
    const candidatePaths = [
      path.resolve(process.cwd(), 'prisma', 'dev.db'),
      path.resolve(process.cwd(), 'backend', 'prisma', 'dev.db'),
      path.resolve(process.cwd(), 'dev.db'),
    ];

    if (!fs.existsSync(tmpDbPath)) {
      for (const candidate of candidatePaths) {
        if (fs.existsSync(candidate)) {
          try {
            fs.copyFileSync(candidate, tmpDbPath);
            console.log(`✓ Copied SQLite template to ${tmpDbPath}`);
            break;
          } catch (err) {
            console.error('Warning: Failed copying DB template to /tmp:', err);
          }
        }
      }
    }
    return `file:${tmpDbPath}`;
  }

  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  // Local fallback resolution
  const localCandidates = [
    path.resolve(process.cwd(), 'prisma', 'dev.db'),
    path.resolve(process.cwd(), 'backend', 'prisma', 'dev.db'),
  ];

  for (const candidate of localCandidates) {
    if (fs.existsSync(candidate)) {
      return `file:${candidate}`;
    }
  }

  return 'file:./prisma/dev.db';
}

const dbUrl = resolveDatabaseUrl();
if (dbUrl && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = dbUrl;
}

const prisma = new PrismaClient({
  datasources: dbUrl
    ? {
        db: {
          url: dbUrl,
        },
      }
    : undefined,
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

export default prisma;

