alter table users
  add column if not exists assigned_plan_cancelled_at timestamptz;
