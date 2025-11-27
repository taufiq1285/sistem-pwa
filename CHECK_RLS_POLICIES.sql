-- ============================================================================
-- CHECK CURRENT RLS POLICIES
-- Run this in Supabase SQL Editor to see all RLS policies
-- ============================================================================

-- 1. Check yang table sudah punya RLS enabled
SELECT
  schemaname,
  tablename,
  rowsecurity,
  CASE WHEN rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'mahasiswa', 'dosen', 'kelas', 'kelas_mahasiswa', 'admin')
ORDER BY tablename;

-- 2. Check semua policies untuk tabel kritis
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  CASE WHEN permissive THEN 'ALLOW' ELSE 'DENY' END as policy_type,
  qual as select_condition
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('users', 'mahasiswa', 'dosen', 'kelas', 'kelas_mahasiswa', 'admin')
ORDER BY tablename, policyname;

-- 3. Detail untuk users table
SELECT
  policyname,
  qual,
  with_check,
  cmd
FROM pg_policies
WHERE tablename = 'users'
AND schemaname = 'public';

-- 4. Detail untuk mahasiswa table
SELECT
  policyname,
  qual,
  with_check,
  cmd
FROM pg_policies
WHERE tablename = 'mahasiswa'
AND schemaname = 'public';

-- 5. Detail untuk kelas table
SELECT
  policyname,
  qual,
  with_check,
  cmd
FROM pg_policies
WHERE tablename = 'kelas'
AND schemaname = 'public';

-- 6. Check admin users
SELECT
  u.id,
  u.email,
  u.full_name,
  u.role,
  a.id as admin_id,
  a.level
FROM users u
LEFT JOIN admin a ON u.id = a.user_id
WHERE u.role = 'admin'
LIMIT 10;

-- 7. Check mahasiswa users
SELECT
  u.id,
  u.email,
  u.full_name,
  u.role,
  m.id as mahasiswa_id,
  m.nim,
  m.program_studi,
  m.angkatan
FROM users u
LEFT JOIN mahasiswa m ON u.id = m.user_id
WHERE u.role = 'mahasiswa'
ORDER BY u.created_at DESC
LIMIT 20;

-- 8. Check status RLS - ringkasan
WITH rls_status AS (
  SELECT
    tablename,
    rowsecurity,
    (SELECT COUNT(*) FROM pg_policies WHERE pg_policies.tablename = pg_tables.tablename) as policy_count
  FROM pg_tables
  WHERE schemaname = 'public'
  AND tablename IN ('users', 'mahasiswa', 'dosen', 'kelas', 'kelas_mahasiswa', 'admin')
)
SELECT
  tablename,
  CASE WHEN rowsecurity THEN '✅' ELSE '❌' END as rls,
  policy_count,
  CASE
    WHEN rowsecurity AND policy_count > 0 THEN '✅ OK'
    WHEN rowsecurity AND policy_count = 0 THEN '⚠️ RLS ON but no policies'
    WHEN NOT rowsecurity THEN '❌ RLS OFF - SECURITY RISK'
  END as status
FROM rls_status
ORDER BY tablename;
