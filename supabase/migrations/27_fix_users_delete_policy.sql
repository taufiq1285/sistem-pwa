-- ============================================================================
-- MIGRATION 27: Fix Users DELETE Policy
-- Allow admin to delete any user, not just themselves
-- ============================================================================

-- Drop old restrictive policy
DROP POLICY IF EXISTS "users_delete_own" ON users;

-- Policy 1: Users can delete themselves
CREATE POLICY "users_delete_own" ON users
    FOR DELETE USING (auth.uid() = id);

-- Policy 2: Admin can delete any user
CREATE POLICY "users_admin_delete_all" ON users
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Also add admin policies for role-specific tables
-- Mahasiswa
DROP POLICY IF EXISTS "mahasiswa_delete_own" ON mahasiswa;
CREATE POLICY "mahasiswa_delete_own" ON mahasiswa
    FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "mahasiswa_admin_delete_all" ON mahasiswa
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Dosen
DROP POLICY IF EXISTS "dosen_delete_own" ON dosen;
CREATE POLICY "dosen_delete_own" ON dosen
    FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "dosen_admin_delete_all" ON dosen
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Laboran
DROP POLICY IF EXISTS "laboran_delete_own" ON laboran;
CREATE POLICY "laboran_delete_own" ON laboran
    FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "laboran_admin_delete_all" ON laboran
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Admin table
DROP POLICY IF EXISTS "admin_delete_own" ON admin;
CREATE POLICY "admin_delete_own" ON admin
    FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "admin_admin_delete_all" ON admin
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );
