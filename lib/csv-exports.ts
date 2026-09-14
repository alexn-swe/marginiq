import type { Prisma } from "@prisma/client";

type CsvValue = string | number | null | undefined;

type InventoryWithSale = Prisma.InventoryItemGetPayload<{
  include: { sale: true };
}>;

type SaleWithInventory = Prisma.SaleGetPayload<{
  include: { inventoryItem: true };
}>;

const platformLabels: Record<string, string> = {
  FacebookMarketplace: "Facebook Marketplace",
};

const categoryLabels: Record<string, string> = {
  TradingCards: "Trading Cards",
};

const saleHeaders = [
  "itemName",
  "sku",
  "category",
  "platform",
  "listingPlatform",
  "purchasePrice",
  "listPrice",
  "salePrice",
  "shippingCost",
  "platformFee",
  "paymentFee",
  "totalFees",
  "payout",
  "netProfit",
  "profitMargin",
  "roi",
  "status",
  "purchaseDate",
  "listedDate",
  "soldDate",
];

function escapeCsvCell(value: CsvValue): string {
  if (value === null || value === undefined) return "";

  const text = String(value);
  const needsQuotes = /[",\r\n]/.test(text);

  return needsQuotes ? `"${text.replace(/"/g, '""')}"` : text;
}

function createCsv(rows: CsvValue[][]): string {
  const csv = rows
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\r\n");

  // The UTF-8 byte-order mark helps spreadsheet apps preserve special characters.
  return `\uFEFF${csv}`;
}

function formatDate(value: Date | null): string {
  return value ? value.toISOString().slice(0, 10) : "";
}

function formatLabel(value: string, labels: Record<string, string>): string {
  return labels[value] ?? value;
}

function saleDetailRow(sale: SaleWithInventory): CsvValue[] {
  const item = sale.inventoryItem;

  return [
    item.itemName,
    item.sku,
    formatLabel(item.category, categoryLabels),
    formatLabel(sale.platform, platformLabels),
    formatLabel(item.platform, platformLabels),
    item.purchasePrice.toFixed(2),
    item.listPrice.toFixed(2),
    sale.salePrice.toFixed(2),
    sale.shippingCost.toFixed(2),
    sale.platformFee.toFixed(2),
    sale.paymentFee.toFixed(2),
    sale.totalFees.toFixed(2),
    sale.payout.toFixed(2),
    sale.netProfit.toFixed(2),
    sale.profitMargin.toFixed(2),
    sale.roi.toFixed(2),
    item.status,
    formatDate(item.purchaseDate),
    formatDate(item.listedDate),
    formatDate(sale.soldDate),
  ];
}

export function createInventoryCsv(items: InventoryWithSale[]): string {
  const headers = [
    "itemName",
    "sku",
    "category",
    "platform",
    "purchasePrice",
    "listPrice",
    "salePrice",
    "salePlatform",
    "shippingCost",
    "platformFee",
    "paymentFee",
    "totalFees",
    "payout",
    "netProfit",
    "profitMargin",
    "roi",
    "status",
    "purchaseDate",
    "listedDate",
    "soldDate",
  ];

  const rows = items.map((item): CsvValue[] => {
    const sale = item.sale;

    return [
      item.itemName,
      item.sku,
      formatLabel(item.category, categoryLabels),
      formatLabel(item.platform, platformLabels),
      item.purchasePrice.toFixed(2),
      item.listPrice.toFixed(2),
      sale?.salePrice.toFixed(2),
      sale ? formatLabel(sale.platform, platformLabels) : "",
      sale?.shippingCost.toFixed(2),
      sale?.platformFee.toFixed(2),
      sale?.paymentFee.toFixed(2),
      sale?.totalFees.toFixed(2),
      sale?.payout.toFixed(2),
      sale?.netProfit.toFixed(2),
      sale?.profitMargin.toFixed(2),
      sale?.roi.toFixed(2),
      item.status,
      formatDate(item.purchaseDate),
      formatDate(item.listedDate),
      formatDate(sale?.soldDate ?? null),
    ];
  });

  return createCsv([headers, ...rows]);
}

export function createSalesCsv(sales: SaleWithInventory[]): string {
  return createCsv([saleHeaders, ...sales.map(saleDetailRow)]);
}

export function createProfitReportCsv(
  sales: SaleWithInventory[],
  generatedAt = new Date()
): string {
  const totals = sales.reduce(
    (summary, sale) => {
      summary.revenue += sale.salePrice.toNumber();
      summary.costOfGoods += sale.inventoryItem.purchasePrice.toNumber();
      summary.fees += sale.totalFees.toNumber();
      summary.payout += sale.payout.toNumber();
      summary.netProfit += sale.netProfit.toNumber();
      return summary;
    },
    { revenue: 0, costOfGoods: 0, fees: 0, payout: 0, netProfit: 0 }
  );

  const categories = new Map<
    string,
    { itemsSold: number; revenue: number; netProfit: number }
  >();

  for (const sale of sales) {
    const category = formatLabel(sale.inventoryItem.category, categoryLabels);
    const current = categories.get(category) ?? {
      itemsSold: 0,
      revenue: 0,
      netProfit: 0,
    };

    current.itemsSold += 1;
    current.revenue += sale.salePrice.toNumber();
    current.netProfit += sale.netProfit.toNumber();
    categories.set(category, current);
  }

  const overallMargin =
    totals.revenue === 0 ? 0 : (totals.netProfit / totals.revenue) * 100;

  const categoryRows: CsvValue[][] = Array.from(categories.entries())
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([category, values]) => [
      category,
      values.itemsSold,
      values.revenue.toFixed(2),
      values.netProfit.toFixed(2),
      values.revenue === 0
        ? "0.00"
        : ((values.netProfit / values.revenue) * 100).toFixed(2),
    ]);

  return createCsv([
    ["MarginIQ Profit Report"],
    ["generatedDate", formatDate(generatedAt)],
    [],
    ["Summary"],
    ["itemsSold", sales.length],
    ["totalRevenue", totals.revenue.toFixed(2)],
    ["costOfGoodsSold", totals.costOfGoods.toFixed(2)],
    ["totalFees", totals.fees.toFixed(2)],
    ["totalPayout", totals.payout.toFixed(2)],
    ["netProfit", totals.netProfit.toFixed(2)],
    ["profitMargin", overallMargin.toFixed(2)],
    [],
    ["Profit by Category"],
    ["category", "itemsSold", "revenue", "netProfit", "profitMargin"],
    ...categoryRows,
    [],
    ["Sale Details"],
    saleHeaders,
    ...sales.map(saleDetailRow),
  ]);
}
