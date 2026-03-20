-- Mark Bahrain and Saudi Arabia races as canceled for 2026
UPDATE races 
SET status = 'canceled' 
WHERE race_name IN ('Bahrain Grand Prix', 'Saudi Arabian Grand Prix')
AND status != 'canceled';

-- Verify the update
SELECT round, race_name, country, status FROM races WHERE status = 'canceled' ORDER BY round;
