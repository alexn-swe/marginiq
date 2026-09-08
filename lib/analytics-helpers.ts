// Pure aggregation helpers for the database-backed Analytics page.
// Inputs use plain numbers and Date objects so this module stays independent
// from Prisma and can be tested without a database connection.

export interface AnalyticsSaleInput {
  platform: string;
  salePrice: number;
  netProfit: number;
  profitMargin: number;
  roi: number;
  soldDate: Date;
  inventoryItem: {
    category: string;
  };
}

export interface AnalyticsInventoryInput {
  purchaseDate: Date;
  sale: {
    soldDate: Date;
  } | null;
}

export interface MonthlyStat {
  month: string;
  yearMonth: string;
  revenue: number;
  profit: number;
  margin: number;
}

export interface PlatformStat {
  platform: string;
  revenue: number;
  profit: number;
}

export interface CategoryStat {
  category: string;
  revenue: number;
  profit: number;
}

export interface AgingBucket {
  label: string;
  count: number;
}

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const PLATFORM_DISPLAY: Record<string, string> = {
  FacebookMarketplace: "Facebook Marketplace",
};

const CATEGORY_DISPLAY: Record<string, string> = {
  TradingCards: "Trading Cards",
};

/** Creates a rolling 12-month series ending in the current month. */
export function getMonthlyStats(
  sales: AnalyticsSaleInput[],
  today = new Date()
): MonthlyStat[] {
  const months = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 11 + index, 1)
    );
    const year = date.getUTCFullYear();
    const monthIndex = date.getUTCMonth();
    const yearMonth = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;

    return {
      month: `${MONTH_NAMES[monthIndex]} '${String(year).slice(-2)}`,
      yearMonth,
      revenue: 0,
      profit: 0,
      marginTotal: 0,
      saleCount: 0,
    };
  });

  const monthByKey = new Map(months.map((month) => [month.yearMonth, month]));

  for (const sale of sales) {
    const key = toYearMonth(sale.soldDate);
    const month = monthByKey.get(key);
    if (!month) continue;

    month.revenue += sale.salePrice;
    month.profit += sale.netProfit;
    month.marginTotal += sale.profitMargin;
    month.saleCount += 1;
  }

  return months.map((month) => ({
    month: month.month,
    yearMonth: month.yearMonth,
    revenue: round2(month.revenue),
    profit: round2(month.profit),
    margin:
      month.saleCount > 0 ? month.marginTotal / month.saleCount : 0,
  }));
}

/** Revenue and profit grouped by sale platform, highest revenue first. */
export function getPlatformStats(
  sales: AnalyticsSaleInput[]
): PlatformStat[] {
  const totals = new Map<string, PlatformStat>();

  for (const sale of sales) {
    const platform = PLATFORM_DISPLAY[sale.platform] ?? sale.platform;
    const current = totals.get(platform) ?? {
      platform,
      revenue: 0,
      profit: 0,
    };

    current.revenue += sale.salePrice;
    current.profit += sale.netProfit;
    totals.set(platform, current);
  }

  return [...totals.values()]
    .map((stat) => ({
      ...stat,
      revenue: round2(stat.revenue),
      profit: round2(stat.profit),
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

/** Revenue and profit grouped by the related inventory item's category. */
export function getCategoryStats(
  sales: AnalyticsSaleInput[]
): CategoryStat[] {
  const totals = new Map<string, CategoryStat>();

  for (const sale of sales) {
    const category =
      CATEGORY_DISPLAY[sale.inventoryItem.category] ??
      sale.inventoryItem.category;
    const current = totals.get(category) ?? {
      category,
      revenue: 0,
      profit: 0,
    };

    current.revenue += sale.salePrice;
    current.profit += sale.netProfit;
    totals.set(category, current);
  }

  return [...totals.values()]
    .map((stat) => ({
      ...stat,
      revenue: round2(stat.revenue),
      profit: round2(stat.profit),
    }))
    .sort((a, b) => b.profit - a.profit);
}

/** Purchase-to-sale age for sold items; purchase-to-today age otherwise. */
export function getInventoryAge(
  item: AnalyticsInventoryInput,
  today = new Date()
): number {
  const endDate = item.sale?.soldDate ?? today;
  const age = Math.floor(
    (endDate.getTime() - item.purchaseDate.getTime()) / 86_400_000
  );

  return Math.max(0, age);
}

export function getInventoryAgingBuckets(
  items: AnalyticsInventoryInput[],
  today = new Date()
): AgingBucket[] {
  const buckets = [
    { label: "0–30d", count: 0 },
    { label: "31–60d", count: 0 },
    { label: "61–90d", count: 0 },
    { label: "90d+", count: 0 },
  ];

  for (const item of items) {
    const age = getInventoryAge(item, today);
    if (age <= 30) buckets[0].count += 1;
    else if (age <= 60) buckets[1].count += 1;
    else if (age <= 90) buckets[2].count += 1;
    else buckets[3].count += 1;
  }

  return buckets;
}

export function getAverageROI(sales: AnalyticsSaleInput[]): number | null {
  if (sales.length === 0) return null;
  return sales.reduce((sum, sale) => sum + sale.roi, 0) / sales.length;
}

export function getAverageInventoryAge(
  items: AnalyticsInventoryInput[],
  today = new Date()
): number | null {
  if (items.length === 0) return null;

  const totalAge = items.reduce(
    (sum, item) => sum + getInventoryAge(item, today),
    0
  );
  return totalAge / items.length;
}

export function getBestPlatform(stats: PlatformStat[]): string {
  return stats[0]?.platform ?? "—";
}

export function getBestCategory(stats: CategoryStat[]): string {
  return stats[0]?.category ?? "—";
}

function toYearMonth(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(
    2,
    "0"
  )}`;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
