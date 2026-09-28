create table if not exists public.wfm_import_batches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  provider text not null,
  source_type text not null default 'manual',
  source_id uuid references public.sources(id) on delete set null,
  competition_id uuid references public.competitions(id) on delete set null,
  season_id uuid references public.seasons(id) on delete set null,
  entity_types text[] not null default array[]::text[],
  status text not null default 'draft',
  file_name text,
  total_rows integer not null default 0,
  accepted_rows integer not null default 0,
  rejected_rows integer not null default 0,
  needs_review_rows integer not null default 0,
  inserted_rows integer not null default 0,
  updated_rows integer not null default 0,
  error_rows integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  started_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wfm_import_batches_source_type_check
    check (source_type = any (array['manual','csv','api','provider','migration'])),
  constraint wfm_import_batches_status_check
    check (status = any (array['draft','queued','processing','completed','completed_with_errors','failed','cancelled'])),
  constraint wfm_import_batches_counts_nonnegative_check
    check (
      total_rows >= 0 and accepted_rows >= 0 and rejected_rows >= 0
      and needs_review_rows >= 0 and inserted_rows >= 0 and updated_rows >= 0
      and error_rows >= 0
    )
);

create index if not exists wfm_import_batches_status_idx
  on public.wfm_import_batches(status, created_at desc);

create index if not exists wfm_import_batches_provider_idx
  on public.wfm_import_batches(provider, created_at desc);

create index if not exists wfm_import_batches_competition_season_idx
  on public.wfm_import_batches(competition_id, season_id);

create index if not exists entity_import_queue_import_batch_idx
  on public.entity_import_queue(import_batch_id);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'entity_import_queue_import_batch_id_fkey'
  ) then
    alter table public.entity_import_queue
      add constraint entity_import_queue_import_batch_id_fkey
      foreign key (import_batch_id)
      references public.wfm_import_batches(id)
      on delete set null;
  end if;
end $$;

alter table public.wfm_import_batches enable row level security;

drop policy if exists "WFM admins manage import batches" on public.wfm_import_batches;
create policy "WFM admins manage import batches"
on public.wfm_import_batches
for all
to authenticated
using ((select private.is_wfm_admin()))
with check ((select private.is_wfm_admin()));

drop policy if exists "WFM admins manage import queue" on public.entity_import_queue;
create policy "WFM admins manage import queue"
on public.entity_import_queue
for all
to authenticated
using ((select private.is_wfm_admin()))
with check ((select private.is_wfm_admin()));

create or replace function public.touch_wfm_import_batch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_wfm_import_batches_updated_at on public.wfm_import_batches;
create trigger trg_wfm_import_batches_updated_at
before update on public.wfm_import_batches
for each row
execute function public.touch_wfm_import_batch_updated_at();
