create table if not exists public.wfm_access_plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  monthly_price_usd numeric(10,2),
  annual_price_usd numeric(10,2),
  features jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wfm_account_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  club_id uuid references public.clubs(id) on delete cascade,
  plan_code text not null references public.wfm_access_plans(code),
  status text not null default 'active' check (status in ('active','paused','cancelled','expired')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  source text not null default 'admin',
  external_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (user_id is not null or club_id is not null)
);

alter table public.wfm_access_plans enable row level security;
alter table public.wfm_account_entitlements enable row level security;

create index if not exists wfm_account_entitlements_user_idx on public.wfm_account_entitlements(user_id);
create index if not exists wfm_account_entitlements_club_idx on public.wfm_account_entitlements(club_id);
create index if not exists wfm_account_entitlements_plan_idx on public.wfm_account_entitlements(plan_code);
create index if not exists wfm_account_entitlements_active_idx on public.wfm_account_entitlements(status, starts_at, ends_at);

drop policy if exists "Anyone can view active access plans" on public.wfm_access_plans;
create policy "Anyone can view active access plans" on public.wfm_access_plans for select to public using (active = true);

drop policy if exists "WFM admins manage access plans" on public.wfm_access_plans;
create policy "WFM admins manage access plans" on public.wfm_access_plans for all to authenticated using ((select private.is_wfm_admin())) with check ((select private.is_wfm_admin()));

drop policy if exists "Users can view their entitlements" on public.wfm_account_entitlements;
create policy "Users can view their entitlements" on public.wfm_account_entitlements for select to authenticated using ((select auth.uid()) = user_id or (club_id is not null and (select private.is_club_member(club_id))) or (select private.is_wfm_admin()));

drop policy if exists "WFM admins manage entitlements" on public.wfm_account_entitlements;
create policy "WFM admins manage entitlements" on public.wfm_account_entitlements for all to authenticated using ((select private.is_wfm_admin())) with check ((select private.is_wfm_admin()));

insert into public.wfm_access_plans (code,name,description,monthly_price_usd,annual_price_usd,features) values
('free','Free','Public WFM research access.',0,0,'{"public_profiles":true,"public_search":true,"scouting_discovery":false,"saved_reports":false,"club_workspace":false,"data_exports":false}'::jsonb),
('club','Club','Private club workspace and internal recruitment intelligence.',null,null,'{"public_profiles":true,"public_search":true,"scouting_discovery":true,"saved_reports":true,"club_workspace":true,"data_exports":false}'::jsonb),
('professional','Professional Scouting','Professional scouting workspace with advanced research and reporting controls.',null,null,'{"public_profiles":true,"public_search":true,"scouting_discovery":true,"saved_reports":true,"club_workspace":false,"data_exports":true}'::jsonb),
('data_license','Data License','Commercial data access and licensing tier.',null,null,'{"public_profiles":true,"public_search":true,"scouting_discovery":true,"saved_reports":true,"club_workspace":true,"data_exports":true,"licensed_data":true}'::jsonb)
on conflict (code) do nothing;
