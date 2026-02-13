-- ==========================================
-- CEK DATABASE SAAT INI - Sebelum Fix
-- ==========================================
-- Script ini untuk mengecek kondisi database saat ini
-- sebelum menjalankan migration fix

-- ==========================================
-- 1. CEK JUMLAH DATA
-- ==========================================

SELECT '========== DATA COUNT ==========' as info;

SELECT
  'DOSEN' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE is_active = true) as active_records
FROM dosen

UNION ALL

SELECT
  'LABORATORIUM' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE is_active = true) as active_records
FROM laboratorium

UNION ALL

SELECT
  'KELAS' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE is_active = true) as active_records
FROM kelas

UNION ALL

SELECT
  'MATA_KULIAH' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE is_active = true) as active_records
FROM mata_kuliah

UNION ALL

SELECT
  'USERS' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE role = 'admin') as admin_users
FROM users

UNION ALL

SELECT
  'JADWAL_PRAKTIKUM' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE is_active = true) as active_records
FROM jadwal_praktikum;

-- ==========================================
-- 2. CEK RLS POLICIES YANG SUDAH ADA
-- ==========================================

SELECT '========== EXISTING RLS POLICIES ==========' as info;

SELECT
  tablename,
  policyname,
  cmd,
  roles,
  CASE
    WHEN policyname LIKE '%admin%' THEN 'Admin Policy'
    ELSE 'Other Policy'
  END as policy_type
FROM pg_policies
WHERE tablename IN ('dosen', 'laboratorium', 'kelas', 'mata_kuliah', 'users', 'jadwal_praktikum')
ORDER BY tablename, policy_type, policyname;

-- ==========================================
-- 3. CEK APAKAH FUNGSI is_admin() SUDAH ADA
-- ==========================================

SELECT '========== is_admin() FUNCTION ==========' as info;

SELECT
  proname as function_name,
  CASE
    WHEN proname IS NOT NULL THEN '✓ EXISTS'
    ELSE '✗ NOT EXISTS - Need to create'
  END as status
FROM pg_proc
WHERE proname = 'is_admin';

-- Jika tidak ada hasil, berarti fungsi belum dibuat

-- ==========================================
-- 4. CEK ADMIN POLICIES PER TABLE
-- ==========================================

SELECT '========== ADMIN POLICY CHECK ==========' as info;

-- Cek dosen
SELECT
  'DOSEN' as table_name,
  COUNT(*) FILTER (WHERE policyname LIKE '%admin%') as admin_policy_count,
  CASE
    WHEN COUNT(*) FILTER (WHERE policyname LIKE '%admin%') > 0 THEN '✓ Has Admin Policy'
    ELSE '✗ Missing Admin Policy'
  END as admin_policy_status
FROM pg_policies
WHERE tablename = 'dosen'

UNION ALL

-- Cek laboratorium
SELECT
  'LABORATORIUM' as table_name,
  COUNT(*) FILTER (WHERE policyname LIKE '%admin%') as admin_policy_count,
  CASE
    WHEN COUNT(*) FILTER (WHERE policyname LIKE '%admin%') > 0 THEN '✓ Has Admin Policy'
    ELSE '✗ Missing Admin Policy'
  END as admin_policy_status
FROM pg_policies
WHERE tablename = 'laboratorium'

UNION ALL

-- Cek kelas
SELECT
  'KELAS' as table_name,
  COUNT(*) FILTER (WHERE policyname LIKE '%admin%') as admin_policy_count,
  CASE
    WHEN COUNT(*) FILTER (WHERE policyname LIKE '%admin%') > 0 THEN '✓ Has Admin Policy'
    ELSE '✗ Missing Admin Policy'
  END as admin_policy_status
FROM pg_policies
WHERE tablename = 'kelas'

UNION ALL

-- Cek mata_kuliah
SELECT
  'MATA_KULIAH' as table_name,
  COUNT(*) FILTER (WHERE policyname LIKE '%admin%') as admin_policy_count,
  CASE
    WHEN COUNT(*) FILTER (WHERE policyname LIKE '%admin%') > 0 THEN '✓ Has Admin Policy'
    ELSE '✗ Missing Admin Policy'
  END as admin_policy_status
FROM pg_policies
WHERE tablename = 'mata_kuliah'

UNION ALL

-- Cek users
SELECT
  'USERS' as table_name,
  COUNT(*) FILTER (WHERE policyname LIKE '%admin%') as admin_policy_count,
  CASE
    WHEN COUNT(*) FILTER (WHERE policyname LIKE '%admin%') > 0 THEN '✓ Has Admin Policy'
    ELSE '✗ Missing Admin Policy'
  END as admin_policy_status
FROM pg_policies
WHERE tablename = 'users'

UNION ALL

