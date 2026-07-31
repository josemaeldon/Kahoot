import crypto from "node:crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import { query, withTransaction } from "@lib/db";
import { validateEmail, ValidationError } from "@lib/validation";
import { getSmtpSettings, smtpTransport } from "@lib/smtpSettings";

function baseUrl(req: NextApiRequest) {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const protocol = req.headers["x-forwarded-proto"] || (process.env.NODE_ENV === "production" ? "https" : "http");
  return `${protocol}://${host}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: true, errorDescription: "Método não permitido" });
  const generic = { error: false, message: "Se o e-mail estiver cadastrado, você receberá as instruções em alguns minutos." };
  try {
    const email = validateEmail(req.body?.email);
    const user = await query<{ id: string; full_name: string | null }>("select id::text, full_name from users where lower(email)=lower($1) limit 1", [email]);
    if (!user.rows[0]) return res.status(200).json(generic);
    const settings = await getSmtpSettings();
    if (!settings.enabled) return res.status(200).json(generic);
    const token = crypto.randomBytes(32).toString("base64url");
    const hash = crypto.createHash("sha256").update(token).digest("hex");
    await withTransaction(async (client) => {
      await client.query("update password_reset_tokens set used_at=now() where user_id=$1::uuid and used_at is null", [user.rows[0].id]);
      await client.query("insert into password_reset_tokens (user_id, token_hash, expires_at) values ($1::uuid,$2,now()+interval '1 hour')", [user.rows[0].id, hash]);
    });
    const resetUrl = `${baseUrl(req)}/auth/reset-password?token=${encodeURIComponent(token)}`;
    await smtpTransport(settings).sendMail({
      from: { name: settings.fromName, address: settings.fromEmail },
      to: email,
      subject: "Redefinição de senha — Play!",
      text: `Olá${user.rows[0].full_name ? `, ${user.rows[0].full_name}` : ""}. Redefina sua senha em até 1 hora: ${resetUrl}`,
      html: `<p>Olá${user.rows[0].full_name ? `, ${user.rows[0].full_name}` : ""}.</p><p>Recebemos uma solicitação para redefinir sua senha do Play!.</p><p><a href="${resetUrl}">Redefinir minha senha</a></p><p>Este link expira em 1 hora. Se você não fez a solicitação, ignore este e-mail.</p>`,
    });
    return res.status(200).json(generic);
  } catch (error) {
    if (error instanceof ValidationError) return res.status(400).json({ error: true, errorDescription: error.message });
    console.error("Falha ao solicitar redefinição", error);
    return res.status(200).json(generic);
  }
}
