import type { NextApiRequest, NextApiResponse } from "next";
import { requireSessionUser } from "@lib/auth";
import { query } from "@lib/db";

export interface UserNotification { id: string; title: string; message: string; readAt: string | null; createdAt: string; }
async function list(userId: string) {
  const [items, count] = await Promise.all([
    query<{ id: string; title: string; message: string; read_at: Date | null; created_at: Date }>(
      `select n.id::text,n.title,n.message,nr.read_at,n.created_at from notification_recipients nr
       join notifications n on n.id=nr.notification_id where nr.user_id=$1::uuid
       order by n.created_at desc limit 30`, [userId]
    ),
    query<{ count: string }>("select count(*)::text count from notification_recipients where user_id=$1::uuid and read_at is null", [userId]),
  ]);
  return { error: false, unreadCount: Number(count.rows[0]?.count || 0), notifications: items.rows.map((item) => ({ id: item.id, title: item.title, message: item.message, readAt: item.read_at?.toISOString() || null, createdAt: item.created_at.toISOString() })) };
}
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await requireSessionUser(req, res);
  if (!user) return;
  try {
    if (req.method === "GET") return res.status(200).json(await list(user._id));
    if (req.method !== "POST") return res.status(405).json({ error: true, errorDescription: "Método não permitido" });
    if (req.body?.readAll === true) {
      await query("update notification_recipients set read_at=coalesce(read_at,now()) where user_id=$1::uuid", [user._id]);
    } else {
      const id = typeof req.body?.id === "string" ? req.body.id : "";
      await query("update notification_recipients set read_at=coalesce(read_at,now()) where user_id=$1::uuid and notification_id=$2::uuid", [user._id, id]);
    }
    return res.status(200).json(await list(user._id));
  } catch {
    return res.status(400).json({ error: true, errorDescription: "Não foi possível atualizar as notificações." });
  }
}
