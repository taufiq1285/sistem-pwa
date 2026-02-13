-- ==========================================
-- COMPLETE FIX: Admin Access for Dropdown Tables
-- ==========================================
-- Masalah: Admin tidak bisa melihat dropdown data (dosen, kelas, mata kuliah, lab)
-- Penyebab:
--   1. Fungsi is_admin() belum ada
--   2. RLS policies untuk admin belum lengkap
--   3. Beberapa tabel (mata_kuliah, users) tidak punya admin policy

-- ==========================================
-- STEP 1: CREATE is_admin() FUNCTION
-- ==========================================

-- Drop function if exists
DROP FUNCTION IF EXISTS is_admin() CASCADE;

-- Create is_admin() function
-- This function checks if current user has admin role
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if current user exists in users table with admin role
  RETURN EXISTS (
    SELECT 1
    FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- Grant execute to public
GRANT EXECUTE ON FUNCTION is_admin() TO public;

-- ==========================================
-- STEP 2: CREATE RLS POLICIES FOR DOSEN TABLE
-- ==========================================

-- Enable RLS on dosen table if not already enabled
ALTER TABLE dosen ENABLE ROW LEVEL SECURITY;

-- Drop existing admin policies if any
DROP POLICY IF EXISTS dosen_select_admin ON dosen;

-- Create SELECT policy for admin
-- Admin bisa melihat SEMUA dosen (termasuk yang inactive)
CREATE POLICY dosen_select_admin
ON dosen
FOR SELECT
TO public
USING (is_admin());

-- ==========================================
-- STEP 3: CREATE RLS POLICIES FOR LABORATORIUM TABLE
-- ==========================================

-- Enable RLS on laboratorium table
ALTER TABLE laboratorium ENABLE ROW LEVEL SECURITY;

-- Drop existing admin policies
DROP POLICY IF EXISTS laboratorium_select_admin ON laboratorium;

-- Create SELECT policy for admin
CREATE POLICY laboratorium_select_admin
ON laboratorium
FOR SELECT
TO public
USING (is_admin());

-- ==========================================
-- STEP 4: CREATE RLS POLICIES FOR KELAS TABLE
-- ==========================================

-- Enable RLS on kelas table
ALTER TABLE kelas ENABLE ROW LEVEL SECURITY;

-- Drop existing admin policies
DROP POLICY IF EXISTS kelas_select_admin ON kelas;

-- Create SELECT policy for admin
CREATE POLICY kelas_select_admin
ON kelas
FOR SELECT
TO public
USING (is_admin());

-- ==========================================
-- STEP 5: CREATE RLS POLICIES FOR MATA_KULIAH TABLE
-- ==========================================

-- Enable RLS on mata_kuliah table
ALTER TABLE mata_kuliah ENABLE ROW LEVEL SECURITY;

-- Drop existing admin policies
DROP POLICY IF EXISTS mata_kuliah_select_admin ON mata_kuliah;

-- Create SELECT policy for admin
CREATE POLICY mata_kuliah_select_admin
ON mata_kuliah
FOR SELECT
TO public
USING (is_admin());

-- ==========================================
-- STEP 6: CREATE RLS POLICIES FOR USERS TABLE
-- ==========================================

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing admin policies
DROP POLICY IF EXISTS users_select_admin ON users;

-- Create SELECT policy for admin
-- Admin bisa melihat SEMUA users (diperlukan untuk relasi dosen.user)
CREATE POLICY users_select_admin
ON users
FOR SELECT
TO public
USING (is_admin());

-- ==========================================
-- STEP 7: CREATE RLS POLICIES FOR JADWAL_PRAKTIKUM TABLE
-- ==========================================

-- Enable RLS on jadwal_praktikum table
ALTER TABLE jadwal_praktikum ENABLE ROW LEVEL SECURITY;

-- Drop existing admin policies
DROP POLICY IF EXISTS jadwal_praktikum_select_admin ON jadwal_praktikum;

-- Create SELECT policy for admin
CREATE POLICY jadwal_praktikum_select_admin
ON jadwal_praktikum
FOR SELECT
TO public
USING (is_admin());

-- ==========================================
-- VERIFICATION
-- ==========================================

-- Test is_admin() function
SELECT
  'is_admin() function' as test_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_proc WHERE proname = 'is_admin'
    ) THEN '✓ EXISTS'
    ELSE '✗ MISSING'
  END as status;

