-- Keep one public copy of each repeated seeded Play! and preserve the
-- duplicate records privately for recovery instead of deleting content.
with public_signatures as (
  select
    g.id,
    row_number() over (
      partition by md5(
        string_agg(
          md5(lower(regexp_replace(trim(q.question_text), '\\s+', ' ', 'g'))),
          '' order by q.position
        )
      )
      order by g.created_at asc, g.id
    ) as copy_number
  from games g
  join questions q on q.game_id = g.id
  where g.is_public = true
  group by g.id, g.created_at
), duplicates as (
  select id
  from public_signatures
  where copy_number > 1
)
update games g
set is_public = false,
    published_at = null,
    updated_at = now()
from duplicates d
where g.id = d.id;
