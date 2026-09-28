-- M5 historical data security and FK performance hardening
create index if not exists idx_entity_import_queue_validated_by on public.entity_import_queue(validated_by);
create index if not exists idx_wfm_import_batches_created_by on public.wfm_import_batches(created_by);
create index if not exists idx_wfm_import_batches_season_id on public.wfm_import_batches(season_id);
create index if not exists idx_wfm_import_batches_source_id on public.wfm_import_batches(source_id);
create index if not exists idx_wfm_player_history_snapshots_club_id on public.wfm_player_history_snapshots(club_id);
create index if not exists idx_wfm_player_history_snapshots_source_id on public.wfm_player_history_snapshots(source_id);

revoke execute on function public.wfm_historical_data_coverage() from anon;
revoke execute on function public.wfm_reconcile_historical_player_coverage() from anon;
revoke execute on function public.wfm_reconcile_player_coverage() from anon;
revoke execute on function public.wfm_validate_import_batch(uuid) from anon;
revoke execute on function public.wfm_validate_player_import(uuid) from anon;
revoke execute on function public.wfm_publish_import_queue_item(uuid) from anon;
