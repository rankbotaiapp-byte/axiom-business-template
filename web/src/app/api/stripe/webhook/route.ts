import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { upsertUserSubscription } from "@/lib/billing/sync";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook secret is not configured." }, { status: 500 });
  }

  const signature = (await headers()).get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const rawBody = await request.text();
  const StripeModule = await import("stripe");
  const stripe = new StripeModule.default(secret, { apiVersion: "2026-07-29.dahlia", typescript: true });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch {
    return NextResponse.json({ error: "Webhook verification failed." }, { status: 400 });
  }

  const supabase = await createServerSupabase();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const subId = typeof session.subscription === "string" ? session.subscription : null;
      if (!subId || !session.metadata?.user_id) break;

      const subscription = await stripe.subscriptions.retrieve(subId);
      const item = subscription.items.data[0] ?? null;
      const price = item?.price ?? null;
      const product = typeof price?.product === "string" ? price.product : price?.product?.id ?? null;

      await upsertUserSubscription(supabase, {
        userId: session.metadata.user_id,
        stripeCustomerId: typeof session.customer === "string" ? session.customer : session.customer?.id ?? null,
        stripeSubscriptionId: subscription.id,
        status: subscription.status,
        tier: subscription.status === "active" || subscription.status === "trialing" ? "pro" : "free",
        currentPeriodEnd: item?.current_period_end ? new Date(item.current_period_end * 1000).toISOString() : null,
        cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
        priceId: price?.id ?? null,
        productId: product,
      });
      break;
    }
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id ?? null;
      const item = subscription.items.data[0] ?? null;
      const price = item?.price ?? null;
      const product = typeof price?.product === "string" ? price.product : price?.product?.id ?? null;
      const userRow = await supabase.from("user_subscriptions").select("user_id").eq("stripe_customer_id", customerId).maybeSingle();
      if (userRow.data?.user_id) {
        await upsertUserSubscription(supabase, {
          userId: userRow.data.user_id,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscription.id,
          status: subscription.status,
          tier: subscription.status === "active" || subscription.status === "trialing" ? "pro" : "free",
          currentPeriodEnd: item?.current_period_end ? new Date(item.current_period_end * 1000).toISOString() : null,
          cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
          priceId: price?.id ?? null,
          productId: product,
        });
      }
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id ?? null;
      const userRow = await supabase.from("user_subscriptions").select("user_id").eq("stripe_customer_id", customerId).maybeSingle();
      if (userRow.data?.user_id) {
        await upsertUserSubscription(supabase, {
          userId: userRow.data.user_id,
          stripeCustomerId: customerId,
          stripeSubscriptionId: null,
          status: "canceled",
          tier: "free",
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          priceId: null,
          productId: null,
        });
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
