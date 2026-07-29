alter table questions
  add column if not exists image_data text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'questions_image_data_size'
      and conrelid = 'questions'::regclass
  ) then
    alter table questions
      add constraint questions_image_data_size
      check (image_data is null or char_length(image_data) <= 750000);
  end if;
end $$;
