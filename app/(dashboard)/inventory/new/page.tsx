"use client";

// "use client" is needed because this page uses useActionState, which is a
// React hook — hooks only work in Client Components.
//
// The form itself is a plain HTML <form>. There is no external form library.
// When the form is submitted, Next.js automatically calls our Server Action
// (createItemAction) on the server and passes the form data to it.

import { useActionState } from "react";
import Link from "next/link";
import { createItemAction } from "../actions";

// Shared Tailwind classes — kept as constants to avoid repeating long strings.
const inputClass =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 " +
  "focus:outline-none focus:ring-2 focus:ring-indigo-500";

const labelClass = "block text-sm font-medium text-slate-700 mb-1";

export default function NewInventoryPage() {
  // useActionState wires up the Server Action to React state so we can:
  //   • show an error message when createItemAction returns an error string
  //   • disable the submit button while the action is running (isPending)
  //
  // Arguments:
  //   createItemAction — the server function to call on submit
  //   null             — the initial state (no error yet)
  //
  // Returns:
  //   error     — the current state: null or an error string
  //   formAction — pass this as <form action={formAction}> so React routes
  //                the submission through createItemAction
  //   isPending  — true while the server is processing the form
  const [error, formAction, isPending] = useActionState(createItemAction, null);

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Add Inventory Item</h2>
        <p className="text-slate-500 mt-1">
          Fill in the details below to add a new item to your inventory.
        </p>
      </div>

      {/* Form card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-2xl">
        {/* Error banner — only shown when the server action returns an error string */}
        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/*
          action={formAction} tells React to call our Server Action when this
          form is submitted, instead of doing a traditional full-page POST.
        */}
        <form action={formAction} className="space-y-5">

          {/* ── Item Name (full width) ──────────────────────────────────── */}
          <div>
            <label htmlFor="itemName" className={labelClass}>
              Item Name <span className="text-red-500">*</span>
            </label>
            <input
              id="itemName"
              name="itemName"
              type="text"
              required
              placeholder="e.g. Nike Air Jordan 1 Retro High OG"
              className={inputClass}
            />
          </div>

          {/* ── SKU + Category (two columns on wider screens) ───────────── */}
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
                placeholder="e.g. AJ1-OG-2024"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="category" className={labelClass}>
                Category <span className="text-red-500">*</span>
              </label>
              {/*
                Option values must match the Prisma enum key names exactly
                (e.g. "TradingCards", not "Trading Cards") because that's what
                the server action receives and validates against.
              */}
              <select
                id="category"
                name="category"
                required
                defaultValue=""
                className={inputClass}
              >
                <option value="" disabled>Select a category</option>
                <option value="Sneakers">Sneakers</option>
                <option value="TradingCards">Trading Cards</option>
                <option value="Electronics">Electronics</option>
                <option value="Collectibles">Collectibles</option>
                <option value="Apparel">Apparel</option>
              </select>
            </div>
          </div>

          {/* ── Platform + Status ───────────────────────────────────────── */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="platform" className={labelClass}>
                Platform <span className="text-red-500">*</span>
              </label>
              <select
                id="platform"
                name="platform"
                required
                defaultValue=""
                className={inputClass}
              >
                <option value="" disabled>Select a platform</option>
                <option value="eBay">eBay</option>
                <option value="StockX">StockX</option>
                <option value="GOAT">GOAT</option>
                <option value="FacebookMarketplace">Facebook Marketplace</option>
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
                defaultValue="Active"
                className={inputClass}
              >
                <option value="Active">Active</option>
                <option value="Draft">Draft</option>
                <option value="Sold">Sold</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
          </div>

          {/* ── Purchase Price + List Price ─────────────────────────────── */}
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
                placeholder="0.00"
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
                placeholder="0.00"
                className={inputClass}
              />
            </div>
          </div>

          {/* ── Purchase Date + Listed Date ─────────────────────────────── */}
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
                className={inputClass}
              />
            </div>
          </div>

          {/* ── Action buttons ──────────────────────────────────────────── */}
          <div className="flex gap-3 pt-2">
            {/* Cancel goes back to the inventory list without saving anything */}
            <Link
              href="/inventory"
              className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Link>

            {/*
              disabled while isPending so the user cannot double-submit.
              The button text changes to "Saving…" as visual feedback.
            */}
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? "Saving…" : "Save Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
