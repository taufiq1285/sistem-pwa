-- ============================================================================
-- SOAL TABLE RLS POLICIES
-- Fix for: Dosen cannot create soal (403 Forbidden)
-- ============================================================================
-- Description: Add missing RLS policies for soal table
-- Date: 2025-12-03
-- Issue: Only SELECT policy exists, missing INSERT/UPDATE/DELETE policies
-- ============================================================================

-- ============================================================================
-- DROP OLD PERMISSIVE POLICY
-- ============================================================================

DROP POLICY IF EXISTS "soal_select" ON soal;

-- ============================================================================
-- SOAL TABLE POLICIES
-- ============================================================================

ALTER TABLE soal ENABLE ROW LEVEL SECURITY;

-- ADMIN: Can see all soal
CREATE POLICY "soal_select_admin" ON soal
    FOR SELECT
    USING (is_admin());

-- DOSEN: Can see soal for their own kuis
CREATE POLICY "soal_select_dosen" ON soal
    FOR SELECT
    USING (
        is_dosen() AND kuis_id IN (
            SELECT id FROM kuis WHERE dosen_id = get_current_dosen_id()
        )
    );

-- MAHASISWA: Can see soal for published kuis in their enrolled kelas
CREATE POLICY "soal_select_mahasiswa" ON soal
    FOR SELECT
    USING (
        is_mahasiswa() AND kuis_id IN (
            SELECT id FROM kuis
            WHERE status = 'published'
            AND kelas_id = ANY(get_mahasiswa_kelas_ids())
        )
    );

-- DOSEN: Can create soal for their own kuis
CREATE POLICY "soal_insert_dosen" ON soal
    FOR INSERT
    WITH CHECK (
        is_dosen() AND kuis_id IN (
            SELECT id FROM kuis WHERE dosen_id = get_current_dosen_id()
        )
    );

-- ADMIN: Can create any soal
CREATE POLICY "soal_insert_admin" ON soal
    FOR INSERT
    WITH CHECK (is_admin());

-- DOSEN: Can update soal for their own kuis
CREATE POLICY "soal_update_dosen" ON soal
    FOR UPDATE
    USING (
        is_dosen() AND kuis_id IN (
            SELECT id FROM kuis WHERE dosen_id = get_current_dosen_id()
        )
    );

-- ADMIN: Can update any soal
CREATE POLICY "soal_update_admin" ON soal
    FOR UPDATE
    USING (is_admin());

-- DOSEN: Can delete soal for their own kuis
CREATE POLICY "soal_delete_dosen" ON soal
    FOR DELETE
    USING (
        is_dosen() AND kuis_id IN (
            SELECT id FROM kuis WHERE dosen_id = get_current_dosen_id()
        )
    );

-- ADMIN: Can delete any soal
CREATE POLICY "soal_delete_admin" ON soal
    FOR DELETE
    USING (is_admin());

COMMENT ON TABLE soal IS
'RLS enabled: Admin full access, Dosen own kuis soal, Mahasiswa published kuis only';

-- ============================================================================
-- VALIDATION
-- ============================================================================

DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = 'soal';

    IF policy_count >= 8 THEN
        RAISE NOTICE '✅ SOAL RLS POLICIES MIGRATION COMPLETE';
        RAISE NOTICE 'Total policies created: %', policy_count;
    ELSE
        RAISE WARNING '⚠️  Expected at least 8 policies, found %', policy_count;
    END IF;
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON SCHEMA public IS
'Soal RLS Policies installed - Fix for 403 Forbidden on soal creation

Security Level: HIGH
- Soal table protected with RLS
- 8 policies implemented (SELECT, INSERT, UPDATE, DELETE for Admin + Dosen + Mahasiswa)
- Dosen can manage soal for their own kuis
- Mahasiswa can view soal for published kuis only
- Admin has full access

Fixed Issue:
- Dosen can now create/update/delete soal for their kuis
- 403 Forbidden error resolved
';
