-- Allow 'clerk' as a login_method.
--
-- 015_add_login_method.sql created the check constraint with ('google', 'invite'),
-- before the app moved to Clerk for auth. Every write path now records 'clerk'
-- (app/api/groups/route.ts, app/api/webhooks/clerk/route.ts,
-- app/api/auth/check/route.ts), so each one violated the constraint:
--
--   new row for relation "players" violates check constraint "players_login_method_check"
--
-- That broke every new sign-up, and silently blocked the last_login/avatar_url
-- update on sign-in, which is why last_login stayed null for nearly every player.
--
-- Applied to production 2026-10-26; kept here so the schema history is complete.

ALTER TABLE players DROP CONSTRAINT IF EXISTS players_login_method_check;

ALTER TABLE players ADD CONSTRAINT players_login_method_check
  CHECK (login_method IN ('google', 'invite', 'clerk'));
