-- Rebuild the default Plays from the 50-question category banks.
-- Each edition gets a rotating window of ten questions instead of the full bank.

create temporary table default_question_bank on commit drop as
select
  g.category_id,
  q.position as bank_position,
  q.question_text,
  max(c.choice_text) filter (where c.position = q.correct_answer) as correct_text,
  array_agg(c.choice_text order by c.position)
    filter (where c.position <> q.correct_answer) as wrong_choices
from games g
join questions q on q.game_id = g.id
join choices c on c.question_id = q.id
where g.is_default = true
  and g.seed_key ~ '-01$'
group by g.category_id, q.position, q.question_text, q.correct_answer;

do $$
declare
  game_record record;
  bank_record record;
  edition integer;
  question_offset integer;
  target_bank_position integer;
  correct_position integer;
  choice_position integer;
  wrong_index integer;
  question_uuid bigint;
  answer_text text;
begin
  for game_record in
    select id, category_id, seed_key
    from games
    where is_default = true
      and seed_key is not null
  loop
    edition := (regexp_match(game_record.seed_key, '-([0-9]{2})$'))[1]::integer;

    delete from questions
    where game_id = game_record.id;

    for question_offset in 0..9
    loop
      target_bank_position := (edition - 1 + question_offset) % 50;

      select * into bank_record
      from default_question_bank
      where category_id = game_record.category_id
        and default_question_bank.bank_position = target_bank_position;

      if not found then
        continue;
      end if;

      correct_position := (edition + question_offset) % 4;

      insert into questions (
        game_id,
        position,
        question_text,
        correct_answer,
        time_seconds
      )
      values (
        game_record.id,
        question_offset,
        bank_record.question_text,
        correct_position,
        30
      )
      returning id into question_uuid;

      wrong_index := 1;
      for choice_position in 0..3
      loop
        if choice_position = correct_position then
          answer_text := bank_record.correct_text;
        else
          answer_text := bank_record.wrong_choices[wrong_index];
          wrong_index := wrong_index + 1;
        end if;

        insert into choices (question_id, position, choice_text)
        values (question_uuid, choice_position, answer_text);
      end loop;
    end loop;
  end loop;
end
$$;
