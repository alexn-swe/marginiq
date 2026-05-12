// ─── Types ────────────────────────────────────────────────────────────────────

export type Platform = "eBay" | "StockX" | "Facebook Marketplace" | "GOAT";
export type Category =
  | "Sneakers"
  | "Trading Cards"
  | "Electronics"
  | "Collectibles"
  | "Apparel";
export type Status = "Active" | "Sold" | "Draft" | "Archived";

export interface InventoryItem {
  id: string;
  itemName: string;
  sku: string;
  category: Category;
  platform: Platform;
  purchasePrice: number;
  listPrice: number;
  /** null when the item has not been sold */
  salePrice: number | null;
  /** Paid by seller to ship the item; 0 for local / FB Marketplace pickups */
  shippingCost: number;
  /** Marketplace commission taken from the sale price */
  platformFee: number;
  /** Payment-processor fee taken from the sale price */
  paymentFee: number;
  status: Status;
  purchaseDate: string; // ISO 8601, e.g. "2025-11-03"
  /** null while still in Draft status */
  listedDate: string | null;
  /** null until sold */
  soldDate: string | null;
}

// ─── Helper functions ─────────────────────────────────────────────────────────

/**
 * Net Profit = Sale Price − Purchase Price − Shipping − Platform Fee − Payment Fee
 * Returns 0 for unsold items.
 */
export function calcNetProfit(item: InventoryItem): number {
  if (item.salePrice === null) return 0;
  return (
    item.salePrice -
    item.purchasePrice -
    item.shippingCost -
    item.platformFee -
    item.paymentFee
  );
}

/**
 * Profit Margin = Net Profit / Sale Price  (expressed as a 0–1 decimal)
 * Returns 0 for unsold items.
 */
export function calcProfitMargin(item: InventoryItem): number {
  if (!item.salePrice) return 0;
  return calcNetProfit(item) / item.salePrice;
}

/**
 * ROI = Net Profit / Purchase Price  (expressed as a 0–1 decimal)
 * Returns 0 for unsold items.
 */
export function calcROI(item: InventoryItem): number {
  if (!item.salePrice || item.purchasePrice === 0) return 0;
  return calcNetProfit(item) / item.purchasePrice;
}

/**
 * Inventory Age in days.
 * For sold items: purchaseDate → soldDate
 * For everything else: purchaseDate → today (pinned to 2026-05-11 for reproducibility)
 */
export function calcInventoryAge(item: InventoryItem): number {
  const start = new Date(item.purchaseDate);
  const end = item.soldDate ? new Date(item.soldDate) : new Date("2026-05-11");
  return Math.floor((end.getTime() - start.getTime()) / 86_400_000);
}

// ─── Aggregate helpers ────────────────────────────────────────────────────────

export const getSoldItems = (items: InventoryItem[]) =>
  items.filter((i) => i.status === "Sold");

export const getActiveItems = (items: InventoryItem[]) =>
  items.filter((i) => i.status === "Active");

export const getDraftItems = (items: InventoryItem[]) =>
  items.filter((i) => i.status === "Draft");

/** Sum of salePrice across all sold items */
export const getTotalRevenue = (items: InventoryItem[]) =>
  getSoldItems(items).reduce((sum, i) => sum + (i.salePrice ?? 0), 0);

/** Sum of net profit across all sold items */
export const getTotalNetProfit = (items: InventoryItem[]) =>
  getSoldItems(items).reduce((sum, i) => sum + calcNetProfit(i), 0);

/** Sum of listPrice across all Active items */
export const getActiveInventoryValue = (items: InventoryItem[]) =>
  getActiveItems(items).reduce((sum, i) => sum + i.listPrice, 0);

/** Sold items whose soldDate falls in the given YYYY-MM month string */
export const getSoldInMonth = (items: InventoryItem[], yearMonth: string) =>
  getSoldItems(items).filter((i) => i.soldDate?.startsWith(yearMonth));

// ─── Formatting utilities ─────────────────────────────────────────────────────

export function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

