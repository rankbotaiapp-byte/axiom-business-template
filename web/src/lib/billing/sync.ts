import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import { normalizeSubscriptionStatus, normalizeSubscriptionTier, type SubscriptionStatus, type SubscriptionTier } from "@/lib/billing/features";

export type SubscriptionRecordInput = {
  userId: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  tier?: SubscriptionTier | null;
  status?: SubscriptionStatus | string | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean | null;
  priceId?: string | null;
  productId?: string | null;
};

export async function upsertUserSubscription(
  supabase: SupabaseClient<Database>,
  input: SubscriptionRecordInput,
): Promise<void> {
  const tier = normalizeSubscriptionTier(input.tier ?? null, input.status ?? null);
  const status = normalizeSubscriptionStatus(input.status ?? (tier === "pro" ? "active" : "free"));

  const { error } = await supabase.from("user_subscriptions").upsert(
    {
      user_id: input.userId,
      stripe_customer_id: input.stripeCustomerId ?? null,
      stripe_subscription_id: input.stripeSubscriptionId ?? null,
      tier,
      status,
      current_period_end: input.currentPeriodEnd ?? null,
      cancel_at_period_end: Boolean(input.cancelAtPeriodEnd),
      price_id: input.priceId ?? null,
      product_id: input.productId ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    throw new Error(error.message);
  }
}
