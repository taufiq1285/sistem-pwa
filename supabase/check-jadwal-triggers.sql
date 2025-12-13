-- ============================================================================
-- Check Triggers and Policies on jadwal_praktikum
-- ============================================================================

-- 1. Check all triggers on jadwal_praktikum
SELECT
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'jadwal_praktikum'
ORDER BY trigger_name;

-- 2. Check RLS policies
SELECT
  policyname,
  cmd,
  qual::text as using_clause,
  with_check::text as with_check_clause
FROM pg_policies
WHERE tablename = 'jadwal_praktikum'
ORDER BY cmd, policyname;

-- 3. Check if RLS is enabled
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'jadwal_praktikum';

-- 4. Test the is_dosen() function manually
SELECT is_dosen() as is_dosen_result;

-- 5. Test get_current_dosen_id() function
SELECT get_current_dosen_id() as dosen_id_result;

-- 6. Check the is_dosen() function definition for infinite loops
SELECT
  proname,
  prosrc
FROM pg_proc
WHERE proname IN ('is_dosen', 'get_current_dosen_id');
