export type BillingInterval = "month" | "year";

export const BILLING_CONFIG = {
  freeTier: {
    name: "Free",
    features: [
      "Basic capture and storage",
      "Local record retention",
    ],
  },
  proTier: {
    name: "Pro",
    productLabel: "Z Point Pro",
    monthlyPriceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID ?? "",
    yearlyPriceId: process.env.STRIPE_PRO_YEARLY_PRICE_ID ?? "",
    features: [
      "Guided Extraction Session",
      "Capacity Forecasting",
      "Verified Outcomes",
      "Full PDF exports",
      "Full portfolio features",
    ],
  },
} as const;

export function getProPriceId(interval: BillingInterval = "month"): string {
  if (interval === "year") return BILLING_CONFIG.proTier.yearlyPriceId;
  return BILLING_CONFIG.proTier.monthlyPriceId;
}

export function hasStripeBillingConfiguration(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
}
