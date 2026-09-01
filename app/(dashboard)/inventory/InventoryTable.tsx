"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SortArrow from "@/app/components/SortArrow";
import { archiveItemAction, deleteItemAction } from "./actions";

// ─── Types ────────────────────────────────────────────────────────────────────
// All fields are plain primitives (number, string, boolean) so they can be
// safely passed as props from the Server Component. Decimal and Date objects
// from Prisma are converted before reaching this component.

export type InventoryRow = {
  id: string;
  itemName: string;
  sku: string;
  category: string;   // Prisma enum key e.g. "TradingCards"
  platform: string;   // Prisma enum key e.g. "FacebookMarketplace"
  purchasePrice: number;
  listPrice: number;
  status: string;     // "Active" | "Sold" | "Draft" | "Archived"
  inventoryAge: number; // days
  estimatedProfit: number;
  hasSale: boolean;   // true for sold items (affects profit display)
};

// ─── Display helpers ──────────────────────────────────────────────────────────
// Prisma returns TypeScript enum key names, not the @map database strings.
// "FacebookMarketplace" is stored as "Facebook Marketplace" in the DB, but
// Prisma gives us "FacebookMarketplace" — so we map it back for the UI.

const PLATFORM_DISPLAY: Record<string, string> = {
  FacebookMarketplace: "Facebook Marketplace",
};

const CATEGORY_DISPLAY: Record<string, string> = {
  TradingCards: "Trading Cards",
};

function showPlatform(p: string) {
  return PLATFORM_DISPLAY[p] ?? p;
}

function showCategory(c: string) {
  return CATEGORY_DISPLAY[c] ?? c;
}

function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

const STATUS_BADGE: Record<string, string> = {
  Active:   "bg-emerald-100 text-emerald-700",
  Sold:     "bg-indigo-100 text-indigo-700",
  Draft:    "bg-amber-100 text-amber-700",
  Archived: "bg-slate-100 text-slate-500",
};

type SortField = "purchasePrice" | "listPrice" | "inventoryAge" | "estimatedProfit";
type SortDir = "asc" | "desc";

// ─── Component ────────────────────────────────────────────────────────────────

