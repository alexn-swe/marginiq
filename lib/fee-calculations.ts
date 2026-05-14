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

// Round to 2 decimal places to avoid floating-point noise in dollar amounts
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
