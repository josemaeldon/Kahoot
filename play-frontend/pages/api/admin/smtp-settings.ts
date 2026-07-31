import type { NextApiRequest, NextApiResponse } from "next";
import { requireSuperadmin } from "@lib/auth";
import { query } from "@lib/db";
import { validateEmail } from "@lib/validation";
import { encryptSmtpPassword, getSmtpSettings, smtpTransport } from "@lib/smtpSettings";

export interface PublicSmtpSettings {
  enabled: boolean; host: string; port: number; secure: boolean; username: string;
  fromName: string; fromEmail: string; passwordConfigured: boolean; fromEnvironment: boolean; updatedAt: string;
}
export type SmtpSettingsResponse = { error: false; settings: PublicSmtpSettings } | { error: true; errorDescription: string };

function publicSettings(settings: Awaited<ReturnType<typeof getSmtpSettings>>): PublicSmtpSettings {
  const { password: _password, ...safe } = settings;
  return safe;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<SmtpSettingsResponse>) {
  const admin = await requireSuperadmin(req, res);
  if (!admin) return;
  try {
    if (req.method === "GET") return res.status(200).json({ error: false, settings: publicSettings(await getSmtpSettings()) });
    if (req.method !== "POST") return res.status(405).json({ error: true, errorDescription: "Método não permitido" });
    const current = await getSmtpSettings();
    if (current.fromEnvironment) throw new Error("O SMTP está definido por variáveis de ambiente e não pode ser alterado aqui.");
    const enabled = req.body?.enabled;
    const host = typeof req.body?.host === "string" ? req.body.host.trim() : "";
    const port = Number(req.body?.port);
    const secure = req.body?.secure === true;
    const username = typeof req.body?.username === "string" ? req.body.username.trim() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    const clearPassword = req.body?.clearPassword === true;
    const fromName = typeof req.body?.fromName === "string" ? req.body.fromName.trim() : "";
    const fromEmail = validateEmail(req.body?.fromEmail);
    if (typeof enabled !== "boolean") throw new Error("Estado do SMTP inválido.");
    if (!host || host.length > 255) throw new Error("Informe um servidor SMTP válido.");
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Informe uma porta SMTP válida.");
    if (!fromName || fromName.length > 120) throw new Error("Informe um nome de remetente válido.");
    if (clearPassword && password) throw new Error("Escolha entre substituir ou remover a senha.");
    await query(
      `update smtp_settings set enabled=$1, host=$2, port=$3, secure=$4, username=$5,
       password_encrypted=case when $6 then null when $7::text is not null then $7 else password_encrypted end,
       from_name=$8, from_email=$9, updated_by=$10::uuid, updated_at=now() where id=true`,
      [enabled, host, port, secure, username, clearPassword, password ? encryptSmtpPassword(password) : null, fromName, fromEmail, admin._id]
    );
    const saved = await getSmtpSettings();
    if (enabled && username && !saved.passwordConfigured) {
      await query("update smtp_settings set enabled=false where id=true");
      throw new Error("Informe a senha SMTP antes de ativar.");
    }
    if (enabled) await smtpTransport(saved).verify();
    return res.status(200).json({ error: false, settings: publicSettings(saved) });
  } catch (error) {
    if (req.method === "POST" && req.body?.enabled === true) {
      await query("update smtp_settings set enabled=false where id=true").catch(() => undefined);
    }
    console.error("Falha ao configurar SMTP", error);
    return res.status(400).json({ error: true, errorDescription: error instanceof Error ? error.message : "Não foi possível configurar o SMTP." });
  }
}
