"use client";

import { useState } from "react";
import {
  inventory,
  getSoldItems,
  calcNetProfit,
  calcProfitMargin,
  calcROI,
  getTotalRevenue,
  getTotalNetProfit,
  formatCurrency,
  type Platform,
  type Category,
} from "@/lib/mock-data";
import SortArrow from "@/app/components/SortArrow";

type SortField = "salePrice" | "netProfit" | "margin" | "soldDate";
type SortDir = "asc" | "desc";

// Summary card values — always computed from the full sold dataset, not affected by filters
const allSold = getSoldItems(inventory);
const totalRevenue = getTotalRevenue(inventory);
const totalNetProfit = getTotalNetProfit(inventory);
const avgMargin =
  allSold.length > 0
    ? allSold.reduce((sum, i) => sum + calcProfitMargin(i), 0) / allSold.length
    : 0;
const itemsSoldCount = allSold.length;

export default function SalesPage() {
  const [platformFilter, setPlatformFilter] = useState<Platform | "All">("All");
  const [categoryFilter, setCategoryFilter] = useState<Category | "All">("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortField, setSortField] = useState<SortField>("soldDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Apply filters to sold items
  const filtered = allSold.filter((item) => {
    const matchesPlatform =
      platformFilter === "All" || item.platform === platformFilter;
    const matchesCategory =
      categoryFilter === "All" || item.category === categoryFilter;
    // ISO date strings compare correctly as plain strings
    const matchesFrom = !dateFrom || (item.soldDate ?? "") >= dateFrom;
    const matchesTo = !dateTo || (item.soldDate ?? "") <= dateTo;
    return matchesPlatform && matchesCategory && matchesFrom && matchesTo;
  });

  // Apply sorting
  const sorted = [...filtered].sort((a, b) => {
    if (sortField === "salePrice") {
      const diff = (a.salePrice ?? 0) - (b.salePrice ?? 0);
      return sortDir === "asc" ? diff : -diff;
    }
    if (sortField === "netProfit") {
      const diff = calcNetProfit(a) - calcNetProfit(b);
      return sortDir === "asc" ? diff : -diff;
    }
    if (sortField === "margin") {
      const diff = calcProfitMargin(a) - calcProfitMargin(b);
      return sortDir === "asc" ? diff : -diff;
    }
    // soldDate — ISO strings sort correctly with localeCompare
    const aDate = a.soldDate ?? "";
    const bDate = b.soldDate ?? "";
    return sortDir === "asc"
      ? aDate.localeCompare(bDate)
      : bDate.localeCompare(aDate);
  });

  // Toggle sort: same column flips direction; new column resets to desc
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
        <h2 className="text-2xl font-bold text-slate-900">Sales</h2>
        <p className="text-slate-500 mt-1">
          All sold items with full profit and margin breakdowns.
        </p>
      </div>

      {/* Summary cards — always reflect all-time totals */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <p className="text-sm text-slate-500">Total Revenue</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {formatCurrency(totalRevenue)}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <p className="text-sm text-slate-500">Net Profit</p>
          <p
            className={`text-2xl font-bold mt-1 ${
              totalNetProfit >= 0 ? "text-emerald-600" : "text-red-500"
            }`}
          >
            {formatCurrency(totalNetProfit)}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <p className="text-sm text-slate-500">Average Margin</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {(avgMargin * 100).toFixed(1)}%
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <p className="text-sm text-slate-500">Items Sold</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">
            {itemsSoldCount}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          {/* Platform */}
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

          {/* Category */}
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

          {/* Date from */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-500 whitespace-nowrap">
              From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Date to */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-500 whitespace-nowrap">
              To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Sales table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-medium text-slate-600">
                  Item Name
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">
                  Platform
                </th>
                <th
                  className="text-right px-4 py-3 font-medium text-slate-600 cursor-pointer select-none whitespace-nowrap"
                  onClick={() => handleSort("salePrice")}
                >
                  Sale Price
                  <SortArrow field="salePrice" sortField={sortField} sortDir={sortDir} />
                </th>
                <th className="text-right px-4 py-3 font-medium text-slate-600 whitespace-nowrap">
                  Purchase Price
                </th>
                <th className="text-right px-4 py-3 font-medium text-slate-600 whitespace-nowrap">
                  Shipping
                </th>
                <th className="text-right px-4 py-3 font-medium text-slate-600 whitespace-nowrap">
                  Platform Fee
                </th>
                <th className="text-right px-4 py-3 font-medium text-slate-600 whitespace-nowrap">
                  Payment Fee
                </th>
                <th
                  className="text-right px-4 py-3 font-medium text-slate-600 cursor-pointer select-none whitespace-nowrap"
                  onClick={() => handleSort("netProfit")}
                >
                  Net Profit
                  <SortArrow field="netProfit" sortField={sortField} sortDir={sortDir} />
                </th>
                <th
                  className="text-right px-4 py-3 font-medium text-slate-600 cursor-pointer select-none whitespace-nowrap"
                  onClick={() => handleSort("margin")}
                >
                  Margin
                  <SortArrow field="margin" sortField={sortField} sortDir={sortDir} />
                </th>
                <th className="text-right px-4 py-3 font-medium text-slate-600 whitespace-nowrap">
                  ROI
                </th>
                <th
                  className="text-right px-4 py-3 font-medium text-slate-600 cursor-pointer select-none whitespace-nowrap"
                  onClick={() => handleSort("soldDate")}
                >
                  Sold Date
                  <SortArrow field="soldDate" sortField={sortField} sortDir={sortDir} />
                </th>
              </tr>
            </thead>

            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td
                    colSpan={11}
                    className="text-center py-12 text-slate-400 text-sm"
                  >
                    No sales match your filters.
                  </td>
                </tr>
              ) : (
                sorted.map((item) => {
                  const profit = calcNetProfit(item);
                  const margin = calcProfitMargin(item);
                  const roi = calcROI(item);

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
                      {/* Item Name + Category */}
                      <td className="px-4 py-3 text-slate-900 font-medium max-w-xs">
                        <div className="line-clamp-2 leading-snug">
                          {item.itemName}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {item.category}
                        </div>
                      </td>

                      {/* Platform badge */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                          {item.platform}
                        </span>
                      </td>

                      {/* Sale Price */}
                      <td className="px-4 py-3 text-right font-medium text-slate-800 whitespace-nowrap">
                        {formatCurrency(item.salePrice ?? 0)}
                      </td>

                      {/* Purchase Price */}
                      <td className="px-4 py-3 text-right text-slate-600 whitespace-nowrap">
                        {formatCurrency(item.purchasePrice)}
                      </td>

                      {/* Shipping Cost */}
                      <td className="px-4 py-3 text-right text-slate-600 whitespace-nowrap">
                        {formatCurrency(item.shippingCost)}
                      </td>

                      {/* Platform Fee */}
                      <td className="px-4 py-3 text-right text-slate-600 whitespace-nowrap">
                        {formatCurrency(item.platformFee)}
                      </td>

                      {/* Payment Fee */}
                      <td className="px-4 py-3 text-right text-slate-600 whitespace-nowrap">
                        {formatCurrency(item.paymentFee)}
                      </td>

                      {/* Net Profit — bold + color-coded */}
                      <td
                        className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${profitColor}`}
                      >
                        {formatCurrency(profit)}
                      </td>

                      {/* Profit Margin — color matches profit */}
                      <td
                        className={`px-4 py-3 text-right whitespace-nowrap ${profitColor}`}
                      >
                        {(margin * 100).toFixed(1)}%
                      </td>

                      {/* ROI */}
                      <td className="px-4 py-3 text-right text-slate-600 whitespace-nowrap">
                        {(roi * 100).toFixed(1)}%
                      </td>

                      {/* Sold Date */}
                      <td className="px-4 py-3 text-right text-slate-500 whitespace-nowrap">
                        {item.soldDate ?? "—"}
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
            Showing {sorted.length} of {itemsSoldCount} sold items
          </div>
        )}
      </div>
    </div>
  );
}
