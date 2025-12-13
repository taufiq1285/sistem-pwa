-- ============================================================================
-- STEP 1: CHECK ALL EXISTING RLS POLICIES
-- Run this FIRST to see what we have
-- ============================================================================

-- 1. Check RLS status pada semua table
SELECT
  tablename,
  rowsecurity,
  CASE WHEN rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. List ALL policies yang ada
SELECT
  tablename,
  policyname,
  cmd,
  qual as "SELECT_CONDITION",
  with_check as "INSERT/UPDATE_CONDITION"
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. Count policies per table
SELECT
  tablename,
  COUNT(*) as policy_count,
  array_agg(policyname) as policy_names
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- 4. Check yang table TIDAK punya policy (bare RLS)
SELECT
  t.tablename,
  t.rowsecurity,
  COALESCE(p.policy_count, 0) as policy_count,
  CASE
    WHEN t.rowsecurity AND COALESCE(p.policy_count, 0) = 0 THEN '⚠️ RLS ON but NO POLICIES'
    WHEN t.rowsecurity AND COALESCE(p.policy_count, 0) > 0 THEN '✅ RLS ON + POLICIES OK'
    WHEN NOT t.rowsecurity THEN '❌ RLS OFF'
  END as status
FROM pg_tables t
LEFT JOIN (
  SELECT tablename, COUNT(*) as policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  GROUP BY tablename
) p ON t.tablename = p.tablename
WHERE t.schemaname = 'public'
ORDER BY t.tablename;

-- 5. Specific check untuk 6 table penting
SELECT
  tablename,
  rowsecurity,
  (SELECT COUNT(*) FROM pg_policies WHERE pg_policies.tablename = pg_tables.tablename) as policies
FROM pg_tables
WHERE tablename IN ('users', 'mahasiswa', 'dosen', 'admin', 'kelas', 'kelas_mahasiswa')
ORDER BY tablename;
