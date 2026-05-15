// prisma.config.ts
//
// This file is new in Prisma 7. It provides the database connection URL to
// Prisma CLI commands like:
//   npx prisma migrate dev    → creates/updates tables in the database
//   npx prisma db push        → pushes the schema to the database (no migration file)
//   npx prisma studio         → opens a GUI to browse your data
//
// This file is NOT used at runtime by Next.js — that's handled in lib/prisma.ts.
//
// Docs: https://www.prisma.io/docs/orm/reference/prisma-config-reference

//import { defineConfig } from "@prisma/config";

//export default defineConfig({
  // The datasource URL for Prisma migration commands (migrate dev, db push, studio).
  // process.env.DATABASE_URL is read from your .env file at runtime.
  // This is intentionally not required here so `prisma generate` works without a DB.
  // Migrate commands will fail with a clear error if DATABASE_URL is missing.
//  datasource: {
//    url: process.env.DATABASE_URL,
 // },
// }); 

// #####################

// prisma.config.ts
//
// Prisma CLI config for commands like:
//   npx prisma migrate dev
//   npx prisma db push
//   npx prisma studio
//
// This loads DATABASE_URL from .env and passes it to Prisma CLI.

import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});

