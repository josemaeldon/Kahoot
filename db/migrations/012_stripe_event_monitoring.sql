alter table stripe_webhook_events
  add column if not exists status varchar(20) not null default 'processed',
  add column if not exists livemode boolean not null default false,
  add column if not exists attempt_count integer not null default 1,
  add column if not exists last_error text,
  add column if not exists stripe_created_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

alter table stripe_webhook_events
  drop constraint if exists stripe_webhook_events_status_check;

alter table stripe_webhook_events
  add constraint stripe_webhook_events_status_check
  check (status in ('processing', 'processed', 'failed'));

create index if not exists stripe_webhook_events_recent_idx
  on stripe_webhook_events (updated_at desc);
