import type { NextApiRequest, NextApiResponse } from "next";
import type { PoolClient } from "pg";
import type { auth } from "kahoot";
import bcrypt from "bcryptjs";
import { requireSuperadmin } from "@lib/auth";
import { query, withTransaction } from "@lib/db";
import {
  validatePassword,
  validateUsername,
  validateWhatsapp,
  ValidationError,
} from "@lib/validation";

export type AccessOption = "30" | "60" | "90" | "unlimited" | "disabled";

export interface ManagedUser {
  id: string;
  username: string;
  whatsapp: string;
  role: auth.UserRole;
  isEnabled: boolean;
  accessExpiresAt: string | null;
  createdAt: string;
}

type SuccessResponse = {
  error: false;
  registrationEnabled: boolean;
  users: ManagedUser[];
  totals: {
    total: number;
    active: number;
    attention: number;
  };
  pagination: {
    page: number;
    pageSize: 10 | 20 | 100;
    total: number;
    totalPages: number;
  };
};

type FailResponse = { error: true; errorDescription: string };
type ApiResponse = SuccessResponse | FailResponse;

const accessOptions = new Set<AccessOption>([
  "30",
  "60",
  "90",
  "unlimited",
  "disabled",
]);
const userIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseUserId(value: unknown) {
  const userId = typeof value === "string" ? value : "";
  if (!userIdPattern.test(userId)) {
    throw new ValidationError("Usuário inválido.");
  }
  return userId;
}

function parseRole(value: unknown): auth.UserRole {
  if (value !== "user" && value !== "superadmin") {
    throw new ValidationError("Tipo de usuário inválido.");
  }
  return value;
}

function parseAccess(value: unknown): AccessOption {
  const access = value as AccessOption;
  if (!accessOptions.has(access)) {
    throw new ValidationError("Período de acesso inválido.");
  }
  return access;
}

async function applyAccess(
  client: PoolClient,
  userId: string,
  role: auth.UserRole,
  access: AccessOption
) {
  if (role === "superadmin") {
    await client.query(
      `update users
       set is_enabled = true,
           access_expires_at = null,
           updated_at = now()
       where id = $1::uuid`,
      [userId]
    );
    return;
  }

  if (access === "disabled") {
    await client.query(
      `update users
       set is_enabled = false,
           access_expires_at = null,
           updated_at = now()
       where id = $1::uuid`,
      [userId]
    );
    return;
  }

  if (access === "unlimited") {
    await client.query(
      `update users
       set is_enabled = true,
           access_expires_at = null,
           updated_at = now()
       where id = $1::uuid`,
      [userId]
    );
    return;
  }

  await client.query(
    `update users
     set is_enabled = true,
         access_expires_at = now() + make_interval(days => $2::int),
         updated_at = now()
     where id = $1::uuid`,
    [userId, Number(access)]
  );
}

interface AdminListOptions {
  page: number;
  pageSize: 10 | 20 | 100;
  search: string;
}

function parseListOptions(req: NextApiRequest): AdminListOptions {
  const source = req.method === "GET" ? req.query : req.body;
  const requestedPage = Number(source?.page);
  const requestedPageSize = Number(source?.pageSize);
  const search =
    typeof source?.search === "string" ? source.search.trim().slice(0, 80) : "";
  return {
    page:
      Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1,
    pageSize: [10, 20, 100].includes(requestedPageSize)
      ? (requestedPageSize as 10 | 20 | 100)
      : 10,
    search,
  };
}

