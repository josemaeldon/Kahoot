import type Stripe from "stripe";
import { query } from "@lib/db";

export const STRIPE_WEBHOOK_EVENTS = [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.subscription.paused",
  "customer.subscription.resumed",
] as const;

const subscriptionEventTypes = new Set<string>(
  STRIPE_WEBHOOK_EVENTS.filter((type) => type.startsWith("customer.subscription."))
);

function customerId(subscription: Stripe.Subscription) {
  return typeof subscription.customer === "string"
    ? subscription.customer
    : subscription.customer.id;
}

function periodEnd(subscription: Stripe.Subscription) {
  const ends = subscription.items.data.map((item) => item.current_period_end);
  return ends.length ? Math.max(...ends) : null;
}

async function resolveUserId(subscription: Stripe.Subscription) {
  if (subscription.metadata.userId) return subscription.metadata.userId;
  const result = await query<{ id: string }>(
    "select id::text from users where stripe_customer_id=$1 limit 1",
    [customerId(subscription)]
  );
  return result.rows[0]?.id || null;
}

async function resolvePlanId(subscription: Stripe.Subscription) {
  if (subscription.metadata.planId) return subscription.metadata.planId;
  const priceId = subscription.items.data[0]?.price.id;
  if (!priceId) return null;
  const result = await query<{ id: string }>(
    "select id::text from subscription_plans where stripe_price_id=$1 limit 1",
    [priceId]
  );
  return result.rows[0]?.id || null;
}

export async function synchronizeSubscription(subscription: Stripe.Subscription) {
  const userId = await resolveUserId(subscription);
  if (!userId) {
    throw new Error(`Assinatura ${subscription.id} sem usuário associado.`);
  }
  const planId = await resolvePlanId(subscription);
  const end = periodEnd(subscription);
  const stripeCustomerId = customerId(subscription);

  await query(
    `insert into user_subscriptions
       (user_id, plan_id, stripe_subscription_id, stripe_customer_id, status,
        current_period_end, cancel_at_period_end)
     values ($1::uuid, nullif($2, '')::uuid, $3, $4, $5,
             case when $6::bigint is null then null else to_timestamp($6) end, $7)
     on conflict (stripe_subscription_id) do update set
       user_id=excluded.user_id, plan_id=excluded.plan_id,
       stripe_customer_id=excluded.stripe_customer_id, status=excluded.status,
       current_period_end=excluded.current_period_end,
       cancel_at_period_end=excluded.cancel_at_period_end, updated_at=now()`,
    [
      userId,
      planId || "",
      subscription.id,
      stripeCustomerId,
      subscription.status,
      end,
      subscription.cancel_at_period_end,
    ]
  );
  await query(
    "update users set stripe_customer_id=$2, updated_at=now() where id=$1::uuid",
    [userId, stripeCustomerId]
  );

  if ((subscription.status === "active" || subscription.status === "trialing") && end) {
    await query(
      `update users set is_enabled=true,
       access_expires_at=greatest(coalesce(access_expires_at, to_timestamp(0)), to_timestamp($2)),
       updated_at=now() where id=$1::uuid and role='user'`,
      [userId, end]
    );
  }
}

export async function processStripeEvent(stripe: Stripe, event: Stripe.Event) {
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const subscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id;
    if (subscriptionId) {
      await synchronizeSubscription(
        await stripe.subscriptions.retrieve(subscriptionId)
      );
    }
    return;
  }

  if (subscriptionEventTypes.has(event.type)) {
    const deliveredSubscription = event.data.object as Stripe.Subscription;
    let subscription = deliveredSubscription;
    if (event.type !== "customer.subscription.deleted") {
      subscription = await stripe.subscriptions.retrieve(deliveredSubscription.id);
    }
    await synchronizeSubscription(subscription);
  }
}

export function safeStripeError(error: unknown) {
  const message = error instanceof Error ? error.message : "Falha desconhecida";
  return message.replace(/(?:sk|rk)_(?:test|live)_[A-Za-z0-9]+/g, "[chave removida]").slice(0, 1000);
}
