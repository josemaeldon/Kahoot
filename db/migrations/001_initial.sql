create table if not exists schema_migrations (
  version text primary key,
  applied_at timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  username varchar(40) not null,
  password_hash text not null,
  created_at timestamptz not null default now(),
  constraint users_username_length check (char_length(btrim(username)) between 3 and 40)
);

create unique index if not exists users_username_lower_uidx
  on users (lower(username));

create table if not exists games (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references users(id) on delete cascade,
  title varchar(160) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint games_title_not_blank check (char_length(btrim(title)) between 1 and 160)
);

create index if not exists games_author_created_idx
  on games (author_id, created_at desc);

create table if not exists questions (
  id bigint generated always as identity primary key,
  game_id uuid not null references games(id) on delete cascade,
  position smallint not null,
  question_text varchar(500) not null,
  correct_answer smallint not null,
  time_seconds smallint not null,
  constraint questions_position_nonnegative check (position >= 0),
  constraint questions_text_not_blank check (
    char_length(btrim(question_text)) between 1 and 500
  ),
  constraint questions_correct_answer_range check (
    correct_answer between 0 and 3
  ),
  constraint questions_time_range check (
    time_seconds between 5 and 300
  ),
  constraint questions_game_position_unique unique (game_id, position)
);

create table if not exists choices (
  id bigint generated always as identity primary key,
  question_id bigint not null references questions(id) on delete cascade,
  position smallint not null,
  choice_text varchar(300) not null,
  constraint choices_position_range check (position between 0 and 3),
  constraint choices_text_not_blank check (
    char_length(btrim(choice_text)) between 1 and 300
  ),
  constraint choices_question_position_unique unique (question_id, position)
);
