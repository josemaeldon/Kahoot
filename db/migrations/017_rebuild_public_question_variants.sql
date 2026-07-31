-- Rebuild the public seed questions using the edition number of each Play!
-- (rather than the row number of each question) so all 50 editions in every
-- category receive a distinct question set.
with ranked_games as (
  select
    g.id,
    g.category_id,
    row_number() over (
      partition by g.category_id
      order by g.created_at asc, g.id
    ) as edition
  from games g
  where g.is_public = true
), base_questions as (
  select
    rg.category_id,
    q.position,
    q.question_text
  from ranked_games rg
  join questions q on q.game_id = rg.id
  where rg.edition = 1
), rewritten as (
  select
    q.id,
    case
      when rg.edition = 1 then base.question_text
      else format(
        'Edição %s de %s — pergunta %s: %s',
        lpad(rg.edition::text, 2, '0'),
        c.name,
        q.position + 1,
        base.question_text
      )
    end as question_text
  from ranked_games rg
  join categories c on c.id = rg.category_id
  join questions q on q.game_id = rg.id
  join base_questions base
    on base.category_id = rg.category_id
   and base.position = q.position
)
update questions q
set question_text = rewritten.question_text
from rewritten
where q.id = rewritten.id;
