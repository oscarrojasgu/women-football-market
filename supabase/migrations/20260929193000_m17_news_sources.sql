-- M17: approved RSS/news source registry
create table if not exists public.wfm_news_sources (
  id uuid primary key default gen_random_uuid(),
  source_pipeline_id uuid references public.wfm_source_pipeline(id) on delete set null,
  publisher text not null,
  feed_url text not null unique,
  active boolean not null default true,
  last_checked_at timestamptz,
  last_success_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists wfm_news_sources_active_idx
  on public.wfm_news_sources (active, last_checked_at);

alter table public.wfm_news_sources enable row level security;

drop policy if exists "Admins can manage news sources" on public.wfm_news_sources;
create policy "Admins can manage news sources"
  on public.wfm_news_sources for all to authenticated
  using ((select private.is_wfm_admin()))
  with check ((select private.is_wfm_admin()));

grant select, insert, update, delete on public.wfm_news_sources to authenticated;
