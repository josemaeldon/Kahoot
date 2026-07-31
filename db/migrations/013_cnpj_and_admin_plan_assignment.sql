alter table users
  alter column cpf type varchar(14),
  add column if not exists assigned_plan_id uuid references subscription_plans(id) on delete set null;

create index if not exists users_assigned_plan_idx
  on users (assigned_plan_id)
  where assigned_plan_id is not null;
