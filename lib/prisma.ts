// lib/prisma.ts
//
// Exports a single, reusable PrismaClient instance for the whole app.
//
// Prisma 7 change: PrismaClient no longer reads the database URL from
// schema.prisma. You must provide a "driver adapter" that handles the
// connection. We use @prisma/adapter-pg (the official PostgreSQL adapter).
//
// Before this file will work you must install:
//   npm install @prisma/adapter-pg pg
//   npm install --save-dev @types/pg
//
// Why a singleton?
//   Next.js restarts module code on every hot-reload in development.
//   Without the globalThis trick, each reload opens a new database connection
//   and you quickly exhaust PostgreSQL's connection limit.
//
// Usage in a Server Component or Route Handler:
//   import { prisma } from "@/lib/prisma";
//   const items = await prisma.inventoryItem.findMany();

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and fill in your database URL."
    );
  }

  // PrismaPg opens a connection pool to PostgreSQL using the `pg` library.
  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
    // Log SQL queries and warnings in development to help with debugging.
    // In production only errors are logged to avoid leaking sensitive data.
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["error"],
  });
}

// Extend the global type so TypeScript knows about our cached client.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createClient();

// Cache the client on globalThis in non-production environments only.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
