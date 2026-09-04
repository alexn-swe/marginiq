import Link from "next/link";
import { Status } from "@prisma/client";
import { notFound } from "next/navigation";
import { getInventoryItemById } from "@/lib/db/inventory";
import SellInventoryForm from "./SellInventoryForm";

export default async function SellInventoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getInventoryItemById(id);

  if (!item) notFound();

  const purchasePrice = item.purchasePrice.toNumber();
  const cannotSellReason = item.sale
    ? "This inventory item already has a sale record."
    : item.status !== Status.Active
      ? "Only Active inventory items can be marked as sold."
      : !Number.isFinite(purchasePrice) || purchasePrice <= 0
        ? "This item does not have a valid purchase price."
        : null;

  if (cannotSellReason) {
    return (
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Mark Item Sold</h2>
          <p className="mt-1 text-slate-500">Record a completed marketplace sale.</p>
        </div>
        <div className="max-w-2xl rounded-xl border border-amber-200 bg-amber-50 p-6">
          <p className="font-medium text-amber-800">{cannotSellReason}</p>
          <Link
            href="/inventory"
            className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            Back to inventory
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Mark Item Sold</h2>
        <p className="mt-1 text-slate-500">
          Enter the final sale details. Fees and profitability are calculated automatically.
        </p>
      </div>

      <SellInventoryForm
        item={{
          id: item.id,
          itemName: item.itemName,
          sku: item.sku,
          category: item.category,
          platform: item.platform,
          purchasePrice,
          listPrice: item.listPrice.toNumber(),
        }}
        defaultSoldDate={new Date().toISOString().slice(0, 10)}
      />
    </div>
  );
}
