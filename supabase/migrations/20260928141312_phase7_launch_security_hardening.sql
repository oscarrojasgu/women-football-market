alter view public.player_season_intelligence set (security_invoker = true);
alter view public.player_global_peer_benchmarks set (security_invoker = true);

drop index if exists public.player_stats_player_season_idx;
