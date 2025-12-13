-- ============================================================================
-- PHASE 3 STEP 4: CONSOLIDATE POLICIES - ACADEMIC TABLES
-- ============================================================================

-- ============================================================================
-- TABLE: jadwal_praktikum (DELETE, SELECT, UPDATE: 3 each)
-- ============================================================================
DROP POLICY IF EXISTS "jadwal_praktikum_delete_admin" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_delete_dosen" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_delete_laboran" ON jadwal_praktikum;

CREATE POLICY "jadwal_praktikum_delete_unified" ON jadwal_praktikum
  FOR DELETE
  USING (is_admin() OR is_dosen() OR is_laboran());

DROP POLICY IF EXISTS "jadwal_select_admin" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_select_dosen" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_select_laboran" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_select_mahasiswa" ON jadwal_praktikum;

CREATE POLICY "jadwal_praktikum_select_unified" ON jadwal_praktikum
  FOR SELECT
  USING (
    is_admin() OR
    is_dosen() OR
    is_laboran() OR
    is_mahasiswa()
  );

DROP POLICY IF EXISTS "jadwal_praktikum_update_admin" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_update_dosen" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_update_laboran" ON jadwal_praktikum;

CREATE POLICY "jadwal_praktikum_update_unified" ON jadwal_praktikum
  FOR UPDATE
  USING (is_admin() OR is_dosen() OR is_laboran());

-- ============================================================================
-- TABLE: kehadiran (DELETE, INSERT, SELECT, UPDATE: 2-3 each)
-- ============================================================================
DROP POLICY IF EXISTS "kehadiran_delete_admin" ON kehadiran;
DROP POLICY IF EXISTS "kehadiran_delete_dosen" ON kehadiran;

CREATE POLICY "kehadiran_delete_unified" ON kehadiran
  FOR DELETE
  USING (is_admin() OR is_dosen());

DROP POLICY IF EXISTS "kehadiran_insert_admin" ON kehadiran;
DROP POLICY IF EXISTS "kehadiran_insert_dosen" ON kehadiran;

CREATE POLICY "kehadiran_insert_unified" ON kehadiran
  FOR INSERT
  WITH CHECK (is_admin() OR is_dosen());

DROP POLICY IF EXISTS "kehadiran_select_admin" ON kehadiran;
DROP POLICY IF EXISTS "kehadiran_select_dosen" ON kehadiran;
DROP POLICY IF EXISTS "kehadiran_select_mahasiswa" ON kehadiran;

CREATE POLICY "kehadiran_select_unified" ON kehadiran
  FOR SELECT
  USING (
    is_admin() OR
    is_dosen() OR
    (is_mahasiswa() AND mahasiswa_id = get_current_mahasiswa_id())
  );

DROP POLICY IF EXISTS "kehadiran_update_admin" ON kehadiran;
DROP POLICY IF EXISTS "kehadiran_update_dosen" ON kehadiran;

CREATE POLICY "kehadiran_update_unified" ON kehadiran
  FOR UPDATE
  USING (is_admin() OR is_dosen());

-- ============================================================================
-- TABLE: kelas_mahasiswa (DELETE, INSERT, SELECT, UPDATE: 2 each)
-- ============================================================================
DROP POLICY IF EXISTS "kelas_mahasiswa_delete_admin" ON kelas_mahasiswa;
DROP POLICY IF EXISTS "kelas_mahasiswa_delete_dosen" ON kelas_mahasiswa;

CREATE POLICY "kelas_mahasiswa_delete_unified" ON kelas_mahasiswa
  FOR DELETE
  USING (is_admin() OR is_dosen());

DROP POLICY IF EXISTS "kelas_mahasiswa_insert_admin" ON kelas_mahasiswa;
DROP POLICY IF EXISTS "kelas_mahasiswa_insert_dosen" ON kelas_mahasiswa;

CREATE POLICY "kelas_mahasiswa_insert_unified" ON kelas_mahasiswa
  FOR INSERT
  WITH CHECK (is_admin() OR is_dosen());

DROP POLICY IF EXISTS "kelas_mahasiswa_select_admin" ON kelas_mahasiswa;
DROP POLICY IF EXISTS "kelas_mahasiswa_select_dosen" ON kelas_mahasiswa;
DROP POLICY IF EXISTS "kelas_mahasiswa_select_mahasiswa" ON kelas_mahasiswa;

CREATE POLICY "kelas_mahasiswa_select_unified" ON kelas_mahasiswa
  FOR SELECT
  USING (
    is_admin() OR
    is_dosen() OR
    (is_mahasiswa() AND mahasiswa_id = get_current_mahasiswa_id())
  );

DROP POLICY IF EXISTS "kelas_mahasiswa_update_admin" ON kelas_mahasiswa;
DROP POLICY IF EXISTS "kelas_mahasiswa_update_dosen" ON kelas_mahasiswa;

CREATE POLICY "kelas_mahasiswa_update_unified" ON kelas_mahasiswa
  FOR UPDATE
  USING (is_admin() OR is_dosen());

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename IN (
  'jadwal_praktikum', 'kehadiran', 'kelas_mahasiswa'
)
GROUP BY tablename
ORDER BY tablename;

-- Expected: Significant policy reduction
