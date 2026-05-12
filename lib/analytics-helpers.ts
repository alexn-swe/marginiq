import {
  type InventoryItem,
  type Platform,
  type Category,
  calcNetProfit,
  calcROI,
  calcInventoryAge,
  getSoldItems,
} from "./mock-data";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlatformStat {
  platform: Platform;
  revenue: number;
  profit: number;
}

export interface CategoryStat {
  category: Category;
  revenue: number;
  profit: number;
}

export interface AgingBucket {
  label: string;
  count: number;
}

// ─── Chart data helpers ───────────────────────────────────────────────────────

/** Revenue and profit grouped by platform, sorted highest revenue first. */
export function getPlatformStats(items: InventoryItem[]): PlatformStat[] {
  const sold = getSoldItems(items);
  const map: Partial<Record<Platform, PlatformStat>> = {};

  for (const item of sold) {
    if (!map[item.platform]) {
      map[item.platform] = { platform: item.platform, revenue: 0, profit: 0 };
    }
    map[item.platform]!.revenue += item.salePrice ?? 0;
    map[item.platform]!.profit += calcNetProfit(item);
  }

  return Object.values(map as Record<Platform, PlatformStat>).sort(
    (a, b) => b.revenue - a.revenue
  );
}

/** Revenue and profit grouped by category, sorted highest profit first. */
export function getCategoryStats(items: InventoryItem[]): CategoryStat[] {
  const sold = getSoldItems(items);
  const map: Partial<Record<Category, CategoryStat>> = {};

  for (const item of sold) {
    if (!map[item.category]) {
      map[item.category] = { category: item.category, revenue: 0, profit: 0 };
    }
    map[item.category]!.revenue += item.salePrice ?? 0;
    map[item.category]!.profit += calcNetProfit(item);
  }

  return Object.values(map as Record<Category, CategoryStat>).sort(
    (a, b) => b.profit - a.profit
  );
}

/**
 * Bucketed inventory aging: how many items fall into each age band.
 * Uses all items (sold and unsold) so the chart reflects the full picture.
 */
export function getInventoryAgingBuckets(items: InventoryItem[]): AgingBucket[] {
  const buckets: Record<string, number> = {
    "0–30d": 0,
    "31–60d": 0,
    "61–90d": 0,
    "90d+": 0,
  };

  for (const item of items) {
    const age = calcInventoryAge(item);
    if (age <= 30) buckets["0–30d"]++;
    else if (age <= 60) buckets["31–60d"]++;
    else if (age <= 90) buckets["61–90d"]++;
    else buckets["90d+"]++;
  }

  return Object.entries(buckets).map(([label, count]) => ({ label, count }));
}

// ─── Summary card helpers ─────────────────────────────────────────────────────

/** Platform with the highest total revenue from sold items. */
export function getBestPlatform(items: InventoryItem[]): string {
  return getPlatformStats(items)[0]?.platform ?? "—";
}

/** Category with the highest total net profit from sold items. */
export function getBestCategory(items: InventoryItem[]): string {
  return getCategoryStats(items)[0]?.category ?? "—";
}

/** Mean ROI across all sold items (as a 0–1 decimal). */
export function getAverageROI(items: InventoryItem[]): number {
  const sold = getSoldItems(items);
  if (sold.length === 0) return 0;
  const total = sold.reduce((sum, item) => sum + calcROI(item), 0);
  return total / sold.length;
}

/** Mean inventory age in days across all items. */
export function getAverageInventoryAge(items: InventoryItem[]): number {
  if (items.length === 0) return 0;
  const total = items.reduce((sum, item) => sum + calcInventoryAge(item), 0);
  return total / items.length;
}
