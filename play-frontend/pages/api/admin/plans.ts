import type { NextApiRequest, NextApiResponse } from "next";
import { requireSuperadmin } from "@lib/auth";
import { query } from "@lib/db";
import { getStripeClient } from "@lib/stripeSettings";
import { ValidationError } from "@lib/validation";

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  durationDays: number;
  amountCents: number;
  currency: "brl";
  isActive: boolean;
  isFreeTrial: boolean;
  stripeSynced: boolean;
  createdAt: string;
}

type PlansResponse =
  | { error: false; plans: SubscriptionPlan[] }
  | { error: true; errorDescription: string };

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function listPlans() {
  const result = await query<{
    id: string; name: string; description: string; duration_days: number;
    amount_cents: number; currency: "brl"; is_active: boolean;
    is_free_trial: boolean;
    stripe_product_id: string | null; stripe_price_id: string | null; created_at: Date;
  }>(
    `select id::text, name, description, duration_days, amount_cents, currency,
            is_active, is_free_trial, stripe_product_id, stripe_price_id, created_at
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
    isFreeTrial: plan.is_free_trial,
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
  const isFreeTrial = body?.isFreeTrial === true;
  if (name.length < 2 || name.length > 100) throw new ValidationError("Informe um nome de plano válido.");
  if (description.length > 500) throw new ValidationError("A descrição pode ter até 500 caracteres.");
  if (!Number.isInteger(durationDays) || durationDays < 1 || durationDays > 3650) throw new ValidationError("Escolha um período entre 1 e 3650 dias.");
  if (!Number.isInteger(amountCents) || amountCents < (isFreeTrial ? 0 : 50)) throw new ValidationError(isFreeTrial ? "O teste grátis não pode ter preço." : "O preço mínimo é R$ 0,50.");
  return { name, description, durationDays, amountCents: isFreeTrial ? 0 : amountCents, isFreeTrial };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<PlansResponse>) {
  const superadmin = await requireSuperadmin(req, res);
  if (!superadmin) return;
  try {
    if (req.method === "GET") return res.status(200).json({ error: false, plans: await listPlans() });
    if (req.method !== "POST") return res.status(405).json({ error: true, errorDescription: "Método não permitido" });
    if (req.body?.type === "archive") {
      const id = typeof req.body?.id === "string" ? req.body.id : "";
      if (!uuidPattern.test(id)) throw new ValidationError("Plano inválido.");
      const existing = await query<{ stripe_product_id: string | null; is_free_trial: boolean }>(
        "select stripe_product_id, is_free_trial from subscription_plans where id = $1::uuid", [id]
      );
      if (!existing.rows[0]) throw new ValidationError("Plano não encontrado.");
      if (existing.rows[0].stripe_product_id && !existing.rows[0].is_free_trial) {
        const { stripe } = await getStripeClient();
        await stripe.products.update(existing.rows[0].stripe_product_id, { active: false });
      }
      await query("update subscription_plans set is_active = false, updated_at = now() where id = $1::uuid", [id]);
      return res.status(200).json({ error: false, plans: await listPlans() });
    }

    if (req.body?.type === "toggleTrial") {
      const id = typeof req.body?.id === "string" ? req.body.id : "";
      if (!uuidPattern.test(id)) throw new ValidationError("Plano inválido.");
      const existing = await query<{ is_free_trial: boolean; is_active: boolean }>(
        "select is_free_trial, is_active from subscription_plans where id = $1::uuid",
        [id]
      );
      if (!existing.rows[0]?.is_free_trial) throw new ValidationError("Selecione um plano de teste grátis.");
      const nextActive = !existing.rows[0].is_active;
      if (nextActive) {
        await query("update subscription_plans set is_active = false, updated_at = now() where is_free_trial = true and id <> $1::uuid", [id]);
      }
      await query("update subscription_plans set is_active = $2, updated_at = now() where id = $1::uuid", [id, nextActive]);
      return res.status(200).json({ error: false, plans: await listPlans() });
    }

    const input = planInput(req.body);
    const id = typeof req.body?.id === "string" ? req.body.id : "";
    const existing = id && uuidPattern.test(id)
      ? await query<{ stripe_product_id: string | null; stripe_price_id: string | null; amount_cents: number; duration_days: number; is_free_trial: boolean }>(
          "select stripe_product_id, stripe_price_id, amount_cents, duration_days, is_free_trial from subscription_plans where id = $1::uuid", [id]
        )
      : null;
    if (id && (!uuidPattern.test(id) || !existing?.rows[0])) throw new ValidationError("Plano não encontrado.");

    let productId = existing?.rows[0]?.stripe_product_id || null;
    let priceId = existing?.rows[0]?.stripe_price_id || null;
    if (!input.isFreeTrial) {
      const { stripe } = await getStripeClient();
      if (productId) {
        await stripe.products.update(productId, { name: input.name, description: input.description || undefined, active: true });
      } else {
        const product = await stripe.products.create({ name: input.name, description: input.description || undefined, metadata: { app: "play" } });
        productId = product.id;
      }
      if (!priceId || existing?.rows[0]?.amount_cents !== input.amountCents || existing.rows[0].duration_days !== input.durationDays || existing.rows[0].is_free_trial) {
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
    } else {
      productId = null;
      priceId = null;
    }

    if (input.isFreeTrial) {
      await query("update subscription_plans set is_free_trial = false, updated_at = now() where is_free_trial = true and ($1::text = '' or id <> nullif($1, '')::uuid)", [id]);
    }

    if (existing?.rows[0]) {
      await query(
        `update subscription_plans set name=$2, description=$3, duration_days=$4,
         amount_cents=$5, is_active=true, is_free_trial=$6, stripe_product_id=$7, stripe_price_id=$8, updated_at=now()
         where id=$1::uuid`,
        [id, input.name, input.description, input.durationDays, input.amountCents, input.isFreeTrial, productId, priceId]
      );
    } else {
      await query(
        `insert into subscription_plans
         (name, description, duration_days, amount_cents, is_free_trial, stripe_product_id, stripe_price_id, created_by)
         values ($1,$2,$3,$4,$5,$6,$7,$8::uuid)`,
        [input.name, input.description, input.durationDays, input.amountCents, input.isFreeTrial, productId, priceId, superadmin._id]
      );
    }
    return res.status(existing ? 200 : 201).json({ error: false, plans: await listPlans() });
  } catch (error) {
    console.error("Falha ao gerenciar planos", error);
    return res.status(400).json({ error: true, errorDescription: error instanceof Error ? error.message : "Não foi possível salvar o plano." });
  }
}
