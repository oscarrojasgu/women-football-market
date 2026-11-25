\set ON_ERROR_STOP on

create role anon;
create role authenticated;
create schema auth;
create schema private;

create or replace function auth.uid()
returns uuid
language sql
stable
as $function$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$function$;

grant usage on schema auth to public;

create table public.wfm_admins (user_id uuid primary key);

create table public.representation_requests (
  id uuid primary key,
  user_id uuid not null,
  player_id uuid,
  status text not null,
  relationship_type text not null,
  evidence_url text,
  notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  verification_method text,
  source_id uuid,
  updated_at timestamptz not null default now()
);

create table public.representation_reviews (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.representation_requests(id),
  user_id uuid not null,
  reviewer_id uuid not null,
  action text not null,
  status_before text,
  status_after text,
  verification_method text,
  evidence_url text,
  source_id uuid,
  notes text,
  created_at timestamptz not null default now()
);

-- Minimal signature fixture: the production review RPC is defined by an earlier
-- migration not included in this focused test harness. The follow-up migration
-- only changes its EXECUTE grants; RLS is exercised directly below.
create function public.review_representation_request(
  p_request_id uuid,
  p_action text,
  p_verification_method text default null,
  p_evidence_url text default null,
  p_source_id uuid default null,
  p_notes text default null
)
returns void
language plpgsql
as $function$
declare r public.representation_requests%rowtype;
begin
  if not exists (select 1 from public.wfm_admins where user_id = auth.uid()) then
    raise exception 'WFM admin access required';
  end if;
  if p_action not in ('approved','rejected','revoked','needs_evidence') then
    raise exception 'Invalid review action';
  end if;

  select * into r from public.representation_requests where id = p_request_id for update;
  if not found then raise exception 'Representation request not found'; end if;

  update public.representation_requests
  set status = case when p_action='needs_evidence' then 'pending' else p_action end,
      verification_method = coalesce(p_verification_method, verification_method),
      evidence_url = coalesce(p_evidence_url, evidence_url),
      source_id = coalesce(p_source_id, source_id),
      notes = coalesce(p_notes, notes),
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
  where id = p_request_id;

  insert into public.representation_reviews
    (request_id,user_id,reviewer_id,action,status_before,status_after,verification_method,evidence_url,source_id,notes)
  values
    (r.id,r.user_id,auth.uid(),p_action,r.status,
      case when p_action='needs_evidence' then 'pending' else p_action end,
      p_verification_method,p_evidence_url,p_source_id,p_notes);
end;
$function$;

\i :migration_file
\i :review_migration_file

insert into public.representation_requests
  (id, user_id, status, relationship_type, evidence_url, notes, reviewed_at)
