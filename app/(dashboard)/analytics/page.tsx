"use client";

import type { ReactNode } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { inventory, monthlyData, formatCurrency } from "@/lib/mock-data";
import {
  getPlatformStats,
  getCategoryStats,
  getInventoryAgingBuckets,
  getBestPlatform,
  getBestCategory,
  getAverageROI,
  getAverageInventoryAge,
} from "@/lib/analytics-helpers";

// ─── Pre-compute all chart data ───────────────────────────────────────────────
// These run once when the module loads since the mock data never changes.

const platformStats = getPlatformStats(inventory);
const categoryStats = getCategoryStats(inventory);
const agingBuckets = getInventoryAgingBuckets(inventory);

const bestPlatform = getBestPlatform(inventory);
const bestCategory = getBestCategory(inventory);
const avgROI = getAverageROI(inventory);
const avgAge = Math.round(getAverageInventoryAge(inventory));

// ─── Colors ───────────────────────────────────────────────────────────────────

const PLATFORM_COLORS = ["#6366f1", "#8b5cf6", "#0ea5e9", "#f59e0b"];
const CATEGORY_COLORS = ["#10b981", "#6366f1", "#f59e0b", "#ef4444", "#8b5cf6"];
const AGING_COLORS   = ["#10b981", "#6366f1", "#f59e0b", "#ef4444"];

// ─── Y-axis tick formatter ────────────────────────────────────────────────────

function shortDollar(value: number): string {
  return value >= 1000 ? `$${(value / 1000).toFixed(1)}k` : `$${value}`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Analytics</h2>
        <p className="text-slate-500 mt-1">
          12-month performance overview — revenue, profit, platforms, and inventory.
        </p>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SummaryCard
          label="Best Platform"
          value={bestPlatform}
          sub="by total revenue"
        />
        <SummaryCard
          label="Best Category"
          value={bestCategory}
          sub="by net profit"
        />
        <SummaryCard
          label="Average ROI"
          value={`${(avgROI * 100).toFixed(1)}%`}
          sub="on sold items"
          accent
        />
        <SummaryCard
          label="Avg Inventory Age"
          value={`${avgAge} days`}
          sub="across all items"
        />
      </div>

      {/* ── Revenue & Profit trends ── */}
      <Section title="Revenue & Profit Trends">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

          <ChartCard
            title="Monthly Revenue"
            subtitle="Gross sales revenue over the last 12 months"
          >
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart
                data={monthlyData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}    />
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
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: 13 }}
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

          <ChartCard
            title="Monthly Net Profit"
            subtitle="Net profit after all fees and costs"
          >
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart
                data={monthlyData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}    />
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
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: 13 }}
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

      {/* ── Platform & Category breakdown ── */}
      <Section title="Platform & Category Breakdown">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

          <ChartCard
            title="Revenue by Platform"
            subtitle="Total sales revenue per marketplace"
          >
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
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: 13 }}
                />
                <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                  {platformStats.map((_, i) => (
                    <Cell key={i} fill={PLATFORM_COLORS[i % PLATFORM_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Profit by Category"
            subtitle="Net profit earned per item category"
          >
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
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: 13 }}
                />
                <Bar dataKey="profit" radius={[0, 4, 4, 0]}>
                  {categoryStats.map((_, i) => (
                    <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

        </div>
      </Section>

      {/* ── Inventory aging ── */}
      <Section title="Inventory Aging">
        <ChartCard
          title="Items by Age Bucket"
          subtitle="How long items have been sitting in inventory (purchase date to today or sale date)"
        >
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
                contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: 13 }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {agingBuckets.map((_, i) => (
                  <Cell key={i} fill={AGING_COLORS[i % AGING_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </Section>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

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
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p
        className={`text-2xl font-bold mt-1 ${
          accent ? "text-emerald-600" : "text-slate-900"
        }`}
      >
        {value}
      </p>
      <p className="text-xs text-slate-400 mt-1">{sub}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-8">
      <h3 className="text-base font-semibold text-slate-700 mb-3">{title}</h3>
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
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="mb-4">
        <h4 className="font-semibold text-slate-800 text-sm">{title}</h4>
        <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
