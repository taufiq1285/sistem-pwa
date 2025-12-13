-- ============================================================================
-- PHASE 3 STEP 6: CONSOLIDATE POLICIES - FINAL TABLES
-- ============================================================================

-- ============================================================================
-- TABLE: peminjaman (INSERT, SELECT, UPDATE: 2-4 policies)
-- ============================================================================
DROP POLICY IF EXISTS "peminjaman_insert_dosen" ON peminjaman;
DROP POLICY IF EXISTS "peminjaman_insert_mahasiswa" ON peminjaman;

CREATE POLICY "peminjaman_insert_unified" ON peminjaman
  FOR INSERT
  WITH CHECK (is_admin() OR is_dosen() OR is_mahasiswa());

DROP POLICY IF EXISTS "peminjaman_select_admin" ON peminjaman;
DROP POLICY IF EXISTS "peminjaman_select_dosen" ON peminjaman;
DROP POLICY IF EXISTS "peminjaman_select_laboran" ON peminjaman;
DROP POLICY IF EXISTS "peminjaman_select_mahasiswa" ON peminjaman;

CREATE POLICY "peminjaman_select_unified" ON peminjaman
  FOR SELECT
  USING (
    is_admin() OR
    is_dosen() OR
    is_laboran() OR
    is_mahasiswa()
  );

DROP POLICY IF EXISTS "peminjaman_update_admin" ON peminjaman;
DROP POLICY IF EXISTS "peminjaman_update_dosen" ON peminjaman;
DROP POLICY IF EXISTS "peminjaman_update_laboran" ON peminjaman;
DROP POLICY IF EXISTS "peminjaman_update_mahasiswa" ON peminjaman;

CREATE POLICY "peminjaman_update_unified" ON peminjaman
  FOR UPDATE
  USING (is_admin() OR is_dosen() OR is_laboran() OR is_mahasiswa());

-- ============================================================================
-- TABLE: pengumuman (UPDATE: 2 policies)
-- ============================================================================
DROP POLICY IF EXISTS "pengumuman_admin_update" ON pengumuman;
DROP POLICY IF EXISTS "pengumuman_author_update" ON pengumuman;

CREATE POLICY "pengumuman_update_unified" ON pengumuman
  FOR UPDATE
  USING (
    is_admin() OR
    (penulis_id = (SELECT id FROM dosen WHERE user_id = auth.uid()))
  );

-- ============================================================================
-- FINAL VERIFICATION & SUMMARY
-- ============================================================================

-- Check all consolidated policies
SELECT 
  tablename,
  COUNT(*) as total_policies,
  COUNT(DISTINCT policyname) as unique_policies
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Count reduction summary
WITH policy_stats AS (
  SELECT 
    tablename,
    COUNT(*) as policy_count
  FROM pg_policies 
  WHERE schemaname = 'public'
  GROUP BY tablename
)
SELECT 
  COUNT(*) as tables_with_rls,
  SUM(policy_count) as total_policies
FROM policy_stats
WHERE policy_count > 0;

-- Expected result:
-- Before Phase 3: ~500+ policies
-- After Phase 3: ~150-200 policies
-- Reduction: ~70% fewer policy evaluations

-- ============================================================================
-- SANITY CHECK: Verify critical policies still exist
-- ============================================================================

-- Users table should have SELECT and UPDATE
SELECT 
  tablename,
  policyname,
  cmd,
  CASE WHEN qual IS NOT NULL THEN 'HAS CONDITION' ELSE 'NO CONDITION' END as condition_status
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- Mahasiswa table should have all CRUD operations
SELECT 
  tablename,
  policyname,
  cmd,
  CASE WHEN qual IS NOT NULL THEN 'HAS CONDITION' ELSE 'NO CONDITION' END as condition_status
FROM pg_policies 
WHERE tablename = 'mahasiswa'
ORDER BY policyname;

-- Check that is_admin() function is being called
SELECT 
  tablename,
  policyname,
  CASE WHEN qual LIKE '%is_admin%' THEN 'Uses is_admin()' ELSE 'No is_admin()' END as admin_check
FROM pg_policies 
WHERE schemaname = 'public' AND qual IS NOT NULL
LIMIT 20;

-- ============================================================================
-- SUCCESS INDICATORS
-- ============================================================================
-- ✓ All consolidated tables should have 1 unified policy per action
-- ✓ Total policy count reduced from 500+ to ~180-200
-- ✓ All role checks (is_admin, is_dosen, is_laboran, is_mahasiswa) used with OR
-- ✓ No duplicate conditions in same policy
-- ✓ Security logic unchanged (same rules, just combined)
-- ============================================================================
