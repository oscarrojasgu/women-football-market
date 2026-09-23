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


-- Phase 3 provider integration
create table if not exists public.provider_player_mappings (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  external_player_id text not null,
  player_id uuid not null references public.players(id) on delete cascade,
  external_name text,
  confidence text not null default 'verified',
  source_id uuid references public.sources(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  unique(provider, external_player_id)
);

create table if not exists public.player_match_stats (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  external_match_id text not null,
  external_player_id text not null,
  player_id uuid not null references public.players(id) on delete cascade,
  club_id uuid references public.clubs(id) on delete set null,
  season text not null,
  competition text not null,
  appearances integer not null default 0,
  starts integer not null default 0,
  minutes integer not null default 0,
  goals integer not null default 0,
  assists integer not null default 0,
  cards integer not null default 0,
  shots integer not null default 0,
  shots_on_target integer not null default 0,
  key_passes integer not null default 0,
  tackles integer not null default 0,
  interceptions integer not null default 0,
  clearances integer not null default 0,
  blocks integer not null default 0,
  recoveries integer not null default 0,
  dispossessions integer not null default 0,
  dribbles_attempted integer not null default 0,
  dribbles_completed integer not null default 0,
  fouls_committed integer not null default 0,
  offsides integer not null default 0,
  passes_attempted integer not null default 0,
  duels_won integer not null default 0,
  aerials_won integer not null default 0,
  own_goals integer not null default 0,
  match_id text,
  source_event_id text,
  source_id uuid references public.sources(id) on delete set null,
  confidence text not null default 'verified',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider, external_match_id, external_player_id)
);

alter table public.provider_player_mappings enable row level security;
alter table public.player_match_stats enable row level security;


