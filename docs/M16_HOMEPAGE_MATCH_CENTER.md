# M16 — Homepage Match Center & Live Score Ticker

Status: Implementation complete — provider configuration and first sync remain operational setup.

## Objective

Turn the WFM homepage into a living football entry point without replacing the existing public database pages.

The first M16 feature is a compact horizontal Match Center ticker that can show upcoming fixtures, live scores, halftime states and completed results.

## Architecture

Provider → Edge Function → Supabase match tables → public RLS → homepage ticker

### Public table

`public.wfm_match_fixtures`

Stores provider-sourced factual fixture information:

- provider / external match ID
- competition
- season
- teams
- kickoff
- status
- score
- venue
- source update timestamp
- confidence

Public users can read fixture rows. Only WFM admins can mutate them.

### Provider allowlist

`public.wfm_match_competitions`

WFM admins explicitly configure which provider competition IDs are permitted for publication. This prevents a broad provider fixture feed from accidentally mixing men's or unrelated competitions into the women's homepage.

### Sync function

`sync-sportmonks-match-fixtures`

The Supabase Edge Function:

- reads `SPORTMONKS_TOKEN` server-side
- reads the active competition allowlist
- requests fixtures for a configured date range
- filters to the allowlisted competition IDs
- stores/upserts fixture and score data
- records the update run
- reports inserted, updated and rejected records
- does not expose the provider token to the browser

Sportmonks documents date-range fixture endpoints and fixture includes for participants, scores, state, league and season. citeturn1search1turn1search4

## Homepage

The homepage ticker:

- automatically refreshes every 60 seconds
- displays upcoming, live, halftime and finished states
- continuously scrolls when multiple matches exist
- pauses on hover
- remains usable on mobile
- respects reduced-motion preferences
- links each published match to a public WFM match page

## Match detail

Added:

`/matches/[id]`

The initial public page provides:

- competition
- home/away teams
- score
- status
- kickoff
- venue
- data provenance / confidence
- source update timestamp

## Admin workflow

Added:

`/admin/data/match-center`

Admins can:

1. Add a Sportmonks women's competition ID.
2. Name the competition.
3. Set the country.
4. Activate/pause the competition.
5. Sync the next three days of fixtures.

The existing Admin Data page now links to Match Center settings.

## Data integrity rules

M16 intentionally does not:

- invent scores
- infer match status
- publish arbitrary provider competitions
- expose provider credentials
- create predictions
- rank teams
- replace WFM's existing player/club/competition records

The homepage should display factual provider data only.

## Current production configuration

The WFM competition record for the English Women's Super League is configured using Sportmonks league ID `45`, which Sportmonks documents for the WSL. citeturn0search0turn0search2 Other competitions should be added through the Match Center discovery tool after confirming they are available under the project's Sportmonks plan.

## Operational setup remaining

Before live scores appear:

1. Confirm `SPORTMONKS_TOKEN` is configured in Supabase Edge Function Secrets.
2. Add the desired women's competition IDs in Admin → Data → Match Center.
3. Run the initial sync.
4. Verify the homepage ticker.
5. Verify a match detail page.
6. Add an automated recurring sync once the provider coverage and refresh behavior are confirmed.

## Next M16/M17 direction

The ticker is deliberately the first layer. Later work can add:

- broader competition coverage
- automated sync scheduling
- richer live states
- results/fixtures pages
- competition-specific match centers
- WFM news and data-driven football intelligence

No news publisher or payment provider is coupled to the Match Center layer.
