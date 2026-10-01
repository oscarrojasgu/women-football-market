create table if not exists public.wfm_acquisition_queue (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid references public.competitions(id) on delete cascade,
  season_id uuid references public.seasons(id) on delete set null,
  club_id uuid references public.clubs(id) on delete cascade,
  source_pipeline_id uuid references public.wfm_source_pipeline(id) on delete set null,
  task_type text not null check (task_type in ('competition_structure','club_rosters','player_profiles','player_stats','transfers')),
  priority integer not null default 50 check (priority between 1 and 100),
  status text not null default 'queued' check (status in ('queued','in_progress','blocked','review','completed','failed','paused')),
  attempts integer not null default 0 check (attempts >= 0),
  last_attempted_at timestamptz,
  last_success_at timestamptz,
  next_attempt_at timestamptz,
  error_code text,
  error_message text,
  evidence_count integer not null default 0 check (evidence_count >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wfm_acquisition_queue_scope_check check (competition_id is not null or club_id is not null)
);

create unique index if not exists wfm_acq_queue_comp_task_uq on public.wfm_acquisition_queue (competition_id, season_id, task_type) where competition_id is not null and club_id is null;
create unique index if not exists wfm_acq_queue_club_task_uq on public.wfm_acquisition_queue (club_id, season_id, task_type) where club_id is not null;
create index if not exists wfm_acq_queue_work_idx on public.wfm_acquisition_queue (status, priority, next_attempt_at, updated_at);
create index if not exists wfm_acq_queue_comp_idx on public.wfm_acquisition_queue (competition_id, season_id);

alter table public.wfm_acquisition_queue enable row level security;

create policy "wfm_acquisition_queue_admin_select" on public.wfm_acquisition_queue for select to authenticated using (exists (select 1 from public.wfm_admins a where a.user_id=(select auth.uid())));
create policy "wfm_acquisition_queue_admin_insert" on public.wfm_acquisition_queue for insert to authenticated with check (exists (select 1 from public.wfm_admins a where a.user_id=(select auth.uid())));
create policy "wfm_acquisition_queue_admin_update" on public.wfm_acquisition_queue for update to authenticated using (exists (select 1 from public.wfm_admins a where a.user_id=(select auth.uid()))) with check (exists (select 1 from public.wfm_admins a where a.user_id=(select auth.uid())));
create policy "wfm_acquisition_queue_admin_delete" on public.wfm_acquisition_queue for delete to authenticated using (exists (select 1 from public.wfm_admins a where a.user_id=(select auth.uid())));

create or replace view public.wfm_acquisition_queue_summary with (security_invoker=true) as
select task_type,status,count(*) task_count,count(*) filter (where last_success_at is not null) successful_tasks,count(*) filter (where status='failed') failed_tasks,min(priority) highest_priority
from public.wfm_acquisition_queue group by task_type,status;

insert into public.wfm_acquisition_queue (competition_id,task_type,priority,status,notes)
select r.id,t.task_type,greatest(1,least(100,r.expansion_priority*10)),'queued','M20 global acquisition queue seed'
from public.wfm_global_coverage_readiness r
cross join (values ('competition_structure'::text),('club_rosters'::text),('player_profiles'::text),('player_stats'::text),('transfers'::text)) t(task_type)
where r.active=true on conflict do nothing;
