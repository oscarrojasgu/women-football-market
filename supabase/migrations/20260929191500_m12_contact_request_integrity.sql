-- M12 contact request integrity
drop policy if exists "Club members can update contact requests" on public.agency_contact_requests;
drop policy if exists "Club members can create contact requests" on public.agency_contact_requests;
create policy "Club members can create contact requests" on public.agency_contact_requests for insert to authenticated
with check (private.is_club_member(club_id) and requested_by=(select auth.uid()) and exists(select 1 from public.agency_accounts a where a.id=agency_id and a.verification_status='verified'));
create or replace function public.respond_agency_contact_request(p_request_id uuid,p_action text) returns void language plpgsql security definer set search_path=public,private as $$
declare v_club_id uuid; v_agency_id uuid; v_requested_by uuid;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if p_action not in ('accepted','declined','closed') then raise exception 'Invalid contact action'; end if;
 select club_id,agency_id,requested_by into v_club_id,v_agency_id,v_requested_by from public.agency_contact_requests where id=p_request_id for update;
 if not found then raise exception 'Contact request not found'; end if;
 if not (private.is_wfm_admin() or private.is_agency_member(v_agency_id) or private.is_club_member(v_club_id)) then raise exception 'Not authorized for this contact request'; end if;
 if p_action='closed' and not (private.is_wfm_admin() or private.is_club_member(v_club_id) or v_requested_by=auth.uid()) then raise exception 'Only the requesting club can close this request'; end if;
 if p_action in ('accepted','declined') and not (private.is_wfm_admin() or private.is_agency_member(v_agency_id)) then raise exception 'Only the receiving agency can accept or decline this request'; end if;
 update public.agency_contact_requests set status=p_action,responded_by=auth.uid(),responded_at=now(),updated_at=now() where id=p_request_id;
end; $$;
grant execute on function public.respond_agency_contact_request(uuid,text) to authenticated;
