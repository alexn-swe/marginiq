"use client";

import { useState } from "react";
import SortArrow from "@/app/components/SortArrow";

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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [platformFilter, setPlatformFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sortField, setSortField] = useState<SortField>("purchasePrice");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

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
              </tr>
            </thead>

            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400 text-sm">
                    No inventory items yet. Add your first item to get started.
                  </td>
                </tr>
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400 text-sm">
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
    </>
  );
}