export default function InventoryTable({ items }: { items: InventoryRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [platformFilter, setPlatformFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sortField, setSortField] = useState<SortField>("purchasePrice");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InventoryRow | null>(null);
  const [notice, setNotice] = useState<{ success: boolean; message: string } | null>(null);

  function runArchive(item: InventoryRow) {
    setNotice(null);
    setPendingItemId(item.id);
    startTransition(async () => {
      const result = await archiveItemAction(item.id);
      setNotice(result);
      setPendingItemId(null);
      if (result.success) router.refresh();
    });
  }

  function confirmDelete() {
    if (!deleteTarget) return;

    const item = deleteTarget;
    setNotice(null);
    setPendingItemId(item.id);
    startTransition(async () => {
      const result = await deleteItemAction(item.id);
      setNotice(result);
      setPendingItemId(null);
      setDeleteTarget(null);
      if (result.success) router.refresh();
    });
  }

  // Apply search and filters
  const query = search.toLowerCase();

  const filtered = items.filter((item) => {
    const matchesSearch =
      !query ||
      item.itemName.toLowerCase().includes(query) ||
      item.sku.toLowerCase().includes(query) ||
      showCategory(item.category).toLowerCase().includes(query) ||
      showPlatform(item.platform).toLowerCase().includes(query);

    const matchesStatus   = statusFilter   === "All" || item.status   === statusFilter;
    const matchesPlatform = platformFilter === "All" || item.platform === platformFilter;
    const matchesCategory = categoryFilter === "All" || item.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesPlatform && matchesCategory;
  });

  // Apply sorting
  const sorted = [...filtered].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    return sortDir === "asc" ? aVal - bVal : bVal - aVal;
  });

  // Toggle sort: same column flips direction, new column resets to desc
  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  return (
    <>
      {notice && (
        <div
          role="status"
          className={`mb-4 rounded-lg border p-3 text-sm ${
            notice.success
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {notice.message}
        </div>
      )}
      {/* Search + Filters */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Text search */}
          <input
            type="text"
            placeholder="Search by name, SKU, category, or platform…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Sold">Sold</option>
            <option value="Draft">Draft</option>
            <option value="Archived">Archived</option>
          </select>

          {/* Platform filter — option values match Prisma enum key names */}
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Platforms</option>
            <option value="eBay">eBay</option>
            <option value="StockX">StockX</option>
            <option value="GOAT">GOAT</option>
            <option value="FacebookMarketplace">Facebook Marketplace</option>
          </select>

          {/* Category filter — option values match Prisma enum key names */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Categories</option>
            <option value="Sneakers">Sneakers</option>
            <option value="TradingCards">Trading Cards</option>
            <option value="Electronics">Electronics</option>
            <option value="Collectibles">Collectibles</option>
            <option value="Apparel">Apparel</option>
          </select>
        </div>
      </div>

      {/* Inventory table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-medium text-slate-600">
                  Item Name
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">
                  SKU
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">
                  Category
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">
                  Platform
                </th>
                <th
                  className="text-right px-4 py-3 font-medium text-slate-600 cursor-pointer select-none whitespace-nowrap"
                  onClick={() => handleSort("purchasePrice")}
                >
                  Purchase Price
                  <SortArrow field="purchasePrice" sortField={sortField} sortDir={sortDir} />
                </th>
                <th
                  className="text-right px-4 py-3 font-medium text-slate-600 cursor-pointer select-none whitespace-nowrap"
                  onClick={() => handleSort("listPrice")}
                >
                  List Price
                  <SortArrow field="listPrice" sortField={sortField} sortDir={sortDir} />
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">
                  Status
                </th>
                <th
                  className="text-right px-4 py-3 font-medium text-slate-600 cursor-pointer select-none whitespace-nowrap"
                  onClick={() => handleSort("inventoryAge")}
                >
                  Age (days)
                  <SortArrow field="inventoryAge" sortField={sortField} sortDir={sortDir} />
                </th>
                <th
                  className="text-right px-4 py-3 font-medium text-slate-600 cursor-pointer select-none whitespace-nowrap"
                  onClick={() => handleSort("estimatedProfit")}
                >
                  Est. Profit
                  <SortArrow field="estimatedProfit" sortField={sortField} sortDir={sortDir} />
                </th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-slate-400 text-sm">
                    No inventory items yet. Add your first item to get started.
                  </td>
                </tr>
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-slate-400 text-sm">
                    No items match your search or filters.
                  </td>
                </tr>
              ) : (
                sorted.map((item) => {
                  const profitColor =
                    item.estimatedProfit > 0
                      ? "text-emerald-600"
                      : item.estimatedProfit < 0
                      ? "text-red-500"
                      : "text-slate-500";

                  return (
                    <tr
                      key={item.id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      {/* Item Name */}
                      <td className="px-4 py-3 text-slate-900 font-medium max-w-xs">
                        <span className="line-clamp-2 leading-snug">
                          {item.itemName}
                        </span>
                      </td>

                      {/* SKU */}
                      <td className="px-4 py-3 text-slate-500 font-mono text-xs whitespace-nowrap">
                        {item.sku}
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {showCategory(item.category)}
                      </td>

                      {/* Platform */}
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {showPlatform(item.platform)}
                      </td>

                      {/* Purchase Price */}
                      <td className="px-4 py-3 text-right text-slate-700 whitespace-nowrap">
                        {formatCurrency(item.purchasePrice)}
                      </td>

                      {/* List Price — "—" when there is no list price */}
                      <td className="px-4 py-3 text-right text-slate-700 whitespace-nowrap">
                        {item.listPrice > 0 ? formatCurrency(item.listPrice) : "—"}
                      </td>

                      {/* Status badge */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[item.status] ?? "bg-slate-100 text-slate-500"}`}
                        >
                          {item.status}
                        </span>
                      </td>

                      {/* Inventory Age */}
                      <td className="px-4 py-3 text-right text-slate-700 whitespace-nowrap">
                        {item.inventoryAge}d
                      </td>

                      {/* Estimated Profit
                            Sold items: exact profit (no tilde)
                            Unsold with list price: estimated profit with "~" prefix
                            Unsold with no list price: "—" */}
                      <td
                        className={`px-4 py-3 text-right font-medium whitespace-nowrap ${profitColor}`}
                      >
                        {item.hasSale
                          ? formatCurrency(item.estimatedProfit)
                          : item.listPrice > 0
                          ? `~${formatCurrency(item.estimatedProfit)}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            href={`/inventory/${item.id}/edit`}
                            className="font-medium text-indigo-600 hover:text-indigo-800"
                          >
                            Edit
                          </Link>
                          {(item.status === "Active" || item.status === "Draft") && (
                            <button
                              type="button"
                              onClick={() => runArchive(item)}
                              disabled={isPending}
                              className="font-medium text-slate-600 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {pendingItemId === item.id && isPending ? "Archiving…" : "Archive"}
                            </button>
                          )}
                          {(item.status === "Draft" || item.status === "Archived") && (
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(item)}
                              disabled={isPending}
                              className="font-medium text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Row count footer */}
        {sorted.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
            Showing {sorted.length} of {items.length} items
          </div>
        )}
      </div>

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-item-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isPending) setDeleteTarget(null);
          }}
        >
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 id="delete-item-title" className="text-lg font-semibold text-slate-900">
              Permanently delete this item?
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              “{deleteTarget.itemName}” ({deleteTarget.sku}) will be permanently removed. This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isPending}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? "Deleting…" : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
