alter table users
  add column if not exists role text not null default 'user',
  add column if not exists is_enabled boolean not null default true,
  add column if not exists access_expires_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_role_check'
      and conrelid = 'users'::regclass
  ) then
    alter table users
      add constraint users_role_check
      check (role in ('user', 'superadmin'));
  end if;
end
$$;

create unique index if not exists users_single_superadmin_idx
  on users (role)
  where role = 'superadmin';

create table if not exists system_settings (
  id smallint primary key default 1 check (id = 1),
  registration_enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references users(id) on delete set null
);

insert into system_settings (id, registration_enabled)
values (1, true)
on conflict (id) do nothing;

with first_user as (
  select id
  from users
  where not exists (
    select 1 from users where role = 'superadmin'
  )
  order by created_at asc, id asc
  limit 1
)
update users
set role = 'superadmin',
    is_enabled = true,
    access_expires_at = null,
    updated_at = now()
where id = (select id from first_user);
