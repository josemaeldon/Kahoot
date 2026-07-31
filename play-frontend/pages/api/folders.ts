import type { NextApiRequest, NextApiResponse } from "next";
import { requireAuthenticatedUser } from "@lib/auth";
import {
  createFolder,
  deleteFolder,
  listFolderOrganization,
  renameFolder,
} from "@lib/folderRepository";

export type APIRequest =
  | { action?: "list" }
  | { action: "create"; name: string }
  | { action: "rename"; folderId: string; name: string }
  | { action: "delete"; folderId: string };

type APIResponse =
  | {
      error: false;
      folder?: { id: string; name: string; gameCount?: number };
      folders?: { id: string; name: string; gameCount: number }[];
    }
  | { error: true; errorDescription: string };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validateName(value: unknown) {
  const name = typeof value === "string" ? value.trim() : "";
  if (name.length < 1 || name.length > 80) {
    throw new Error("O nome da pasta deve ter entre 1 e 80 caracteres.");
  }
  return name;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse>
) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res
      .status(405)
      .json({ error: true, errorDescription: "Método não permitido" });
  }

  const user = await requireAuthenticatedUser(req, res);
  if (!user) return;

  const request = req.body as APIRequest;

  try {
    if (req.method === "GET") {
      const organization = await listFolderOrganization(user._id);
      return res.status(200).json({
        error: false,
        folders: organization.folders,
      });
    }
    if (req.method !== "POST") {
      return res
        .status(405)
        .json({ error: true, errorDescription: "Método não permitido" });
    }
    if (request.action === "create") {
      const folder = await createFolder(user._id, validateName(request.name));
      return res.status(201).json({ error: false, folder });
    }

    if (
      (request.action === "rename" || request.action === "delete") &&
      !UUID_PATTERN.test(request.folderId)
    ) {
      return res
        .status(400)
        .json({ error: true, errorDescription: "Pasta inválida." });
    }

    if (request.action === "rename") {
      const folder = await renameFolder(
        request.folderId,
        user._id,
        validateName(request.name)
      );
      if (!folder) {
        return res
          .status(404)
          .json({ error: true, errorDescription: "Pasta não encontrada." });
      }
      return res.status(200).json({ error: false, folder });
    }

    if (request.action === "delete") {
      if (!(await deleteFolder(request.folderId, user._id))) {
        return res
          .status(404)
          .json({ error: true, errorDescription: "Pasta não encontrada." });
      }
      return res.status(200).json({ error: false });
    }

    return res
      .status(400)
      .json({ error: true, errorDescription: "Ação inválida." });
  } catch (error) {
    const databaseError = error as { code?: string };
    if (databaseError.code === "23505") {
      return res.status(409).json({
        error: true,
        errorDescription: "Você já possui uma pasta com esse nome.",
      });
    }
    if (error instanceof Error && error.message.startsWith("O nome")) {
      return res
        .status(400)
        .json({ error: true, errorDescription: error.message });
    }
    console.error("Falha ao atualizar pasta", error);
    return res.status(500).json({
      error: true,
      errorDescription: "Não foi possível salvar a pasta.",
    });
  }
}

export type { APIResponse };
