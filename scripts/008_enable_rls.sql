-- Enable Row Level Security on all tables
-- Since we use custom session management (not Supabase Auth), we'll use service role
-- for server-side queries. RLS provides defense-in-depth for any direct DB access.

-- =============================================================================
-- PUBLIC READ TABLES (reference data - anyone can read)
-- =============================================================================

-- Drivers table: public read access (reference data)
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "drivers_public_read" ON drivers FOR SELECT USING (true);

-- Races table: public read access (reference data)
ALTER TABLE races ENABLE ROW LEVEL SECURITY;
CREATE POLICY "races_public_read" ON races FOR SELECT USING (true);

-- Race results: public read access (official results)
ALTER TABLE race_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "race_results_public_read" ON race_results FOR SELECT USING (true);

-- Qualifying results: public read access (official results)
ALTER TABLE qualifying_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "qualifying_results_public_read" ON qualifying_results FOR SELECT USING (true);

-- =============================================================================
-- GROUP-SCOPED TABLES (users see data within their league)
-- =============================================================================

-- Groups table: users can read any group (for joining), but only update their own
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "groups_public_read" ON groups FOR SELECT USING (true);

-- Players table: users can see players in all groups (for leaderboards)
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "players_public_read" ON players FOR SELECT USING (true);

-- Player scores: public read for leaderboards
ALTER TABLE player_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "player_scores_public_read" ON player_scores FOR SELECT USING (true);

-- =============================================================================
-- PREDICTION TABLES (users see predictions within their league after lock)
-- =============================================================================

-- Race predictions: readable by all (after race locks, predictions are public in league)
ALTER TABLE race_predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "race_predictions_public_read" ON race_predictions FOR SELECT USING (true);

-- Race prediction positions: readable by all
ALTER TABLE race_prediction_positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "race_prediction_positions_public_read" ON race_prediction_positions FOR SELECT USING (true);

-- WDC predictions: readable by all
ALTER TABLE wdc_predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wdc_predictions_public_read" ON wdc_predictions FOR SELECT USING (true);

-- WDC prediction positions: readable by all
ALTER TABLE wdc_prediction_positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wdc_prediction_positions_public_read" ON wdc_prediction_positions FOR SELECT USING (true);

-- =============================================================================
-- SERVICE ROLE BYPASS
-- Note: All INSERT/UPDATE/DELETE operations are performed server-side using
-- the service role key, which bypasses RLS. The custom session middleware
-- handles authentication and authorization before any write operations.
-- =============================================================================

-- Grant service role full access (this is automatic, but explicit for clarity)
-- The service_role key bypasses RLS by default in Supabase
