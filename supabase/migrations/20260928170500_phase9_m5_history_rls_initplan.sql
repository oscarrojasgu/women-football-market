-- Optimize M5 history RLS auth evaluation and scope policies to authenticated users.
drop policy if exists "wfm history admin delete" on public.wfm_player_history_snapshots;
drop policy if exists "wfm history admin insert" on public.wfm_player_history_snapshots;
drop policy if exists "wfm history admin select" on public.wfm_player_history_snapshots;
drop policy if exists "wfm history admin update" on public.wfm_player_history_snapshots;

create policy "wfm history admin delete" on public.wfm_player_history_snapshots for delete to authenticated
using (((select auth.jwt()) -> 'app_metadata'::text ->> 'role'::text) = 'admin'::text);

create policy "wfm history admin insert" on public.wfm_player_history_snapshots for insert to authenticated
with check (((select auth.jwt()) -> 'app_metadata'::text ->> 'role'::text) = 'admin'::text);

create policy "wfm history admin select" on public.wfm_player_history_snapshots for select to authenticated
using (((select auth.jwt()) -> 'app_metadata'::text ->> 'role'::text) = 'admin'::text);

create policy "wfm history admin update" on public.wfm_player_history_snapshots for update to authenticated
using (((select auth.jwt()) -> 'app_metadata'::text ->> 'role'::text) = 'admin'::text)
with check (((select auth.jwt()) -> 'app_metadata'::text ->> 'role'::text) = 'admin'::text);
