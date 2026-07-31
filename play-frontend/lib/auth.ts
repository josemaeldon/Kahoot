import { NextApiRequest, NextApiResponse } from "next";
import { serialize } from "cookie";
import jwt from "jsonwebtoken";
import type { auth } from "play";
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
    return {
      _id: decoded._id,
      username: decoded.username,
      whatsapp: typeof decoded.whatsapp === "string" ? decoded.whatsapp : "",
      role: decoded.role === "superadmin" ? "superadmin" : "user",
      isEnabled: decoded.isEnabled !== false,
      accessExpiresAt:
        typeof decoded.accessExpiresAt === "string"
          ? decoded.accessExpiresAt
          : null,
    };
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

  const result = await query<{
    id: string;
    username: string;
    whatsapp: string | null;
    role: auth.UserRole;
    is_enabled: boolean;
    access_expires_at: Date | null;
  }>(
    `select id::text, username, whatsapp, role, is_enabled, access_expires_at
     from users
     where id = $1::uuid
     limit 1`,
    [tokenUser._id]
  );
  const activeUser = result.rows[0];
  const accessExpired =
    Boolean(activeUser) &&
    activeUser.role !== "superadmin" &&
    activeUser.access_expires_at !== null &&
    activeUser.access_expires_at.getTime() <= Date.now();
  if (!activeUser || !activeUser.is_enabled || accessExpired) {
    if (res) clearSessionCookie(res);
    return null;
  }

  return {
    _id: activeUser.id,
    username: activeUser.username,
    whatsapp: activeUser.whatsapp || "",
    role: activeUser.role,
    isEnabled: activeUser.is_enabled,
    accessExpiresAt: activeUser.access_expires_at?.toISOString() || null,
  };
}

export async function getSessionAuthenticatedUser(
  req: NextApiRequest,
  res?: NextApiResponse
): Promise<auth.accessTokenPayload | null> {
  const tokenUser = getAuthenticatedUser(req);
  if (!tokenUser) {
    if (res) clearSessionCookie(res);
    return null;
  }
  const result = await query<{
    id: string;
    username: string;
    whatsapp: string | null;
    role: auth.UserRole;
    is_enabled: boolean;
    access_expires_at: Date | null;
  }>(
    `select id::text, username, whatsapp, role, is_enabled, access_expires_at
     from users where id = $1::uuid limit 1`,
    [tokenUser._id]
  );
  const user = result.rows[0];
  if (!user || !user.is_enabled) {
    if (res) clearSessionCookie(res);
    return null;
  }
  return {
    _id: user.id,
    username: user.username,
    whatsapp: user.whatsapp || "",
    role: user.role,
    isEnabled: user.is_enabled,
    accessExpiresAt: user.access_expires_at?.toISOString() || null,
  };
}

export async function requireSessionUser(req: NextApiRequest, res: NextApiResponse) {
  const user = await getSessionAuthenticatedUser(req, res);
  if (!user) {
    res.status(401).json({ error: true, errorDescription: "Sessão inválida ou expirada" });
    return null;
  }
  return user;
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

export async function requireSuperadmin(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await requireAuthenticatedUser(req, res);
  if (!user) return null;

  if (user.role !== "superadmin") {
    res.status(403).json({
      error: true,
      errorDescription: "Acesso restrito ao superadministrador.",
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
