import { PoolClient } from "pg";
import type { auth, db } from "play";
import { query, withTransaction } from "./db";

interface GameRow extends Omit<db.PlayGame, "date"> {
  date: string | number;
}

interface GameSummaryRow {
  _id: string;
  author_id: string;
  author_username: string;
  title: string;
  date: string | number;
  questionCount: string | number;
  isPublic: boolean;
  isDefault: boolean;
  folderId: string | null;
  folderName: string | null;
  categoryId: string;
  categoryName: string;
}

const gameProjection = `
  select
    g.id::text as "_id",
    g.author_id::text as "author_id",
    u.username as "author_username",
    g.title,
    g.is_public as "isPublic",
    g.is_default as "isDefault",
    g.folder_id::text as "folderId",
    f.name as "folderName",
    g.category_id::text as "categoryId",
    cat.name as "categoryName",
    floor(extract(epoch from g.created_at) * 1000)::bigint as date,
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'question', q.question_text,
          'image', q.image_data,
          'choices', coalesce(
            (
              select jsonb_agg(c.choice_text order by c.position)
              from choices c
              where c.question_id = q.id
            ),
            '[]'::jsonb
          ),
          'correctAnswer', q.correct_answer,
          'time', q.time_seconds
        )
        order by q.position
      ) filter (where q.id is not null),
      '[]'::jsonb
    ) as questions
  from games g
  join users u on u.id = g.author_id
  left join game_folders f on f.id = g.folder_id
  join categories cat on cat.id = g.category_id
  left join questions q on q.game_id = g.id
`;

function mapGame(row: GameRow): db.PlayGame {
  return { ...row, date: Number(row.date) };
}

export async function listGamesByAuthor(authorId: string) {
  const result = await query<GameRow>(
    `${gameProjection}
     where g.author_id = $1::uuid
     group by g.id, u.username, f.name, cat.name
     order by g.created_at desc`,
    [authorId]
  );
  return result.rows.map(mapGame);
}

export async function findEditableGame(
  gameId: string,
  userId: string,
  isSuperadmin: boolean
) {
  const result = await query<GameRow>(
    `${gameProjection}
     where g.id = $1::uuid
       and (
         g.author_id = $2::uuid
         or ($3::boolean = true and g.is_public = true)
       )
     group by g.id, u.username, f.name, cat.name`,
    [gameId, userId, isSuperadmin]
  );
  return result.rows[0] ? mapGame(result.rows[0]) : null;
}

export async function findAccessibleGame(gameId: string, userId: string) {
  const result = await query<GameRow>(
    `${gameProjection}
     where g.id = $1::uuid
       and (g.author_id = $2::uuid or g.is_public = true)
     group by g.id, u.username, f.name, cat.name`,
    [gameId, userId]
  );
  return result.rows[0] ? mapGame(result.rows[0]) : null;
}

export async function findRandomAccessibleGameInCategory(
  categoryId: string,
  userId: string,
  excludeGameId?: string
) {
  const result = await query<GameRow>(
    `${gameProjection}
     where g.category_id = $1::uuid
       and (g.author_id = $2::uuid or g.is_public = true)
       and ($3::uuid is null or g.id <> $3::uuid)
     group by g.id, u.username, f.name, cat.name
     order by random()
     limit 1`,
    [categoryId, userId, excludeGameId || null]
  );
  return result.rows[0] ? mapGame(result.rows[0]) : null;
}

export interface ListGameSummariesOptions {
  userId: string;
  scope: "mine" | "public";
  folderId?: string | "unfiled" | null;
  categoryId?: string | null;
  authorId?: string | null;
  sort?: "newest" | "oldest";
  page: number;
  pageSize: 10 | 20 | 50;
}

