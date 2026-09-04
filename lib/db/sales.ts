// Server-side data access functions for Sale.
// All queries use the demo user until authentication is added.

import { prisma } from "@/lib/prisma";
import { Platform, Status } from "@prisma/client";
import { calculateSaleFinancials } from "@/lib/fee-calculations";

const DEMO_USER_ID = "demo-user-0000000000000001";

export type CreateSaleData = {
  inventoryItemId: string;
  platform: Platform;
  salePrice: number;
  // Additional out-of-pocket shipping paid by the seller.
  shippingCost?: number;
  soldDate: Date;
};

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

export type SaleCreationErrorCode =
  | "not-found"
  | "duplicate-sale"
  | "not-eligible"
  | "invalid-purchase-price";

export class SaleCreationError extends Error {
  constructor(public readonly code: SaleCreationErrorCode) {
    super(code);
    this.name = "SaleCreationError";
  }
}

// Returns all sales for the demo user, most recently sold first.
// Each sale includes the linked InventoryItem.
export async function getSales() {
  return prisma.sale.findMany({
    where: { userId: DEMO_USER_ID },
    include: { inventoryItem: true },
    orderBy: { soldDate: "desc" },
  });
}

export async function getSaleById(id: string) {
  return prisma.sale.findFirst({
    where: { id, userId: DEMO_USER_ID },
    include: { inventoryItem: true },
  });
}

// Creates the Sale and changes the related InventoryItem to Sold atomically.
// Eligibility and purchase price are read from the database inside the
// transaction so submitted or stale client data cannot bypass these rules.
export async function createSale(data: CreateSaleData) {
  return prisma.$transaction(async (tx) => {
    const item = await tx.inventoryItem.findFirst({
      where: { id: data.inventoryItemId, userId: DEMO_USER_ID },
      select: {
        status: true,
        purchasePrice: true,
        sale: { select: { id: true } },
      },
    });

    if (!item) throw new SaleCreationError("not-found");
    if (item.sale) throw new SaleCreationError("duplicate-sale");
    if (item.status !== Status.Active) {
      throw new SaleCreationError("not-eligible");
    }

    const purchasePrice = item.purchasePrice.toNumber();
    if (!Number.isFinite(purchasePrice) || purchasePrice <= 0) {
      throw new SaleCreationError("invalid-purchase-price");
    }

    const computed = calculateSaleFinancials(
      data.platform,
      data.salePrice,
      purchasePrice,
      data.shippingCost ?? 0
    );

    // Claim the Active item before creating the Sale. If another request has
    // already changed it, throwing here rolls back the whole transaction.
    const statusUpdate = await tx.inventoryItem.updateMany({
      where: {
        id: data.inventoryItemId,
        userId: DEMO_USER_ID,
        status: Status.Active,
        sale: null,
      },
      data: { status: Status.Sold },
    });

    if (statusUpdate.count !== 1) {
      throw new SaleCreationError("not-eligible");
    }

    return tx.sale.create({
      data: {
        userId: DEMO_USER_ID,
        inventoryItemId: data.inventoryItemId,
        platform: data.platform,
        salePrice: data.salePrice,
        soldDate: data.soldDate,
        shippingCost: computed.shippingCost,
        platformFee: computed.platformFee,
        paymentFee: computed.paymentFee,
        totalFees: computed.totalFees,
        payout: computed.payout,
        netProfit: computed.netProfit,
        profitMargin: computed.profitMargin,
        roi: computed.roi,
      },
    });
  });
}

// If financial inputs change, callers must also update the derived columns.
export async function updateSale(id: string, data: UpdateSaleData) {
  return prisma.sale.update({
    where: { id, userId: DEMO_USER_ID },
    data,
  });
}

// Deleting a Sale does not automatically reactivate its inventory item.
export async function deleteSale(id: string) {
  return prisma.sale.delete({
    where: { id, userId: DEMO_USER_ID },
  });
}
