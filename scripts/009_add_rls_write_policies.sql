-- Add INSERT/UPDATE/DELETE policies for user data tables
-- These policies allow server-side operations even with anon key
-- since we verify authentication via custom session middleware

-- =============================================================================
-- RACE PREDICTIONS - users can manage their own predictions
-- =============================================================================

-- Allow insert for race_predictions (server validates session)
CREATE POLICY "race_predictions_insert" ON race_predictions 
FOR INSERT WITH CHECK (true);

-- Allow update for race_predictions (server validates session)
CREATE POLICY "race_predictions_update" ON race_predictions 
FOR UPDATE USING (true) WITH CHECK (true);

-- Allow delete for race_predictions (server validates session)
CREATE POLICY "race_predictions_delete" ON race_predictions 
FOR DELETE USING (true);

-- =============================================================================
-- RACE PREDICTION POSITIONS - users can manage their own prediction positions
-- =============================================================================

-- Allow insert for race_prediction_positions
CREATE POLICY "race_prediction_positions_insert" ON race_prediction_positions 
FOR INSERT WITH CHECK (true);

-- Allow update for race_prediction_positions
CREATE POLICY "race_prediction_positions_update" ON race_prediction_positions 
FOR UPDATE USING (true) WITH CHECK (true);

-- Allow delete for race_prediction_positions
CREATE POLICY "race_prediction_positions_delete" ON race_prediction_positions 
FOR DELETE USING (true);

-- =============================================================================
-- WDC PREDICTIONS - users can manage their own WDC predictions
-- =============================================================================

-- Allow insert for wdc_predictions
CREATE POLICY "wdc_predictions_insert" ON wdc_predictions 
FOR INSERT WITH CHECK (true);

-- Allow update for wdc_predictions
CREATE POLICY "wdc_predictions_update" ON wdc_predictions 
FOR UPDATE USING (true) WITH CHECK (true);

-- Allow delete for wdc_predictions
CREATE POLICY "wdc_predictions_delete" ON wdc_predictions 
FOR DELETE USING (true);

-- =============================================================================
-- WDC PREDICTION POSITIONS - users can manage their own WDC prediction positions
-- =============================================================================

-- Allow insert for wdc_prediction_positions
CREATE POLICY "wdc_prediction_positions_insert" ON wdc_prediction_positions 
FOR INSERT WITH CHECK (true);

-- Allow update for wdc_prediction_positions
CREATE POLICY "wdc_prediction_positions_update" ON wdc_prediction_positions 
FOR UPDATE USING (true) WITH CHECK (true);

-- Allow delete for wdc_prediction_positions
CREATE POLICY "wdc_prediction_positions_delete" ON wdc_prediction_positions 
FOR DELETE USING (true);

-- =============================================================================
-- PLAYERS - allow creating new players and updating own profile
-- =============================================================================

-- Allow insert for players (new user registration)
CREATE POLICY "players_insert" ON players 
FOR INSERT WITH CHECK (true);

-- Allow update for players (profile updates)
CREATE POLICY "players_update" ON players 
FOR UPDATE USING (true) WITH CHECK (true);

-- =============================================================================
-- GROUPS - allow creating new groups
-- =============================================================================

-- Allow insert for groups (creating new leagues)
CREATE POLICY "groups_insert" ON groups 
FOR INSERT WITH CHECK (true);

-- Allow update for groups (admin updates)
CREATE POLICY "groups_update" ON groups 
FOR UPDATE USING (true) WITH CHECK (true);

-- =============================================================================
-- PLAYER SCORES - server manages scores
-- =============================================================================

-- Allow insert for player_scores
CREATE POLICY "player_scores_insert" ON player_scores 
FOR INSERT WITH CHECK (true);

-- Allow update for player_scores
CREATE POLICY "player_scores_update" ON player_scores 
FOR UPDATE USING (true) WITH CHECK (true);

-- Allow delete for player_scores
CREATE POLICY "player_scores_delete" ON player_scores 
FOR DELETE USING (true);

-- =============================================================================
-- RACE RESULTS & QUALIFYING RESULTS - server manages official results
-- =============================================================================

-- Allow insert for race_results (sync from F1 API)
CREATE POLICY "race_results_insert" ON race_results 
FOR INSERT WITH CHECK (true);

-- Allow update for race_results
CREATE POLICY "race_results_update" ON race_results 
FOR UPDATE USING (true) WITH CHECK (true);

-- Allow insert for qualifying_results (sync from F1 API)
CREATE POLICY "qualifying_results_insert" ON qualifying_results 
FOR INSERT WITH CHECK (true);

-- Allow update for qualifying_results
CREATE POLICY "qualifying_results_update" ON qualifying_results 
FOR UPDATE USING (true) WITH CHECK (true);

-- =============================================================================
-- RACES - server manages race data
-- =============================================================================

-- Allow update for races (sync updates)
CREATE POLICY "races_update" ON races 
FOR UPDATE USING (true) WITH CHECK (true);
