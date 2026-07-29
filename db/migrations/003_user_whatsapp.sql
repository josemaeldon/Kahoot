alter table users
  add column if not exists whatsapp text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_whatsapp_format'
      and conrelid = 'users'::regclass
  ) then
    alter table users
      add constraint users_whatsapp_format
      check (whatsapp is null or whatsapp ~ '^[0-9]{10,15}$');
  end if;
end $$;
