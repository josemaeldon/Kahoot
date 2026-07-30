create table if not exists game_folders (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users(id) on delete cascade,
  name varchar(80) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint game_folders_name_not_blank check (
    char_length(btrim(name)) between 1 and 80
  )
);

create unique index if not exists game_folders_owner_name_lower_uidx
  on game_folders (owner_id, lower(name));

create index if not exists game_folders_owner_created_idx
  on game_folders (owner_id, created_at asc);

alter table games
  add column if not exists folder_id uuid,
  add column if not exists is_public boolean not null default false,
  add column if not exists published_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'games_folder_id_fkey'
      and conrelid = 'games'::regclass
  ) then
    alter table games
      add constraint games_folder_id_fkey
      foreign key (folder_id)
      references game_folders(id)
      on delete set null;
  end if;
end
$$;

create index if not exists games_folder_id_idx
  on games (folder_id);

create index if not exists games_author_folder_created_idx
  on games (author_id, folder_id, created_at desc);

create index if not exists games_public_published_idx
  on games (published_at desc, created_at desc)
  where is_public = true;
