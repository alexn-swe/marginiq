import { notFound } from "next/navigation";
import { getInventoryItemById } from "@/lib/db/inventory";
import EditInventoryForm from "./EditInventoryForm";

export default async function EditInventoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getInventoryItemById(id);

  if (!item) notFound();

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">
          Edit Inventory Item
        </h2>
        <p className="mt-1 text-slate-500">
          Update the details below, then save your changes.
        </p>
      </div>

      <EditInventoryForm
        item={{
          id: item.id,
          itemName: item.itemName,
          sku: item.sku,
          category: item.category,
          platform: item.platform,
          purchasePrice: item.purchasePrice.toString(),
          listPrice: item.listPrice.toString(),
          status: item.status,
          purchaseDate: item.purchaseDate.toISOString().slice(0, 10),
          listedDate: item.listedDate?.toISOString().slice(0, 10) ?? "",
        }}
      />
    </div>
  );
}
