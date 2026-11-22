-- Launch-prep SQL design for secure representation-request evidence resubmission.
-- REVIEW ONLY: this file is not a Supabase migration and has NOT been applied.
-- Create a timestamped migration with the Supabase CLI after local validation.

create or replace function private.resubmit_representation_request_impl(
  p_request_id uuid,
  p_evidence_url text,
  p_notes text,
  p_relationship_type text
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_request_user_id uuid;
  v_latest_action text;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if nullif(trim(p_evidence_url), '') is null then
    raise exception 'Evidence URL is required';
  end if;

  if nullif(trim(p_notes), '') is null then
    raise exception 'Notes are required';
  end if;

  if p_evidence_url !~* '^https?://[^[:space:]]+$' then
    raise exception 'Evidence URL must use HTTP or HTTPS';
  end if;

  if p_relationship_type is null
     or p_relationship_type not in ('player', 'agent', 'club', 'agency') then
    raise exception 'Invalid relationship type';
  end if;

  select r.user_id
    into v_request_user_id
  from public.representation_requests r
  where r.id = p_request_id
    and r.status = 'pending'
    and r.reviewed_at is not null
  for update;

  if not found or v_request_user_id is distinct from v_user_id then
    raise exception 'Returned representation request not found';
  end if;

  select rr.action
    into v_latest_action
  from public.representation_reviews rr
  where rr.request_id = p_request_id
    and rr.user_id = v_user_id
  order by rr.created_at desc, rr.id desc
  limit 1;

  if v_latest_action is distinct from 'needs_evidence' then
    raise exception 'This request is not awaiting additional evidence';
  end if;

  update public.representation_requests
  set evidence_url = trim(p_evidence_url),
      notes = trim(p_notes),
      relationship_type = p_relationship_type,
      reviewed_by = null,
      reviewed_at = null,
      updated_at = now()
  where id = p_request_id
    and user_id = v_user_id
    and status = 'pending';
end;
$function$;

revoke all on function private.resubmit_representation_request_impl(uuid, text, text, text)
  from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.resubmit_representation_request_impl(uuid, text, text, text)
  to authenticated;

create or replace function public.resubmit_representation_request(
  p_request_id uuid,
  p_evidence_url text,
  p_notes text,
  p_relationship_type text
)
returns void
language sql
security invoker
set search_path = ''
as $function$
  select private.resubmit_representation_request_impl(
    p_request_id,
    p_evidence_url,
    p_notes,
    p_relationship_type
  );
$function$;

revoke all on function public.resubmit_representation_request(uuid, text, text, text)
  from public, anon;
grant execute on function public.resubmit_representation_request(uuid, text, text, text)
  to authenticated;
