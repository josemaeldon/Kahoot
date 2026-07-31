import type { NextApiRequest, NextApiResponse } from "next";
import { requireSessionUser } from "@lib/auth";
import { query } from "@lib/db";
import { getStripeClient, getStripeSettings } from "@lib/stripeSettings";

export interface PublicPlan {
  id: string;
  name: string;
  description: string;
  durationDays: number;
  amountCents: number;
}

export interface CurrentPlan extends PublicPlan {
  source: "subscription" | "assigned";
  subscriptionId: string | null;
  periodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export type PlansResponse =
  | { error: false; plans: PublicPlan[]; paymentsEnabled: boolean; hasSubscription: boolean; currentPlan: CurrentPlan | null }
  | { error: true; errorDescription: string };

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function payload(userId: string) {
  const [plans, settings, subscription, assigned] = await Promise.all([
    query<{ id: string; name: string; description: string; duration_days: number; amount_cents: number }>(
      `select id::text, name, description, duration_days, amount_cents
       from subscription_plans
       where is_active = true and stripe_price_id is not null
       order by duration_days, amount_cents, created_at desc`
    ),
    getStripeSettings(),
    query<{ exists: boolean }>(
      `select exists(select 1 from user_subscriptions
       where user_id=$1::uuid and status in ('active','trialing','past_due','unpaid')) as exists`,
      [userId]
    ),
    query<{ id: string; name: string; description: string; duration_days: number; amount_cents: number; access_expires_at: Date | null; assigned_plan_cancelled_at: Date | null }>(
      `select p.id::text, p.name, p.description, p.duration_days, p.amount_cents
              , u.access_expires_at, u.assigned_plan_cancelled_at
       from users u join subscription_plans p on p.id = u.assigned_plan_id
       where u.id=$1::uuid limit 1`, [userId]
    ),
  ]);
  const activeSubscription = await query<{
    id: string; plan_id: string | null; stripe_subscription_id: string; name: string | null;
    description: string | null; duration_days: number | null; amount_cents: number | null;
    current_period_end: Date | null; cancel_at_period_end: boolean;
  }>(
    `select p.id::text, p.id::text as plan_id, us.stripe_subscription_id, p.name, p.description,
            p.duration_days, p.amount_cents, us.current_period_end, us.cancel_at_period_end
     from user_subscriptions us left join subscription_plans p on p.id = us.plan_id
     where us.user_id=$1::uuid and us.status in ('active','trialing','past_due','unpaid')
     order by us.updated_at desc limit 1`, [userId]
  );
  const subscribedPlan = activeSubscription.rows[0];
  const assignedPlan = assigned.rows[0];
  const currentPlan = subscribedPlan?.name && subscribedPlan.duration_days && subscribedPlan.amount_cents !== null
    ? { id: subscribedPlan.plan_id || subscribedPlan.id, name: subscribedPlan.name, description: subscribedPlan.description || "", durationDays: subscribedPlan.duration_days, amountCents: subscribedPlan.amount_cents, source: "subscription" as const, subscriptionId: subscribedPlan.stripe_subscription_id, periodEnd: subscribedPlan.current_period_end?.toISOString() || null, cancelAtPeriodEnd: subscribedPlan.cancel_at_period_end }
    : assignedPlan
      ? { id: assignedPlan.id, name: assignedPlan.name, description: assignedPlan.description, durationDays: assignedPlan.duration_days, amountCents: assignedPlan.amount_cents, source: "assigned" as const, subscriptionId: null, periodEnd: assignedPlan.access_expires_at?.toISOString() || null, cancelAtPeriodEnd: assignedPlan.assigned_plan_cancelled_at !== null }
      : null;
  return {
    error: false as const,
    plans: plans.rows.map((plan) => ({ id: plan.id, name: plan.name, description: plan.description, durationDays: plan.duration_days, amountCents: plan.amount_cents })),
    paymentsEnabled: settings.enabled && settings.secretKeyConfigured && settings.webhookSecretConfigured,
    hasSubscription: subscription.rows[0]?.exists === true,
    currentPlan,
  };
}

function absoluteBaseUrl(req: NextApiRequest) {
  const configured = process.env.APP_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const protocol = req.headers["x-forwarded-proto"] || (process.env.NODE_ENV === "production" ? "https" : "http");
  if (!host) throw new Error("Não foi possível determinar a URL da aplicação.");
  return `${protocol}://${host}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<PlansResponse | { error: false; url: string } | { error: false; upgraded: true } | { error: false; cancelled: true }>) {
  const user = await requireSessionUser(req, res);
  if (!user) return;
  try {
    if (req.method === "GET") return res.status(200).json(await payload(user._id));
    if (req.method !== "POST") return res.status(405).json({ error: true, errorDescription: "Método não permitido" });
    if (req.body?.action === "cancel") {
      const activeSubscription = await query<{ stripe_subscription_id: string }>(
        `select stripe_subscription_id from user_subscriptions
         where user_id=$1::uuid and status in ('active','trialing','past_due','unpaid')
         order by updated_at desc limit 1`,
        [user._id]
      );
      if (activeSubscription.rows[0]) {
        const { stripe } = await getStripeClient();
        await stripe.subscriptions.update(activeSubscription.rows[0].stripe_subscription_id, { cancel_at_period_end: true });
        await query("update user_subscriptions set cancel_at_period_end=true, updated_at=now() where stripe_subscription_id=$1", [activeSubscription.rows[0].stripe_subscription_id]);
        return res.status(200).json({ error: false, cancelled: true });
      }
      const assigned = await query<{ id: string }>(
        `update users
         set assigned_plan_cancelled_at=now(), updated_at=now()
         where id=$1::uuid and assigned_plan_id is not null
           and access_expires_at is not null and access_expires_at > now()
           and assigned_plan_cancelled_at is null
         returning id::text`,
        [user._id]
      );
      if (!assigned.rows[0]) throw new Error("Nenhum plano ativo para cancelar.");
      return res.status(200).json({ error: false, cancelled: true });
    }
    const planId = typeof req.body?.planId === "string" ? req.body.planId : "";
    if (!uuidPattern.test(planId)) throw new Error("Plano inválido.");
    const action = req.body?.action === "upgrade" ? "upgrade" : "subscribe";
    const active = await query<{ exists: boolean }>(
      `select exists(select 1 from user_subscriptions where user_id=$1::uuid
       and status in ('active','trialing','past_due','unpaid')) as exists`, [user._id]
    );
    if (action === "upgrade") {
      const current = await query<{ subscription_id: string; customer_id: string; duration_days: number; amount_cents: number }>(
        `select us.stripe_subscription_id as subscription_id, us.stripe_customer_id as customer_id, p.duration_days, p.amount_cents
         from user_subscriptions us join subscription_plans p on p.id = us.plan_id
         where us.user_id=$1::uuid and us.status in ('active','trialing','past_due','unpaid') order by us.updated_at desc limit 1`, [user._id]
      );
      if (!current.rows[0]) throw new Error("Nenhuma assinatura ativa foi encontrada para upgrade.");
      const target = await query<{ stripe_price_id: string; duration_days: number; amount_cents: number }>(
        `select stripe_price_id, duration_days, amount_cents from subscription_plans where id=$1::uuid and is_active=true and stripe_price_id is not null`, [planId]
      );
      const currentPlan = current.rows[0];
      const targetPlan = target.rows[0];
      const isLarger = targetPlan && (targetPlan.duration_days > currentPlan.duration_days || (targetPlan.duration_days === currentPlan.duration_days && targetPlan.amount_cents > currentPlan.amount_cents));
      if (!isLarger) throw new Error("Escolha um plano maior que o seu plano atual.");
      const { stripe } = await getStripeClient();
      const subscription = await stripe.subscriptions.retrieve(currentPlan.subscription_id);
      if (typeof subscription.customer === "string" && subscription.customer !== currentPlan.customer_id) throw new Error("A assinatura não pertence à sua conta.");
      const item = subscription.items.data[0];
      if (!item) throw new Error("A assinatura não possui um item de cobrança válido.");
      await stripe.subscriptions.update(currentPlan.subscription_id, { items: [{ id: item.id, price: targetPlan.stripe_price_id, quantity: 1 }], proration_behavior: "create_prorations", metadata: { userId: user._id, planId } });
      return res.status(200).json({ error: false, upgraded: true });
    }
    if (active.rows[0]?.exists) throw new Error("Você já possui uma assinatura. Use o portal para administrá-la.");
    const plan = await query<{ stripe_price_id: string; name: string }>(
      `select stripe_price_id, name from subscription_plans
       where id=$1::uuid and is_active=true and stripe_price_id is not null`, [planId]
    );
    if (!plan.rows[0]) throw new Error("Este plano não está disponível.");
    const customer = await query<{ stripe_customer_id: string | null; email: string | null; full_name: string | null; access_expires_at: Date | null }>(
      "select stripe_customer_id, email, full_name, access_expires_at from users where id=$1::uuid", [user._id]
    );
    const { stripe } = await getStripeClient();
    let customerId = customer.rows[0]?.stripe_customer_id;
    if (!customerId) {
      const created = await stripe.customers.create({
        email: customer.rows[0]?.email || undefined,
        name: customer.rows[0]?.full_name || user.username,
        metadata: { userId: user._id },
      });
      customerId = created.id;
      await query("update users set stripe_customer_id=$2, updated_at=now() where id=$1::uuid", [user._id, customerId]);
    }
    const baseUrl = absoluteBaseUrl(req);
    const trialEnd = customer.rows[0]?.access_expires_at && customer.rows[0].access_expires_at.getTime() > Date.now() + 2 * 86400000
      ? Math.floor(customer.rows[0].access_expires_at.getTime() / 1000)
      : undefined;
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: plan.rows[0].stripe_price_id, quantity: 1 }],
      payment_method_types: ["card"],
      payment_method_collection: "always",
      allow_promotion_codes: false,
      client_reference_id: user._id,
      metadata: { userId: user._id, planId },
      subscription_data: {
        metadata: { userId: user._id, planId },
        ...(trialEnd ? { trial_end: trialEnd } : {}),
      },
      success_url: `${baseUrl}/plans?checkout=success`,
      cancel_url: `${baseUrl}/plans?checkout=cancelled`,
    });
    if (!session.url) throw new Error("A Stripe não retornou a página de pagamento.");
    return res.status(200).json({ error: false, url: session.url });
  } catch (error) {
    return res.status(400).json({ error: true, errorDescription: error instanceof Error ? error.message : "Não foi possível iniciar o pagamento." });
  }
}
