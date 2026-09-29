-- M12 security/performance hardening
revoke execute on function public.create_agency_workspace(text,text,text) from anon;
revoke execute on function public.respond_agency_contact_request(uuid,text) from anon;
revoke execute on function public.review_agency_player_request(uuid,text,text) from anon;
revoke execute on function public.wfm_run_integrity_audit() from anon;

drop policy if exists "WFM admins can manage agencies" on public.agency_accounts;
create policy "WFM admins can insert agencies" on public.agency_accounts for insert to authenticated with check(private.is_wfm_admin());
create policy "WFM admins can update agencies" on public.agency_accounts for update to authenticated using(private.is_wfm_admin()) with check(private.is_wfm_admin());
create policy "WFM admins can delete agencies" on public.agency_accounts for delete to authenticated using(private.is_wfm_admin());

drop policy if exists "Agency admins can manage membership" on public.agency_account_members;
create policy "Agency admins can insert membership" on public.agency_account_members for insert to authenticated with check(private.is_agency_admin(agency_id));
create policy "Agency admins can update membership" on public.agency_account_members for update to authenticated using(private.is_agency_admin(agency_id)) with check(private.is_agency_admin(agency_id));
create policy "Agency admins can delete membership" on public.agency_account_members for delete to authenticated using(private.is_agency_admin(agency_id));

create index if not exists agency_accounts_created_by_idx on public.agency_accounts(created_by);
create index if not exists agency_contact_requests_player_idx on public.agency_contact_requests(player_id);
create index if not exists agency_contact_requests_requested_by_idx on public.agency_contact_requests(requested_by);
create index if not exists agency_contact_requests_responded_by_idx on public.agency_contact_requests(responded_by);
create index if not exists agency_player_requests_submitted_by_idx on public.agency_player_requests(submitted_by);
create index if not exists agency_player_requests_reviewed_by_idx on public.agency_player_requests(reviewed_by);
create index if not exists agency_player_requests_source_idx on public.agency_player_requests(source_id);
