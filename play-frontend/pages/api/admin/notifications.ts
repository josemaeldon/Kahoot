import type { NextApiRequest, NextApiResponse } from "next";
import { requireSuperadmin } from "@lib/auth";
import { query, withTransaction } from "@lib/db";

export interface AdminNotification {
  id: string; title: string; message: string; audience: "all" | "user";
  recipientCount: number; recipientName: string | null; createdAt: string;
}
export interface NotificationUser { id: string; label: string; email: string; }
export type AdminNotificationsResponse =
  | { error: false; notifications: AdminNotification[]; users: NotificationUser[] }
  | { error: true; errorDescription: string };

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function uuid(value: unknown, label: string) {
  const result = typeof value === "string" ? value : "";
  if (!uuidPattern.test(result)) throw new Error(`${label} inválido.`);
  return result;
}
function content(body: NextApiRequest["body"]) {
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (title.length < 2 || title.length > 120) throw new Error("O título deve ter entre 2 e 120 caracteres.");
  if (message.length < 2 || message.length > 2000) throw new Error("A mensagem deve ter entre 2 e 2.000 caracteres.");
  return { title, message };
}

async function loadData(search = "") {
  const pattern = `%${search.slice(0, 80)}%`;
  const [history, users] = await Promise.all([
    query<{ id: string; title: string; message: string; audience: "all" | "user"; recipient_count: string; recipient_name: string | null; created_at: Date }>(
      `select n.id::text, n.title, n.message, n.audience, count(nr.user_id)::text recipient_count,
       case when n.audience='user' then max(coalesce(u.full_name,u.username)) else null end recipient_name,
       n.created_at from notifications n
       left join notification_recipients nr on nr.notification_id=n.id
       left join users u on u.id=nr.user_id
       group by n.id order by n.created_at desc limit 100`
    ),
    query<{ id: string; label: string; email: string | null }>(
      `select id::text, coalesce(nullif(full_name,''),username) label, email from users
       where $1='' or username ilike $2 or coalesce(full_name,'') ilike $2 or coalesce(email,'') ilike $2
       order by lower(coalesce(nullif(full_name,''),username)) limit 50`, [search, pattern]
    ),
  ]);
  return {
    error: false as const,
    notifications: history.rows.map((item) => ({ id: item.id, title: item.title, message: item.message, audience: item.audience, recipientCount: Number(item.recipient_count), recipientName: item.recipient_name, createdAt: item.created_at.toISOString() })),
    users: users.rows.map((user) => ({ id: user.id, label: user.label, email: user.email || "" })),
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<AdminNotificationsResponse>) {
  const admin = await requireSuperadmin(req, res);
  if (!admin) return;
  try {
    const search = typeof (req.method === "GET" ? req.query.search : req.body?.search) === "string"
      ? String(req.method === "GET" ? req.query.search : req.body?.search).trim() : "";
    if (req.method === "GET") return res.status(200).json(await loadData(search));
    if (req.method !== "POST") return res.status(405).json({ error: true, errorDescription: "Método não permitido" });
    if (req.body?.type === "delete") {
      await query("delete from notifications where id=$1::uuid", [uuid(req.body?.id, "Notificação")]);
      return res.status(200).json(await loadData(search));
    }
    if (req.body?.type === "edit") {
      const id = uuid(req.body?.id, "Notificação");
      const { title, message } = content(req.body);
      const changed = await query("update notifications set title=$2,message=$3 where id=$1::uuid returning id", [id, title, message]);
      if (!changed.rows[0]) throw new Error("Notificação não encontrada.");
      return res.status(200).json(await loadData(search));
    }
    const { title, message } = content(req.body);
    const audience = req.body?.audience === "all" ? "all" : "user";
    const userId = audience === "user" ? uuid(req.body?.userId, "Usuário") : null;
    await withTransaction(async (client) => {
      const inserted = await client.query<{ id: string }>(
        "insert into notifications (title,message,sent_by,audience) values ($1,$2,$3::uuid,$4) returning id::text",
        [title, message, admin._id, audience]
      );
      if (audience === "all") {
        await client.query("insert into notification_recipients (notification_id,user_id) select $1::uuid,id from users", [inserted.rows[0].id]);
      } else {
        const recipient = await client.query("insert into notification_recipients (notification_id,user_id) select $1::uuid,id from users where id=$2::uuid returning user_id", [inserted.rows[0].id, userId]);
        if (!recipient.rows[0]) throw new Error("Usuário não encontrado.");
      }
    });
    return res.status(201).json(await loadData(search));
  } catch (error) {
    return res.status(400).json({ error: true, errorDescription: error instanceof Error ? error.message : "Não foi possível gerenciar a notificação." });
  }
}