export async function listGameSummaries({
  userId,
  scope,
  folderId,
  categoryId,
  authorId,
  sort = "newest",
  page,
  pageSize,
}: ListGameSummariesOptions) {
  const values: unknown[] = [];
  const filters: string[] = [];

  if (scope === "mine") {
    values.push(userId);
    filters.push(`g.author_id = $${values.length}::uuid`);

    if (folderId === "unfiled") {
      filters.push("g.folder_id is null");
    } else if (typeof folderId === "string") {
      values.push(folderId);
      filters.push(`g.folder_id = $${values.length}::uuid`);
    }
  } else {
    filters.push("g.is_public = true");
    if (categoryId) {
      values.push(categoryId);
      filters.push(`g.category_id = $${values.length}::uuid`);
    }
    if (authorId) {
      values.push(authorId);
      filters.push(`g.author_id = $${values.length}::uuid`);
    }
  }

  const whereSql = filters.length ? `where ${filters.join(" and ")}` : "";
  const direction = scope === "public" && sort === "oldest" ? "asc" : "desc";
  const orderSql = scope === "public"
    ? `coalesce(g.published_at, g.created_at) ${direction}, g.id ${direction}`
    : "g.created_at desc, g.id desc";
  const offset = (page - 1) * pageSize;
  const pageSizePosition = values.length + 1;
  const offsetPosition = values.length + 2;

  const [countResult, gamesResult] = await Promise.all([
    query<{ total: string }>(
      `select count(*)::text as total
       from games g
       ${whereSql}`,
      values
    ),
    query<GameSummaryRow>(
      `select
         g.id::text as "_id",
         g.author_id::text as "author_id",
         u.username as "author_username",
         g.title,
         floor(extract(epoch from g.created_at) * 1000)::bigint as date,
         (select count(*) from questions q where q.game_id = g.id)::int
           as "questionCount",
         g.is_public as "isPublic",
         g.is_default as "isDefault",
         g.folder_id::text as "folderId",
         f.name as "folderName",
         g.category_id::text as "categoryId",
         cat.name as "categoryName"
       from games g
       join users u on u.id = g.author_id
       left join game_folders f on f.id = g.folder_id
       join categories cat on cat.id = g.category_id
       ${whereSql}
       order by ${orderSql}
       limit $${pageSizePosition}
       offset $${offsetPosition}`,
      [...values, pageSize, offset]
    ),
  ]);

  const total = Number(countResult.rows[0]?.total || 0);
  const games: db.PlaySummary[] = gamesResult.rows.map((row) => ({
    ...row,
    date: Number(row.date),
    questionCount: Number(row.questionCount),
    isPublic: Boolean(row.isPublic),
    isDefault: Boolean(row.isDefault),
  }));

  return {
    games,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

export async function listPublicAuthors(): Promise<db.PlayAuthor[]> {
  const result = await query<{
    id: string;
    username: string;
    gameCount: string | number;
  }>(
    `select
       u.id::text,
       u.username,
       count(g.id)::int as "gameCount"
     from users u
     join games g on g.author_id = u.id
     where g.is_public = true
     group by u.id
     order by lower(u.username), u.id`
  );
  return result.rows.map((author) => ({
    ...author,
    gameCount: Number(author.gameCount),
  }));
}

async function insertQuestions(
  client: PoolClient,
  gameId: string,
  questions: db.Question[]
) {
  for (const [questionPosition, question] of questions.entries()) {
    const inserted = await client.query<{ id: string }>(
      `insert into questions
        (game_id, position, question_text, image_data, correct_answer, time_seconds)
       values ($1::uuid, $2, $3, $4, $5, $6)
       returning id::text`,
      [
        gameId,
        questionPosition,
        question.question,
        question.image || null,
        question.correctAnswer,
        question.time,
      ]
    );
    const questionId = inserted.rows[0].id;

    for (const [choicePosition, choice] of question.choices.entries()) {
      await client.query(
        `insert into choices (question_id, position, choice_text)
         values ($1::bigint, $2, $3)`,
        [questionId, choicePosition, choice]
      );
    }
  }
}

export async function createGame(
  game: db.PlayGame,
  author: auth.accessTokenPayload
) {
  return withTransaction(async (client) => {
    const inserted = await client.query<{ id: string }>(
      `insert into games (
         author_id, category_id, folder_id, title, is_public, published_at
       )
       select
         $1::uuid,
         c.id,
         f.id,
         $2,
         $5::boolean,
         case when $5::boolean then now() else null end
       from categories c
       left join game_folders f
         on f.id = $4::uuid and f.owner_id = $1::uuid
       where c.id = $3::uuid
         and ($4::uuid is null or f.id is not null)
       returning id::text`,
      [author._id, game.title, game.categoryId, game.folderId || null, game.isPublic]
    );
    if (!inserted.rows[0]) {
      throw new Error("Categoria não encontrada.");
    }
    const gameId = inserted.rows[0].id;
    await insertQuestions(client, gameId, game.questions);
    return gameId;
  });
}

export async function updateGame(
  gameId: string,
  game: db.PlayGame,
  userId: string,
  isSuperadmin: boolean
) {
  return withTransaction(async (client) => {
    const updated = await client.query<{ id: string }>(
      `update games g
       set title = $1,
           category_id = c.id,
           folder_id = f.id,
           is_public = $7::boolean,
           published_at = case
             when $7::boolean and g.is_public = false then now()
             when $7::boolean then g.published_at
             else null
           end,
           updated_at = now()
       from categories c
       left join game_folders f
         on f.id = $6::uuid and f.owner_id = $3::uuid
       where g.id = $2::uuid
         and (
           g.author_id = $3::uuid
           or ($4::boolean = true and g.is_public = true)
         )
         and c.id = $5::uuid
         and ($6::uuid is null or f.id is not null)
       returning g.id::text`,
      [
        game.title,
        gameId,
        userId,
        isSuperadmin,
        game.categoryId,
        game.folderId || null,
        game.isPublic,
      ]
    );
    if (!updated.rowCount) return false;

    await client.query("delete from questions where game_id = $1::uuid", [
      gameId,
    ]);
    await insertQuestions(client, gameId, game.questions);
    return true;
  });
}

export async function deleteGame(
  gameId: string,
  authorId: string,
  isSuperadmin: boolean
) {
  const result = await query(
    `delete from games
     where id = $1::uuid
       and (
         (is_default = false and author_id = $2::uuid)
         or (
           $3::boolean = true
           and (is_default = true or is_public = true)
         )
       )`,
    [gameId, authorId, isSuperadmin]
  );
  return (result.rowCount || 0) > 0;
}
