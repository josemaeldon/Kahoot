import { NextApiRequest, NextApiResponse } from "next";
import { serialize } from "cookie";
import jwt from "jsonwebtoken";
import type { auth } from "kahoot";
import { query } from "./db";

const COOKIE_NAME = "accessToken";
const SESSION_SECONDS = 60 * 60 * 24 * 7;

function useSecureCookie() {
  if (process.env.COOKIE_SECURE) {
    return process.env.COOKIE_SECURE === "true";
  }
  return process.env.NODE_ENV === "production";
}

function jwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET deve ter pelo menos 32 caracteres");
  }
  return secret;
}

export function createAccessToken(payload: auth.accessTokenPayload) {
  return jwt.sign(payload, jwtSecret(), {
    algorithm: "HS256",
    expiresIn: SESSION_SECONDS,
  });
}

export function getAuthenticatedUser(
  req: NextApiRequest
): auth.accessTokenPayload | null {
  const token = req.cookies[COOKIE_NAME];
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, jwtSecret(), {
      algorithms: ["HS256"],
    });
    if (
      typeof decoded === "string" ||
      typeof decoded._id !== "string" ||
      typeof decoded.username !== "string"
    ) {
      return null;
    }
    return { _id: decoded._id, username: decoded.username };
  } catch {
    return null;
  }
}

export async function getActiveAuthenticatedUser(
  req: NextApiRequest,
  res?: NextApiResponse
): Promise<auth.accessTokenPayload | null> {
  const tokenUser = getAuthenticatedUser(req);
  if (!tokenUser) {
    if (res) clearSessionCookie(res);
    return null;
  }

  const result = await query<{ id: string; username: string }>(
    `select id::text, username
     from users
     where id = $1::uuid
     limit 1`,
    [tokenUser._id]
  );
  const activeUser = result.rows[0];
  if (!activeUser) {
    if (res) clearSessionCookie(res);
    return null;
  }

  return { _id: activeUser.id, username: activeUser.username };
}

export async function requireAuthenticatedUser(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await getActiveAuthenticatedUser(req, res);
  if (!user) {
    res.status(401).json({
      error: true,
      errorDescription: "Sessão inválida ou expirada",
    });
    return null;
  }
  return user;
}

export function setSessionCookie(
  res: NextApiResponse,
  payload: auth.accessTokenPayload
) {
  res.setHeader(
    "Set-Cookie",
    serialize(COOKIE_NAME, createAccessToken(payload), {
      httpOnly: true,
      secure: useSecureCookie(),
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_SECONDS,
    })
  );
}

export function clearSessionCookie(res: NextApiResponse) {
  res.setHeader(
    "Set-Cookie",
    serialize(COOKIE_NAME, "", {
      httpOnly: true,
      secure: useSecureCookie(),
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    })
  );
}
