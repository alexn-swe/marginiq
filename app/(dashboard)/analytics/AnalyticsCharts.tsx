"use client";

import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  AgingBucket,
  CategoryStat,
  MonthlyStat,
  PlatformStat,
} from "@/lib/analytics-helpers";

export interface AnalyticsDashboardData {
  monthlyStats: MonthlyStat[];
  platformStats: PlatformStat[];
  categoryStats: CategoryStat[];
  agingBuckets: AgingBucket[];
  bestPlatform: string;
  bestCategory: string;
  averageROI: number | null;
  averageInventoryAge: number | null;
  hasSales: boolean;
  hasInventory: boolean;
}

const PLATFORM_COLORS = ["#6366f1", "#8b5cf6", "#0ea5e9", "#f59e0b"];
const CATEGORY_COLORS = ["#10b981", "#6366f1", "#f59e0b", "#ef4444", "#8b5cf6"];
const AGING_COLORS = ["#10b981", "#6366f1", "#f59e0b", "#ef4444"];

function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

function shortDollar(value: number): string {
  const absoluteValue = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  return absoluteValue >= 1000
    ? `${sign}$${(absoluteValue / 1000).toFixed(1)}k`
    : `${sign}$${absoluteValue}`;
}

export default function AnalyticsCharts({
  data,
}: {
  data: AnalyticsDashboardData;
}) {
  const {
    monthlyStats,
    platformStats,
    categoryStats,
    agingBuckets,
    bestPlatform,
    bestCategory,
    averageROI,
    averageInventoryAge,
    hasSales,
    hasInventory,
  } = data;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Analytics</h2>
        <p className="mt-1 text-slate-500">
          12-month performance overview — revenue, profit, platforms, and inventory.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard label="Best Platform" value={bestPlatform} sub="by total revenue" />
        <SummaryCard label="Best Category" value={bestCategory} sub="by net profit" />
        <SummaryCard
          label="Average ROI"
          value={averageROI === null ? "—" : `${averageROI.toFixed(1)}%`}
          sub="on sold items"
          accent
        />
        <SummaryCard
          label="Avg Inventory Age"
          value={averageInventoryAge === null ? "—" : `${averageInventoryAge} days`}
          sub="across all items"
        />
      </div>

      <Section title="Revenue & Profit Trends">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <ChartCard
            title="Monthly Revenue"
            subtitle="Gross sales revenue over the last 12 months"
          >
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart
                data={monthlyStats}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tickFormatter={shortDollar}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                  width={52}
                />
                <Tooltip
                  formatter={(value) => [formatCurrency(value as number), "Revenue"]}
                  contentStyle={tooltipStyle}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#revenueGrad)"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Monthly Net Profit" subtitle="Net profit after all fees and costs">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart
                data={monthlyStats}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tickFormatter={shortDollar}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                  width={52}
                />
                <Tooltip
                  formatter={(value) => [formatCurrency(value as number), "Net Profit"]}
                  contentStyle={tooltipStyle}
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#profitGrad)"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </Section>

      <Section title="Platform & Category Breakdown">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <ChartCard title="Revenue by Platform" subtitle="Total sales revenue per marketplace">
            {!hasSales ? (
              <EmptyChart message="No sales recorded yet." />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  layout="vertical"
                  data={platformStats}
                  margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis
                    type="number"
                    tickFormatter={shortDollar}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="platform"
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    tickLine={false}
                    axisLine={false}
                    width={140}
                  />
                  <Tooltip
                    formatter={(value) => [formatCurrency(value as number), "Revenue"]}
                    contentStyle={tooltipStyle}
                  />
                  <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                    {platformStats.map((stat, index) => (
                      <Cell
                        key={stat.platform}
                        fill={PLATFORM_COLORS[index % PLATFORM_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Profit by Category" subtitle="Net profit earned per item category">
            {!hasSales ? (
              <EmptyChart message="No sales recorded yet." />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  layout="vertical"
                  data={categoryStats}
                  margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis
                    type="number"
                    tickFormatter={shortDollar}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="category"
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    tickLine={false}
                    axisLine={false}
                    width={110}
                  />
                  <Tooltip
                    formatter={(value) => [formatCurrency(value as number), "Net Profit"]}
                    contentStyle={tooltipStyle}
                  />
                  <Bar dataKey="profit" radius={[0, 4, 4, 0]}>
                    {categoryStats.map((stat, index) => (
                      <Cell
                        key={stat.category}
                        fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>
      </Section>

      <Section title="Inventory Aging">
        <ChartCard
          title="Items by Age Bucket"
          subtitle="How long items have been in inventory (purchase date to today or sale date)"
        >
          {!hasInventory ? (
            <EmptyChart message="No inventory items recorded yet." height={260} />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={agingBuckets}
                margin={{ top: 10, right: 16, left: 0, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 13, fill: "#64748b" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                  width={32}
                />
                <Tooltip
                  formatter={(value) => [value, "Items"]}
                  contentStyle={tooltipStyle}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {agingBuckets.map((bucket, index) => (
                    <Cell
                      key={bucket.label}
                      fill={AGING_COLORS[index % AGING_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </Section>
    </div>
  );
}

const tooltipStyle = {
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
  fontSize: 13,
};

function EmptyChart({
  message,
  height = 220,
}: {
  message: string;
  height?: number;
}) {
  return (
    <div
      style={{ height }}
      className="flex items-center justify-center text-sm text-slate-400"
    >
      {message}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p
        className={`mt-1 text-2xl font-bold ${
          accent ? "text-emerald-600" : "text-slate-900"
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-400">{sub}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-8">
      <h3 className="mb-3 text-base font-semibold text-slate-700">{title}</h3>
      {children}
    </section>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
        <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
