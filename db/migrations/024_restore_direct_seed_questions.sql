-- Undo the attempted wording-only variation from migration 023.
-- Public question content must be rebuilt from a real question bank, not
-- manufactured by changing the phrasing of the original ten questions.
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
  select rg.category_id, q.position, q.question_text
  from ranked_games rg
  join questions q on q.game_id = rg.id
  where rg.edition = 1
), clean_base as (
  select
    category_id,
    position,
    regexp_replace(
      regexp_replace(
        regexp_replace(question_text, '^(Qual é a resposta correta para|Qual alternativa responde a|Como se responde a|Qual opção explica|Qual definição corresponde a|O que identifica corretamente|Qual informação está correta sobre|Como se caracteriza|Qual é a forma correta de responder a|Qual alternativa está de acordo com|O que representa corretamente|Qual resposta descreve|Como se reconhece|Qual opção define|O que se pode afirmar sobre|Qual alternativa apresenta|Como é possível identificar|Qual resposta corresponde a|Qual é a explicação correta para|O que caracteriza corretamente|Qual alternativa indica|Como se define corretamente|Qual opção representa|O que descreve melhor|Qual resposta está correta sobre|Qual é a identificação correta de|Como se explica|Qual alternativa esclarece|O que corresponde corretamente a|Qual opção está correta para|Como deve ser respondida|Qual resposta identifica|O que está correto em relação a|Qual alternativa mostra|Como se reconhece corretamente|Qual definição explica|O que significa corretamente|Qual resposta apresenta|Como se descreve|Qual opção esclarece|O que melhor representa|Qual alternativa caracteriza|Como se identifica corretamente|Qual resposta explica|O que indica corretamente|Qual opção responde a|Como é definida|Qual alternativa corresponde a|O que apresenta corretamente|Qual resposta está de acordo com) ', ''),
        '^Edição [0-9]{2} de .*? — pergunta [0-9]+: ', ''
      ),
      '^Em uma revisão de .*?, edição [0-9]{2}: ', ''
    ) as question_text
  from base_questions
)
update questions q
set question_text = upper(left(clean_base.question_text, 1)) || substring(clean_base.question_text from 2)
from ranked_games rg
join clean_base
  on clean_base.category_id = rg.category_id
join questions source_q
  on source_q.game_id = rg.id
 and source_q.position = clean_base.position
where q.id = source_q.id;
