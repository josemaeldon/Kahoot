import { PoolClient } from "pg";
import type { auth, db } from "kahoot";
import { query, withTransaction } from "./db";

interface GameRow extends Omit<db.KahootGame, "date"> {
  date: string | number;
}

const gameProjection = `
  select
    g.id::text as "_id",
    g.author_id::text as "author_id",
    u.username as "author_username",
    g.title,
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
  left join questions q on q.game_id = g.id
`;

function mapGame(row: GameRow): db.KahootGame {
  return { ...row, date: Number(row.date) };
}

export async function listGamesByAuthor(authorId: string) {
  const result = await query<GameRow>(
    `${gameProjection}
     where g.author_id = $1::uuid
     group by g.id, u.username
     order by g.created_at desc`,
    [authorId]
  );
  return result.rows.map(mapGame);
}

export async function findOwnedGame(gameId: string, authorId: string) {
  const result = await query<GameRow>(
    `${gameProjection}
     where g.id = $1::uuid and g.author_id = $2::uuid
     group by g.id, u.username`,
    [gameId, authorId]
  );
  return result.rows[0] ? mapGame(result.rows[0]) : null;
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
  game: db.KahootGame,
  author: auth.accessTokenPayload
) {
  return withTransaction(async (client) => {
    const inserted = await client.query<{ id: string }>(
      `insert into games (author_id, title)
       values ($1::uuid, $2)
       returning id::text`,
      [author._id, game.title]
    );
    const gameId = inserted.rows[0].id;
    await insertQuestions(client, gameId, game.questions);
    return gameId;
  });
}

export async function updateGame(
  gameId: string,
  game: db.KahootGame,
  authorId: string
) {
  return withTransaction(async (client) => {
    const updated = await client.query<{ id: string }>(
      `update games
       set title = $1, updated_at = now()
       where id = $2::uuid and author_id = $3::uuid
       returning id::text`,
      [game.title, gameId, authorId]
    );
    if (!updated.rowCount) return false;

    await client.query("delete from questions where game_id = $1::uuid", [
      gameId,
    ]);
    await insertQuestions(client, gameId, game.questions);
    return true;
  });
}

export async function deleteOwnedGame(gameId: string, authorId: string) {
  const result = await query(
    "delete from games where id = $1::uuid and author_id = $2::uuid",
    [gameId, authorId]
  );
  return (result.rowCount || 0) > 0;
}
