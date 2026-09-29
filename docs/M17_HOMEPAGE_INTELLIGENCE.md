# M17 — Homepage Intelligence Layer

## Status

M17 is active. The homepage now combines WFM transfer/contract intelligence with a source-linked news module.

## News feed

The public homepage reads from `public.wfm_news_items`.

News records retain:
- original article URL
- publisher
- publication timestamp
- short source-provided summary when available
- source confidence
- active/publication state

WFM does not republish full third-party articles. The homepage links users to the original source.

## Approved source registry

`public.wfm_news_sources` controls which RSS/Atom feeds may be ingested.

The first production source is BBC Sport Women's Football:
`https://feeds.bbci.co.uk/sport/football/womens/rss.xml`

The source was verified as a women's-football RSS feed before activation. Additional sources should be added through the admin News Ingestion page and reviewed before activation.

## Automated ingestion

Supabase `pg_cron` runs `wfm-news-rss-ingestion` every 30 minutes.

The cron job calls the dedicated `ingest-news-rss-cron` Edge Function through `pg_net`.

Security model:
- the Edge Function uses Supabase publishable-key authentication at the gateway
- the cron request also carries a separate random internal token stored in a protected database table
- the Edge Function uses the server-only Supabase secret-key environment to perform privileged database writes
- the internal token is never stored in the repository
- the publishable key used by cron is stored in Supabase Vault, not source control
- public users cannot read the internal cron-secret table through RLS

The scheduled function is idempotent by article URL: existing URLs are updated, new URLs are inserted.

Feed requests use an 8-second timeout so a slow source cannot hold the ingestion job indefinitely.

## Production verification

The first manual scheduled-style invocation returned:
- 1 active source
- 1 feed successfully fetched
- 20 items seen
- 20 items inserted
- 0 errors

The production cron job is active on a 30-minute schedule.

## Freshness model

Each source records:
- last checked time
- last successful fetch time
- last error

This gives the admin News Ingestion page enough information to identify stale or failing sources without automatically publishing unsupported content.

## Next M17 work

- Add and validate additional high-quality women's-football sources.
- Add stale-source visibility/alerts.
- Add competition/league story modules only after source coverage is reliable.
- Keep external editorial content clearly separated from factual WFM database intelligence.
