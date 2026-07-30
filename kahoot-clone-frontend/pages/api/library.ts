import type { NextApiRequest, NextApiResponse } from "next";
import { requireAuthenticatedUser } from "@lib/auth";
import {
  moveGameToFolder,
  setGameVisibility,
} from "@lib/folderRepository";

export type APIRequest =
  | {
      action: "move";
      gameId: string;
      folderId: string | null;
    }
  | {
      action: "visibility";
      gameId: string;
      isPublic: boolean;
    };

export type APIResponse =
  | { error: false }
  | { error: true; errorDescription: string };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse>
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ error: true, errorDescription: "Método não permitido" });
  }

  const user = await requireAuthenticatedUser(req, res);
  if (!user) return;

  const request = req.body as APIRequest;
  if (!UUID_PATTERN.test(request.gameId)) {
    return res
      .status(400)
      .json({ error: true, errorDescription: "Kahoot inválido." });
  }

  try {
    if (request.action === "move") {
      if (
        request.folderId !== null &&
        !UUID_PATTERN.test(request.folderId)
      ) {
        return res
          .status(400)
          .json({ error: true, errorDescription: "Pasta inválida." });
      }
      const moved = await moveGameToFolder(
        request.gameId,
        user._id,
        request.folderId
      );
      if (!moved) {
        return res.status(404).json({
          error: true,
          errorDescription: "Kahoot ou pasta não encontrado.",
        });
      }
      return res.status(200).json({ error: false });
    }

    if (request.action === "visibility") {
      const updated = await setGameVisibility(
        request.gameId,
        user._id,
        Boolean(request.isPublic)
      );
      if (!updated) {
        return res
          .status(404)
          .json({ error: true, errorDescription: "Kahoot não encontrado." });
      }
      return res.status(200).json({ error: false });
    }

    return res
      .status(400)
      .json({ error: true, errorDescription: "Ação inválida." });
  } catch (error) {
    console.error("Falha ao organizar Kahoot", error);
    return res.status(500).json({
      error: true,
      errorDescription: "Não foi possível atualizar o Kahoot.",
    });
  }
}
