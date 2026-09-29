-- M17: automated source-linked news ingestion
create extension if not exists pg_cron;
create extension if not exists pg_net;

create schema if not exists private;

create table if not exists private.wfm_internal_cron_secrets (
  name text primary key,
  token text not null,
  created_at timestamptz not null default now()
);

insert into private.wfm_internal_cron_secrets (name, token)
values ('news_ingestion', encode(gen_random_bytes(32), 'hex'))
on conflict (name) do nothing;

create table if not exists public.wfm_internal_cron_secrets (
  name text primary key,
  token text not null,
  created_at timestamptz not null default now()
);

insert into public.wfm_internal_cron_secrets (name, token)
select name, token from private.wfm_internal_cron_secrets
on conflict (name) do nothing;

alter table public.wfm_internal_cron_secrets enable row level security;
revoke all on public.wfm_internal_cron_secrets from public, anon, authenticated;

insert into public.wfm_news_sources (publisher, feed_url, active)
values (
  'BBC Sport — Women''s Football',
  'https://feeds.bbci.co.uk/sport/football/womens/rss.xml',
  true
)
on conflict (feed_url) do update
set publisher=excluded.publisher, active=true, updated_at=now();

select cron.schedule(
  'wfm-news-rss-ingestion',
  '*/30 * * * *',
  $job$
    select net.http_post(
      url := 'https://ypdamswhioaoqbersxjk.supabase.co/functions/v1/ingest-news-rss-cron',
      headers := jsonb_build_object(
        'Content-Type','application/json',
        'apikey',(select decrypted_secret from vault.decrypted_secrets where name='wfm_publishable_key'),
        'x-wfm-internal-token',(select token from public.wfm_internal_cron_secrets where name='news_ingestion')
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 10000
    ) as request_id;
  $job$
);
