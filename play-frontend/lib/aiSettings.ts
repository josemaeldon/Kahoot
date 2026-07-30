import crypto from "node:crypto";
import { query } from "@lib/db";

export type ReasoningEffort = "none" | "low" | "medium" | "high";

export interface AiSettings {
  enabled: boolean;
  model: string;
  reasoningEffort: ReasoningEffort;
  systemInstructions: string;
  apiKeyConfigured: boolean;
  apiKey: string | null;
  updatedAt: string;
}

interface AiSettingsRow {
  enabled: boolean;
  model: string;
  reasoning_effort: ReasoningEffort;
  system_instructions: string;
  api_key_encrypted: string | null;
  updated_at: Date;
}

const defaultInstructions =
  "Crie perguntas claras, factualmente corretas e adequadas ao público indicado. Evite ambiguidades e faça três alternativas incorretas plausíveis.";

function encryptionKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET não foi configurado");
  return crypto
    .createHash("sha256")
    .update(`${secret}:play-ai-settings`)
    .digest();
}

export function encryptApiKey(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return [
    "v1",
    iv.toString("base64url"),
    authTag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

export function decryptApiKey(value: string) {
  const [version, ivValue, authTagValue, encryptedValue] = value.split(".");
  if (
    version !== "v1" ||
    !ivValue ||
    !authTagValue ||
    !encryptedValue
  ) {
    throw new Error("Formato da chave de IA inválido");
  }

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(ivValue, "base64url")
  );
  decipher.setAuthTag(Buffer.from(authTagValue, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export async function getAiSettings(): Promise<AiSettings> {
  const result = await query<AiSettingsRow>(
    `select
       enabled,
       model,
       reasoning_effort,
       system_instructions,
       api_key_encrypted,
       updated_at
     from ai_settings
     where id = true`
  );
  const row = result.rows[0];
  const environmentKey = process.env.OPENAI_API_KEY?.trim() || null;

  if (!row) {
    return {
      enabled: false,
      model: "gpt-5.6-sol",
      reasoningEffort: "low",
      systemInstructions: defaultInstructions,
      apiKeyConfigured: Boolean(environmentKey),
      apiKey: environmentKey,
      updatedAt: new Date(0).toISOString(),
    };
  }

  const storedKey = row.api_key_encrypted
    ? decryptApiKey(row.api_key_encrypted)
    : null;
  return {
    enabled: row.enabled,
    model: row.model,
    reasoningEffort: row.reasoning_effort,
    systemInstructions: row.system_instructions,
    apiKeyConfigured: Boolean(storedKey || environmentKey),
    apiKey: storedKey || environmentKey,
    updatedAt: row.updated_at.toISOString(),
  };
}