-- Cek jadwal_praktikum
SELECT
  'JADWAL_PRAKTIKUM' as table_name,
  COUNT(*) FILTER (WHERE policyname LIKE '%admin%') as admin_policy_count,
  CASE
    WHEN COUNT(*) FILTER (WHERE policyname LIKE '%admin%') > 0 THEN '✓ Has Admin Policy'
    ELSE '✗ Missing Admin Policy'
  END as admin_policy_status
FROM pg_policies
WHERE tablename = 'jadwal_praktikum';

-- ==========================================
-- 5. TEST ACCESS - ADMIN QUERY
-- ==========================================

SELECT '========== TEST ADMIN ACCESS ==========' as info;

-- Test: Bisa baca dosen?
SELECT
  'Test 1: Baca DOSEN' as test_name,
  COUNT(*) as result_count,
  CASE
    WHEN COUNT(*) >= 0 THEN '✓ Can read'
    ELSE '✗ Blocked by RLS'
  END as access_status
FROM dosen
WHERE is_active = true;

-- Test: Bisa baca dosen dengan join users?
SELECT
  'Test 2: Baca DOSEN + USERS join' as test_name,
  COUNT(*) as result_count,
  CASE
    WHEN COUNT(*) >= 0 THEN '✓ Can read with join'
    ELSE '✗ Join blocked'
  END as access_status
FROM dosen d
LEFT JOIN users u ON d.user_id = u.id
WHERE d.is_active = true;

-- Test: Bisa baca laboratorium?
SELECT
  'Test 3: Baca LABORATORIUM' as test_name,
  COUNT(*) as result_count,
  CASE
    WHEN COUNT(*) >= 0 THEN '✓ Can read'
    ELSE '✗ Blocked by RLS'
  END as access_status
FROM laboratorium
WHERE is_active = true;

-- Test: Bisa baca kelas?
SELECT
  'Test 4: Baca KELAS' as test_name,
  COUNT(*) as result_count,
  CASE
    WHEN COUNT(*) >= 0 THEN '✓ Can read'
    ELSE '✗ Blocked by RLS'
  END as access_status
FROM kelas
WHERE is_active = true;

-- Test: Bisa baca mata_kuliah?
SELECT
  'Test 5: Baca MATA_KULIAH' as test_name,
  COUNT(*) as result_count,
  CASE
    WHEN COUNT(*) >= 0 THEN '✓ Can read'
    ELSE '✗ Blocked by RLS'
  END as access_status
FROM mata_kuliah;

-- ==========================================
-- 6. SAMPLE DATA (untuk verifikasi)
-- ==========================================

SELECT '========== SAMPLE DATA (Top 5) ==========' as info;

-- Sample dosen
SELECT
  'DOSEN' as table_name,
  d.id,
  d.is_active,
  u.full_name,
  u.email,
  u.role
FROM dosen d
LEFT JOIN users u ON d.user_id = u.id
ORDER BY u.full_name
LIMIT 5;

-- Sample kelas dengan mata kuliah
SELECT
  'KELAS + MATA_KULIAH' as table_name,
  k.id,
  k.kode_kelas,
  k.nama_kelas,
  k.is_active,
  mk.kode_mk,
  mk.nama_mk
FROM kelas k
LEFT JOIN mata_kuliah mk ON k.mata_kuliah_id = mk.id
ORDER BY k.nama_kelas
LIMIT 5;

-- ==========================================
-- 7. CURRENT USER CHECK
-- ==========================================

SELECT '========== CURRENT USER INFO ==========' as info;

SELECT
  current_user as database_user,
  auth.uid() as authenticated_user_id,
  u.role,
  u.full_name,
  u.email
FROM users u
WHERE u.id = auth.uid();

-- ==========================================
-- SUMMARY
-- ==========================================

SELECT '========== SUMMARY ==========' as info;

SELECT
  'Data Available' as check_type,
  (SELECT COUNT(*) FROM dosen WHERE is_active = true) +
  (SELECT COUNT(*) FROM laboratorium WHERE is_active = true) +
  (SELECT COUNT(*) FROM kelas WHERE is_active = true) +
  (SELECT COUNT(*) FROM mata_kuliah WHERE is_active = true) as total_active_records

UNION ALL

SELECT
  'Admin Policies Created' as check_type,
  (
    SELECT COUNT(DISTINCT tablename)
    FROM pg_policies
    WHERE tablename IN ('dosen', 'laboratorium', 'kelas', 'mata_kuliah', 'users')
    AND policyname LIKE '%admin%'
  ) as tables_with_admin_policies

UNION ALL

SELECT
  'Tables Need Admin Policies' as check_type,
  5 - (
    SELECT COUNT(DISTINCT tablename)
    FROM pg_policies
    WHERE tablename IN ('dosen', 'laboratorium', 'kelas', 'mata_kuliah', 'users')
    AND policyname LIKE '%admin%'
  ) as tables_missing_policies;
