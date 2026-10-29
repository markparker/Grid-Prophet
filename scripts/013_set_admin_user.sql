-- Promote a single account to admin and demote everyone else.
--
-- Replace the placeholder before running; the address is deliberately not
-- committed, so the repository does not advertise which account is the admin.
--
-- Note: `<> ` rather than `!=` also leaves rows with a NULL email untouched,
-- which is intentional — invite-only players have no email and are not admins.

\set admin_email 'admin@example.com'

UPDATE players SET is_admin = true  WHERE email = :'admin_email';
UPDATE players SET is_admin = false WHERE email IS DISTINCT FROM :'admin_email';
