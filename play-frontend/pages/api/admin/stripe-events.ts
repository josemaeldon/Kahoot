import type { NextApiRequest, NextApiResponse } from "next";
import { requireSuperadmin } from "@lib/auth";
import { query } from "@lib/db";
import { getStripeClient } from "@lib/stripeSettings";
import { processStripeEvent, safeStripeError } from "@lib/stripeSubscriptions";

export interface AdminStripeEvent {
  id: string;
  type: string;
  status: "processing" | "processed" | "failed";
  livemode: boolean;
  attempts: number;
  error: string | null;
  createdAt: string;
  processedAt: string | null;
}

export type StripeEventsResponse =
  | { error: false; events: AdminStripeEvent[] }
  | { error: true; errorDescription: string };

async function listEvents() {
  const result = await query<{
    event_id: string;
    event_type: string;
    status: AdminStripeEvent["status"];
    livemode: boolean;
    attempt_count: number;
    last_error: string | null;
    stripe_created_at: Date | null;
    processed_at: Date | null;
    updated_at: Date;
  }>(
    `select event_id, event_type, status, livemode, attempt_count, last_error,
            stripe_created_at, processed_at, updated_at
     from stripe_webhook_events
     order by updated_at desc
     limit 30`
  );
  return result.rows.map((event) => ({
    id: event.event_id,
    type: event.event_type,
    status: event.status,
    livemode: event.livemode,
    attempts: event.attempt_count,
    error: event.last_error,
    createdAt: (event.stripe_created_at || event.updated_at).toISOString(),
    processedAt: event.status === "processed" ? event.processed_at?.toISOString() || null : null,
  }));
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StripeEventsResponse>
) {
  const superadmin = await requireSuperadmin(req, res);
  if (!superadmin) return;

  try {
    if (req.method === "GET") {
      return res.status(200).json({ error: false, events: await listEvents() });
    }
    if (req.method !== "POST") {
      return res.status(405).json({ error: true, errorDescription: "Método não permitido" });
    }

    const eventId = typeof req.body?.eventId === "string" ? req.body.eventId.trim() : "";
    if (!/^evt_[A-Za-z0-9]+$/.test(eventId)) throw new Error("Evento inválido.");
    const { stripe } = await getStripeClient();
    const event = await stripe.events.retrieve(eventId);
    await query(
      `insert into stripe_webhook_events
         (event_id, event_type, status, livemode, attempt_count, stripe_created_at, updated_at)
       values ($1,$2,'processing',$3,1,to_timestamp($4),now())
       on conflict (event_id) do update set status='processing', last_error=null,
         attempt_count=stripe_webhook_events.attempt_count+1, updated_at=now()`,
      [event.id, event.type, event.livemode, event.created]
    );
    try {
      await processStripeEvent(stripe, event);
      await query(
        `update stripe_webhook_events set status='processed', last_error=null,
         processed_at=now(), updated_at=now() where event_id=$1`,
        [event.id]
      );
    } catch (error) {
      await query(
        `update stripe_webhook_events set status='failed', last_error=$2,
         updated_at=now() where event_id=$1`,
        [event.id, safeStripeError(error)]
      );
      throw error;
    }
    return res.status(200).json({ error: false, events: await listEvents() });
  } catch (error) {
    console.error("Falha ao reprocessar evento da Stripe", error);
    return res.status(400).json({
      error: true,
      errorDescription: error instanceof Error ? error.message : "Não foi possível reprocessar o evento.",
    });
  }
}
