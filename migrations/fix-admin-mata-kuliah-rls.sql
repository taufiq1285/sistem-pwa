-- ==========================================
-- FIX: Add Admin RLS Policy for mata_kuliah table
-- ==========================================
-- Masalah: Admin tidak bisa melihat dropdown mata kuliah
-- karena tidak ada RLS policy untuk role admin

-- ==========================================
-- 1. MATA_KULIAH TABLE
-- ==========================================

-- Drop existing admin policies if any
DROP POLICY IF EXISTS mata_kuliah_select_admin ON mata_kuliah;

-- Create SELECT policy for admin
-- Admin bisa melihat SEMUA mata kuliah
CREATE POLICY mata_kuliah_select_admin
ON mata_kuliah
FOR SELECT
TO public
USING (is_admin());

-- ==========================================
-- 2. USERS TABLE (for dosen user relation)
-- ==========================================

-- Drop existing admin policies if any
DROP POLICY IF EXISTS users_select_admin ON users;

-- Create SELECT policy for admin
-- Admin bisa melihat SEMUA users (diperlukan untuk relasi dosen.user)
CREATE POLICY users_select_admin
ON users
FOR SELECT
TO public
USING (is_admin());

-- ==========================================
-- VERIFICATION
-- ==========================================

-- Test admin access to mata_kuliah
SELECT
  'MATA_KULIAH' as table_name,
  COUNT(*) as total_accessible
FROM mata_kuliah;

-- Test admin access to users
SELECT
  'USERS' as table_name,
  COUNT(*) as total_accessible
FROM users;

-- Verify all admin policies for dropdown-related tables
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename IN ('dosen', 'laboratorium', 'kelas', 'mata_kuliah', 'users')
  AND policyname LIKE '%admin%'
ORDER BY tablename, policyname;

-- Test full query like in ManajemenAssignmentPage
SELECT
  'DOSEN_WITH_USER' as test_name,
  COUNT(*) as total
FROM dosen
WHERE user_id IN (SELECT id FROM users);

SELECT
  'KELAS_WITH_MATA_KULIAH' as test_name,
  COUNT(*) as total
FROM kelas
WHERE mata_kuliah_id IN (SELECT id FROM mata_kuliah);
