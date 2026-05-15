// lib/db/sales.ts
//
// Server-side data access functions for Sale.
// Import these in Server Components, Route Handlers, or Server Actions —
// never in "use client" files, because they use Prisma which is Node.js-only.
//
// All functions scope their queries to DEMO_USER_ID until real auth is added.
//
// createSale automatically computes the derived financial fields
// (totalFees, payout, netProfit, profitMargin, roi) using the same
// calculateMarketplaceFees logic as prisma/seed.ts.

import { prisma } from "@/lib/prisma";
import { Platform, Status } from "@prisma/client";
import { calculateMarketplaceFees } from "@/lib/fee-calculations";

// The fixed demo user created by `npx prisma db seed`.
// Swap this for the real session user ID once authentication is added.
const DEMO_USER_ID = "demo-user-0000000000000001";

// ── Input types ────────────────────────────────────────────────────────────────

export type CreateSaleData = {
  inventoryItemId: string;
  platform: Platform;
  salePrice: number;
  // The item's purchase price — needed to compute netProfit.
  // Fetch it from getInventoryItemById() before calling createSale.
  purchasePrice: number;
  // Extra out-of-pocket shipping the seller paid (eBay orders only).
  // Leave at 0 for StockX / GOAT / Facebook Marketplace.
  sellerShipping?: number;
  soldDate: Date;
};

// For updates, pass only the stored columns you want to change.
// If you change a financial field (salePrice, fees, etc.) you are responsible
// for passing corrected values for the computed columns (totalFees, payout,
// netProfit, profitMargin, roi) as well so the data stays consistent.
export type UpdateSaleData = {
  platform?: Platform;
  salePrice?: number;
  shippingCost?: number;
  platformFee?: number;
  paymentFee?: number;
  totalFees?: number;
  payout?: number;
  netProfit?: number;
  profitMargin?: number;
  roi?: number;
  soldDate?: Date;
};

// ── Internal helpers ───────────────────────────────────────────────────────────

// Derives all stored financial columns from the four raw inputs.
// Mirrors the same calculation used in prisma/seed.ts so the numbers
// are always consistent regardless of where a Sale record is created.
function computeSaleFields(
  platform: Platform,
  salePrice: number,
  purchasePrice: number,
  sellerShipping = 0
) {
  const fees = calculateMarketplaceFees(platform as string, salePrice);

  const shippingCost = r2(fees.shippingFee + sellerShipping);
  const platformFee  = fees.platformFee;
  const paymentFee   = fees.paymentFee;
  const totalFees    = r2(shippingCost + platformFee + paymentFee);
  const payout       = r2(salePrice - totalFees);
  const netProfit    = r2(payout - purchasePrice);
  const profitMargin = salePrice     > 0 ? r4((netProfit / salePrice)     * 100) : 0;
  const roi          = purchasePrice > 0 ? r4((netProfit / purchasePrice) * 100) : 0;

  return { shippingCost, platformFee, paymentFee, totalFees, payout, netProfit, profitMargin, roi };
}

function r2(n: number) { return Math.round(n * 100)   / 100;   }
function r4(n: number) { return Math.round(n * 10000) / 10000; }

// ── Read ───────────────────────────────────────────────────────────────────────

// Returns all sales for the demo user, most recently sold first.
// Each sale includes the linked InventoryItem so you can read itemName, sku, etc.
export async function getSales() {
  return prisma.sale.findMany({
    where: { userId: DEMO_USER_ID },
    include: { inventoryItem: true },
    orderBy: { soldDate: "desc" },
  });
}

// Returns one sale by its ID, or null if it does not exist.
export async function getSaleById(id: string) {
  return prisma.sale.findFirst({
    where: { id, userId: DEMO_USER_ID },
    include: { inventoryItem: true },
  });
}

// ── Write ──────────────────────────────────────────────────────────────────────

// Creates a Sale record and updates the linked InventoryItem status to Sold.
// Both changes are wrapped in a transaction — either both succeed or neither does.
// All derived financial columns (totalFees, payout, netProfit, etc.) are computed
// automatically from salePrice, purchasePrice, and sellerShipping.
export async function createSale(data: CreateSaleData) {
  const computed = computeSaleFields(
    data.platform,
    data.salePrice,
    data.purchasePrice,
    data.sellerShipping ?? 0
  );

  return prisma.$transaction(async (tx) => {
    const sale = await tx.sale.create({
      data: {
        userId:          DEMO_USER_ID,
        inventoryItemId: data.inventoryItemId,
        platform:        data.platform,
        salePrice:       data.salePrice,
        soldDate:        data.soldDate,
        shippingCost:    computed.shippingCost,
        platformFee:     computed.platformFee,
        paymentFee:      computed.paymentFee,
        totalFees:       computed.totalFees,
        payout:          computed.payout,
        netProfit:       computed.netProfit,
        profitMargin:    computed.profitMargin,
        roi:             computed.roi,
      },
    });

    // Mark the inventory item as Sold now that a Sale record exists.
    await tx.inventoryItem.update({
      where: { id: data.inventoryItemId, userId: DEMO_USER_ID },
      data: { status: Status.Sold },
    });

    return sale;
  });
}

// Updates a sale. Pass only the columns you want to change.
// Throws a Prisma error if the sale does not exist or does not belong to the demo user.
export async function updateSale(id: string, data: UpdateSaleData) {
  return prisma.sale.update({
    where: { id, userId: DEMO_USER_ID },
    data,
  });
}

// Permanently deletes a sale record.
// Note: this does NOT change the linked InventoryItem status back to Active.
// If you want to "un-sell" an item, call updateInventoryItem() afterwards.
export async function deleteSale(id: string) {
  return prisma.sale.delete({
    where: { id, userId: DEMO_USER_ID },
  });
}
