-- Public questions must contain only the direct question text. Remove the
-- metadata prefix introduced while making the seeded copies distinct.
update questions q
set question_text = regexp_replace(
  q.question_text,
  '^Edição [0-9]{2} de .*? — pergunta [0-9]+: ',
  ''
)
from games g
where g.id = q.game_id
  and g.is_public = true;
