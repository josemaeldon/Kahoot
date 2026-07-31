import type { NextApiRequest, NextApiResponse } from "next";
import { query } from "@lib/db";

type Response =
  | { error: false; registrationEnabled: boolean; trialEnabled: boolean; trialDays: number | null; trialName: string | null }
  | { error: true; errorDescription: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Response>
) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ error: true, errorDescription: "Método não permitido" });
  }

  try {
    const result = await query<{ registration_enabled: boolean }>(
      `select registration_enabled
       from system_settings
       where id = 1`
    );
    const [trial, users] = await Promise.all([
      query<{ name: string; duration_days: number }>(
      `select name, duration_days
       from subscription_plans
       where is_free_trial = true and is_active = true
       limit 1`
      ),
      query<{ exists: boolean }>("select exists(select 1 from users) as exists"),
    ]);
    return res.status(200).json({
      error: false,
      registrationEnabled: result.rows[0]?.registration_enabled !== false,
      trialEnabled: trial.rows.length > 0 || users.rows[0]?.exists !== true,
      trialDays: trial.rows[0]?.duration_days || null,
      trialName: trial.rows[0]?.name || null,
    });
  } catch (error) {
    console.error("Falha ao consultar disponibilidade de cadastro", error);
    return res.status(500).json({
      error: true,
      errorDescription: "Não foi possível consultar os cadastros.",
    });
  }
}
