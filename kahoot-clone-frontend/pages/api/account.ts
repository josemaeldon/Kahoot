import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import type { auth } from "kahoot";
import { requireAuthenticatedUser, setSessionCookie } from "@lib/auth";
import { query } from "@lib/db";
import {
  validatePassword,
  validateUsername,
  validateWhatsapp,
  ValidationError,
} from "@lib/validation";

export interface APIRequest {
  username: string;
  whatsapp: string;
  currentPassword: string;
  newPassword?: string;
}

export type APIResponse =
  | { error: false; user: auth.accessTokenPayload }
  | { error: true; errorDescription: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse>
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ error: true, errorDescription: "Método não permitido" });
  }

  const authenticatedUser = await requireAuthenticatedUser(req, res);
  if (!authenticatedUser) return;

  try {
    const username = validateUsername(req.body?.username);
    const whatsapp = validateWhatsapp(req.body?.whatsapp);
    const currentPassword = validatePassword(req.body?.currentPassword);
    const newPassword =
      typeof req.body?.newPassword === "string" && req.body.newPassword !== ""
        ? validatePassword(req.body.newPassword)
        : null;

    const current = await query<{ password_hash: string }>(
      `select password_hash
       from users
       where id = $1::uuid
       limit 1`,
      [authenticatedUser._id]
    );
    const passwordMatches = current.rows[0]
      ? await bcrypt.compare(currentPassword, current.rows[0].password_hash)
      : false;
    if (!passwordMatches) {
      return res.status(403).json({
        error: true,
        errorDescription: "A senha atual está incorreta.",
      });
    }

    const passwordHash = newPassword
      ? await bcrypt.hash(newPassword, 12)
      : current.rows[0].password_hash;
    const updated = await query<{
      id: string;
      username: string;
      whatsapp: string;
      role: auth.UserRole;
      is_enabled: boolean;
      access_expires_at: Date | null;
    }>(
      `update users
       set username = $1, whatsapp = $2, password_hash = $3
       where id = $4::uuid
       returning
         id::text,
         username,
         whatsapp,
         role,
         is_enabled,
         access_expires_at`,
      [username, whatsapp, passwordHash, authenticatedUser._id]
    );
    const user: auth.accessTokenPayload = {
      _id: updated.rows[0].id,
      username: updated.rows[0].username,
      whatsapp: updated.rows[0].whatsapp,
      role: updated.rows[0].role,
      isEnabled: updated.rows[0].is_enabled,
      accessExpiresAt:
        updated.rows[0].access_expires_at?.toISOString() || null,
    };
    setSessionCookie(res, user);
    return res.status(200).json({ error: false, user });
  } catch (error) {
    if (error instanceof ValidationError) {
      return res
        .status(400)
        .json({ error: true, errorDescription: error.message });
    }
    if ((error as { code?: string }).code === "23505") {
      return res
        .status(409)
        .json({ error: true, errorDescription: "Este usuário já existe." });
    }
    console.error("Falha ao atualizar conta", error);
    return res.status(500).json({
      error: true,
      errorDescription: "Não foi possível atualizar seus dados.",
    });
  }
}
