# M18.1 — Global Coverage Audit

**Audit date:** 2026-09-29  
**Environment:** production Supabase project `ypdamswhioaoqbersxjk`  
**Purpose:** establish the live baseline before any M18 data expansion.

## Method

The audit uses the live canonical `competitions` table and joins to the current production structures for:

- `player_stats`
- `clubs`
- `competition_seasons`
- `club_competitions`
- `player_competitions`
- `contract_competitions`
- `transfer_competitions`

No records were created or modified during the audit.

A previous draft referenced a nonexistent `player_statistics` table. The production statistics table is `player_stats`.

## Live coverage baseline

The production database currently contains **24 active competitions**, including **18 active Tier 1 competitions**.

Recorded player-stat coverage is concentrated in seven competitions:

| Competition | Country | Stat players | Stat rows | Stat seasons | Direct clubs |
|---|---|---:|---:|---:|---:|
| NWSL | United States | 167 | 201 | 5 | 18 |
| FA Women's Super League | England | 143 | 144 | 1 | 2 |
| Eredivisie Vrouwen | Netherlands | 20 | 20 | 1 | 13 |
| Serie A Women | Italy | 16 | 16 | 1 | 6 |
| Frauen-Bundesliga | Germany | 11 | 11 | 2 | 16 |
| Damallsvenskan | Sweden | 10 | 10 | 1 | 16 |
| Kvindeliga | Denmark | 1 | 3 | 3 | 1 |

The following active Tier 1 competitions currently have no recorded player-stat rows:

- A-League Women — Australia
- Brasileirão Feminino — Brazil
- Chinese Women's Super League — China
- Gainbridge Super League — United States
- Liga F — Spain
- Liga Femenina BetPlay DIMAYOR — Colombia
- Liga MX Femenil — Mexico
- Malawian Women's League — Malawi
- Northern Super League — Canada
- Première Ligue — France
- USL Super League — United States

## Structural readiness gaps

The live schema shows that zero statistics does not always mean the same thing.

### Competition exists with a defined season, but roster/clubs are incomplete

- Liga F — 1 competition-season, 0 direct clubs, 0 stats
- Liga Femenina BetPlay DIMAYOR — 1 competition-season, 0 direct clubs, 0 stats
- Liga MX Femenil — 1 competition-season, 0 direct clubs, 0 stats
- Brasileirão Feminino — 1 competition-season, 0 direct clubs, 0 stats

These are candidates for a canonical roster/club coverage pass before player-stat ingestion.

### Competition has club records but no defined competition season

- A-League Women — 2 direct clubs
- Chinese Women's Super League — 2
- Northern Super League — 1
- Gainbridge Super League — 1
- USL Super League — 1
- Malawian Women's League — 1

These require competition-season/club-season structure before they are suitable for a clean player-season expansion.

### Competition has a season but only limited club coverage

- Première Ligue — 1 competition-season, 1 direct club

This requires roster/club coverage expansion before it can produce a representative peer sample.

## Existing transfer/contract coverage

Competition-linked transfer and contract records are sparse relative to the global competition list. The current audit found:

- NWSL: 52 competition-linked transfer records
- Frauen-Bundesliga: 1
- Kvindeliga: 1
- Other active competitions: no competition-linked transfer records in the current mapping

Contract-competition mappings should therefore **not** be treated as a complete indicator of contract coverage. The canonical contract records and their club/player relationships remain the stronger source for contract auditing.

## Important data-model observation

The current `player_competitions` association table does not provide useful competition-level player counts in this audit because its links depend on `club_competitions` records and the current production association coverage is incomplete. It should not be used as a readiness metric until that relationship layer is populated consistently.

The primary M18 readiness metrics are therefore:

1. canonical competition exists;
2. competition-season exists;
3. current clubs are represented;
4. sourced player-stat records exist;
5. at least five eligible players exist for a peer sample;
6. source/provenance is present for accepted records.

## M18 expansion sequence

The next expansion work should follow the data readiness path rather than simply adding competition names:

1. **Repair/complete canonical competition + club/season structure** for active Tier 1 competitions with missing structural records.
2. **Source player-season statistics** only where evidence is available.
3. **Validate five-player peer-group readiness** before marking a competition scouting-ready.
4. **Preserve source IDs, confidence, competition IDs and timestamps** for every accepted record.
5. **Leave unavailable fields null** rather than estimating them.
6. **Re-run the live audit after each expansion batch.**

The first expansion batches should focus on active Tier 1 competitions that already have canonical competition-season records, while separately opening structural work for competitions that lack seasons or club coverage.

## External landscape context

FIFA's current 2026 women's-football calendar shows active competition across all six confederations and continued expansion of women's club and national-team competitions. FIFA also states that it monitors the global women's club and league landscape as part of its professionalisation work. This supports WFM's decision to use an explicit coverage model rather than treating the initial database as representative of the global game.

## M18.1 result

**Audit complete.**

No unsupported player, statistic, salary, contract, transfer, club, or competition record was created during this audit.

The next implementation step is **M18.2 — Coverage Readiness & Expansion Queue**: convert the measured gaps above into a controlled source-acquisition queue and validate the first new competition before importing records.


## M18.2 — Coverage readiness & expansion queue

The live production database now exposes two security-invoker coverage views:

- `public.wfm_global_coverage_readiness`
- `public.wfm_coverage_readiness_summary`

Readiness is derived from canonical competition identity, active competition-season structure, current club coverage, and sourced player-stat coverage. The readiness model distinguishes:

- `scouting_ready`
- `player_import_ready`
- `structure_partial`
- `needs_club_coverage`
- `needs_season_coverage`
- `needs_structure`

The model uses a five-player minimum as the practical peer-sample threshold already established by WFM scouting intelligence.

### Approved source queue

The existing `wfm_source_pipeline` was extended rather than creating a duplicate queue. The first approved global source candidates are:

- FMF — Liga MX Femenil
- Liga F — Spain
- CBF — Brasileirão Feminino A1
- DIMAYOR — Liga Femenina BetPlay
- Northern Super League — Canada

These were selected because their official/public sources expose competition structure and/or player/statistical information. Current web validation confirms Liga F publishes standings and player statistics, FMF identifies Liga MX Femenil and its player/statistics coverage, CBF publishes current Brasileirão Feminino competition materials, DIMAYOR publishes Liga Femenina standings/fixtures, and Northern Super League publishes player statistics.

No player or statistic rows were created from these source checks alone. The source queue is the controlled acquisition layer; accepted records still require evidence, matching, canonical IDs, source IDs, confidence and validation.

## M18 result

**M18 global coverage framework complete.**

Completed:

- live global coverage audit
- measurable readiness model
- expansion priority calculation
- controlled source-acquisition queue using the existing source pipeline
- official-source validation for the first expansion batch
- canonical competition/provenance preservation
- scouting-readiness threshold enforcement
- explicit unknown-data policy

Ongoing league-by-league player/stat acquisition is intentionally moved into the next operational data-growth cycle rather than treating global coverage as a one-time bulk import. This prevents unsupported records and keeps every accepted record auditable.
