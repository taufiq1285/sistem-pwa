/**
 * Migration: Fix Jadwal Praktikum RLS Policy
 *
 * Purpose: Strengthen jadwal_praktikum security to match materi and kuis
 *
 * BEFORE:
 * - All authenticated users can SELECT all jadwal (too permissive)
 * - Mahasiswa can query jadwal for classes they're NOT enrolled in
 *
 * AFTER:
 * - Mahasiswa can only SELECT jadwal for their enrolled classes
 * - Consistent security with materi and kuis tables
 *
 * Changes:
 * 1. Drop overly permissive "jadwal_praktikum_select_all" policy
 * 2. Add specific policies for each role:
 *    - Admin: Full access
 *    - Dosen: Can see jadwal for their classes
 *    - Mahasiswa: Can only see jadwal for enrolled classes
 *    - Laboran: Can see all jadwal (operational needs)
 */

-- ============================================================================
-- DROP OLD PERMISSIVE POLICY
-- ============================================================================

DROP POLICY IF EXISTS "jadwal_praktikum_select_all" ON jadwal_praktikum;

-- ============================================================================
-- CREATE ROLE-SPECIFIC SELECT POLICIES
-- ============================================================================

-- ADMIN: Can see all jadwal
CREATE POLICY "jadwal_praktikum_select_admin" ON jadwal_praktikum
    FOR SELECT
    USING (is_admin());

-- DOSEN: Can see jadwal for their kelas
CREATE POLICY "jadwal_praktikum_select_dosen" ON jadwal_praktikum
    FOR SELECT
    USING (
        is_dosen()
        AND kelas_id IN (
            SELECT id FROM kelas WHERE dosen_id = get_current_dosen_id()
        )
    );

-- MAHASISWA: Can only see jadwal for their enrolled kelas
-- ✅ SECURITY FIX: Filter by enrolled kelas (same as materi/kuis)
CREATE POLICY "jadwal_praktikum_select_mahasiswa" ON jadwal_praktikum
    FOR SELECT
    USING (
        is_mahasiswa()
        AND kelas_id = ANY(get_mahasiswa_kelas_ids())
    );

-- LABORAN: Can see all jadwal (operational needs)
CREATE POLICY "jadwal_praktikum_select_laboran" ON jadwal_praktikum
    FOR SELECT
    USING (is_laboran());

-- ============================================================================
-- UPDATE TABLE COMMENT
-- ============================================================================

COMMENT ON TABLE jadwal_praktikum IS
'RLS enabled: Role-based access - Mahasiswa see only enrolled kelas jadwal';

-- ============================================================================
-- VERIFICATION QUERIES (commented out - for manual testing)
-- ============================================================================

-- Test as Mahasiswa (should only see enrolled kelas jadwal):
-- SELECT * FROM jadwal_praktikum;

-- Test with specific kelas_id (should work only if enrolled):
-- SELECT * FROM jadwal_praktikum WHERE kelas_id = 'some-kelas-id';

-- Check enrolled kelas:
-- SELECT get_mahasiswa_kelas_ids();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
