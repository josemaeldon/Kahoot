import type { NextApiRequest, NextApiResponse } from "next";
import { requireSuperadmin } from "@lib/auth";
import { query } from "@lib/db";
import { getStripeClient } from "@lib/stripeSettings";
import { ValidationError } from "@lib/validation";

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  durationDays: 30 | 60 | 90;
  amountCents: number;
  currency: "brl";
  isActive: boolean;
  stripeSynced: boolean;
  createdAt: string;
}

type PlansResponse =
  | { error: false; plans: SubscriptionPlan[] }
  | { error: true; errorDescription: string };

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function listPlans() {
  const result = await query<{
    id: string; name: string; description: string; duration_days: 30 | 60 | 90;
    amount_cents: number; currency: "brl"; is_active: boolean;
    stripe_product_id: string | null; stripe_price_id: string | null; created_at: Date;
  }>(
    `select id::text, name, description, duration_days, amount_cents, currency,
            is_active, stripe_product_id, stripe_price_id, created_at
     from subscription_plans
     order by is_active desc, duration_days, amount_cents, created_at desc`
  );
  return result.rows.map((plan) => ({
    id: plan.id,
    name: plan.name,
    description: plan.description,
    durationDays: plan.duration_days,
    amountCents: plan.amount_cents,
    currency: plan.currency,
    isActive: plan.is_active,
    stripeSynced: Boolean(plan.stripe_product_id && plan.stripe_price_id),
    createdAt: plan.created_at.toISOString(),
  }));
}

function planInput(body: NextApiRequest["body"]) {
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const description =
    typeof body?.description === "string" ? body.description.trim() : "";
  const durationDays = Number(body?.durationDays);
  const amountCents = Number(body?.amountCents);
  if (name.length < 2 || name.length > 100) throw new ValidationError("Informe um nome de plano válido.");
  if (description.length > 500) throw new ValidationError("A descrição pode ter até 500 caracteres.");
  if (![30, 60, 90].includes(durationDays)) throw new ValidationError("Escolha 30, 60 ou 90 dias.");
  if (!Number.isInteger(amountCents) || amountCents < 50) throw new ValidationError("O preço mínimo é R$ 0,50.");
  return { name, description, durationDays: durationDays as 30 | 60 | 90, amountCents };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<PlansResponse>) {
  const superadmin = await requireSuperadmin(req, res);
  if (!superadmin) return;
  try {
    if (req.method === "GET") return res.status(200).json({ error: false, plans: await listPlans() });
    if (req.method !== "POST") return res.status(405).json({ error: true, errorDescription: "Método não permitido" });
    const { stripe } = await getStripeClient();

    if (req.body?.type === "archive") {
      const id = typeof req.body?.id === "string" ? req.body.id : "";
      if (!uuidPattern.test(id)) throw new ValidationError("Plano inválido.");
      const existing = await query<{ stripe_product_id: string | null }>(
        "select stripe_product_id from subscription_plans where id = $1::uuid", [id]
      );
      if (!existing.rows[0]) throw new ValidationError("Plano não encontrado.");
      if (existing.rows[0].stripe_product_id) {
        await stripe.products.update(existing.rows[0].stripe_product_id, { active: false });
      }
      await query("update subscription_plans set is_active = false, updated_at = now() where id = $1::uuid", [id]);
      return res.status(200).json({ error: false, plans: await listPlans() });
    }

    const input = planInput(req.body);
    const id = typeof req.body?.id === "string" ? req.body.id : "";
    const existing = id && uuidPattern.test(id)
      ? await query<{ stripe_product_id: string | null; stripe_price_id: string | null; amount_cents: number; duration_days: number }>(
          "select stripe_product_id, stripe_price_id, amount_cents, duration_days from subscription_plans where id = $1::uuid", [id]
        )
      : null;
    if (id && (!uuidPattern.test(id) || !existing?.rows[0])) throw new ValidationError("Plano não encontrado.");

    let productId = existing?.rows[0]?.stripe_product_id || null;
    if (productId) {
      await stripe.products.update(productId, { name: input.name, description: input.description || undefined, active: true });
    } else {
      const product = await stripe.products.create({ name: input.name, description: input.description || undefined, metadata: { app: "play" } });
      productId = product.id;
    }
    let priceId = existing?.rows[0]?.stripe_price_id || null;
    if (!priceId || existing?.rows[0]?.amount_cents !== input.amountCents || existing.rows[0].duration_days !== input.durationDays) {
      const price = await stripe.prices.create({
        product: productId,
        currency: "brl",
        unit_amount: input.amountCents,
        recurring: { interval: "day", interval_count: input.durationDays },
        metadata: { durationDays: String(input.durationDays) },
      });
      if (priceId) await stripe.prices.update(priceId, { active: false });
      priceId = price.id;
    }

    if (existing?.rows[0]) {
      await query(
        `update subscription_plans set name=$2, description=$3, duration_days=$4,
         amount_cents=$5, is_active=true, stripe_product_id=$6, stripe_price_id=$7, updated_at=now()
         where id=$1::uuid`,
        [id, input.name, input.description, input.durationDays, input.amountCents, productId, priceId]
      );
    } else {
      await query(
        `insert into subscription_plans
         (name, description, duration_days, amount_cents, stripe_product_id, stripe_price_id, created_by)
         values ($1,$2,$3,$4,$5,$6,$7::uuid)`,
        [input.name, input.description, input.durationDays, input.amountCents, productId, priceId, superadmin._id]
      );
    }
    return res.status(existing ? 200 : 201).json({ error: false, plans: await listPlans() });
  } catch (error) {
    console.error("Falha ao gerenciar planos", error);
    return res.status(400).json({ error: true, errorDescription: error instanceof Error ? error.message : "Não foi possível salvar o plano." });
  }
}
