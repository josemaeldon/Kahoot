import type { db } from "kahoot";
import { query } from "./db";

interface FolderRow {
  id: string;
  name: string;
  gameCount: string | number;
}

export async function listFolderOrganization(ownerId: string) {
  const [foldersResult, countsResult] = await Promise.all([
    query<FolderRow>(
      `select
         f.id::text,
         f.name,
         count(g.id)::int as "gameCount"
       from game_folders f
       left join games g
         on g.folder_id = f.id
        and g.author_id = f.owner_id
       where f.owner_id = $1::uuid
       group by f.id
       order by lower(f.name), f.created_at`,
      [ownerId]
    ),
    query<{ totalCount: string | number; unfiledCount: string | number }>(
      `select
         count(*)::int as "totalCount",
         count(*) filter (where folder_id is null)::int as "unfiledCount"
       from games
       where author_id = $1::uuid`,
      [ownerId]
    ),
  ]);

  const folders: db.KahootFolder[] = foldersResult.rows.map((folder) => ({
    ...folder,
    gameCount: Number(folder.gameCount),
  }));
  const counts = countsResult.rows[0];

  return {
    folders,
    totalCount: Number(counts?.totalCount || 0),
    unfiledCount: Number(counts?.unfiledCount || 0),
  };
}

export async function createFolder(ownerId: string, name: string) {
  const result = await query<{ id: string; name: string }>(
    `insert into game_folders (owner_id, name)
     values ($1::uuid, $2)
     returning id::text, name`,
    [ownerId, name]
  );
  return { ...result.rows[0], gameCount: 0 };
}

export async function renameFolder(
  folderId: string,
  ownerId: string,
  name: string
) {
  const result = await query<{ id: string; name: string }>(
    `update game_folders
     set name = $1, updated_at = now()
     where id = $2::uuid and owner_id = $3::uuid
     returning id::text, name`,
    [name, folderId, ownerId]
  );
  return result.rows[0] || null;
}

export async function deleteFolder(folderId: string, ownerId: string) {
  const result = await query(
    `delete from game_folders
     where id = $1::uuid and owner_id = $2::uuid`,
    [folderId, ownerId]
  );
  return (result.rowCount || 0) > 0;
}

export async function moveGameToFolder(
  gameId: string,
  ownerId: string,
  folderId: string | null
) {
  const result = await query(
    `update games g
     set folder_id = $1::uuid, updated_at = now()
     where g.id = $2::uuid
       and g.author_id = $3::uuid
       and (
         $1::uuid is null
         or exists (
           select 1
           from game_folders f
           where f.id = $1::uuid
             and f.owner_id = $3::uuid
         )
       )`,
    [folderId, gameId, ownerId]
  );
  return (result.rowCount || 0) > 0;
}

export async function setGameVisibility(
  gameId: string,
  ownerId: string,
  isPublic: boolean
) {
  const result = await query(
    `update games
     set
       is_public = $1,
       published_at = case
         when $1 then coalesce(published_at, now())
         else null
       end,
       updated_at = now()
     where id = $2::uuid and author_id = $3::uuid`,
    [isPublic, gameId, ownerId]
  );
  return (result.rowCount || 0) > 0;
}
