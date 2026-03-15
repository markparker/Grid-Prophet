-- Debug: Check race dates and results_fetched status
SELECT id, round, race_name, race_date, results_fetched, qualifying_fetched
FROM races
WHERE round <= 3
ORDER BY round;

-- Check current date comparison
SELECT CURRENT_DATE as db_current_date;
