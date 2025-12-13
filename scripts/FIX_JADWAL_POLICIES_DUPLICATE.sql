-- ============================================================================
-- FIX: Jadwal 403 Forbidden Error - DUPLIKASI POLICIES
-- Problem: Ada duplikasi policies (jadwal_* dan jadwal_praktikum_*)
-- Solution: Drop SEMUA policies lama, buat ulang yang benar
-- ============================================================================

-- STEP 1: DROP SEMUA POLICIES LAMA (termasuk duplikat)
-- ============================================================================

-- Drop policies dengan prefix "jadwal_insert_"
DROP POLICY IF EXISTS "jadwal_insert_admin" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_insert_laboran" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_insert_dosen" ON jadwal_praktikum;

-- Drop policies dengan prefix "jadwal_praktikum_insert_"
DROP POLICY IF EXISTS "jadwal_praktikum_insert_admin" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_insert_laboran" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_insert_dosen" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_insert_all" ON jadwal_praktikum;

-- Drop policies dengan prefix "jadwal_update_"
DROP POLICY IF EXISTS "jadwal_update_admin" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_update_laboran" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_update_dosen" ON jadwal_praktikum;

-- Drop policies dengan prefix "jadwal_praktikum_update_"
DROP POLICY IF EXISTS "jadwal_praktikum_update_admin" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_update_laboran" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_update_dosen" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_update_all" ON jadwal_praktikum;

-- Drop policies dengan prefix "jadwal_delete_"
DROP POLICY IF EXISTS "jadwal_delete_admin" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_delete_laboran" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_delete_dosen" ON jadwal_praktikum;

-- Drop policies dengan prefix "jadwal_praktikum_delete_"
DROP POLICY IF EXISTS "jadwal_praktikum_delete_admin" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_delete_laboran" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_delete_dosen" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_delete_all" ON jadwal_praktikum;

-- STEP 2: VERIFIKASI FUNGSI HELPER
-- ============================================================================

-- Test is_dosen() function
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'is_dosen'
    ) THEN
        RAISE EXCEPTION 'Function is_dosen() NOT FOUND! Run migration first.';
    END IF;
    RAISE NOTICE '✅ Function is_dosen() exists';
END $$;

-- Test get_current_dosen_id() function
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'get_current_dosen_id'
    ) THEN
        RAISE EXCEPTION 'Function get_current_dosen_id() NOT FOUND! Run migration first.';
    END IF;
    RAISE NOTICE '✅ Function get_current_dosen_id() exists';
END $$;

-- STEP 3: CREATE NEW POLICIES (FINAL VERSION)
-- ============================================================================

-- ==================== INSERT POLICIES ====================

-- Admin: Can insert all jadwal
CREATE POLICY "jadwal_praktikum_insert_admin" ON jadwal_praktikum
    FOR INSERT
    WITH CHECK (is_admin());

-- Laboran: Can insert all jadwal
CREATE POLICY "jadwal_praktikum_insert_laboran" ON jadwal_praktikum
    FOR INSERT
    WITH CHECK (is_laboran());

-- Dosen: Can insert jadwal for their own kelas
CREATE POLICY "jadwal_praktikum_insert_dosen" ON jadwal_praktikum
    FOR INSERT
    WITH CHECK (
        is_dosen()
        AND kelas_id IN (
            SELECT id FROM kelas WHERE dosen_id = get_current_dosen_id()
        )
    );

-- ==================== UPDATE POLICIES ====================

-- Admin: Can update all jadwal
CREATE POLICY "jadwal_praktikum_update_admin" ON jadwal_praktikum
    FOR UPDATE
    USING (is_admin())
    WITH CHECK (is_admin());

-- Laboran: Can update all jadwal (untuk approve/reject)
CREATE POLICY "jadwal_praktikum_update_laboran" ON jadwal_praktikum
    FOR UPDATE
    USING (is_laboran())
    WITH CHECK (is_laboran());

-- Dosen: Can update their own kelas jadwal
CREATE POLICY "jadwal_praktikum_update_dosen" ON jadwal_praktikum
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

-- ==================== DELETE POLICIES ====================

-- Admin: Can delete all jadwal
CREATE POLICY "jadwal_praktikum_delete_admin" ON jadwal_praktikum
    FOR DELETE
    USING (is_admin());

