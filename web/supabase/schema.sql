-- Z Point — Supabase schema
-- Apply in the Supabase SQL editor (or CLI) before using auth.
-- profiles.id = auth.users.id
-- Life Portfolio, evidence, and turning points are append-only.
--
-- Related Next.js files:
--   src/lib/supabase/{env,client,server,proxy}.ts
--   src/lib/data/{workspace,actions,mappers,errors}.ts
--   src/types/database.ts

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  available_hours_per_week numeric,
  energy_level text check (energy_level in ('low', 'medium', 'high')),
  capacity_notes text,
  constraints text[] not null default '{}',
  standard_accepted_at timestamptz,
  zero_state_completed_at timestamptz,
  clarifying_completed_at timestamptz,
  zero_state jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.responsibilities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  is_non_negotiable boolean not null default false,
  time_demand text not null check (time_demand in ('low', 'medium', 'high'))
);

create table if not exists public.competing_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  priority integer not null
);

create table if not exists public.visions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text not null,
  media_urls text[] not null default '{}',
  living_density smallint not null default 0 check (living_density between 0 and 100),
  status text not null check (status in ('draft', 'active', 'locked', 'completed', 'archived')),
  context_snapshot jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  vision_id uuid not null references public.visions (id) on delete cascade,
  phases text[] not null default '{}',
  route text check (route in ('necessary', 'compressed', 'direct_proof')),
  is_locked boolean not null default false,
  locked_at timestamptz,
  capitalization_locked boolean not null default false,
  capitalization_locked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.plans add column if not exists capitalization_locked boolean not null default false;
alter table public.plans add column if not exists capitalization_locked_at timestamptz;

create table if not exists public.plan_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  plan_id uuid not null references public.plans (id) on delete cascade,
  title text not null,
  description text not null,
  phase text not null,
  sort_order integer not null,
  status text not null check (status in ('pending', 'in_progress', 'completed', 'skipped')),
  dependencies uuid[] not null default '{}',
  estimated_effort text not null check (estimated_effort in ('low', 'medium', 'high'))
);

create table if not exists public.evidence_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  action_id uuid not null references public.plan_actions (id),
  vision_id uuid not null references public.visions (id),
  payload_type text not null check (payload_type in ('text', 'image', 'link', 'file')),
  payload_content text not null,
  result_note text not null default '',
  quality_grade text not null default 'standard' check (quality_grade in ('weak', 'standard', 'strong')),
  evidence_ref text not null default '',
  recorded_at timestamptz not null default now()
);

alter table public.evidence_records add column if not exists result_note text not null default '';
alter table public.evidence_records add column if not exists quality_grade text not null default 'standard';
alter table public.evidence_records add column if not exists evidence_ref text not null default '';

create table if not exists public.possibility_turning_points (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  vision_id uuid not null references public.visions (id),
  triggering_evidence_ids uuid[] not null default '{}',
  declaration text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.life_portfolio_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  vision_id uuid not null references public.visions (id),
  type text not null check (type in ('vision', 'action', 'evidence', 'turning_point', 'connection')),
  reference_id uuid not null,
  recorded_at timestamptz not null default now()
);

create table if not exists public.user_subscriptions (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  tier text not null default 'free' check (tier in ('free', 'pro')),
  status text not null default 'free' check (status in ('free', 'trialing', 'active', 'past_due', 'canceled', 'incomplete', 'unpaid', 'paused')),
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  price_id text,
  product_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.life_portfolio_entries drop constraint if exists life_portfolio_entries_type_check;
alter table public.life_portfolio_entries add constraint life_portfolio_entries_type_check
  check (type in ('vision', 'action', 'evidence', 'turning_point', 'connection'));

create table if not exists public.strategic_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  plan_id uuid not null references public.plans (id) on delete cascade,
  vision_id uuid not null references public.visions (id) on delete cascade,
  kind text not null check (kind in ('decision_maker', 'practitioner', 'collaborator', 'introducer')),
  title text not null,
  reason text not null,
  sort_order integer not null
);

