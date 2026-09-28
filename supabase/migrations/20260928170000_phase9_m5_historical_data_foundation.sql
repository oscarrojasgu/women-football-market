create table if not exists public.wfm_player_history_snapshots (
 id uuid primary key default gen_random_uuid(),
 player_id uuid not null references public.players(id) on delete cascade,
 competition_season_id uuid references public.competition_seasons(id) on delete set null,
 club_id uuid references public.clubs(id) on delete set null,
 source_id uuid references public.sources(id) on delete set null,
 source_type text not null default 'import' check (source_type in ('manual','csv','api','provider','import','migration')),
 snapshot_type text not null default 'career' check (snapshot_type in ('career','roster','contract','stats','valuation','salary')),
 status text not null default 'draft' check (status in ('draft','validated','published','superseded')),
 source_record_key text,
 observed_at date,
 season_label text,
 payload jsonb not null default '{}'::jsonb,
 confidence text not null default 'unknown' check (confidence in ('verified','reported','estimated','rumored','unknown')),
 notes text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create unique index if not exists uq_wfm_player_history_snapshot
 on public.wfm_player_history_snapshots(player_id, snapshot_type, coalesce(competition_season_id,'00000000-0000-0000-0000-000000000000'::uuid), coalesce(club_id,'00000000-0000-0000-0000-000000000000'::uuid), coalesce(observed_at,'0001-01-01'::date), coalesce(source_record_key,''));

create index if not exists idx_wfm_player_history_player_season
 on public.wfm_player_history_snapshots(player_id, competition_season_id);
create index if not exists idx_wfm_player_history_season_club
 on public.wfm_player_history_snapshots(competition_season_id, club_id);
create index if not exists idx_wfm_player_history_status
 on public.wfm_player_history_snapshots(status, snapshot_type);

alter table public.wfm_player_history_snapshots enable row level security;

drop policy if exists "wfm history admin select" on public.wfm_player_history_snapshots;
create policy "wfm history admin select" on public.wfm_player_history_snapshots for select to authenticated using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "wfm history admin insert" on public.wfm_player_history_snapshots;
create policy "wfm history admin insert" on public.wfm_player_history_snapshots for insert to authenticated with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "wfm history admin update" on public.wfm_player_history_snapshots;
create policy "wfm history admin update" on public.wfm_player_history_snapshots for update to authenticated using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin') with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "wfm history admin delete" on public.wfm_player_history_snapshots;
create policy "wfm history admin delete" on public.wfm_player_history_snapshots for delete to authenticated using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create or replace function public.wfm_historical_data_coverage()
returns table (
 player_id uuid, player_name text, seasons_count bigint, clubs_count bigint,
 transfers_count bigint, contracts_count bigint, market_values_count bigint,
 salary_records_count bigint, stats_count bigint, history_snapshots_count bigint,
 earliest_transfer date, latest_transfer date, earliest_market_value date, latest_market_value date
)
language sql security definer set search_path = public
as $$
 select p.id,p.full_name,
 (select count(distinct pc.club_competition_id) from player_competitions pc where pc.player_id=p.id),
 (select count(distinct cc.club_id) from player_competitions pc join club_competitions cc on cc.id=pc.club_competition_id where pc.player_id=p.id),
 (select count(*) from transfers t where t.player_id=p.id),
 (select count(*) from contracts c where c.player_id=p.id),
 (select count(*) from market_values mv where mv.player_id=p.id),
 (select count(*) from salary_records sr where sr.player_id=p.id),
 (select count(*) from player_stats ps where ps.player_id=p.id),
 (select count(*) from wfm_player_history_snapshots hs where hs.player_id=p.id),
 (select min(t.transfer_date) from transfers t where t.player_id=p.id),
 (select max(t.transfer_date) from transfers t where t.player_id=p.id),
 (select min(mv.valuation_date) from market_values mv where mv.player_id=p.id),
 (select max(mv.valuation_date) from market_values mv where mv.player_id=p.id)
 from players p order by p.full_name;
$$;

revoke all on function public.wfm_historical_data_coverage() from public;
grant execute on function public.wfm_historical_data_coverage() to authenticated;
