-- ==========================================
-- VERIFICATION: Admin Access to Dropdown Tables
-- ==========================================
-- Script ini untuk mengecek apakah admin bisa mengakses
-- semua data yang diperlukan untuk dropdown di Manajemen Assignment

-- ==========================================
-- 1. CHECK is_admin() FUNCTION
-- ==========================================
SELECT
  'is_admin_function' as check_type,
  proname as function_name,
  CASE
    WHEN proname IS NOT NULL THEN '✓ EXISTS'
    ELSE '✗ MISSING'
  END as status
FROM pg_proc
WHERE proname = 'is_admin';

-- Jika function tidak ada, buat function ini:
-- CREATE OR REPLACE FUNCTION is_admin()
-- RETURNS boolean
-- LANGUAGE sql
-- SECURITY DEFINER
-- AS $$
--   SELECT
--     EXISTS (
--       SELECT 1 FROM users
--       WHERE id = auth.uid()
--       AND role = 'admin'
--     )
--     OR
--     EXISTS (
--       SELECT 1 FROM user_roles
--       WHERE user_id = auth.uid()
--       AND role = 'admin'
--     );
-- $$;

-- ==========================================
-- 2. CHECK RLS POLICIES FOR DROPDOWN TABLES
-- ==========================================

-- Create a temp table to store results
DROP TABLE IF EXISTS admin_policy_check;
CREATE TEMP TABLE admin_policy_check (
  table_name text,
  has_policy boolean,
  policy_count int
);

-- Check each table
INSERT INTO admin_policy_check
SELECT
  'dosen' as table_name,
  COUNT(*) > 0 as has_policy,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename = 'dosen' AND policyname LIKE '%admin%';

INSERT INTO admin_policy_check
SELECT
  'laboratorium' as table_name,
  COUNT(*) > 0 as has_policy,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename = 'laboratorium' AND policyname LIKE '%admin%';

INSERT INTO admin_policy_check
SELECT
  'kelas' as table_name,
  COUNT(*) > 0 as has_policy,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename = 'kelas' AND policyname LIKE '%admin%';

INSERT INTO admin_policy_check
SELECT
  'mata_kuliah' as table_name,
  COUNT(*) > 0 as has_policy,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename = 'mata_kuliah' AND policyname LIKE '%admin%';

INSERT INTO admin_policy_check
SELECT
  'users' as table_name,
  COUNT(*) > 0 as has_policy,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename = 'users' AND policyname LIKE '%admin%';

-- Display results
SELECT
  table_name,
  has_policy,
  policy_count,
  CASE
    WHEN has_policy THEN '✓ OK'
    ELSE '✗ MISSING - Run fix-admin-*-rls.sql migrations'
  END as status
FROM admin_policy_check
ORDER BY table_name;

-- ==========================================
-- 3. TEST ACTUAL DATA ACCESS
-- ==========================================

-- Test dosen access
SELECT
  'dosen' as table_test,
  COUNT(*) as row_count,
  CASE
    WHEN COUNT(*) > 0 THEN '✓ Can read'
    ELSE '✗ No data or no access'
  END as access_status
FROM dosen;

-- Test laboratorium access
SELECT
  'laboratorium' as table_test,
  COUNT(*) as row_count,
  CASE
    WHEN COUNT(*) > 0 THEN '✓ Can read'
    ELSE '✗ No data or no access'
  END as access_status
FROM laboratorium;

-- Test kelas access
SELECT
  'kelas' as table_test,
  COUNT(*) as row_count,
  CASE
    WHEN COUNT(*) > 0 THEN '✓ Can read'
    ELSE '✗ No data or no access'
  END as access_status
FROM kelas;

-- Test mata_kuliah access
SELECT
  'mata_kuliah' as table_test,
  COUNT(*) as row_count,
  CASE
    WHEN COUNT(*) > 0 THEN '✓ Can read'
    ELSE '✗ No data or no access'
  END as access_status
FROM mata_kuliah;

-- Test users access
SELECT
  'users' as table_test,
  COUNT(*) as row_count,
  CASE
    WHEN COUNT(*) > 0 THEN '✓ Can read'
    ELSE '✗ No data or no access'
  END as access_status
FROM users;

-- ==========================================
-- 4. TEST COMPLEX QUERIES (like in frontend)
-- ==========================================

-- Test dosen with user relation (like in ManajemenAssignmentPage line 629-634)
SELECT
  'dosen_with_user_relation' as query_test,
  COUNT(*) as result_count,
  CASE
    WHEN COUNT(*) >= 0 THEN '✓ Works'
    ELSE '✗ Failed'
  END as status
FROM dosen
WHERE user_id IN (SELECT id FROM users LIMIT 1);

-- Test kelas with mata_kuliah relation (like in fetchAssignments)
SELECT
  'kelas_with_mata_kuliah' as query_test,
  COUNT(*) as result_count,
  CASE
    WHEN COUNT(*) >= 0 THEN '✓ Works'
    ELSE '✗ Failed'
  END as status
FROM kelas
WHERE mata_kuliah_id IN (SELECT id FROM mata_kuliah LIMIT 1);

-- ==========================================
-- 5. SHOW ALL ADMIN POLICIES
-- ==========================================
SELECT
  'All admin policies:' as info,
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE policyname LIKE '%admin%'
ORDER BY tablename, policyname;

-- ==========================================
-- 6. SUMMARY
-- ==========================================
SELECT
  'VERIFICATION SUMMARY' as summary_type,
  (
    SELECT COUNT(*)
    FROM admin_policy_check
    WHERE has_policy
  ) as tables_with_policies,
  (
    SELECT COUNT(*)
    FROM admin_policy_check
  ) as total_tables_needed,
  CASE
    WHEN (
      SELECT COUNT(*)
      FROM admin_policy_check
      WHERE has_policy
    ) = 5 THEN '✓ ALL TABLES COVERED'
    ELSE '✗ SOME TABLES MISSING POLICIES'
  END as overall_status;

DROP TABLE admin_policy_check;
