# M20 — Global Data Operations & Automated Coverage

Status: complete — M20 global data operations and club outreach/licensing workflow implemented.

## Purpose
M20 turns WFM's global coverage work into an operating queue rather than a sequence of one-off manual imports.

## Implemented
- wfm_acquisition_queue for competition/season/club acquisition tasks.
- Task types: competition structure, club rosters, player profiles, player stats, transfers.
- Priority, lifecycle status, attempts, retry timing, evidence count, success/error state.
- Admin-only RLS.
- wfm_acquisition_queue_summary security-invoker view.
- Initial queue seeded from active global coverage readiness.
- Admin UI at /admin/data/acquisition.
- Data Admin navigation link to the acquisition queue.

## Initial production state
The queue is seeded for all 24 active competitions, with five task types each: 120 queued acquisition tasks.

## Operating model
Source evidence is attached before publication. Acquisition tasks move through queued → in progress → review/completed, with blocked/failed/paused states available when evidence or source access is insufficient.

M20 does not auto-publish unverified player, roster, contract, salary, transfer, or statistical data.

## M20.3–M20.5 — Club permission & licensing operations
- `wfm_club_permission_tracker` tracks every WFM club through outreach and permission states.
- Permission is recorded separately by category: roster, statistics, contracts, salaries, transfers, photos, logos, and commercial use.
- Contact details, follow-up dates, attribution requirements, permitted scope, restrictions, agreement references, and license dates are tracked.
- `wfm_club_permission_events` preserves an admin-only outreach/audit history.
- Admin workspace: `/admin/data/club-permissions`.
- Outreach package includes an initial club-contact email and a 7/21/45-day follow-up cadence.
- Permission remains `unknown` until documented communication supports a change; WFM does not assume silence or ordinary web availability equals permission.

## Ready for club outreach
The operational workflow is ready for the first pilot clubs. Before sending, replace the contact and club placeholders in the outreach package and record each response in the tracker. Actual agreements, licensing terms, and rights should be reviewed by appropriate legal counsel before execution.

## Future M20 automation
Source-aware task assignment and automated freshness/retry workers can be added later without changing the club permission model.
