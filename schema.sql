-- Women’s Football Market — Phase 1 canonical database schema
-- This file documents the current live public schema.
-- Review against Supabase before applying to an existing production database.
create extension if not exists pgcrypto;

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  date_of_birth date,
  nationality text,
  position text,
  preferred_foot text,
  agency text,
  created_at timestamptz not null default now(),
  photo_url text,
  height_cm integer,
  birthplace text,
  secondary_position text,
  current_club_since date,
  youth_clubs text,
  photo_source text,
  photo_credit text,
  photo_license text,
  photo_accessed_at date
);

create table if not exists clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text,
  league text,
  created_at timestamptz not null default now(),
  logo_url text,
  organization_type text not null default 'club',
  logo_source text,
  logo_license text,
  logo_accessed_at date
);

create table if not exists sources (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  publisher text,
  published_at date,
  reliability text not null check (reliability in ('official','reliable_media','specialist','estimate')),
  accessed_at timestamptz not null default now()
);

create table if not exists contracts (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id),
  club_id uuid not null references clubs(id),
  start_date date,
  end_date date,
  annual_salary numeric,
  weekly_salary numeric,
  currency text default 'USD',
  guaranteed boolean,
  option_year boolean,
  status text not null default 'active',
  source_id uuid references sources(id),
  confidence text not null default 'unknown' check (confidence in ('verified','reported','estimated','rumored','unknown')),
  notes text,
  created_at timestamptz not null default now(),
  annual_salary_usd numeric,
  weekly_salary_usd numeric,
  exchange_rate_to_usd numeric,
  conversion_date date
);

create table if not exists transfers (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id),
  from_club_id uuid references clubs(id),
  to_club_id uuid references clubs(id),
  transfer_date date,
  transfer_type text not null check (transfer_type in ('permanent','loan','free','trade','release','contract_expiration')),
  fee numeric,
  currency text default 'USD',
  source_id uuid references sources(id),
  confidence text not null default 'unknown' check (confidence in ('verified','reported','estimated','rumored','unknown')),
  notes text
);

create table if not exists salary_records (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id),
  season text not null,
  annual_salary numeric,
  weekly_salary numeric,
  currency text default 'USD',
  source_id uuid references sources(id),
  confidence text not null default 'unknown' check (confidence in ('verified','reported','estimated','rumored','unknown')),
  notes text
);

create table if not exists market_values (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id),
  valuation_date date not null,
  market_value numeric,
  currency text default 'USD',
  confidence text check (confidence in ('verified','reported','estimated','rumored','unknown')),
  source_id uuid references sources(id),
  notes text,
  created_at timestamptz default now(),
  market_value_usd numeric,
  exchange_rate_to_usd numeric,
  conversion_date date
);

create table if not exists player_stats (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id),
  club_id uuid references clubs(id),
  season text not null,
  competition text not null,
  appearances integer,
  starts integer,
  minutes integer,
  goals integer,
  assists integer,
  yellow_cards integer,
  red_cards integer,
  source_id uuid references sources(id),
  confidence text check (confidence in ('verified','reported','estimated','rumored','unknown')),
  notes text,
  created_at timestamptz default now(),
  shots integer,
  shots_on_target integer,
  key_passes integer,
  chances_created integer,
  crosses integer,
  tackles integer,
  tackles_won integer,
  interceptions integer,
  clearances integer,
  blocks integer,
  recoveries integer,
  dispossessions integer,
  dribbles_attempted integer,
  dribbles_completed integer,
  fouls_committed integer,
  fouls_drawn integer,
  offsides integer,
  passes_attempted integer,
  passes_completed integer,
  progressive_passes integer,
  progressive_carries integer,
  duels_won integer,
  duels_lost integer,
  aerials_won integer,
  aerials_lost integer,
  xg numeric,
  xa numeric,
  sca integer,
  gca integer,
  saves integer,
  shots_on_target_faced integer,
  goals_against integer,
  clean_sheets integer,
  penalty_kicks_saved integer,
  penalty_kicks_faced integer,
  own_goals integer
);

create table if not exists national_team_stats (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id),
  country text not null,
  level text default 'senior',
  season text,
  competition text,
  caps integer,
  goals integer,
  source_id uuid references sources(id),
  confidence text check (confidence in ('verified','reported','estimated','rumored','unknown')),
  notes text,
  created_at timestamptz default now()
);

create table if not exists player_achievements (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id),
  achievement text not null,
  achievement_type text,
  club_name text,
  country text,
  season text,
  source_id uuid references sources(id),
  confidence text check (confidence in ('verified','reported','estimated','rumored','unknown')),
  notes text,
  created_at timestamptz default now()
);

create table if not exists verification_submissions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references players(id),
  club_id uuid references clubs(id),
  submitted_by uuid,
  submission_type text not null,
  field_name text,
  old_value text,
  new_value text,
  evidence_url text,
  source_id uuid references sources(id),
  notes text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists player_claims (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id),
  user_id uuid not null,
  verification_method text,
  status text not null default 'pending' check (status in ('pending','verified','rejected')),
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists photo_permissions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references players(id),
  club_id uuid references clubs(id),
  photo_url text not null,
  copyright_holder text,
  credit text,
  license_type text,
  permission_granted boolean not null default false,
  permission_date date,
  permission_document text,
  status text not null default 'unverified' check (status in ('unverified','pending','verified','revoked')),
  created_at timestamptz not null default now()
);

create table if not exists wfm_admins (
  user_id uuid primary key references auth.users(id),
  email text,
  role text not null default 'owner' check (role in ('owner','editor')),
  created_at timestamptz not null default now()
);

alter table players enable row level security;
alter table clubs enable row level security;
alter table sources enable row level security;
alter table contracts enable row level security;
alter table transfers enable row level security;
alter table salary_records enable row level security;
alter table market_values enable row level security;
alter table player_stats enable row level security;
alter table national_team_stats enable row level security;
alter table player_achievements enable row level security;
alter table verification_submissions enable row level security;
alter table player_claims enable row level security;
alter table photo_permissions enable row level security;
alter table wfm_admins enable row level security;

-- Current admin-only photo-permission policy.
create policy "WFM admins can manage photo permissions"
on public.photo_permissions
for all
to authenticated
using (exists (select 1 from public.wfm_admins a where a.user_id=(select auth.uid())))
with check (exists (select 1 from public.wfm_admins a where a.user_id=(select auth.uid())));

-- Current admin self-read policy.
create policy "Admins can view their own admin record"
on public.wfm_admins
for select
to authenticated
using ((select auth.uid()) = user_id);
