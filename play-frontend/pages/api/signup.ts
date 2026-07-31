// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import { NextApiRequest, NextApiResponse } from "next";
import type { auth } from "../../play";
import bcrypt from "bcryptjs";
import { withTransaction } from "@lib/db";
import { setSessionCookie } from "@lib/auth";
import {
  validateCpf,
  validateCredentials,
  validateEmail,
  validateFullName,
  validateWhatsapp,
  ValidationError,
} from "@lib/validation";

export interface APIRequest {
  fullName: string;
  email: string;
  cpf: string;
  username: string;
  whatsapp: string;
  password: string;
}

export type APIResponse = Success | Fail;

export interface Success {
  error: false;
  user: auth.accessTokenPayload;
}

export interface Fail {
  error: true;
  errorDescription: string;
}

class RegistrationDisabledError extends Error {}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse>
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ error: true, errorDescription: "Método não permitido" });
  }
  try {
    const { username, password } = validateCredentials(
      req.body?.username,
      req.body?.password
    );
    const fullName = validateFullName(req.body?.fullName);
    const email = validateEmail(req.body?.email);
    const cpf = validateCpf(req.body?.cpf);
    const whatsapp = validateWhatsapp(req.body?.whatsapp);
    const passwordHash = await bcrypt.hash(password, 12);
    const inserted = await withTransaction(async (client) => {
      await client.query(
        "select pg_advisory_xact_lock(hashtext('play_first_superadmin'))"
      );
      const superadmin = await client.query<{ exists: boolean }>(
        `select exists(
           select 1 from users where role = 'superadmin'
         ) as exists`
      );
      const isFirstAccess = !superadmin.rows[0].exists;

      if (!isFirstAccess) {
        const settings = await client.query<{ registration_enabled: boolean }>(
          `select registration_enabled
           from system_settings
           where id = 1`
        );
        if (settings.rows[0]?.registration_enabled === false) {
          throw new RegistrationDisabledError();
        }
      }

      return client.query<{
        id: string;
        username: string;
        whatsapp: string;
        role: auth.UserRole;
        is_enabled: boolean;
        access_expires_at: Date | null;
      }>(
        `insert into users (
           full_name,
           email,
           cpf,
           username,
           whatsapp,
           password_hash,
           role,
           is_enabled,
           access_expires_at
         )
         values (
           $1,
           $2,
           $3,
           $4,
           $5,
           $6,
           $7,
           true,
           case when $7 = 'superadmin'
             then null
             else now() + interval '30 days'
           end
         )
         returning
           id::text,
           username,
           whatsapp,
           role,
           is_enabled,
           access_expires_at`,
        [fullName, email, cpf, username, whatsapp, passwordHash, isFirstAccess ? "superadmin" : "user"]
      );
    });
    const payload: auth.accessTokenPayload = {
      _id: inserted.rows[0].id,
      username: inserted.rows[0].username,
      whatsapp: inserted.rows[0].whatsapp,
      role: inserted.rows[0].role,
      isEnabled: inserted.rows[0].is_enabled,
      accessExpiresAt:
        inserted.rows[0].access_expires_at?.toISOString() || null,
    };
    setSessionCookie(res, payload);
    return res.status(201).json({ error: false, user: payload });
  } catch (error) {
    if (error instanceof RegistrationDisabledError) {
      return res.status(403).json({
        error: true,
        errorDescription: "Novos cadastros estão temporariamente desativados.",
      });
    }
    if (error instanceof ValidationError) {
      return res
        .status(400)
        .json({ error: true, errorDescription: error.message });
    }
    if ((error as { code?: string }).code === "23505") {
      const constraint = (error as { constraint?: string }).constraint;
      const description = constraint?.includes("cpf")
        ? "Este CPF já possui uma conta."
        : constraint?.includes("email")
          ? "Este e-mail já possui uma conta."
          : "Este usuário já existe.";
      return res
        .status(409)
        .json({ error: true, errorDescription: description });
    }
    console.error("Falha ao criar usuário", error);
    return res
      .status(500)
      .json({ error: true, errorDescription: "Não foi possível criar a conta." });
  }
}
