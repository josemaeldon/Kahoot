import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "../../kahoot";
import { requireAuthenticatedUser } from "@lib/auth";
import {
  findAccessibleGame,
  findEditableGame,
} from "@lib/gameRepository";

export type APIRequest = {
  gameId: string;
  ownerOnly?: boolean;
};

export type APIResponse = Success | Error;

interface Success {
  error: false;
  game: db.KahootGame;
}

interface Error {
  error: true;
  errorDescription: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse>
) {
  if (req.method !== "POST")
    return res
      .status(405)
      .json({ error: true, errorDescription: "Método não permitido" });
  const user = await requireAuthenticatedUser(req, res);
  if (!user) return;
  try {
    const request = req.body as APIRequest;
    const game = request.ownerOnly
      ? await findEditableGame(
          request.gameId,
          user._id,
          user.role === "superadmin"
        )
      : await findAccessibleGame(request.gameId, user._id);
    if (game) {
      return res.status(200).json({ error: false, game });
    }
    return res
      .status(404)
      .json({ error: true, errorDescription: "Quiz não encontrado." });
  } catch (error) {
    console.error("Falha ao buscar quiz", error);
    return res
      .status(400)
      .json({ error: true, errorDescription: "ID de quiz inválido." });
  }
}
