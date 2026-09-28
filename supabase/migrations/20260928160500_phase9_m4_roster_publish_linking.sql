create or replace function public.wfm_publish_import_queue_item(p_queue_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  q public.entity_import_queue%rowtype;
  target_player uuid;
  target_club uuid;
  target_competition_season uuid;
  existing_count integer;
  payload_club_name text;
  payload_competition text;
  payload_season text;
  payload_status text;
begin
  if not exists (select 1 from public.wfm_admins where user_id=auth.uid()) then raise exception 'Admin access required'; end if;
  select * into q from public.entity_import_queue where id=p_queue_id for update;
  if not found then raise exception 'Import queue item not found'; end if;
  if q.status<>'ready' then raise exception 'Only ready records can be published'; end if;
  if q.entity_type not in ('player','club') then raise exception 'Unsupported entity type'; end if;
  if nullif(trim(q.external_name),'') is null then raise exception 'Entity name is required'; end if;

  if q.entity_type='player' then
    target_player:=q.matched_player_id;
    if target_player is null then
      select id into target_player from public.players where lower(trim(full_name))=lower(trim(q.external_name)) limit 1;
    end if;
    if target_player is null then
      insert into public.players(full_name,date_of_birth,nationality,position,preferred_foot)
      values(trim(q.external_name),nullif(q.payload->>'date_of_birth','')::date,nullif(q.payload->>'country',''),nullif(q.payload->>'position',''),nullif(q.payload->>'preferred_foot',''))
      returning id into target_player;
    end if;

    insert into public.provider_player_mappings(provider,external_player_id,player_id,external_name,confidence,source_id,notes)
    values(q.provider,q.external_id,target_player,q.external_name,'verified',q.source_id,'Published from WFM import batch '||coalesce(q.import_batch_id::text,''))
    on conflict (provider,external_player_id) do update set player_id=excluded.player_id,external_name=excluded.external_name,confidence='verified',source_id=excluded.source_id,notes=excluded.notes;

    payload_club_name:=nullif(trim(coalesce(q.payload->>'club_name',q.payload->>'club')),'');
    payload_competition:=nullif(trim(coalesce(q.payload->>'competition',q.payload->>'league')),'');
    payload_season:=nullif(trim(q.payload->>'season'),'');
    payload_status:=nullif(trim(coalesce(q.payload->>'squad_status','first_team')),'');

    if nullif(trim(coalesce(q.payload->>'club_wfm_id',q.payload->>'club_id')),'') is not null then
      target_club:=nullif(trim(coalesce(q.payload->>'club_wfm_id',q.payload->>'club_id')),'')::uuid;
    elsif payload_club_name is not null then
      select count(*) into existing_count from public.clubs where lower(trim(name))=lower(payload_club_name);
      if existing_count=1 then select id into target_club from public.clubs where lower(trim(name))=lower(payload_club_name) limit 1;
      elsif existing_count>1 then raise exception 'Multiple WFM clubs match "%" — resolve the club before publishing',payload_club_name; end if;
    end if;

    if nullif(trim(q.payload->>'competition_season_id'),'') is not null then
      target_competition_season:=nullif(trim(q.payload->>'competition_season_id'),'')::uuid;
    elsif payload_competition is not null and payload_season is not null then
      select cs.id into target_competition_season
      from public.competition_seasons cs
      join public.competitions comp on comp.id=cs.competition_id
      join public.seasons s on s.id=cs.season_id
      where lower(trim(comp.canonical_name))=lower(payload_competition) and lower(trim(s.season_key))=lower(payload_season)
      limit 1;
    end if;

    if target_club is not null and target_competition_season is not null then
      if not exists(select 1 from public.club_competitions where club_id=target_club and competition_season_id=target_competition_season) then
        insert into public.club_competitions(club_id,competition_season_id) values(target_club,target_competition_season);
      end if;
      insert into public.player_competitions(player_id,club_competition_id,squad_status)
      select target_player,cc.id,payload_status from public.club_competitions cc
      where cc.club_id=target_club and cc.competition_season_id=target_competition_season
      on conflict do nothing;
    end if;

    update public.entity_import_queue set status='imported',matched_player_id=target_player,error_message=null,updated_at=now() where id=q.id;
    if q.import_batch_id is not null then
      update public.wfm_import_batches b set
        inserted_rows=(select count(*) from public.entity_import_queue where import_batch_id=q.import_batch_id and status='imported'),
        rejected_rows=(select count(*) from public.entity_import_queue where import_batch_id=q.import_batch_id and status='rejected'),
        needs_review_rows=(select count(*) from public.entity_import_queue where import_batch_id=q.import_batch_id and status in ('pending','needs_review','ready')),
        error_rows=(select count(*) from public.entity_import_queue where import_batch_id=q.import_batch_id and error_message is not null)
      where b.id=q.import_batch_id;
    end if;
    return jsonb_build_object('queue_id',q.id,'entity_type','player','entity_id',target_player,'status','imported','linked_club',target_club is not null,'linked_competition_season',target_competition_season is not null);
  end if;

  target_club:=q.matched_club_id;
  if target_club is null then select id into target_club from public.clubs where lower(trim(name))=lower(trim(q.external_name)) limit 1; end if;
  if target_club is null then
    insert into public.clubs(name,country,league) values(trim(q.external_name),nullif(q.payload->>'country',''),nullif(coalesce(q.payload->>'league',q.payload->>'competition'),''))
    returning id into target_club;
  end if;
  insert into public.provider_club_mappings(provider,external_club_id,club_id,external_name,confidence,source_id,notes)
  values(q.provider,q.external_id,target_club,q.external_name,'verified',q.source_id,'Published from WFM import batch '||coalesce(q.import_batch_id::text,''))
  on conflict (provider,external_club_id) do update set club_id=excluded.club_id,external_name=excluded.external_name,confidence='verified',source_id=excluded.source_id,notes=excluded.notes;
  update public.entity_import_queue set status='imported',matched_club_id=target_club,error_message=null,updated_at=now() where id=q.id;
  if q.import_batch_id is not null then
    update public.wfm_import_batches b set
      inserted_rows=(select count(*) from public.entity_import_queue where import_batch_id=q.import_batch_id and status='imported'),
      rejected_rows=(select count(*) from public.entity_import_queue where import_batch_id=q.import_batch_id and status='rejected'),
      needs_review_rows=(select count(*) from public.entity_import_queue where import_batch_id=q.import_batch_id and status in ('pending','needs_review','ready')),
      error_rows=(select count(*) from public.entity_import_queue where import_batch_id=q.import_batch_id and error_message is not null)
    where b.id=q.import_batch_id;
  end if;
  return jsonb_build_object('queue_id',q.id,'entity_type','club','entity_id',target_club,'status','imported');
end;
$$;
revoke all on function public.wfm_publish_import_queue_item(uuid) from public;
grant execute on function public.wfm_publish_import_queue_item(uuid) to authenticated;
