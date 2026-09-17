import { createServerSupabase } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type UserSubscriptionRow = Database["public"]["Tables"]["user_subscriptions"]["Row"];

export async function loadUserSubscription(userId?: string) {
  const supabase = await createServerSupabase();
  const effectiveUserId = userId ?? (await supabase.auth.getUser()).data.user?.id;
  if (!effectiveUserId) return null;

  const { data, error } = await supabase.from("user_subscriptions").select("*").eq("user_id", effectiveUserId).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function isUserPro(userId?: string): Promise<boolean> {
  const row = await loadUserSubscription(userId);
  return row?.tier === "pro" || row?.status === "active" || row?.status === "trialing";
}
