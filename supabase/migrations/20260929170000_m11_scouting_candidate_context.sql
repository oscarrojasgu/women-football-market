create or replace view public.scouting_candidate_context with (security_invoker=true) as
with latest_contract as (
  select distinct on (c.player_id) c.player_id,c.club_id,c.status,c.start_date,c.end_date,c.annual_salary_usd,c.weekly_salary_usd,c.confidence
  from public.contracts c order by c.player_id, case when c.status='active' then 0 else 1 end, c.end_date desc nulls last, c.start_date desc nulls last
), latest_value as (
  select distinct on (m.player_id) m.player_id,m.market_value_usd,m.valuation_date,m.confidence
  from public.market_values m order by m.player_id,m.valuation_date desc nulls last,m.created_at desc
), latest_peer as (
  select distinct on (g.player_id) g.player_id,g.season,g.league,g.position,g.peer_count_global,
    g.goals_per90_global_percentile,g.assists_per90_global_percentile,g.xg_per90_global_percentile,g.xa_per90_global_percentile,
    g.chances_created_per90_global_percentile,g.key_passes_per90_global_percentile,g.tackles_per90_global_percentile,
    g.interceptions_per90_global_percentile,g.progressive_carries_per90_global_percentile,g.duels_won_per90_global_percentile
  from public.player_global_peer_benchmarks g order by g.player_id,g.season desc
)
select p.id player_id,p.full_name,p.date_of_birth,p.nationality,p.position,p.secondary_position,
  case when p.date_of_birth is null then null else extract(year from age(current_date,p.date_of_birth))::int end age_years,
  c.club_id,c.status contract_status,c.start_date contract_start_date,c.end_date contract_end_date,
  case when c.end_date is null then null else greatest(0,(c.end_date-current_date))::int end contract_days_remaining,
  case when c.end_date is null then 'unknown' when c.end_date<current_date then 'expired' when c.end_date<=current_date+180 then 'expiring_180d' else 'under_contract' end availability_context,
  c.annual_salary_usd,c.weekly_salary_usd,c.confidence contract_confidence,
  v.market_value_usd,v.valuation_date,v.confidence market_value_confidence,
  g.season benchmark_season,g.league benchmark_league,g.position benchmark_position,g.peer_count_global,
  g.goals_per90_global_percentile,g.assists_per90_global_percentile,g.xg_per90_global_percentile,g.xa_per90_global_percentile,
  g.chances_created_per90_global_percentile,g.key_passes_per90_global_percentile,g.tackles_per90_global_percentile,
  g.interceptions_per90_global_percentile,g.progressive_carries_per90_global_percentile,g.duels_won_per90_global_percentile
from public.players p left join latest_contract c on c.player_id=p.id left join latest_value v on v.player_id=p.id left join latest_peer g on g.player_id=p.id;