import type { db } from "play";
import { query, withTransaction } from "./db";

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  isDefault: boolean;
  createdByMe: boolean;
  gameCount: string | number;
}

function mapCategory(row: CategoryRow): db.PlayCategory {
  return {
    ...row,
    isDefault: Boolean(row.isDefault),
    createdByMe: Boolean(row.createdByMe),
    gameCount: Number(row.gameCount),
  };
}

export async function listCategories(userId: string) {
  const result = await query<CategoryRow>(
    `select
       c.id::text,
       c.name,
       c.slug,
       c.is_default as "isDefault",
       (c.created_by = $1::uuid) as "createdByMe",
       count(g.id)::int as "gameCount"
     from categories c
     left join games g on g.category_id = c.id
     group by c.id
     order by c.is_default desc, c.name asc`,
    [userId]
  );
  return result.rows.map(mapCategory);
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 74);
}

export async function createCategory(nameValue: unknown, userId: string) {
  const name = typeof nameValue === "string" ? nameValue.trim() : "";
  if (name.length < 2 || name.length > 80) {
    throw new Error("CATEGORY_NAME");
  }
  const slugBase = slugify(name);
  if (!slugBase) throw new Error("CATEGORY_NAME");

  const result = await query<CategoryRow>(
    `insert into categories (name, slug, created_by)
     values ($1, $2 || '-' || substr(md5(gen_random_uuid()::text), 1, 8), $3::uuid)
     on conflict (lower(name)) do nothing
     returning
       id::text,
       name,
       slug,
       is_default as "isDefault",
       true as "createdByMe",
       0::int as "gameCount"`,
    [name, slugBase, userId]
  );
  if (!result.rows[0]) throw new Error("CATEGORY_EXISTS");
  return mapCategory(result.rows[0]);
}

export async function updateCategory(
  categoryId: string,
  nameValue: unknown,
  userId: string,
  isSuperadmin: boolean
) {
  const name = typeof nameValue === "string" ? nameValue.trim() : "";
  if (name.length < 2 || name.length > 80) {
    throw new Error("CATEGORY_NAME");
  }
  const slugBase = slugify(name);
  if (!slugBase) throw new Error("CATEGORY_NAME");

  const result = await query<CategoryRow>(
    `update categories
     set name = $1,
         slug = case
           when is_default then slug
           else $2 || '-' || substr(md5(id::text), 1, 8)
         end
     where id = $3::uuid
       and (
         ($4::boolean = true)
         or (is_default = false and created_by = $5::uuid)
       )
       and not exists (
         select 1
         from categories duplicate
         where duplicate.id <> categories.id
           and lower(duplicate.name) = lower($1)
       )
     returning
       id::text,
       name,
       slug,
       is_default as "isDefault",
       (created_by = $5::uuid) as "createdByMe",
       (select count(*)::int from games where category_id = categories.id)
         as "gameCount"`,
    [name, slugBase, categoryId, isSuperadmin, userId]
  );
  if (result.rows[0]) return mapCategory(result.rows[0]);

  const existing = await query<{
    isDefault: boolean;
    createdByMe: boolean;
    duplicateName: boolean;
  }>(
    `select
       c.is_default as "isDefault",
       (c.created_by = $2::uuid) as "createdByMe",
       exists (
         select 1 from categories duplicate
         where duplicate.id <> c.id
           and lower(duplicate.name) = lower($3)
       ) as "duplicateName"
     from categories c
     where c.id = $1::uuid`,
    [categoryId, userId, name]
  );
  if (!existing.rows[0]) return "not_found" as const;
  if (existing.rows[0].duplicateName) throw new Error("CATEGORY_EXISTS");
  return "forbidden" as const;
}

export async function deleteCategory(
  categoryId: string,
  userId: string,
  isSuperadmin: boolean
) {
  return withTransaction(async (client) => {
    const selected = await client.query<{
      is_default: boolean;
      created_by: string | null;
    }>(
      `select is_default, created_by::text
       from categories
       where id = $1::uuid
       for update`,
      [categoryId]
    );
    const category = selected.rows[0];
    if (!category) return "not_found" as const;
    if (
      category.is_default
        ? !isSuperadmin
        : category.created_by !== userId && !isSuperadmin
    ) {
      return "forbidden" as const;
    }

    const fallback = await client.query<{ id: string }>(
      `select id::text
       from categories
       where id <> $1::uuid
       order by (slug = 'cultura-geral') desc, is_default desc, created_at asc
       limit 1`,
      [categoryId]
    );
    if (!fallback.rows[0]) return "last_category" as const;

    if (category.is_default) {
      await client.query(
        "delete from games where category_id = $1::uuid and is_default = true",
        [categoryId]
      );
    }
    await client.query(
      `update games
       set category_id = $2::uuid, updated_at = now()
       where category_id = $1::uuid`,
      [categoryId, fallback.rows[0].id]
    );
    await client.query("delete from categories where id = $1::uuid", [
      categoryId,
    ]);
    return "deleted" as const;
  });
}
