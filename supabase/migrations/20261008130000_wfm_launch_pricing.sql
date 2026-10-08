update public.wfm_access_plans set monthly_price_usd = 0, annual_price_usd = 0, updated_at = now() where code = 'free';
update public.wfm_access_plans set monthly_price_usd = 299, annual_price_usd = 2990, updated_at = now() where code = 'club';
update public.wfm_access_plans set monthly_price_usd = 149, annual_price_usd = 1490, updated_at = now() where code = 'professional';
update public.wfm_access_plans set monthly_price_usd = null, annual_price_usd = null, updated_at = now() where code = 'data_license';
