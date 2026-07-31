import type { NextApiRequest, NextApiResponse } from "next";
import { requireSessionUser } from "@lib/auth";
import { query } from "@lib/db";
import { getStripeClient, getStripeSettings } from "@lib/stripeSettings";

export interface PublicPlan {
  id: string;
  name: string;
  description: string;
  durationDays: 30 | 60 | 90;
  amountCents: number;
}

export type PlansResponse =
  | { error: false; plans: PublicPlan[]; paymentsEnabled: boolean; hasSubscription: boolean }
  | { error: true; errorDescription: string };

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function payload(userId: string) {
  const [plans, settings, subscription] = await Promise.all([
    query<{ id: string; name: string; description: string; duration_days: 30 | 60 | 90; amount_cents: number }>(
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
  ]);
  return {
    error: false as const,
    plans: plans.rows.map((plan) => ({ id: plan.id, name: plan.name, description: plan.description, durationDays: plan.duration_days, amountCents: plan.amount_cents })),
    paymentsEnabled: settings.enabled && settings.secretKeyConfigured && settings.webhookSecretConfigured,
    hasSubscription: subscription.rows[0]?.exists === true,
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

export default async function handler(req: NextApiRequest, res: NextApiResponse<PlansResponse | { error: false; url: string }>) {
  const user = await requireSessionUser(req, res);
  if (!user) return;
  try {
    if (req.method === "GET") return res.status(200).json(await payload(user._id));
    if (req.method !== "POST") return res.status(405).json({ error: true, errorDescription: "Método não permitido" });
    const planId = typeof req.body?.planId === "string" ? req.body.planId : "";
    if (!uuidPattern.test(planId)) throw new Error("Plano inválido.");
    const active = await query<{ exists: boolean }>(
      `select exists(select 1 from user_subscriptions where user_id=$1::uuid
       and status in ('active','trialing','past_due','unpaid')) as exists`, [user._id]
    );
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
