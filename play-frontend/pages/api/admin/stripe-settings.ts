import type { NextApiRequest, NextApiResponse } from "next";
import { requireSuperadmin } from "@lib/auth";
import { query } from "@lib/db";
import {
  encryptStripeSecret,
  getStripeClient,
  getStripeSettings,
} from "@lib/stripeSettings";

export interface PublicStripeSettings {
  enabled: boolean;
  secretKeyConfigured: boolean;
  webhookSecretConfigured: boolean;
  secretKeyFromEnvironment: boolean;
  webhookSecretFromEnvironment: boolean;
  updatedAt: string;
}

export type StripeSettingsResponse =
  | { error: false; settings: PublicStripeSettings }
  | { error: true; errorDescription: string };

function publicSettings(
  settings: Awaited<ReturnType<typeof getStripeSettings>>
): PublicStripeSettings {
  return {
    enabled: settings.enabled,
    secretKeyConfigured: settings.secretKeyConfigured,
    webhookSecretConfigured: settings.webhookSecretConfigured,
    secretKeyFromEnvironment: settings.secretKeyFromEnvironment,
    webhookSecretFromEnvironment: settings.webhookSecretFromEnvironment,
    updatedAt: settings.updatedAt,
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StripeSettingsResponse>
) {
  const superadmin = await requireSuperadmin(req, res);
  if (!superadmin) return;

  try {
    if (req.method === "GET") {
      return res.status(200).json({
        error: false,
        settings: publicSettings(await getStripeSettings()),
      });
    }
    if (req.method !== "POST") {
      return res.status(405).json({ error: true, errorDescription: "Método não permitido" });
    }

    const enabled = req.body?.enabled;
    const secretKey =
      typeof req.body?.secretKey === "string" ? req.body.secretKey.trim() : "";
    const webhookSecret =
      typeof req.body?.webhookSecret === "string"
        ? req.body.webhookSecret.trim()
        : "";
    const clearSecretKey = req.body?.clearSecretKey === true;
    const clearWebhookSecret = req.body?.clearWebhookSecret === true;

    if (typeof enabled !== "boolean") throw new Error("Estado da Stripe inválido.");
    if (secretKey && !/^sk_(?:test|live)_/.test(secretKey)) {
      throw new Error("A chave secreta deve começar com sk_test_ ou sk_live_.");
    }
    if (webhookSecret && !webhookSecret.startsWith("whsec_")) {
      throw new Error("O segredo do webhook deve começar com whsec_.");
    }
    if ((clearSecretKey && secretKey) || (clearWebhookSecret && webhookSecret)) {
      throw new Error("Escolha entre substituir ou remover cada segredo.");
    }

    await query(
      `update stripe_settings
       set enabled = $1,
           secret_key_encrypted = case
             when $2 then null
             when $3::text is not null then $3
             else secret_key_encrypted
           end,
           webhook_secret_encrypted = case
             when $4 then null
             when $5::text is not null then $5
             else webhook_secret_encrypted
           end,
           updated_by = $6::uuid,
           updated_at = now()
       where id = true`,
      [
        enabled,
        clearSecretKey,
        secretKey ? encryptStripeSecret(secretKey) : null,
        clearWebhookSecret,
        webhookSecret ? encryptStripeSecret(webhookSecret) : null,
        superadmin._id,
      ]
    );

    const saved = await getStripeSettings();
    if (enabled && (!saved.secretKeyConfigured || !saved.webhookSecretConfigured)) {
      await query("update stripe_settings set enabled = false where id = true");
      throw new Error("Configure a chave secreta e o segredo do webhook antes de ativar.");
    }
    if (enabled) {
      const { stripe } = await getStripeClient();
      await stripe.balance.retrieve();
    }
    return res.status(200).json({ error: false, settings: publicSettings(saved) });
  } catch (error) {
    if (req.method === "POST" && req.body?.enabled === true) {
      await query("update stripe_settings set enabled=false where id=true").catch(() => undefined);
    }
    console.error("Falha ao atualizar Stripe", error);
    return res.status(400).json({
      error: true,
      errorDescription:
        error instanceof Error ? error.message : "Não foi possível configurar a Stripe.",
    });
  }
}
