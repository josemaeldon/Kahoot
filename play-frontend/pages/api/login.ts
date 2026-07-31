// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import type { auth } from "play";
import { query } from "@lib/db";
import { setSessionCookie } from "@lib/auth";
export interface APIRequest {
  identifier: string;
  password: string;
}

export type APIResponse = Success | Fail;

interface Success {
  error: false;
  user: auth.accessTokenPayload;
}

interface Fail {
  error: true;
  errorDescription: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: true,
      errorDescription: "Método não permitido",
    });
  }

  const identifier =
    typeof req.body?.identifier === "string"
      ? req.body.identifier.trim()
      : typeof req.body?.username === "string"
        ? req.body.username.trim()
        : "";
  const password =
    typeof req.body?.password === "string" ? req.body.password : "";
  if (!identifier || !password) {
    return res.status(400).json({
      error: true,
      errorDescription: "Informe usuário ou e-mail e senha.",
    });
  }

  try {
    const result = await query<{
      id: string;
      full_name: string | null;
      email: string | null;
      cpf: string | null;
      username: string;
      whatsapp: string | null;
      password_hash: string;
      role: auth.UserRole;
      is_enabled: boolean;
      access_expires_at: Date | null;
    }>(
      `select
         id::text,
         full_name,
         email,
         cpf,
         username,
         whatsapp,
         password_hash,
         role,
         is_enabled,
         access_expires_at
       from users
       where lower(username) = lower($1)
          or lower(email) = lower($1)
       limit 1`,
      [identifier]
    );
    const user = result.rows[0];
    const correct = user
      ? await bcrypt.compare(password, user.password_hash)
      : false;

    if (!user || !correct) {
      return res.status(401).json({
        error: true,
        errorDescription: "Usuário, e-mail ou senha inválidos.",
      });
    }

    if (!user.is_enabled) {
      return res.status(403).json({
        error: true,
        errorDescription:
          "Seu acesso está desativado. Entre em contato com o administrador para reativar.",
      });
    }

    const payload: auth.accessTokenPayload = {
      _id: user.id,
      fullName: user.full_name || "",
      email: user.email || "",
      cpf: user.cpf || "",
      username: user.username,
      whatsapp: user.whatsapp || "",
      role: user.role,
      isEnabled: user.is_enabled,
      accessExpiresAt: user.access_expires_at?.toISOString() || null,
    };
    setSessionCookie(res, payload);
    return res.status(200).json({ error: false, user: payload });
  } catch (error) {
    console.error("Falha no login", error);
    return res.status(500).json({
      error: true,
      errorDescription: "Não foi possível entrar agora.",
    });
  }
}
