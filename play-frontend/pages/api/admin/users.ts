import type { NextApiRequest, NextApiResponse } from "next";
import type { PoolClient } from "pg";
import type { auth } from "play";
import bcrypt from "bcryptjs";
import { requireSuperadmin } from "@lib/auth";
import { query, withTransaction } from "@lib/db";
import {
  validateCpfOrCnpj,
  validateEmail,
  validateFullName,
  validatePassword,
  validateUsername,
  validateWhatsapp,
  ValidationError,
} from "@lib/validation";

export type AccessOption = "30" | "60" | "90" | "unlimited" | "disabled";

export interface ManagedUser {
  id: string;
  fullName: string;
  email: string;
  cpf: string;
  username: string;
  whatsapp: string;
  role: auth.UserRole;
  isEnabled: boolean;
  accessExpiresAt: string | null;
  assignedPlanId: string | null;
  assignedPlanName: string | null;
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
           assigned_plan_id = null,
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
           assigned_plan_id = null,
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
           assigned_plan_id = null,
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
         assigned_plan_id = null,
         updated_at = now()
     where id = $1::uuid`,
    [userId, Number(access)]
  );
}

async function applyPlan(client: PoolClient, userId: string, planId: string) {
  if (!userIdPattern.test(planId)) throw new ValidationError("Plano inválido.");
  const plan = await client.query<{ duration_days: number }>(
    `select duration_days from subscription_plans where id = $1::uuid limit 1`,
    [planId]
  );
  if (!plan.rows[0]) throw new ValidationError("Plano não encontrado.");
  await client.query(
    `update users
     set is_enabled = true,
         access_expires_at = now() + make_interval(days => $2::int),
         assigned_plan_id = $3::uuid,
         updated_at = now()
     where id = $1::uuid`,
    [userId, plan.rows[0].duration_days, planId]
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
         or coalesce(full_name, '') ilike $2
         or coalesce(email, '') ilike $2
         or coalesce(cpf, '') ilike $2
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
      full_name: string | null;
      email: string | null;
      cpf: string | null;
      username: string;
      whatsapp: string | null;
      role: auth.UserRole;
      is_enabled: boolean;
      access_expires_at: Date | null;
      assigned_plan_id: string | null;
      assigned_plan_name: string | null;
      created_at: Date;
    }>(
      `select
         u.id::text,
         u.full_name,
         u.email,
         u.cpf,
         u.username,
         u.whatsapp,
         u.role,
         u.is_enabled,
         u.access_expires_at,
         u.assigned_plan_id::text,
         p.name as assigned_plan_name,
         u.created_at
       from users u
       left join subscription_plans p on p.id = u.assigned_plan_id
       where (
         $1 = ''
         or u.username ilike $2
         or coalesce(u.full_name, '') ilike $2
         or coalesce(u.email, '') ilike $2
         or coalesce(u.cpf, '') ilike $2
         or coalesce(u.whatsapp, '') ilike $2
       )
       order by
         case when u.role = 'superadmin' then 0 else 1 end,
         case
           when not u.is_enabled then 0
           when u.access_expires_at is not null and u.access_expires_at <= now()
             then 0
           else 1
         end,
         u.created_at desc,
         u.id
       limit $3
       offset $4`,
    [search, searchPattern, pageSize, offset]
  );

  return {
    error: false,
    registrationEnabled: settings.rows[0]?.registration_enabled !== false,
    users: users.rows.map((user) => ({
      id: user.id,
      fullName: user.full_name || "",
      email: user.email || "",
      cpf: user.cpf || "",
      username: user.username,
      whatsapp: user.whatsapp || "",
      role: user.role,
      isEnabled: user.is_enabled,
      accessExpiresAt: user.access_expires_at?.toISOString() || null,
      assignedPlanId: user.assigned_plan_id,
      assignedPlanName: user.assigned_plan_name,
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
      const fullName = validateFullName(req.body?.fullName);
      const email = validateEmail(req.body?.email);
      const cpf = validateCpfOrCnpj(req.body?.cpf);
      const username = validateUsername(req.body?.username);
      const whatsapp = validateWhatsapp(req.body?.whatsapp);
      const password = validatePassword(req.body?.password);
      const role = parseRole(req.body?.role);
      const access =
        role === "superadmin" ? "unlimited" : parseAccess(req.body?.access);
      const planId = role === "user" && typeof req.body?.planId === "string" ? req.body.planId : null;
      const passwordHash = await bcrypt.hash(password, 12);

      await withTransaction(async (client) => {
        const inserted = await client.query<{ id: string }>(
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
           values ($1, $2, $3, $4, $5, $6, $7, true, null)
           returning id::text`,
          [fullName, email, cpf, username, whatsapp, passwordHash, role]
        );
        if (planId) await applyPlan(client, inserted.rows[0].id, planId);
        else await applyAccess(client, inserted.rows[0].id, role, access);
      });
      return res.status(201).json(await loadAdminData(listOptions));
    }

    if (req.body?.type === "updateUser") {
      const userId = parseUserId(req.body?.userId);
      const fullName = validateFullName(req.body?.fullName);
      const email = validateEmail(req.body?.email);
      const cpf = validateCpfOrCnpj(req.body?.cpf);
      const username = validateUsername(req.body?.username);
      const whatsapp = validateWhatsapp(req.body?.whatsapp);
      const role = parseRole(req.body?.role);
      const requestedAccess =
        req.body?.access === "keep"
          ? "keep"
          : parseAccess(req.body?.access);
      const access = role === "superadmin" ? "unlimited" : requestedAccess;
      const planId = role === "user" && typeof req.body?.planId === "string" ? req.body.planId : null;
      const password =
        typeof req.body?.password === "string" && req.body.password !== ""
          ? validatePassword(req.body.password)
          : null;
      const passwordHash = password ? await bcrypt.hash(password, 12) : null;

      const changed = await withTransaction(async (client) => {
        await client.query(
          "select pg_advisory_xact_lock(hashtext('play_superadmin_management'))"
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
           set full_name = $2,
               email = $3,
               cpf = $4,
               username = $5,
               whatsapp = $6,
               role = $7,
               password_hash = coalesce($8, password_hash),
               updated_at = now()
           where id = $1::uuid`,
          [userId, fullName, email, cpf, username, whatsapp, role, passwordHash]
        );
        if (planId) {
          await applyPlan(client, userId, planId);
        } else if (role === "superadmin") {
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
          "select pg_advisory_xact_lock(hashtext('play_superadmin_management'))"
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
      const constraint = (error as { constraint?: string }).constraint;
      return res.status(409).json({
        error: true,
        errorDescription: constraint?.includes("cpf")
          ? "Este CPF ou CNPJ já possui uma conta."
          : constraint?.includes("email")
            ? "Este e-mail já possui uma conta."
            : "Este nome de usuário já está em uso.",
      });
    }
    console.error("Falha ao administrar usuários", error);
    return res.status(500).json({
      error: true,
      errorDescription: "Não foi possível atualizar a administração.",
    });
  }
}
