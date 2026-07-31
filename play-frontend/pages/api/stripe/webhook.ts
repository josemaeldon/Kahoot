import type { NextApiRequest, NextApiResponse } from "next";
import type Stripe from "stripe";
import { query } from "@lib/db";
import { getStripeClient } from "@lib/stripeSettings";
import { processStripeEvent, safeStripeError } from "@lib/stripeSubscriptions";

export const config = { api: { bodyParser: false } };

async function rawBody(req: NextApiRequest) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: true });
  let event: Stripe.Event | null = null;
  try {
    const signature = req.headers["stripe-signature"];
    if (typeof signature !== "string") throw new Error("Assinatura do webhook ausente.");
    const { stripe, settings } = await getStripeClient({ requireEnabled: false });
    if (!settings.webhookSecret) throw new Error("Segredo do webhook não configurado.");
    event = stripe.webhooks.constructEvent(await rawBody(req), signature, settings.webhookSecret);
    const processed = await query<{ status: string }>(
      "select status from stripe_webhook_events where event_id=$1", [event.id]
    );
    if (processed.rows[0]?.status === "processed") return res.status(200).json({ received: true });
    await query(
      `insert into stripe_webhook_events
         (event_id, event_type, status, livemode, attempt_count, stripe_created_at, updated_at)
       values ($1,$2,'processing',$3,1,to_timestamp($4),now())
       on conflict (event_id) do update set status='processing', last_error=null,
         attempt_count=stripe_webhook_events.attempt_count+1, updated_at=now()`,
      [event.id, event.type, event.livemode, event.created]
    );
    await processStripeEvent(stripe, event);
    await query(
      `update stripe_webhook_events set status='processed', last_error=null,
       processed_at=now(), updated_at=now() where event_id=$1`,
      [event.id]
    );
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Falha no webhook da Stripe", error);
    if (event) {
      await query(
        `update stripe_webhook_events set status='failed', last_error=$2,
         updated_at=now() where event_id=$1`,
        [event.id, safeStripeError(error)]
      ).catch(() => undefined);
      return res.status(500).json({ error: true });
    }
    return res.status(400).json({ error: true });
  }
}
