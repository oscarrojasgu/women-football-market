-- Restrict review RPC execution and permit only consistent admin audit inserts.

revoke all on function public.review_representation_request(uuid, text, text, text, uuid, text)
  from public, anon;
grant execute on function public.review_representation_request(uuid, text, text, text, uuid, text)
  to authenticated;

drop policy if exists "WFM admins can insert consistent representation review audits"
  on public.representation_reviews;

create policy "WFM admins can insert consistent representation review audits"
on public.representation_reviews
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and reviewer_id = (select auth.uid())
  and exists (
    select 1
    from public.wfm_admins a
    where a.user_id = (select auth.uid())
  )
  and exists (
    select 1
    from public.representation_requests r
    where r.id = representation_reviews.request_id
      and r.user_id = representation_reviews.user_id
      and r.reviewed_by = (select auth.uid())
      and r.reviewed_at is not null
      and r.status = representation_reviews.status_after
      and (
        (representation_reviews.action = 'needs_evidence' and representation_reviews.status_after = 'pending')
        or representation_reviews.action = representation_reviews.status_after
      )
  )
);
