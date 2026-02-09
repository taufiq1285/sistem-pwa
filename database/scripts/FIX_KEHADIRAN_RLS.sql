-- ============================================================================
-- FIX: Update RLS Policies untuk Sistem Baru
-- Dosen tidak terikat ke kelas, jadi hapus check dosen_id
-- ============================================================================

-- Policy untuk dosen view kehadiran (semua kelas yang mereka input)
DROP POLICY IF EXISTS "kehadiran_select_dosen" ON kehadiran;
CREATE POLICY "kehadiran_select_dosen" ON kehadiran
    FOR SELECT
    USING (is_dosen());

COMMENT ON POLICY "kehadiran_select_dosen" ON kehadiran IS
'Allow dosen to view all attendance records (dosen bebas pilih kelas)';

-- Policy untuk dosen insert kehadiran (semua kelas)
DROP POLICY IF EXISTS "kehadiran_insert_dosen" ON kehadiran;
CREATE POLICY "kehadiran_insert_dosen" ON kehadiran
    FOR INSERT
    WITH CHECK (is_dosen());

COMMENT ON POLICY "kehadiran_insert_dosen" ON kehadiran IS
'Allow dosen to create attendance for any class';

-- Policy untuk dosen update kehadiran (semua kelas)
DROP POLICY IF EXISTS "kehadiran_update_dosen" ON kehadiran;
CREATE POLICY "kehadiran_update_dosen" ON kehadiran
    FOR UPDATE
    USING (is_dosen());

COMMENT ON POLICY "kehadiran_update_dosen" ON kehadiran IS
'Allow dosen to update attendance for any class';

-- Policy untuk mahasiswa view kehadiran mereka sendiri (tetap sama)
DROP POLICY IF EXISTS "kehadiran_select_mahasiswa" ON kehadiran;
CREATE POLICY "kehadiran_select_mahasiswa" ON kehadiran
    FOR SELECT
    USING (
        is_mahasiswa() AND
        mahasiswa_id = get_mahasiswa_id()
    );

COMMENT ON POLICY "kehadiran_select_mahasiswa" ON kehadiran IS
'Allow mahasiswa to view their own attendance records';

-- Admin full access (tetap sama)
DROP POLICY IF EXISTS "kehadiran_admin_all" ON kehadiran;
CREATE POLICY "kehadiran_admin_all" ON kehadiran
    FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

COMMENT ON POLICY "kehadiran_admin_all" ON kehadiran IS
'Allow admin full access to all attendance records';
