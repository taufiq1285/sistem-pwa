-- ============================================================================
-- FIX: Jadwal 403 Forbidden Error
-- Problem: Migration 99 hanya buat SELECT policies, INSERT/UPDATE/DELETE hilang
-- Solution: Tambahkan INSERT/UPDATE/DELETE policies
-- ============================================================================

-- Copy-paste SEMUA query di bawah ke Supabase SQL Editor dan RUN

-- ============================================================================
-- DROP OLD POLICIES (jika ada)
-- ============================================================================
DROP POLICY IF EXISTS "jadwal_insert_admin" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_insert_laboran" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_insert_dosen" ON jadwal_praktikum;

DROP POLICY IF EXISTS "jadwal_update_admin" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_update_laboran" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_update_dosen" ON jadwal_praktikum;

DROP POLICY IF EXISTS "jadwal_delete_admin" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_delete_laboran" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_delete_dosen" ON jadwal_praktikum;

-- Also drop any old generic policies
DROP POLICY IF EXISTS "jadwal_praktikum_insert_all" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_update_all" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_delete_all" ON jadwal_praktikum;

-- ============================================================================
-- CREATE INSERT POLICIES
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
            SELECT id FROM kelas WHERE dosen_id = get_current_dosen_id()
        )
    );

-- ============================================================================
-- CREATE UPDATE POLICIES
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
            SELECT id FROM kelas WHERE dosen_id = get_current_dosen_id()
        )
    )
    WITH CHECK (
        is_dosen()
        AND kelas_id IN (
            SELECT id FROM kelas WHERE dosen_id = get_current_dosen_id()
        )
    );

-- ============================================================================
-- CREATE DELETE POLICIES
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
            SELECT id FROM kelas WHERE dosen_id = get_current_dosen_id()
        )
    );

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check total policies (should be 12)
SELECT
    'Total Policies' as check_name,
    COUNT(*)::text as result,
    CASE
        WHEN COUNT(*) = 12 THEN '✅ CORRECT'
        ELSE '❌ SHOULD BE 12'
    END as status
FROM pg_policies
WHERE tablename = 'jadwal_praktikum';

-- Check policies by operation
SELECT
    cmd as operation,
    COUNT(*) as count,
    string_agg(policyname, ', ' ORDER BY policyname) as policy_names
FROM pg_policies
WHERE tablename = 'jadwal_praktikum'
GROUP BY cmd
ORDER BY cmd;

-- Expected:
-- DELETE | 3 | jadwal_delete_admin, jadwal_delete_dosen, jadwal_delete_laboran
-- INSERT | 3 | jadwal_insert_admin, jadwal_insert_dosen, jadwal_insert_laboran
-- SELECT | 4 | jadwal_select_admin, jadwal_select_dosen, jadwal_select_laboran, jadwal_select_mahasiswa
-- UPDATE | 3 | jadwal_update_admin, jadwal_update_dosen, jadwal_update_laboran
