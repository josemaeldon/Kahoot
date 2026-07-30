import type { NextApiRequest, NextApiResponse } from "next";
import { query } from "@lib/db";

export default async function health(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ status: "error" });
  }
  try {
    await query("select 1");
    return res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("Health check falhou", error);
    return res.status(503).json({ status: "unavailable" });
  }
}