async function loadAdminData({
  page,
  pageSize,
  search,
}: AdminListOptions): Promise<SuccessResponse> {
  const searchPattern = `%${search}%`;
  const [settings, totalsResult, filteredCountResult] = await Promise.all([
    query<{ registration_enabled: boolean }>(
      `select registration_enabled
       from system_settings
       where id = 1`
    ),
    query<{
      total: string;
      active: string;
      attention: string;
    }>(
      `select
         count(*)::text as total,
         count(*) filter (
           where role = 'user'
             and is_enabled = true
             and (access_expires_at is null or access_expires_at > now())
         )::text as active,
         count(*) filter (
           where role = 'user'
             and (
               is_enabled = false
               or (access_expires_at is not null and access_expires_at <= now())
             )
         )::text as attention
       from users`
    ),
    query<{ total: string }>(
      `select count(*)::text as total
       from users
       where (
         $1 = ''
         or username ilike $2
         or coalesce(whatsapp, '') ilike $2
       )`,
      [search, searchPattern]
    ),
  ]);

  const filteredTotal = Number(filteredCountResult.rows[0]?.total || 0);
  const totalPages = Math.max(1, Math.ceil(filteredTotal / pageSize));
  const currentPage = Math.min(page, totalPages);
  const offset = (currentPage - 1) * pageSize;
  const users = await query<{
      id: string;
      username: string;
      whatsapp: string | null;
      role: auth.UserRole;
      is_enabled: boolean;
      access_expires_at: Date | null;
      created_at: Date;
    }>(
      `select
         id::text,
         username,
         whatsapp,
         role,
         is_enabled,
         access_expires_at,
         created_at
       from users
       where (
         $1 = ''
         or username ilike $2
         or coalesce(whatsapp, '') ilike $2
       )
       order by
         case when role = 'superadmin' then 0 else 1 end,
         case
           when not is_enabled then 0
           when access_expires_at is not null and access_expires_at <= now()
             then 0
           else 1
         end,
         created_at desc,
         id
       limit $3
       offset $4`,
    [search, searchPattern, pageSize, offset]
  );

  return {
    error: false,
    registrationEnabled: settings.rows[0]?.registration_enabled !== false,
    users: users.rows.map((user) => ({
      id: user.id,
      username: user.username,
      whatsapp: user.whatsapp || "",
      role: user.role,
      isEnabled: user.is_enabled,
      accessExpiresAt: user.access_expires_at?.toISOString() || null,
      createdAt: user.created_at.toISOString(),
    })),
    totals: {
      total: Number(totalsResult.rows[0]?.total || 0),
      active: Number(totalsResult.rows[0]?.active || 0),
      attention: Number(totalsResult.rows[0]?.attention || 0),
    },
    pagination: {
      page: currentPage,
      pageSize,
      total: filteredTotal,
      totalPages,
    },
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  const superadmin = await requireSuperadmin(req, res);
  if (!superadmin) return;

  try {
    const listOptions = parseListOptions(req);
    if (req.method === "GET") {
      return res.status(200).json(await loadAdminData(listOptions));
    }

    if (req.method !== "POST") {
      return res
        .status(405)
        .json({ error: true, errorDescription: "Método não permitido" });
    }

    if (req.body?.type === "setRegistration") {
      if (typeof req.body?.enabled !== "boolean") {
        throw new ValidationError("Estado de cadastro inválido.");
      }
      await query(
        `update system_settings
         set registration_enabled = $1,
             updated_at = now(),
             updated_by = $2::uuid
         where id = 1`,
        [req.body.enabled, superadmin._id]
      );
      return res.status(200).json(await loadAdminData(listOptions));
    }

    if (req.body?.type === "createUser") {
      const username = validateUsername(req.body?.username);
      const whatsapp = validateWhatsapp(req.body?.whatsapp);
      const password = validatePassword(req.body?.password);
      const role = parseRole(req.body?.role);
      const access =
        role === "superadmin" ? "unlimited" : parseAccess(req.body?.access);
      const passwordHash = await bcrypt.hash(password, 12);

      await withTransaction(async (client) => {
        const inserted = await client.query<{ id: string }>(
          `insert into users (
             username,
             whatsapp,
             password_hash,
             role,
             is_enabled,
             access_expires_at
           )
           values ($1, $2, $3, $4, true, null)
           returning id::text`,
          [username, whatsapp, passwordHash, role]
        );
        await applyAccess(client, inserted.rows[0].id, role, access);
      });
      return res.status(201).json(await loadAdminData(listOptions));
    }

    if (req.body?.type === "updateUser") {
      const userId = parseUserId(req.body?.userId);
      const username = validateUsername(req.body?.username);
      const whatsapp = validateWhatsapp(req.body?.whatsapp);
      const role = parseRole(req.body?.role);
      const requestedAccess =
        req.body?.access === "keep"
          ? "keep"
          : parseAccess(req.body?.access);
      const access = role === "superadmin" ? "unlimited" : requestedAccess;
      const password =
        typeof req.body?.password === "string" && req.body.password !== ""
          ? validatePassword(req.body.password)
          : null;
      const passwordHash = password ? await bcrypt.hash(password, 12) : null;

      const changed = await withTransaction(async (client) => {
        await client.query(
          "select pg_advisory_xact_lock(hashtext('kahoot_superadmin_management'))"
        );
        const target = await client.query<{ role: auth.UserRole }>(
          `select role
           from users
           where id = $1::uuid
           for update`,
          [userId]
        );
        if (!target.rows[0]) return "missing";
        if (userId === superadmin._id && role !== "superadmin") return "self";

        if (target.rows[0].role === "superadmin" && role === "user") {
          const count = await client.query<{ count: string }>(
            `select count(*)::text as count
             from users
             where role = 'superadmin'`
          );
          if (Number(count.rows[0].count) <= 1) return "lastSuperadmin";
        }

        await client.query(
          `update users
           set username = $2,
               whatsapp = $3,
               role = $4,
               password_hash = coalesce($5, password_hash),
               updated_at = now()
           where id = $1::uuid`,
          [userId, username, whatsapp, role, passwordHash]
        );
        if (role === "superadmin") {
          await applyAccess(client, userId, role, "unlimited");
        } else if (access === "keep") {
          if (target.rows[0].role === "superadmin") {
            await applyAccess(client, userId, role, "30");
          }
        } else {
          await applyAccess(client, userId, role, access);
        }
        return "updated";
      });

      if (changed === "missing") {
        return res.status(404).json({
          error: true,
          errorDescription: "Usuário não encontrado.",
        });
      }
      if (changed === "self") {
        return res.status(400).json({
          error: true,
          errorDescription:
            "Você não pode remover sua própria permissão de superadmin.",
        });
      }
      if (changed === "lastSuperadmin") {
        return res.status(400).json({
          error: true,
          errorDescription:
            "Promova outro usuário antes de alterar o último superadmin.",
        });
      }
      return res.status(200).json(await loadAdminData(listOptions));
    }

    if (req.body?.type === "updateAccess") {
      const userId = parseUserId(req.body?.userId);
      const access = parseAccess(req.body?.access);
      const changed = await withTransaction(async (client) => {
        const target = await client.query<{ role: auth.UserRole }>(
          `select role
           from users
           where id = $1::uuid
           for update`,
          [userId]
        );
        if (!target.rows[0]) return "missing";
        if (target.rows[0].role === "superadmin") return "superadmin";
        await applyAccess(client, userId, "user", access);
        return "updated";
      });

      if (changed === "missing") {
        return res.status(404).json({
          error: true,
          errorDescription: "Usuário não encontrado.",
        });
      }
      if (changed === "superadmin") {
        return res.status(400).json({
          error: true,
          errorDescription: "O acesso do superadministrador é permanente.",
        });
      }
      return res.status(200).json(await loadAdminData(listOptions));
    }

    if (req.body?.type === "deleteUser") {
      const userId = parseUserId(req.body?.userId);
      const deleted = await withTransaction(async (client) => {
        await client.query(
          "select pg_advisory_xact_lock(hashtext('kahoot_superadmin_management'))"
        );
        const target = await client.query<{ role: auth.UserRole }>(
          `select role
           from users
           where id = $1::uuid
           for update`,
          [userId]
        );
        if (!target.rows[0]) return "missing";
        if (userId === superadmin._id) return "self";

        if (target.rows[0].role === "superadmin") {
          const count = await client.query<{ count: string }>(
            `select count(*)::text as count
             from users
             where role = 'superadmin'`
          );
          if (Number(count.rows[0].count) <= 1) return "lastSuperadmin";
        }
        await client.query("delete from users where id = $1::uuid", [userId]);
        return "deleted";
      });

      if (deleted === "missing") {
        return res.status(404).json({
          error: true,
          errorDescription: "Usuário não encontrado.",
        });
      }
      if (deleted === "self") {
        return res.status(400).json({
          error: true,
          errorDescription: "Você não pode excluir sua própria conta.",
        });
      }
      if (deleted === "lastSuperadmin") {
        return res.status(400).json({
          error: true,
          errorDescription: "O último superadmin não pode ser excluído.",
        });
      }
      return res.status(200).json(await loadAdminData(listOptions));
    }

    return res.status(400).json({
      error: true,
      errorDescription: "Ação administrativa inválida.",
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return res
        .status(400)
        .json({ error: true, errorDescription: error.message });
    }
    if ((error as { code?: string }).code === "23505") {
      return res.status(409).json({
        error: true,
        errorDescription: "Este nome de usuário já está em uso.",
      });
    }
    console.error("Falha ao administrar usuários", error);
    return res.status(500).json({
      error: true,
      errorDescription: "Não foi possível atualizar a administração.",
    });
  }
}
