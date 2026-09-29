-- M15 Launch Operations & Data Growth
-- Private admin workflow for discovering, qualifying, and maintaining WFM data sources.

create table if not exists public.wfm_source_pipeline (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text,
  publisher text,
  source_kind text not null default 'other'
    check (source_kind in ('official_club','official_league','federation','agency','media','database','other')),
  geography text,
  priority integer not null default 50 check (priority between 1 and 100),
  status text not null default 'candidate'
    check (status in ('candidate','researching','approved','active','paused','retired')),
  access_method text,
  notes text,
  last_checked_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists wfm_source_pipeline_status_priority_idx
  on public.wfm_source_pipeline(status, priority, updated_at desc);
create index if not exists wfm_source_pipeline_publisher_idx
  on public.wfm_source_pipeline(publisher);
create index if not exists wfm_source_pipeline_created_by_idx
  on public.wfm_source_pipeline(created_by);

create or replace function public.touch_wfm_source_pipeline_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_wfm_source_pipeline_updated_at on public.wfm_source_pipeline;
create trigger trg_wfm_source_pipeline_updated_at
before update on public.wfm_source_pipeline
for each row
execute function public.touch_wfm_source_pipeline_updated_at();

alter table public.wfm_source_pipeline enable row level security;

drop policy if exists "WFM admins can read source pipeline" on public.wfm_source_pipeline;
create policy "WFM admins can read source pipeline"
on public.wfm_source_pipeline
for select to authenticated
using (private.is_wfm_admin());

drop policy if exists "WFM admins can insert source pipeline" on public.wfm_source_pipeline;
create policy "WFM admins can insert source pipeline"
on public.wfm_source_pipeline
for insert to authenticated
with check (private.is_wfm_admin() and created_by = (select auth.uid()));

drop policy if exists "WFM admins can update source pipeline" on public.wfm_source_pipeline;
create policy "WFM admins can update source pipeline"
on public.wfm_source_pipeline
for update to authenticated
using (private.is_wfm_admin())
with check (private.is_wfm_admin());

drop policy if exists "WFM admins can delete source pipeline" on public.wfm_source_pipeline;
create policy "WFM admins can delete source pipeline"
on public.wfm_source_pipeline
for delete to authenticated
using (private.is_wfm_admin());

comment on table public.wfm_source_pipeline is
'M15 source acquisition pipeline: private admin workflow for qualifying data sources before they become production provenance records.';
