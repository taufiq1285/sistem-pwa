-- ============================================================================
-- MIGRATION 28: Fix Users DELETE Policy (NO RECURSION)
-- Allow admin to delete any user using is_admin() helper function
-- ============================================================================

-- Drop old policies that cause recursion
DROP POLICY IF EXISTS "users_delete_own" ON users;
DROP POLICY IF EXISTS "users_admin_delete_all" ON users;

-- Policy 1: Users can delete themselves
CREATE POLICY "users_delete_own" ON users
    FOR DELETE USING (auth.uid() = id);

-- Policy 2: Admin can delete any user (uses helper function - NO RECURSION)
CREATE POLICY "users_admin_delete_all" ON users
    FOR DELETE USING (is_admin());

-- Also add admin policies for role-specific tables using is_admin()
-- Mahasiswa
DROP POLICY IF EXISTS "mahasiswa_delete_own" ON mahasiswa;
DROP POLICY IF EXISTS "mahasiswa_admin_delete_all" ON mahasiswa;

CREATE POLICY "mahasiswa_delete_own" ON mahasiswa
    FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "mahasiswa_admin_delete_all" ON mahasiswa
    FOR DELETE USING (is_admin());

-- Dosen
DROP POLICY IF EXISTS "dosen_delete_own" ON dosen;
DROP POLICY IF EXISTS "dosen_admin_delete_all" ON dosen;

CREATE POLICY "dosen_delete_own" ON dosen
    FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "dosen_admin_delete_all" ON dosen
    FOR DELETE USING (is_admin());

-- Laboran
DROP POLICY IF EXISTS "laboran_delete_own" ON laboran;
DROP POLICY IF EXISTS "laboran_admin_delete_all" ON laboran;

CREATE POLICY "laboran_delete_own" ON laboran
    FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "laboran_admin_delete_all" ON laboran
    FOR DELETE USING (is_admin());

-- Admin table
DROP POLICY IF EXISTS "admin_delete_own" ON admin;
DROP POLICY IF EXISTS "admin_admin_delete_all" ON admin;

CREATE POLICY "admin_delete_own" ON admin
    FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "admin_admin_delete_all" ON admin
    FOR DELETE USING (is_admin());
