-- ==========================================
-- FIX: Add Admin RLS Policies for dosen, laboratorium, kelas tables
-- ==========================================
-- Masalah: Admin tidak bisa melihat dropdown data (dosen, lab, kelas) untuk edit assignment

-- ==========================================
-- 1. DOSEN TABLE
-- ==========================================

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
-- 2. LABORATORIUM TABLE
-- ==========================================

-- Drop existing admin policies if any
DROP POLICY IF EXISTS laboratorium_select_admin ON laboratorium;

-- Create SELECT policy for admin
-- Admin bisa melihat SEMUA laboratorium
CREATE POLICY laboratorium_select_admin
ON laboratorium
FOR SELECT
TO public
USING (is_admin());

-- ==========================================
-- 3. KELAS TABLE
-- ==========================================

-- Drop existing admin policies if any
DROP POLICY IF EXISTS kelas_select_admin ON kelas;

-- Create SELECT policy for admin
-- Admin bisa melihat SEMUA kelas
CREATE POLICY kelas_select_admin
ON kelas
FOR SELECT
TO public
USING (is_admin());

-- ==========================================
-- VERIFICATION
-- ==========================================

-- Test admin access to dosen
SELECT
  'DOSEN' as table_name,
  COUNT(*) as total_accessible
FROM dosen;

-- Test admin access to laboratorium
SELECT
  'LABORATORIUM' as table_name,
  COUNT(*) as total_accessible
FROM laboratorium;

-- Test admin access to kelas
SELECT
  'KELAS' as table_name,
  COUNT(*) as total_accessible
FROM kelas;

-- Verify all policies
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename IN ('dosen', 'laboratorium', 'kelas')
  AND policyname LIKE '%admin%'
ORDER BY tablename, policyname;
