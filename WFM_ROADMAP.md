# WFM Development Roadmap

This file is the working source of truth for the Women’s Football Market build.

## Current phase: PHASE 2 — UX redesign

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

## Phase 2 — UX redesign

Make Players, Clubs, Transfers, Contracts, and Salaries feel like one coherent product.

## Phase 3 — Player intelligence

Build comparisons, trends, market-value context, contract context, and salary context.

## Phase 4 — Verification

Enable players, agents, clubs, and eventually journalists/scouts to contribute and verify information.

## Phase 5 — Scouting tools

Build advanced filters, saved searches, player comparison, and shortlists.

## Phase 6 — Global women’s football

Systematically expand beyond the initial NWSL coverage and build global league coverage.

## Development rule

Do not randomly add isolated features. Work through the current phase systematically, preserve completed work, and avoid duplicating existing systems or records.
