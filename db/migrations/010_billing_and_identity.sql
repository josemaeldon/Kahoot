alter table users
  add column if not exists full_name varchar(160),
  add column if not exists email varchar(254),
  add column if not exists cpf varchar(11),
  add column if not exists stripe_customer_id text;

create unique index if not exists users_email_lower_uidx
  on users (lower(email))
  where email is not null;

create unique index if not exists users_cpf_uidx
  on users (cpf)
  where cpf is not null;

create unique index if not exists users_stripe_customer_uidx
  on users (stripe_customer_id)
  where stripe_customer_id is not null;

create table if not exists stripe_settings (
  id boolean primary key default true,
  enabled boolean not null default false,
  secret_key_encrypted text,
  webhook_secret_encrypted text,
  updated_by uuid references users(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint stripe_settings_singleton check (id)
);

insert into stripe_settings (id)
values (true)
on conflict (id) do nothing;

create table if not exists subscription_plans (
  id uuid primary key default gen_random_uuid(),
  name varchar(100) not null,
  description varchar(500) not null default '',
  duration_days smallint not null,
  amount_cents integer not null,
  currency varchar(3) not null default 'brl',
  is_active boolean not null default true,
  stripe_product_id text,
  stripe_price_id text,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscription_plans_duration check (duration_days in (30, 60, 90)),
  constraint subscription_plans_amount check (amount_cents > 0),
  constraint subscription_plans_currency check (currency = lower(currency))
);

create unique index if not exists subscription_plans_stripe_price_uidx
  on subscription_plans (stripe_price_id)
  where stripe_price_id is not null;

create index if not exists subscription_plans_active_idx
  on subscription_plans (is_active, duration_days, amount_cents);

create table if not exists user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  plan_id uuid references subscription_plans(id) on delete set null,
  stripe_subscription_id text not null,
  stripe_customer_id text not null,
  status varchar(30) not null,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists user_subscriptions_stripe_uidx
  on user_subscriptions (stripe_subscription_id);

create index if not exists user_subscriptions_user_idx
  on user_subscriptions (user_id, updated_at desc);

create table if not exists stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);