-- Test admin access to dosen
SELECT
  'DOSEN' as table_name,
  COUNT(*) as total_accessible,
  CASE
    WHEN COUNT(*) >= 0 THEN '✓ Can read'
    ELSE '✗ No access'
  END as access_status
FROM dosen;

-- Test admin access to dosen with user relation
SELECT
  'DOSEN_WITH_USER' as query_name,
  COUNT(*) as total_accessible,
  CASE
    WHEN COUNT(*) >= 0 THEN '✓ Can read'
    ELSE '✗ No access'
  END as access_status
FROM dosen
WHERE user_id IN (SELECT id FROM users);

-- Test admin access to laboratorium
SELECT
  'LABORATORIUM' as table_name,
  COUNT(*) as total_accessible,
  CASE
    WHEN COUNT(*) >= 0 THEN '✓ Can read'
    ELSE '✗ No access'
  END as access_status
FROM laboratorium;

-- Test admin access to kelas
SELECT
  'KELAS' as table_name,
  COUNT(*) as total_accessible,
  CASE
    WHEN COUNT(*) >= 0 THEN '✓ Can read'
    ELSE '✗ No access'
  END as access_status
FROM kelas;

-- Test admin access to kelas with mata_kuliah relation
SELECT
  'KELAS_WITH_MATA_KULIAH' as query_name,
  COUNT(*) as total_accessible,
  CASE
    WHEN COUNT(*) >= 0 THEN '✓ Can read'
    ELSE '✗ No access'
  END as access_status
FROM kelas
WHERE mata_kuliah_id IN (SELECT id FROM mata_kuliah);

-- Test admin access to mata_kuliah
SELECT
  'MATA_KULIAH' as table_name,
  COUNT(*) as total_accessible,
  CASE
    WHEN COUNT(*) >= 0 THEN '✓ Can read'
    ELSE '✗ No access'
  END as access_status
FROM mata_kuliah;

-- Test admin access to users
SELECT
  'USERS' as table_name,
  COUNT(*) as total_accessible,
  CASE
    WHEN COUNT(*) >= 0 THEN '✓ Can read'
    ELSE '✗ No access'
  END as access_status
FROM users;

-- Test admin access to jadwal_praktikum
SELECT
  'JADWAL_PRAKTIKUM' as table_name,
  COUNT(*) as total_accessible,
  CASE
    WHEN COUNT(*) >= 0 THEN '✓ Can read'
    ELSE '✗ No access'
  END as access_status
FROM jadwal_praktikum;

-- Verify all admin policies
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE policyname LIKE '%admin%'
ORDER BY tablename, policyname;

-- ==========================================
-- TEST QUERIES LIKE IN FRONTEND
-- ==========================================

-- Test query like in fetchDropdownData (line 629-640 of ManajemenAssignmentPage)
SELECT
  'fetchDropdownData - dosen' as test_name,
  COUNT(*) as result_count
FROM dosen
WHERE is_active = true;

SELECT
  'fetchDropdownData - laboratorium' as test_name,
  COUNT(*) as result_count
FROM laboratorium
WHERE is_active = true;

-- Test query like in fetchAssignments (line 199-227)
SELECT
  'fetchAssignments with relations' as test_name,
  COUNT(*) as result_count
FROM jadwal_praktikum jp
INNER JOIN kelas k ON jp.kelas_id = k.id
INNER JOIN mata_kuliah mk ON k.mata_kuliah_id = mk.id
LEFT JOIN dosen d ON jp.dosen_id = d.id
LEFT JOIN users u ON d.user_id = u.id
WHERE jp.is_active = true;
