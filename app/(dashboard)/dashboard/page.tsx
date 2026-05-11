// Placeholder metric data — replace with real data later
const metrics = [
  {
    label: "Total Revenue",
    value: "$0.00",
    change: "+0%",
    positive: true,
  },
  {
    label: "Net Profit",
    value: "$0.00",
    change: "+0%",
    positive: true,
  },
  {
    label: "Active Inventory Value",
    value: "$0.00",
    change: "+0%",
    positive: true,
  },
  {
    label: "Items Sold",
    value: "0",
    change: "+0%",
    positive: true,
  },
];

export default function DashboardPage() {
  return (
    <div>
      {/* Page heading */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Overview</h2>
        <p className="text-slate-500 mt-1">
          Welcome to MarginIQ. Your profit tracking starts here.
        </p>
      </div>

      {/* Metric cards — 1 column on mobile, 2 on tablet, 4 on desktop */}
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

      {/* Recent activity placeholder */}
      <div className="mt-8 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-base font-semibold text-slate-800 mb-2">
          Recent Activity
        </h3>
        <p className="text-sm text-slate-500">
          No activity yet. Start by adding inventory items.
        </p>
      </div>
    </div>
  );
}
