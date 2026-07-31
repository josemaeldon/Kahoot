-- Remove seed metadata from the public question text while keeping each
-- question distinct through natural, neutral wording variations.
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
), templates(template, position) as (
  select * from unnest(array[
    'Leia com atenção e responda: %s',
    'Assinale a alternativa correta: %s',
    'Qual resposta completa corretamente esta pergunta? %s',
    'Escolha a opção correta para a pergunta: %s',
    'Marque a resposta certa: %s',
    'Analise a questão e responda: %s',
    'Qual alternativa responde corretamente ao enunciado? %s',
    'Identifique a resposta correta: %s',
    'Responda corretamente à pergunta: %s',
    'Selecione a opção verdadeira: %s',
    'Qual é a alternativa correta neste caso? %s',
    'Complete a questão escolhendo a resposta certa: %s',
    'Leia a pergunta e escolha a melhor resposta: %s',
    'Entre as opções, qual está correta? %s',
    'Indique a resposta correta para este enunciado: %s',
    'Qual opção apresenta a resposta certa? %s',
    'Resolva a questão e marque a alternativa correta: %s',
    'Escolha a resposta que corresponde à pergunta: %s',
    'Qual alternativa está de acordo com o enunciado? %s',
    'Marque a opção que responde corretamente: %s',
    'Leia o enunciado e assinale a resposta correta: %s',
    'Qual resposta deve ser escolhida? %s',
    'Selecione a alternativa que responde à pergunta: %s',
    'Identifique a opção correta para este enunciado: %s',
    'Qual das opções está correta? %s',
    'Responda à questão escolhendo a alternativa certa: %s',
    'Assinale a opção que melhor responde: %s',
    'Qual alternativa traz a resposta correta? %s',
    'Escolha corretamente entre as opções: %s',
    'Indique qual opção responde à pergunta: %s',
    'Qual é a resposta correta para este enunciado? %s',
    'Marque a alternativa que completa corretamente: %s',
    'Leia e responda corretamente: %s',
    'Qual opção deve ser marcada? %s',
    'Escolha a resposta adequada para a questão: %s',
    'Assinale qual alternativa está correta: %s',
    'Aponte a resposta correta: %s',
    'Qual alternativa melhor responde ao enunciado? %s',
    'Responda escolhendo uma das opções: %s',
    'Selecione a resposta correta para esta questão: %s',
    'Qual opção responde corretamente ao que foi perguntado? %s',
    'Marque a alternativa adequada: %s',
    'Leia o enunciado com cuidado e responda: %s',
    'Escolha a alternativa verdadeira: %s',
    'Qual resposta está correta? %s',
    'Indique a alternativa certa: %s',
    'Responda à pergunta selecionando a opção correta: %s',
    'Qual das alternativas responde ao enunciado? %s',
    'Assinale a resposta adequada: %s'
  ]) with ordinality
), rewritten as (
  select
    q.id,
    case
      when rg.edition = 1 then base.question_text
      else format(templates.template, base.question_text)
    end as question_text
  from ranked_games rg
  join questions q on q.game_id = rg.id
  join base_questions base
    on base.category_id = rg.category_id
   and base.position = q.position
  left join templates
    on templates.position = rg.edition - 1
)
update questions q
set question_text = rewritten.question_text
from rewritten
where q.id = rewritten.id;
