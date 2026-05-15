-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('eBay', 'StockX', 'Facebook Marketplace', 'GOAT');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('Sneakers', 'Trading Cards', 'Electronics', 'Collectibles', 'Apparel');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('Active', 'Sold', 'Draft', 'Archived');

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "platform" "Platform" NOT NULL,
    "purchasePrice" DECIMAL(10,2) NOT NULL,
    "listPrice" DECIMAL(10,2) NOT NULL,
    "salePrice" DECIMAL(10,2),
    "shippingCost" DECIMAL(10,2) NOT NULL,
    "platformFee" DECIMAL(10,2) NOT NULL,
    "paymentFee" DECIMAL(10,2) NOT NULL,
    "status" "Status" NOT NULL,
    "purchaseDate" TIMESTAMP(3) NOT NULL,
    "listedDate" TIMESTAMP(3),
    "soldDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_sku_key" ON "inventory_items"("sku");
