// Server Component — no "use client".
// This file runs on the server, so it can safely import Prisma and query the DB.
// It converts all Prisma types (Decimal, Date) to plain numbers/strings before
// passing them as props to the Client Component, which requires serializable data.

import Link from "next/link";
import { getInventoryItems } from "@/lib/db/inventory";
import { Status } from "@prisma/client";
import { formatCurrency } from "@/lib/mock-data";
import InventoryTable, { type InventoryRow } from "./InventoryTable";

export default async function InventoryPage() {
  // Fetch all inventory items for the demo user, each with its linked Sale.
  let items;
  try {
    items = await getInventoryItems();
  } catch {
    return (
      <div>
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Inventory</h2>
            <p className="text-slate-500 mt-1">
              Manage and track all your resale inventory items.
            </p>
          </div>
          <Link
            href="/inventory/new"
            className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            + Add Item
          </Link>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 font-medium">Could not load inventory.</p>
          <p className="text-red-500 text-sm mt-1">
            Make sure DATABASE_URL is set in .env and your database is running.
          </p>
        </div>
      </div>
    );
  }

  const today = new Date();

  // Convert each Prisma row into a plain object for the Client Component.
  // Decimal → number (.toNumber()), Date → age in days (a plain number).
  const rows: InventoryRow[] = items.map((item) => {
    const purchasePrice = item.purchasePrice.toNumber();
    const listPrice     = item.listPrice.toNumber();
    const hasSale       = item.sale !== null;

    // Days the item spent / has spent in inventory.
    // Sold items: purchaseDate → soldDate.  Others: purchaseDate → today.
    const startMs = item.purchaseDate.getTime();
    const endMs   = item.sale ? item.sale.soldDate.getTime() : today.getTime();
    const inventoryAge = Math.floor((endMs - startMs) / 86_400_000);

    // Estimated profit:
    //   Sold  → the stored netProfit (already accounts for all fees)
    //   Unsold → listPrice − purchasePrice (fees are unknown until sold)
    const estimatedProfit = hasSale
      ? item.sale!.netProfit.toNumber()
      : listPrice - purchasePrice;

    return {
      id: item.id,
      itemName: item.itemName,
      sku: item.sku,
      category: item.category,   // Prisma enum key, e.g. "TradingCards"
      platform: item.platform,   // Prisma enum key, e.g. "FacebookMarketplace"
      purchasePrice,
      listPrice,
      status: item.status,       // "Active" | "Sold" | "Draft" | "Archived"
      inventoryAge,
      estimatedProfit,
      hasSale,
    };
  });

  // Summary card values — computed from the full dataset before any filtering.
  const totalItems  = rows.length;
  const activeCount = items.filter((i) => i.status === Status.Active).length;
  const soldCount   = items.filter((i) => i.status === Status.Sold).length;
  const totalCost   = rows.reduce((sum, r) => sum + r.purchasePrice, 0);

  return (
    <div>
      {/* Page header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Inventory</h2>
          <p className="text-slate-500 mt-1">
            Manage and track all your resale inventory items.
          </p>
        </div>
        <Link
          href="/inventory/new"
          className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + Add Item
        </Link>
      </div>

      {/* Summary cards — static, rendered on the server */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <p className="text-sm text-slate-500">Total Items</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalItems}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <p className="text-sm text-slate-500">Active Items</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{activeCount}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <p className="text-sm text-slate-500">Sold Items</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{soldCount}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <p className="text-sm text-slate-500">Total Inventory Cost</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {formatCurrency(totalCost)}
          </p>
        </div>
      </div>

      {/* Interactive table — Client Component handles search, filter, and sort */}
      <InventoryTable items={rows} />
    </div>
  );
}
