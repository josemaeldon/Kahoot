// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import { NextApiRequest, NextApiResponse } from "next";
import type { auth, db } from "../../kahoot";
import bcrypt from "bcryptjs";
import { query } from "@lib/db";
import { setSessionCookie } from "@lib/auth";
import {
  validateCredentials,
  validateWhatsapp,
  ValidationError,
} from "@lib/validation";

export interface APIRequest {
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
    const whatsapp = validateWhatsapp(req.body?.whatsapp);
    const passwordHash = await bcrypt.hash(password, 12);
    const inserted = await query<{
      id: string;
      username: string;
      whatsapp: string;
    }>(
      `insert into users (username, whatsapp, password_hash)
       values ($1, $2, $3)
       returning id::text, username, whatsapp`,
      [username, whatsapp, passwordHash]
    );
    const payload: auth.accessTokenPayload = {
      _id: inserted.rows[0].id,
      username: inserted.rows[0].username,
      whatsapp: inserted.rows[0].whatsapp,
    };
    setSessionCookie(res, payload);
    return res.status(201).json({ error: false, user: payload });
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
    console.error("Falha ao criar usuário", error);
    return res
      .status(500)
      .json({ error: true, errorDescription: "Não foi possível criar a conta." });
  }
}
