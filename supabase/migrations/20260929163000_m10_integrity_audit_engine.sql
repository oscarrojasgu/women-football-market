create or replace function public.wfm_run_integrity_audit()
returns table (severity text, issue_code text, table_name text, record_id uuid, detail text)
language sql security definer set search_path = public, auth
as $$
with authorized as (
  select exists (select 1 from public.wfm_admins a where a.user_id = auth.uid()) as ok
), issues(severity,issue_code,table_name,record_id,detail) as (
  select 'error','player_missing_name','players',p.id,'Player has no name' from public.players p where nullif(trim(p.full_name),'') is null
  union all select 'warning','duplicate_player_name_dob','players',(array_agg(p.id))[1],'Duplicate player name + DOB: '||max(p.full_name)
    from public.players p where p.date_of_birth is not null group by lower(trim(p.full_name)),p.date_of_birth having count(*)>1
  union all select 'error','contract_bad_dates','contracts',c.id,'Contract end date precedes start date' from public.contracts c where c.start_date is not null and c.end_date is not null and c.end_date<c.start_date
  union all select 'error','contract_negative_salary','contracts',c.id,'Negative salary value' from public.contracts c where coalesce(c.annual_salary,0)<0 or coalesce(c.weekly_salary,0)<0 or coalesce(c.annual_salary_usd,0)<0 or coalesce(c.weekly_salary_usd,0)<0
  union all select 'warning','contract_missing_source','contracts',c.id,'Contract has no source' from public.contracts c where c.source_id is null
  union all select 'error','contract_confidence_without_source','contracts',c.id,'Contract confidence requires a source' from public.contracts c where c.confidence in ('verified','reported','estimated') and c.source_id is null
  union all select 'warning','contract_usd_without_conversion','contracts',c.id,'USD salary fields exist without a complete conversion record' from public.contracts c where (c.annual_salary_usd is not null or c.weekly_salary_usd is not null) and (c.exchange_rate_to_usd is null or c.conversion_date is null)
  union all select 'error','contract_overlap','contracts',c1.id,'Overlapping contracts for player '||c1.player_id::text from public.contracts c1 join public.contracts c2 on c2.player_id=c1.player_id and c2.id<>c1.id and coalesce(c1.start_date,'0001-01-01'::date)<=coalesce(c2.end_date,'9999-12-31'::date) and coalesce(c2.start_date,'0001-01-01'::date)<=coalesce(c1.end_date,'9999-12-31'::date) where c1.id<c2.id
  union all select 'error','salary_negative','salary_records',s.id,'Negative salary value' from public.salary_records s where coalesce(s.annual_salary,0)<0 or coalesce(s.weekly_salary,0)<0 or coalesce(s.annual_salary_usd,0)<0 or coalesce(s.weekly_salary_usd,0)<0
  union all select 'warning','salary_missing_source','salary_records',s.id,'Salary record has no source' from public.salary_records s where s.source_id is null
  union all select 'error','market_value_negative','market_values',m.id,'Negative market value' from public.market_values m where coalesce(m.market_value,0)<0 or coalesce(m.market_value_usd,0)<0
  union all select 'warning','market_value_missing_source','market_values',m.id,'Market value has no source' from public.market_values m where m.source_id is null
  union all select 'error','transfer_bad_clubs','transfers',t.id,'Transfer has identical from/to club' from public.transfers t where t.from_club_id is not null and t.to_club_id is not null and t.from_club_id=t.to_club_id
  union all select 'error','transfer_negative_fee','transfers',t.id,'Negative transfer fee' from public.transfers t where t.fee<0
  union all select 'warning','transfer_missing_source','transfers',t.id,'Transfer has no source' from public.transfers t where t.source_id is null
  union all select 'warning','source_missing_url','sources',s.id,'Source has no URL' from public.sources s where nullif(trim(s.url),'') is null
  union all select 'warning','source_missing_reliability','sources',s.id,'Source has no reliability classification' from public.sources s where s.reliability is null
)
select i.severity,i.issue_code,i.table_name,i.record_id,i.detail from issues i where (select ok from authorized) order by case i.severity when 'error' then 1 else 2 end,i.issue_code,i.record_id;
$$;
revoke all on function public.wfm_run_integrity_audit() from public;
grant execute on function public.wfm_run_integrity_audit() to authenticated;
