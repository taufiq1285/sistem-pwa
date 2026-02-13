-- ==========================================
-- FIX: Add Admin RLS Policies for jadwal_praktikum
-- ==========================================
-- Masalah: Admin tidak bisa melihat jadwal di Manajemen Assignment page
-- Penyebab: Tidak ada RLS policy untuk role admin

-- Drop existing policies if any
DROP POLICY IF EXISTS jadwal_praktikum_select_admin ON jadwal_praktikum;
DROP POLICY IF EXISTS jadwal_praktikum_insert_admin ON jadwal_praktikum;
DROP POLICY IF EXISTS jadwal_praktikum_update_admin ON jadwal_praktikum;
DROP POLICY IF EXISTS jadwal_praktikum_delete_admin ON jadwal_praktikum;

-- Create SELECT policy for admin
-- Admin bisa melihat SEMUA jadwal (termasuk yang inactive)
CREATE POLICY jadwal_praktikum_select_admin
ON jadwal_praktikum
FOR SELECT
TO public
USING (is_admin());

-- Create INSERT policy for admin
-- Admin bisa insert jadwal baru
CREATE POLICY jadwal_praktikum_insert_admin
ON jadwal_praktikum
FOR INSERT
TO public
WITH CHECK (is_admin());

-- Create UPDATE policy for admin
-- Admin bisa update SEMUA jadwal
CREATE POLICY jadwal_praktikum_update_admin
ON jadwal_praktikum
FOR UPDATE
TO public
USING (is_admin())
WITH CHECK (is_admin());

-- Create DELETE policy for admin
-- Admin bisa delete SEMUA jadwal
CREATE POLICY jadwal_praktikum_delete_admin
ON jadwal_praktikum
FOR DELETE
TO public
USING (is_admin());

-- Verification
SELECT
  'Current user:' as info,
  current_user;

-- Test admin access
SELECT
  COUNT(*) as total_accessible_for_admin
FROM jadwal_praktikum;

-- Verify all policies
SELECT
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'jadwal_praktikum'
ORDER BY policyname;
