import { NextResponse } from "next/server";

import { createServerSupabase } from "@/lib/supabase/server";
import { getStripeClient } from "@/lib/billing/stripe";

export async function POST(request: Request) {
  const { returnUrl } = await request.json().catch(() => ({ returnUrl: null }));
  const supabase = await createServerSupabase();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const stripe = getStripeClient();
  const subscriptions = await stripe.customers.search({
    query: `email:'${user.email ?? ""}'`,
  });

  const customer = subscriptions.data[0] ?? null;
  if (!customer) {
    return NextResponse.json({ error: "No Stripe customer record exists for this account." }, { status: 404 });
  }

  const portal = await stripe.billingPortal.sessions.create({
    customer: customer.id,
    return_url: returnUrl ?? `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/billing`,
  });

  return NextResponse.json({ url: portal.url });
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
