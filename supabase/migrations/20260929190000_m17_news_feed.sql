-- M17: source-linked homepage news feed
create table if not exists public.wfm_news_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text not null,
  publisher text not null,
  published_at timestamptz not null,
  summary text,
  image_url text,
  competition_name text,
  player_id uuid references public.players(id) on delete set null,
  club_id uuid references public.clubs(id) on delete set null,
  source_confidence text not null default 'reported',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wfm_news_items_source_confidence_chk
    check (source_confidence in ('verified','reported','estimated'))
);

create index if not exists wfm_news_items_active_published_idx
  on public.wfm_news_items (active, published_at desc);

alter table public.wfm_news_items enable row level security;

drop policy if exists "Public can read active news" on public.wfm_news_items;
create policy "Public can read active news"
  on public.wfm_news_items for select to anon, authenticated
  using (active = true);

drop policy if exists "Admins can manage news" on public.wfm_news_items;
create policy "Admins can manage news"
  on public.wfm_news_items for all to authenticated
  using ((select private.is_wfm_admin()))
  with check ((select private.is_wfm_admin()));

grant select on public.wfm_news_items to anon, authenticated;
grant insert, update, delete on public.wfm_news_items to authenticated;
