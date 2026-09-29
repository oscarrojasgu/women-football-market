create table if not exists public.wfm_match_fixtures (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'sportmonks',
  external_match_id text not null,
  competition_id uuid references public.competitions(id) on delete set null,
  competition_name text not null,
  season_id uuid references public.seasons(id) on delete set null,
  season_label text,
  home_club_id uuid references public.clubs(id) on delete set null,
  home_team_name text not null,
  away_club_id uuid references public.clubs(id) on delete set null,
  away_team_name text not null,
  kickoff_at timestamptz,
  status text not null default 'scheduled',
  home_score integer,
  away_score integer,
  minute integer,
  venue_name text,
  source_url text,
  source_updated_at timestamptz,
  confidence text not null default 'verified',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider, external_match_id)
);

create index if not exists wfm_match_fixtures_kickoff_idx on public.wfm_match_fixtures(kickoff_at);
create index if not exists wfm_match_fixtures_competition_idx on public.wfm_match_fixtures(competition_id, kickoff_at);
create index if not exists wfm_match_fixtures_status_idx on public.wfm_match_fixtures(status, kickoff_at);

alter table public.wfm_match_fixtures enable row level security;

drop policy if exists "Public can read match fixtures" on public.wfm_match_fixtures;
create policy "Public can read match fixtures" on public.wfm_match_fixtures for select to anon, authenticated using (true);

drop policy if exists "WFM admins manage match fixtures" on public.wfm_match_fixtures;
create policy "WFM admins manage match fixtures" on public.wfm_match_fixtures for all to authenticated using ((select private.is_wfm_admin())) with check ((select private.is_wfm_admin()));

create or replace function public.wfm_match_fixtures_set_updated_at()
returns trigger language plpgsql set search_path = public as $
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists wfm_match_fixtures_updated_at on public.wfm_match_fixtures;
create trigger wfm_match_fixtures_updated_at before update on public.wfm_match_fixtures
for each row execute function public.wfm_match_fixtures_set_updated_at();

create table if not exists public.wfm_match_competitions (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'sportmonks',
  external_league_id text not null,
  competition_id uuid references public.competitions(id) on delete set null,
  competition_name text not null,
  country text,
  active boolean not null default true,
  priority integer not null default 50 check (priority between 1 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider, external_league_id)
);

create index if not exists wfm_match_competitions_active_idx on public.wfm_match_competitions(active, priority);
alter table public.wfm_match_competitions enable row level security;

drop policy if exists "WFM admins manage match competitions" on public.wfm_match_competitions;
create policy "WFM admins manage match competitions" on public.wfm_match_competitions for all to authenticated using ((select private.is_wfm_admin())) with check ((select private.is_wfm_admin()));

drop trigger if exists wfm_match_competitions_updated_at on public.wfm_match_competitions;
create trigger wfm_match_competitions_updated_at before update on public.wfm_match_competitions
for each row execute function public.wfm_match_fixtures_set_updated_at();
