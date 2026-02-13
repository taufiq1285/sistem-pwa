-- ==========================================
-- CEK DATABASE SAAT INI - Versi Sederhana
-- ==========================================
-- Script ini untuk mengecek kondisi database saat ini

-- ==========================================
-- 1. CEK JUMLAH DATA (Sederhana)
-- ==========================================

SELECT '========== DATA COUNT ==========' as info;

-- Cek dosen
SELECT
  'DOSEN' as table_name,
  COUNT(*) as total_records,
  'See sample below for details' as notes
FROM dosen

UNION ALL

SELECT
  'LABORATORIUM' as table_name,
  COUNT(*) as total_records,
  'See sample below for details' as notes
FROM laboratorium

UNION ALL

SELECT
  'KELAS' as table_name,
  COUNT(*) as total_records,
  'See sample below for details' as notes
FROM kelas

UNION ALL

SELECT
  'MATA_KULIAH' as table_name,
  COUNT(*) as total_records,
  'See sample below for details' as notes
FROM mata_kuliah

UNION ALL

SELECT
  'USERS' as table_name,
  COUNT(*) as total_records,
  'See sample below for details' as notes
FROM users

UNION ALL

SELECT
  'JADWAL_PRAKTIKUM' as table_name,
  COUNT(*) as total_records,
  'See sample below for details' as notes
FROM jadwal_praktikum;

-- ==========================================
-- 2. CEK RLS POLICIES YANG SUDAH ADA
-- ==========================================

SELECT '========== EXISTING RLS POLICIES ==========' as info;

SELECT
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename IN ('dosen', 'laboratorium', 'kelas', 'mata_kuliah', 'users', 'jadwal_praktikum')
ORDER BY tablename, policyname;

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

-- ==========================================
-- 4. CEK ADMIN POLICIES PER TABLE
-- ==========================================

SELECT '========== ADMIN POLICY CHECK ==========' as info;

SELECT
  tablename,
  COUNT(*) as policy_count,
  STRING_AGG(policyname, ', ') as policy_names
FROM pg_policies
WHERE tablename IN ('dosen', 'laboratorium', 'kelas', 'mata_kuliah', 'users')
  AND policyname LIKE '%admin%'
GROUP BY tablename
ORDER BY tablename;

-- ==========================================
-- 5. TEST ACCESS - ADMIN QUERY
-- ==========================================

SELECT '========== TEST ADMIN ACCESS ==========' as info;

-- Test: Bisa baca dosen?
SELECT
  'Test 1: Baca DOSEN' as test_name,
  COUNT(*) as result_count
FROM dosen;

-- Test: Bisa baca dosen dengan join users?
SELECT
  'Test 2: Baca DOSEN + USERS join' as test_name,
  COUNT(*) as result_count
FROM dosen d
LEFT JOIN users u ON d.user_id = u.id;

-- Test: Bisa baca laboratorium?
SELECT
  'Test 3: Baca LABORATORIUM' as test_name,
  COUNT(*) as result_count
FROM laboratorium;

-- Test: Bisa baca kelas?
SELECT
  'Test 4: Baca KELAS' as test_name,
  COUNT(*) as result_count
FROM kelas;

-- Test: Bisa baca mata_kuliah?
SELECT
  'Test 5: Baca MATA_KULIAH' as test_name,
  COUNT(*) as result_count
FROM mata_kuliah;

-- Test: Bisa baca users?
SELECT
  'Test 6: Baca USERS' as test_name,
  COUNT(*) as result_count
FROM users;

-- ==========================================
-- 6. STRUKTUR TABEL (Cek column apa saja yang ada)
-- ==========================================

SELECT '========== TABLE STRUCTURES ==========' as info;

-- Struktur tabel dosen
SELECT
  'dosen' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'dosen'
ORDER BY ordinal_position;

-- Struktur tabel users
SELECT
  'users' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- ==========================================
-- 7. SAMPLE DATA (untuk verifikasi)
-- ==========================================

SELECT '========== SAMPLE DATA ==========' as info;

-- Sample dosen
SELECT 'Sample DOSEN (5 records)' as info;
SELECT
  d.id,
  d.user_id,
  u.full_name,
  u.email,
  u.role
FROM dosen d
LEFT JOIN users u ON d.user_id = u.id
LIMIT 5;

-- Sample kelas
SELECT 'Sample KELAS (5 records)' as info;
SELECT
  k.id,
  k.kode_kelas,
  k.nama_kelas,
  k.mata_kuliah_id
FROM kelas k
LIMIT 5;

-- Sample mata kuliah
SELECT 'Sample MATA_KULIAH (5 records)' as info;
SELECT
  id,
  kode_mk,
  nama_mk
FROM mata_kuliah
LIMIT 5;

-- Sample users dengan role admin
SELECT 'Sample USERS with admin role' as info;
SELECT
  id,
  full_name,
  email,
  role
FROM users
WHERE role = 'admin';

-- ==========================================
-- 8. CURRENT USER CHECK
-- ==========================================

SELECT '========== CURRENT USER ==========' as info;

SELECT
  current_user as database_user,
  auth.uid() as authenticated_user_id;

-- Dapatkan user info dari tabel users
SELECT
  id,
  full_name,
  email,
  role
FROM users
WHERE id = auth.uid();
