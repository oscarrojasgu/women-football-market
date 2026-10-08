create or replace view public.player_current_clubs
with (security_invoker = true)
as
with current_contract as (
  select distinct on (player_id)
    player_id,
    club_id,
    start_date as current_since,
    'contract'::text as resolution_source
  from public.contracts
  where lower(status) = 'active'
     or (
       start_date is not null
       and start_date <= current_date
       and (end_date is null or end_date >= current_date)
     )
  order by
    player_id,
    case when lower(status) = 'active' then 0 else 1 end,
    start_date desc nulls last,
    created_at desc nulls last
),
latest_transfer as (
  select distinct on (player_id)
    player_id,
    to_club_id as club_id,
    transfer_date as current_since,
    'latest transfer'::text as resolution_source
  from public.transfers
  where to_club_id is not null
  order by player_id, transfer_date desc nulls last
),
latest_stat as (
  select distinct on (player_id)
    player_id,
    club_id,
    null::date as current_since,
    'latest club statistics'::text as resolution_source
  from public.player_stats
  where club_id is not null
  order by player_id, season desc nulls last, id desc
),
latest_contract as (
  select distinct on (player_id)
    player_id,
    club_id,
    start_date as current_since,
    'latest contract record'::text as resolution_source
  from public.contracts
  where club_id is not null
  order by player_id, start_date desc nulls last, created_at desc nulls last
),
resolved as (
  select
    p.id as player_id,
    coalesce(cc.club_id, lt.club_id, ls.club_id, lc.club_id) as current_club_id,
    coalesce(cc.current_since, lt.current_since, ls.current_since, lc.current_since) as current_club_since,
    coalesce(cc.resolution_source, lt.resolution_source, ls.resolution_source, lc.resolution_source) as resolution_source
  from public.players p
  left join current_contract cc on cc.player_id = p.id
  left join latest_transfer lt on lt.player_id = p.id
  left join latest_stat ls on ls.player_id = p.id
  left join latest_contract lc on lc.player_id = p.id
)
select
  r.player_id,
  r.current_club_id,
  c.name as current_club_name,
  c.league as current_club_league,
  c.country as current_club_country,
  c.logo_url as current_club_logo_url,
  r.current_club_since,
  r.resolution_source
from resolved r
left join public.clubs c on c.id = r.current_club_id;

grant select on public.player_current_clubs to anon, authenticated;
