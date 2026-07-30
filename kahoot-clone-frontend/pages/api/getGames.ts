import type { NextApiRequest, NextApiResponse } from "next";
import type { db } from "kahoot";
import { requireAuthenticatedUser } from "@lib/auth";
import { listGameSummaries } from "@lib/gameRepository";
import { listFolderOrganization } from "@lib/folderRepository";

export interface APIRequest {
  scope?: "mine" | "public";
  page?: number;
  pageSize?: 10 | 20 | 50;
  folderId?: string | "unfiled" | null;
  categoryId?: string | null;
  sort?: "newest" | "oldest";
}

interface Pagination {
  page: number;
  pageSize: 10 | 20 | 50;
  total: number;
  totalPages: number;
}

interface Success {
  error: false;
  games: db.KahootSummary[];
  folders: db.KahootFolder[];
  organization: {
    totalCount: number;
    unfiledCount: number;
  };
  pagination: Pagination;
}

interface Error {
  error: true;
  errorDescription: string;
}

export type APIResponse = Success | Error;

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
  const scope = request.scope === "public" ? "public" : "mine";
  const page = Number.isInteger(request.page) && Number(request.page) > 0
    ? Number(request.page)
    : 1;
  const pageSize = [10, 20, 50].includes(Number(request.pageSize))
    ? (Number(request.pageSize) as 10 | 20 | 50)
    : 10;
  const folderId =
    scope === "mine" &&
    (request.folderId === "unfiled" ||
      (typeof request.folderId === "string" &&
        UUID_PATTERN.test(request.folderId)))
      ? request.folderId
      : null;
  const categoryId =
    scope === "public" &&
    typeof request.categoryId === "string" &&
    UUID_PATTERN.test(request.categoryId)
      ? request.categoryId
      : null;
  const sort = request.sort === "oldest" ? "oldest" : "newest";

  try {
    const [library, organization] = await Promise.all([
      listGameSummaries({
        userId: user._id,
        scope,
        folderId,
        categoryId,
        sort,
        page,
        pageSize,
      }),
      listFolderOrganization(user._id),
    ]);

    return res.status(200).json({
      error: false,
      games: library.games,
      folders: organization.folders,
      organization: {
        totalCount: organization.totalCount,
        unfiledCount: organization.unfiledCount,
      },
      pagination: library.pagination,
    });
  } catch (error) {
    console.error("Falha ao listar Kahoots", error);
    return res.status(500).json({
      error: true,
      errorDescription: "Não foi possível carregar os Kahoots.",
    });
  }
}
