# WFM Development Roadmap

This file is the working source of truth for the Women’s Football Market build.

## Current phase: PHASE 3 — Player intelligence

Phase 1 data foundation is complete. The database is now structured, normalized, sourced where evidence exists, and explicit about information that cannot be verified from available sources.

## PHASE 1 — Data foundation — COMPLETE

- [x] Audit every core table and relationship
- [x] Standardize player records
- [x] Standardize club records
- [x] Standardize contract and salary records
- [x] Standardize market-value records
- [x] Standardize transfer records
- [x] Standardize statistics records
- [x] Ensure photos and club logos have source/credit/licensing context
- [x] Ensure every important factual record has a source and confidence level where the schema supports provenance
- [x] Identify and resolve duplicate/inconsistent records
- [x] Establish consistent USD conversion fields while preserving original currency
- [x] Keep database schema documentation synchronized with the live Supabase database

### Phase 1 completion notes

- 167 players
- 66 clubs
- 59 source records
- 169 contract records
- 90 transfer records
- 103 2026 salary-history snapshots
- 145 market-value records
- 205 player-stat records
- 13 national-team-stat records
- 0 duplicate player names
- 0 duplicate club names
- 0 contracts missing source
- 0 transfers missing source
- 0 salary records missing source
- 0 contracts missing USD conversion
- 0 market values missing USD conversion
- 0 player records missing photo/asset metadata
- 0 club records missing logo/asset metadata

Where a source page is dynamic and does not publish a reliable publication date, published_at remains null rather than using an invented date. The same principle applies to contract start/end dates that cannot be established from evidence. These are intentional unknowns, not fabricated values.

For image rights, records with legacy assets now explicitly identify unknown rights provenance; records without a defensible image use a WFM-generated placeholder rather than an unverified third-party image.

Security cleanup completed:
- Restricted the bootstrap owner function from anonymous/authenticated execution.
- Added admin-only RLS management for photo permissions.
- Supabase security review has no remaining public SECURITY DEFINER execution warning.
- Leaked password protection remains disabled and is still an outstanding Supabase Auth security recommendation.

## PHASE 2 — UX redesign

Make Players, Clubs, Transfers, Contracts, and Salaries feel like one coherent product.

### Phase 2 completed foundation

- [x] Global shared desktop navigation
- [x] Active navigation state
- [x] Centralized mobile navigation remains the responsive navigation layer
- [x] Homepage player search uses database records only; no hardcoded sample players
- [x] Compensation displays use normalized USD conversion fields where available
- [x] Player directory has unified search across player, club, league, nationality, position, and agency
- [x] Player directory has position and nationality filters
- [x] Player directory has clear-filters behavior and explicit result counts
- [x] Player directory links directly into player profiles
- [x] Clubs directory redesigned as a connected club intelligence view
- [x] Clubs directory supports search across club, league, country, and organization type
- [x] Clubs directory supports league, country, and organization-type filters
- [x] Clubs directory connects active roster size, known payroll, squad market value, and transfer activity
- [x] Clubs directory supports sorting by roster, payroll, market value, and name
- [x] Clubs directory links directly into club profiles
- [x] Contracts page redesigned around active status and contract-expiry intelligence
- [x] Contracts page provides 90-day, 6-month, 1-year, 12+ month, expired, and unknown expiry views
- [x] Contracts page connects player, club, league, position, salary, expiry date, and confidence
- [x] Contracts page provides active-contract and known-payroll summary metrics
- [x] Contracts page supports clearable search and multi-dimensional filtering
- [x] Transfers redesigned as a chronological market feed
- [x] Transfers connect player profiles, club profiles, transfer type, fee, date, and confidence
- [x] Transfers support search across player, club, league, nationality, and position
- [x] Transfers support transfer-type, league, year, and confidence filters
- [x] Transfers provide recent-market, permanent/free/loan, known-fee, and verified summary metrics
- [x] Transfers provide clear-filters behavior and explicit result counts
- [x] Salaries redesigned around comparable compensation data
- [x] Salaries normalize annual and weekly figures to USD while retaining original currency context
- [x] Salaries provide median, average, highest, league coverage, and verified-record summary metrics
- [x] Salaries support search, league, salary-band, and confidence filters
- [x] Salaries support salary/player/club sorting
- [x] Salaries provide clear-filters behavior and explicit result counts
- [x] Dedicated iPhone responsive pass added for Phase 2 salary and transfer views
- [x] Make player profiles the central destination connecting contracts, salary, transfers, values, statistics, and sources
- [x] Final responsive/mobile pass across every Phase 2 route

## PHASE 3 — Player intelligence

Build comparisons, trends, market-value context, contract context, and salary context.

### Phase 3 milestone 1 completed

- [x] Player profiles now include performance-intelligence cards using recorded season data
- [x] Player profiles now show season output trends (goals + assists) and playing-time context
- [x] Player profiles now show descriptive per-90 role metrics from recorded minutes
- [x] Player profiles now show recorded market-value trajectory context without forecasting
- [x] Added side-by-side Player Comparison route using shared WFM performance, contract and market-value fields
- [x] Added responsive/mobile styling for Phase 3 intelligence and comparison views

### Phase 3 milestone 2 completed

- [x] Added database-backed player-season intelligence view aggregating recorded statistics and per-90 metrics
- [x] Added database-backed league/position peer benchmark view with a minimum five-player eligible peer group
- [x] Added league and position context to player intelligence
- [x] Added percentile context for role metrics without converting percentiles into player ratings
- [x] Added richer recorded market-value history visualization
- [x] Expanded comparison metrics by attacking, creation, and defensive role outputs
- [x] Added contract-expiry and salary context to comparison views
- [x] Kept derived intelligence in database views rather than duplicating source records in a new table

### Phase 3 milestone 3 completed

- [x] Added tracked data-update runs with provider, run type, status, record counts, timing, and error metadata
- [x] Added stat ingestion fields for match/source-event provenance and update timestamps
- [x] Added duplicate-safe player-stat upsert keys for player/club/season/competition
- [x] Added a secured Supabase Edge Function for validated player-stat ingestion
- [x] Added repository configuration for the ingestion function
- [x] Kept ingestion separate from the public player-facing database workflow so future providers can feed the same pipeline
- [x] Verified the live ingestion function is deployed and active
- [x] Verified the live database contains the update-run table and new player-stat tracking fields

Important limitation:
- [ ] A real external statistics provider/API has not been selected or connected yet, so the system does not claim to automatically import every match. Once a provider is selected, Supabase Cron can call the ingestion function on a schedule and the existing intelligence views will reflect accepted updates automatically.

### Phase 3 next

- [ ] Connect the first reliable women’s-football statistics provider/API
- [ ] Add scheduled ingestion after the provider is validated
- [ ] Build deeper scouting-oriented intelligence after the comparison foundation is stable
- [ ] Add broader competition/league coverage to strengthen peer samples
- [ ] Add historical contract and salary trend context where source coverage supports it

## PHASE 4 — Verification

Enable players, agents, clubs, and eventually journalists/scouts to contribute and verify information.

## PHASE 5 — Scouting tools

Build advanced filters, saved searches, player comparison, and shortlists.

## PHASE 6 — Global women’s football

Systematically expand beyond the initial NWSL coverage and build global league coverage.

## Development rule

Do not randomly add isolated features. Work through the current phase systematically, preserve completed work, and avoid duplicating existing systems or records.
