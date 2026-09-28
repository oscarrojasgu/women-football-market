# Phase 7 — Production & Launch Readiness

Status: In Progress

## Completed in this launch-readiness pass

### Database security
- Converted `public.player_season_intelligence` to a security-invoker view.
- Converted `public.player_global_peer_benchmarks` to a security-invoker view.
- Removed the duplicate `player_stats` player/season index.
- Re-ran Supabase security and performance advisors after the changes.

### Application security review
- Confirmed the browser client uses only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- No `service_role` or service-role secret was found in the GitHub code search.
- Reviewed Edge Functions using secret authentication and confirmed the ingestion functions use server-side Supabase access rather than exposing privileged credentials to the browser.

### SEO / discovery
- Added `app/robots.ts`.
- Added `app/sitemap.ts` with public player and club URLs.
- Excluded admin, API, contributor, scouting, and comparison areas from search indexing.
- Expanded global metadata, Open Graph metadata, Twitter metadata, canonical metadata base, and the title template.

### Dependency stability
- Replaced direct `latest` dependency tags with pinned versions for Next.js, React, Supabase, TypeScript, React type packages, Tailwind CSS, and PostCSS.
- A lockfile is still recommended before final production launch because transitive dependencies remain resolver-controlled.

## Current Supabase findings

### Remaining security item
Supabase reports leaked-password protection as disabled. This is an Auth configuration setting and should be enabled in Supabase Auth before production launch.

### Remaining performance findings
The advisor still reports:
- unindexed foreign keys
- unused indexes
- multiple permissive RLS policies

These are performance/maintenance findings rather than current security failures. They should be reviewed against actual WFM query patterns before indexes or policies are removed or consolidated.

## Production verification still required

- Run the production build after the dependency pinning and SEO changes.
- Confirm Vercel deployment is healthy.
- Test public player and club pages.
- Test authenticated scouting workflows.
- Test admin/contributor/verification boundaries with separate accounts.
- Confirm sitemap and robots endpoints.
- Enable leaked-password protection.
- Review final Supabase advisors.
- Perform final mobile and desktop smoke test.

## Launch gate

WFM should not be treated as fully production-ready until the build/deployment verification and Auth configuration checks above are completed.
