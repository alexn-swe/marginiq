"use client";

import { useState } from "react";
import {
  inventory,
  calcInventoryAge,
  formatCurrency,
  getActiveItems,
  getSoldItems,
  type InventoryItem,
  type Status,
  type Platform,
  type Category,
} from "@/lib/mock-data";
import SortArrow from "@/app/components/SortArrow";

// ─── Helpers ──────────────────────────────────────────────────────────────────

// For sold items: uses the actual sale price. For unsold items: uses list price.
// Unsold items in the mock data have shippingCost/platformFee/paymentFee = 0,
// so this formula produces a clean estimate either way.
function calcEstimatedProfit(item: InventoryItem): number {
  const price = item.salePrice ?? item.listPrice;
  return (
    price -
    item.purchasePrice -
    item.shippingCost -
    item.platformFee -
    item.paymentFee
  );
}

const STATUS_BADGE: Record<Status, string> = {
  Active: "bg-emerald-100 text-emerald-700",
  Sold: "bg-indigo-100 text-indigo-700",
  Draft: "bg-amber-100 text-amber-700",
  Archived: "bg-slate-100 text-slate-500",
};

type SortField = "purchasePrice" | "listPrice" | "inventoryAge" | "estimatedProfit";
type SortDir = "asc" | "desc";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "All">("All");
  const [platformFilter, setPlatformFilter] = useState<Platform | "All">("All");
  const [categoryFilter, setCategoryFilter] = useState<Category | "All">("All");
  const [sortField, setSortField] = useState<SortField>("purchasePrice");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Summary card values — always computed from the full dataset
  const totalItems = inventory.length;
  const activeCount = getActiveItems(inventory).length;
  const soldCount = getSoldItems(inventory).length;
  const totalCost = inventory.reduce((sum, i) => sum + i.purchasePrice, 0);

  // Apply search and filters
  const query = search.toLowerCase();

  const filtered = inventory.filter((item) => {
    const matchesSearch =
      !query ||
      item.itemName.toLowerCase().includes(query) ||
      item.sku.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query) ||
      item.platform.toLowerCase().includes(query);

    const matchesStatus = statusFilter === "All" || item.status === statusFilter;
    const matchesPlatform =
      platformFilter === "All" || item.platform === platformFilter;
    const matchesCategory =
      categoryFilter === "All" || item.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesPlatform && matchesCategory;
  });

  // Apply sorting
  const sorted = [...filtered].sort((a, b) => {
    let aVal: number;
    let bVal: number;

    if (sortField === "purchasePrice") {
      aVal = a.purchasePrice;
      bVal = b.purchasePrice;
    } else if (sortField === "listPrice") {
      aVal = a.listPrice;
      bVal = b.listPrice;
    } else if (sortField === "inventoryAge") {
      aVal = calcInventoryAge(a);
      bVal = calcInventoryAge(b);
    } else {
      aVal = calcEstimatedProfit(a);
      bVal = calcEstimatedProfit(b);
    }

    return sortDir === "asc" ? aVal - bVal : bVal - aVal;
  });

  // Toggle sort: clicking the same column flips direction; a new column resets to desc
  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Inventory</h2>
        <p className="text-slate-500 mt-1">
          Manage and track all your resale inventory items.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <p className="text-sm text-slate-500">Total Items</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalItems}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <p className="text-sm text-slate-500">Active Items</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {activeCount}
          </p>
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
            onChange={(e) => setStatusFilter(e.target.value as Status | "All")}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Sold">Sold</option>
            <option value="Draft">Draft</option>
            <option value="Archived">Archived</option>
          </select>

          {/* Platform filter */}
          <select
            value={platformFilter}
            onChange={(e) =>
              setPlatformFilter(e.target.value as Platform | "All")
            }
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Platforms</option>
            <option value="eBay">eBay</option>
            <option value="StockX">StockX</option>
            <option value="GOAT">GOAT</option>
            <option value="Facebook Marketplace">Facebook Marketplace</option>
          </select>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(e.target.value as Category | "All")
            }
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Categories</option>
            <option value="Sneakers">Sneakers</option>
            <option value="Trading Cards">Trading Cards</option>
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
              {sorted.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="text-center py-12 text-slate-400 text-sm"
                  >
                    No items match your search or filters.
                  </td>
                </tr>
              ) : (
                sorted.map((item) => {
                  const profit = calcEstimatedProfit(item);
                  const age = calcInventoryAge(item);

                  // Green for positive profit, red for negative, grey for zero
                  const profitColor =
                    profit > 0
                      ? "text-emerald-600"
                      : profit < 0
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
                        {item.category}
                      </td>

                      {/* Platform */}
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {item.platform}
                      </td>

                      {/* Purchase Price */}
                      <td className="px-4 py-3 text-right text-slate-700 whitespace-nowrap">
                        {formatCurrency(item.purchasePrice)}
                      </td>

                      {/* List Price — show "—" when archived with no list price */}
                      <td className="px-4 py-3 text-right text-slate-700 whitespace-nowrap">
                        {item.listPrice > 0
                          ? formatCurrency(item.listPrice)
                          : "—"}
                      </td>

                      {/* Status badge */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[item.status]}`}
                        >
                          {item.status}
                        </span>
                      </td>

                      {/* Inventory Age */}
                      <td className="px-4 py-3 text-right text-slate-700 whitespace-nowrap">
                        {age}d
                      </td>

                      {/* Estimated Profit — "~" prefix for unsold, "—" when no list price */}
                      <td
                        className={`px-4 py-3 text-right font-medium whitespace-nowrap ${profitColor}`}
                      >
                        {item.status === "Sold"
                          ? formatCurrency(profit)
                          : item.listPrice > 0
                          ? `~${formatCurrency(profit)}`
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
            Showing {sorted.length} of {totalItems} items
          </div>
        )}
      </div>
    </div>
  );
}
