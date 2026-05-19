"use server";

// This file contains the Server Action for creating a new inventory item.
// "use server" at the top makes every exported function a Server Action —
// they run on the server even though they are called from a Client Component.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma, Category, Platform, Status } from "@prisma/client";
import { createInventoryItem } from "@/lib/db/inventory";

// The shape of state that useActionState tracks.
// null  = no error (initial state, or after a successful redirect)
// string = an error message to display in the form
export type CreateItemState = string | null;

// createItemAction is called when the "Add Item" form is submitted.
//
// It receives:
//   _prevState — the previous state from useActionState (we don't need it, so we prefix with _)
//   formData   — all the form field values, sent automatically by the browser
//
// It returns:
//   an error string  → the form re-renders with the error message shown
//   (never returns)  → on success it calls redirect(), which throws internally
//                      and navigates the browser to /inventory
export async function createItemAction(
  _prevState: CreateItemState,
  formData: FormData
): Promise<CreateItemState> {
  // ── 1. Extract every field from the submitted form ─────────────────────────
  // formData.get() returns FormDataEntryValue | null, so we cast to string | null
  // and fall back to "" so the checks below are simple.
  const itemName         = ((formData.get("itemName")      as string) ?? "").trim();
  const sku              = ((formData.get("sku")           as string) ?? "").trim();
  const category         =  (formData.get("category")      as string) ?? "";
  const platform         =  (formData.get("platform")      as string) ?? "";
  const purchasePriceRaw =  (formData.get("purchasePrice") as string) ?? "";
  const listPriceRaw     =  (formData.get("listPrice")     as string) ?? "";
  const status           =  (formData.get("status")        as string) ?? "";
  const purchaseDateRaw  =  (formData.get("purchaseDate")  as string) ?? "";
  const listedDateRaw    =  (formData.get("listedDate")    as string) ?? "";

  // ── 2. Required field validation ───────────────────────────────────────────
  if (!itemName)         return "Item name is required.";
  if (!sku)              return "SKU is required.";
  if (!category)         return "Category is required.";
  if (!platform)         return "Platform is required.";
  if (!purchasePriceRaw) return "Purchase price is required.";
  if (!listPriceRaw)     return "List price is required.";
  if (!status)           return "Status is required.";
  if (!purchaseDateRaw)  return "Purchase date is required.";

  // ── 3. Validate enum values ────────────────────────────────────────────────
  // Object.values(Category) gives ["Sneakers", "TradingCards", ...] at runtime.
  // This guards against tampered or unexpected form values.
  const validCategories = Object.values(Category) as string[];
  const validPlatforms  = Object.values(Platform)  as string[];
  const validStatuses   = Object.values(Status)    as string[];

  if (!validCategories.includes(category)) return "Please select a valid category.";
  if (!validPlatforms.includes(platform))  return "Please select a valid platform.";
  if (!validStatuses.includes(status))     return "Please select a valid status.";

  // ── 4. Validate money fields ───────────────────────────────────────────────
  const purchasePrice = parseFloat(purchasePriceRaw);
  const listPrice     = parseFloat(listPriceRaw);

  if (!isFinite(purchasePrice) || purchasePrice <= 0) {
    return "Purchase price must be a positive number.";
  }
  if (!isFinite(listPrice) || listPrice <= 0) {
    return "List price must be a positive number.";
  }

  // ── 5. Validate dates ──────────────────────────────────────────────────────
  // The <input type="date"> sends "YYYY-MM-DD". new Date() parses it as UTC midnight.
  const purchaseDate = new Date(purchaseDateRaw);
  if (isNaN(purchaseDate.getTime())) return "Purchase date is not a valid date.";

  let listedDate: Date | null = null;
  if (listedDateRaw) {
    listedDate = new Date(listedDateRaw);
    if (isNaN(listedDate.getTime())) return "Listed date is not a valid date.";
  }

  // ── 6. Save to the database ────────────────────────────────────────────────
  try {
    await createInventoryItem({
      itemName,
      sku,
      category:      category as Category,
      platform:      platform as Platform,
      purchasePrice,
      listPrice,
      status:        status   as Status,
      purchaseDate,
      listedDate,
    });
  } catch (e) {
    // P2002 is Prisma's error code for a unique constraint violation.
    // Our schema has @@unique([userId, sku]), so this fires when the SKU is a duplicate.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return `An item with SKU "${sku}" already exists in your inventory.`;
    }
    return "Could not save the item. Please try again.";
  }

  // ── 7. Success — clear the cache and send the user back to /inventory ──────
  // revalidatePath tells Next.js to re-fetch /inventory so the new row appears.
  // redirect() throws a special Next.js exception that the framework catches and
  // turns into a client-side navigation — code after it never runs.
  revalidatePath("/inventory");
  redirect("/inventory");
}
