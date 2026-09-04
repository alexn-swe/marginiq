// ─── Marketplace Fee Calculator ───────────────────────────────────────────────
//
// DEMO ESTIMATES ONLY — these numbers are simplified approximations used for
// demonstration and learning purposes. Real marketplace rates change over time
// and depend on seller tier, category, and account settings.
//
// Actual rates (as of 2025):
//   eBay:  ~13.25% final value fee + Managed Payments processing (~2.9% + $0.30)
//   StockX: ~9–10% seller fee (transaction + payment) + shipping label fee
//   GOAT:  ~9.5% seller fee + 2.9% cash out fee + shipping

// ─── Return type ──────────────────────────────────────────────────────────────

export interface MarketplaceFees {
  /** Estimated marketplace commission charged on the sale */
  platformFee: number;
  /** Estimated payment processor fee */
  paymentFee: number;
  /** Platform-controlled shipping fee deducted from seller payout (if any) */
  shippingFee: number;
  /** Total of all three fees above */
  totalFees: number;
  /** Estimated seller payout: salePrice minus all fees */
  payout: number;
}

export interface SaleFinancials extends MarketplaceFees {
  /** Marketplace shipping fee plus any additional seller-paid shipping */
  shippingCost: number;
  /** Seller payout after every fee and shipping cost */
  payout: number;
  /** Payout minus the item's purchase price */
  netProfit: number;
  /** Net profit as a percentage of sale price */
  profitMargin: number;
  /** Net profit as a percentage of purchase price */
  roi: number;
}

// ─── Main calculator ──────────────────────────────────────────────────────────

/**
 * Estimates seller fees for a given marketplace and sale price.
 *
 * All values are simplified demo approximations — not actual marketplace rates.
 * Returns platformFee, paymentFee, shippingFee, totalFees, and estimated payout.
 *
 * @param platform  Marketplace name (e.g. "eBay", "StockX", "GOAT")
 * @param salePrice Final sale price the buyer paid, in USD
 */
export function calculateMarketplaceFees(
  platform: string,
  salePrice: number
): MarketplaceFees {
  let platformFee: number;
  let paymentFee: number;
  let shippingFee: number;

  switch (platform) {
    case "eBay":
      // Demo estimate: 10% platform fee, then 3% payment fee on remaining amount
      platformFee = salePrice * 0.10;
      paymentFee  = (salePrice - platformFee) * 0.03;
      shippingFee = 0; // Seller handles shipping separately (reflected in shippingCost)
      break;

    case "StockX":
      // Demo estimate: 10% platform fee, 3% payment fee, $5 flat shipping label
      platformFee = salePrice * 0.10;
      paymentFee  = (salePrice - platformFee) * 0.03;
      shippingFee = 5; // StockX provides a prepaid label and deducts this fee
      break;

    case "GOAT":
      // Demo estimate: 9.5% of (salePrice + $5 cash-out), 3% payment fee
      platformFee = (salePrice + 5) * 0.095;
      paymentFee  = salePrice * 0.03;
      shippingFee = 0; // GOAT covers inbound shipping to their authentication center
      break;

    case "Facebook Marketplace":
    case "FacebookMarketplace":
      // Local cash sales — no platform fees or payment processing
      platformFee = 0;
      paymentFee  = 0;
      shippingFee = 0;
      break;

    default:
      // Unknown platform — return zeros so callers don't break
      platformFee = 0;
      paymentFee  = 0;
      shippingFee = 0;
  }

  const totalFees = platformFee + paymentFee + shippingFee;
  const payout    = salePrice - totalFees;

  return {
    platformFee: round2(platformFee),
    paymentFee:  round2(paymentFee),
    shippingFee: round2(shippingFee),
    totalFees:   round2(totalFees),
    payout:      round2(payout),
  };
}

/**
 * Calculates every financial value stored on a Sale record.
 * `sellerShipping` is an additional out-of-pocket shipping cost entered by
 * the seller. Platform-controlled shipping fees are added automatically.
 */
export function calculateSaleFinancials(
  platform: string,
  salePrice: number,
  purchasePrice: number,
  sellerShipping = 0
): SaleFinancials {
  const marketplaceFees = calculateMarketplaceFees(platform, salePrice);
  const shippingCost = round2(
    marketplaceFees.shippingFee + sellerShipping
  );
  const totalFees = round2(
    shippingCost + marketplaceFees.platformFee + marketplaceFees.paymentFee
  );
  const payout = round2(salePrice - totalFees);
  const netProfit = round2(payout - purchasePrice);
  const profitMargin =
    salePrice > 0 ? round4((netProfit / salePrice) * 100) : 0;
  const roi =
    purchasePrice > 0 ? round4((netProfit / purchasePrice) * 100) : 0;

  return {
    platformFee: marketplaceFees.platformFee,
    paymentFee: marketplaceFees.paymentFee,
    shippingFee: marketplaceFees.shippingFee,
    shippingCost,
    totalFees,
    payout,
    netProfit,
    profitMargin,
    roi,
  };
}

// Round to 2 decimal places to avoid floating-point noise in dollar amounts
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}
