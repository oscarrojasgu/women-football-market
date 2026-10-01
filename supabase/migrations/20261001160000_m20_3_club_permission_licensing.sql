create table if not exists public.wfm_club_permission_tracker (id uuid primary key default gen_random_uuid(),club_id uuid not null references public.clubs(id) on delete cascade,outreach_status text not null default 'not_contacted',contact_name text,contact_role text,contact_email text,contact_url text,last_contacted_at timestamptz,next_follow_up_at timestamptz,response_received_at timestamptz,permission_status text not null default 'unknown',roster_allowed boolean,stats_allowed boolean,contracts_allowed boolean,salaries_allowed boolean,transfers_allowed boolean,photos_allowed boolean,logos_allowed boolean,commercial_use_allowed boolean,attribution_required boolean,attribution_text text,permitted_scope jsonb not null default '{}'::jsonb,restrictions jsonb not null default '{}'::jsonb,agreement_reference text,agreement_document_url text,starts_at timestamptz,ends_at timestamptz,notes text,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(club_id));
create table if not exists public.wfm_club_permission_events (id uuid primary key default gen_random_uuid(),tracker_id uuid not null references public.wfm_club_permission_tracker(id) on delete cascade,event_type text not null,occurred_at timestamptz not null default now(),channel text,subject text,summary text not null,contact_name text,contact_email text,document_url text,created_by uuid not null,created_at timestamptz not null default now());
alter table public.wfm_club_permission_tracker enable row level security; alter table public.wfm_club_permission_events enable row level security;
create index if not exists wfm_club_permission_tracker_status_idx on public.wfm_club_permission_tracker(outreach_status,permission_status,next_follow_up_at); create index if not exists wfm_club_permission_events_tracker_idx on public.wfm_club_permission_events(tracker_id,occurred_at desc);

-- Admin-only policies for the exposed public-schema tables.
drop policy if exists "wfm_club_permission_tracker_admin_select" on public.wfm_club_permission_tracker;
drop policy if exists "wfm_club_permission_tracker_admin_insert" on public.wfm_club_permission_tracker;
drop policy if exists "wfm_club_permission_tracker_admin_update" on public.wfm_club_permission_tracker;
drop policy if exists "wfm_club_permission_tracker_admin_delete" on public.wfm_club_permission_tracker;
create policy "wfm_club_permission_tracker_admin_select" on public.wfm_club_permission_tracker for select to authenticated using (exists(select 1 from public.wfm_admins a where a.user_id=(select auth.uid())));
create policy "wfm_club_permission_tracker_admin_insert" on public.wfm_club_permission_tracker for insert to authenticated with check (exists(select 1 from public.wfm_admins a where a.user_id=(select auth.uid())));
create policy "wfm_club_permission_tracker_admin_update" on public.wfm_club_permission_tracker for update to authenticated using (exists(select 1 from public.wfm_admins a where a.user_id=(select auth.uid()))) with check (exists(select 1 from public.wfm_admins a where a.user_id=(select auth.uid())));
create policy "wfm_club_permission_tracker_admin_delete" on public.wfm_club_permission_tracker for delete to authenticated using (exists(select 1 from public.wfm_admins a where a.user_id=(select auth.uid())));
drop policy if exists "wfm_club_permission_events_admin_select" on public.wfm_club_permission_events;
drop policy if exists "wfm_club_permission_events_admin_insert" on public.wfm_club_permission_events;
drop policy if exists "wfm_club_permission_events_admin_update" on public.wfm_club_permission_events;
drop policy if exists "wfm_club_permission_events_admin_delete" on public.wfm_club_permission_events;
create policy "wfm_club_permission_events_admin_select" on public.wfm_club_permission_events for select to authenticated using (exists(select 1 from public.wfm_admins a where a.user_id=(select auth.uid())));
create policy "wfm_club_permission_events_admin_insert" on public.wfm_club_permission_events for insert to authenticated with check (exists(select 1 from public.wfm_admins a where a.user_id=(select auth.uid())));
create policy "wfm_club_permission_events_admin_update" on public.wfm_club_permission_events for update to authenticated using (exists(select 1 from public.wfm_admins a where a.user_id=(select auth.uid()))) with check (exists(select 1 from public.wfm_admins a where a.user_id=(select auth.uid())));
create policy "wfm_club_permission_events_admin_delete" on public.wfm_club_permission_events for delete to authenticated using (exists(select 1 from public.wfm_admins a where a.user_id=(select auth.uid())));

insert into public.wfm_club_permission_tracker (club_id)
select c.id from public.clubs c
where not exists(select 1 from public.wfm_club_permission_tracker t where t.club_id=c.id)
on conflict (club_id) do nothing;