-- M13 Commercial Licensing Infrastructure
create table if not exists public.wfm_license_products (
 id uuid primary key default gen_random_uuid(), code text not null unique, name text not null, description text,
 license_type text not null check (license_type in ('internal_research','scouting','data_license','api_license','custom')),
 scope jsonb not null default '{}'::jsonb, active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.wfm_license_requests (
 id uuid primary key default gen_random_uuid(), product_id uuid not null references public.wfm_license_products(id) on delete restrict,
 requested_by uuid not null references auth.users(id) on delete restrict, club_id uuid references public.clubs(id) on delete set null,
 requested_term text not null default '12_months', intended_use text not null, requested_scope jsonb not null default '{}'::jsonb,
 status text not null default 'pending' check (status in ('pending','under_review','approved','rejected','withdrawn')),
 admin_notes text, reviewed_by uuid references auth.users(id) on delete set null, reviewed_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.wfm_license_agreements (
 id uuid primary key default gen_random_uuid(), request_id uuid references public.wfm_license_requests(id) on delete set null,
 product_id uuid not null references public.wfm_license_products(id) on delete restrict, licensee_user_id uuid references auth.users(id) on delete set null,
 licensee_club_id uuid references public.clubs(id) on delete set null, agreement_reference text not null unique,
 status text not null default 'draft' check (status in ('draft','active','expired','terminated')),
 starts_at timestamptz not null, ends_at timestamptz, permitted_scope jsonb not null default '{}'::jsonb,
 restrictions jsonb not null default '{}'::jsonb, commercial_terms jsonb not null default '{}'::jsonb, document_url text, signed_at timestamptz,
 created_by uuid not null references auth.users(id) on delete restrict, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check (licensee_user_id is not null or licensee_club_id is not null)
);
create table if not exists public.wfm_license_access_log (
 id bigint generated always as identity primary key, agreement_id uuid not null references public.wfm_license_agreements(id) on delete cascade,
 user_id uuid references auth.users(id) on delete set null, action text not null check (action in ('view','export','download','api_access','report_access')),
 resource_type text, resource_id text, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create index if not exists wfm_license_requests_product_idx on public.wfm_license_requests(product_id);
create index if not exists wfm_license_requests_requester_idx on public.wfm_license_requests(requested_by);
create index if not exists wfm_license_requests_club_idx on public.wfm_license_requests(club_id);
create index if not exists wfm_license_requests_status_idx on public.wfm_license_requests(status);
create index if not exists wfm_license_agreements_product_idx on public.wfm_license_agreements(product_id);
create index if not exists wfm_license_agreements_user_idx on public.wfm_license_agreements(licensee_user_id);
create index if not exists wfm_license_agreements_club_idx on public.wfm_license_agreements(licensee_club_id);
create index if not exists wfm_license_agreements_status_dates_idx on public.wfm_license_agreements(status,starts_at,ends_at);
create index if not exists wfm_license_access_log_agreement_idx on public.wfm_license_access_log(agreement_id,created_at desc);
create index if not exists wfm_license_access_log_user_idx on public.wfm_license_access_log(user_id,created_at desc);
alter table public.wfm_license_products enable row level security;
alter table public.wfm_license_requests enable row level security;
alter table public.wfm_license_agreements enable row level security;
alter table public.wfm_license_access_log enable row level security;
create policy "Public can view active license products" on public.wfm_license_products for select to anon,authenticated using(active=true);
create policy "WFM admins manage license products" on public.wfm_license_products for all to authenticated using(private.is_wfm_admin()) with check(private.is_wfm_admin());
create policy "Users can view own license requests" on public.wfm_license_requests for select to authenticated using(requested_by=(select auth.uid()) or private.is_wfm_admin() or (club_id is not null and private.is_club_member(club_id)));
create policy "Users can create license requests" on public.wfm_license_requests for insert to authenticated with check(requested_by=(select auth.uid()));
create policy "WFM admins manage license requests" on public.wfm_license_requests for update to authenticated using(private.is_wfm_admin()) with check(private.is_wfm_admin());
create policy "Licensees can view agreements" on public.wfm_license_agreements for select to authenticated using(private.is_wfm_admin() or licensee_user_id=(select auth.uid()) or (licensee_club_id is not null and private.is_club_member(licensee_club_id)));
create policy "WFM admins manage agreements" on public.wfm_license_agreements for all to authenticated using(private.is_wfm_admin()) with check(private.is_wfm_admin());
create policy "Licensees can write access logs" on public.wfm_license_access_log for insert to authenticated with check(user_id=(select auth.uid()) and exists(select 1 from public.wfm_license_agreements a where a.id=agreement_id and a.status='active' and (a.licensee_user_id=(select auth.uid()) or (a.licensee_club_id is not null and private.is_club_member(a.licensee_club_id)))));
create policy "WFM admins can view access logs" on public.wfm_license_access_log for select to authenticated using(private.is_wfm_admin());
insert into public.wfm_license_products(code,name,description,license_type,scope) values
('research','Research Access','Structured research and internal reference access.','internal_research','{"public_profiles":true,"research":true}'::jsonb),
('scouting','Professional Scouting','Professional scouting and recruitment intelligence access.','scouting','{"scouting":true,"saved_reports":true,"data_exports":true}'::jsonb),
('data_license','Commercial Data License','Commercially licensed WFM data access subject to an executed agreement.','data_license','{"licensed_data":true,"data_exports":true}'::jsonb),
('api_license','API / Data Feed','Controlled machine-readable WFM data access.','api_license','{"api_access":true}'::jsonb)
on conflict(code) do nothing;
create or replace function public.submit_license_request(p_product_id uuid,p_intended_use text,p_requested_term text default '12_months',p_club_id uuid default null,p_requested_scope jsonb default '{}'::jsonb) returns uuid language plpgsql security definer set search_path=public,private as $$ declare v_id uuid; begin if auth.uid() is null then raise exception 'Authentication required'; end if; if nullif(trim(p_intended_use),'') is null then raise exception 'Intended use is required'; end if; if not exists(select 1 from public.wfm_license_products where id=p_product_id and active=true) then raise exception 'License product is unavailable'; end if; if p_club_id is not null and not private.is_club_member(p_club_id) then raise exception 'Not authorized for this club'; end if; insert into public.wfm_license_requests(product_id,requested_by,club_id,requested_term,intended_use,requested_scope) values(p_product_id,auth.uid(),p_club_id,coalesce(nullif(trim(p_requested_term),''),'12_months'),trim(p_intended_use),coalesce(p_requested_scope,'{}'::jsonb)) returning id into v_id; return v_id; end; $$;
grant execute on function public.submit_license_request(uuid,text,text,uuid,jsonb) to authenticated; revoke execute on function public.submit_license_request(uuid,text,text,uuid,jsonb) from anon,public;
create or replace function public.review_license_request(p_request_id uuid,p_action text,p_admin_notes text default null) returns void language plpgsql security definer set search_path=public,private as $$ begin if not private.is_wfm_admin() then raise exception 'WFM admin access required'; end if; if p_action not in ('under_review','approved','rejected','withdrawn') then raise exception 'Invalid review action'; end if; update public.wfm_license_requests set status=p_action,admin_notes=coalesce(p_admin_notes,admin_notes),reviewed_by=auth.uid(),reviewed_at=now(),updated_at=now() where id=p_request_id; if not found then raise exception 'License request not found'; end if; end; $$;
grant execute on function public.review_license_request(uuid,text,text) to authenticated; revoke execute on function public.review_license_request(uuid,text,text) from anon,public;
create or replace function public.create_license_agreement(p_request_id uuid,p_agreement_reference text,p_starts_at timestamptz,p_ends_at timestamptz,p_permitted_scope jsonb default '{}'::jsonb,p_restrictions jsonb default '{}'::jsonb,p_commercial_terms jsonb default '{}'::jsonb,p_document_url text default null) returns uuid language plpgsql security definer set search_path=public,private as $$ declare r public.wfm_license_requests; v_id uuid; v_plan text; begin if not private.is_wfm_admin() then raise exception 'WFM admin access required'; end if; select * into r from public.wfm_license_requests where id=p_request_id; if not found then raise exception 'License request not found'; end if; if r.status <> 'approved' then raise exception 'Request must be approved first'; end if; if nullif(trim(p_agreement_reference),'') is null then raise exception 'Agreement reference is required'; end if; if p_ends_at is not null and p_ends_at <= p_starts_at then raise exception 'Agreement end must follow start'; end if; insert into public.wfm_license_agreements(request_id,product_id,licensee_user_id,licensee_club_id,agreement_reference,status,starts_at,ends_at,permitted_scope,restrictions,commercial_terms,document_url,signed_at,created_by) values(r.id,r.product_id,r.requested_by,r.club_id,trim(p_agreement_reference),'active',p_starts_at,p_ends_at,coalesce(p_permitted_scope,r.requested_scope),coalesce(p_restrictions,'{}'::jsonb),coalesce(p_commercial_terms,'{}'::jsonb),p_document_url,now(),auth.uid()) returning id into v_id; select case when lp.code='data_license' then 'data_license' when lp.code='scouting' then 'professional' else 'club' end into v_plan from public.wfm_license_products lp where lp.id=r.product_id; insert into public.wfm_account_entitlements(user_id,club_id,plan_code,status,starts_at,ends_at,source,external_reference) values(r.requested_by,r.club_id,v_plan,'active',p_starts_at,p_ends_at,'license',p_agreement_reference); return v_id; end; $$;
grant execute on function public.create_license_agreement(uuid,text,timestamptz,timestamptz,jsonb,jsonb,jsonb,text) to authenticated; revoke execute on function public.create_license_agreement(uuid,text,timestamptz,timestamptz,jsonb,jsonb,jsonb,text) from anon,public;