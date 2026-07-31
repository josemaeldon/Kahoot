import type { NextApiRequest, NextApiResponse } from "next";
import type Stripe from "stripe";
import { query } from "@lib/db";
import { getStripeClient } from "@lib/stripeSettings";

export const config = { api: { bodyParser: false } };

async function rawBody(req: NextApiRequest) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

function customerId(subscription: Stripe.Subscription) {
  return typeof subscription.customer === "string"
    ? subscription.customer
    : subscription.customer.id;
}

function periodEnd(subscription: Stripe.Subscription) {
  const ends = subscription.items.data.map((item) => item.current_period_end);
  return ends.length ? Math.max(...ends) : null;
}

async function synchronizeSubscription(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.userId;
  const planId = subscription.metadata.planId;
  if (!userId) throw new Error(`Assinatura ${subscription.id} sem userId.`);
  const end = periodEnd(subscription);
  await query(
    `insert into user_subscriptions
       (user_id, plan_id, stripe_subscription_id, stripe_customer_id, status,
        current_period_end, cancel_at_period_end)
     values ($1::uuid, nullif($2, '')::uuid, $3, $4, $5,
             case when $6::bigint is null then null else to_timestamp($6) end, $7)
     on conflict (stripe_subscription_id) do update set
       plan_id=excluded.plan_id, stripe_customer_id=excluded.stripe_customer_id,
       status=excluded.status, current_period_end=excluded.current_period_end,
       cancel_at_period_end=excluded.cancel_at_period_end, updated_at=now()`,
    [userId, planId || "", subscription.id, customerId(subscription), subscription.status, end, subscription.cancel_at_period_end]
  );
  await query(
    "update users set stripe_customer_id=$2, updated_at=now() where id=$1::uuid",
    [userId, customerId(subscription)]
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: true });
  try {
    const signature = req.headers["stripe-signature"];
    if (typeof signature !== "string") throw new Error("Assinatura do webhook ausente.");
    const { stripe, settings } = await getStripeClient({ requireEnabled: false });
    if (!settings.webhookSecret) throw new Error("Segredo do webhook não configurado.");
    const event = stripe.webhooks.constructEvent(await rawBody(req), signature, settings.webhookSecret);
    const processed = await query<{ exists: boolean }>(
      "select exists(select 1 from stripe_webhook_events where event_id=$1) as exists", [event.id]
    );
    if (processed.rows[0]?.exists) return res.status(200).json({ received: true });

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
      if (subscriptionId) await synchronizeSubscription(await stripe.subscriptions.retrieve(subscriptionId));
    } else if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted" ||
      event.type === "customer.subscription.paused" ||
      event.type === "customer.subscription.resumed"
    ) {
      await synchronizeSubscription(event.data.object);
    }
    await query(
      "insert into stripe_webhook_events (event_id, event_type) values ($1,$2) on conflict do nothing",
      [event.id, event.type]
    );
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Falha no webhook da Stripe", error);
    return res.status(400).json({ error: true });
  }
}
