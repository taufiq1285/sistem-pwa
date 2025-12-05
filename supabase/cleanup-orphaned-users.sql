-- SQL Script: Cleanup Orphaned Auth Users
-- Run this in Supabase SQL Editor when user registration fails

-- 1. Check for orphaned users (auth exists but no users table entry)
SELECT 
  au.id,
  au.email,
  au.created_at,
  u.id as users_table_id,
  CASE 
    WHEN u.id IS NULL THEN 'missing_users_entry'
    WHEN u.role = 'mahasiswa' AND m.user_id IS NULL THEN 'missing_mahasiswa_profile'
    WHEN u.role = 'dosen' AND d.user_id IS NULL THEN 'missing_dosen_profile'
    WHEN u.role = 'laboran' AND l.user_id IS NULL THEN 'missing_laboran_profile'
    ELSE 'complete'
  END as status
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
LEFT JOIN mahasiswa m ON u.id = m.user_id
LEFT JOIN dosen d ON u.id = d.user_id
LEFT JOIN laboran l ON u.id = l.user_id
ORDER BY au.created_at DESC
LIMIT 20;

-- 2. DELETE SPECIFIC USER (Replace 'user-id-here' with actual user ID)
-- CAREFUL: This will delete the user from auth completely
-- Run in this order:

-- First, delete from role-specific tables
DELETE FROM mahasiswa WHERE user_id = 'user-id-here';
DELETE FROM dosen WHERE user_id = 'user-id-here';
DELETE FROM laboran WHERE user_id = 'user-id-here';

-- Then delete from users table
DELETE FROM users WHERE id = 'user-id-here';

-- Finally, you need to delete from auth.users using Supabase Dashboard
-- or the delete-auth-user edge function

-- 3. QUICK CLEANUP: Delete all users with email containing 'test'
-- DANGEROUS: Only use in development!
-- DELETE FROM mahasiswa WHERE user_id IN (
--   SELECT id FROM users WHERE email LIKE '%test%'
-- );
-- DELETE FROM dosen WHERE user_id IN (
--   SELECT id FROM users WHERE email LIKE '%test%'
-- );
-- DELETE FROM laboran WHERE user_id IN (
--   SELECT id FROM users WHERE email LIKE '%test%'
-- );
-- DELETE FROM users WHERE email LIKE '%test%';
-- Then manually delete from auth.users in Supabase Dashboard

-- 4. Find user by email
SELECT 
  au.id as auth_id,
  au.email,
  u.id as user_id,
  u.role
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE au.email = 'asti@test.com';  -- Change email here
