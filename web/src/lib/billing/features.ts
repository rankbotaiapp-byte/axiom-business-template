export type SubscriptionTier = "free" | "pro";
export type SubscriptionStatus =
  | "free"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "unpaid"
  | "paused";

export type PremiumFeature =
  | "guidedExtraction"
  | "capacityForecasting"
  | "verifiedOutcomes"
  | "fullPdfExports"
  | "portfolio";

export const PREMIUM_FEATURES: PremiumFeature[] = [
  "guidedExtraction",
  "capacityForecasting",
  "verifiedOutcomes",
  "fullPdfExports",
  "portfolio",
];

export const FEATURE_LABELS: Record<PremiumFeature, string> = {
  guidedExtraction: "Guided Extraction Session",
  capacityForecasting: "Capacity Forecasting",
  verifiedOutcomes: "Verified Outcomes",
  fullPdfExports: "Full PDF exports",
  portfolio: "Portfolio features",
};

export function normalizeSubscriptionTier(
  tier?: string | null,
  status?: string | null,
): SubscriptionTier {
  if (tier === "pro") return "pro";
  if (status && ["trialing", "active", "past_due"].includes(status)) return "pro";
  return "free";
}

export function normalizeSubscriptionStatus(status?: string | null): SubscriptionStatus {
  if (!status) return "free";
  if (status === "trialing") return "trialing";
  if (status === "active") return "active";
  if (status === "past_due") return "past_due";
  if (status === "canceled") return "canceled";
  if (status === "incomplete") return "incomplete";
  if (status === "unpaid") return "unpaid";
  if (status === "paused") return "paused";
  return "free";
}

export function isProSubscription(
  tier?: string | null,
  status?: string | null,
): boolean {
  return normalizeSubscriptionTier(tier, status) === "pro";
}

export function canAccessFeature(
  feature: PremiumFeature,
  tier?: string | null,
  status?: string | null,
): boolean {
  void feature;
  return isProSubscription(tier, status);
}

export function upgradePrompt(feature: PremiumFeature): string {
  const label = FEATURE_LABELS[feature];
  return `Upgrade to Z Point Pro to enable ${label}.`;
}
