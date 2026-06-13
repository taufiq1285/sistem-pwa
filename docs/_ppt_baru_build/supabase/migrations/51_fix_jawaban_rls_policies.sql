-- ============================================================================
-- JAWABAN TABLE RLS POLICIES
-- Fix for: Student cannot save answers (403 Forbidden - RLS violation)
-- ============================================================================
-- Description: Fix RLS policies for jawaban table to allow students to insert/update answers
-- Date: 2025-12-13
-- Issue: jawaban_insert_own policy is too restrictive or using wrong joins
-- ============================================================================

-- ============================================================================
-- DROP OLD POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "jawaban_select" ON jawaban;
DROP POLICY IF EXISTS "jawaban_insert_own" ON jawaban;
DROP POLICY IF EXISTS "jawaban_update_own" ON jawaban;
DROP POLICY IF EXISTS "jawaban_delete_own" ON jawaban;

-- ============================================================================
-- ENABLE RLS
-- ============================================================================

ALTER TABLE jawaban ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SELECT POLICIES
-- ============================================================================

-- ADMIN: Can see all jawaban
CREATE POLICY "jawaban_select_admin" ON jawaban
    FOR SELECT
    USING (is_admin());

-- DOSEN: Can see jawaban for their students' attempts
CREATE POLICY "jawaban_select_dosen" ON jawaban
    FOR SELECT
    USING (
        is_dosen() AND EXISTS (
            SELECT 1 FROM attempt_kuis ak
            INNER JOIN kuis k ON k.id = ak.kuis_id
            WHERE ak.id = jawaban.attempt_id
            AND k.dosen_id = get_current_dosen_id()
        )
    );

-- MAHASISWA: Can see their own jawaban
CREATE POLICY "jawaban_select_mahasiswa" ON jawaban
    FOR SELECT
    USING (
        is_mahasiswa() AND EXISTS (
            SELECT 1 FROM attempt_kuis ak
            WHERE ak.id = jawaban.attempt_id
            AND ak.mahasiswa_id = get_current_mahasiswa_id()
        )
    );

-- ============================================================================
-- INSERT POLICIES
-- ============================================================================

-- MAHASISWA: Can insert jawaban for their own attempts
CREATE POLICY "jawaban_insert_mahasiswa" ON jawaban
    FOR INSERT
    WITH CHECK (
        is_mahasiswa() AND EXISTS (
            SELECT 1 FROM attempt_kuis ak
            WHERE ak.id = attempt_id
            AND ak.mahasiswa_id = get_current_mahasiswa_id()
            AND ak.status IN ('pending', 'in_progress')
        )
    );

-- ADMIN: Can insert any jawaban (for testing/debugging)
CREATE POLICY "jawaban_insert_admin" ON jawaban
    FOR INSERT
    WITH CHECK (is_admin());

-- ============================================================================
-- UPDATE POLICIES
-- ============================================================================

-- MAHASISWA: Can update their own jawaban (before quiz is submitted)
CREATE POLICY "jawaban_update_mahasiswa" ON jawaban
    FOR UPDATE
    USING (
        is_mahasiswa() AND EXISTS (
            SELECT 1 FROM attempt_kuis ak
            WHERE ak.id = jawaban.attempt_id
            AND ak.mahasiswa_id = get_current_mahasiswa_id()
            AND ak.status IN ('pending', 'in_progress')
        )
    )
    WITH CHECK (
        is_mahasiswa() AND EXISTS (
            SELECT 1 FROM attempt_kuis ak
            WHERE ak.id = attempt_id
            AND ak.mahasiswa_id = get_current_mahasiswa_id()
            AND ak.status IN ('pending', 'in_progress')
        )
    );

-- DOSEN: Can update jawaban for grading (poin_diperoleh, is_correct, feedback)
CREATE POLICY "jawaban_update_dosen" ON jawaban
    FOR UPDATE
    USING (
        is_dosen() AND EXISTS (
            SELECT 1 FROM attempt_kuis ak
            INNER JOIN kuis k ON k.id = ak.kuis_id
            WHERE ak.id = jawaban.attempt_id
            AND k.dosen_id = get_current_dosen_id()
        )
    );

-- ADMIN: Can update any jawaban
CREATE POLICY "jawaban_update_admin" ON jawaban
    FOR UPDATE
    USING (is_admin());

-- ============================================================================
-- DELETE POLICIES
-- ============================================================================

-- ADMIN: Can delete any jawaban
CREATE POLICY "jawaban_delete_admin" ON jawaban
    FOR DELETE
    USING (is_admin());

-- DOSEN: Can delete jawaban for their kuis (if needed)
CREATE POLICY "jawaban_delete_dosen" ON jawaban
    FOR DELETE
    USING (
        is_dosen() AND EXISTS (
            SELECT 1 FROM attempt_kuis ak
            INNER JOIN kuis k ON k.id = ak.kuis_id
            WHERE ak.id = jawaban.attempt_id
            AND k.dosen_id = get_current_dosen_id()
        )
    );

-- ============================================================================
-- ADD COMMENTS
-- ============================================================================

COMMENT ON TABLE jawaban IS
'RLS enabled: Admin full access, Dosen can grade, Mahasiswa can submit their own answers';

-- ============================================================================
-- VALIDATION
-- ============================================================================

DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = 'jawaban';

    IF policy_count >= 9 THEN
        RAISE NOTICE '✅ JAWABAN RLS POLICIES MIGRATION COMPLETE';
        RAISE NOTICE 'Total policies created: %', policy_count;
    ELSE
        RAISE WARNING '⚠️  Expected at least 9 policies, found %', policy_count;
    END IF;
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON SCHEMA public IS
'Jawaban RLS Policies installed - Fix for 403 Forbidden on answer submission

Security Level: HIGH
- Jawaban table protected with RLS
- 9+ policies implemented (SELECT, INSERT, UPDATE, DELETE for Admin + Dosen + Mahasiswa)
- Mahasiswa can only submit/update answers for their own active attempts
- Dosen can grade answers for their kuis
- Admin has full access

Fixed Issue:
- Mahasiswa can now insert/update jawaban for their quiz attempts
- 403 Forbidden / RLS violation error resolved
- Auto-save functionality now works
';
