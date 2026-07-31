-- Rebuild the 50 public editions in each category with distinct question text.
-- The original seed had only ten question rows per category and copied them to
-- every edition.  Keep each answer set attached to its question while giving
-- every edition a different, direct formulation.
do $$
declare
  prefixes text[] := array[
    'Qual é a resposta correta para',
    'Qual alternativa responde a',
    'Como se responde a',
    'Qual opção explica',
    'Qual definição corresponde a',
    'O que identifica corretamente',
    'Qual informação está correta sobre',
    'Como se caracteriza',
    'Qual é a forma correta de responder a',
    'Qual alternativa está de acordo com',
    'O que representa corretamente',
    'Qual resposta descreve',
    'Como se reconhece',
    'Qual opção define',
    'O que se pode afirmar sobre',
    'Qual alternativa apresenta',
    'Como é possível identificar',
    'Qual resposta corresponde a',
    'Qual é a explicação correta para',
    'O que caracteriza corretamente',
    'Qual alternativa indica',
    'Como se define corretamente',
    'Qual opção representa',
    'O que descreve melhor',
    'Qual resposta está correta sobre',
    'Qual é a identificação correta de',
    'Como se explica',
    'Qual alternativa esclarece',
    'O que corresponde corretamente a',
    'Qual opção está correta para',
    'Como deve ser respondida',
    'Qual resposta identifica',
    'O que está correto em relação a',
    'Qual alternativa mostra',
    'Como se reconhece corretamente',
    'Qual definição explica',
    'O que significa corretamente',
    'Qual resposta apresenta',
    'Como se descreve',
    'Qual opção esclarece',
    'O que melhor representa',
    'Qual alternativa caracteriza',
    'Como se identifica corretamente',
    'Qual resposta explica',
    'O que indica corretamente',
    'Qual opção responde a',
    'Como é definida',
    'Qual alternativa corresponde a',
    'O que apresenta corretamente',
    'Qual resposta está de acordo com'
  ];
  category_record record;
  target_game record;
  target_question record;
  first_game_id uuid;
  edition integer;
  base_text text;
  direct_text text;
  prefix text;
begin
  for category_record in
    select c.id, c.name
    from categories c
    where c.is_default = true
  loop
    select g.id
    into first_game_id
    from games g
    where g.category_id = category_record.id
      and g.is_public = true
    order by g.created_at asc, g.id
    limit 1;

    if first_game_id is null then
      continue;
    end if;

    for target_game in
      select g.id,
             row_number() over (order by g.created_at asc, g.id)::integer as edition
      from games g
      where g.category_id = category_record.id
        and g.is_public = true
    loop
      edition := target_game.edition;

      for target_question in
        select q.id, q.position
        from questions q
        where q.game_id = target_game.id
        order by q.position
      loop
        select q.question_text
        into base_text
        from questions q
        where q.game_id = target_game.id
          and q.position = target_question.position
        limit 1;

        -- Remove any prefix left by the earlier migrations before creating the
        -- new direct formulation.
        base_text := regexp_replace(base_text, '^Edição [0-9]{2} de .*? — pergunta [0-9]+: ', '');
        base_text := regexp_replace(base_text, '^Na edição .*?, qual alternativa responde corretamente\? ', '');
        base_text := regexp_replace(base_text, '^Desafio .*? — escolha a resposta certa para: ', '');
        base_text := regexp_replace(base_text, '^Em uma revisão de .*?, edição [0-9]{2}: ', '');
        base_text := regexp_replace(base_text, '^Questão [0-9]+ da edição [0-9]{2} de .*?: ', '');
        base_text := regexp_replace(base_text, '^Teste de .*? — edição [0-9]{2}: responda à pergunta: ', '');

        prefix := prefixes[edition];
        direct_text := prefix || ' ' || lower(left(base_text, 1)) || substring(base_text from 2);
        direct_text := regexp_replace(direct_text, '\?$', '') || '?';

        update questions
        set question_text = left(direct_text, 500)
        where id = target_question.id;
      end loop;
    end loop;
  end loop;
end
$$;