-- Phase 4 milestone 4 — official profile & organization verification.
create table if not exists public.official_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  player_id uuid references public.players(id) on delete cascade,
  club_id uuid references public.clubs(id) on delete cascade,
  agency_name text,
  verification_type text not null check (verification_type in ('player','agent','agency','club')),
  status text not null default 'pending' check (status in ('pending','verified','rejected','revoked')),
  verification_method text,
  evidence_url text,
  source_id uuid references public.sources(id) on delete set null,
  notes text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.official_verification_reviews (
  id uuid primary key default gen_random_uuid(),
  verification_id uuid not null references public.official_verifications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id) on delete cascade,
  action text not null check (action in ('approved','rejected','revoked','needs_evidence')),
  status_before text,
  status_after text,
  verification_method text,
  evidence_url text,
  source_id uuid references public.sources(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.official_verification_public (
  verification_id uuid primary key references public.official_verifications(id) on delete cascade,
  player_id uuid references public.players(id) on delete cascade,
  club_id uuid references public.clubs(id) on delete cascade,
  agency_name text,
  verification_type text not null,
  status text not null,
  verification_method text,
  evidence_url text,
  source_id uuid references public.sources(id) on delete set null,
  verified_at timestamptz,
  updated_at timestamptz not null default now()
);

-- The live database also contains submit_official_verification_request and review_official_verification RPCs.


-- ============================================================
-- Phase 6 — Milestone 2: International Player & Club Coverage
-- Global coverage and reusable entity-import framework.
-- ============================================================

create table if not exists public.competition_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  country text,
  region text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.competitions
  add column if not exists competition_group_id uuid
  references public.competition_groups(id) on delete set null;

create index if not exists idx_competitions_group
  on public.competitions(competition_group_id);

create table if not exists public.provider_club_mappings (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  external_club_id text not null,
  club_id uuid not null references public.clubs(id) on delete cascade,
  external_name text,
  confidence text not null default 'verified',
  source_id uuid references public.sources(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  unique(provider, external_club_id)
);

create index if not exists idx_provider_club_mappings_club
  on public.provider_club_mappings(club_id);

create table if not exists public.entity_import_queue (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  entity_type text not null check (entity_type in ('player','club')),
  external_id text not null,
  external_name text,
  country text,
  competition_id uuid references public.competitions(id) on delete set null,
  season_id uuid references public.seasons(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending','matched','ready','imported','rejected','needs_review')),
  matched_player_id uuid references public.players(id) on delete set null,
  matched_club_id uuid references public.clubs(id) on delete set null,
  source_id uuid references public.sources(id) on delete set null,
  import_batch_id uuid,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider, entity_type, external_id)
);

create index if not exists idx_entity_import_queue_status
  on public.entity_import_queue(status, created_at);

create index if not exists idx_entity_import_queue_competition
  on public.entity_import_queue(competition_id, season_id);

create table if not exists public.global_coverage_targets (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  priority integer not null default 3 check (priority between 1 and 5),
  status text not null default 'planned'
    check (status in ('planned','in_progress','covered','paused')),
  preferred_provider text,
  target_player_coverage integer,
  target_club_coverage integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(competition_id)
);

create or replace view public.global_coverage_summary
with (security_invoker = true)
as
select
  c.id as competition_id,
  c.canonical_name as competition,
  c.country,
  c.competition_type,
  c.level_label,
  c.active,
  cg.name as competition_group,
  cg.region,
  coalesce(cs.season_count,0)::integer as season_count,
  coalesce(cc.club_count,0)::integer as club_count,
  coalesce(pc.player_count,0)::integer as player_count,
  coalesce(pp.provider_count,0)::integer as provider_count,
  coalesce(t.status,'planned') as coverage_status,
  t.priority,
  t.preferred_provider
from public.competitions c
left join public.competition_groups cg on cg.id = c.competition_group_id
left join (
  select competition_id, count(*) season_count
  from public.competition_seasons
  group by competition_id
) cs on cs.competition_id = c.id
left join (
  select cs2.competition_id, count(distinct cc.club_id) club_count
  from public.club_competitions cc
  join public.competition_seasons cs2 on cs2.id = cc.competition_season_id
  group by cs2.competition_id
) cc on cc.competition_id = c.id
left join (
  select cs2.competition_id, count(distinct pc2.player_id) player_count
  from public.player_competitions pc2
  join public.club_competitions cc2 on cc2.id = pc2.club_competition_id
  join public.competition_seasons cs2 on cs2.id = cc2.competition_season_id
  group by cs2.competition_id
) pc on pc.competition_id = c.id
left join (
  select cs2.competition_id, count(distinct ppm.provider)::integer provider_count
  from public.player_stats ps
  join public.competition_seasons cs2 on cs2.id = ps.competition_season_id
  join public.provider_player_mappings ppm on ppm.player_id = ps.player_id
  group by cs2.competition_id
) pp on pp.competition_id = c.id
left join public.global_coverage_targets t on t.competition_id = c.id;

create or replace view public.global_country_coverage
with (security_invoker = true)
as
select
  cg.id as competition_group_id,
  cg.name as country,
  cg.region,
  count(distinct c.id)::integer as competition_count,
  count(distinct case when c.active then c.id end)::integer as active_competition_count,
  coalesce(sum(gcs.club_count),0)::integer as club_count,
  coalesce(sum(gcs.player_count),0)::integer as player_count
from public.competition_groups cg
left join public.competitions c on c.competition_group_id = cg.id
left join public.global_coverage_summary gcs on gcs.competition_id = c.id
group by cg.id, cg.name, cg.region;

-- Public read-only coverage views; import/mapping tables remain admin-controlled.
grant select on public.competition_groups to anon, authenticated;
grant select on public.global_coverage_summary to anon, authenticated;
grant select on public.global_country_coverage to anon, authenticated;

alter table public.competition_groups enable row level security;
alter table public.provider_club_mappings enable row level security;
alter table public.entity_import_queue enable row level security;
alter table public.global_coverage_targets enable row level security;

drop policy if exists "Public can read competition groups" on public.competition_groups;
create policy "Public can read competition groups"
on public.competition_groups for select
to anon, authenticated using (true);

drop policy if exists "WFM admins can manage provider club mappings" on public.provider_club_mappings;
create policy "WFM admins can manage provider club mappings"
on public.provider_club_mappings for all
to authenticated
using (exists (select 1 from public.wfm_admins a where a.user_id=(select auth.uid())))
with check (exists (select 1 from public.wfm_admins a where a.user_id=(select auth.uid())));

drop policy if exists "WFM admins can manage entity import queue" on public.entity_import_queue;
create policy "WFM admins can manage entity import queue"
on public.entity_import_queue for all
to authenticated
using (exists (select 1 from public.wfm_admins a where a.user_id=(select auth.uid())))
with check (exists (select 1 from public.wfm_admins a where a.user_id=(select auth.uid())));

drop policy if exists "WFM admins can manage global coverage targets" on public.global_coverage_targets;
create policy "WFM admins can manage global coverage targets"
on public.global_coverage_targets for all
to authenticated
using (exists (select 1 from public.wfm_admins a where a.user_id=(select auth.uid())))
with check (exists (select 1 from public.wfm_admins a where a.user_id=(select auth.uid())));


-- ============================================================
-- Phase 6 — Milestone 3: Global Contract & Salary Coverage
-- ============================================================

create table if not exists public.salary_exchange_rates (
  id uuid primary key default gen_random_uuid(),
  currency text not null,
  rate_date date not null,
  usd_per_unit numeric not null check (usd_per_unit > 0),
  source_id uuid references public.sources(id) on delete set null,
  source_name text,
  created_at timestamptz not null default now(),
  unique(currency, rate_date)
);

alter table public.salary_records
  add column if not exists competition_season_id uuid references public.competition_seasons(id) on delete set null,
  add column if not exists annual_salary_usd numeric,
  add column if not exists weekly_salary_usd numeric,
  add column if not exists exchange_rate_to_usd numeric,
  add column if not exists conversion_date date;

create index if not exists idx_salary_records_competition_season on public.salary_records(competition_season_id);

create table if not exists public.contract_competitions (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  competition_season_id uuid not null references public.competition_seasons(id) on delete cascade,
  source_id uuid references public.sources(id) on delete set null,
  confidence text not null default 'unknown'
    check (confidence in ('verified','reported','estimated','rumored','unknown')),
  created_at timestamptz not null default now(),
  unique(contract_id, competition_season_id)
);

create index if not exists idx_contract_competitions_contract on public.contract_competitions(contract_id);
create index if not exists idx_contract_competitions_competition_season on public.contract_competitions(competition_season_id);

create table if not exists public.global_salary_coverage_targets (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  priority integer not null default 3 check (priority between 1 and 5),
  status text not null default 'planned'
    check (status in ('planned','in_progress','covered','paused')),
  target_salary_records integer,
  target_salary_coverage_percent numeric check (target_salary_coverage_percent between 0 and 100),
  preferred_source text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(competition_id)
);

create or replace view public.global_salary_coverage_summary
with (security_invoker=true)
as
select c.id competition_id,c.canonical_name competition,c.country,c.competition_type,cg.region,
coalesce(sr.salary_record_count,0)::integer salary_record_count,
coalesce(sr.players_with_salary,0)::integer players_with_salary,
coalesce(sr.usd_converted_count,0)::integer usd_converted_count,
coalesce(ct.status,'planned') salary_coverage_status,ct.priority,ct.preferred_source
from public.competitions c
left join public.competition_groups cg on cg.id=c.competition_group_id
left join (
  select cs.competition_id,count(distinct sr.id) salary_record_count,
  count(distinct sr.player_id) players_with_salary,
  count(*) filter(where sr.annual_salary_usd is not null or sr.weekly_salary_usd is not null) usd_converted_count
  from public.salary_records sr join public.competition_seasons cs on cs.id=sr.competition_season_id
  group by cs.competition_id
) sr on sr.competition_id=c.id
left join public.global_salary_coverage_targets ct on ct.competition_id=c.id;

create or replace view public.global_contract_coverage_summary
with (security_invoker=true)
as
select c.id competition_id,c.canonical_name competition,c.country,cg.region,
count(distinct cc.contract_id)::integer contract_count,
count(distinct ct.player_id)::integer players_with_contracts,
count(distinct case when ct.annual_salary_usd is not null or ct.weekly_salary_usd is not null then ct.id end)::integer contracts_with_usd_salary
from public.competitions c
left join public.competition_groups cg on cg.id=c.competition_group_id
left join public.competition_seasons cs on cs.competition_id=c.id
left join public.contract_competitions cc on cc.competition_season_id=cs.id
left join public.contracts ct on ct.id=cc.contract_id
group by c.id,c.canonical_name,c.country,cg.region;

alter table public.salary_exchange_rates enable row level security;
alter table public.contract_competitions enable row level security;
alter table public.global_salary_coverage_targets enable row level security;

drop policy if exists "Public can read salary exchange rates" on public.salary_exchange_rates;
create policy "Public can read salary exchange rates" on public.salary_exchange_rates for select to anon,authenticated using(true);

drop policy if exists "WFM admins can manage salary exchange rates" on public.salary_exchange_rates;
create policy "WFM admins can manage salary exchange rates" on public.salary_exchange_rates for all to authenticated
using(exists(select 1 from public.wfm_admins a where a.user_id=(select auth.uid())))
with check(exists(select 1 from public.wfm_admins a where a.user_id=(select auth.uid())));

drop policy if exists "WFM admins can manage contract competitions" on public.contract_competitions;
create policy "WFM admins can manage contract competitions" on public.contract_competitions for all to authenticated
using(exists(select 1 from public.wfm_admins a where a.user_id=(select auth.uid())))
with check(exists(select 1 from public.wfm_admins a where a.user_id=(select auth.uid())));

drop policy if exists "WFM admins can manage salary coverage targets" on public.global_salary_coverage_targets;
create policy "WFM admins can manage salary coverage targets" on public.global_salary_coverage_targets for all to authenticated
using(exists(select 1 from public.wfm_admins a where a.user_id=(select auth.uid())))
with check(exists(select 1 from public.wfm_admins a where a.user_id=(select auth.uid())));

grant select on public.global_salary_coverage_summary to anon,authenticated;
grant select on public.global_contract_coverage_summary to anon,authenticated;
grant select on public.salary_exchange_rates to anon,authenticated;

create or replace view public.player_salary_history
with (security_invoker=true)
as
select sr.id,sr.player_id,p.full_name,sr.season,sr.competition_season_id,
comp.canonical_name competition,sr.annual_salary,sr.weekly_salary,sr.currency,
sr.annual_salary_usd,sr.weekly_salary_usd,sr.exchange_rate_to_usd,sr.conversion_date,
sr.confidence,sr.source_id
from public.salary_records sr
join public.players p on p.id=sr.player_id
left join public.competition_seasons cs on cs.id=sr.competition_season_id
left join public.competitions comp on comp.id=cs.competition_id;

grant select on public.player_salary_history to anon,authenticated;


-- ============================================================
-- Phase 6 — Milestone 4: Global Transfer & Market-Value Coverage
-- ============================================================

alter table public.market_values
  add column if not exists competition_season_id uuid
  references public.competition_seasons(id) on delete set null;

create index if not exists idx_market_values_competition_season
  on public.market_values(competition_season_id);

create index if not exists idx_market_values_player_date
  on public.market_values(player_id, valuation_date desc);

create table if not exists public.transfer_competitions (
  id uuid primary key default gen_random_uuid(),
  transfer_id uuid not null references public.transfers(id) on delete cascade,
  competition_season_id uuid not null references public.competition_seasons(id) on delete cascade,
  club_role text not null check (club_role in ('from','to')),
  source_id uuid references public.sources(id) on delete set null,
  confidence text not null default 'unknown'
    check (confidence in ('verified','reported','estimated','rumored','unknown')),
  created_at timestamptz not null default now(),
  unique(transfer_id, competition_season_id, club_role)
);

create index if not exists idx_transfer_competitions_transfer
  on public.transfer_competitions(transfer_id);

create index if not exists idx_transfer_competitions_competition_season
  on public.transfer_competitions(competition_season_id);

create index if not exists idx_transfer_competitions_role
  on public.transfer_competitions(club_role);

create table if not exists public.global_transfer_coverage_targets (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  priority integer not null default 3 check (priority between 1 and 5),
  status text not null default 'planned'
    check (status in ('planned','in_progress','covered','paused')),
  target_transfer_records integer,
  target_transfer_coverage_percent numeric
    check (target_transfer_coverage_percent between 0 and 100),
  preferred_source text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(competition_id)
);

create table if not exists public.global_market_value_coverage_targets (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  priority integer not null default 3 check (priority between 1 and 5),
  status text not null default 'planned'
    check (status in ('planned','in_progress','covered','paused')),
  target_market_value_records integer,
  target_market_value_coverage_percent numeric
    check (target_market_value_coverage_percent between 0 and 100),
  preferred_source text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(competition_id)
);

create or replace view public.global_transfer_coverage_summary
with (security_invoker=true)
as
select
  c.id as competition_id,
  c.canonical_name as competition,
  coalesce(x.transfer_count,0) as transfer_count,
  coalesce(x.transfer_player_count,0) as transfer_player_count,
  x.latest_transfer_date,
  gt.priority,
  gt.status,
  gt.target_transfer_records,
  gt.target_transfer_coverage_percent,
  gt.preferred_source
from public.competitions c
left join (
  select
    cs.competition_id,
    count(distinct tc.transfer_id) as transfer_count,
    count(distinct tr.player_id) as transfer_player_count,
    max(tr.transfer_date) as latest_transfer_date
  from public.transfer_competitions tc
  join public.competition_seasons cs on cs.id=tc.competition_season_id
  join public.transfers tr on tr.id=tc.transfer_id
  group by cs.competition_id
) x on x.competition_id=c.id
left join public.global_transfer_coverage_targets gt
  on gt.competition_id=c.id;

create or replace view public.global_market_value_coverage_summary
with (security_invoker=true)
as
select
  c.id as competition_id,
  c.canonical_name as competition,
  coalesce(x.market_value_count,0) as market_value_count,
  coalesce(x.market_value_player_count,0) as market_value_player_count,
  x.latest_valuation_date,
  gt.priority,
  gt.status,
  gt.target_market_value_records,
  gt.target_market_value_coverage_percent,
  gt.preferred_source
from public.competitions c
left join (
  select
    cs.competition_id,
    count(mv.id) as market_value_count,
    count(distinct mv.player_id) as market_value_player_count,
    max(mv.valuation_date) as latest_valuation_date
  from public.market_values mv
  join public.competition_seasons cs on cs.id=mv.competition_season_id
  group by cs.competition_id
) x on x.competition_id=c.id
left join public.global_market_value_coverage_targets gt
  on gt.competition_id=c.id;

alter table public.transfer_competitions enable row level security;
alter table public.global_transfer_coverage_targets enable row level security;
alter table public.global_market_value_coverage_targets enable row level security;

drop policy if exists "Public can read transfer competitions" on public.transfer_competitions;
create policy "Public can read transfer competitions"
on public.transfer_competitions for select
to anon, authenticated
using (true);

drop policy if exists "WFM admins can manage transfer competitions" on public.transfer_competitions;
create policy "WFM admins can manage transfer competitions"
on public.transfer_competitions for all
to authenticated
using (exists (select 1 from public.wfm_admins a where a.user_id=(select auth.uid())))
with check (exists (select 1 from public.wfm_admins a where a.user_id=(select auth.uid())));

drop policy if exists "WFM admins can manage global transfer coverage targets" on public.global_transfer_coverage_targets;
create policy "WFM admins can manage global transfer coverage targets"
on public.global_transfer_coverage_targets for all
to authenticated
using (exists (select 1 from public.wfm_admins a where a.user_id=(select auth.uid())))
with check (exists (select 1 from public.wfm_admins a where a.user_id=(select auth.uid())));

drop policy if exists "WFM admins can manage global market value coverage targets" on public.global_market_value_coverage_targets;
create policy "WFM admins can manage global market value coverage targets"
on public.global_market_value_coverage_targets for all
to authenticated
using (exists (select 1 from public.wfm_admins a where a.user_id=(select auth.uid())))
with check (exists (select 1 from public.wfm_admins a where a.user_id=(select auth.uid())));

grant select on public.global_transfer_coverage_summary to anon, authenticated;
grant select on public.global_market_value_coverage_summary to anon, authenticated;


-- ============================================================
-- Phase 6 — Milestone 5: Multi-League Intelligence
-- ============================================================

create or replace view public.player_global_peer_benchmarks
with (security_invoker=true)
as
with eligible as (
  select *
  from public.player_season_intelligence
  where minutes >= 450 and season is not null and position is not null and league is not null
),
ranked as (
  select e.*,
    count(*) over (partition by e.season,e.position) as peer_count_global,
    percent_rank() over (partition by e.season,e.position order by e.goals_per90) as goals_per90_global_percentile,
    percent_rank() over (partition by e.season,e.position order by e.assists_per90) as assists_per90_global_percentile,
    percent_rank() over (partition by e.season,e.position order by e.xg_per90) as xg_per90_global_percentile,
    percent_rank() over (partition by e.season,e.position order by e.xa_per90) as xa_per90_global_percentile,
    percent_rank() over (partition by e.season,e.position order by e.chances_created_per90) as chances_created_per90_global_percentile,
    percent_rank() over (partition by e.season,e.position order by e.key_passes_per90) as key_passes_per90_global_percentile,
    percent_rank() over (partition by e.season,e.position order by e.tackles_per90) as tackles_per90_global_percentile,
    percent_rank() over (partition by e.season,e.position order by e.interceptions_per90) as interceptions_per90_global_percentile,
    percent_rank() over (partition by e.season,e.position order by e.progressive_carries_per90) as progressive_carries_per90_global_percentile,
    percent_rank() over (partition by e.season,e.position order by e.duels_won_per90) as duels_won_per90_global_percentile
  from eligible e
)
select * from ranked where peer_count_global >= 5;

create or replace view public.competition_stat_context
with (security_invoker=true)
as
select psi.season,psi.league as competition,psi.position,count(*) as player_count,sum(psi.minutes) as total_minutes,
 avg(psi.goals_per90) as avg_goals_per90,avg(psi.assists_per90) as avg_assists_per90,
 avg(psi.xg_per90) as avg_xg_per90,avg(psi.xa_per90) as avg_xa_per90,
 avg(psi.chances_created_per90) as avg_chances_created_per90,avg(psi.key_passes_per90) as avg_key_passes_per90,
 avg(psi.tackles_per90) as avg_tackles_per90,avg(psi.interceptions_per90) as avg_interceptions_per90,
 avg(psi.progressive_carries_per90) as avg_progressive_carries_per90,avg(psi.duels_won_per90) as avg_duels_won_per90
from public.player_season_intelligence psi
where psi.minutes >= 450 and psi.season is not null and psi.league is not null and psi.position is not null
group by psi.season,psi.league,psi.position;

grant select on public.player_global_peer_benchmarks to anon, authenticated;
grant select on public.competition_stat_context to anon, authenticated;


-- ============================================================
-- Phase 6 — Milestone 6: Global Scouting Network
-- ============================================================

create table if not exists public.scouting_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  club_id uuid references public.clubs(id) on delete set null,
  name text not null,
  description text,
  status text not null default 'active' check (status in ('active','archived')),
  criteria jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.scouting_profiles enable row level security;
grant select, insert, update, delete on public.scouting_profiles to authenticated;
create index if not exists scouting_profiles_user_id_idx on public.scouting_profiles(user_id);
create index if not exists scouting_profiles_club_id_idx on public.scouting_profiles(club_id);
create index if not exists scouting_profiles_status_idx on public.scouting_profiles(status);

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='scouting_profiles' and policyname='Users can view own scouting profiles') then
    create policy "Users can view own scouting profiles" on public.scouting_profiles for select to authenticated using ((select auth.uid()) = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='scouting_profiles' and policyname='Users can create own scouting profiles') then
    create policy "Users can create own scouting profiles" on public.scouting_profiles for insert to authenticated with check ((select auth.uid()) = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='scouting_profiles' and policyname='Users can update own scouting profiles') then
    create policy "Users can update own scouting profiles" on public.scouting_profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='scouting_profiles' and policyname='Users can delete own scouting profiles') then
    create policy "Users can delete own scouting profiles" on public.scouting_profiles for delete to authenticated using ((select auth.uid()) = user_id);
  end if;
