-- =====================================================
-- 02-set-admin.sql  —  Promote first user to admin
-- =====================================================
-- Run this AFTER you have signed up in the app for
-- the first time.
--
-- Steps:
--   1. Sign up / log in via the app
--   2. Come back here and run the query below to find
--      your user ID, then run the UPDATE.
-- =====================================================

-- Step 1: find your user ID by email
SELECT id, display_name, email, role
FROM profiles
WHERE email = 'YOUR_EMAIL_HERE';

-- Step 2: paste the UUID from above and run this
UPDATE profiles
SET role = 'admin'
WHERE id = 'PASTE-YOUR-USER-UUID-HERE';

-- Verify
SELECT id, display_name, email, role FROM profiles;
