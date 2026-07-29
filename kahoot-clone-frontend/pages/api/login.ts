// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import type { auth, db } from "kahoot";
import { query } from "@lib/db";
import { setSessionCookie } from "@lib/auth";
export interface APIRequest {
  username: string;
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

  const username =
    typeof req.body?.username === "string" ? req.body.username.trim() : "";
  const password =
    typeof req.body?.password === "string" ? req.body.password : "";
  if (!username || !password) {
    return res.status(400).json({
      error: true,
      errorDescription: "Informe usuário e senha.",
    });
  }

  try {
    const result = await query<{
      id: string;
      username: string;
      password_hash: string;
    }>(
      `select id::text, username, password_hash
       from users
       where lower(username) = lower($1)
       limit 1`,
      [username]
    );
    const user = result.rows[0];
    const correct = user
      ? await bcrypt.compare(password, user.password_hash)
      : false;

    if (!user || !correct) {
      return res.status(401).json({
        error: true,
        errorDescription: "Usuário ou senha inválidos.",
      });
    }

    const payload: auth.accessTokenPayload = {
      _id: user.id,
      username: user.username,
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
