-- Add google_id column to players table for Google OAuth linking
ALTER TABLE players ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE;

-- Add email column to players for easier identification
ALTER TABLE players ADD COLUMN IF NOT EXISTS email TEXT;
