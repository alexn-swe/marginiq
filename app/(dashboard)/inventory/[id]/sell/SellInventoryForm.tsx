"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { calculateSaleFinancials } from "@/lib/fee-calculations";
import { createSaleAction } from "../../actions";

type SellableInventoryItem = {
  id: string;
  itemName: string;
  sku: string;
  category: string;
  platform: string;
  purchasePrice: number;
  listPrice: number;
};

const inputClass =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 " +
  "focus:outline-none focus:ring-2 focus:ring-indigo-500";

const labelClass = "mb-1 block text-sm font-medium text-slate-700";

const PLATFORM_DISPLAY: Record<string, string> = {
  FacebookMarketplace: "Facebook Marketplace",
};

const CATEGORY_DISPLAY: Record<string, string> = {
  TradingCards: "Trading Cards",
};

function showPlatform(platform: string): string {
  return PLATFORM_DISPLAY[platform] ?? platform;
}

function showCategory(category: string): string {
  return CATEGORY_DISPLAY[category] ?? category;
}

function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

export default function SellInventoryForm({
  item,
  defaultSoldDate,
}: {
  item: SellableInventoryItem;
  defaultSoldDate: string;
}) {
  const [platform, setPlatform] = useState(item.platform);
  const [salePrice, setSalePrice] = useState(String(item.listPrice));
  const [shippingCost, setShippingCost] = useState("0");

  const sellThisItem = createSaleAction.bind(null, item.id);
  const [error, formAction, isPending] = useActionState(sellThisItem, null);

  const salePriceNumber = Number(salePrice) || 0;
  const shippingCostNumber = Number(shippingCost) || 0;
  const financials = calculateSaleFinancials(
    platform,
    salePriceNumber,
    item.purchasePrice,
    shippingCostNumber
  );

  const profitColor =
    financials.netProfit > 0
      ? "text-emerald-600"
      : financials.netProfit < 0
        ? "text-red-500"
        : "text-slate-600";

  return (
    <div className="grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.7fr)]">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 border-b border-slate-100 pb-5">
          <h3 className="font-semibold text-slate-900">Inventory item</h3>
          <p className="mt-2 text-lg font-medium text-slate-900">{item.itemName}</p>
          <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
            <ItemDetail label="SKU" value={item.sku} />
            <ItemDetail label="Category" value={showCategory(item.category)} />
            <ItemDetail label="Listed on" value={showPlatform(item.platform)} />
            <ItemDetail label="Purchase price" value={formatCurrency(item.purchasePrice)} />
            <ItemDetail label="List price" value={formatCurrency(item.listPrice)} />
          </div>
        </div>

        {error && (
          <div
            aria-live="polite"
            className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <form action={formAction} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="salePrice" className={labelClass}>
                Sale Price ($) <span className="text-red-500">*</span>
              </label>
              <input
                id="salePrice"
                name="salePrice"
                type="number"
                required
                min="0.01"
                step="0.01"
                value={salePrice}
                onChange={(event) => setSalePrice(event.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="soldDate" className={labelClass}>
                Sold Date <span className="text-red-500">*</span>
              </label>
              <input
                id="soldDate"
                name="soldDate"
                type="date"
                required
                defaultValue={defaultSoldDate}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="shippingCost" className={labelClass}>
                Shipping Cost ($)
              </label>
              <input
                id="shippingCost"
                name="shippingCost"
                type="number"
                min="0"
                step="0.01"
                value={shippingCost}
                onChange={(event) => setShippingCost(event.target.value)}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-slate-400">
                Enter additional shipping you paid. Platform shipping fees are added automatically.
              </p>
            </div>

            <div>
              <label htmlFor="platform" className={labelClass}>
                Sale Platform <span className="text-red-500">*</span>
              </label>
              <select
                id="platform"
                name="platform"
                required
                value={platform}
                onChange={(event) => setPlatform(event.target.value)}
                className={inputClass}
              >
                <option value="eBay">eBay</option>
                <option value="StockX">StockX</option>
                <option value="GOAT">GOAT</option>
                <option value="FacebookMarketplace">Facebook Marketplace</option>
              </select>
            </div>
          </div>

          {salePriceNumber > 0 && salePriceNumber < item.purchasePrice && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              This sale price is below the purchase price. You can still record the sale, and the loss will be shown in red.
            </div>
          )}

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
              {isPending ? "Recording Sale…" : "Record Sale"}
            </button>
          </div>
        </form>
      </div>

      <aside className="h-fit rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="font-semibold text-slate-900">Sale preview</h3>
        <p className="mt-1 text-xs text-slate-400">Updates as you enter sale details.</p>

        <dl className="mt-5 space-y-3 text-sm">
          <PreviewRow label="Platform fee" value={formatCurrency(financials.platformFee)} />
          <PreviewRow label="Payment fee" value={formatCurrency(financials.paymentFee)} />
          <PreviewRow label="Shipping" value={formatCurrency(financials.shippingCost)} />
          <PreviewRow label="Total fees" value={formatCurrency(financials.totalFees)} />
          <PreviewRow label="Payout" value={formatCurrency(financials.payout)} emphasized />
          <PreviewRow
            label="Net profit"
            value={formatCurrency(financials.netProfit)}
            valueClassName={profitColor}
            emphasized
          />
          <PreviewRow label="Profit margin" value={`${financials.profitMargin.toFixed(1)}%`} />
          <PreviewRow label="ROI" value={`${financials.roi.toFixed(1)}%`} />
        </dl>
      </aside>
    </div>
  );
}

function ItemDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-0.5 text-slate-700">{value}</p>
    </div>
  );
}

function PreviewRow({
  label,
  value,
  valueClassName = "text-slate-700",
  emphasized = false,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  emphasized?: boolean;
}) {
  return (
    <div className={`flex justify-between gap-4 ${emphasized ? "border-t border-slate-100 pt-3" : ""}`}>
      <dt className="text-slate-500">{label}</dt>
      <dd className={`${emphasized ? "font-semibold" : "font-medium"} ${valueClassName}`}>
        {value}
      </dd>
    </div>
  );
}
