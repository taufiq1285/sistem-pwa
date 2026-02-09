-- Test script to debug kelas deletion issues
-- Run this in Supabase SQL Editor to check permissions

-- 1. Check current user
SELECT
    auth.uid() as current_user_id,
    auth.role() as auth_role,
    auth.jwt() ->> 'role' as jwt_role,
    auth.jwt() ->> 'email' as jwt_email;

-- 2. Check if user exists in users table
SELECT
    id,
    email,
    role,
    full_name,
    created_at
FROM users
WHERE id = auth.uid();

-- 3. Test is_admin() function
SELECT is_admin() as is_admin_result;

-- 4. Test get_user_role() function
SELECT get_user_role() as user_role;

-- 5. Check all kelas with their ids
SELECT
    id,
    nama_kelas,
    dosen_id,
    is_active,
    created_at
FROM kelas
ORDER BY created_at DESC;

-- 6. Check if delete policy exists for kelas
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'kelas' AND cmd = 'DELETE';

-- 7. Try to simulate the delete (this will show the actual error)
-- Replace 'YOUR_KELAS_ID_HERE' with an actual kelas ID
-- DELETE FROM kelas WHERE id = 'YOUR_KELAS_ID_HERE';

-- 8. Check for any foreign key constraints that might prevent deletion
SELECT
    tc.table_name,
    kcu.column_name,
    tc.constraint_name,
    rc.match_option,
    rc.update_rule,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
  AND tc.table_schema = rc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'kelas'
  AND rc.delete_rule = 'RESTRICT';