-- Check qualifying results for round 1
SELECT * FROM qualifying_results 
WHERE race_id IN (SELECT id FROM races WHERE round = 1)
ORDER BY grid_position
LIMIT 5;

-- Check pole scores for round 1
SELECT ps.*, r.round 
FROM player_scores ps 
JOIN races r ON r.id = ps.race_id
WHERE ps.score_type = 'pole' AND r.round = 1;

-- Check race predictions for round 1 to see the pole predictions
SELECT rp.player_id, rp.pole_prediction, p.name as player_name
FROM race_predictions rp
JOIN players p ON p.id = rp.player_id
JOIN races r ON r.id = rp.race_id
WHERE r.round = 1;
