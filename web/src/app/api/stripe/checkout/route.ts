import { NextResponse } from "next/server";

import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { priceId, returnUrl } = await request.json().catch(() => ({ priceId: null, returnUrl: null }));

  const supabase = await createServerSupabase();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 500 });
  }

  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(secretKey, { apiVersion: "2026-07-29.dahlia", typescript: true });

  const effectivePriceId = String(priceId ?? process.env.STRIPE_PRO_MONTHLY_PRICE_ID ?? "");

  if (!effectivePriceId) {
    return NextResponse.json({ error: "Pro pricing is not configured." }, { status: 400 });
  }

  const customerSearch = await stripe.customers.search({ query: `email:'${user.email ?? ""}'` });
  const customer = customerSearch.data[0] ?? null;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customer?.id ?? undefined,
    customer_email: customer ? undefined : user.email ?? undefined,
    line_items: [{ price: effectivePriceId, quantity: 1 }],
    success_url: `${returnUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${returnUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/billing?canceled=1`,
    metadata: { user_id: user.id, plan: "pro" },
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: session.url, status: "ok" });
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
