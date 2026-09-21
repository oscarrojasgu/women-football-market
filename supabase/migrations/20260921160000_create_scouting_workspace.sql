-- Phase 5 milestone 1: Scouting workspace architecture.
-- User-owned lists, list membership, private scouting notes, and saved searches.

create table if not exists public.scouting_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'active' check (status in ('active','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.scouting_list_players (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.scouting_lists(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  added_by uuid not null references auth.users(id) on delete cascade,
  added_at timestamptz not null default now(),
  note text,
  unique (list_id, player_id)
);

create table if not exists public.scouting_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  player_id uuid references public.players(id) on delete cascade,
  list_id uuid references public.scouting_lists(id) on delete cascade,
  note_type text not null default 'general' check (note_type in ('general','watch','follow_up','evaluation','contract','availability')),
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint scouting_notes_target_check check (player_id is not null or list_id is not null)
);

create table if not exists public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  filters jsonb not null default '{}'::jsonb,
  sort_key text,
  sort_direction text check (sort_direction in ('asc','desc')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.scouting_lists enable row level security;
alter table public.scouting_list_players enable row level security;
alter table public.scouting_notes enable row level security;
alter table public.saved_searches enable row level security;

grant select, insert, update, delete on public.scouting_lists to authenticated;
grant select, insert, update, delete on public.scouting_list_players to authenticated;
grant select, insert, update, delete on public.scouting_notes to authenticated;
grant select, insert, update, delete on public.saved_searches to authenticated;

create index if not exists scouting_lists_user_id_idx on public.scouting_lists(user_id);
create index if not exists scouting_list_players_list_id_idx on public.scouting_list_players(list_id);
create index if not exists scouting_list_players_player_id_idx on public.scouting_list_players(player_id);
create index if not exists scouting_list_players_added_by_idx on public.scouting_list_players(added_by);
create index if not exists scouting_notes_user_id_idx on public.scouting_notes(user_id);
create index if not exists scouting_notes_player_id_idx on public.scouting_notes(player_id);
create index if not exists scouting_notes_list_id_idx on public.scouting_notes(list_id);
create index if not exists saved_searches_user_id_idx on public.saved_searches(user_id);

-- Policies are created conditionally so this migration is safe when the schema
-- has already been applied directly in an existing production project.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='scouting_lists' and policyname='Users can view own scouting lists') then
    create policy "Users can view own scouting lists" on public.scouting_lists for select to authenticated using ((select auth.uid()) = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='scouting_lists' and policyname='Users can create own scouting lists') then
    create policy "Users can create own scouting lists" on public.scouting_lists for insert to authenticated with check ((select auth.uid()) = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='scouting_lists' and policyname='Users can update own scouting lists') then
    create policy "Users can update own scouting lists" on public.scouting_lists for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='scouting_lists' and policyname='Users can delete own scouting lists') then
    create policy "Users can delete own scouting lists" on public.scouting_lists for delete to authenticated using ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='scouting_list_players' and policyname='Users can view players in own scouting lists') then
    create policy "Users can view players in own scouting lists" on public.scouting_list_players for select to authenticated using (exists (select 1 from public.scouting_lists l where l.id=list_id and l.user_id=(select auth.uid())));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='scouting_list_players' and policyname='Users can add players to own scouting lists') then
    create policy "Users can add players to own scouting lists" on public.scouting_list_players for insert to authenticated with check ((select auth.uid())=added_by and exists (select 1 from public.scouting_lists l where l.id=list_id and l.user_id=(select auth.uid())));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='scouting_list_players' and policyname='Users can update players in own scouting lists') then
    create policy "Users can update players in own scouting lists" on public.scouting_list_players for update to authenticated using (exists (select 1 from public.scouting_lists l where l.id=list_id and l.user_id=(select auth.uid()))) with check (exists (select 1 from public.scouting_lists l where l.id=list_id and l.user_id=(select auth.uid())));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='scouting_list_players' and policyname='Users can delete players from own scouting lists') then
    create policy "Users can delete players from own scouting lists" on public.scouting_list_players for delete to authenticated using (exists (select 1 from public.scouting_lists l where l.id=list_id and l.user_id=(select auth.uid())));
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='scouting_notes' and policyname='Users can view own scouting notes') then
    create policy "Users can view own scouting notes" on public.scouting_notes for select to authenticated using ((select auth.uid())=user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='scouting_notes' and policyname='Users can create own scouting notes') then
    create policy "Users can create own scouting notes" on public.scouting_notes for insert to authenticated with check ((select auth.uid())=user_id and (player_id is not null or list_id is not null));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='scouting_notes' and policyname='Users can update own scouting notes') then
    create policy "Users can update own scouting notes" on public.scouting_notes for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id and (player_id is not null or list_id is not null));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='scouting_notes' and policyname='Users can delete own scouting notes') then
    create policy "Users can delete own scouting notes" on public.scouting_notes for delete to authenticated using ((select auth.uid())=user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='saved_searches' and policyname='Users can view own saved searches') then
    create policy "Users can view own saved searches" on public.saved_searches for select to authenticated using ((select auth.uid())=user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='saved_searches' and policyname='Users can create own saved searches') then
    create policy "Users can create own saved searches" on public.saved_searches for insert to authenticated with check ((select auth.uid())=user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='saved_searches' and policyname='Users can update own saved searches') then
    create policy "Users can update own saved searches" on public.saved_searches for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='saved_searches' and policyname='Users can delete own saved searches') then
    create policy "Users can delete own saved searches" on public.saved_searches for delete to authenticated using ((select auth.uid())=user_id);
  end if;
end $$;
