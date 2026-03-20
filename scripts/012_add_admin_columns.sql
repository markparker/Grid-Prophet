-- Add admin and last login tracking columns to players table
ALTER TABLE players ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
ALTER TABLE players ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- Set Mark Parker as admin (based on Google ID from auth callback)
-- You can update this with your actual player ID
UPDATE players SET is_admin = true WHERE email = 'mark@gridprophets.com';

-- Also try matching by name if email doesn't match
UPDATE players SET is_admin = true WHERE name ILIKE '%mark%parker%' AND is_admin = false;
