-- ============================================================================
-- FIX: Admin 403 Forbidden Error saat Create Jadwal Praktikum
-- Run this script di Supabase SQL Editor
-- ============================================================================

-- Step 1: Add dosen_id column if not exists
ALTER TABLE jadwal_praktikum
ADD COLUMN IF NOT EXISTS dosen_id UUID REFERENCES dosen(id) ON DELETE SET NULL;

-- Step 2: Add index for performance
CREATE INDEX IF NOT EXISTS idx_jadwal_praktikum_dosen_id ON jadwal_praktikum(dosen_id);

-- ============================================================================
-- Step 3: CREATE HELPER FUNCTIONS (if not exists)
-- ============================================================================

-- Function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM users
    WHERE id = auth.uid();
    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(get_user_role() = 'admin', FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if user is dosen
CREATE OR REPLACE FUNCTION is_dosen()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(get_user_role() = 'dosen', FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if user is laboran
CREATE OR REPLACE FUNCTION is_laboran()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(get_user_role() = 'laboran', FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if user is mahasiswa
CREATE OR REPLACE FUNCTION is_mahasiswa()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(get_user_role() = 'mahasiswa', FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to get current dosen ID (alias for compatibility)
CREATE OR REPLACE FUNCTION get_dosen_id()
RETURNS UUID AS $$
DECLARE
    dosen_id UUID;
BEGIN
    SELECT id INTO dosen_id
    FROM dosen
    WHERE user_id = auth.uid();
    RETURN dosen_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to get current mahasiswa ID
CREATE OR REPLACE FUNCTION get_current_mahasiswa_id()
RETURNS UUID AS $$
DECLARE
    mahasiswa_id UUID;
BEGIN
    SELECT id INTO mahasiswa_id
    FROM mahasiswa
    WHERE user_id = auth.uid();
    RETURN mahasiswa_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to get kelas IDs where mahasiswa is enrolled
CREATE OR REPLACE FUNCTION get_mahasiswa_kelas_ids()
RETURNS UUID[] AS $$
DECLARE
    kelas_ids UUID[];
BEGIN
    SELECT ARRAY_AGG(kelas_id)
    INTO kelas_ids
    FROM kelas_mahasiswa
    WHERE mahasiswa_id = get_current_mahasiswa_id()
    AND is_active = TRUE;
    RETURN COALESCE(kelas_ids, ARRAY[]::UUID[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_dosen() TO authenticated;
GRANT EXECUTE ON FUNCTION is_laboran() TO authenticated;
GRANT EXECUTE ON FUNCTION is_mahasiswa() TO authenticated;
GRANT EXECUTE ON FUNCTION get_dosen_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_mahasiswa_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_mahasiswa_kelas_ids() TO authenticated;

-- ============================================================================
-- Step 4: Drop all existing policies to avoid conflicts
-- ============================================================================
DROP POLICY IF EXISTS "jadwal_praktikum_select_all" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_manage" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_select_unified" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_insert_dosen" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_update_unified" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_delete_unified" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_select_admin" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_select_laboran" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_select_dosen" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_select_mahasiswa" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_insert_admin" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_insert_laboran" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_insert_dosen" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_update_admin" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_update_laboran" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_update_dosen" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_delete_admin" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_delete_laboran" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_delete_dosen" ON jadwal_praktikum;

-- ============================================================================
-- Step 5: CREATE NEW POLICIES
-- ============================================================================

-- SELECT POLICIES
CREATE POLICY "jadwal_select_admin" ON jadwal_praktikum
    FOR SELECT
    USING (is_admin());

CREATE POLICY "jadwal_select_laboran" ON jadwal_praktikum
    FOR SELECT
    USING (is_laboran());

CREATE POLICY "jadwal_select_dosen" ON jadwal_praktikum
    FOR SELECT
    USING (
        is_dosen()
        AND (
            is_active = true
            OR kelas_id IN (SELECT id FROM kelas WHERE dosen_id = get_dosen_id())
        )
    );

CREATE POLICY "jadwal_select_mahasiswa" ON jadwal_praktikum
    FOR SELECT
    USING (
        is_mahasiswa()
        AND is_active = true
        AND kelas_id = ANY(get_mahasiswa_kelas_ids())
    );

-- INSERT POLICIES
CREATE POLICY "jadwal_insert_admin" ON jadwal_praktikum
    FOR INSERT
    WITH CHECK (is_admin());

CREATE POLICY "jadwal_insert_laboran" ON jadwal_praktikum
    FOR INSERT
    WITH CHECK (is_laboran());

CREATE POLICY "jadwal_insert_dosen" ON jadwal_praktikum
    FOR INSERT
    WITH CHECK (
        is_dosen()
        AND kelas_id IN (
            SELECT id FROM kelas WHERE dosen_id = get_dosen_id()
        )
    );

-- UPDATE POLICIES
CREATE POLICY "jadwal_update_admin" ON jadwal_praktikum
    FOR UPDATE
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY "jadwal_update_laboran" ON jadwal_praktikum
    FOR UPDATE
    USING (is_laboran())
    WITH CHECK (is_laboran());

CREATE POLICY "jadwal_update_dosen" ON jadwal_praktikum
    FOR UPDATE
    USING (
        is_dosen()
        AND kelas_id IN (
            SELECT id FROM kelas WHERE dosen_id = get_dosen_id()
        )
    )
    WITH CHECK (
        is_dosen()
        AND kelas_id IN (
            SELECT id FROM kelas WHERE dosen_id = get_dosen_id()
        )
    );

-- DELETE POLICIES
CREATE POLICY "jadwal_delete_admin" ON jadwal_praktikum
    FOR DELETE
    USING (is_admin());

CREATE POLICY "jadwal_delete_laboran" ON jadwal_praktikum
    FOR DELETE
    USING (
        is_laboran()
        AND is_active = false
    );

CREATE POLICY "jadwal_delete_dosen" ON jadwal_praktikum
    FOR DELETE
    USING (
        is_dosen()
        AND is_active = false
        AND kelas_id IN (
            SELECT id FROM kelas WHERE dosen_id = get_dosen_id()
        )
    );

-- ============================================================================
-- Step 6: VERIFY POLICIES
-- ============================================================================

SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    CASE
        WHEN policyname LIKE '%admin%' THEN '✅ Admin'
        WHEN policyname LIKE '%laboran%' THEN '✅ Laboran'
        WHEN policyname LIKE '%dosen%' THEN '✅ Dosen'
        WHEN policyname LIKE '%mahasiswa%' THEN '✅ Mahasiswa'
        ELSE '❓ Unknown'
    END as "Role"
FROM pg_policies
WHERE tablename = 'jadwal_praktikum'
ORDER BY cmd, policyname;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ RLS Policies for jadwal_praktikum successfully updated!';
    RAISE NOTICE '✅ Admin can now CREATE, READ, UPDATE, DELETE jadwal';
    RAISE NOTICE '✅ dosen_id column added for dosen override feature';
END $$;
