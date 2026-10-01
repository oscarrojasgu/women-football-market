# M20 — Global Data Operations & Automated Coverage

Status: implemented foundation.

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

## Next layer
Build source-aware task assignment and automated freshness/retry workers, then connect the queue to the existing import validation and coverage views.
