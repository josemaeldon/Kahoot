import type { NextApiRequest, NextApiResponse } from "next";
import { query } from "@lib/db";

type Response =
  | { error: false; registrationEnabled: boolean }
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
    return res.status(200).json({
      error: false,
      registrationEnabled: result.rows[0]?.registration_enabled !== false,
    });
  } catch (error) {
    console.error("Falha ao consultar disponibilidade de cadastro", error);
    return res.status(500).json({
      error: true,
      errorDescription: "Não foi possível consultar os cadastros.",
    });
  }
}
