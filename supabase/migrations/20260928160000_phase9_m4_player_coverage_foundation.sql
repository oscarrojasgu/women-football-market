create or replace function public.wfm_reconcile_player_coverage()
returns table(
  competition_id uuid, competition_name text, country text, priority integer, target_players integer,
  current_players bigint, identity_complete bigint, provider_mapped bigint, contract_complete bigint,
  salary_complete bigint, market_value_complete bigint, stats_complete bigint, fully_profiled bigint
)
language sql
security definer
set search_path = public
as $$
  select wc.competition_id,wc.competition_name,coalesce(wc.country,''),wc.priority,wc.target_players,
    count(distinct pc.player_id),
    count(distinct pc.player_id) filter (where p.full_name is not null and p.date_of_birth is not null and p.nationality is not null and p.position is not null),
    count(distinct pc.player_id) filter (where ppm.player_id is not null),
    count(distinct pc.player_id) filter (where c.player_id is not null),
    count(distinct pc.player_id) filter (where sr.player_id is not null),
    count(distinct pc.player_id) filter (where mv.player_id is not null),
    count(distinct pc.player_id) filter (where ps.player_id is not null),
    count(distinct pc.player_id) filter (where p.full_name is not null and p.date_of_birth is not null and p.nationality is not null and p.position is not null and ppm.player_id is not null and (c.player_id is not null or sr.player_id is not null or mv.player_id is not null or ps.player_id is not null))
  from public.wfm_competition_coverage wc
  left join public.competition_seasons cs on cs.competition_id=wc.competition_id
  left join public.club_competitions cc on cc.competition_season_id=cs.id
  left join public.player_competitions pc on pc.club_competition_id=cc.id
  left join public.players p on p.id=pc.player_id
  left join lateral (select ppm.player_id from public.provider_player_mappings ppm where ppm.player_id=pc.player_id limit 1) ppm on true
  left join lateral (select c.player_id from public.contracts c where c.player_id=pc.player_id and (cs.id is null or exists (select 1 from public.contract_competitions ccomp where ccomp.contract_id=c.id and ccomp.competition_season_id=cs.id) or c.status='active') limit 1) c on true
  left join lateral (select sr.player_id from public.salary_records sr where sr.player_id=pc.player_id and (cs.id is null or sr.competition_season_id=cs.id) limit 1) sr on true
  left join lateral (select mv.player_id from public.market_values mv where mv.player_id=pc.player_id and (cs.id is null or mv.competition_season_id=cs.id) limit 1) mv on true
  left join lateral (select ps.player_id from public.player_stats ps where ps.player_id=pc.player_id and lower(coalesce(ps.competition,''))=lower(coalesce(wc.competition_name,'')) limit 1) ps on true
  group by wc.competition_id,wc.competition_name,wc.country,wc.priority,wc.target_players;
$$;
revoke all on function public.wfm_reconcile_player_coverage() from public;
grant execute on function public.wfm_reconcile_player_coverage() to authenticated;

insert into public.competition_seasons (competition_id,season_id,active)
select c.id,s.id,true
from public.competitions c
join public.seasons s on s.season_key=case
  when c.canonical_name in ('NWSL','Liga MX Femenil','Brasileirão Feminino','Liga Femenina BetPlay DIMAYOR') then '2026'
  when c.canonical_name in ('Liga F','Première Ligue') then '2025-2026'
end
where c.canonical_name in ('Liga F','Liga MX Femenil','Brasileirão Feminino','Liga Femenina BetPlay DIMAYOR','Première Ligue')
and not exists(select 1 from public.competition_seasons x where x.competition_id=c.id and x.season_id=s.id);

insert into public.club_competitions (club_id,competition_season_id)
select cl.id,cs.id
from public.clubs cl
join public.competition_seasons cs on cs.competition_id=cl.competition_id and cs.active=true
where cl.competition_id is not null
and not exists(select 1 from public.club_competitions x where x.club_id=cl.id and x.competition_season_id=cs.id);

create index if not exists idx_player_competitions_club_competition_player on public.player_competitions(club_competition_id,player_id);
create index if not exists idx_club_competitions_season_club on public.club_competitions(competition_season_id,club_id);
