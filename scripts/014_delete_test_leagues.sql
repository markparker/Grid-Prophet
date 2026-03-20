-- Delete all leagues that contain 'test' (case-insensitive) in the name
DELETE FROM groups
WHERE LOWER(name) LIKE '%test%';
