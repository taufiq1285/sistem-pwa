-- ============================================================================
-- FIX: RLS Performance Warnings dari Supabase Performance Advisor
-- Run this script di Supabase SQL Editor
-- ============================================================================
-- Issues Fixed:
-- 1. auth_rls_initplan - Wrap auth functions dengan (SELECT ...)
-- 2. multiple_permissive_policies - Gabungkan policies jadi satu per action
-- ============================================================================

-- ============================================================================
-- STEP 1: UPDATE HELPER FUNCTIONS (Optimized with SELECT wrapper)
-- ============================================================================

-- Function to get current user's role (optimized)
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM users
    WHERE id = (SELECT auth.uid());
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

-- Function to get current dosen ID (optimized)
CREATE OR REPLACE FUNCTION get_dosen_id()
RETURNS UUID AS $$
DECLARE
    v_dosen_id UUID;
BEGIN
    SELECT id INTO v_dosen_id
    FROM dosen
    WHERE user_id = (SELECT auth.uid());
    RETURN v_dosen_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to get current mahasiswa ID (optimized)
CREATE OR REPLACE FUNCTION get_current_mahasiswa_id()
RETURNS UUID AS $$
DECLARE
    v_mahasiswa_id UUID;
BEGIN
    SELECT id INTO v_mahasiswa_id
    FROM mahasiswa
    WHERE user_id = (SELECT auth.uid());
    RETURN v_mahasiswa_id;
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
    WHERE mahasiswa_id = (SELECT get_current_mahasiswa_id())
    AND is_active = TRUE;
    RETURN COALESCE(kelas_ids, ARRAY[]::UUID[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- STEP 2: FIX jadwal_praktikum POLICIES (Unified)
-- ============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "jadwal_praktikum_select_all" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_manage" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_select_unified" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_insert_unified" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_update_unified" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_delete_unified" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_insert_dosen" ON jadwal_praktikum;
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

-- Create UNIFIED policies (single policy per action)
CREATE POLICY "jadwal_praktikum_select_unified" ON jadwal_praktikum
    FOR SELECT
    USING (
        (SELECT is_admin()) OR
        (SELECT is_laboran()) OR
        ((SELECT is_dosen()) AND (
            is_active = true OR
            kelas_id IN (SELECT id FROM kelas WHERE dosen_id = (SELECT get_dosen_id()))
        )) OR
        ((SELECT is_mahasiswa()) AND is_active = true AND kelas_id IN (SELECT unnest((SELECT get_mahasiswa_kelas_ids()))))
    );

CREATE POLICY "jadwal_praktikum_insert_unified" ON jadwal_praktikum
    FOR INSERT
    WITH CHECK (
        (SELECT is_admin()) OR
        (SELECT is_laboran()) OR
        ((SELECT is_dosen()) AND kelas_id IN (SELECT id FROM kelas WHERE dosen_id = (SELECT get_dosen_id())))
    );

CREATE POLICY "jadwal_praktikum_update_unified" ON jadwal_praktikum
    FOR UPDATE
    USING (
        (SELECT is_admin()) OR
        (SELECT is_laboran()) OR
        ((SELECT is_dosen()) AND kelas_id IN (SELECT id FROM kelas WHERE dosen_id = (SELECT get_dosen_id())))
    )
    WITH CHECK (
        (SELECT is_admin()) OR
        (SELECT is_laboran()) OR
        ((SELECT is_dosen()) AND kelas_id IN (SELECT id FROM kelas WHERE dosen_id = (SELECT get_dosen_id())))
    );

CREATE POLICY "jadwal_praktikum_delete_unified" ON jadwal_praktikum
    FOR DELETE
    USING (
        (SELECT is_admin()) OR
        ((SELECT is_laboran()) AND is_active = false) OR
        ((SELECT is_dosen()) AND is_active = false AND kelas_id IN (SELECT id FROM kelas WHERE dosen_id = (SELECT get_dosen_id())))
    );

-- ============================================================================
-- STEP 3: FIX bank_soal POLICIES (Unified)
-- ============================================================================

DROP POLICY IF EXISTS "Admin can view all questions" ON bank_soal;
DROP POLICY IF EXISTS "Dosen can view own questions" ON bank_soal;
DROP POLICY IF EXISTS "Dosen can create questions" ON bank_soal;
DROP POLICY IF EXISTS "Dosen can update own questions" ON bank_soal;
DROP POLICY IF EXISTS "Dosen can delete own questions" ON bank_soal;
DROP POLICY IF EXISTS "bank_soal_select_unified" ON bank_soal;
DROP POLICY IF EXISTS "bank_soal_insert_unified" ON bank_soal;
DROP POLICY IF EXISTS "bank_soal_update_unified" ON bank_soal;
DROP POLICY IF EXISTS "bank_soal_delete_unified" ON bank_soal;

CREATE POLICY "bank_soal_select_unified" ON bank_soal
    FOR SELECT
    USING (
        (SELECT is_admin()) OR
        ((SELECT is_dosen()) AND dosen_id = (SELECT get_dosen_id()))
    );

CREATE POLICY "bank_soal_insert_unified" ON bank_soal
    FOR INSERT
    WITH CHECK (
        (SELECT is_admin()) OR
        ((SELECT is_dosen()) AND dosen_id = (SELECT get_dosen_id()))
    );

CREATE POLICY "bank_soal_update_unified" ON bank_soal
    FOR UPDATE
    USING (
        (SELECT is_admin()) OR
        ((SELECT is_dosen()) AND dosen_id = (SELECT get_dosen_id()))
    )
    WITH CHECK (
        (SELECT is_admin()) OR
        ((SELECT is_dosen()) AND dosen_id = (SELECT get_dosen_id()))
    );

CREATE POLICY "bank_soal_delete_unified" ON bank_soal
    FOR DELETE
    USING (
        (SELECT is_admin()) OR
        ((SELECT is_dosen()) AND dosen_id = (SELECT get_dosen_id()))
    );

-- ============================================================================
-- STEP 4: FIX conflict_log POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Admin can view all conflicts" ON conflict_log;
DROP POLICY IF EXISTS "conflict_log_select_unified" ON conflict_log;

CREATE POLICY "conflict_log_select_unified" ON conflict_log
    FOR SELECT
    USING ((SELECT is_admin()));

-- ============================================================================
-- STEP 5: FIX permintaan_perbaikan_nilai POLICIES (Unified)
-- ============================================================================

DROP POLICY IF EXISTS "Mahasiswa can view own requests" ON permintaan_perbaikan_nilai;
DROP POLICY IF EXISTS "Mahasiswa can create requests" ON permintaan_perbaikan_nilai;
DROP POLICY IF EXISTS "Mahasiswa can cancel own pending requests" ON permintaan_perbaikan_nilai;
DROP POLICY IF EXISTS "Dosen can view requests for their classes" ON permintaan_perbaikan_nilai;
DROP POLICY IF EXISTS "Dosen can update requests for their classes" ON permintaan_perbaikan_nilai;
DROP POLICY IF EXISTS "Admin can view all requests" ON permintaan_perbaikan_nilai;
DROP POLICY IF EXISTS "permintaan_perbaikan_nilai_select_unified" ON permintaan_perbaikan_nilai;
DROP POLICY IF EXISTS "permintaan_perbaikan_nilai_insert_unified" ON permintaan_perbaikan_nilai;
DROP POLICY IF EXISTS "permintaan_perbaikan_nilai_update_unified" ON permintaan_perbaikan_nilai;

CREATE POLICY "permintaan_perbaikan_nilai_select_unified" ON permintaan_perbaikan_nilai
    FOR SELECT
    USING (
        (SELECT is_admin()) OR
        ((SELECT is_mahasiswa()) AND mahasiswa_id = (SELECT get_current_mahasiswa_id())) OR
        ((SELECT is_dosen()) AND EXISTS (
            SELECT 1 FROM kelas k
            WHERE k.id = permintaan_perbaikan_nilai.kelas_id
            AND k.dosen_id = (SELECT get_dosen_id())
        ))
    );

CREATE POLICY "permintaan_perbaikan_nilai_insert_unified" ON permintaan_perbaikan_nilai
    FOR INSERT
    WITH CHECK (
        (SELECT is_mahasiswa()) AND mahasiswa_id = (SELECT get_current_mahasiswa_id())
    );

CREATE POLICY "permintaan_perbaikan_nilai_update_unified" ON permintaan_perbaikan_nilai
    FOR UPDATE
    USING (
        ((SELECT is_mahasiswa()) AND mahasiswa_id = (SELECT get_current_mahasiswa_id()) AND status = 'pending') OR
        ((SELECT is_dosen()) AND EXISTS (
            SELECT 1 FROM kelas k
            WHERE k.id = permintaan_perbaikan_nilai.kelas_id
            AND k.dosen_id = (SELECT get_dosen_id())
        ))
    )
    WITH CHECK (
        ((SELECT is_mahasiswa()) AND mahasiswa_id = (SELECT get_current_mahasiswa_id()) AND status = 'cancelled') OR
        ((SELECT is_dosen()) AND EXISTS (
            SELECT 1 FROM kelas k
            WHERE k.id = permintaan_perbaikan_nilai.kelas_id
            AND k.dosen_id = (SELECT get_dosen_id())
        ))
    );

-- ============================================================================
-- STEP 6: FIX jawaban POLICIES (Unified)
-- ============================================================================

DROP POLICY IF EXISTS "jawaban_select_admin" ON jawaban;
DROP POLICY IF EXISTS "jawaban_select_dosen" ON jawaban;
DROP POLICY IF EXISTS "jawaban_select_mahasiswa" ON jawaban;
DROP POLICY IF EXISTS "jawaban_insert_admin" ON jawaban;
DROP POLICY IF EXISTS "jawaban_insert_mahasiswa" ON jawaban;
DROP POLICY IF EXISTS "jawaban_update_admin" ON jawaban;
DROP POLICY IF EXISTS "jawaban_update_dosen" ON jawaban;
DROP POLICY IF EXISTS "jawaban_update_mahasiswa" ON jawaban;
DROP POLICY IF EXISTS "jawaban_delete_admin" ON jawaban;
DROP POLICY IF EXISTS "jawaban_delete_dosen" ON jawaban;
DROP POLICY IF EXISTS "jawaban_select_unified" ON jawaban;
DROP POLICY IF EXISTS "jawaban_insert_unified" ON jawaban;
DROP POLICY IF EXISTS "jawaban_update_unified" ON jawaban;
DROP POLICY IF EXISTS "jawaban_delete_unified" ON jawaban;

CREATE POLICY "jawaban_select_unified" ON jawaban
    FOR SELECT
    USING (
        (SELECT is_admin()) OR
        ((SELECT is_dosen()) AND EXISTS (
            SELECT 1 FROM attempt_kuis ak
            JOIN kuis k ON k.id = ak.kuis_id
            WHERE ak.id = jawaban.attempt_id
            AND k.dosen_id = (SELECT get_dosen_id())
        )) OR
        ((SELECT is_mahasiswa()) AND EXISTS (
            SELECT 1 FROM attempt_kuis ak
            WHERE ak.id = jawaban.attempt_id
            AND ak.mahasiswa_id = (SELECT get_current_mahasiswa_id())
        ))
    );

CREATE POLICY "jawaban_insert_unified" ON jawaban
    FOR INSERT
    WITH CHECK (
        (SELECT is_admin()) OR
        ((SELECT is_mahasiswa()) AND EXISTS (
            SELECT 1 FROM attempt_kuis ak
            WHERE ak.id = jawaban.attempt_id
            AND ak.mahasiswa_id = (SELECT get_current_mahasiswa_id())
        ))
    );

CREATE POLICY "jawaban_update_unified" ON jawaban
    FOR UPDATE
    USING (
        (SELECT is_admin()) OR
        ((SELECT is_dosen()) AND EXISTS (
            SELECT 1 FROM attempt_kuis ak
            JOIN kuis k ON k.id = ak.kuis_id
            WHERE ak.id = jawaban.attempt_id
            AND k.dosen_id = (SELECT get_dosen_id())
        )) OR
        ((SELECT is_mahasiswa()) AND EXISTS (
            SELECT 1 FROM attempt_kuis ak
            WHERE ak.id = jawaban.attempt_id
            AND ak.mahasiswa_id = (SELECT get_current_mahasiswa_id())
            AND ak.status = 'in_progress'
        ))
    )
    WITH CHECK (
        (SELECT is_admin()) OR
        ((SELECT is_dosen()) AND EXISTS (
            SELECT 1 FROM attempt_kuis ak
            JOIN kuis k ON k.id = ak.kuis_id
            WHERE ak.id = jawaban.attempt_id
            AND k.dosen_id = (SELECT get_dosen_id())
        )) OR
        ((SELECT is_mahasiswa()) AND EXISTS (
            SELECT 1 FROM attempt_kuis ak
            WHERE ak.id = jawaban.attempt_id
            AND ak.mahasiswa_id = (SELECT get_current_mahasiswa_id())
            AND ak.status = 'in_progress'
        ))
    );

CREATE POLICY "jawaban_delete_unified" ON jawaban
    FOR DELETE
    USING (
        (SELECT is_admin()) OR
        ((SELECT is_dosen()) AND EXISTS (
            SELECT 1 FROM attempt_kuis ak
            JOIN kuis k ON k.id = ak.kuis_id
            WHERE ak.id = jawaban.attempt_id
            AND k.dosen_id = (SELECT get_dosen_id())
        ))
    );

-- ============================================================================
-- STEP 7: VERIFY - Check remaining warnings
-- ============================================================================

SELECT 
    tablename,
    COUNT(*) as policy_count,
    array_agg(policyname) as policies
FROM pg_policies 
WHERE tablename IN ('jadwal_praktikum', 'bank_soal', 'conflict_log', 'permintaan_perbaikan_nilai', 'jawaban')
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ RLS Performance optimizations applied!';
    RAISE NOTICE '✅ auth_rls_initplan: Fixed with (SELECT auth.uid()) wrapper';
    RAISE NOTICE '✅ multiple_permissive_policies: Merged into unified policies';
    RAISE NOTICE '📝 Refresh Supabase Performance Advisor to verify';
END $$;