values
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'pending', 'player', 'https://old.example/evidence', 'old evidence', now()),
  ('00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'pending', 'agent', 'https://old.example/evidence', 'old evidence', now()),
  ('00000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', 'pending', 'club', 'https://old.example/evidence', 'old evidence', now()),
  ('00000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'pending', 'agency', 'https://old.example/evidence', 'old evidence', now()),
  ('00000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 'pending', 'player', 'https://old.example/evidence', 'old evidence', now());

insert into public.representation_reviews (id, request_id, user_id, reviewer_id, action)
values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000009', 'needs_evidence'),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000009', 'approved'),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', '90000000-0000-0000-0000-000000000009', 'needs_evidence'),
  ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000009', 'needs_evidence'),
  ('00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000009', 'needs_evidence');

-- A returned request owned by the authenticated user can be resubmitted.
do $test$
declare
  v_request public.representation_requests%rowtype;
begin
  perform set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

  perform public.resubmit_representation_request(
    '00000000-0000-0000-0000-000000000001',
    'https://new.example/evidence',
    'Updated evidence supplied by the claimant',
    'agent'
  );

  select * into v_request
  from public.representation_requests
  where id = '00000000-0000-0000-0000-000000000001';

  if v_request.evidence_url <> 'https://new.example/evidence'
     or v_request.notes <> 'Updated evidence supplied by the claimant'
     or v_request.relationship_type <> 'agent'
     or v_request.reviewed_at is not null
     or v_request.reviewed_by is not null then
    raise exception 'Successful resubmission did not update the expected fields';
  end if;
end;
$test$;

-- A claimant cannot resubmit another user's request.
do $test$
begin
  perform set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
  begin
    perform public.resubmit_representation_request(
      '00000000-0000-0000-0000-000000000003',
      'https://new.example/evidence',
      'Unauthorized attempt',
      'player'
    );
    raise exception 'TEST_FAILURE: another user was able to resubmit this request';
  exception when others then
    if sqlerrm like 'TEST_FAILURE:%' then raise; end if;
  end;
end;
$test$;

-- Only the latest Needs evidence review action permits resubmission.
do $test$
begin
  perform set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
  begin
    perform public.resubmit_representation_request(
      '00000000-0000-0000-0000-000000000002',
      'https://new.example/evidence',
      'Request was not returned for evidence',
      'player'
    );
    raise exception 'TEST_FAILURE: a non-returned request was resubmitted';
  exception when others then
    if sqlerrm like 'TEST_FAILURE:%' then raise; end if;
  end;
end;
$test$;

-- Unsafe evidence URL schemes are rejected.
do $test$
begin
  perform set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
  begin
    perform public.resubmit_representation_request(
      '00000000-0000-0000-0000-000000000004',
      'javascript:alert(1)',
      'Invalid URL test',
      'player'
    );
    raise exception 'TEST_FAILURE: unsafe URL was accepted';
  exception when others then
    if sqlerrm like 'TEST_FAILURE:%' then raise; end if;
  end;
end;
$test$;

-- Missing or unsupported relationship types are rejected.
do $test$
begin
  perform set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
  begin
    perform public.resubmit_representation_request(
      '00000000-0000-0000-0000-000000000005',
      'https://new.example/evidence',
      'Invalid relationship test',
      null
    );
    raise exception 'TEST_FAILURE: null relationship type was accepted';
  exception when others then
    if sqlerrm like 'TEST_FAILURE:%' then raise; end if;
  end;
end;
$test$;

-- Public RPC is invoker-only; execution is limited to authenticated users.
do $test$
begin
  if has_function_privilege('anon', 'public.resubmit_representation_request(uuid,text,text,text)', 'EXECUTE') then
    raise exception 'Anonymous users can execute the public resubmission RPC';
  end if;
  if not has_function_privilege('authenticated', 'public.resubmit_representation_request(uuid,text,text,text)', 'EXECUTE') then
    raise exception 'Authenticated users cannot execute the public resubmission RPC';
  end if;
  if has_function_privilege('anon', 'private.resubmit_representation_request_impl(uuid,text,text,text)', 'EXECUTE') then
    raise exception 'Anonymous users can execute the private implementation';
  end if;
  if (select prosecdef from pg_proc where oid = 'public.resubmit_representation_request(uuid,text,text,text)'::regprocedure) then
    raise exception 'Public wrapper must remain SECURITY INVOKER';
  end if;
end;
$test$;


-- Exercise the admin-only review audit RLS policy.
insert into public.wfm_admins (user_id)
values ('90000000-0000-0000-0000-000000000009');

alter table public.representation_reviews enable row level security;
alter table public.representation_requests enable row level security;
alter table public.wfm_admins enable row level security;

create policy "Admins can view their own admin record"
on public.wfm_admins for select to authenticated
using (auth.uid() = user_id);

create policy "Users and admins can view representation requests"
on public.representation_requests for select to authenticated
using (
  auth.uid() = user_id
  or exists (select 1 from public.wfm_admins a where a.user_id = auth.uid())
);

create policy "Admins can update representation requests"
on public.representation_requests for update to authenticated
using (exists (select 1 from public.wfm_admins a where a.user_id = auth.uid()))
with check (exists (select 1 from public.wfm_admins a where a.user_id = auth.uid()));

grant select, update on public.representation_requests to authenticated;
grant select on public.wfm_admins to authenticated;
grant insert on public.representation_reviews to authenticated;

set role authenticated;
select set_config('request.jwt.claim.sub', '90000000-0000-0000-0000-000000000009', false);
select public.review_representation_request(
  '00000000-0000-0000-0000-000000000002',
  'approved',
  null,
  null,
  null,
  'Reviewed by the authorized administrator'
);
reset role;

do $test$
begin
  if not exists (
    select 1 from public.representation_reviews
    where request_id = '00000000-0000-0000-0000-000000000002'
      and reviewer_id = '90000000-0000-0000-0000-000000000009'
      and action = 'approved'
      and status_before = 'pending'
      and status_after = 'approved'
  ) then
    raise exception 'Review RPC did not write the expected audit row';
  end if;
end;
$test$;

set role authenticated;
select set_config('request.jwt.claim.sub', '80000000-0000-0000-0000-000000000008', false);
do $test$
begin
  begin
    insert into public.representation_reviews
      (id, request_id, user_id, reviewer_id, action, status_before, status_after)
    values
      ('00000000-0000-0000-0000-000000000202',
       '00000000-0000-0000-0000-000000000002',
       '10000000-0000-0000-0000-000000000001',
       '80000000-0000-0000-0000-000000000008',
       'approved', 'pending', 'approved');
    raise exception 'TEST_FAILURE: non-admin inserted a review audit';
  exception when others then
    if sqlerrm like 'TEST_FAILURE:%' then raise; end if;
  end;
end;
$test$;

do $test$
begin
  begin
    perform public.review_representation_request(
      '00000000-0000-0000-0000-000000000002',
      'approved',
      null,
      null,
      null,
      'This call must be rejected for a non-admin'
    );
    raise exception 'TEST_FAILURE: non-admin executed the review RPC';
  exception when others then
    if sqlerrm like 'TEST_FAILURE:%' then raise; end if;
    if sqlerrm not like '%WFM admin access required%' then raise; end if;
  end;
end;
$test$;
reset role;

set role authenticated;
select set_config('request.jwt.claim.sub', '90000000-0000-0000-0000-000000000009', false);
do $test$
begin
  begin
    insert into public.representation_reviews
      (id, request_id, user_id, reviewer_id, action, status_before, status_after)
    values
      ('00000000-0000-0000-0000-000000000203',
       '00000000-0000-0000-0000-000000000002',
       '20000000-0000-0000-0000-000000000002',
       '90000000-0000-0000-0000-000000000009',
       'approved', 'pending', 'approved');
    raise exception 'TEST_FAILURE: mismatched claimant audit was inserted';
  exception when others then
    if sqlerrm like 'TEST_FAILURE:%' then raise; end if;
  end;
end;
$test$;
reset role;

do $test$
begin
  if has_function_privilege('anon', 'public.review_representation_request(uuid,text,text,text,uuid,text)', 'EXECUTE') then
    raise exception 'Anonymous users can execute the review RPC';
  end if;
  if not has_function_privilege('authenticated', 'public.review_representation_request(uuid,text,text,text,uuid,text)', 'EXECUTE') then
    raise exception 'Authenticated users cannot execute the review RPC';
  end if;
end;
$test$;

select 'representation request and review audit SQL tests passed' as result;
