import Stripe from "stripe";

import { BILLING_CONFIG } from "@/lib/billing/config";
import { normalizeSubscriptionStatus, type SubscriptionStatus, type SubscriptionTier } from "@/lib/billing/features";

export function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  return new Stripe(secretKey, {
    apiVersion: "2026-07-29.dahlia",
    typescript: true,
  });
}

export function getWebhookSecret(): string {
  return process.env.STRIPE_WEBHOOK_SECRET ?? "";
}

export function getProCheckoutUrl(): string {
  return BILLING_CONFIG.proTier.monthlyPriceId ? "configured" : "missing";
}

export function normalizeStripeSubscriptionState(
  customerId: string | null,
  subscription: Stripe.Subscription | null,
): {
  customerId: string | null;
  subscriptionId: string | null;
  status: SubscriptionStatus;
  tier: SubscriptionTier;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  priceId: string | null;
  productId: string | null;
} {
  const status = normalizeSubscriptionStatus(subscription?.status ?? "free");
  const tier = status === "free" ? "free" : "pro";

  const item = subscription?.items?.data?.[0] ?? null;
  const price = item?.price ?? null;
  const product = price?.product;
  const currentPeriodEnd = typeof item?.current_period_end === "number" ? item.current_period_end : null;

  return {
    customerId,
    subscriptionId: subscription?.id ?? null,
    status,
    tier,
    currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null,
    cancelAtPeriodEnd: Boolean(subscription?.cancel_at_period_end),
    priceId: typeof price?.id === "string" ? price.id : null,
    productId: typeof product === "string" ? product : typeof product === "object" ? product.id : null,
  };
}
