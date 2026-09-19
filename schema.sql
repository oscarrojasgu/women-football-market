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
drop policy if exists "WFM admins can manage photo permissions" on public.photo_permissions;
create policy "WFM admins can manage photo permissions"
on public.photo_permissions
for all
to authenticated
using (exists (select 1 from public.wfm_admins a where a.user_id=(select auth.uid())))
with check (exists (select 1 from public.wfm_admins a where a.user_id=(select auth.uid())));

-- Current admin self-read policy.
drop policy if exists "Admins can view their own admin record" on public.wfm_admins;
create policy "Admins can view their own admin record"
on public.wfm_admins
for select
to authenticated
using ((select auth.uid()) = user_id);


-- Phase 3 derived intelligence views.
-- These are read-only database views over recorded statistics; they do not duplicate source data.
create or replace view public.player_season_intelligence
with (security_invoker = true)
as
with aggregated as (
  select
    ps.player_id,
    ps.season,
    ps.club_id,
    c.name as club_name,
    c.league,
    p.position,
    p.nationality,
    sum(coalesce(ps.appearances,0))::integer as appearances,
    sum(coalesce(ps.starts,0))::integer as starts,
    sum(coalesce(ps.minutes,0))::integer as minutes,
    sum(coalesce(ps.goals,0))::integer as goals,
    sum(coalesce(ps.assists,0))::integer as assists,
    sum(coalesce(ps.shots,0))::integer as shots,
    sum(coalesce(ps.shots_on_target,0))::integer as shots_on_target,
    sum(coalesce(ps.key_passes,0))::integer as key_passes,
    sum(coalesce(ps.chances_created,0))::integer as chances_created,
    sum(coalesce(ps.tackles,0))::integer as tackles,
    sum(coalesce(ps.interceptions,0))::integer as interceptions,
    sum(coalesce(ps.progressive_passes,0))::integer as progressive_passes,
    sum(coalesce(ps.progressive_carries,0))::integer as progressive_carries,
    sum(coalesce(ps.duels_won,0))::integer as duels_won,
    sum(coalesce(ps.aerials_won,0))::integer as aerials_won,
    sum(coalesce(ps.xg,0))::numeric as xg,
    sum(coalesce(ps.xa,0))::numeric as xa,
    sum(coalesce(ps.sca,0))::integer as sca,
    sum(coalesce(ps.gca,0))::integer as gca
  from public.player_stats ps
  join public.players p on p.id = ps.player_id
  left join public.clubs c on c.id = ps.club_id
  group by ps.player_id, ps.season, ps.club_id, c.name, c.league, p.position, p.nationality
)
select a.*,
  round(a.goals::numeric * 90 / nullif(a.minutes,0), 3) as goals_per90,
  round(a.assists::numeric * 90 / nullif(a.minutes,0), 3) as assists_per90,
  round(a.xg * 90 / nullif(a.minutes,0), 3) as xg_per90,
  round(a.xa * 90 / nullif(a.minutes,0), 3) as xa_per90,
  round(a.chances_created::numeric * 90 / nullif(a.minutes,0), 3) as chances_created_per90,
  round(a.key_passes::numeric * 90 / nullif(a.minutes,0), 3) as key_passes_per90,
  round(a.tackles::numeric * 90 / nullif(a.minutes,0), 3) as tackles_per90,
  round(a.interceptions::numeric * 90 / nullif(a.minutes,0), 3) as interceptions_per90,
  round(a.progressive_passes::numeric * 90 / nullif(a.minutes,0), 3) as progressive_passes_per90,
  round(a.progressive_carries::numeric * 90 / nullif(a.minutes,0), 3) as progressive_carries_per90,
  round(a.duels_won::numeric * 90 / nullif(a.minutes,0), 3) as duels_won_per90
from aggregated a;

create or replace view public.player_peer_benchmarks
with (security_invoker = true)
as
with eligible as (
  select * from public.player_season_intelligence
  where minutes >= 450 and league is not null and position is not null
),
peer_counts as (
  select season, league, position, count(*)::integer as peer_count
  from eligible group by season, league, position
)
select
  e.player_id,e.season,e.club_id,e.club_name,e.league,e.position,pc.peer_count,
  round((percent_rank() over (partition by e.season,e.league,e.position order by e.goals_per90)*100)::numeric,1) as goals_per90_percentile,
  round((percent_rank() over (partition by e.season,e.league,e.position order by e.assists_per90)*100)::numeric,1) as assists_per90_percentile,
  round((percent_rank() over (partition by e.season,e.league,e.position order by e.xg_per90)*100)::numeric,1) as xg_per90_percentile,
  round((percent_rank() over (partition by e.season,e.league,e.position order by e.xa_per90)*100)::numeric,1) as xa_per90_percentile,
  round((percent_rank() over (partition by e.season,e.league,e.position order by e.chances_created_per90)*100)::numeric,1) as chances_created_per90_percentile,
  round((percent_rank() over (partition by e.season,e.league,e.position order by e.key_passes_per90)*100)::numeric,1) as key_passes_per90_percentile,
  round((percent_rank() over (partition by e.season,e.league,e.position order by e.tackles_per90)*100)::numeric,1) as tackles_per90_percentile,
  round((percent_rank() over (partition by e.season,e.league,e.position order by e.interceptions_per90)*100)::numeric,1) as interceptions_per90_percentile,
  round((percent_rank() over (partition by e.season,e.league,e.position order by e.progressive_carries_per90)*100)::numeric,1) as progressive_carries_per90_percentile
from eligible e
join peer_counts pc using (season,league,position)
where pc.peer_count >= 5;

grant select on public.player_season_intelligence to anon, authenticated;
grant select on public.player_peer_benchmarks to anon, authenticated;


-- Phase 3 milestone 3 ingestion/update infrastructure.
create table if not exists data_update_runs (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  run_type text not null default 'manual' check (run_type in ('manual','scheduled','webhook','backfill')),
  status text not null default 'running' check (status in ('running','completed','partial','failed')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  records_received integer not null default 0,
  records_inserted integer not null default 0,
  records_updated integer not null default 0,
  records_rejected integer not null default 0,
  error_message text,
  metadata jsonb not null default '{}'::jsonb
);

alter table player_stats
  add column if not exists match_id text,
  add column if not exists source_event_id text,
  add column if not exists updated_at timestamptz;

create unique index if not exists player_stats_source_event_uidx
  on player_stats (source_event_id)
  where source_event_id is not null;

create unique index if not exists player_stats_natural_key_uidx
  on player_stats (player_id, club_id, season, competition)
  where club_id is not null;

create index if not exists player_stats_player_season_idx
  on player_stats (player_id, season);

create index if not exists player_stats_club_season_idx
  on player_stats (club_id, season);

create index if not exists player_stats_updated_at_idx
  on player_stats (updated_at desc);

create index if not exists data_update_runs_started_idx
  on data_update_runs (started_at desc);

alter table data_update_runs enable row level security;

drop policy if exists "WFM admins can manage data update runs" on data_update_runs;
create policy "WFM admins can manage data update runs"
on data_update_runs
for all
to authenticated
using (exists (select 1 from wfm_admins a where a.user_id=(select auth.uid())))
with check (exists (select 1 from wfm_admins a where a.user_id=(select auth.uid())));

grant select, insert, update on data_update_runs to authenticated;
