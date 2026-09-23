-- M6 global scouting network: persistent recruitment pipeline
create table if not exists public.scouting_pipeline (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 list_player_id uuid not null unique references public.scouting_list_players(id) on delete cascade,
 stage text not null default 'shortlist' check (stage in ('shortlist','watching','evaluating','contact','negotiating','signed','passed')),
 priority text not null default 'normal' check (priority in ('low','normal','high')),
 fit_status text not null default 'unassessed' check (fit_status in ('unassessed','strong_fit','possible_fit','not_a_fit')),
 next_action text,
 target_date date,
 evaluation text,
 updated_at timestamptz not null default now(),
 created_at timestamptz not null default now()
);
create index if not exists scouting_pipeline_user_id_idx on public.scouting_pipeline(user_id);
create index if not exists scouting_pipeline_stage_idx on public.scouting_pipeline(stage);
alter table public.scouting_pipeline enable row level security;
grant select,insert,update,delete on public.scouting_pipeline to authenticated;
create policy "Users can view own scouting pipeline" on public.scouting_pipeline for select to authenticated using ((select auth.uid())=user_id);
create policy "Users can create own scouting pipeline" on public.scouting_pipeline for insert to authenticated with check ((select auth.uid())=user_id and exists(select 1 from public.scouting_list_players lp join public.scouting_lists l on l.id=lp.list_id where lp.id=list_player_id and l.user_id=(select auth.uid())));
create policy "Users can update own scouting pipeline" on public.scouting_pipeline for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "Users can delete own scouting pipeline" on public.scouting_pipeline for delete to authenticated using ((select auth.uid())=user_id);