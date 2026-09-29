# Phase 7 — Production & Launch Readiness

Status: In Progress — final production gate remains open

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
- M8 added structured data for public players, clubs, and competitions.

### Dependency stability
- Replaced direct `latest` dependency tags with pinned versions.
- Added a GitHub Actions production-build workflow.
- Added route-level and global production error boundaries (`app/error.tsx` and `app/global-error.tsx`).
- Added a custom root `app/not-found.tsx` page.
- A committed npm lockfile is still required before the final production launch gate is closed.

## Current Supabase findings

### Auth configuration
Leaked-password protection remains unavailable on the current Supabase plan. Enable it if WFM moves to a plan that supports the feature.

### Performance
The remaining advisor findings are unused indexes. They are informational and are not being removed blindly.

## Automated verification

The production-build workflow runs dependency installation and `npm run build` on pushes and pull requests targeting `main`, plus manual workflow dispatch.

### Latest verified build
The latest M8 production-build workflow completed successfully for commit `a407c9717794def7c97b3f4ba0b90b5de57b55dd` on September 29, 2026.

This verifies that the M8 code currently on `main` passes the repository's automated production build.

## Deployment verification

The latest M8 commit has a successful Vercel commit status.

Live browser verification remains separate from the deployment status and still needs to be completed for:
- public player pages
- public club pages
- public competition pages
- `/robots.txt`
- `/sitemap.xml`
- authenticated scouting workflows
- admin/contributor/verification boundaries
- final mobile and desktop smoke tests

The available verification environment could not directly fetch the Vercel production hostname, so those live-route checks are intentionally not marked complete.

## Production verification still required

- Add and commit the npm lockfile.
- Complete live public-route/browser verification.
- Test authenticated scouting workflows.
- Test admin/contributor/verification boundaries with separate accounts.
- Perform final mobile and desktop smoke tests.
- Re-run the complete production gate after the lockfile is committed.

## Launch gate

WFM should not be treated as fully production-ready until the remaining live-route, authenticated-boundary, browser smoke-test, and lockfile requirements are complete.
