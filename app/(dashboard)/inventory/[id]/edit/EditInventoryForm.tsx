"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updateItemAction } from "../../actions";

type EditableInventoryItem = {
  id: string;
  itemName: string;
  sku: string;
  category: string;
  platform: string;
  purchasePrice: string;
  listPrice: string;
  status: string;
  purchaseDate: string;
  listedDate: string;
};

const inputClass =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 " +
  "focus:outline-none focus:ring-2 focus:ring-indigo-500";

const labelClass = "mb-1 block text-sm font-medium text-slate-700";

export default function EditInventoryForm({
  item,
}: {
  item: EditableInventoryItem;
}) {
  // Binding the ID keeps it on the server-action call without exposing an
  // editable hidden field in the form.
  const updateThisItem = updateItemAction.bind(null, item.id);
  const [error, formAction, isPending] = useActionState(updateThisItem, null);

  return (
    <div className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form action={formAction} className="space-y-5">
        <div>
          <label htmlFor="itemName" className={labelClass}>
            Item Name <span className="text-red-500">*</span>
          </label>
          <input
            id="itemName"
            name="itemName"
            type="text"
            required
            defaultValue={item.itemName}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="sku" className={labelClass}>
              SKU <span className="text-red-500">*</span>
            </label>
            <input
              id="sku"
              name="sku"
              type="text"
              required
              defaultValue={item.sku}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="category" className={labelClass}>
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              name="category"
              required
              defaultValue={item.category}
              className={inputClass}
            >
              <option value="Sneakers">Sneakers</option>
              <option value="TradingCards">Trading Cards</option>
              <option value="Electronics">Electronics</option>
              <option value="Collectibles">Collectibles</option>
              <option value="Apparel">Apparel</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="platform" className={labelClass}>
              Platform <span className="text-red-500">*</span>
            </label>
            <select
              id="platform"
              name="platform"
              required
              defaultValue={item.platform}
              className={inputClass}
            >
              <option value="eBay">eBay</option>
              <option value="StockX">StockX</option>
              <option value="GOAT">GOAT</option>
              <option value="FacebookMarketplace">
                Facebook Marketplace
              </option>
            </select>
          </div>

          <div>
            <label htmlFor="status" className={labelClass}>
              Status <span className="text-red-500">*</span>
            </label>
            <select
              id="status"
              name="status"
              required
              defaultValue={item.status}
              className={inputClass}
            >
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
              <option value="Sold">Sold</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="purchasePrice" className={labelClass}>
              Purchase Price ($) <span className="text-red-500">*</span>
            </label>
            <input
              id="purchasePrice"
              name="purchasePrice"
              type="number"
              required
              min="0.01"
              step="0.01"
              defaultValue={item.purchasePrice}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="listPrice" className={labelClass}>
              List Price ($) <span className="text-red-500">*</span>
            </label>
            <input
              id="listPrice"
              name="listPrice"
              type="number"
              required
              min="0.01"
              step="0.01"
              defaultValue={item.listPrice}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="purchaseDate" className={labelClass}>
              Purchase Date <span className="text-red-500">*</span>
            </label>
            <input
              id="purchaseDate"
              name="purchaseDate"
              type="date"
              required
              defaultValue={item.purchaseDate}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="listedDate" className={labelClass}>
              Listed Date{" "}
              <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              id="listedDate"
              name="listedDate"
              type="date"
              defaultValue={item.listedDate}
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Link
            href="/inventory"
            className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
