import { getSales } from "@/lib/db/sales";
import SalesTable, { type SalesRow, type SalesSummary } from "./SalesTable";

export default async function SalesPage() {
  let sales;

  try {
    sales = await getSales();
  } catch {
    return (
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Sales</h2>
          <p className="mt-1 text-slate-500">
            All sold items with full profit and margin breakdowns.
          </p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="font-medium text-red-700">Could not load sales.</p>
          <p className="mt-1 text-sm text-red-500">
            Make sure DATABASE_URL is set in .env and your database is running.
          </p>
        </div>
      </div>
    );
  }

  // Prisma Decimal and Date objects are converted to plain values before they
  // are passed from this Server Component to the interactive Client Component.
  const rows: SalesRow[] = sales.map((sale) => ({
    id: sale.id,
    itemName: sale.inventoryItem.itemName,
    category: sale.inventoryItem.category,
    platform: sale.platform,
    salePrice: sale.salePrice.toNumber(),
    purchasePrice: sale.inventoryItem.purchasePrice.toNumber(),
    shippingCost: sale.shippingCost.toNumber(),
    platformFee: sale.platformFee.toNumber(),
    paymentFee: sale.paymentFee.toNumber(),
    payout: sale.payout.toNumber(),
    netProfit: sale.netProfit.toNumber(),
    profitMargin: sale.profitMargin.toNumber(),
    roi: sale.roi.toNumber(),
    soldDate: sale.soldDate.toISOString().slice(0, 10),
  }));

  const summary: SalesSummary = {
    totalRevenue: rows.reduce((sum, sale) => sum + sale.salePrice, 0),
    totalNetProfit: rows.reduce((sum, sale) => sum + sale.netProfit, 0),
    averageMargin:
      rows.length > 0
        ? rows.reduce((sum, sale) => sum + sale.profitMargin, 0) /
          rows.length
        : 0,
    itemsSold: rows.length,
  };

  return <SalesTable sales={rows} summary={summary} />;
}
