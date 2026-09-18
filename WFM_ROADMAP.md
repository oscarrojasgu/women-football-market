# WFM Development Roadmap

This file is the working source of truth for the Women’s Football Market build.

## Current phase: PHASE 1 — Data foundation

Goal: make the database accurate, complete, consistent, traceable, and scalable before major UX redesign work.

### Phase 1 checklist
- [ ] Audit every core table and relationship
- [ ] Standardize player records
- [ ] Standardize club records
- [ ] Standardize contract and salary records
- [ ] Standardize market-value records
- [ ] Standardize transfer records
- [ ] Standardize statistics records
- [ ] Ensure photos and club logos have source/credit/licensing context
- [ ] Ensure every important factual record has a source and confidence level
- [ ] Identify and resolve duplicate/inconsistent records
- [ ] Establish consistent USD conversion fields while preserving original currency
- [ ] Keep database schema documentation synchronized with the live Supabase database

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
