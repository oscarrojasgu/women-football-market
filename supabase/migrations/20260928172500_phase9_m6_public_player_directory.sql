-- M6 public player directory: paginated, public-safe search surface.
create or replace function public.wfm_public_player_directory(
 p_search text default null,p_position text default null,p_nationality text default null,
 p_competition_id uuid default null,p_season_id uuid default null,p_limit integer default 25,p_offset integer default 0)
returns table(player_id uuid,full_name text,date_of_birth date,nationality text,player_position text,secondary_position text,
 preferred_foot text,agency text,photo_url text,club_name text,competition_name text,season_key text,total_count bigint)
language sql stable security invoker set search_path=public
as $$
with base as (
 select distinct on (p.id) p.id,p.full_name,p.date_of_birth,p.nationality,p.position,p.secondary_position,p.preferred_foot,p.agency,p.photo_url,
 c.name club_name,co.canonical_name competition_name,s.season_key
 from public.players p
 left join public.contracts ct on ct.player_id=p.id and lower(coalesce(ct.status,''))='active'
 left join public.clubs c on c.id=ct.club_id
 left join public.player_competitions pc on pc.player_id=p.id
 left join public.club_competitions cc on cc.id=pc.club_competition_id
 left join public.clubs c2 on c2.id=cc.club_id
 left join public.competition_seasons cs on cs.id=cc.competition_season_id
 left join public.competitions co on co.id=cs.competition_id
 left join public.seasons s on s.id=cs.season_id
 where (p_search is null or btrim(p_search)='' or p.full_name ilike '%'||btrim(p_search)||'%' or coalesce(c.name,c2.name,'') ilike '%'||btrim(p_search)||'%' or coalesce(co.canonical_name,'') ilike '%'||btrim(p_search)||'%' or coalesce(p.nationality,'') ilike '%'||btrim(p_search)||'%' or coalesce(p.agency,'') ilike '%'||btrim(p_search)||'%')
 and (p_position is null or btrim(p_position)='' or lower(coalesce(p.position,''))=lower(btrim(p_position)))
 and (p_nationality is null or btrim(p_nationality)='' or p.nationality=btrim(p_nationality))
 and (p_competition_id is null or co.id=p_competition_id)
 and (p_season_id is null or s.id=p_season_id)
 order by p.id,(lower(coalesce(ct.status,''))='active') desc,s.season_key desc nulls last
), counted as (select base.*,count(*) over() total_count from base)
select id,full_name,date_of_birth,nationality,position,secondary_position,preferred_foot,agency,photo_url,club_name,competition_name,season_key,total_count
from counted order by full_name asc limit greatest(1,least(p_limit,100)) offset greatest(0,p_offset);
$$;
revoke all on function public.wfm_public_player_directory(text,text,text,uuid,uuid,integer,integer) from public,anon,authenticated;
grant execute on function public.wfm_public_player_directory(text,text,text,uuid,uuid,integer,integer) to anon,authenticated;
