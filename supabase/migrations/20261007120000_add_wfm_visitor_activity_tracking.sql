create table if not exists public.wfm_visitor_activity (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null check (event_type in ('page_view','heartbeat','interaction')),
  path text not null,
  page_title text,
  referrer text,
  locale text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists wfm_visitor_activity_occurred_at_idx
  on public.wfm_visitor_activity(occurred_at desc);
create index if not exists wfm_visitor_activity_session_idx
  on public.wfm_visitor_activity(session_id, occurred_at desc);
create index if not exists wfm_visitor_activity_user_idx
  on public.wfm_visitor_activity(user_id, occurred_at desc);
create index if not exists wfm_visitor_activity_path_idx
  on public.wfm_visitor_activity(path, occurred_at desc);

alter table public.wfm_visitor_activity enable row level security;

revoke all on table public.wfm_visitor_activity from anon, authenticated;
grant insert on table public.wfm_visitor_activity to anon, authenticated;

drop policy if exists "Visitors can record their own activity" on public.wfm_visitor_activity;
create policy "Visitors can record their own activity"
on public.wfm_visitor_activity
for insert to anon, authenticated
with check (user_id is null or user_id = (select auth.uid()));

drop policy if exists "WFM admins can read visitor activity" on public.wfm_visitor_activity;
create policy "WFM admins can read visitor activity"
on public.wfm_visitor_activity
for select to authenticated
using (private.is_wfm_admin());

create or replace function public.get_wfm_admin_visitor_activity(
  p_limit integer default 250,
  p_since timestamptz default now() - interval '7 days'
)
returns table (
  id uuid, session_id uuid, user_id uuid, email text, display_name text,
  account_type text, organization_name text, job_title text, event_type text,
  path text, page_title text, referrer text, locale text, metadata jsonb,
  occurred_at timestamptz
)
language sql
security definer
set search_path = public, auth, private, pg_temp
stable
as $$
  select a.id, a.session_id, a.user_id, u.email, ap.display_name,
    ap.account_type, ap.organization_name, ap.job_title, a.event_type,
    a.path, a.page_title, a.referrer, a.locale, a.metadata, a.occurred_at
  from public.wfm_visitor_activity a
  left join auth.users u on u.id = a.user_id
  left join public.account_profiles ap on ap.user_id = a.user_id
  where private.is_wfm_admin()
    and a.occurred_at >= p_since
  order by a.occurred_at desc
  limit greatest(1, least(coalesce(p_limit, 250), 1000));
$$;

revoke all on function public.get_wfm_admin_visitor_activity(integer, timestamptz) from public;
grant execute on function public.get_wfm_admin_visitor_activity(integer, timestamptz) to authenticated;
