// prisma/seed.ts
//
// Populates the database with realistic resale inventory and sales data.
//
// Run with:  npx prisma db seed
//
// Safe to rerun — deletes all rows owned by the demo user first,
// then re-inserts everything fresh.

import "dotenv/config";
import { PrismaClient, Platform, Category, Status } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { calculateMarketplaceFees } from "../lib/fee-calculations";

// ─── Database connection ──────────────────────────────────────────────────────
// Prisma 7 requires a driver adapter — same pattern as lib/prisma.ts.

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env and fill it in."
  );
}
const adapter = new PrismaPg({ connectionString });
const prisma  = new PrismaClient({ adapter });

// ─── Demo user ────────────────────────────────────────────────────────────────
// Fixed ID so every rerun targets exactly this user's rows.

export const DEMO_USER_ID    = "demo-user-0000000000000001";
const        DEMO_USER_EMAIL = "demo@marginiq.dev";

// ─── Fee calculator ───────────────────────────────────────────────────────────
// Converts raw sale numbers into the computed columns the Sale model stores.
// Uses the same calculateMarketplaceFees() logic as the frontend.
//
// sellerShipping = extra shipping the seller paid out of pocket (eBay orders).
//   For StockX the $5 label fee comes from calculateMarketplaceFees().shippingFee,
//   so sellerShipping stays 0 for StockX / GOAT / Facebook Marketplace.
//
// profitMargin and roi are stored as percentages (25.5 means 25.5%, not 0.255).

function computeSaleFields(
  platform: Platform,
  salePrice: number,
  purchasePrice: number,
  sellerShipping = 0
) {
  const fees = calculateMarketplaceFees(platform as string, salePrice);

  const shippingCost = r2(fees.shippingFee + sellerShipping);
  const platformFee  = fees.platformFee;
  const paymentFee   = fees.paymentFee;
  const totalFees    = r2(shippingCost + platformFee + paymentFee);
  const payout       = r2(salePrice - totalFees);
  const netProfit    = r2(payout - purchasePrice);
  const profitMargin = salePrice     > 0 ? r4((netProfit / salePrice)     * 100) : 0;
  const roi          = purchasePrice > 0 ? r4((netProfit / purchasePrice) * 100) : 0;

  return { shippingCost, platformFee, paymentFee, totalFees, payout, netProfit, profitMargin, roi };
}

function r2(n: number) { return Math.round(n * 100)   / 100;   }
function r4(n: number) { return Math.round(n * 10000) / 10000; }

// ─── Seed item type ───────────────────────────────────────────────────────────

interface SeedItem {
  sku:             string;
  itemName:        string;
  category:        Category;
  platform:        Platform;
  purchasePrice:   number;
  listPrice:       number;
  status:          Status;
  purchaseDate:    Date;
  listedDate:      Date | null;
  // Only present for Sold items:
  salePrice?:      number;
  sellerShipping?: number; // extra eBay shipping cost; defaults to 0
  soldDate?:       Date;
}

// ─── Inventory data (55 items) ────────────────────────────────────────────────
// Edge cases are tagged in comments:
//   [NEGATIVE PROFIT]  sold for a loss after all fees + shipping
//   [BREAK-EVEN]       zero net profit
//   [HIGH ROI]         ROI > 500%
//   [OLD STOCK]        purchased > 180 days ago and still unsold

