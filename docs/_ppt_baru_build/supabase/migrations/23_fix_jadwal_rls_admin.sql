-- ============================================================================
-- Migration: Fix RLS Policies for jadwal_praktikum (Admin Access)
-- Purpose: Ensure Admin can CREATE, READ, UPDATE, DELETE jadwal_praktikum
-- ============================================================================

-- Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "jadwal_praktikum_select_all" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_manage" ON jadwal_praktikum;
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
-- SELECT POLICIES
-- ============================================================================

-- Admin: Can see all jadwal
CREATE POLICY "jadwal_select_admin" ON jadwal_praktikum
    FOR SELECT
    USING (is_admin());

-- Laboran: Can see all jadwal (untuk approval workflow)
CREATE POLICY "jadwal_select_laboran" ON jadwal_praktikum
    FOR SELECT
    USING (is_laboran());

-- Dosen: Can see approved + their own pending jadwal
CREATE POLICY "jadwal_select_dosen" ON jadwal_praktikum
    FOR SELECT
    USING (
        is_dosen()
        AND (
            is_active = true
            OR kelas_id IN (SELECT id FROM kelas WHERE dosen_id = get_dosen_id())
        )
    );

-- Mahasiswa: Can see only active jadwal for their enrolled kelas
CREATE POLICY "jadwal_select_mahasiswa" ON jadwal_praktikum
    FOR SELECT
    USING (
        is_mahasiswa()
        AND is_active = true
        AND kelas_id = ANY(get_mahasiswa_kelas_ids())
    );

-- ============================================================================
-- INSERT POLICIES
-- ============================================================================

-- Admin: Can insert all jadwal
CREATE POLICY "jadwal_insert_admin" ON jadwal_praktikum
    FOR INSERT
    WITH CHECK (is_admin());

-- Laboran: Can insert all jadwal
CREATE POLICY "jadwal_insert_laboran" ON jadwal_praktikum
    FOR INSERT
    WITH CHECK (is_laboran());

-- Dosen: Can insert jadwal for their own kelas
CREATE POLICY "jadwal_insert_dosen" ON jadwal_praktikum
    FOR INSERT
    WITH CHECK (
        is_dosen()
        AND kelas_id IN (
            SELECT id FROM kelas WHERE dosen_id = get_dosen_id()
        )
    );

-- ============================================================================
-- UPDATE POLICIES
-- ============================================================================

-- Admin: Can update all jadwal
CREATE POLICY "jadwal_update_admin" ON jadwal_praktikum
    FOR UPDATE
    USING (is_admin())
    WITH CHECK (is_admin());

-- Laboran: Can update all jadwal (untuk approve/reject)
CREATE POLICY "jadwal_update_laboran" ON jadwal_praktikum
    FOR UPDATE
    USING (is_laboran())
    WITH CHECK (is_laboran());

-- Dosen: Can update their own kelas jadwal
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

-- ============================================================================
-- DELETE POLICIES
-- ============================================================================

-- Admin: Can delete all jadwal
CREATE POLICY "jadwal_delete_admin" ON jadwal_praktikum
    FOR DELETE
    USING (is_admin());

-- Laboran: Can delete pending jadwal (reject action)
CREATE POLICY "jadwal_delete_laboran" ON jadwal_praktikum
    FOR DELETE
    USING (
        is_laboran()
        AND is_active = false
    );

-- Dosen: Can delete their own pending jadwal
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
-- VERIFY POLICIES
-- ============================================================================

-- List all policies for verification
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'jadwal_praktikum'
ORDER BY cmd, policyname;
