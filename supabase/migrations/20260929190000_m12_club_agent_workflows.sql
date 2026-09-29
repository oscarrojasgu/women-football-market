-- M12: Club & Agent Workflows
create table if not exists public.agency_accounts (
  id uuid primary key default gen_random_uuid(), name text not null, website text, country text,
  verification_status text not null default 'pending' check (verification_status in ('pending','verified','rejected','revoked')),
  created_by uuid not null references auth.users(id) on delete restrict, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.agency_account_members (
  agency_id uuid not null references public.agency_accounts(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'agent' check (role in ('admin','agent','analyst')), status text not null default 'active' check (status in ('active','suspended','revoked')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), primary key (agency_id,user_id)
);
create table if not exists public.agency_player_requests (
  id uuid primary key default gen_random_uuid(), agency_id uuid not null references public.agency_accounts(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade, submitted_by uuid not null references auth.users(id) on delete restrict,
  relationship_type text not null default 'representation' check (relationship_type in ('representation','management','advisory')),
  status text not null default 'pending' check (status in ('pending','approved','rejected','revoked')),
  verification_method text, evidence_url text, source_id uuid references public.sources(id) on delete set null, notes text,
  reviewed_by uuid references auth.users(id) on delete set null, reviewed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index if not exists agency_player_requests_active_uidx on public.agency_player_requests(agency_id,player_id) where status in ('pending','approved');
create table if not exists public.agency_contact_requests (
  id uuid primary key default gen_random_uuid(), club_id uuid not null references public.clubs(id) on delete cascade,
  agency_id uuid not null references public.agency_accounts(id) on delete cascade, player_id uuid references public.players(id) on delete set null,
  requested_by uuid not null references auth.users(id) on delete restrict, subject text not null, message text,
  status text not null default 'pending' check (status in ('pending','accepted','declined','closed')),
  responded_by uuid references auth.users(id) on delete set null, responded_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists agency_account_members_user_idx on public.agency_account_members(user_id);
create index if not exists agency_player_requests_player_idx on public.agency_player_requests(player_id);
create index if not exists agency_player_requests_status_idx on public.agency_player_requests(status);
create index if not exists agency_contact_requests_club_idx on public.agency_contact_requests(club_id);
create index if not exists agency_contact_requests_agency_idx on public.agency_contact_requests(agency_id);
create index if not exists agency_contact_requests_status_idx on public.agency_contact_requests(status);
alter table public.agency_accounts enable row level security;
alter table public.agency_account_members enable row level security;
alter table public.agency_player_requests enable row level security;
alter table public.agency_contact_requests enable row level security;
create or replace function private.is_agency_member(target_agency_id uuid) returns boolean language sql stable security definer set search_path=public,private as $$ select exists(select 1 from public.agency_account_members where agency_id=target_agency_id and user_id=(select auth.uid()) and status='active'); $$;
create or replace function private.is_agency_admin(target_agency_id uuid) returns boolean language sql stable security definer set search_path=public,private as $$ select exists(select 1 from public.agency_account_members where agency_id=target_agency_id and user_id=(select auth.uid()) and role='admin' and status='active') or private.is_wfm_admin(); $$;
grant execute on function private.is_agency_member(uuid) to authenticated;
grant execute on function private.is_agency_admin(uuid) to authenticated;
drop policy if exists "Agency members can view agency" on public.agency_accounts;
create policy "Agency members can view agency" on public.agency_accounts for select to authenticated using (private.is_agency_member(id) or private.is_wfm_admin());
drop policy if exists "Agency admins can view membership" on public.agency_account_members;
create policy "Agency members can view membership" on public.agency_account_members for select to authenticated using (private.is_agency_member(agency_id) or private.is_wfm_admin());
drop policy if exists "Agency members can view player requests" on public.agency_player_requests;
create policy "Agency members can view player requests" on public.agency_player_requests for select to authenticated using (private.is_agency_member(agency_id) or private.is_wfm_admin());
create policy "Agency members can create player requests" on public.agency_player_requests for insert to authenticated with check (private.is_agency_member(agency_id) and submitted_by=(select auth.uid()));
create policy "WFM admins can review player requests" on public.agency_player_requests for update to authenticated using (private.is_wfm_admin()) with check (private.is_wfm_admin());
create policy "Agency members can view contact requests" on public.agency_contact_requests for select to authenticated using (private.is_agency_member(agency_id) or private.is_club_member(club_id) or private.is_wfm_admin());
create policy "Club members can create contact requests" on public.agency_contact_requests for insert to authenticated with check (private.is_club_member(club_id) and requested_by=(select auth.uid()));
create policy "WFM admins can manage contact requests" on public.agency_contact_requests for delete to authenticated using (private.is_wfm_admin());
create or replace function public.create_agency_workspace(p_name text,p_website text default null,p_country text default null) returns uuid language plpgsql security definer set search_path=public,private as $$ declare v_agency_id uuid; begin if auth.uid() is null then raise exception 'Authentication required'; end if; if nullif(trim(p_name),'') is null then raise exception 'Agency name is required'; end if; insert into public.agency_accounts(name,website,country,created_by) values(trim(p_name),nullif(trim(p_website),''),nullif(trim(p_country),''),auth.uid()) returning id into v_agency_id; insert into public.agency_account_members(agency_id,user_id,role) values(v_agency_id,auth.uid(),'admin'); return v_agency_id; end; $$;
grant execute on function public.create_agency_workspace(text,text,text) to authenticated;
create or replace function public.review_agency_player_request(p_request_id uuid,p_action text,p_notes text default null) returns void language plpgsql security definer set search_path=public,private as $$ begin if not private.is_wfm_admin() then raise exception 'WFM admin access required'; end if; if p_action not in ('approved','rejected','revoked') then raise exception 'Invalid review action'; end if; update public.agency_player_requests set status=p_action,notes=coalesce(p_notes,notes),reviewed_by=auth.uid(),reviewed_at=now(),updated_at=now() where id=p_request_id; if not found then raise exception 'Request not found'; end if; end; $$;
grant execute on function public.review_agency_player_request(uuid,text,text) to authenticated;
