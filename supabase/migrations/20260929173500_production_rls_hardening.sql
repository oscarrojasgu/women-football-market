-- Production-readiness RLS hardening for M15/M14 launch gates
-- Applied directly to the production database on 2026-09-29.
-- Keep this migration idempotent for environments that already contain the M15 policies.

drop policy if exists "WFM admins manage import queue" on public.entity_import_queue;

alter policy "WFM admins can manage entity import queue"
  on public.entity_import_queue
  using ((select private.is_wfm_admin()))
  with check ((select private.is_wfm_admin()));

alter policy "wfm admins manage competition coverage"
  on public.wfm_competition_coverage
  using ((select private.is_wfm_admin()))
  with check ((select private.is_wfm_admin()));
