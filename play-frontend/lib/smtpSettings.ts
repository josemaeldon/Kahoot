import crypto from "node:crypto";
import nodemailer from "nodemailer";
import { query } from "@lib/db";

interface SmtpRow {
  enabled: boolean; host: string; port: number; secure: boolean; username: string;
  password_encrypted: string | null; from_name: string; from_email: string; updated_at: Date;
}

function key() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET não foi configurado");
  return crypto.createHash("sha256").update(`${secret}:play-smtp-settings`).digest();
}

export function encryptSmtpPassword(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), encrypted.toString("base64url")].join(".");
}

function decrypt(value: string) {
  const [version, iv, tag, encrypted] = value.split(".");
  if (version !== "v1" || !iv || !tag || !encrypted) throw new Error("Configuração SMTP inválida");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(encrypted, "base64url")), decipher.final()]).toString("utf8");
}

export async function getSmtpSettings() {
  const result = await query<SmtpRow>(`select enabled, host, port, secure, username, password_encrypted, from_name, from_email, updated_at from smtp_settings where id=true`);
  const row = result.rows[0];
  const environment = Boolean(process.env.SMTP_HOST?.trim());
  const storedPassword = row?.password_encrypted ? decrypt(row.password_encrypted) : "";
  return {
    enabled: environment ? process.env.SMTP_ENABLED !== "false" : row?.enabled === true,
    host: environment ? process.env.SMTP_HOST!.trim() : row?.host || "",
    port: environment ? Number(process.env.SMTP_PORT || 587) : row?.port || 587,
    secure: environment ? process.env.SMTP_SECURE === "true" : row?.secure === true,
    username: environment ? process.env.SMTP_USERNAME?.trim() || "" : row?.username || "",
    password: environment ? process.env.SMTP_PASSWORD || "" : storedPassword,
    fromName: environment ? process.env.SMTP_FROM_NAME?.trim() || "Play!" : row?.from_name || "Play!",
    fromEmail: environment ? process.env.SMTP_FROM_EMAIL?.trim() || "" : row?.from_email || "",
    passwordConfigured: Boolean(environment ? process.env.SMTP_PASSWORD : storedPassword),
    fromEnvironment: environment,
    updatedAt: row?.updated_at.toISOString() || new Date(0).toISOString(),
  };
}

export function smtpTransport(settings: Awaited<ReturnType<typeof getSmtpSettings>>) {
  if (!settings.enabled) throw new Error("O envio de e-mail está desativado.");
  if (!settings.host || !settings.fromEmail) throw new Error("A configuração SMTP está incompleta.");
  return nodemailer.createTransport({
    host: settings.host,
    port: settings.port,
    secure: settings.secure,
    auth: settings.username ? { user: settings.username, pass: settings.password } : undefined,
  });
}
