-- ============================================================================
-- CLEANUP: Remove Duplicate Jadwal Policies
-- Problem: Ada 21 policies (seharusnya 12), karena ada duplikat
-- Solution: Drop SEMUA, buat ulang yang bersih
-- ============================================================================

-- Copy-paste SEMUA query di bawah ke Supabase SQL Editor dan RUN

-- ============================================================================
-- STEP 1: DROP ALL EXISTING POLICIES (Clean Slate)
-- ============================================================================

-- Drop format baru (jadwal_*)
DROP POLICY IF EXISTS "jadwal_select_admin" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_select_dosen" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_select_laboran" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_select_mahasiswa" ON jadwal_praktikum;

DROP POLICY IF EXISTS "jadwal_insert_admin" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_insert_dosen" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_insert_laboran" ON jadwal_praktikum;

DROP POLICY IF EXISTS "jadwal_update_admin" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_update_dosen" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_update_laboran" ON jadwal_praktikum;

DROP POLICY IF EXISTS "jadwal_delete_admin" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_delete_dosen" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_delete_laboran" ON jadwal_praktikum;

-- Drop format lama (jadwal_praktikum_*)
DROP POLICY IF EXISTS "jadwal_praktikum_select_all" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_select_admin" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_select_dosen" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_select_laboran" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_select_mahasiswa" ON jadwal_praktikum;

DROP POLICY IF EXISTS "jadwal_praktikum_insert_all" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_insert_admin" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_insert_dosen" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_insert_laboran" ON jadwal_praktikum;

DROP POLICY IF EXISTS "jadwal_praktikum_update_all" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_update_admin" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_update_dosen" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_update_laboran" ON jadwal_praktikum;

DROP POLICY IF EXISTS "jadwal_praktikum_delete_all" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_delete_admin" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_delete_dosen" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_delete_laboran" ON jadwal_praktikum;

-- ============================================================================
-- STEP 2: CREATE CLEAN POLICIES (12 total)
-- ============================================================================

-- ============================================================================
-- SELECT POLICIES (4)
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
            OR (
                is_active = false
                AND kelas_id IN (
                    SELECT id FROM kelas WHERE dosen_id = get_current_dosen_id()
                )
            )
        )
    );

-- Mahasiswa: Can see only approved jadwal for their kelas
CREATE POLICY "jadwal_select_mahasiswa" ON jadwal_praktikum
    FOR SELECT
    USING (
        is_mahasiswa()
        AND is_active = true
        AND kelas_id = ANY(get_mahasiswa_kelas_ids())
    );

-- ============================================================================
-- INSERT POLICIES (3)
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
-- UPDATE POLICIES (3)
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
-- DELETE POLICIES (2)
-- Note: Mahasiswa tidak bisa delete jadwal
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
-- VERIFICATION
-- ============================================================================

-- Check 1: Total should be exactly 12
SELECT
    'Total Policies' as check_name,
    COUNT(*)::text as count,
    CASE
        WHEN COUNT(*) = 12 THEN '✅ CORRECT (12 policies)'
        ELSE '❌ WRONG (should be 12, got ' || COUNT(*) || ')'
    END as status
FROM pg_policies
WHERE tablename = 'jadwal_praktikum';

-- Check 2: Breakdown by operation
SELECT
    cmd as operation,
    COUNT(*) as count,
    CASE
        WHEN cmd = 'SELECT' AND COUNT(*) = 4 THEN '✅'
        WHEN cmd = 'INSERT' AND COUNT(*) = 3 THEN '✅'
        WHEN cmd = 'UPDATE' AND COUNT(*) = 3 THEN '✅'
        WHEN cmd = 'DELETE' AND COUNT(*) = 3 THEN '✅'
        ELSE '❌'
    END as status,
    string_agg(policyname, ', ' ORDER BY policyname) as policy_names
FROM pg_policies
WHERE tablename = 'jadwal_praktikum'
GROUP BY cmd
ORDER BY cmd;

-- Expected Result:
-- DELETE | 3 | ✅ | jadwal_delete_admin, jadwal_delete_dosen, jadwal_delete_laboran
-- INSERT | 3 | ✅ | jadwal_insert_admin, jadwal_insert_dosen, jadwal_insert_laboran
-- SELECT | 4 | ✅ | jadwal_select_admin, jadwal_select_dosen, jadwal_select_laboran, jadwal_select_mahasiswa
-- UPDATE | 3 | ✅ | jadwal_update_admin, jadwal_update_dosen, jadwal_update_laboran

-- Check 3: List all policies (should be clean, no duplicates)
SELECT
    policyname,
    cmd as operation,
    CASE
        WHEN cmd = 'SELECT' THEN '✅ Read'
        WHEN cmd = 'INSERT' THEN '➕ Create'
        WHEN cmd = 'UPDATE' THEN '✏️ Update'
        WHEN cmd = 'DELETE' THEN '🗑️ Delete'
    END as action
FROM pg_policies
WHERE tablename = 'jadwal_praktikum'
ORDER BY cmd, policyname;

-- Total rows: 12
-- All names should start with "jadwal_" (NOT "jadwal_praktikum_")
