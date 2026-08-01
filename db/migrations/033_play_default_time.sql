alter table system_settings
  add column if not exists default_play_time_seconds smallint not null default 15;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'system_settings_default_play_time_range'
      and conrelid = 'system_settings'::regclass
  ) then
    alter table system_settings
      add constraint system_settings_default_play_time_range
      check (default_play_time_seconds between 5 and 300);
  end if;
end
$$;

update questions
set time_seconds = 15;
