"use client";

import { useState } from "react";
import SortArrow from "@/app/components/SortArrow";

export type SalesRow = {
  id: string;
  itemName: string;
  category: string;
  platform: string;
  salePrice: number;
  purchasePrice: number;
  shippingCost: number;
  platformFee: number;
  paymentFee: number;
  payout: number;
  netProfit: number;
  profitMargin: number;
  roi: number;
  soldDate: string;
};

export type SalesSummary = {
  totalRevenue: number;
  totalNetProfit: number;
  averageMargin: number;
  itemsSold: number;
};

type SortField = "salePrice" | "netProfit" | "profitMargin" | "soldDate";
type SortDir = "asc" | "desc";

const PLATFORM_DISPLAY: Record<string, string> = {
  FacebookMarketplace: "Facebook Marketplace",
};

const CATEGORY_DISPLAY: Record<string, string> = {
  TradingCards: "Trading Cards",
};

function showPlatform(platform: string): string {
  return PLATFORM_DISPLAY[platform] ?? platform;
}

function showCategory(category: string): string {
  return CATEGORY_DISPLAY[category] ?? category;
}

function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

export default function SalesTable({
  sales,
  summary,
  saleCreated = false,
}: {
  sales: SalesRow[];
  summary: SalesSummary;
  saleCreated?: boolean;
}) {
  const [platformFilter, setPlatformFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortField, setSortField] = useState<SortField>("soldDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const filtered = sales.filter((sale) => {
    const matchesPlatform =
      platformFilter === "All" || sale.platform === platformFilter;
    const matchesCategory =
      categoryFilter === "All" || sale.category === categoryFilter;
    const matchesFrom = !dateFrom || sale.soldDate >= dateFrom;
    const matchesTo = !dateTo || sale.soldDate <= dateTo;

    return matchesPlatform && matchesCategory && matchesFrom && matchesTo;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortField === "soldDate") {
      return sortDir === "asc"
        ? a.soldDate.localeCompare(b.soldDate)
        : b.soldDate.localeCompare(a.soldDate);
    }

    const difference = a[sortField] - b[sortField];
    return sortDir === "asc" ? difference : -difference;
  });

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
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Sales</h2>
        <p className="mt-1 text-slate-500">
          All sold items with full profit and margin breakdowns.
        </p>
      </div>

      {saleCreated && (
        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          Sale recorded successfully.
        </div>
      )}

      {/* Summary cards always reflect the complete database result. */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Revenue</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {formatCurrency(summary.totalRevenue)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Net Profit</p>
          <p
            className={`mt-1 text-2xl font-bold ${
              summary.totalNetProfit >= 0
                ? "text-emerald-600"
                : "text-red-500"
            }`}
          >
            {formatCurrency(summary.totalNetProfit)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Average Margin</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {summary.averageMargin.toFixed(1)}%
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Items Sold</p>
          <p className="mt-1 text-2xl font-bold text-indigo-600">
            {summary.itemsSold}
          </p>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col flex-wrap gap-3 sm:flex-row">
          <select
            aria-label="Filter by platform"
            value={platformFilter}
            onChange={(event) => setPlatformFilter(event.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Platforms</option>
            <option value="eBay">eBay</option>
            <option value="StockX">StockX</option>
            <option value="GOAT">GOAT</option>
            <option value="FacebookMarketplace">Facebook Marketplace</option>
          </select>

          <select
            aria-label="Filter by category"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Categories</option>
            <option value="Sneakers">Sneakers</option>
            <option value="TradingCards">Trading Cards</option>
            <option value="Electronics">Electronics</option>
            <option value="Collectibles">Collectibles</option>
            <option value="Apparel">Apparel</option>
          </select>

          <div className="flex items-center gap-2">
            <label htmlFor="sales-date-from" className="whitespace-nowrap text-sm text-slate-500">
              From
            </label>
            <input
              id="sales-date-from"
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="sales-date-to" className="whitespace-nowrap text-sm text-slate-500">
              To
            </label>
            <input
              id="sales-date-to"
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  Item Name
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  Platform
                </th>
                <th
                  className="cursor-pointer select-none whitespace-nowrap px-4 py-3 text-right font-medium text-slate-600"
                  onClick={() => handleSort("salePrice")}
                >
                  Sale Price
                  <SortArrow field="salePrice" sortField={sortField} sortDir={sortDir} />
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-right font-medium text-slate-600">
                  Purchase Price
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-right font-medium text-slate-600">
                  Shipping
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-right font-medium text-slate-600">
                  Platform Fee
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-right font-medium text-slate-600">
                  Payment Fee
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-right font-medium text-slate-600">
                  Payout
                </th>
                <th
                  className="cursor-pointer select-none whitespace-nowrap px-4 py-3 text-right font-medium text-slate-600"
                  onClick={() => handleSort("netProfit")}
                >
                  Net Profit
                  <SortArrow field="netProfit" sortField={sortField} sortDir={sortDir} />
                </th>
                <th
                  className="cursor-pointer select-none whitespace-nowrap px-4 py-3 text-right font-medium text-slate-600"
                  onClick={() => handleSort("profitMargin")}
                >
                  Margin
                  <SortArrow field="profitMargin" sortField={sortField} sortDir={sortDir} />
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-right font-medium text-slate-600">
                  ROI
                </th>
                <th
                  className="cursor-pointer select-none whitespace-nowrap px-4 py-3 text-right font-medium text-slate-600"
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
                  <td colSpan={12} className="py-12 text-center text-sm text-slate-400">
                    {sales.length === 0
                      ? "No sales recorded yet."
                      : "No sales match your filters."}
                  </td>
                </tr>
              ) : (
                sorted.map((sale) => {
                  const profitColor =
                    sale.netProfit > 0
                      ? "text-emerald-600"
                      : sale.netProfit < 0
                        ? "text-red-500"
                        : "text-slate-500";

                  return (
                    <tr
                      key={sale.id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="max-w-xs px-4 py-3 font-medium text-slate-900">
                        <div className="line-clamp-2 leading-snug">
                          {sale.itemName}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-400">
                          {showCategory(sale.category)}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                          {showPlatform(sale.platform)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-slate-800">
                        {formatCurrency(sale.salePrice)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-slate-600">
                        {formatCurrency(sale.purchasePrice)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-slate-600">
                        {formatCurrency(sale.shippingCost)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-slate-600">
                        {formatCurrency(sale.platformFee)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-slate-600">
                        {formatCurrency(sale.paymentFee)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-slate-800">
                        {formatCurrency(sale.payout)}
                      </td>
                      <td className={`whitespace-nowrap px-4 py-3 text-right font-semibold ${profitColor}`}>
                        {formatCurrency(sale.netProfit)}
                      </td>
                      <td className={`whitespace-nowrap px-4 py-3 text-right ${profitColor}`}>
                        {sale.profitMargin.toFixed(1)}%
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-slate-600">
                        {sale.roi.toFixed(1)}%
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-slate-500">
                        {sale.soldDate}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {sorted.length > 0 && (
          <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-400">
            Showing {sorted.length} of {summary.itemsSold} sold items
          </div>
        )}
      </div>
    </div>
  );
}
