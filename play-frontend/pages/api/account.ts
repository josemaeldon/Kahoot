import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import type { auth } from "play";
import { requireAuthenticatedUser, setSessionCookie } from "@lib/auth";
import { query } from "@lib/db";
import {
  validateCpfOrCnpj,
  validateEmail,
  validateFullName,
  validatePassword,
  validateUsername,
  validateWhatsapp,
  ValidationError,
} from "@lib/validation";

export interface APIRequest {
  fullName: string;
  email: string;
  cpf: string;
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
    const fullName = validateFullName(req.body?.fullName);
    const email = validateEmail(req.body?.email);
    const cpf = validateCpfOrCnpj(req.body?.cpf);
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
      full_name: string;
      email: string;
      cpf: string;
      username: string;
      whatsapp: string;
      role: auth.UserRole;
      is_enabled: boolean;
      access_expires_at: Date | null;
    }>(
      `update users
       set full_name = $1,
           email = $2,
           cpf = $3,
           username = $4,
           whatsapp = $5,
           password_hash = $6,
           updated_at = now()
       where id = $7::uuid
       returning
         id::text,
         full_name,
         email,
         cpf,
         username,
         whatsapp,
         role,
         is_enabled,
         access_expires_at`,
      [fullName, email, cpf, username, whatsapp, passwordHash, authenticatedUser._id]
    );
    const user: auth.accessTokenPayload = {
      _id: updated.rows[0].id,
      fullName: updated.rows[0].full_name,
      email: updated.rows[0].email,
      cpf: updated.rows[0].cpf,
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
      const constraint = (error as { constraint?: string }).constraint;
      return res.status(409).json({
        error: true,
        errorDescription: constraint?.includes("cpf")
          ? "Este CPF ou CNPJ já possui uma conta."
          : constraint?.includes("email")
            ? "Este e-mail já possui uma conta."
            : "Este usuário já existe.",
      });
    }
    console.error("Falha ao atualizar conta", error);
    return res.status(500).json({
      error: true,
      errorDescription: "Não foi possível atualizar seus dados.",
    });
  }
}
