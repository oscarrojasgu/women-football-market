-- Phase 6 milestone 6: Global Scouting Network foundation.
-- User-owned scouting profiles can optionally be linked to a WFM club.

create table if not exists public.scouting_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  club_id uuid references public.clubs(id) on delete set null,
  name text not null,
  description text,
  status text not null default 'active' check (status in ('active','archived')),
  criteria jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.scouting_profiles enable row level security;

grant select, insert, update, delete on public.scouting_profiles to authenticated;

create index if not exists scouting_profiles_user_id_idx on public.scouting_profiles(user_id);
create index if not exists scouting_profiles_club_id_idx on public.scouting_profiles(club_id);
create index if not exists scouting_profiles_status_idx on public.scouting_profiles(status);

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='scouting_profiles' and policyname='Users can view own scouting profiles') then
    create policy "Users can view own scouting profiles" on public.scouting_profiles for select to authenticated using ((select auth.uid()) = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='scouting_profiles' and policyname='Users can create own scouting profiles') then
    create policy "Users can create own scouting profiles" on public.scouting_profiles for insert to authenticated with check ((select auth.uid()) = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='scouting_profiles' and policyname='Users can update own scouting profiles') then
    create policy "Users can update own scouting profiles" on public.scouting_profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='scouting_profiles' and policyname='Users can delete own scouting profiles') then
    create policy "Users can delete own scouting profiles" on public.scouting_profiles for delete to authenticated using ((select auth.uid()) = user_id);
  end if;
end $$;