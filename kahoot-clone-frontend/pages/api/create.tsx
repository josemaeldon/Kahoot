import { NextApiRequest, NextApiResponse } from "next";
import { db } from "kahoot";
import { requireAuthenticatedUser } from "@lib/auth";
import { createGame, updateGame } from "@lib/gameRepository";
import { validateGame, ValidationError } from "@lib/validation";

export type APIResponse = Success | Fail;
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "8mb",
    },
  },
};
export interface APIRequest {
  game: db.KahootGame;
  game_id?: string; //Used for updating an existing game
}

interface Success {
  error: false;
}

interface Fail {
  error: true;
  errorDescription: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse>
) {
  if (req.method !== "POST")
    return res.status(405).json({
      error: true,
      errorDescription: "Método não permitido",
    });
  const user = await requireAuthenticatedUser(req, res);
  if (!user) return;

  try {
    const requestBody = req.body as APIRequest;
    const gameData = validateGame(requestBody.game);
    const updateGameId = requestBody.game_id;

    if (typeof updateGameId === "string") {
      const updated = await updateGame(updateGameId, gameData, user._id);
      if (!updated) {
        return res
          .status(404)
          .json({ error: true, errorDescription: "Quiz não encontrado." });
      }
      return res.status(200).json({ error: false });
    }
    await createGame(gameData, user);
    return res.status(201).json({ error: false });
  } catch (error) {
    if (error instanceof ValidationError) {
      return res
        .status(400)
        .json({ error: true, errorDescription: error.message });
    }
    console.error("Falha ao salvar quiz", error);
    return res.status(500).json({
      error: true,
      errorDescription: "Não foi possível salvar o quiz.",
    });
  }
}
