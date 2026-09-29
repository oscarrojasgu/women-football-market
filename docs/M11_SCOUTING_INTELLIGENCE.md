# M11 — Scouting Intelligence

## Status
**M11 — COMPLETE**

M11 establishes the descriptive scouting-intelligence layer for WFM. It does not assign an overall player rating, predict future performance, or automatically recommend a transfer.

## Intelligence delivered
- Player-to-player comparison using recorded WFM statistics.
- Role-normalized per-90 metrics.
- Same-league/season peer context.
- Cross-competition global peer percentiles.
- Competition-position distribution context.
- Descriptive scouting archetypes based on recorded benchmark dimensions.
- Age context.
- Contract expiration monitoring.
- Salary and market-value context.
- Transfer history context.
- Persistent scouting lists.
- Private scouting notes.
- Scouting pipeline stages, priorities, fit status, next actions and target dates.
- Saved research searches.
- Club recruitment context.
- Private club scouting comparison reports.

## New database layer
`public.scouting_candidate_context` consolidates latest player identity/age, contract status and days remaining, salary/confidence, market value/confidence, and global peer benchmark context.

Availability context is factual contract context: `under_contract`, `expiring_180d`, `expired`, or `unknown`. It is not a prediction of whether a player will transfer.

## Data-quality rule
Scouting intelligence uses recorded data only. Missing values remain unavailable rather than being converted to zero or inferred. Percentiles and archetypes are descriptive context, not ratings.

## Security
The new database view uses `security_invoker=true`, so normal table/view access policies continue to apply. Private scouting lists, notes, pipelines and club reports remain protected by their existing authenticated/RLS boundaries.

## Migration
`supabase/migrations/20260929170000_m11_scouting_candidate_context.sql`

Applied successfully to Supabase and committed to GitHub.

## M11 completion gate
The scouting foundation now connects Player → Role → Statistics → Peer Group → Competition Context → Global Context → Contract → Salary → Market Value → Transfer Context → Scouting Workflow.

M12 can focus on club/agent workflows rather than adding another isolated scouting feature.