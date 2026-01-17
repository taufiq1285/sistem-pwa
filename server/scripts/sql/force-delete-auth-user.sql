-- FORCE DELETE user from auth.users
-- WARNING: This requires superuser access to auth schema
-- Run this in Supabase SQL Editor

-- First, check if user still exists
SELECT id, email, created_at
FROM auth.users
WHERE id = '7eb7eead-29e8-48aa-b8be-758b561d35cf';

-- Try to delete directly from auth.users
-- Note: This will likely fail due to RLS policies
DELETE FROM auth.users
WHERE id = '7eb7eead-29e8-48aa-b8be-758b561d35cf';

-- If above fails, check related tables in auth schema
SELECT 'auth.identities' as table_name, COUNT(*)
FROM auth.identities
WHERE user_id = '7eb7eead-29e8-48aa-b8be-758b561d35cf'
UNION ALL
SELECT 'auth.sessions', COUNT(*)
FROM auth.sessions
WHERE user_id = '7eb7eead-29e8-48aa-b8be-758b561d35cf'
UNION ALL
SELECT 'auth.refresh_tokens', COUNT(*)
FROM auth.refresh_tokens
WHERE user_id = '7eb7eead-29e8-48aa-b8be-758b561d35cf';
