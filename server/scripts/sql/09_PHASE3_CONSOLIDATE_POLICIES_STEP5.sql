-- ============================================================================
-- PHASE 3 STEP 5: CONSOLIDATE POLICIES - ASSESSMENT & CONTENT TABLES
-- ============================================================================

-- ============================================================================
-- TABLE: kuis (DELETE, INSERT, SELECT, UPDATE: 2 each)
-- ============================================================================
DROP POLICY IF EXISTS "kuis_delete_admin" ON kuis;
DROP POLICY IF EXISTS "kuis_delete_dosen" ON kuis;

CREATE POLICY "kuis_delete_unified" ON kuis
  FOR DELETE
  USING (is_admin() OR is_dosen());

DROP POLICY IF EXISTS "kuis_insert_admin" ON kuis;
DROP POLICY IF EXISTS "kuis_insert_dosen" ON kuis;

CREATE POLICY "kuis_insert_unified" ON kuis
  FOR INSERT
  WITH CHECK (is_admin() OR is_dosen());

DROP POLICY IF EXISTS "kuis_select_admin" ON kuis;
DROP POLICY IF EXISTS "kuis_select_dosen" ON kuis;
DROP POLICY IF EXISTS "kuis_select_mahasiswa" ON kuis;

CREATE POLICY "kuis_select_unified" ON kuis
  FOR SELECT
  USING (
    is_admin() OR
    is_dosen() OR
    (is_mahasiswa() AND kelas_id IN (SELECT kelas_id FROM kelas_mahasiswa WHERE mahasiswa_id = get_current_mahasiswa_id()))
  );

DROP POLICY IF EXISTS "kuis_update_admin" ON kuis;
DROP POLICY IF EXISTS "kuis_update_dosen" ON kuis;

CREATE POLICY "kuis_update_unified" ON kuis
  FOR UPDATE
  USING (is_admin() OR is_dosen());

-- ============================================================================
-- TABLE: soal (DELETE, INSERT, SELECT, UPDATE: 2 each)
-- ============================================================================
DROP POLICY IF EXISTS "soal_delete_admin" ON soal;
DROP POLICY IF EXISTS "soal_delete_dosen" ON soal;

CREATE POLICY "soal_delete_unified" ON soal
  FOR DELETE
  USING (is_admin() OR is_dosen());

DROP POLICY IF EXISTS "soal_insert_admin" ON soal;
DROP POLICY IF EXISTS "soal_insert_dosen" ON soal;

CREATE POLICY "soal_insert_unified" ON soal
  FOR INSERT
  WITH CHECK (is_admin() OR is_dosen());

DROP POLICY IF EXISTS "soal_select_admin" ON soal;
DROP POLICY IF EXISTS "soal_select_dosen" ON soal;
DROP POLICY IF EXISTS "soal_select_mahasiswa" ON soal;

CREATE POLICY "soal_select_unified" ON soal
  FOR SELECT
  USING (
    is_admin() OR
    is_dosen() OR
    (is_mahasiswa() AND kuis_id IN (
      SELECT id FROM kuis WHERE kelas_id IN (
        SELECT kelas_id FROM kelas_mahasiswa WHERE mahasiswa_id = get_current_mahasiswa_id()
      )
    ))
  );

DROP POLICY IF EXISTS "soal_update_admin" ON soal;
DROP POLICY IF EXISTS "soal_update_dosen" ON soal;

CREATE POLICY "soal_update_unified" ON soal
  FOR UPDATE
  USING (is_admin() OR is_dosen());

-- ============================================================================
-- TABLE: materi (DELETE, INSERT, SELECT, UPDATE: 2 each)
-- ============================================================================
DROP POLICY IF EXISTS "materi_delete_admin" ON materi;
DROP POLICY IF EXISTS "materi_delete_dosen" ON materi;

CREATE POLICY "materi_delete_unified" ON materi
  FOR DELETE
  USING (is_admin() OR is_dosen());

DROP POLICY IF EXISTS "materi_insert_admin" ON materi;
DROP POLICY IF EXISTS "materi_insert_dosen" ON materi;

CREATE POLICY "materi_insert_unified" ON materi
  FOR INSERT
  WITH CHECK (is_admin() OR is_dosen());

DROP POLICY IF EXISTS "materi_select_admin" ON materi;
DROP POLICY IF EXISTS "materi_select_dosen" ON materi;
DROP POLICY IF EXISTS "materi_select_mahasiswa" ON materi;

CREATE POLICY "materi_select_unified" ON materi
  FOR SELECT
  USING (
    is_admin() OR
    is_dosen() OR
    (is_mahasiswa() AND kelas_id IN (SELECT kelas_id FROM kelas_mahasiswa WHERE mahasiswa_id = get_current_mahasiswa_id()))
  );

DROP POLICY IF EXISTS "materi_update_admin" ON materi;
DROP POLICY IF EXISTS "materi_update_dosen" ON materi;

CREATE POLICY "materi_update_unified" ON materi
  FOR UPDATE
  USING (is_admin() OR is_dosen());

-- ============================================================================
-- TABLE: nilai (DELETE, INSERT, SELECT, UPDATE: 2 each)
-- ============================================================================
DROP POLICY IF EXISTS "nilai_delete_admin" ON nilai;
DROP POLICY IF EXISTS "nilai_delete_dosen" ON nilai;

CREATE POLICY "nilai_delete_unified" ON nilai
  FOR DELETE
  USING (is_admin() OR is_dosen());

DROP POLICY IF EXISTS "nilai_insert_admin" ON nilai;
DROP POLICY IF EXISTS "nilai_insert_dosen" ON nilai;

CREATE POLICY "nilai_insert_unified" ON nilai
  FOR INSERT
  WITH CHECK (is_admin() OR is_dosen());

DROP POLICY IF EXISTS "nilai_select_admin" ON nilai;
DROP POLICY IF EXISTS "nilai_select_dosen" ON nilai;
DROP POLICY IF EXISTS "nilai_select_mahasiswa" ON nilai;

CREATE POLICY "nilai_select_unified" ON nilai
  FOR SELECT
  USING (
    is_admin() OR
    is_dosen() OR
    (is_mahasiswa() AND mahasiswa_id = get_current_mahasiswa_id())
  );

DROP POLICY IF EXISTS "nilai_update_admin" ON nilai;
DROP POLICY IF EXISTS "nilai_update_dosen" ON nilai;

CREATE POLICY "nilai_update_unified" ON nilai
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
  'kuis', 'soal', 'materi', 'nilai'
)
GROUP BY tablename
ORDER BY tablename;

-- Expected: From 2-3 policies per action to 1 unified policy
