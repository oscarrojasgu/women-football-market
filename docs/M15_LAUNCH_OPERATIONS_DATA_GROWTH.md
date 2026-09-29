# M15 — Launch Operations & Data Growth

Status: Implementation complete

## Purpose

M15 turns WFM from a built product into an operational system for controlled launch growth. The phase focuses on growing coverage, sources, contributors, club/agency relationships and commercial activity without changing the core public data model.

## Completed

### M15.1 Operations dashboard

Added `/admin/operations` as an internal operational view covering:

- core data inventory
- source-candidate pipeline size
- import/review queue size
- integrity-audit severity counts
- scouting-ready competition coverage
- recent data-update runs
- contributor, club and agency onboarding activity
- commercial licensing requests, agreements and access events

The dashboard reads existing WFM records and does not introduce a public analytics layer.

### M15.2 Source acquisition workflow

Added the private `wfm_source_pipeline` workflow.

Each candidate can track:

- source name and URL
- publisher
- source type
- geography
- priority
- research status
- access method
- notes
- last checked timestamp
- responsible admin

Pipeline states:

`candidate → researching → approved → active`

with `paused` and `retired` states available when appropriate.

This workflow is deliberately separate from `sources`. A candidate is not treated as production evidence until it has been qualified and added to the normal provenance system.

### M15.3 Data growth control

M15 connects the operational dashboard to the existing Phase 9 import architecture:

- import batches
- entity import queue
- matching
- validation
- controlled publishing
- competition coverage targets
- historical reconciliation
- provenance monitoring

No automatic bulk publishing was introduced.

### M15.4 Quality monitoring

M15 surfaces the existing integrity audit and provenance/coverage workflows rather than creating duplicate quality systems.

Quality monitoring now has a clear operational loop:

**Acquire → Import → Match → Validate → Publish → Audit → Expand**

Unknown values remain unknown and unsupported records are not fabricated to fill coverage targets.

### M15.5 Contributor, club and agency onboarding

The operations dashboard surfaces the existing onboarding architecture:

- contributor profiles
- representation requests
- club account requests
- agency accounts
- agency contact requests
- existing verification workflows

The phase does not bypass existing review/RLS controls.

### M15.6 Controlled commercial onboarding

M15 surfaces the existing commercial boundary:

- license requests
- license agreements
- entitlements
- access logs

A request is not treated as authorization, and an entitlement is not treated as a signed agreement. Payment processing remains outside the application until deliberately integrated.

## Security

The source pipeline is admin-only through Supabase RLS and uses the existing WFM admin authorization helper.

No public source-pipeline records are exposed.

The operational dashboard is admin-only and relies on the existing RLS model for underlying data.

## Intentionally not added

- no automatic player-performance prediction
- no recommendation engine
- no automatic transfer likelihood
- no payment processor
- no advertising provider
- no public operational analytics
- no replacement of existing RLS
- no duplicate contributor or verification system
- no automatic publication of imported data

## Operating model

WFM should now grow through measured operational cycles:

1. Identify coverage gap.
2. Add or qualify a source.
3. Import source data into a review batch.
4. Match against existing entities.
5. Validate and publish only accepted records.
6. Run integrity/provenance checks.
7. Recheck competition coverage.
8. Onboard legitimate contributors, clubs and agencies.
9. Process commercial requests through the existing licensing boundary.
10. Review operational metrics before expanding the next coverage target.

## Next phase

M15 completes the Launch Operations & Data Growth layer.

The next work should be execution against real coverage and real users, not another large feature layer: close production-readiness gates, onboard initial contributors/clubs, acquire defensible sources, expand verified coverage and measure data quality and commercial usage.
