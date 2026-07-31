create table if not exists smtp_settings (
  id boolean primary key default true,
  enabled boolean not null default false,
  host varchar(255) not null default '',
  port integer not null default 587,
  secure boolean not null default false,
  username varchar(255) not null default '',
  password_encrypted text,
  from_name varchar(120) not null default 'Play!',
  from_email varchar(254) not null default '',
  updated_by uuid references users(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint smtp_settings_port check (port between 1 and 65535)
);

insert into smtp_settings (id)
values (true)
on conflict (id) do nothing;

create table if not exists password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash char(64) not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists password_reset_tokens_hash_uidx
  on password_reset_tokens (token_hash);

create index if not exists password_reset_tokens_user_active_idx
  on password_reset_tokens (user_id, expires_at desc)
  where used_at is null;

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  title varchar(120) not null,
  message varchar(2000) not null,
  sent_by uuid references users(id) on delete set null,
  audience varchar(20) not null,
  created_at timestamptz not null default now(),
  constraint notifications_audience check (audience in ('all', 'user')),
  constraint notifications_title_not_blank check (char_length(btrim(title)) between 2 and 120),
  constraint notifications_message_not_blank check (char_length(btrim(message)) between 2 and 2000)
);

create table if not exists notification_recipients (
  notification_id uuid not null references notifications(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  read_at timestamptz,
  primary key (notification_id, user_id)
);

create index if not exists notification_recipients_user_idx
  on notification_recipients (user_id, read_at, notification_id);

create index if not exists notifications_created_idx
  on notifications (created_at desc);
