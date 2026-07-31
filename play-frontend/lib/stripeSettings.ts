import crypto from "node:crypto";
import Stripe from "stripe";
import { query } from "@lib/db";

interface StripeSettingsRow {
  enabled: boolean;
  secret_key_encrypted: string | null;
  webhook_secret_encrypted: string | null;
  updated_at: Date;
}

function encryptionKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET não foi configurado");
  return crypto
    .createHash("sha256")
    .update(`${secret}:play-stripe-settings`)
    .digest();
}

export function encryptStripeSecret(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [
    "v1",
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

function decryptStripeSecret(value: string) {
  const [version, iv, tag, encrypted] = value.split(".");
  if (version !== "v1" || !iv || !tag || !encrypted) {
    throw new Error("Formato da configuração da Stripe inválido");
  }
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(iv, "base64url")
  );
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export async function getStripeSettings() {
  const result = await query<StripeSettingsRow>(
    `select enabled, secret_key_encrypted, webhook_secret_encrypted, updated_at
     from stripe_settings where id = true`
  );
  const row = result.rows[0];
  const environmentSecretKey = process.env.STRIPE_SECRET_KEY?.trim() || null;
  const environmentWebhookSecret =
    process.env.STRIPE_WEBHOOK_SECRET?.trim() || null;
  const storedSecretKey = row?.secret_key_encrypted
    ? decryptStripeSecret(row.secret_key_encrypted)
    : null;
  const storedWebhookSecret = row?.webhook_secret_encrypted
    ? decryptStripeSecret(row.webhook_secret_encrypted)
    : null;

  return {
    enabled: row?.enabled === true,
    secretKey: environmentSecretKey || storedSecretKey,
    webhookSecret: environmentWebhookSecret || storedWebhookSecret,
    secretKeyConfigured: Boolean(environmentSecretKey || storedSecretKey),
    webhookSecretConfigured: Boolean(
      environmentWebhookSecret || storedWebhookSecret
    ),
    secretKeyFromEnvironment: Boolean(environmentSecretKey),
    webhookSecretFromEnvironment: Boolean(environmentWebhookSecret),
    updatedAt: row?.updated_at.toISOString() || new Date(0).toISOString(),
  };
}

export async function getStripeClient(options: { requireEnabled?: boolean } = {}) {
  const settings = await getStripeSettings();
  if (options.requireEnabled !== false && !settings.enabled) {
    throw new Error("Os pagamentos pela Stripe estão desativados.");
  }
  if (!settings.secretKey) {
    throw new Error("Configure a chave secreta da Stripe.");
  }
  return { stripe: new Stripe(settings.secretKey), settings };
}
