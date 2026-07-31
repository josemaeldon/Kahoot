-- Keep all 50 public Plays! per category, but make every repeated seeded
-- question distinct. The edition and question number are part of the prompt
-- so each generated Play! has its own question set without deleting content.
with ranked_questions as (
  select
    q.id,
    q.question_text,
    q.position,
    c.name as category_name,
    row_number() over (
      partition by g.category_id
      order by g.created_at asc, g.id
    ) as edition
  from games g
  join categories c on c.id = g.category_id
  join questions q on q.game_id = g.id
  where g.is_public = true
), rewritten as (
  select
    id,
    case (position % 5)
      when 0 then format(
        'Na edição %s de %s, qual alternativa responde corretamente? %s',
        lpad(edition::text, 2, '0'), category_name, question_text
      )
      when 1 then format(
        'Desafio %s de %s — escolha a resposta certa para: %s',
        lpad(edition::text, 2, '0'), category_name, question_text
      )
      when 2 then format(
        'Em uma revisão de %s, edição %s: %s',
        category_name, lpad(edition::text, 2, '0'), question_text
      )
      when 3 then format(
        'Questão %s da edição %s de %s: %s',
        position + 1, lpad(edition::text, 2, '0'), category_name, question_text
      )
      else format(
        'Teste de %s — edição %s: responda à pergunta: %s',
        category_name, lpad(edition::text, 2, '0'), question_text
      )
    end as question_text
  from ranked_questions
  where edition > 1
)
update questions q
set question_text = rewritten.question_text
from rewritten
where q.id = rewritten.id;
