alter table subscription_plans
  add column if not exists is_free_trial boolean not null default false;

alter table subscription_plans
  drop constraint if exists subscription_plans_duration;

alter table subscription_plans
  add constraint subscription_plans_duration check (duration_days between 1 and 3650);

alter table subscription_plans
  drop constraint if exists subscription_plans_amount;

alter table subscription_plans
  add constraint subscription_plans_amount check (amount_cents >= 0);

create unique index if not exists subscription_plans_single_free_trial_uidx
  on subscription_plans (is_free_trial)
  where is_free_trial = true;
