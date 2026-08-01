import type { NextApiRequest, NextApiResponse } from "next";
import { requireAuthenticatedUser } from "@lib/auth";
import {
  getDefaultPlayTime,
  PLAY_TIME_OPTIONS,
  updateDefaultPlayTime,
} from "@lib/playSettings";

export type APIResponse =
  | { error: false; defaultPlayTime: number }
  | { error: true; errorDescription: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse>
) {
  const user = await requireAuthenticatedUser(req, res);
  if (!user) return;

  try {
    if (req.method === "GET") {
      return res.status(200).json({
        error: false,
        defaultPlayTime: await getDefaultPlayTime(),
      });
    }
    if (req.method === "PUT") {
      if (user.role !== "superadmin") {
        return res.status(403).json({
          error: true,
          errorDescription: "Somente o superadmin pode alterar esta configuração.",
        });
      }
      const time = Number(req.body?.defaultPlayTime);
      if (!PLAY_TIME_OPTIONS.includes(time as (typeof PLAY_TIME_OPTIONS)[number])) {
        return res.status(400).json({
          error: true,
          errorDescription: "Selecione um tempo padrão válido.",
        });
      }
      return res.status(200).json({
        error: false,
        defaultPlayTime: await updateDefaultPlayTime(time, user._id),
      });
    }
    res.setHeader("Allow", "GET, PUT");
    return res.status(405).json({
      error: true,
      errorDescription: "Método não permitido.",
    });
  } catch (error) {
    console.error("Falha ao carregar configuração do Play!", error);
    return res.status(500).json({
      error: true,
      errorDescription: "Não foi possível salvar a configuração.",
    });
  }
}
