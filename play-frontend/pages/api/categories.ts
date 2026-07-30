import type { NextApiRequest, NextApiResponse } from "next";
import type { db } from "play";
import { requireAuthenticatedUser } from "@lib/auth";
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from "@lib/categoryRepository";

export type APIResponse =
  | { error: false; categories: db.PlayCategory[]; category?: db.PlayCategory }
  | { error: true; errorDescription: string };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
        categories: await listCategories(user._id),
      });
    }
    if (req.method === "POST") {
      const category = await createCategory(req.body?.name, user._id);
      return res.status(201).json({
        error: false,
        category,
        categories: await listCategories(user._id),
      });
    }
    if (req.method === "PUT") {
      const categoryId = req.body?.categoryId;
      if (typeof categoryId !== "string" || !UUID_PATTERN.test(categoryId)) {
        return res.status(400).json({
          error: true,
          errorDescription: "Categoria inválida.",
        });
      }
      const result = await updateCategory(
        categoryId,
        req.body?.name,
        user._id,
        user.role === "superadmin"
      );
      if (result === "forbidden") {
        return res.status(403).json({
          error: true,
          errorDescription: "Você não pode editar esta categoria.",
        });
      }
      if (result === "not_found") {
        return res.status(404).json({
          error: true,
          errorDescription: "Categoria não encontrada.",
        });
      }
      return res.status(200).json({
        error: false,
        category: result,
        categories: await listCategories(user._id),
      });
    }
    if (req.method === "DELETE") {
      const categoryId = req.body?.categoryId;
      if (typeof categoryId !== "string" || !UUID_PATTERN.test(categoryId)) {
        return res.status(400).json({
          error: true,
          errorDescription: "Categoria inválida.",
        });
      }
      const result = await deleteCategory(
        categoryId,
        user._id,
        user.role === "superadmin"
      );
      if (result === "forbidden") {
        return res.status(403).json({
          error: true,
          errorDescription: "Você não pode excluir esta categoria.",
        });
      }
      if (result === "last_category") {
        return res.status(409).json({
          error: true,
          errorDescription: "A última categoria não pode ser excluída.",
        });
      }
      if (result === "not_found") {
        return res.status(404).json({
          error: true,
          errorDescription: "Categoria não encontrada.",
        });
      }
      return res.status(200).json({
        error: false,
        categories: await listCategories(user._id),
      });
    }
    res.setHeader("Allow", "GET, POST, PUT, DELETE");
    return res.status(405).json({
      error: true,
      errorDescription: "Método não permitido.",
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "CATEGORY_NAME") {
      return res.status(400).json({
        error: true,
        errorDescription: "A categoria deve ter entre 2 e 80 caracteres.",
      });
    }
    if (code === "CATEGORY_EXISTS") {
      return res.status(409).json({
        error: true,
        errorDescription: "Já existe uma categoria com esse nome.",
      });
    }
    console.error("Falha ao gerenciar categorias", error);
    return res.status(500).json({
      error: true,
      errorDescription: "Não foi possível atualizar as categorias.",
    });
  }
}
