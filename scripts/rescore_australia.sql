-- Reset Australian GP flags to re-fetch qualifying and re-score
-- First, delete existing qualifying results for Australia (round 1)
DELETE FROM qualifying_results 
WHERE race_id = (SELECT id FROM races WHERE round = 1 AND season = 2026);

-- Delete existing pole scores for Australia
DELETE FROM player_scores 
WHERE race_id = (SELECT id FROM races WHERE round = 1 AND season = 2026)
AND score_type = 'pole';

-- Reset the qualifying_fetched flag so sync will re-fetch
UPDATE races 
SET qualifying_fetched = false, results_fetched = false
WHERE round = 1 AND season = 2026;

-- Verify the reset
SELECT id, name, round, qualifying_fetched, results_fetched 
FROM races 
WHERE round = 1 AND season = 2026;
