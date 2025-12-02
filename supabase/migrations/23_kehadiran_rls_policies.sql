-- ============================================================================
-- RLS POLICIES FOR KEHADIRAN TABLE
-- ============================================================================
-- Created: 2025-11-29
-- Purpose: Add missing RLS policies for kehadiran (attendance) table
-- ============================================================================

-- ============================================================================
-- DROP EXISTING POLICIES (IF ANY)
-- ============================================================================

DROP POLICY IF EXISTS "kehadiran_select_admin" ON kehadiran;
DROP POLICY IF EXISTS "kehadiran_select_dosen" ON kehadiran;
DROP POLICY IF EXISTS "kehadiran_select_mahasiswa" ON kehadiran;
DROP POLICY IF EXISTS "kehadiran_insert_admin" ON kehadiran;
DROP POLICY IF EXISTS "kehadiran_insert_dosen" ON kehadiran;
DROP POLICY IF EXISTS "kehadiran_update_admin" ON kehadiran;
DROP POLICY IF EXISTS "kehadiran_update_dosen" ON kehadiran;
DROP POLICY IF EXISTS "kehadiran_delete_admin" ON kehadiran;
DROP POLICY IF EXISTS "kehadiran_delete_dosen" ON kehadiran;

-- ============================================================================
-- SELECT POLICIES (WHO CAN VIEW KEHADIRAN)
-- ============================================================================

-- Admin can view all kehadiran
CREATE POLICY "kehadiran_select_admin" ON kehadiran
    FOR SELECT
    USING (is_admin());

-- Dosen can view kehadiran for their own kelas
CREATE POLICY "kehadiran_select_dosen" ON kehadiran
    FOR SELECT
    USING (
        is_dosen() AND EXISTS (
            SELECT 1 FROM jadwal_praktikum jp
            JOIN kelas k ON k.id = jp.kelas_id
            WHERE jp.id = kehadiran.jadwal_id
            AND k.dosen_id = get_current_dosen_id()
        )
    );

-- Mahasiswa can view their own kehadiran
CREATE POLICY "kehadiran_select_mahasiswa" ON kehadiran
    FOR SELECT
    USING (
        is_mahasiswa() AND mahasiswa_id = get_current_mahasiswa_id()
    );

-- ============================================================================
-- INSERT POLICIES (WHO CAN CREATE KEHADIRAN)
-- ============================================================================

-- Admin can insert any kehadiran
CREATE POLICY "kehadiran_insert_admin" ON kehadiran
    FOR INSERT
    WITH CHECK (is_admin());

-- Dosen can insert kehadiran for their own kelas
CREATE POLICY "kehadiran_insert_dosen" ON kehadiran
    FOR INSERT
    WITH CHECK (
        is_dosen() AND EXISTS (
            SELECT 1 FROM jadwal_praktikum jp
            JOIN kelas k ON k.id = jp.kelas_id
            WHERE jp.id = jadwal_id
            AND k.dosen_id = get_current_dosen_id()
        )
    );

-- ============================================================================
-- UPDATE POLICIES (WHO CAN UPDATE KEHADIRAN)
-- ============================================================================

-- Admin can update any kehadiran
CREATE POLICY "kehadiran_update_admin" ON kehadiran
    FOR UPDATE
    USING (is_admin())
    WITH CHECK (is_admin());

-- Dosen can update kehadiran for their own kelas
CREATE POLICY "kehadiran_update_dosen" ON kehadiran
    FOR UPDATE
    USING (
        is_dosen() AND EXISTS (
            SELECT 1 FROM jadwal_praktikum jp
            JOIN kelas k ON k.id = jp.kelas_id
            WHERE jp.id = kehadiran.jadwal_id
            AND k.dosen_id = get_current_dosen_id()
        )
    )
    WITH CHECK (
        is_dosen() AND EXISTS (
            SELECT 1 FROM jadwal_praktikum jp
            JOIN kelas k ON k.id = jp.kelas_id
            WHERE jp.id = jadwal_id
            AND k.dosen_id = get_current_dosen_id()
        )
    );

-- ============================================================================
-- DELETE POLICIES (WHO CAN DELETE KEHADIRAN)
-- ============================================================================

-- Admin can delete any kehadiran
CREATE POLICY "kehadiran_delete_admin" ON kehadiran
    FOR DELETE
    USING (is_admin());

-- Dosen can delete kehadiran for their own kelas
CREATE POLICY "kehadiran_delete_dosen" ON kehadiran
    FOR DELETE
    USING (
        is_dosen() AND EXISTS (
            SELECT 1 FROM jadwal_praktikum jp
            JOIN kelas k ON k.id = jp.kelas_id
            WHERE jp.id = kehadiran.jadwal_id
            AND k.dosen_id = get_current_dosen_id()
        )
    );

-- ============================================================================
-- END OF KEHADIRAN RLS POLICIES
-- ============================================================================
