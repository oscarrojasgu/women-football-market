drop function if exists public.get_wfm_admin_visitor_activity(integer, timestamptz);

create function public.get_wfm_admin_visitor_activity(
  p_limit integer default 250,
  p_since timestamptz default now() - interval '7 days'
)
returns table (
  id uuid,
  session_id uuid,
  user_id uuid,
  email text,
  display_name text,
  account_type text,
  organization_name text,
  job_title text,
  club_id uuid,
  club_name text,
  agency_id uuid,
  agency_name text,
  agency_verification_status text,
  plan_code text,
  entitlement_status text,
  event_type text,
  path text,
  page_title text,
  referrer text,
  locale text,
  metadata jsonb,
  occurred_at timestamptz
)
language sql
security definer
set search_path = public, auth, private, pg_temp
stable
as $$
  select
    a.id,
    a.session_id,
    a.user_id,
    u.email,
    ap.display_name,
    ap.account_type,
    ap.organization_name,
    ap.job_title,
    ap.club_id,
    c.name as club_name,
    ag.id as agency_id,
    ag.name as agency_name,
    ag.verification_status as agency_verification_status,
    ent.plan_code,
    ent.status as entitlement_status,
    a.event_type,
    a.path,
    a.page_title,
    a.referrer,
    a.locale,
    a.metadata,
    a.occurred_at
  from public.wfm_visitor_activity a
  left join auth.users u on u.id = a.user_id
  left join public.account_profiles ap on ap.user_id = a.user_id
  left join public.clubs c on c.id = ap.club_id
  left join lateral (
    select aa.id, aa.name, aa.verification_status
    from public.agency_account_members aam
    join public.agency_accounts aa on aa.id = aam.agency_id
    where aam.user_id = a.user_id
      and aam.status = 'active'
    order by
      case when aam.role = 'admin' then 0 else 1 end,
      aa.created_at desc
    limit 1
  ) ag on true
  left join lateral (
    select e.plan_code, e.status
    from public.wfm_account_entitlements e
    where e.status = 'active'
      and (e.user_id = a.user_id or (e.club_id is not null and e.club_id = ap.club_id))
      and e.starts_at <= now()
      and (e.ends_at is null or e.ends_at >= now())
    order by
      case e.plan_code
        when 'data_license' then 1
        when 'professional' then 2
        when 'club' then 3
        when 'free' then 4
        else 5
      end,
      e.created_at desc
    limit 1
  ) ent on true
  where private.is_wfm_admin()
    and a.occurred_at >= p_since
  order by a.occurred_at desc
  limit greatest(1, least(coalesce(p_limit, 250), 1000));
$$;

revoke all on function public.get_wfm_admin_visitor_activity(integer, timestamptz) from public, anon, authenticated;
grant execute on function public.get_wfm_admin_visitor_activity(integer, timestamptz) to authenticated;
