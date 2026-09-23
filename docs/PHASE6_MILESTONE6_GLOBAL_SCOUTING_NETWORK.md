# Phase 6 — Milestone 6: Global Scouting Network

Status: Complete

## Purpose

Connect WFM recruitment workflows from scouting intent through global discovery, persistent shortlisting, evaluation, and recruitment pipeline tracking.

## Completed workflow

Scouting Profile → Recruitment Criteria → Global Player Discovery → Candidate Pool → Persistent Scouting List → Candidate Evaluation → Recruitment Pipeline

## Step 1 — Scouting Profiles

The `scouting_profiles` table stores private user-owned recruitment profiles with optional club association, description, active/archived status, and JSONB criteria.

## Step 2 — Profile Criteria Builder

Criteria include position, role, age, nationality, competition, contract status, salary, market value, minimum minutes, per-90 statistical thresholds, global percentile threshold, and recruitment priorities.

Criteria are stored in the profile's existing JSONB field.

## Step 3 — Global Player Discovery

A saved profile can be applied to the WFM player database. Discovery uses the normalized competition architecture and existing player intelligence, contract, salary, market-value, and participation data.

Discovery is descriptive filtering, not a player rating or league-strength adjustment.

## Step 4 — Candidate Shortlisting

Discovery results can be selected individually or in batches and added to an existing or newly created scouting list. Existing list membership is detected and duplicate additions are prevented by the existing unique list/player constraint.

## Step 5 — Candidate Evaluation

The persistent scouting workspace provides player-level evaluation notes, note types, global peer context, and recruitment research context.

## Step 6 — Recruitment Pipeline

The `scouting_pipeline` table provides persistent recruitment state for each shortlisted player:

- shortlist
- watching
- evaluating
- contact
- negotiating
- signed
- passed

Each candidate also supports priority, fit status, next action, target date, and evaluation text.

Pipeline records are private to the authenticated user and are constrained to players in that user's scouting lists.

## Security

`scouting_profiles` and `scouting_pipeline` use row-level security and authenticated-user ownership predicates. Pipeline inserts additionally verify ownership of the underlying scouting list/player record.

## Result

Milestone 6 now provides a continuous global recruitment workflow rather than disconnected scouting features.
