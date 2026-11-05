-- Remove overlapping SELECT policies while preserving public and admin access.
drop policy if exists "WFM admins manage match fixtures" on public.wfm_match_fixtures;
create policy "WFM admins insert match fixtures" on public.wfm_match_fixtures
  for insert to authenticated with check ((select private.is_wfm_admin()));
create policy "WFM admins update match fixtures" on public.wfm_match_fixtures
  for update to authenticated using ((select private.is_wfm_admin()))
  with check ((select private.is_wfm_admin()));
create policy "WFM admins delete match fixtures" on public.wfm_match_fixtures
  for delete to authenticated using ((select private.is_wfm_admin()));

drop policy if exists "Admins can manage news" on public.wfm_news_items;
drop policy if exists "Public can read active news" on public.wfm_news_items;
create policy "Public and admins can read news" on public.wfm_news_items
  for select to anon, authenticated
  using (active = true or (select private.is_wfm_admin()));
create policy "WFM admins insert news" on public.wfm_news_items
  for insert to authenticated with check ((select private.is_wfm_admin()));
create policy "WFM admins update news" on public.wfm_news_items
  for update to authenticated using ((select private.is_wfm_admin()))
  with check ((select private.is_wfm_admin()));
create policy "WFM admins delete news" on public.wfm_news_items
  for delete to authenticated using ((select private.is_wfm_admin()));