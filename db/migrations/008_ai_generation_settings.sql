create table if not exists ai_settings (
  id boolean primary key default true,
  enabled boolean not null default false,
  provider varchar(30) not null default 'openai',
  model varchar(80) not null default 'gpt-5.6-sol',
  reasoning_effort varchar(10) not null default 'low',
  system_instructions text not null default
    'Crie perguntas claras, factualmente corretas e adequadas ao público indicado. Evite ambiguidades e faça três alternativas incorretas plausíveis.',
  api_key_encrypted text,
  updated_by uuid references users(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint ai_settings_singleton check (id),
  constraint ai_settings_provider_openai check (provider = 'openai'),
  constraint ai_settings_model_not_blank check (
    char_length(btrim(model)) between 1 and 80
  ),
  constraint ai_settings_reasoning_effort check (
    reasoning_effort in ('none', 'low', 'medium', 'high')
  ),
  constraint ai_settings_instructions_length check (
    char_length(system_instructions) between 1 and 2000
  )
);

insert into ai_settings (id)
values (true)
on conflict (id) do nothing;