-- Laboran: Can delete pending jadwal (reject action)
CREATE POLICY "jadwal_praktikum_delete_laboran" ON jadwal_praktikum
    FOR DELETE
    USING (
        is_laboran()
        AND is_active = false
    );

-- Dosen: Can delete their own pending jadwal
CREATE POLICY "jadwal_praktikum_delete_dosen" ON jadwal_praktikum
    FOR DELETE
    USING (
        is_dosen()
        AND is_active = false
        AND kelas_id IN (
            SELECT id FROM kelas WHERE dosen_id = get_current_dosen_id()
        )
    );

-- STEP 4: VERIFICATION QUERIES
-- ============================================================================

-- Check total policies (should be 12: 4 SELECT + 3 INSERT + 3 UPDATE + 3 DELETE)
SELECT
    '=== TOTAL POLICIES ===' as info,
    COUNT(*)::text as result,
    CASE
        WHEN COUNT(*) = 12 THEN '✅ CORRECT (12 policies)'
        ELSE '❌ WRONG COUNT - SHOULD BE 12'
    END as status
FROM pg_policies
WHERE tablename = 'jadwal_praktikum';

-- Check policies by operation
SELECT
    '=== POLICIES BY OPERATION ===' as info,
    cmd as operation,
    COUNT(*) as count,
    string_agg(policyname, ', ' ORDER BY policyname) as policy_names
FROM pg_policies
WHERE tablename = 'jadwal_praktikum'
GROUP BY cmd
ORDER BY cmd;

-- Expected result:
-- DELETE | 3 | jadwal_praktikum_delete_admin, jadwal_praktikum_delete_dosen, jadwal_praktikum_delete_laboran
-- INSERT | 3 | jadwal_praktikum_insert_admin, jadwal_praktikum_insert_dosen, jadwal_praktikum_insert_laboran
-- SELECT | 4 | jadwal_select_admin, jadwal_select_dosen, jadwal_select_laboran, jadwal_select_mahasiswa
-- UPDATE | 3 | jadwal_praktikum_update_admin, jadwal_praktikum_update_dosen, jadwal_praktikum_update_laboran

-- Check for any duplicate prefixes (should be 0)
SELECT
    '=== CHECK DUPLICATES ===' as info,
    COUNT(CASE WHEN policyname LIKE 'jadwal_insert_%' THEN 1 END) as old_prefix_insert,
    COUNT(CASE WHEN policyname LIKE 'jadwal_update_%' THEN 1 END) as old_prefix_update,
    COUNT(CASE WHEN policyname LIKE 'jadwal_delete_%' THEN 1 END) as old_prefix_delete,
    CASE
        WHEN COUNT(CASE WHEN policyname LIKE 'jadwal_insert_%' 
                         OR policyname LIKE 'jadwal_update_%' 
                         OR policyname LIKE 'jadwal_delete_%' THEN 1 END) = 0
        THEN '✅ NO OLD PREFIX (GOOD)'
        ELSE '❌ OLD PREFIX STILL EXISTS!'
    END as status
FROM pg_policies
WHERE tablename = 'jadwal_praktikum';

-- STEP 5: TEST DENGAN USER DOSEN
-- ============================================================================

-- Test 1: Check current user role
SELECT
    '=== TEST USER INFO ===' as info,
    auth.uid() as user_id,
    get_user_role() as current_role,
    get_current_dosen_id() as dosen_id,
    is_dosen() as is_dosen_check
FROM users
WHERE user_id = auth.uid();

-- Test 2: Check kelas that dosen can access
SELECT
    '=== DOSEN KELAS ACCESS ===' as info,
    k.id,
    k.nama_kelas,
    k.dosen_id,
    CASE 
        WHEN k.dosen_id = get_current_dosen_id() THEN '✅ CAN INSERT'
        ELSE '❌ CANNOT INSERT'
    END as insert_permission
FROM kelas k
WHERE k.dosen_id = get_current_dosen_id()
ORDER BY k.nama_kelas;

-- ============================================================================
-- INSTRUCTIONS
-- ============================================================================
-- 1. Copy SEMUA query di atas
-- 2. Paste ke Supabase SQL Editor
-- 3. RUN sekali
-- 4. Check hasil verification queries
-- 5. Test insert jadwal dari UI sebagai dosen
-- ============================================================================
