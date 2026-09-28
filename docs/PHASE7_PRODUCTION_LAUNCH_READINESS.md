# Phase 7 — Production & Launch Readiness

Status: In Progress — verification gate remains open

## Completed in this launch-readiness pass

### Database security
- Converted `public.player_season_intelligence` to a security-invoker view.
- Converted `public.player_global_peer_benchmarks` to a security-invoker view.
- Removed the duplicate `player_stats` player/season index.
- Re-ran Supabase security and performance advisors.
- Confirmed the remaining Auth security warning is leaked-password protection, which is unavailable on the current Supabase plan.

### Database performance
- Added indexes for previously unindexed foreign keys identified by the Supabase performance advisor.
- Consolidated overlapping permissive SELECT policies across contributor, verification, claims, representation, and submission tables.
- Split admin write access for salary-exchange and transfer-competition data into action-specific policies so public read access does not require an overlapping SELECT policy.
- Preserved the existing admin authorization predicate based on `wfm_admins`.
- Re-ran the performance advisor after RLS changes; the multiple-permissive-policy warning is cleared.
- Supabase still reports unused indexes. These are retained for now because WFM is actively expanding and removing them solely from current usage counters could create future regressions.

### Application security review
- Confirmed the browser client uses only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- No `service_role` or service-role secret was found in the GitHub code search.
- Reviewed Edge Functions using secret authentication and confirmed privileged Supabase access remains server-side.

### SEO / discovery
- Added `app/robots.ts`.
- Added `app/sitemap.ts` with public player and club URLs.
- Excluded admin, API, contributor, scouting, and comparison areas from search indexing.
- Expanded global metadata, Open Graph metadata, Twitter metadata, canonical metadata base, and title templates.

### Dependency stability
- Replaced direct `latest` dependency tags with pinned versions.
- Added a GitHub Actions production-build workflow.
- Added route-level and global production error boundaries (`app/error.tsx` and `app/global-error.tsx`).
- Added a custom root `app/not-found.tsx` page.
- A committed lockfile is still recommended before final production launch because the repository currently has no npm lockfile.

## Current Supabase findings

### Auth configuration
Leaked-password protection remains unavailable on the current Supabase plan. Enable it if WFM moves to a plan that supports the feature.

### Performance
The remaining advisor findings are unused indexes. They are informational and are not being removed blindly.

## Automated verification

GitHub Actions now runs:
- dependency installation
- `npm run build`

on pushes and pull requests targeting `main`, plus manual workflow dispatch.

A successful workflow run is still required before treating the production build as verified.

## Production verification still required

- Verify the new GitHub Actions production build succeeds; the workflow has been added but a verified successful run is not yet available through the current GitHub connector.
- Confirm the Vercel deployment is healthy.
- Test public player and club pages.
- Test authenticated scouting workflows.
- Test admin/contributor/verification boundaries with separate accounts.
- Confirm sitemap and robots endpoints in the deployed environment.
- Perform final mobile and desktop smoke tests.
- Add/commit the npm lockfile before final production launch.

## Launch gate

WFM should not be treated as fully production-ready until automated build verification, deployment verification, authenticated boundary testing, and final browser smoke tests are complete.
