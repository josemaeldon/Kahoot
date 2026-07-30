import type { NextApiRequest, NextApiResponse } from "next";
import { requireAuthenticatedUser } from "@lib/auth";
import { deleteGame } from "@lib/gameRepository";

export type APIRequest = {
  gameId: string;
};

export type APIResponse = Success | Error;

interface Success {
  error: false;
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
    if (
      await deleteGame(
        request.gameId,
        user._id,
        user.role === "superadmin"
      )
    ) {
      return res.status(200).json({ error: false });
    }
    return res
      .status(404)
      .json({ error: true, errorDescription: "Play! não encontrado." });
  } catch (error) {
    console.error("Falha ao excluir Play!", error);
    return res
      .status(400)
      .json({ error: true, errorDescription: "ID de Play! inválido." });
  }
}
