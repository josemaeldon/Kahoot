import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "../../kahoot";
import { requireAuthenticatedUser } from "@lib/auth";
import { listGamesByAuthor } from "@lib/gameRepository";

export type APIRequest = UsernameRequest | UserIdRequest;

interface UsernameRequest {
  type: "username";
  username: string;
}

interface UserIdRequest {
  type: "userId";
  userId: string;
}

export type APIResponse = Success | Error;

interface Success {
  error: false;
  games: db.KahootGame[];
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
    const games = await listGamesByAuthor(user._id);
    return res.status(200).json({ error: false, games });
  } catch (error) {
    console.error("Falha ao listar quizzes", error);
    return res.status(500).json({
      error: true,
      errorDescription: "Não foi possível carregar seus quizzes.",
    });
  }
}
