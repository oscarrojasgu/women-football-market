create table if not exists public.wfm_sales_opportunities (
  user_id uuid primary key references auth.users(id) on delete cascade,
  pipeline_status text not null default 'new' check (pipeline_status in ('new','contacted','qualified','proposal','customer','closed')),
  notes text not null default '',
  next_follow_up_at timestamptz,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

alter table public.wfm_sales_opportunities enable row level security;

revoke all on table public.wfm_sales_opportunities from anon, authenticated;
grant select, insert, update, delete on table public.wfm_sales_opportunities to authenticated;

drop policy if exists "WFM admins can read sales opportunities" on public.wfm_sales_opportunities;
create policy "WFM admins can read sales opportunities"
on public.wfm_sales_opportunities for select to authenticated
using (private.is_wfm_admin());

drop policy if exists "WFM admins can create sales opportunities" on public.wfm_sales_opportunities;
create policy "WFM admins can create sales opportunities"
on public.wfm_sales_opportunities for insert to authenticated
with check (private.is_wfm_admin() and updated_by = (select auth.uid()));

drop policy if exists "WFM admins can update sales opportunities" on public.wfm_sales_opportunities;
create policy "WFM admins can update sales opportunities"
on public.wfm_sales_opportunities for update to authenticated
using (private.is_wfm_admin())
with check (private.is_wfm_admin() and updated_by = (select auth.uid()));

drop policy if exists "WFM admins can delete sales opportunities" on public.wfm_sales_opportunities;
create policy "WFM admins can delete sales opportunities"
on public.wfm_sales_opportunities for delete to authenticated
using (private.is_wfm_admin());

create index if not exists wfm_sales_opportunities_status_idx on public.wfm_sales_opportunities(pipeline_status);
create index if not exists wfm_sales_opportunities_follow_up_idx on public.wfm_sales_opportunities(next_follow_up_at);
