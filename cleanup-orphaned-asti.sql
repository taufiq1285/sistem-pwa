-- Cleanup orphaned asti@test.com user
-- Run this in Supabase SQL Editor

-- Step 1: Delete from public.users if exists
DELETE FROM public.users
WHERE email = 'asti@test.com';

-- Step 2: Check if user exists in auth.users
SELECT id, email, created_at
FROM auth.users
WHERE email = 'asti@test.com';

-- Step 3: Delete from auth.users using service_role
-- Note: This must be done via Dashboard UI or REST API with service_role key
-- Dashboard: Authentication > Users > Find asti@test.com > Delete

-- Verify cleanup
SELECT 'public.users' as table_name, COUNT(*)
FROM public.users
WHERE email = 'asti@test.com'
UNION ALL
SELECT 'auth.users', COUNT(*)
FROM auth.users
WHERE email = 'asti@test.com';
-- Should return 0 for both tables
