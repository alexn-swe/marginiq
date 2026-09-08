import { getInventoryItems } from "@/lib/db/inventory";
import { getSales } from "@/lib/db/sales";
import {
  getAverageInventoryAge,
  getAverageROI,
  getBestCategory,
  getBestPlatform,
  getCategoryStats,
  getInventoryAgingBuckets,
  getMonthlyStats,
  getPlatformStats,
  type AnalyticsInventoryInput,
  type AnalyticsSaleInput,
} from "@/lib/analytics-helpers";
import AnalyticsCharts from "./AnalyticsCharts";

export default async function AnalyticsPage() {
  let inventory;
  let sales;

  try {
    [inventory, sales] = await Promise.all([
      getInventoryItems(),
      getSales(),
    ]);
  } catch {
    return (
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Analytics</h2>
          <p className="mt-1 text-slate-500">
            12-month performance overview — revenue, profit, platforms, and inventory.
          </p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="font-medium text-red-700">Could not load analytics.</p>
          <p className="mt-1 text-sm text-red-500">
            Make sure DATABASE_URL is set in .env and your database is running.
          </p>
        </div>
      </div>
    );
  }

  // Convert Prisma Decimal values before passing data into pure calculations.
  const saleInputs: AnalyticsSaleInput[] = sales.map((sale) => ({
    platform: sale.platform,
    salePrice: sale.salePrice.toNumber(),
    netProfit: sale.netProfit.toNumber(),
    profitMargin: sale.profitMargin.toNumber(),
    roi: sale.roi.toNumber(),
    soldDate: sale.soldDate,
    inventoryItem: {
      category: sale.inventoryItem.category,
    },
  }));

  const inventoryInputs: AnalyticsInventoryInput[] = inventory.map((item) => ({
    purchaseDate: item.purchaseDate,
    sale: item.sale ? { soldDate: item.sale.soldDate } : null,
  }));

  const today = new Date();
  const monthlyStats = getMonthlyStats(saleInputs, today);
  const platformStats = getPlatformStats(saleInputs);
  const categoryStats = getCategoryStats(saleInputs);
  const averageInventoryAge = getAverageInventoryAge(inventoryInputs, today);

  return (
    <AnalyticsCharts
      data={{
        monthlyStats,
        platformStats,
        categoryStats,
        agingBuckets: getInventoryAgingBuckets(inventoryInputs, today),
        bestPlatform: getBestPlatform(platformStats),
        bestCategory: getBestCategory(categoryStats),
        averageROI: getAverageROI(saleInputs),
        averageInventoryAge:
          averageInventoryAge === null ? null : Math.round(averageInventoryAge),
        hasSales: sales.length > 0,
        hasInventory: inventory.length > 0,
      }}
    />
  );
}
