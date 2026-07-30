alter table questions
  alter column time_seconds set default 15;

update questions
set time_seconds = 15
where time_seconds <> 15;

insert into categories (name, slug, is_default)
values ('Religião', 'religiao', true)
on conflict (slug) do update
set name = excluded.name,
    is_default = true;

do $$
declare
  questions_catalog jsonb := $questions$
  [
    ["Qual é o livro sagrado central do cristianismo?","Bíblia",["Torá","Alcorão","Vedas"]],
    ["Como se chama o mês de jejum no islamismo?","Ramadã",["Advento","Vesak","Diwali"]],
    ["Qual cidade é sagrada para judeus, cristãos e muçulmanos?","Jerusalém",["Roma","Atenas","Meca"]],
    ["Em qual país o budismo surgiu?","Índia",["Japão","China","Tailândia"]],
    ["Qual é o principal dia semanal de descanso e culto no judaísmo?","Shabat",["Domingo","Sexta-feira","Vesak"]],
    ["Quem é tradicionalmente associado à fundação do budismo?","Siddhartha Gautama",["Confúcio","Lao-Tsé","Zaratustra"]],
    ["Qual celebração cristã recorda a ressurreição de Jesus?","Páscoa",["Pentecostes","Advento","Epifania"]],
    ["Como é chamado um local de culto islâmico?","Mesquita",["Sinagoga","Mosteiro","Pagode"]],
    ["Qual tradição religiosa tem os Vedas entre seus textos antigos?","Hinduísmo",["Sikhismo","Jainismo","Taoismo"]],
    ["O diálogo respeitoso entre diferentes religiões é chamado de quê?","Diálogo inter-religioso",["Proselitismo","Peregrinação","Liturgia"]]
  ]
  $questions$::jsonb;
  religion_category_id uuid;
  game_id uuid;
  question_id bigint;
  question_record jsonb;
  edition integer;
  question_position integer;
  correct_position integer;
  choice_position integer;
  wrong_index integer;
  answer_text text;
begin
  select id into religion_category_id
  from categories
  where slug = 'religiao';

  for edition in 1..50
  loop
    game_id := null;

    insert into games (
      author_id,
      category_id,
      title,
      is_public,
      is_default,
      seed_key,
      published_at,
      created_at,
      updated_at
    )
    values (
      '00000000-0000-4000-8000-000000000001'::uuid,
      religion_category_id,
      'Religião — Desafio ' || lpad(edition::text, 2, '0'),
      true,
      true,
      'religiao-' || lpad(edition::text, 2, '0'),
      now() - make_interval(mins => (51 - edition)),
      now() - make_interval(mins => (51 - edition)),
      now() - make_interval(mins => (51 - edition))
    )
    on conflict (seed_key) where seed_key is not null do nothing
    returning id into game_id;

    if game_id is null then
      continue;
    end if;

    question_position := 0;
    for question_record in
      select value from jsonb_array_elements(questions_catalog)
    loop
      correct_position := (edition + question_position) % 4;

      insert into questions (
        game_id,
        position,
        question_text,
        correct_answer,
        time_seconds
      )
      values (
        game_id,
        question_position,
        question_record->>0,
        correct_position,
        15
      )
      returning id into question_id;

      wrong_index := 0;
      for choice_position in 0..3
      loop
        if choice_position = correct_position then
          answer_text := question_record->>1;
        else
          answer_text := question_record->2->>wrong_index;
          wrong_index := wrong_index + 1;
        end if;

        insert into choices (question_id, position, choice_text)
        values (question_id, choice_position, answer_text);
      end loop;

      question_position := question_position + 1;
    end loop;
  end loop;
end
$$;
