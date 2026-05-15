// lib/db/inventory.ts
//
// Server-side data access functions for InventoryItem.
// Import these in Server Components, Route Handlers, or Server Actions —
// never in "use client" files, because they use Prisma which is Node.js-only.
//
// All functions scope their queries to DEMO_USER_ID until real auth is added.

import { prisma } from "@/lib/prisma";
import { Category, Platform, Status } from "@prisma/client";

// The fixed demo user created by `npx prisma db seed`.
// Swap this for the real session user ID once authentication is added.
const DEMO_USER_ID = "demo-user-0000000000000001";

// ── Input types ────────────────────────────────────────────────────────────────
// These describe the data a caller must provide to create or update an item.
// Prisma-managed fields (id, userId, createdAt, updatedAt, sale) are excluded.

export type CreateInventoryItemData = {
  itemName: string;
  sku: string;
  category: Category;
  platform: Platform;
  purchasePrice: number;
  listPrice: number;
  status: Status;
  purchaseDate: Date;
  listedDate?: Date | null;
};

// Partial makes every field optional — only pass the fields you want to change.
export type UpdateInventoryItemData = Partial<CreateInventoryItemData>;

// ── Read ───────────────────────────────────────────────────────────────────────

// Returns all inventory items for the demo user, newest first.
// Each item includes its linked Sale record (null if the item has not been sold yet).
export async function getInventoryItems() {
  return prisma.inventoryItem.findMany({
    where: { userId: DEMO_USER_ID },
    include: { sale: true },
    orderBy: { createdAt: "desc" },
  });
}

// Returns one inventory item by its ID, or null if it does not exist.
export async function getInventoryItemById(id: string) {
  return prisma.inventoryItem.findFirst({
    where: { id, userId: DEMO_USER_ID },
    include: { sale: true },
  });
}

// ── Write ──────────────────────────────────────────────────────────────────────

// Creates a new inventory item owned by the demo user.
export async function createInventoryItem(data: CreateInventoryItemData) {
  return prisma.inventoryItem.create({
    data: {
      ...data,
      userId: DEMO_USER_ID,
    },
  });
}

// Updates an existing inventory item. Only the fields you pass are changed.
// Throws a Prisma error if the item does not exist or does not belong to the demo user.
export async function updateInventoryItem(
  id: string,
  data: UpdateInventoryItemData
) {
  return prisma.inventoryItem.update({
    where: { id, userId: DEMO_USER_ID },
    data,
  });
}

// Sets an item's status to Archived. A shortcut for updateInventoryItem.
export async function archiveInventoryItem(id: string) {
  return updateInventoryItem(id, { status: Status.Archived });
}

// Permanently deletes an inventory item and its linked Sale (if one exists).
// The sale must be deleted first to satisfy the foreign key constraint.
export async function deleteInventoryItem(id: string) {
  return prisma.$transaction(async (tx) => {
    // Delete the linked sale first so the foreign key constraint is not violated.
    await tx.sale.deleteMany({
      where: { inventoryItemId: id, userId: DEMO_USER_ID },
    });

    return tx.inventoryItem.delete({
      where: { id, userId: DEMO_USER_ID },
    });
  });
}
