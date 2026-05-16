import { getInventoryItems } from "@/lib/db/inventory";
import { getSales } from "@/lib/db/sales";
import { Status } from "@prisma/client";
import { formatCurrency, formatChange } from "@/lib/mock-data";

export default async function DashboardPage() {
  const [items, sales] = await Promise.all([
    getInventoryItems(),
    getSales(),
  ]);

  // ── Status buckets ────────────────────────────────────────────────────────
  const activeItems   = items.filter((i) => i.status === Status.Active);
  const soldCount     = items.filter((i) => i.status === Status.Sold).length;
  const draftCount    = items.filter((i) => i.status === Status.Draft).length;
  const archivedCount = items.filter((i) => i.status === Status.Archived).length;

  // ── Aggregates ────────────────────────────────────────────────────────────
  // Sale model stores precomputed netProfit, profitMargin (as %), roi (as %).
  const totalRevenue         = sales.reduce((s, x) => s + x.salePrice.toNumber(), 0);
  const totalNetProfit       = sales.reduce((s, x) => s + x.netProfit.toNumber(), 0);
  const activeInventoryValue = activeItems.reduce((s, i) => s + i.listPrice.toNumber(), 0);
  const itemsSoldCount       = sales.length;

  // profitMargin is stored as a percentage (25.5 = 25.5%), not a 0–1 decimal.
  const avgMargin = sales.length > 0
    ? sales.reduce((s, x) => s + x.profitMargin.toNumber(), 0) / sales.length
    : 0;

  // ── Inventory aging ───────────────────────────────────────────────────────
  const today = new Date();

  const agedCount = activeItems.filter((i) => {
    const days = (today.getTime() - i.purchaseDate.getTime()) / 86_400_000;
    return days > 90;
  }).length;

  const avgDaysToSell = sales.length > 0
    ? Math.round(
        sales.reduce((s, x) => {
          return s + (x.soldDate.getTime() - x.inventoryItem.purchaseDate.getTime()) / 86_400_000;
        }, 0) / sales.length
      )
    : 0;

  // ── Month-over-month: April vs March 2026 ────────────────────────────────
  const aprSales = sales.filter((s) => s.soldDate.toISOString().startsWith("2026-04"));
  const marSales = sales.filter((s) => s.soldDate.toISOString().startsWith("2026-03"));

  const aprRevenue = aprSales.reduce((s, x) => s + x.salePrice.toNumber(), 0);
  const marRevenue = marSales.reduce((s, x) => s + x.salePrice.toNumber(), 0);
  const aprProfit  = aprSales.reduce((s, x) => s + x.netProfit.toNumber(), 0);
  const marProfit  = marSales.reduce((s, x) => s + x.netProfit.toNumber(), 0);

  const revenueChange   = formatChange(aprRevenue, marRevenue);
  const profitChange    = formatChange(aprProfit, marProfit);
  const soldCountChange = formatChange(aprSales.length, marSales.length);

  // ── Top metric cards ──────────────────────────────────────────────────────
  const metrics = [
    {
      label:    "Total Revenue",
      value:    formatCurrency(totalRevenue),
      change:   revenueChange,
      positive: aprRevenue >= marRevenue,
    },
    {
      label:    "Net Profit",
      value:    formatCurrency(totalNetProfit),
      change:   profitChange,
      positive: aprProfit >= marProfit,
    },
    {
      label:    "Active Inventory Value",
      value:    formatCurrency(activeInventoryValue),
      change:   `${activeItems.length} items`,
      positive: true,
    },
    {
      label:    "Items Sold",
      value:    String(itemsSoldCount),
      change:   soldCountChange,
      positive: aprSales.length >= marSales.length,
    },
  ];

  // ── Status summary cards ──────────────────────────────────────────────────
  const statusCards = [
    { label: "Active",   count: activeItems.length, color: "text-emerald-600 bg-emerald-50" },
    { label: "Sold",     count: soldCount,           color: "text-indigo-600 bg-indigo-50"  },
    { label: "Draft",    count: draftCount,          color: "text-amber-600 bg-amber-50"    },
    { label: "Archived", count: archivedCount,       color: "text-slate-500 bg-slate-100"   },
  ];

  // ── Recent sales (getSales already orders by soldDate desc) ───────────────
  const recentSales = sales.slice(0, 6);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Page heading */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Overview</h2>
        <p className="text-slate-500 mt-1">
          Your MarginIQ snapshot — all-time totals, change shows Apr vs Mar 2026.
        </p>
      </div>

      {/* Top metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-5"
          >
            <p className="text-sm font-medium text-slate-500">{metric.label}</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              {metric.value}
            </p>
            <p
              className={`text-sm mt-2 font-medium ${
                metric.positive ? "text-emerald-600" : "text-red-500"
              }`}
            >
              {metric.change}{" "}
              <span className="text-slate-400 font-normal">vs last month</span>
            </p>
          </div>
        ))}
      </div>

      {/* Secondary stats: Avg Margin + Inventory Aging */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <p className="text-sm font-medium text-slate-500">Avg Profit Margin</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">
            {itemsSoldCount > 0 ? `${avgMargin.toFixed(1)}%` : "—"}
          </p>
          <p className="text-sm mt-2 text-slate-400 font-normal">
            across {itemsSoldCount} sold item{itemsSoldCount !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <p className="text-sm font-medium text-slate-500">Inventory Aging</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">
            {itemsSoldCount > 0 ? `${avgDaysToSell}d` : "—"}
          </p>
          <p className="text-sm mt-2 text-slate-400 font-normal">
            avg days to sell
            {agedCount > 0 && (
              <> · <span className="text-amber-500 font-medium">{agedCount} active item{agedCount !== 1 ? "s" : ""} aged &gt;90d</span></>
            )}
          </p>
        </div>
      </div>

      {/* Recent sales table */}
      <div className="mt-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-800">Recent Sales</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Last {recentSales.length} sold items
          </p>
        </div>

        {recentSales.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400 text-sm">
            No sales recorded yet. Mark items as sold to see them here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Item
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Platform
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">
                    Sale Price
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">
                    Net Profit
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">
                    Margin
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">
                    ROI
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">
                    Days to Sell
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentSales.map((sale) => {
                  const profit     = sale.netProfit.toNumber();
                  // profitMargin and roi are stored as percentages (e.g. 25.5 = 25.5%)
                  const margin     = sale.profitMargin.toNumber();
                  const roi        = sale.roi.toNumber();
                  const daysToSell = Math.floor(
                    (sale.soldDate.getTime() - sale.inventoryItem.purchaseDate.getTime()) / 86_400_000
                  );

                  return (
                    <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                      {/* Item name + category */}
                      <td className="px-6 py-3">
                        <p className="font-medium text-slate-800 truncate max-w-[220px]">
                          {sale.inventoryItem.itemName}
                        </p>
                        <p className="text-xs text-slate-400">
                          {sale.inventoryItem.category}
                        </p>
                      </td>

                      {/* Platform badge — uses the @map string ("Facebook Marketplace", etc.) */}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                          {sale.platform}
                        </span>
                      </td>

                      {/* Sale price */}
                      <td className="px-4 py-3 text-right font-medium text-slate-800">
                        {formatCurrency(sale.salePrice.toNumber())}
                      </td>

                      {/* Net profit */}
                      <td
                        className={`px-4 py-3 text-right font-semibold ${
                          profit >= 0 ? "text-emerald-600" : "text-red-500"
                        }`}
                      >
                        {formatCurrency(profit)}
                      </td>

                      {/* Margin — already stored as %, no ×100 needed */}
                      <td className="px-4 py-3 text-right text-slate-600">
                        {margin.toFixed(1)}%
                      </td>

                      {/* ROI — already stored as %, no ×100 needed */}
                      <td className="px-4 py-3 text-right text-slate-600">
                        {roi.toFixed(1)}%
                      </td>

                      {/* Days to sell */}
                      <td className="px-4 py-3 text-right text-slate-500">
                        {daysToSell}d
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inventory status summary */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statusCards.map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-3"
          >
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.color}`}
            >
              {s.label}
            </span>
            <span className="text-xl font-bold text-slate-800">{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
