create or replace function public.wfm_provenance_coverage()
returns table (
  source_count bigint,
  linked_contracts bigint,
  linked_transfers bigint,
  linked_stats bigint,
  linked_market_values bigint,
  total_linked_records bigint,
  records_missing_source bigint,
  sources_missing_url bigint,
  sources_missing_accessed_at bigint,
  sources_missing_published_at bigint,
  records_with_reliable_source bigint,
  coverage_percent numeric
)
language sql
security definer
set search_path = public
as $$
  with linked as (
    select 'contract' kind, c.source_id from public.contracts c
    union all select 'transfer', t.source_id from public.transfers t
    union all select 'stat', s.source_id from public.player_stats s
    union all select 'market_value', m.source_id from public.market_values m
  ),
  totals as (
    select count(*)::bigint total_linked_records,
           count(*) filter (where source_id is null)::bigint records_missing_source
    from linked
  ),
  counts as (
    select
      (select count(*) from public.sources)::bigint source_count,
      (select count(*) from public.contracts where source_id is not null)::bigint linked_contracts,
      (select count(*) from public.transfers where source_id is not null)::bigint linked_transfers,
      (select count(*) from public.player_stats where source_id is not null)::bigint linked_stats,
      (select count(*) from public.market_values where source_id is not null)::bigint linked_market_values,
      (select count(*) from public.sources where url is null or btrim(url)='')::bigint sources_missing_url,
      (select count(*) from public.sources where accessed_at is null)::bigint sources_missing_accessed_at,
      (select count(*) from public.sources where published_at is null)::bigint sources_missing_published_at
  )
  select c.source_count,c.linked_contracts,c.linked_transfers,c.linked_stats,c.linked_market_values,
         t.total_linked_records,t.records_missing_source,c.sources_missing_url,c.sources_missing_accessed_at,
         c.sources_missing_published_at,
         (t.total_linked_records-t.records_missing_source)::bigint,
         case when t.total_linked_records=0 then 0
              else round(((t.total_linked_records-t.records_missing_source)::numeric/t.total_linked_records::numeric)*100,1) end
  from counts c cross join totals t;
$$;

revoke all on function public.wfm_provenance_coverage() from public, anon, authenticated;
grant execute on function public.wfm_provenance_coverage() to authenticated;