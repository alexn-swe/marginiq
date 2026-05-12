"use client";

import { useRef, useState } from "react";
import {
  inventory,
  calcNetProfit,
  calcProfitMargin,
  getSoldItems,
} from "@/lib/mock-data";

// ─── CSV utilities ────────────────────────────────────────────────────────────

function cell(v: string | number | null | undefined): string {
  if (v == null) return "";
  const s = String(v);
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

function toCSV(rows: (string | number | null | undefined)[][]): string {
  return rows.map((r) => r.map(cell).join(",")).join("\n");
}

function triggerDownload(filename: string, csv: string): void {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8;" })
  );
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ─── Export generators ────────────────────────────────────────────────────────

function exportInventory() {
  const headers = [
    "itemName", "sku", "category", "platform",
    "purchasePrice", "listPrice", "salePrice",
    "shippingCost", "platformFee", "paymentFee",
    "status", "purchaseDate", "listedDate", "soldDate",
  ];
  const rows = inventory.map((i) => [
    i.itemName, i.sku, i.category, i.platform,
    i.purchasePrice, i.listPrice, i.salePrice,
    i.shippingCost, i.platformFee, i.paymentFee,
    i.status, i.purchaseDate, i.listedDate, i.soldDate,
  ]);
  triggerDownload("marginiq-inventory.csv", toCSV([headers, ...rows]));
}

function exportSales() {
  const sold = getSoldItems(inventory);
  const headers = [
    "itemName", "sku", "category", "platform",
    "salePrice", "purchasePrice", "shippingCost",
    "platformFee", "paymentFee", "netProfit", "marginPct", "soldDate",
  ];
  const rows = sold.map((i) => [
    i.itemName, i.sku, i.category, i.platform,
    i.salePrice, i.purchasePrice, i.shippingCost,
    i.platformFee, i.paymentFee,
    calcNetProfit(i).toFixed(2),
    (calcProfitMargin(i) * 100).toFixed(1),
    i.soldDate,
  ]);
  triggerDownload("marginiq-sales.csv", toCSV([headers, ...rows]));
}

function exportProfitReport() {
  const sold = getSoldItems(inventory);
  const totalRevenue = sold.reduce((s, i) => s + (i.salePrice ?? 0), 0);
  const totalProfit = sold.reduce((s, i) => s + calcNetProfit(i), 0);
  const totalCOGS = sold.reduce((s, i) => s + i.purchasePrice, 0);
  const totalFees = sold.reduce(
    (s, i) => s + i.shippingCost + i.platformFee + i.paymentFee,
    0
  );

  const byCategory = new Map<string, { revenue: number; profit: number; count: number }>();
  for (const item of sold) {
    const e = byCategory.get(item.category) ?? { revenue: 0, profit: 0, count: 0 };
    byCategory.set(item.category, {
      revenue: e.revenue + (item.salePrice ?? 0),
      profit: e.profit + calcNetProfit(item),
      count: e.count + 1,
    });
  }

  const rows: (string | number)[][] = [
    ["MarginIQ Profit Report"],
    ["Generated", new Date().toISOString().split("T")[0]],
    [],
    ["── Summary ──"],
    ["Total Items Sold", sold.length],
    ["Total Revenue", `$${totalRevenue.toFixed(2)}`],
    ["Cost of Goods Sold", `$${totalCOGS.toFixed(2)}`],
    ["Total Fees", `$${totalFees.toFixed(2)}`],
    ["Net Profit", `$${totalProfit.toFixed(2)}`],
    [
      "Avg Margin",
      totalRevenue
        ? `${((totalProfit / totalRevenue) * 100).toFixed(1)}%`
        : "0%",
    ],
    [],
    ["── Breakdown by Category ──"],
    ["Category", "Items Sold", "Revenue", "Net Profit", "Margin %"],
    ...[...byCategory.entries()].map(([cat, d]) => [
      cat,
      d.count,
      `$${d.revenue.toFixed(2)}`,
      `$${d.profit.toFixed(2)}`,
      `${((d.profit / d.revenue) * 100).toFixed(1)}%`,
    ]),
  ];
  triggerDownload("marginiq-profit-report.csv", toCSV(rows));
}

function downloadSample() {
  const headers = [
    "itemName", "sku", "category", "platform",
    "purchasePrice", "listPrice", "shippingCost",
    "platformFee", "paymentFee", "status",
    "purchaseDate", "listedDate", "soldDate",
  ];
  const examples = [
    [
      "Nike Air Jordan 1 Retro High OG", "NK-AJ1-BW-10", "Sneakers", "StockX",
      150, 280, 15, 28, 2.5, "Sold", "2025-11-03", "2025-11-05", "2025-11-20",
    ],
    [
      "Pokémon Charizard Holo PSA 9", "TCG-CHAR-PSA9", "Trading Cards", "eBay",
      800, 1400, 12, 140, 11, "Active", "2025-12-01", "2025-12-03", "",
    ],
    [
      "Apple AirPods Pro 2nd Gen", "ELEC-APP-2", "Electronics",
      "Facebook Marketplace", 180, 210, 0, 0, 0, "Draft", "2026-01-10", "", "",
    ],
  ];
  triggerDownload("marginiq-sample.csv", toCSV([headers, ...examples]));
}

// ─── Static data ──────────────────────────────────────────────────────────────

const COLUMNS = [
  { name: "itemName",      desc: "Full product name" },
  { name: "sku",           desc: "Unique stock-keeping unit" },
  { name: "category",      desc: "Sneakers | Trading Cards | Electronics | Collectibles | Apparel" },
  { name: "platform",      desc: "eBay | StockX | Facebook Marketplace | GOAT" },
  { name: "purchasePrice", desc: "Amount paid to acquire the item (USD)" },
  { name: "listPrice",     desc: "Current listed / asking price (USD)" },
  { name: "shippingCost",  desc: "Shipping paid by seller — 0 for local pickup" },
  { name: "platformFee",   desc: "Marketplace commission deducted from sale price" },
  { name: "paymentFee",    desc: "Payment-processor fee deducted from sale price" },
  { name: "status",        desc: "Active | Sold | Draft | Archived" },
  { name: "purchaseDate",  desc: "ISO 8601 date — e.g. 2025-11-03" },
  { name: "listedDate",    desc: "ISO 8601 date — leave blank if Draft" },
  { name: "soldDate",      desc: "ISO 8601 date — leave blank if not sold" },
];

const soldCount = getSoldItems(inventory).length;

const EXPORTS = [
  {
    title: "Inventory CSV",
    desc: "All items with purchase price, list price, fees, and current status.",
    count: `${inventory.length} items`,
    action: exportInventory,
  },
  {
    title: "Sales CSV",
    desc: "Sold items with net profit, margin percentage, and sale date.",
    count: `${soldCount} sales`,
    action: exportSales,
  },
  {
    title: "Profit Report CSV",
    desc: "Summary totals and category breakdown of revenue and net profit.",
    count: "Summary + breakdown",
    action: exportProfitReport,
  },
];

// ─── File validation ──────────────────────────────────────────────────────────

type FileInfo = {
  name: string;
  size: string;
  valid: boolean;
  message: string;
} | null;

function fmtBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1_048_576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1_048_576).toFixed(1)} MB`;
}

function validateFile(f: File): FileInfo {
  const ok =
    f.name.toLowerCase().endsWith(".csv") || f.type === "text/csv";
  return {
    name: f.name,
    size: fmtBytes(f.size),
    valid: ok,
    message: ok
      ? "File looks valid — full column validation will run on import."
      : "File must be a .csv — please select a valid CSV file.",
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ImportExportPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileInfo, setFileInfo] = useState<FileInfo>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleFile(f: File) {
    setFileInfo(validateFile(f));
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Import / Export</h2>
        <p className="text-slate-500 mt-1">
          Import inventory from CSV or export your data for reporting.
        </p>
      </div>

      {/* Info banner */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-start gap-3 mb-6">
        <svg
          className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
            clipRule="evenodd"
          />
        </svg>
        <div>
          <p className="text-sm font-semibold text-indigo-900">
            Database integration coming soon
          </p>
          <p className="text-sm text-indigo-700 mt-0.5">
            CSV import will validate and stage your inventory for review before
            saving. Exports currently use mock data. Both will connect to your
            live database in the next release.
          </p>
        </div>
      </div>

      {/* ── Import ────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
        {/* Section header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Import Inventory CSV
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">
              Upload a CSV file to stage new inventory items. The file must
              include all columns listed below.
            </p>
          </div>
          <button
            onClick={downloadSample}
            className="shrink-0 flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 border border-indigo-200 hover:border-indigo-300 bg-indigo-50 hover:bg-indigo-100 rounded-lg px-3 py-1.5 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Sample CSV
          </button>
        </div>

        {/* Required columns */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Required columns
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {COLUMNS.map((col) => (
              <div key={col.name} className="flex items-baseline gap-2">
                <code className="text-xs font-mono font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded shrink-0">
                  {col.name}
                </code>
                <span className="text-xs text-slate-500 leading-snug">
                  {col.desc}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-colors ${
            isDragging
              ? "border-indigo-400 bg-indigo-50"
              : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100"
          }`}
        >
          <svg
            className={`w-10 h-10 transition-colors ${
              isDragging ? "text-indigo-400" : "text-slate-300"
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-700">
              Drop your CSV here, or{" "}
              <span className="text-indigo-600">browse files</span>
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Accepts .csv files only
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleChange}
          />
        </div>

        {/* Validation result */}
        {fileInfo && (
          <div
            className={`mt-4 rounded-lg border p-4 flex items-start gap-3 ${
              fileInfo.valid
                ? "bg-emerald-50 border-emerald-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            {fileInfo.valid ? (
              <svg
                className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5 text-red-500 shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium truncate ${
                  fileInfo.valid ? "text-emerald-800" : "text-red-800"
                }`}
              >
                {fileInfo.name}
              </p>
              <p
                className={`text-xs mt-0.5 ${
                  fileInfo.valid ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {fileInfo.size} · {fileInfo.message}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFileInfo(null);
              }}
              className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Dismiss"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* ── Export ────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-1">
          Export Reports
        </h3>
        <p className="text-sm text-slate-500 mb-5">
          Download your current inventory and sales data as CSV files for
          analysis or record-keeping.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {EXPORTS.map((exp) => (
            <div
              key={exp.title}
              className="border border-slate-200 rounded-xl p-4 flex flex-col gap-4 hover:border-slate-300 transition-colors"
            >
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {exp.title}
                </p>
                <p className="text-xs text-slate-500 mt-1 leading-snug">
                  {exp.desc}
                </p>
              </div>
              <div className="flex items-center justify-between mt-auto">
                <span className="text-xs font-medium text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">
                  {exp.count}
                </span>
                <button
                  onClick={exp.action}
                  className="flex items-center gap-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg px-3 py-1.5 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
