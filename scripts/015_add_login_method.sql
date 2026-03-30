-- Add login_method column to players to track how they last signed in
ALTER TABLE players ADD COLUMN IF NOT EXISTS login_method TEXT DEFAULT 'invite' CHECK (login_method IN ('google', 'invite'));

-- Backfill: any player with a google_id already linked gets 'google'
UPDATE players SET login_method = 'google' WHERE google_id IS NOT NULL;