const ITEMS: SeedItem[] = [

  // ── Sneakers (15) ────────────────────────────────────────────────────────────

  {
    sku: "SEED-SNK-001",
    itemName: "Nike Air Jordan 1 High OG 'Chicago Reimagined'",
    category: Category.Sneakers, platform: Platform.StockX,
    purchasePrice: 185, listPrice: 340, status: Status.Sold,
    purchaseDate: new Date("2025-11-20"), listedDate: new Date("2025-11-28"),
    salePrice: 320, soldDate: new Date("2026-01-10"),
  },
  {
    sku: "SEED-SNK-002",
    itemName: "Adidas Yeezy 700 V1 'Wave Runner'",
    category: Category.Sneakers, platform: Platform.eBay,
    purchasePrice: 220, listPrice: 350, status: Status.Sold,
    purchaseDate: new Date("2025-12-01"), listedDate: new Date("2025-12-08"),
    salePrice: 330, sellerShipping: 15, soldDate: new Date("2026-01-20"),
  },
  {
    sku: "SEED-SNK-003",
    itemName: "Nike Dunk High 'Dark Mocha'",
    category: Category.Sneakers, platform: Platform.StockX,
    purchasePrice: 120, listPrice: 230, status: Status.Sold,
    purchaseDate: new Date("2025-12-10"), listedDate: new Date("2025-12-18"),
    salePrice: 210, soldDate: new Date("2026-02-15"),
  },
  {
    sku: "SEED-SNK-004",
    itemName: "New Balance 990v3 Made in USA 'Grey'",
    category: Category.Sneakers, platform: Platform.eBay,
    purchasePrice: 175, listPrice: 240, status: Status.Sold,
    purchaseDate: new Date("2025-12-20"), listedDate: new Date("2025-12-28"),
    salePrice: 225, sellerShipping: 15, soldDate: new Date("2026-03-10"),
  },
  {
    sku: "SEED-SNK-005",
    itemName: "Nike Air Max 97 'Silver Bullet'",
    category: Category.Sneakers, platform: Platform.GOAT,
    purchasePrice: 160, listPrice: 300, status: Status.Sold,
    purchaseDate: new Date("2026-01-05"), listedDate: new Date("2026-01-12"),
    salePrice: 280, soldDate: new Date("2026-02-05"),
  },
  {
    // [NEGATIVE PROFIT] Sold below cost — fees + $25 shipping ate the margin
    sku: "SEED-SNK-006",
    itemName: "Nike Air Jordan 3 Retro 'Fire Red' (2022)",
    category: Category.Sneakers, platform: Platform.eBay,
    purchasePrice: 250, listPrice: 290, status: Status.Sold,
    purchaseDate: new Date("2025-12-15"), listedDate: new Date("2025-12-22"),
    salePrice: 240, sellerShipping: 25, soldDate: new Date("2026-01-30"),
  },
  {
    sku: "SEED-SNK-007",
    itemName: "Adidas NMD R1 Primeblue 'Core Black'",
    category: Category.Sneakers, platform: Platform.StockX,
    purchasePrice: 130, listPrice: 220, status: Status.Active,
    purchaseDate: new Date("2026-02-20"), listedDate: new Date("2026-02-27"),
  },
  {
    sku: "SEED-SNK-008",
    itemName: "Nike Air Jordan 6 Retro 'Carmine' (2021)",
    category: Category.Sneakers, platform: Platform.StockX,
    purchasePrice: 280, listPrice: 520, status: Status.Active,
    purchaseDate: new Date("2026-03-10"), listedDate: new Date("2026-03-18"),
  },
  {
    // [OLD STOCK] Purchased Oct 2025 — 226+ days unsold as of today
    sku: "SEED-SNK-009",
    itemName: "Nike SB Dunk Low 'Fog'",
    category: Category.Sneakers, platform: Platform.eBay,
    purchasePrice: 150, listPrice: 280, status: Status.Active,
    purchaseDate: new Date("2025-10-01"), listedDate: new Date("2025-10-10"),
  },
  {
    sku: "SEED-SNK-010",
    itemName: "Nike Air Jordan 12 Retro 'Taxi' (2023)",
    category: Category.Sneakers, platform: Platform.GOAT,
    purchasePrice: 220, listPrice: 380, status: Status.Active,
    purchaseDate: new Date("2026-04-10"), listedDate: new Date("2026-04-18"),
  },
  {
    sku: "SEED-SNK-011",
    itemName: "Adidas Yeezy Boost 380 'Alien Blue'",
    category: Category.Sneakers, platform: Platform.eBay,
    purchasePrice: 190, listPrice: 320, status: Status.Draft,
    purchaseDate: new Date("2026-04-05"), listedDate: null,
  },
  {
    sku: "SEED-SNK-012",
    itemName: "Nike Air Max 1 'Anniversary Royal'",
    category: Category.Sneakers, platform: Platform.StockX,
    purchasePrice: 140, listPrice: 260, status: Status.Draft,
    purchaseDate: new Date("2026-04-25"), listedDate: null,
  },
  {
    sku: "SEED-SNK-013",
    itemName: "Nike Air Jordan 5 Retro 'Racer Blue'",
    category: Category.Sneakers, platform: Platform.StockX,
    purchasePrice: 180, listPrice: 300, status: Status.Draft,
    purchaseDate: new Date("2026-05-01"), listedDate: null,
  },
  {
    sku: "SEED-SNK-014",
    itemName: "Reebok Classic Leather (Vintage 1983)",
    category: Category.Sneakers, platform: Platform.FacebookMarketplace,
    purchasePrice: 65, listPrice: 0, status: Status.Archived,
    purchaseDate: new Date("2025-10-20"), listedDate: null,
  },
  {
    sku: "SEED-SNK-015",
    itemName: "Nike Cortez Basic Leather (Vintage 1972 Reissue)",
    category: Category.Sneakers, platform: Platform.eBay,
    purchasePrice: 80, listPrice: 0, status: Status.Archived,
    purchaseDate: new Date("2025-11-15"), listedDate: null,
  },

  // ── Trading Cards (10) ───────────────────────────────────────────────────────

  {
    sku: "SEED-TRD-001",
    itemName: "Charizard VSTAR Universe SAR PSA 10",
    category: Category.TradingCards, platform: Platform.eBay,
    purchasePrice: 350, listPrice: 680, status: Status.Sold,
    purchaseDate: new Date("2025-11-25"), listedDate: new Date("2025-12-02"),
    salePrice: 620, sellerShipping: 6, soldDate: new Date("2026-01-05"),
  },
  {
    sku: "SEED-TRD-002",
    itemName: "LeBron James 2003-04 Topps Chrome RC PSA 9",
    category: Category.TradingCards, platform: Platform.eBay,
    purchasePrice: 380, listPrice: 640, status: Status.Sold,
    purchaseDate: new Date("2025-12-05"), listedDate: new Date("2025-12-12"),
    salePrice: 590, sellerShipping: 8, soldDate: new Date("2026-02-20"),
  },
  {
    sku: "SEED-TRD-003",
    itemName: "Patrick Mahomes 2017 Panini Prizm Silver RC PSA 9",
    category: Category.TradingCards, platform: Platform.eBay,
    purchasePrice: 280, listPrice: 520, status: Status.Sold,
    purchaseDate: new Date("2025-12-20"), listedDate: new Date("2025-12-28"),
    salePrice: 480, sellerShipping: 6, soldDate: new Date("2026-03-15"),
  },
  {
    sku: "SEED-TRD-004",
    itemName: "Mewtwo VMAX Shiny Hidden Fates PSA 10",
    category: Category.TradingCards, platform: Platform.eBay,
    purchasePrice: 120, listPrice: 200, status: Status.Sold,
    purchaseDate: new Date("2026-01-10"), listedDate: new Date("2026-01-18"),
    salePrice: 185, sellerShipping: 5, soldDate: new Date("2026-04-05"),
  },
  {
    // [BREAK-EVEN] Local FB Marketplace pickup — no fees, sold for exactly cost
    sku: "SEED-TRD-005",
    itemName: "1999 Pokémon WotC Misprint Error Card Lot",
    category: Category.TradingCards, platform: Platform.FacebookMarketplace,
    purchasePrice: 45, listPrice: 45, status: Status.Sold,
    purchaseDate: new Date("2025-12-28"), listedDate: new Date("2025-12-28"),
    salePrice: 45, soldDate: new Date("2026-01-08"),
  },
  {
    sku: "SEED-TRD-006",
    itemName: "Charizard V Alternate Art SWSH121 PSA 10",
    category: Category.TradingCards, platform: Platform.eBay,
    purchasePrice: 95, listPrice: 165, status: Status.Active,
    purchaseDate: new Date("2026-02-15"), listedDate: new Date("2026-02-22"),
  },
  {
    sku: "SEED-TRD-007",
    itemName: "Josh Allen 2018 Panini Prizm PSA 10",
    category: Category.TradingCards, platform: Platform.eBay,
    purchasePrice: 320, listPrice: 580, status: Status.Active,
    purchaseDate: new Date("2026-03-20"), listedDate: new Date("2026-03-28"),
  },
  {
    sku: "SEED-TRD-008",
    itemName: "Pokémon Base Set Shadowless Blastoise PSA 9",
    category: Category.TradingCards, platform: Platform.eBay,
    purchasePrice: 280, listPrice: 480, status: Status.Draft,
    purchaseDate: new Date("2026-04-15"), listedDate: null,
  },
  {
    sku: "SEED-TRD-009",
    itemName: "2023 Topps Chrome Baseball Hobby Box (Sealed)",
    category: Category.TradingCards, platform: Platform.eBay,
    purchasePrice: 180, listPrice: 280, status: Status.Draft,
    purchaseDate: new Date("2026-05-05"), listedDate: null,
  },
  {
    sku: "SEED-TRD-010",
    itemName: "1990 Upper Deck Wayne Gretzky Variations Set",
    category: Category.TradingCards, platform: Platform.eBay,
    purchasePrice: 35, listPrice: 0, status: Status.Archived,
    purchaseDate: new Date("2025-10-05"), listedDate: null,
  },

  // ── Electronics (12) ─────────────────────────────────────────────────────────

  {
    sku: "SEED-ELC-001",
    itemName: "PlayStation 5 Slim Disc Edition",
    category: Category.Electronics, platform: Platform.FacebookMarketplace,
    purchasePrice: 420, listPrice: 500, status: Status.Sold,
    purchaseDate: new Date("2025-11-05"), listedDate: new Date("2025-11-05"),
    salePrice: 500, soldDate: new Date("2025-11-10"),
  },
  {
    sku: "SEED-ELC-002",
    itemName: "Nintendo Switch OLED Pokémon Scarlet & Violet Edition",
    category: Category.Electronics, platform: Platform.eBay,
    purchasePrice: 340, listPrice: 480, status: Status.Sold,
    purchaseDate: new Date("2025-12-10"), listedDate: new Date("2025-12-18"),
    salePrice: 450, sellerShipping: 20, soldDate: new Date("2026-01-15"),
  },
  {
    sku: "SEED-ELC-003",
    itemName: "Apple AirPods Max Silver",
    category: Category.Electronics, platform: Platform.eBay,
    purchasePrice: 380, listPrice: 540, status: Status.Sold,
    purchaseDate: new Date("2026-01-05"), listedDate: new Date("2026-01-12"),
    salePrice: 500, sellerShipping: 12, soldDate: new Date("2026-02-28"),
  },
  {
    sku: "SEED-ELC-004",
    itemName: "Apple MacBook Air M2 256GB Midnight",
    category: Category.Electronics, platform: Platform.eBay,
    purchasePrice: 890, listPrice: 1100, status: Status.Sold,
    purchaseDate: new Date("2026-01-20"), listedDate: new Date("2026-01-28"),
    salePrice: 1050, sellerShipping: 25, soldDate: new Date("2026-03-20"),
  },
  {
    sku: "SEED-ELC-005",
    itemName: "Google Pixel 8 Pro 256GB Obsidian (Unlocked)",
    category: Category.Electronics, platform: Platform.eBay,
    purchasePrice: 600, listPrice: 780, status: Status.Sold,
    purchaseDate: new Date("2026-02-05"), listedDate: new Date("2026-02-12"),
    salePrice: 760, sellerShipping: 20, soldDate: new Date("2026-03-25"),
  },
  {
    sku: "SEED-ELC-006",
    itemName: "Samsung Galaxy S24 Ultra 256GB Titanium Black",
    category: Category.Electronics, platform: Platform.eBay,
    purchasePrice: 750, listPrice: 1000, status: Status.Sold,
    purchaseDate: new Date("2026-02-25"), listedDate: new Date("2026-03-04"),
    salePrice: 980, sellerShipping: 25, soldDate: new Date("2026-04-10"),
  },
  {
    sku: "SEED-ELC-007",
    itemName: "Xbox Series S 512GB Carbon Black",
    category: Category.Electronics, platform: Platform.eBay,
    purchasePrice: 250, listPrice: 310, status: Status.Active,
    purchaseDate: new Date("2026-03-01"), listedDate: new Date("2026-03-08"),
  },
  {
    sku: "SEED-ELC-008",
    itemName: "Apple iPhone 16 256GB Ultramarine (Unlocked)",
    category: Category.Electronics, platform: Platform.eBay,
    purchasePrice: 750, listPrice: 950, status: Status.Active,
    purchaseDate: new Date("2026-04-20"), listedDate: new Date("2026-04-28"),
  },
  {
    // [OLD STOCK] Purchased Oct 2025 — 212+ days unsold as of today
    sku: "SEED-ELC-009",
    itemName: "Steam Deck OLED 512GB",
    category: Category.Electronics, platform: Platform.eBay,
    purchasePrice: 480, listPrice: 580, status: Status.Active,
    purchaseDate: new Date("2025-10-15"), listedDate: new Date("2025-10-22"),
  },
  {
    sku: "SEED-ELC-010",
    itemName: "Sonos Era 300 Smart Speaker",
    category: Category.Electronics, platform: Platform.eBay,
    purchasePrice: 380, listPrice: 500, status: Status.Draft,
    purchaseDate: new Date("2026-04-25"), listedDate: null,
  },
  {
    sku: "SEED-ELC-011",
    itemName: "Meta Quest 3 512GB",
    category: Category.Electronics, platform: Platform.FacebookMarketplace,
    purchasePrice: 500, listPrice: 620, status: Status.Draft,
    purchaseDate: new Date("2026-05-05"), listedDate: null,
  },
  {
    sku: "SEED-ELC-012",
    itemName: "GoPro Hero 12 Black Creator Edition",
    category: Category.Electronics, platform: Platform.eBay,
    purchasePrice: 280, listPrice: 0, status: Status.Archived,
    purchaseDate: new Date("2025-12-10"), listedDate: null,
  },

  // ── Collectibles (10) ────────────────────────────────────────────────────────

  {
    // [HIGH ROI] Bought for $12 at retail, sold for $180 after a viral moment
    // ROI ≈ 1,159% after eBay fees + $6 shipping
    sku: "SEED-COL-001",
    itemName: "Funko Pop! Deadpool & Wolverine 'Chimichanga' #1368",
    category: Category.Collectibles, platform: Platform.eBay,
    purchasePrice: 12, listPrice: 180, status: Status.Sold,
    purchaseDate: new Date("2026-03-01"), listedDate: new Date("2026-03-08"),
    salePrice: 180, sellerShipping: 6, soldDate: new Date("2026-04-20"),
  },
  {
    sku: "SEED-COL-002",
    itemName: "LEGO Technic Bugatti Chiron 42083 (Retired, Sealed)",
    category: Category.Collectibles, platform: Platform.eBay,
    purchasePrice: 380, listPrice: 600, status: Status.Sold,
    purchaseDate: new Date("2025-11-10"), listedDate: new Date("2025-11-18"),
    salePrice: 560, sellerShipping: 30, soldDate: new Date("2026-02-08"),
  },
  {
    sku: "SEED-COL-003",
    itemName: "Vintage 1985 Transformers G1 Optimus Prime MIB",
    category: Category.Collectibles, platform: Platform.eBay,
    purchasePrice: 180, listPrice: 360, status: Status.Sold,
    purchaseDate: new Date("2025-12-02"), listedDate: new Date("2025-12-10"),
    salePrice: 340, sellerShipping: 20, soldDate: new Date("2026-01-22"),
  },
  {
    sku: "SEED-COL-004",
    itemName: "Hot Wheels RLC Custom '69 Camaro (Red)",
    category: Category.Collectibles, platform: Platform.eBay,
    purchasePrice: 30, listPrice: 80, status: Status.Sold,
    purchaseDate: new Date("2026-01-15"), listedDate: new Date("2026-01-22"),
    salePrice: 75, sellerShipping: 7, soldDate: new Date("2026-03-05"),
  },
  {
    sku: "SEED-COL-005",
    itemName: "Medicom KAWS Companion Bearbrick 400% Grey",
    category: Category.Collectibles, platform: Platform.eBay,
    purchasePrice: 280, listPrice: 500, status: Status.Sold,
    purchaseDate: new Date("2026-02-20"), listedDate: new Date("2026-02-28"),
    salePrice: 480, sellerShipping: 15, soldDate: new Date("2026-04-25"),
  },
  {
    sku: "SEED-COL-006",
    itemName: "LEGO Ideas NASA Apollo Saturn V 92176 (Retired)",
    category: Category.Collectibles, platform: Platform.eBay,
    purchasePrice: 120, listPrice: 220, status: Status.Active,
    purchaseDate: new Date("2026-02-08"), listedDate: new Date("2026-02-15"),
  },
  {
    sku: "SEED-COL-007",
    itemName: "Funko Pop! Gold Freddy Funko Convention Exclusive #01",
    category: Category.Collectibles, platform: Platform.eBay,
    purchasePrice: 500, listPrice: 850, status: Status.Active,
    purchaseDate: new Date("2026-03-15"), listedDate: new Date("2026-03-22"),
  },
  {
    sku: "SEED-COL-008",
    itemName: "Vintage GI Joe USS Flagg Aircraft Carrier (Complete, Boxed)",
    category: Category.Collectibles, platform: Platform.eBay,
    purchasePrice: 600, listPrice: 1100, status: Status.Draft,
    purchaseDate: new Date("2026-04-10"), listedDate: null,
  },
  {
    sku: "SEED-COL-009",
    itemName: "LEGO Millennium Falcon 75257 (Sealed)",
    category: Category.Collectibles, platform: Platform.eBay,
    purchasePrice: 180, listPrice: 280, status: Status.Draft,
    purchaseDate: new Date("2026-04-28"), listedDate: null,
  },
  {
    sku: "SEED-COL-010",
    itemName: "Precious Moments Figurine Collection Lot (20 pieces)",
    category: Category.Collectibles, platform: Platform.FacebookMarketplace,
    purchasePrice: 45, listPrice: 0, status: Status.Archived,
    purchaseDate: new Date("2025-11-20"), listedDate: null,
  },

  // ── Apparel (8) ──────────────────────────────────────────────────────────────

  {
    sku: "SEED-APP-001",
    itemName: "Supreme FW23 Box Logo Tee 'Navy' (Size L)",
    category: Category.Apparel, platform: Platform.StockX,
    purchasePrice: 78, listPrice: 180, status: Status.Sold,
    purchaseDate: new Date("2025-12-05"), listedDate: new Date("2025-12-12"),
    salePrice: 168, soldDate: new Date("2026-01-28"),
  },
  {
    sku: "SEED-APP-002",
    itemName: "Travis Scott Utopia Tour Tee (Size M)",
    category: Category.Apparel, platform: Platform.eBay,
    purchasePrice: 95, listPrice: 220, status: Status.Sold,
    purchaseDate: new Date("2026-01-08"), listedDate: new Date("2026-01-15"),
    salePrice: 195, sellerShipping: 12, soldDate: new Date("2026-02-15"),
  },
  {
    sku: "SEED-APP-003",
    itemName: "Stüssy x Nike Short Sleeve Tee (Size L)",
    category: Category.Apparel, platform: Platform.StockX,
    purchasePrice: 120, listPrice: 260, status: Status.Sold,
    purchaseDate: new Date("2026-01-22"), listedDate: new Date("2026-01-30"),
    salePrice: 240, soldDate: new Date("2026-03-20"),
  },
  {
    sku: "SEED-APP-004",
    itemName: "Kith Monday Program Hoodie 'Grey' (Size M)",
    category: Category.Apparel, platform: Platform.eBay,
    purchasePrice: 160, listPrice: 260, status: Status.Sold,
    purchaseDate: new Date("2026-02-10"), listedDate: new Date("2026-02-18"),
    salePrice: 235, sellerShipping: 15, soldDate: new Date("2026-04-05"),
  },
  {
    sku: "SEED-APP-005",
    itemName: "Off-White Industrial Belt 'White/White'",
    category: Category.Apparel, platform: Platform.StockX,
    purchasePrice: 85, listPrice: 180, status: Status.Active,
    purchaseDate: new Date("2026-02-10"), listedDate: new Date("2026-02-18"),
  },
  {
    sku: "SEED-APP-006",
    itemName: "Carhartt WIP Michigan Coat 'Beige' (Size L)",
    category: Category.Apparel, platform: Platform.eBay,
    purchasePrice: 220, listPrice: 380, status: Status.Active,
    purchaseDate: new Date("2026-03-08"), listedDate: new Date("2026-03-15"),
  },
  {
    sku: "SEED-APP-007",
    itemName: "Palace Tri-Ferg Logo Long Sleeve 'Black' (Size L)",
    category: Category.Apparel, platform: Platform.eBay,
    purchasePrice: 95, listPrice: 180, status: Status.Draft,
    purchaseDate: new Date("2026-05-01"), listedDate: null,
  },
  {
    sku: "SEED-APP-008",
    itemName: "Fear of God Essentials Hoodie 'Brown' (Size M)",
    category: Category.Apparel, platform: Platform.StockX,
    purchasePrice: 120, listPrice: 0, status: Status.Archived,
    purchaseDate: new Date("2025-12-05"), listedDate: null,
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("MarginIQ seed starting...\n");

  // Step 1: Clear all demo data — delete in reverse FK order to avoid
  //         "foreign key constraint failed" errors.
  //         Sale → InventoryItem → User
  console.log("Clearing old demo data...");
  await prisma.sale.deleteMany({ where: { userId: DEMO_USER_ID } });
  await prisma.inventoryItem.deleteMany({ where: { userId: DEMO_USER_ID } });
  await prisma.user.deleteMany({ where: { id: DEMO_USER_ID } });

  // Step 2: Create the demo user with a fixed ID so every rerun produces the
  //         same user row — useful for dev, API testing, and Prisma Studio.
  console.log("Creating demo user...");
  await prisma.user.create({
    data: {
      id:    DEMO_USER_ID,
      email: DEMO_USER_EMAIL,
      name:  "Demo User",
    },
  });

  // Step 3: Insert each inventory item, then — for Sold items — insert the
  //         matching Sale record with all computed fee/profit columns.
  console.log(`Seeding ${ITEMS.length} inventory items...\n`);
  let soldCount = 0;

  for (const item of ITEMS) {
    const inv = await prisma.inventoryItem.create({
      data: {
        userId:        DEMO_USER_ID,
        sku:           item.sku,
        itemName:      item.itemName,
        category:      item.category,
        platform:      item.platform,
        purchasePrice: item.purchasePrice,
        listPrice:     item.listPrice,
        status:        item.status,
        purchaseDate:  item.purchaseDate,
        listedDate:    item.listedDate ?? null,
      },
    });

    if (item.status === Status.Sold && item.salePrice != null && item.soldDate != null) {
      const sale = computeSaleFields(
        item.platform,
        item.salePrice,
        item.purchasePrice,
        item.sellerShipping ?? 0
      );

      await prisma.sale.create({
        data: {
          userId:          DEMO_USER_ID,
          inventoryItemId: inv.id,
          platform:        item.platform,
          salePrice:       item.salePrice,
          soldDate:        item.soldDate,
          shippingCost:    sale.shippingCost,
          platformFee:     sale.platformFee,
          paymentFee:      sale.paymentFee,
          totalFees:       sale.totalFees,
          payout:          sale.payout,
          netProfit:       sale.netProfit,
          profitMargin:    sale.profitMargin,
          roi:             sale.roi,
        },
      });

      soldCount++;
    }
  }

  // Summary
  const activeCount   = ITEMS.filter(i => i.status === Status.Active).length;
  const draftCount    = ITEMS.filter(i => i.status === Status.Draft).length;
  const archivedCount = ITEMS.filter(i => i.status === Status.Archived).length;

  console.log("Seed complete!");
  console.log(`  User:      ${DEMO_USER_EMAIL}`);
  console.log(`  Items:     ${ITEMS.length} total`);
  console.log(`             ${soldCount} Sold  |  ${activeCount} Active  |  ${draftCount} Draft  |  ${archivedCount} Archived`);
  console.log(`  Sales:     ${soldCount} records created`);
  console.log(`\nEdge cases included:`);
  console.log(`  [NEGATIVE PROFIT]  SEED-SNK-006 — buy $250, sell $240 + $25 eBay shipping`);
  console.log(`  [BREAK-EVEN]       SEED-TRD-005 — buy $45, sell $45 via Facebook Marketplace`);
  console.log(`  [HIGH ROI]         SEED-COL-001 — buy $12, sell $180 (~1,159% ROI)`);
  console.log(`  [OLD STOCK]        SEED-SNK-009 — purchased 2025-10-01 (226+ days unsold)`);
  console.log(`  [OLD STOCK]        SEED-ELC-009 — purchased 2025-10-15 (212+ days unsold)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