/** Returns e.g. "+130.0%" or "-12.5%" */
export function formatChange(current: number, previous: number): string {
  if (previous === 0) return "—";
  const pct = ((current - previous) / previous) * 100;
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

// ─── Monthly analytics data (12 months) ──────────────────────────────────────
//
// May 2025 – Oct 2025: historical entries (no inventory records that far back).
// Nov 2025 – Apr 2026: values derived from the sold items in the inventory array.

export interface MonthlyData {
  /** Short label shown on chart axes, e.g. "May '25" */
  month: string;
  /** ISO year-month string used for filtering, e.g. "2025-05" */
  yearMonth: string;
  /** Total sale price of items sold this month */
  revenue: number;
  /** Net profit after all costs for items sold this month */
  profit: number;
}

export const monthlyData: MonthlyData[] = [
  { month: "May '25",  yearMonth: "2025-05", revenue: 450,  profit: 98  },
  { month: "Jun '25",  yearMonth: "2025-06", revenue: 620,  profit: 142 },
  { month: "Jul '25",  yearMonth: "2025-07", revenue: 780,  profit: 198 },
  { month: "Aug '25",  yearMonth: "2025-08", revenue: 940,  profit: 243 },
  { month: "Sep '25",  yearMonth: "2025-09", revenue: 1120, profit: 289 },
  { month: "Oct '25",  yearMonth: "2025-10", revenue: 1340, profit: 348 },
  { month: "Nov '25",  yearMonth: "2025-11", revenue: 823,  profit: 158 },
  { month: "Dec '25",  yearMonth: "2025-12", revenue: 1024, profit: 213 },
  { month: "Jan '26",  yearMonth: "2026-01", revenue: 2145, profit: 381 },
  { month: "Feb '26",  yearMonth: "2026-02", revenue: 365,  profit: 86  },
  { month: "Mar '26",  yearMonth: "2026-03", revenue: 607,  profit: 90  },
  { month: "Apr '26",  yearMonth: "2026-04", revenue: 1395, profit: 341 },
];

// ─── Mock inventory data (35 records) ────────────────────────────────────────
//
// Platform fee rates used:
//   eBay              13.25% of sale price
//   StockX             9.00% of sale price
//   GOAT               9.50% of sale price
//   Facebook Marketplace  0% (local cash pickup)
//
// Payment fee rates:
//   eBay / StockX / GOAT  3.00% of sale price (simplified)
//   Facebook Marketplace  0%

export const inventory: InventoryItem[] = [
  // ── Sneakers ──────────────────────────────────────────────────────────────

  {
    id: "item-001",
    itemName: "Nike Air Jordan 1 High OG 'Bred Toe'",
    sku: "INV-2025-001",
    category: "Sneakers",
    platform: "StockX",
    purchasePrice: 180,
    listPrice: 320,
    salePrice: 310,
    shippingCost: 15,
    platformFee: 27.9,   // 9%
    paymentFee: 9.3,     // 3%
    status: "Sold",
    purchaseDate: "2025-11-03",
    listedDate: "2025-11-10",
    soldDate: "2026-01-08",
  },
  {
    id: "item-002",
    itemName: "Adidas Yeezy Boost 350 V2 Zebra",
    sku: "INV-2025-002",
    category: "Sneakers",
    platform: "StockX",
    purchasePrice: 220,
    listPrice: 380,
    salePrice: 365,
    shippingCost: 15,
    platformFee: 32.85,  // 9%
    paymentFee: 10.95,   // 3%
    status: "Sold",
    purchaseDate: "2025-12-01",
    listedDate: "2025-12-08",
    soldDate: "2026-02-12",
  },
  {
    id: "item-003",
    itemName: "Nike Dunk Low 'Panda'",
    sku: "INV-2025-003",
    category: "Sneakers",
    platform: "GOAT",
    purchasePrice: 110,
    listPrice: 200,
    salePrice: 185,
    shippingCost: 12,
    platformFee: 17.58,  // 9.5%
    paymentFee: 5.37,    // 3% (rounded from 5.55 — GOAT uses 2.9%)
    status: "Sold",
    purchaseDate: "2025-10-15",
    listedDate: "2025-10-20",
    soldDate: "2026-03-05",
  },
  {
    id: "item-004",
    itemName: "New Balance 550 White Green",
    sku: "INV-2026-001",
    category: "Sneakers",
    platform: "StockX",
    purchasePrice: 90,
    listPrice: 175,
    salePrice: null,
    shippingCost: 0,
    platformFee: 0,
    paymentFee: 0,
    status: "Active",
    purchaseDate: "2026-02-20",
    listedDate: "2026-02-25",
    soldDate: null,
  },
  {
    id: "item-005",
    itemName: "Nike Air Jordan 4 Retro 'Military Blue'",
    sku: "INV-2026-002",
    category: "Sneakers",
    platform: "StockX",
    purchasePrice: 380,
    listPrice: 650,
    salePrice: null,
    shippingCost: 0,
    platformFee: 0,
    paymentFee: 0,
    status: "Active",
    purchaseDate: "2026-03-10",
    listedDate: "2026-03-18",
    soldDate: null,
  },
  {
    id: "item-006",
    itemName: "Nike Air Force 1 Low Triple White",
    sku: "INV-2025-004",
    category: "Sneakers",
    platform: "eBay",
    purchasePrice: 90,
    listPrice: 150,
    salePrice: 145,
    shippingCost: 12,
    platformFee: 19.21,  // 13.25%
    paymentFee: 4.35,    // 3%
    status: "Sold",
    purchaseDate: "2025-10-05",
    listedDate: "2025-10-12",
    soldDate: "2025-11-15",
  },
  {
    id: "item-007",
    itemName: "Adidas Yeezy Slide Pure",
    sku: "INV-2025-005",
    category: "Sneakers",
    platform: "eBay",
    purchasePrice: 70,
    listPrice: 120,
    salePrice: 112,
    shippingCost: 10,
    platformFee: 14.84,  // 13.25%
    paymentFee: 3.36,    // 3%
    status: "Sold",
    purchaseDate: "2025-12-05",
    listedDate: "2025-12-10",
    soldDate: "2025-12-28",
  },
  {
    id: "item-008",
    itemName: "New Balance 2002R Protection Pack 'Agate Grey'",
    sku: "INV-2026-003",
    category: "Sneakers",
    platform: "eBay",
    purchasePrice: 130,
    listPrice: 220,
    salePrice: null,
    shippingCost: 0,
    platformFee: 0,
    paymentFee: 0,
    status: "Draft",
    purchaseDate: "2026-03-22",
    listedDate: null,
    soldDate: null,
  },
  {
    id: "item-009",
    itemName: "Nike Air Jordan 11 Retro 'Cherry'",
    sku: "INV-2025-006",
    category: "Sneakers",
    platform: "StockX",
    purchasePrice: 220,
    listPrice: 340,
    salePrice: 325,
    shippingCost: 15,
    platformFee: 29.25,  // 9%
    paymentFee: 9.75,    // 3%
    status: "Sold",
    purchaseDate: "2025-12-10",
    listedDate: "2025-12-18",
    soldDate: "2026-04-03",
  },
  {
    id: "item-010",
    itemName: "Adidas Stan Smith Lux 'Core White'",
    sku: "INV-2026-004",
    category: "Sneakers",
    platform: "StockX",
    purchasePrice: 100,
    listPrice: 180,
    salePrice: null,
    shippingCost: 0,
    platformFee: 0,
    paymentFee: 0,
    status: "Draft",
    purchaseDate: "2026-04-15",
    listedDate: null,
    soldDate: null,
  },
  {
    id: "item-011",
    itemName: "Off-White x Nike Dunk Low 'The 50' #22",
    sku: "INV-2026-005",
    category: "Sneakers",
    platform: "StockX",
    purchasePrice: 200,
    listPrice: 460,
    salePrice: 440,
    shippingCost: 15,
    platformFee: 39.6,   // 9%
    paymentFee: 13.2,    // 3%
    status: "Sold",
    purchaseDate: "2026-03-05",
    listedDate: "2026-03-12",
    soldDate: "2026-04-15",
  },

  // ── Trading Cards ──────────────────────────────────────────────────────────

  {
    id: "item-012",
    itemName: "Pokémon Charizard Base Set Holo PSA 8",
    sku: "INV-2025-007",
    category: "Trading Cards",
    platform: "eBay",
    purchasePrice: 250,
    listPrice: 420,
    salePrice: 400,
    shippingCost: 5,
    platformFee: 53.0,   // 13.25%
    paymentFee: 12.0,    // 3%
    status: "Sold",
    purchaseDate: "2025-10-20",
    listedDate: "2025-10-28",
    soldDate: "2025-12-18",
  },
  {
    id: "item-013",
    itemName: "Pokémon Umbreon VMAX Alternate Art PSA 10",
    sku: "INV-2026-006",
    category: "Trading Cards",
    platform: "eBay",
    purchasePrice: 180,
    listPrice: 290,
    salePrice: null,
    shippingCost: 0,
    platformFee: 0,
    paymentFee: 0,
    status: "Active",
    purchaseDate: "2026-01-15",
    listedDate: "2026-01-22",
    soldDate: null,
  },
  {
    id: "item-014",
    itemName: "LeBron James 2003-04 Topps Chrome Rookie PSA 9",
    sku: "INV-2025-008",
    category: "Trading Cards",
    platform: "eBay",
    purchasePrice: 320,
    listPrice: 550,
    salePrice: 520,
    shippingCost: 8,
    platformFee: 68.9,   // 13.25%
    paymentFee: 15.6,    // 3%
    status: "Sold",
    purchaseDate: "2025-11-10",
    listedDate: "2025-11-18",
    soldDate: "2026-01-25",
  },
  {
    id: "item-015",
    itemName: "1952 Topps Mickey Mantle Heritage Reprint",
    sku: "INV-2025-009",
    category: "Trading Cards",
    platform: "eBay",
    purchasePrice: 45,
    listPrice: 85,
    salePrice: 78,
    shippingCost: 4,
    platformFee: 10.34,  // 13.25%
    paymentFee: 2.34,    // 3%
    status: "Sold",
    purchaseDate: "2025-10-12",
    listedDate: "2025-10-18",
    soldDate: "2025-11-28",
  },
  {
    id: "item-016",
    itemName: "Magic: The Gathering Beta Dual Lands Set (4x)",
    sku: "INV-2026-007",
    category: "Trading Cards",
    platform: "eBay",
    purchasePrice: 180,
    listPrice: 310,
    salePrice: 290,
    shippingCost: 5,
    platformFee: 38.43,  // 13.25%
    paymentFee: 8.7,     // 3%
    status: "Sold",
    purchaseDate: "2026-02-10",
    listedDate: "2026-02-18",
    soldDate: "2026-04-22",
  },
  {
    id: "item-017",
    itemName: "Pokémon Hidden Fates Elite Trainer Box (Sealed)",
    sku: "INV-2026-008",
    category: "Trading Cards",
    platform: "eBay",
    purchasePrice: 95,
    listPrice: 185,
    salePrice: 172,
    shippingCost: 8,
    platformFee: 22.79,  // 13.25%
    paymentFee: 5.16,    // 3%
    status: "Sold",
    purchaseDate: "2026-01-08",
    listedDate: "2026-01-15",
    soldDate: "2026-03-18",
  },
  {
    id: "item-018",
    itemName: "Pokémon Paldea Evolved Booster Box (Sealed)",
    sku: "INV-2025-010",
    category: "Trading Cards",
    platform: "eBay",
    purchasePrice: 120,
    listPrice: 0,
    salePrice: null,
    shippingCost: 0,
    platformFee: 0,
    paymentFee: 0,
    status: "Archived",
    purchaseDate: "2025-10-30",
    listedDate: null,
    soldDate: null,
  },

  // ── Electronics ────────────────────────────────────────────────────────────

  {
    id: "item-019",
    itemName: "Sony PlayStation 5 Disc Edition",
    sku: "INV-2025-011",
    category: "Electronics",
    platform: "Facebook Marketplace",
    purchasePrice: 450,
    listPrice: 580,
    salePrice: 560,
    shippingCost: 0,
    platformFee: 0,
    paymentFee: 0,
    status: "Sold",
    purchaseDate: "2025-11-05",
    listedDate: "2025-11-05",
    soldDate: "2025-11-10",
  },
  {
    id: "item-020",
    itemName: "Microsoft Xbox Series X 1TB",
    sku: "INV-2025-012",
    category: "Electronics",
    platform: "eBay",
    purchasePrice: 450,
    listPrice: 620,
    salePrice: 610,
    shippingCost: 20,
    platformFee: 80.83,  // 13.25%
    paymentFee: 18.3,    // 3%
    status: "Sold",
    purchaseDate: "2025-12-15",
    listedDate: "2025-12-20",
    soldDate: "2026-01-15",
  },
  {
    id: "item-021",
    itemName: "Nintendo Switch OLED White",
    sku: "INV-2025-013",
    category: "Electronics",
    platform: "Facebook Marketplace",
    purchasePrice: 295,
    listPrice: 380,
    salePrice: 360,
    shippingCost: 0,
    platformFee: 0,
    paymentFee: 0,
    status: "Sold",
    purchaseDate: "2025-12-08",
    listedDate: "2025-12-08",
    soldDate: "2025-12-22",
  },
  {
    id: "item-022",
    itemName: "Apple AirPods Pro 2nd Generation (USB-C)",
    sku: "INV-2026-009",
    category: "Electronics",
    platform: "eBay",
    purchasePrice: 190,
    listPrice: 270,
    salePrice: 250,
    shippingCost: 10,
    platformFee: 33.13,  // 13.25%
    paymentFee: 7.5,     // 3%
    status: "Sold",
    purchaseDate: "2026-01-20",
    listedDate: "2026-01-28",
    soldDate: "2026-03-28",
  },
  {
    id: "item-023",
    itemName: "iPhone 14 Pro 256GB Space Black (Unlocked)",
    sku: "INV-2026-010",
    category: "Electronics",
    platform: "eBay",
    purchasePrice: 680,
    listPrice: 850,
    salePrice: null,
    shippingCost: 0,
    platformFee: 0,
    paymentFee: 0,
    status: "Active",
    purchaseDate: "2026-03-18",
    listedDate: "2026-03-25",
    soldDate: null,
  },
  {
    id: "item-024",
    itemName: "Apple iPad Pro 12.9\" M2 WiFi 256GB",
    sku: "INV-2026-011",
    category: "Electronics",
    platform: "eBay",
    purchasePrice: 850,
    listPrice: 1100,
    salePrice: null,
    shippingCost: 0,
    platformFee: 0,
    paymentFee: 0,
    status: "Active",
    purchaseDate: "2026-04-05",
    listedDate: "2026-04-12",
    soldDate: null,
  },
  {
    id: "item-025",
    itemName: "Samsung Galaxy S23 Ultra 256GB Phantom Black",
    sku: "INV-2026-012",
    category: "Electronics",
    platform: "eBay",
    purchasePrice: 720,
    listPrice: 920,
    salePrice: null,
    shippingCost: 0,
    platformFee: 0,
    paymentFee: 0,
    status: "Draft",
    purchaseDate: "2026-04-20",
    listedDate: null,
    soldDate: null,
  },
  {
    id: "item-026",
    itemName: "Apple Watch Series 8 45mm GPS Midnight",
    sku: "INV-2026-013",
    category: "Electronics",
    platform: "Facebook Marketplace",
    purchasePrice: 280,
    listPrice: 360,
    salePrice: 340,
    shippingCost: 0,
    platformFee: 0,
    paymentFee: 0,
    status: "Sold",
    purchaseDate: "2026-02-15",
    listedDate: "2026-02-15",
    soldDate: "2026-04-07",
  },

  // ── Collectibles ───────────────────────────────────────────────────────────

  {
    id: "item-027",
    itemName: "Funko Pop! Spider-Man: No Way Home #1001 (Glow)",
    sku: "INV-2025-014",
    category: "Collectibles",
    platform: "eBay",
    purchasePrice: 15,
    listPrice: 45,
    salePrice: 40,
    shippingCost: 6,
    platformFee: 5.3,    // 13.25%
    paymentFee: 1.2,     // 3%
    status: "Sold",
    purchaseDate: "2025-10-08",
    listedDate: "2025-10-15",
    soldDate: "2025-11-20",
  },
  {
    id: "item-028",
    itemName: "LEGO Star Wars UCS Millennium Falcon 75192",
    sku: "INV-2026-014",
    category: "Collectibles",
    platform: "eBay",
    purchasePrice: 650,
    listPrice: 900,
    salePrice: null,
    shippingCost: 0,
    platformFee: 0,
    paymentFee: 0,
    status: "Active",
    purchaseDate: "2026-02-28",
    listedDate: "2026-03-05",
    soldDate: null,
  },
  {
    id: "item-029",
    itemName: "Vintage 1977 Star Wars Action Figure Complete Set (12-piece)",
    sku: "INV-2025-015",
    category: "Collectibles",
    platform: "eBay",
    purchasePrice: 120,
    listPrice: 280,
    salePrice: 255,
    shippingCost: 18,
    platformFee: 33.79,  // 13.25%
    paymentFee: 7.65,    // 3%
    status: "Sold",
    purchaseDate: "2025-11-15",
    listedDate: "2025-11-22",
    soldDate: "2026-01-30",
  },
  {
    id: "item-030",
    itemName: "Medicom Toy BE@RBRICK 400% KAWS Companion Grey",
    sku: "INV-2026-015",
    category: "Collectibles",
    platform: "eBay",
    purchasePrice: 280,
    listPrice: 450,
    salePrice: null,
    shippingCost: 0,
    platformFee: 0,
    paymentFee: 0,
    status: "Active",
    purchaseDate: "2026-03-25",
    listedDate: "2026-04-01",
    soldDate: null,
  },

  // ── Apparel ────────────────────────────────────────────────────────────────

  {
    id: "item-031",
    itemName: "Supreme FW22 Box Logo Tee White (Size L)",
    sku: "INV-2025-016",
    category: "Apparel",
    platform: "StockX",
    purchasePrice: 68,
    listPrice: 165,
    salePrice: 152,
    shippingCost: 12,
    platformFee: 13.68,  // 9%
    paymentFee: 4.56,    // 3%
    status: "Sold",
    purchaseDate: "2025-10-22",
    listedDate: "2025-10-30",
    soldDate: "2025-12-12",
  },
  {
    id: "item-032",
    itemName: "Supreme SS23 Box Logo Hoodie Black (Size M)",
    sku: "INV-2026-016",
    category: "Apparel",
    platform: "StockX",
    purchasePrice: 168,
    listPrice: 420,
    salePrice: null,
    shippingCost: 0,
    platformFee: 0,
    paymentFee: 0,
    status: "Active",
    purchaseDate: "2026-01-25",
    listedDate: "2026-02-02",
    soldDate: null,
  },
  {
    id: "item-033",
    itemName: "Palace Tri-Ferg Track Jacket Navy (Size L)",
    sku: "INV-2026-017",
    category: "Apparel",
    platform: "eBay",
    purchasePrice: 145,
    listPrice: 260,
    salePrice: null,
    shippingCost: 0,
    platformFee: 0,
    paymentFee: 0,
    status: "Active",
    purchaseDate: "2026-02-18",
    listedDate: "2026-02-25",
    soldDate: null,
  },
  {
    id: "item-034",
    itemName: "Bape ABC Shark Full Zip Hoodie Blue Camo (Size M)",
    sku: "INV-2025-017",
    category: "Apparel",
    platform: "eBay",
    purchasePrice: 280,
    listPrice: 480,
    salePrice: 450,
    shippingCost: 18,
    platformFee: 59.63,  // 13.25%
    paymentFee: 13.5,    // 3%
    status: "Sold",
    purchaseDate: "2025-11-20",
    listedDate: "2025-11-28",
    soldDate: "2026-01-22",
  },
  {
    id: "item-035",
    itemName: "Stone Island AW23 Ghost Crewneck Sweatshirt (Size L)",
    sku: "INV-2026-018",
    category: "Apparel",
    platform: "eBay",
    purchasePrice: 320,
    listPrice: 520,
    salePrice: null,
    shippingCost: 0,
    platformFee: 0,
    paymentFee: 0,
    status: "Draft",
    purchaseDate: "2026-04-28",
    listedDate: null,
    soldDate: null,
  },
];
