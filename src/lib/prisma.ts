import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { join } from 'path';
import { pathToFileURL } from 'url';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

// Ensure we have a valid absolute URL for the database
const dbPath = join(process.cwd(), 'dev.db');
let url = process.env.DATABASE_URL || pathToFileURL(dbPath).toString();

if (url.startsWith('file:./') || url.startsWith('file:.\\')) {
    // Convert relative file URL from .env to absolute
    url = pathToFileURL(dbPath).toString();
}

console.log("PrismaLibSql URL:", url);

const adapter = new PrismaLibSql({
  url,
  authToken: process.env.TURSO_AUTH_TOKEN
})

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
