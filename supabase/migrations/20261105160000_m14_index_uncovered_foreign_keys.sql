-- Cover foreign-key lookups identified by the Supabase performance advisor.
create index if not exists idx_player_roster_memberships_club_id on public.player_roster_memberships (club_id);
create index if not exists idx_player_roster_memberships_competition_season_id on public.player_roster_memberships (competition_season_id);
create index if not exists idx_player_roster_memberships_source_id on public.player_roster_memberships (source_id);
create index if not exists idx_wfm_acquisition_queue_season_id on public.wfm_acquisition_queue (season_id);
create index if not exists idx_wfm_acquisition_queue_source_pipeline_id on public.wfm_acquisition_queue (source_pipeline_id);
create index if not exists idx_wfm_contact_requests_user_id on public.wfm_contact_requests (user_id);
create index if not exists idx_wfm_match_competitions_competition_id on public.wfm_match_competitions (competition_id);
create index if not exists idx_wfm_match_fixtures_away_club_id on public.wfm_match_fixtures (away_club_id);
create index if not exists idx_wfm_match_fixtures_home_club_id on public.wfm_match_fixtures (home_club_id);
create index if not exists idx_wfm_match_fixtures_season_id on public.wfm_match_fixtures (season_id);
create index if not exists idx_wfm_news_items_club_id on public.wfm_news_items (club_id);
create index if not exists idx_wfm_news_items_player_id on public.wfm_news_items (player_id);
create index if not exists idx_wfm_news_sources_source_pipeline_id on public.wfm_news_sources (source_pipeline_id);
create index if not exists idx_wfm_sales_opportunities_updated_by on public.wfm_sales_opportunities (updated_by);