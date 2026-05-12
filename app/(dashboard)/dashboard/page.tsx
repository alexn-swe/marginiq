import {
  inventory,
  calcNetProfit,
  calcProfitMargin,
  calcROI,
  calcInventoryAge,
  getSoldItems,
  getActiveItems,
  getSoldInMonth,
  getTotalRevenue,
  getTotalNetProfit,
  getActiveInventoryValue,
  formatCurrency,
  formatChange,
} from "@/lib/mock-data";

// ─── Compute summary metrics ─────────────────────────────────────────────────

const soldItems = getSoldItems(inventory);
const activeItems = getActiveItems(inventory);

const totalRevenue = getTotalRevenue(inventory);
const totalNetProfit = getTotalNetProfit(inventory);
const activeInventoryValue = getActiveInventoryValue(inventory);
const itemsSoldCount = soldItems.length;

// Month-over-month comparison: April 2026 (last full month) vs March 2026
const aprSold = getSoldInMonth(inventory, "2026-04");
const marSold = getSoldInMonth(inventory, "2026-03");

const aprRevenue = aprSold.reduce((s, i) => s + (i.salePrice ?? 0), 0);
const marRevenue = marSold.reduce((s, i) => s + (i.salePrice ?? 0), 0);

const aprProfit = aprSold.reduce((s, i) => s + calcNetProfit(i), 0);
const marProfit = marSold.reduce((s, i) => s + calcNetProfit(i), 0);

const revenueChange = formatChange(aprRevenue, marRevenue);
const profitChange = formatChange(aprProfit, marProfit);
const soldCountChange = formatChange(aprSold.length, marSold.length);

// ─── Card config ─────────────────────────────────────────────────────────────

const metrics = [
  {
    label: "Total Revenue",
    value: formatCurrency(totalRevenue),
    change: revenueChange,
    positive: aprRevenue >= marRevenue,
  },
  {
    label: "Net Profit",
    value: formatCurrency(totalNetProfit),
    change: profitChange,
    positive: aprProfit >= marProfit,
  },
  {
    label: "Active Inventory Value",
    value: formatCurrency(activeInventoryValue),
    change: `${activeItems.length} items`,
    positive: true,
  },
  {
    label: "Items Sold",
    value: String(itemsSoldCount),
    change: soldCountChange,
    positive: aprSold.length >= marSold.length,
  },
];

// ─── Recent sales (last 6 sold items by soldDate, newest first) ───────────────

const recentSales = [...soldItems]
  .sort((a, b) => (b.soldDate ?? "").localeCompare(a.soldDate ?? ""))
  .slice(0, 6);

// ─── Component ───────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <div>
      {/* Page heading */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Overview</h2>
        <p className="text-slate-500 mt-1">
          Your MarginIQ snapshot — all-time totals, change shows Apr vs Mar 2026.
        </p>
      </div>

      {/* Metric cards */}
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

      {/* Recent sales table */}
      <div className="mt-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-800">
            Recent Sales
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Last {recentSales.length} sold items
          </p>
        </div>

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
              {recentSales.map((item) => {
                const profit = calcNetProfit(item);
                const margin = calcProfitMargin(item);
                const roi = calcROI(item);
                const age = calcInventoryAge(item);
                const profitPositive = profit >= 0;

                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    {/* Item name + category */}
                    <td className="px-6 py-3">
                      <p className="font-medium text-slate-800 truncate max-w-[220px]">
                        {item.itemName}
                      </p>
                      <p className="text-xs text-slate-400">{item.category}</p>
                    </td>

                    {/* Platform badge */}
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                        {item.platform}
                      </span>
                    </td>

                    {/* Sale price */}
                    <td className="px-4 py-3 text-right font-medium text-slate-800">
                      {formatCurrency(item.salePrice ?? 0)}
                    </td>

                    {/* Net profit — green if positive, red if negative */}
                    <td
                      className={`px-4 py-3 text-right font-semibold ${
                        profitPositive ? "text-emerald-600" : "text-red-500"
                      }`}
                    >
                      {formatCurrency(profit)}
                    </td>

                    {/* Margin */}
                    <td className="px-4 py-3 text-right text-slate-600">
                      {(margin * 100).toFixed(1)}%
                    </td>

                    {/* ROI */}
                    <td className="px-4 py-3 text-right text-slate-600">
                      {(roi * 100).toFixed(1)}%
                    </td>

                    {/* Days to sell */}
                    <td className="px-4 py-3 text-right text-slate-500">
                      {age}d
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inventory status summary */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(
          [
            { label: "Active", count: activeItems.length, color: "text-emerald-600 bg-emerald-50" },
            { label: "Sold", count: soldItems.length, color: "text-indigo-600 bg-indigo-50" },
            {
              label: "Draft",
              count: inventory.filter((i) => i.status === "Draft").length,
              color: "text-amber-600 bg-amber-50",
            },
            {
              label: "Archived",
              count: inventory.filter((i) => i.status === "Archived").length,
              color: "text-slate-500 bg-slate-100",
            },
          ] as const
        ).map((s) => (
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
