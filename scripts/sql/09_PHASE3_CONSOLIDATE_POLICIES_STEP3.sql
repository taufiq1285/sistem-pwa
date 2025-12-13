-- ============================================================================
-- PHASE 3 STEP 3: CONSOLIDATE POLICIES - OPERATIONAL TABLES
-- ============================================================================

-- ============================================================================
-- TABLE: inventaris (DELETE, INSERT, UPDATE: 2 each)
-- ============================================================================
-- DELETE consolidation
DROP POLICY IF EXISTS "inventaris_delete_admin" ON inventaris;
DROP POLICY IF EXISTS "inventaris_delete_laboran" ON inventaris;

CREATE POLICY "inventaris_delete_unified" ON inventaris
  FOR DELETE
  USING (is_admin() OR is_laboran());

-- INSERT consolidation
DROP POLICY IF EXISTS "inventaris_insert_admin" ON inventaris;
DROP POLICY IF EXISTS "inventaris_insert_laboran" ON inventaris;

CREATE POLICY "inventaris_insert_unified" ON inventaris
  FOR INSERT
  WITH CHECK (is_admin() OR is_laboran());

-- UPDATE consolidation
DROP POLICY IF EXISTS "inventaris_update_admin" ON inventaris;
DROP POLICY IF EXISTS "inventaris_update_laboran" ON inventaris;

CREATE POLICY "inventaris_update_unified" ON inventaris
  FOR UPDATE
  USING (is_admin() OR is_laboran());

-- ============================================================================
-- TABLE: laboratorium (DELETE, INSERT, UPDATE: 2 each)
-- ============================================================================
DROP POLICY IF EXISTS "laboratorium_delete_admin" ON laboratorium;
DROP POLICY IF EXISTS "laboratorium_delete_laboran" ON laboratorium;

CREATE POLICY "laboratorium_delete_unified" ON laboratorium
  FOR DELETE
  USING (is_admin() OR is_laboran());

DROP POLICY IF EXISTS "laboratorium_insert_admin" ON laboratorium;
DROP POLICY IF EXISTS "laboratorium_insert_laboran" ON laboratorium;

CREATE POLICY "laboratorium_insert_unified" ON laboratorium
  FOR INSERT
  WITH CHECK (is_admin() OR is_laboran());

DROP POLICY IF EXISTS "laboratorium_update_admin" ON laboratorium;
DROP POLICY IF EXISTS "laboratorium_update_laboran" ON laboratorium;

CREATE POLICY "laboratorium_update_unified" ON laboratorium
  FOR UPDATE
  USING (is_admin() OR is_laboran());

-- ============================================================================
-- TABLE: mata_kuliah (INSERT, UPDATE: 2 each)
-- ============================================================================
DROP POLICY IF EXISTS "mata_kuliah_insert_admin" ON mata_kuliah;
DROP POLICY IF EXISTS "mata_kuliah_insert_dosen" ON mata_kuliah;

CREATE POLICY "mata_kuliah_insert_unified" ON mata_kuliah
  FOR INSERT
  WITH CHECK (is_admin() OR is_dosen());

DROP POLICY IF EXISTS "mata_kuliah_update_admin" ON mata_kuliah;
DROP POLICY IF EXISTS "mata_kuliah_update_dosen" ON mata_kuliah;

CREATE POLICY "mata_kuliah_update_unified" ON mata_kuliah
  FOR UPDATE
  USING (is_admin() OR is_dosen());

-- ============================================================================
-- TABLE: kelas (SELECT, UPDATE: 4+2 duplicates)
-- ============================================================================
DROP POLICY IF EXISTS "kelas_select_admin" ON kelas;
DROP POLICY IF EXISTS "kelas_select_dosen" ON kelas;
DROP POLICY IF EXISTS "kelas_select_laboran" ON kelas;
DROP POLICY IF EXISTS "kelas_select_mahasiswa" ON kelas;

CREATE POLICY "kelas_select_unified" ON kelas
  FOR SELECT
  USING (
    is_admin() OR
    is_dosen() OR
    is_laboran() OR
    is_mahasiswa()
  );

DROP POLICY IF EXISTS "kelas_update_admin" ON kelas;
DROP POLICY IF EXISTS "kelas_update_dosen" ON kelas;

CREATE POLICY "kelas_update_unified" ON kelas
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
  'inventaris', 'laboratorium', 'mata_kuliah', 'kelas'
)
GROUP BY tablename
ORDER BY tablename;

-- Expected: Significant reduction in policy count
