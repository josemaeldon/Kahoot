import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import type { NextApiRequest, NextApiResponse } from "next";
import { withTransaction } from "@lib/db";
import { validatePassword, ValidationError } from "@lib/validation";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: true, errorDescription: "Método não permitido" });
  try {
    const token = typeof req.body?.token === "string" ? req.body.token : "";
    if (token.length < 32 || token.length > 200) throw new ValidationError("Link de redefinição inválido.");
    const password = validatePassword(req.body?.password);
    if (password !== req.body?.passwordConfirmation) throw new ValidationError("As senhas não coincidem.");
    const hash = crypto.createHash("sha256").update(token).digest("hex");
    const passwordHash = await bcrypt.hash(password, 12);
    const changed = await withTransaction(async (client) => {
      const reset = await client.query<{ id: string; user_id: string }>(
        `select id::text, user_id::text from password_reset_tokens
         where token_hash=$1 and used_at is null and expires_at>now() for update`, [hash]
      );
      if (!reset.rows[0]) return false;
      await client.query("update users set password_hash=$2, updated_at=now() where id=$1::uuid", [reset.rows[0].user_id, passwordHash]);
      await client.query("update password_reset_tokens set used_at=now() where user_id=$1::uuid and used_at is null", [reset.rows[0].user_id]);
      return true;
    });
    if (!changed) return res.status(400).json({ error: true, errorDescription: "Este link expirou ou já foi utilizado." });
    return res.status(200).json({ error: false });
  } catch (error) {
    return res.status(400).json({ error: true, errorDescription: error instanceof Error ? error.message : "Não foi possível redefinir a senha." });
  }
}
