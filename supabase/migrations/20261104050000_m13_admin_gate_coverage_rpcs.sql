-- Phase 13: enforce admin authorization inside coverage RPCs.
-- These functions run as SECURITY DEFINER and are called only by WFM admin screens.
-- Client-side admin checks are not an authorization boundary.

create or replace function public.wfm_historical_data_coverage()
returns table (
  player_id uuid, player_name text, seasons_count bigint, clubs_count bigint,
  transfers_count bigint, contracts_count bigint, market_values_count bigint,
  salary_records_count bigint, stats_count bigint, history_snapshots_count bigint,
  earliest_transfer date, latest_transfer date, earliest_market_value date, latest_market_value date
)
language sql security definer
set search_path = public, private, pg_temp
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
  from players p
  where private.is_wfm_admin()
  order by p.full_name;
$$;

create or replace function public.wfm_reconcile_historical_player_coverage()
returns table (
  competition_season_id uuid, competition_id uuid, competition_name text,
  season_id uuid, season_key text, roster_players bigint, players_with_stats bigint,
  players_with_contracts bigint, players_with_salary bigint, players_with_market_value bigint,
  players_with_transfers bigint, fully_historic bigint
)
language sql security definer
set search_path = public, private, pg_temp
as $$
  select cs.id,c.id,c.canonical_name,s.id,s.season_key,
    count(distinct pc.player_id),
    count(distinct ps.player_id),
    count(distinct case when con.id is not null then pc.player_id end),
    count(distinct case when sr.id is not null then pc.player_id end),
    count(distinct case when mv.id is not null then pc.player_id end),
    count(distinct case when tr.id is not null then pc.player_id end),
    count(distinct case when ps.player_id is not null and con.id is not null and sr.id is not null and mv.id is not null then pc.player_id end)
  from competition_seasons cs
  join competitions c on c.id=cs.competition_id
  join seasons s on s.id=cs.season_id
  left join club_competitions cc on cc.competition_season_id=cs.id
  left join player_competitions pc on pc.club_competition_id=cc.id
  left join player_stats ps on ps.player_id=pc.player_id and ps.competition_season_id=cs.id
  left join contract_competitions ccx on ccx.competition_season_id=cs.id
  left join contracts con on con.id=ccx.contract_id and con.player_id=pc.player_id
  left join salary_records sr on sr.player_id=pc.player_id and sr.competition_season_id=cs.id
  left join market_values mv on mv.player_id=pc.player_id and mv.competition_season_id=cs.id
  left join transfer_competitions tc on tc.competition_season_id=cs.id
  left join transfers tr on tr.id=tc.transfer_id and tr.player_id=pc.player_id
  where private.is_wfm_admin()
  group by cs.id,c.id,c.canonical_name,s.id,s.season_key
  order by s.season_key desc,c.canonical_name;
$$;

create or replace function public.wfm_reconcile_player_coverage()
returns table (
  competition_id uuid, competition_name text, country text, priority integer,
  target_players integer, current_players bigint, identity_complete bigint,
  provider_mapped bigint, contract_complete bigint, salary_complete bigint,
  market_value_complete bigint, stats_complete bigint, fully_profiled bigint
)
language sql security definer
set search_path = public, private, pg_temp
as $$
  select
    wc.competition_id,wc.competition_name,coalesce(wc.country,''),wc.priority,wc.target_players,
    count(distinct pc.player_id) as current_players,
    count(distinct pc.player_id) filter (
      where p.full_name is not null and p.date_of_birth is not null
        and p.nationality is not null and p.position is not null
    ) as identity_complete,
    count(distinct pc.player_id) filter (where ppm.player_id is not null) as provider_mapped,
    count(distinct pc.player_id) filter (where c.player_id is not null) as contract_complete,
    count(distinct pc.player_id) filter (where sr.player_id is not null) as salary_complete,
    count(distinct pc.player_id) filter (where mv.player_id is not null) as market_value_complete,
    count(distinct pc.player_id) filter (where ps.player_id is not null) as stats_complete,
    count(distinct pc.player_id) filter (
      where p.full_name is not null and p.date_of_birth is not null
        and p.nationality is not null and p.position is not null
        and ppm.player_id is not null
        and (c.player_id is not null or sr.player_id is not null or mv.player_id is not null or ps.player_id is not null)
    ) as fully_profiled
  from public.wfm_competition_coverage wc
  left join public.competition_seasons cs on cs.competition_id=wc.competition_id
  left join public.club_competitions cc on cc.competition_season_id=cs.id
  left join public.player_competitions pc on pc.club_competition_id=cc.id
  left join public.players p on p.id=pc.player_id
  left join lateral (select ppm.player_id from public.provider_player_mappings ppm where ppm.player_id=pc.player_id limit 1) ppm on true
  left join lateral (
    select c.player_id from public.contracts c
    where c.player_id=pc.player_id
      and (cs.id is null or exists (
        select 1 from public.contract_competitions ccomp
        where ccomp.contract_id=c.id and ccomp.competition_season_id=cs.id
      ) or c.status='active')
    limit 1
  ) c on true
  left join lateral (
    select sr.player_id from public.salary_records sr
    where sr.player_id=pc.player_id and (cs.id is null or sr.competition_season_id=cs.id)
    limit 1
  ) sr on true
  left join lateral (
    select mv.player_id from public.market_values mv
    where mv.player_id=pc.player_id and (cs.id is null or mv.competition_season_id=cs.id)
    limit 1
  ) mv on true
  left join lateral (
    select ps.player_id from public.player_stats ps
    where ps.player_id=pc.player_id
      and (ps.competition=wc.competition_name or lower(coalesce(ps.competition,''))=lower(coalesce(wc.competition_name,'')))
    limit 1
  ) ps on true
  where private.is_wfm_admin()
  group by wc.competition_id,wc.competition_name,wc.country,wc.priority,wc.target_players;
$$;
