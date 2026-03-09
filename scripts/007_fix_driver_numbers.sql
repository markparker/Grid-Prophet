-- Fix driver numbers to match OpenF1 2026 data
-- Lando Norris became World Champion and took #1
-- Max Verstappen now uses #3
-- Other drivers may have changed numbers too

UPDATE drivers SET number = 1 WHERE id = 'lando_norris';
UPDATE drivers SET number = 3 WHERE id = 'max_verstappen';

-- Verify all other numbers match OpenF1 2026 session 11234 data:
-- driver_number 5 = Gabriel Bortoleto (correct in DB)
-- driver_number 6 = Isack Hadjar (correct in DB)
-- driver_number 10 = Pierre Gasly (correct in DB)
-- driver_number 12 = Kimi Antonelli (correct in DB)
-- driver_number 14 = Fernando Alonso (correct in DB)
-- driver_number 16 = Charles Leclerc (correct in DB)
-- driver_number 18 = Lance Stroll (correct in DB)
-- driver_number 23 = Alex Albon (correct in DB)
-- driver_number 27 = Nico Hulkenberg (correct in DB)
-- driver_number 30 = Liam Lawson (correct in DB)
-- driver_number 31 = Esteban Ocon (correct in DB)
-- driver_number 43 = Franco Colapinto (correct in DB)
-- driver_number 44 = Lewis Hamilton (correct in DB)
-- driver_number 55 = Carlos Sainz (correct in DB)
-- driver_number 63 = George Russell (correct in DB)
-- driver_number 77 = Valtteri Bottas (correct in DB)
-- driver_number 81 = Oscar Piastri (correct in DB)
-- driver_number 87 = Oliver Bearman (correct in DB)

-- Note: Arvid Lindblad has number 2 in our DB, need to verify
-- Note: Sergio Perez has number 11 in our DB, need to verify