create table if not exists public.strategic_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  role_id uuid not null references public.strategic_roles (id) on delete cascade,
  plan_id uuid not null references public.plans (id) on delete cascade,
  vision_id uuid not null references public.visions (id) on delete cascade,
  action_id uuid references public.plan_actions (id) on delete set null,
  name text not null,
  context text not null,
  channel text not null default '',
  draft text not null default '',
  stage text not null check (stage in ('nominated', 'contact_drafted', 'contact_sent', 'reply_received', 'meeting_held', 'request_made')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists responsibilities_user_id_idx on public.responsibilities (user_id);
create index if not exists competing_goals_user_id_idx on public.competing_goals (user_id);
create index if not exists visions_user_id_idx on public.visions (user_id);
create index if not exists plans_user_id_idx on public.plans (user_id);
drop index if exists public.plans_vision_id_idx;
create unique index if not exists plans_vision_id_idx on public.plans (vision_id);
create index if not exists plan_actions_user_id_idx on public.plan_actions (user_id);
create index if not exists plan_actions_plan_id_idx on public.plan_actions (plan_id);
create index if not exists evidence_records_user_id_idx on public.evidence_records (user_id);
create index if not exists evidence_records_vision_id_idx on public.evidence_records (vision_id);
create index if not exists evidence_records_action_id_idx on public.evidence_records (action_id);
create index if not exists turning_points_user_id_idx on public.possibility_turning_points (user_id);
create index if not exists turning_points_vision_id_idx on public.possibility_turning_points (vision_id);
create index if not exists portfolio_user_id_idx on public.life_portfolio_entries (user_id, recorded_at);
create index if not exists strategic_roles_user_id_idx on public.strategic_roles (user_id);
create index if not exists strategic_roles_plan_id_idx on public.strategic_roles (plan_id);
create index if not exists strategic_connections_user_id_idx on public.strategic_connections (user_id);
create index if not exists strategic_connections_plan_id_idx on public.strategic_connections (plan_id);

alter table public.profiles enable row level security;
alter table public.responsibilities enable row level security;
alter table public.competing_goals enable row level security;
alter table public.visions enable row level security;
alter table public.plans enable row level security;
alter table public.plan_actions enable row level security;
alter table public.evidence_records enable row level security;
alter table public.possibility_turning_points enable row level security;
alter table public.life_portfolio_entries enable row level security;
alter table public.strategic_roles enable row level security;
alter table public.strategic_connections enable row level security;
alter table public.user_subscriptions enable row level security;

drop policy if exists profiles_own on public.profiles;
create policy profiles_own on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists responsibilities_own on public.responsibilities;
create policy responsibilities_own on public.responsibilities
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists competing_goals_own on public.competing_goals;
create policy competing_goals_own on public.competing_goals
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists visions_own on public.visions;
create policy visions_own on public.visions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists plans_own on public.plans;
create policy plans_own on public.plans
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists plan_actions_own on public.plan_actions;
create policy plan_actions_own on public.plan_actions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists evidence_records_select on public.evidence_records;
create policy evidence_records_select on public.evidence_records
  for select using (user_id = auth.uid());
drop policy if exists evidence_records_insert on public.evidence_records;
create policy evidence_records_insert on public.evidence_records
  for insert with check (user_id = auth.uid());

drop policy if exists turning_points_select on public.possibility_turning_points;
create policy turning_points_select on public.possibility_turning_points
  for select using (user_id = auth.uid());
drop policy if exists turning_points_insert on public.possibility_turning_points;
create policy turning_points_insert on public.possibility_turning_points
  for insert with check (user_id = auth.uid());

drop policy if exists portfolio_select on public.life_portfolio_entries;
create policy portfolio_select on public.life_portfolio_entries
  for select using (user_id = auth.uid());
drop policy if exists portfolio_insert on public.life_portfolio_entries;
create policy portfolio_insert on public.life_portfolio_entries
  for insert with check (user_id = auth.uid());

drop policy if exists strategic_roles_own on public.strategic_roles;
create policy strategic_roles_own on public.strategic_roles
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists strategic_connections_own on public.strategic_connections;
create policy strategic_connections_own on public.strategic_connections
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy user_subscriptions_own on public.user_subscriptions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

revoke update, delete on public.life_portfolio_entries from authenticated;
revoke update, delete on public.evidence_records from authenticated;
revoke update, delete on public.possibility_turning_points from authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
