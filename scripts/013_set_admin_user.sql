-- Set only parker.mark@gmail.com as admin
UPDATE players SET is_admin = true WHERE email = 'parker.mark@gmail.com';

-- Ensure all other users are not admins
UPDATE players SET is_admin = false WHERE email != 'parker.mark@gmail.com';
