/*
  Warnings:

  - You are about to drop the column `paymentFee` on the `inventory_items` table. All the data in the column will be lost.
  - You are about to drop the column `platformFee` on the `inventory_items` table. All the data in the column will be lost.
  - You are about to drop the column `salePrice` on the `inventory_items` table. All the data in the column will be lost.
  - You are about to drop the column `shippingCost` on the `inventory_items` table. All the data in the column will be lost.
  - You are about to drop the column `soldDate` on the `inventory_items` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,sku]` on the table `inventory_items` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `inventory_items` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "inventory_items_sku_key";

-- AlterTable
ALTER TABLE "inventory_items" DROP COLUMN "paymentFee",
DROP COLUMN "platformFee",
DROP COLUMN "salePrice",
DROP COLUMN "shippingCost",
DROP COLUMN "soldDate",
ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "salePrice" DECIMAL(10,2) NOT NULL,
    "shippingCost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "platformFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "paymentFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalFees" DECIMAL(10,2) NOT NULL,
    "payout" DECIMAL(10,2) NOT NULL,
    "netProfit" DECIMAL(10,2) NOT NULL,
    "profitMargin" DECIMAL(10,4) NOT NULL,
    "roi" DECIMAL(10,4) NOT NULL,
    "soldDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sales_inventoryItemId_key" ON "sales"("inventoryItemId");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_userId_sku_key" ON "inventory_items"("userId", "sku");

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
