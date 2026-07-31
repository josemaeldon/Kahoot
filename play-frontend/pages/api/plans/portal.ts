import type { NextApiRequest, NextApiResponse } from "next";
import { requireSessionUser } from "@lib/auth";
import { query } from "@lib/db";
import { getStripeClient } from "@lib/stripeSettings";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await requireSessionUser(req, res);
  if (!user) return;
  if (req.method !== "POST") return res.status(405).json({ error: true, errorDescription: "Método não permitido" });
  try {
    const result = await query<{ stripe_customer_id: string | null }>("select stripe_customer_id from users where id=$1::uuid", [user._id]);
    const customerId = result.rows[0]?.stripe_customer_id;
    if (!customerId) throw new Error("Nenhuma assinatura foi encontrada.");
    const { stripe } = await getStripeClient();
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const protocol = req.headers["x-forwarded-proto"] || (process.env.NODE_ENV === "production" ? "https" : "http");
    const returnUrl = `${process.env.APP_URL?.trim().replace(/\/$/, "") || `${protocol}://${host}`}/plans`;
    const session = await stripe.billingPortal.sessions.create({ customer: customerId, return_url: returnUrl });
    return res.status(200).json({ error: false, url: session.url });
  } catch (error) {
    return res.status(400).json({ error: true, errorDescription: error instanceof Error ? error.message : "Não foi possível abrir o portal." });
  }
}