end $$;


-- Phase 6 Milestone 6: persistent scouting recruitment pipeline
create table if not exists public.scouting_pipeline (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  list_player_id uuid not null unique references public.scouting_list_players(id) on delete cascade,
  stage text not null default 'shortlist' check (stage in ('shortlist','watching','evaluating','contact','negotiating','signed','passed')),
  priority text not null default 'normal' check (priority in ('low','normal','high')),
  fit_status text not null default 'unassessed' check (fit_status in ('unassessed','strong_fit','possible_fit','not_a_fit')),
  next_action text, target_date date, evaluation text, updated_at timestamptz not null default now(), created_at timestamptz not null default now()
);
create index if not exists scouting_pipeline_user_id_idx on public.scouting_pipeline(user_id);
create index if not exists scouting_pipeline_stage_idx on public.scouting_pipeline(stage);
alter table public.scouting_pipeline enable row level security;
grant select, insert, update, delete on public.scouting_pipeline to authenticated;
create policy "Users can view own scouting pipeline" on public.scouting_pipeline for select to authenticated using ((select auth.uid())=user_id);
create policy "Users can create own scouting pipeline" on public.scouting_pipeline for insert to authenticated with check ((select auth.uid())=user_id and exists(select 1 from public.scouting_list_players lp join public.scouting_lists l on l.id=lp.list_id where lp.id=list_player_id and l.user_id=(select auth.uid())));
create policy "Users can update own scouting pipeline" on public.scouting_pipeline for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "Users can delete own scouting pipeline" on public.scouting_pipeline for delete to authenticated using ((select auth.uid())=user_id);
