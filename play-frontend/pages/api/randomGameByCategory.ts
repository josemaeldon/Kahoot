import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "../../play";
import { requireAuthenticatedUser } from "@lib/auth";
import { findRandomAccessibleGameInCategory } from "@lib/gameRepository";

export type APIRequest = {
  categoryId: string;
  excludeGameId?: string;
};

export type APIResponse =
  | { error: false; game: db.PlayGame }
  | { error: true; errorDescription: string };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: true,
      errorDescription: "Método não permitido.",
    });
  }
  const user = await requireAuthenticatedUser(req, res);
  if (!user) return;

  const { categoryId, excludeGameId } = (req.body || {}) as APIRequest;
  if (!UUID_PATTERN.test(categoryId || "")) {
    return res.status(400).json({
      error: true,
      errorDescription: "Categoria inválida.",
    });
  }
  if (excludeGameId && !UUID_PATTERN.test(excludeGameId)) {
    return res.status(400).json({
      error: true,
      errorDescription: "Play! inválido.",
    });
  }

  try {
    let game = await findRandomAccessibleGameInCategory(
      categoryId,
      user._id,
      excludeGameId
    );
    if (!game && excludeGameId) {
      game = await findRandomAccessibleGameInCategory(categoryId, user._id);
    }
    if (!game) {
      return res.status(404).json({
        error: true,
        errorDescription: "Não há Play! disponível nesta categoria.",
      });
    }
    return res.status(200).json({ error: false, game });
  } catch (error) {
    console.error("Falha ao sortear Play! da categoria", error);
    return res.status(500).json({
      error: true,
      errorDescription: "Não foi possível sortear outro Play! agora.",
    });
  }
}
