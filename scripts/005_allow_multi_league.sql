-- Drop the unique constraint on google_id so one Google user can be in multiple leagues
ALTER TABLE players DROP CONSTRAINT IF EXISTS players_google_id_key;

-- Add a unique constraint on (google_id, group_id) instead to prevent duplicate entries in the same league
CREATE UNIQUE INDEX IF NOT EXISTS players_google_id_group_id_unique ON players (google_id, group_id) WHERE google_id IS NOT NULL;
