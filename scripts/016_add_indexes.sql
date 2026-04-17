-- Add indexes to improve query performance

-- Players table - frequently queried by group_id and email
CREATE INDEX IF NOT EXISTS idx_players_group_id ON players(group_id);
CREATE INDEX IF NOT EXISTS idx_players_email ON players(email);

-- Player scores - frequently queried by player_id and race_id
CREATE INDEX IF NOT EXISTS idx_player_scores_player_id ON player_scores(player_id);
CREATE INDEX IF NOT EXISTS idx_player_scores_race_id ON player_scores(race_id);

-- Race predictions - frequently queried by player_id and race_id
CREATE INDEX IF NOT EXISTS idx_race_predictions_player_id ON race_predictions(player_id);
CREATE INDEX IF NOT EXISTS idx_race_predictions_race_id ON race_predictions(race_id);
CREATE INDEX IF NOT EXISTS idx_race_predictions_player_race ON race_predictions(player_id, race_id);

-- Races - frequently ordered/filtered by date and round
CREATE INDEX IF NOT EXISTS idx_races_race_date ON races(race_date);
CREATE INDEX IF NOT EXISTS idx_races_round ON races(round);
CREATE INDEX IF NOT EXISTS idx_races_status ON races(status);

-- WDC predictions - queried by player_id
CREATE INDEX IF NOT EXISTS idx_wdc_predictions_player_id ON wdc_predictions(player_id);

-- Race/WDC prediction positions - queried by prediction_id
CREATE INDEX IF NOT EXISTS idx_race_prediction_positions_prediction_id ON race_prediction_positions(prediction_id);
CREATE INDEX IF NOT EXISTS idx_wdc_prediction_positions_prediction_id ON wdc_prediction_positions(prediction_id);
