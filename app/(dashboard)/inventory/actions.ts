"use server";

// Server Actions for creating and editing inventory items.
// Both actions use the same validation so the two forms stay consistent.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma, Category, Platform, Status } from "@prisma/client";
import {
  createInventoryItem,
  archiveInventoryItem,
  deleteInventoryItem,
  updateInventoryItem,
  type CreateInventoryItemData,
} from "@/lib/db/inventory";

export type ItemActionState = string | null;
export type CreateItemState = ItemActionState;

export type InventoryRowActionResult = {
  success: boolean;
  message: string;
};

type ValidationResult =
  | { data: CreateInventoryItemData; error: null }
  | { data: null; error: string };

function validateItemForm(formData: FormData): ValidationResult {
  const itemName = ((formData.get("itemName") as string) ?? "").trim();
  const sku = ((formData.get("sku") as string) ?? "").trim();
  const category = (formData.get("category") as string) ?? "";
  const platform = (formData.get("platform") as string) ?? "";
  const purchasePriceRaw = (formData.get("purchasePrice") as string) ?? "";
  const listPriceRaw = (formData.get("listPrice") as string) ?? "";
  const status = (formData.get("status") as string) ?? "";
  const purchaseDateRaw = (formData.get("purchaseDate") as string) ?? "";
  const listedDateRaw = (formData.get("listedDate") as string) ?? "";

  if (!itemName) return { data: null, error: "Item name is required." };
  if (!sku) return { data: null, error: "SKU is required." };
  if (!category) return { data: null, error: "Category is required." };
  if (!platform) return { data: null, error: "Platform is required." };
  if (!purchasePriceRaw) {
    return { data: null, error: "Purchase price is required." };
  }
  if (!listPriceRaw) return { data: null, error: "List price is required." };
  if (!status) return { data: null, error: "Status is required." };
  if (!purchaseDateRaw) {
    return { data: null, error: "Purchase date is required." };
  }

  if (!(Object.values(Category) as string[]).includes(category)) {
    return { data: null, error: "Please select a valid category." };
  }
  if (!(Object.values(Platform) as string[]).includes(platform)) {
    return { data: null, error: "Please select a valid platform." };
  }
  if (!(Object.values(Status) as string[]).includes(status)) {
    return { data: null, error: "Please select a valid status." };
  }

  const purchasePrice = Number(purchasePriceRaw);
  const listPrice = Number(listPriceRaw);

  if (!Number.isFinite(purchasePrice) || purchasePrice <= 0) {
    return { data: null, error: "Purchase price must be a positive number." };
  }
  if (!Number.isFinite(listPrice) || listPrice <= 0) {
    return { data: null, error: "List price must be a positive number." };
  }

  const purchaseDate = new Date(purchaseDateRaw);
  if (Number.isNaN(purchaseDate.getTime())) {
    return { data: null, error: "Purchase date is not a valid date." };
  }

  let listedDate: Date | null = null;
  if (listedDateRaw) {
    listedDate = new Date(listedDateRaw);
    if (Number.isNaN(listedDate.getTime())) {
      return { data: null, error: "Listed date is not a valid date." };
    }
  }

  return {
    data: {
      itemName,
      sku,
      category: category as Category,
      platform: platform as Platform,
      purchasePrice,
      listPrice,
      status: status as Status,
      purchaseDate,
      listedDate,
    },
    error: null,
  };
}

function getSaveError(error: unknown, sku: string): string {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return `An item with SKU "${sku}" already exists in your inventory.`;
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  ) {
    return "That inventory item could not be found.";
  }

  return "Could not save the item. Please try again.";
}

export async function createItemAction(
  _previousState: CreateItemState,
  formData: FormData
): Promise<CreateItemState> {
  const result = validateItemForm(formData);
  if (result.data === null) return result.error;

  try {
    await createInventoryItem(result.data);
  } catch (error) {
    return getSaveError(error, result.data.sku);
  }

  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  redirect("/inventory");
}

export async function updateItemAction(
  id: string,
  _previousState: ItemActionState,
  formData: FormData
): Promise<ItemActionState> {
  const result = validateItemForm(formData);
  if (result.data === null) return result.error;

  try {
    await updateInventoryItem(id, result.data);
  } catch (error) {
    return getSaveError(error, result.data.sku);
  }

  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  redirect("/inventory?updated=1");
}

export async function archiveItemAction(
  id: string
): Promise<InventoryRowActionResult> {
  if (!id) return { success: false, message: "That inventory item could not be found." };

  try {
    const result = await archiveInventoryItem(id);

    if (result === "not-found") {
      return { success: false, message: "That inventory item could not be found." };
    }
    if (result === "not-eligible") {
      return { success: false, message: "Only Active or Draft items can be archived." };
    }
  } catch {
    return { success: false, message: "Could not archive the item. Please try again." };
  }

  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  return { success: true, message: "Inventory item archived." };
}

export async function deleteItemAction(
  id: string
): Promise<InventoryRowActionResult> {
  if (!id) return { success: false, message: "That inventory item could not be found." };

  try {
    const result = await deleteInventoryItem(id);

    if (result === "not-found") {
      return { success: false, message: "That inventory item could not be found." };
    }
    if (result === "has-sale") {
      return { success: false, message: "This item cannot be deleted because it has a sale record." };
    }
    if (result === "not-eligible") {
      return { success: false, message: "Only Draft or Archived items can be deleted." };
    }
  } catch {
    return { success: false, message: "Could not delete the item. Please try again." };
  }

  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  return { success: true, message: "Inventory item permanently deleted." };
}
