// prisma/seed.ts
//
// Run with: npx prisma db seed
// Configured in package.json under "prisma.seed".
//
// Creates a single demo user with a fixed ID so all development data
// has a known owner. When auth is added, real users will be created
// through the auth flow instead — this seed is dev-only.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Fixed ID so seeds are idempotent: re-running never creates a duplicate.
export const DEMO_USER_ID = "demo-user-0000000000000001";

async function main() {
  const user = await prisma.user.upsert({
    where: { id: DEMO_USER_ID },
    update: {},
    create: {
      id: DEMO_USER_ID,
      email: "demo@marginiq.dev",
      name: "Demo User",
    },
  });

  console.log(`Demo user ready: ${user.email} (${user.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
