-- ============================================================================
-- MIGRATION STEP 2G: Update RLS Policies
-- ============================================================================
-- Jalankan file ini SETELAH STEP 2F
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "kehadiran_select_dosen" ON kehadiran;
DROP POLICY IF EXISTS "kehadiran_insert_dosen" ON kehadiran;
DROP POLICY IF EXISTS "kehadiran_update_dosen" ON kehadiran;
DROP POLICY IF EXISTS "kehadiran_select_mahasiswa" ON kehadiran;
DROP POLICY IF EXISTS "kehadiran_admin_all" ON kehadiran;

-- Policy for dosen SELECT (support both jadwal and kelas mode)
CREATE POLICY "kehadiran_select_dosen" ON kehadiran
FOR SELECT
USING (
    is_dosen() AND (
        jadwal_id IN (
            SELECT j.id FROM jadwal_praktikum j WHERE j.dosen_id = get_dosen_id()
        ) OR
        kelas_id IN (
            SELECT k.id FROM kelas k WHERE k.dosen_id = get_dosen_id()
        )
    )
);

-- Policy for dosen INSERT
CREATE POLICY "kehadiran_insert_dosen" ON kehadiran
FOR INSERT
WITH CHECK (
    is_dosen() AND (
        jadwal_id IN (
            SELECT j.id FROM jadwal_praktikum j WHERE j.dosen_id = get_dosen_id()
        ) OR
        kelas_id IN (
            SELECT k.id FROM kelas k WHERE k.dosen_id = get_dosen_id()
        )
    )
);

-- Policy for dosen UPDATE
CREATE POLICY "kehadiran_update_dosen" ON kehadiran
FOR UPDATE
USING (
    is_dosen() AND (
        jadwal_id IN (
            SELECT j.id FROM jadwal_praktikum j WHERE j.dosen_id = get_dosen_id()
        ) OR
        kelas_id IN (
            SELECT k.id FROM kelas k WHERE k.dosen_id = get_dosen_id()
        )
    )
);

-- Policy for mahasiswa (view their own attendance)
CREATE POLICY "kehadiran_select_mahasiswa" ON kehadiran
FOR SELECT
USING (is_mahasiswa() AND mahasiswa_id = get_mahasiswa_id());

-- Policy for admin (full access)
CREATE POLICY "kehadiran_admin_all" ON kehadiran
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- ============================================================================
-- DONE! Lanjut ke MIGRATION_STEP_3 (Verification)
-- ============================================================================
