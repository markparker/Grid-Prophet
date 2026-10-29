-- Add admin and last login tracking columns to players table
ALTER TABLE players ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
ALTER TABLE players ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- Promote the owner's account to admin.
-- Replace the placeholder before running; the address is deliberately not
-- committed, so the repository does not advertise which account is the admin.
-- See 013_set_admin_user.sql, which supersedes this and also demotes everyone else.

\set admin_email 'admin@example.com'

UPDATE players SET is_admin = true WHERE email = :'admin_email';
