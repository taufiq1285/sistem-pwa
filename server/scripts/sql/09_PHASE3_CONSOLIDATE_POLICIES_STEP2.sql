-- ============================================================================
-- PHASE 3 STEP 2: CONSOLIDATE POLICIES - AUDIT & ASSIGNMENT TABLES
-- ============================================================================

-- ============================================================================
-- TABLE: audit_logs_archive (2 duplicate SELECT policies)
-- ============================================================================
DROP POLICY IF EXISTS "Admin full control audit logs archive" ON audit_logs_archive;
DROP POLICY IF EXISTS "Only admin can view audit logs" ON audit_logs_archive;

CREATE POLICY "audit_logs_archive_admin_only" ON audit_logs_archive
  FOR SELECT
  USING (is_admin());

-- ============================================================================
-- TABLE: mahasiswa_semester_audit (2 duplicate SELECT policies)
-- ============================================================================
DROP POLICY IF EXISTS "Admin can view all semester audits" ON mahasiswa_semester_audit;
DROP POLICY IF EXISTS "Mahasiswa can view their own semester audit" ON mahasiswa_semester_audit;

CREATE POLICY "mahasiswa_semester_audit_select_unified" ON mahasiswa_semester_audit
  FOR SELECT
  USING (
    is_admin() OR 
    (is_mahasiswa() AND mahasiswa_id = get_current_mahasiswa_id())
  );

-- ============================================================================
-- TABLE: dosen (UPDATE policies: 2 duplicates)
-- ============================================================================
DROP POLICY IF EXISTS "dosen_update_admin" ON dosen;
DROP POLICY IF EXISTS "dosen_update_self" ON dosen;

CREATE POLICY "dosen_update_unified" ON dosen
  FOR UPDATE
  USING (
    is_admin() OR 
    (auth.uid() = user_id)
  );

-- ============================================================================
-- TABLE: laboran (UPDATE policies: 2 duplicates)
-- ============================================================================
DROP POLICY IF EXISTS "laboran_update_admin" ON laboran;
DROP POLICY IF EXISTS "laboran_update_self" ON laboran;

CREATE POLICY "laboran_update_unified" ON laboran
  FOR UPDATE
  USING (
    is_admin() OR 
    (auth.uid() = user_id)
  );

-- ============================================================================
-- TABLE: mahasiswa (SELECT & UPDATE: 3+2 duplicates)
-- ============================================================================
-- SELECT consolidation
DROP POLICY IF EXISTS "mahasiswa_select_admin" ON mahasiswa;
DROP POLICY IF EXISTS "mahasiswa_select_dosen" ON mahasiswa;
DROP POLICY IF EXISTS "mahasiswa_select_self" ON mahasiswa;

CREATE POLICY "mahasiswa_select_unified" ON mahasiswa
  FOR SELECT
  USING (
    is_admin() OR
    is_dosen() OR
    (auth.uid() = user_id)
  );

-- UPDATE consolidation
DROP POLICY IF EXISTS "mahasiswa_update_admin" ON mahasiswa;
DROP POLICY IF EXISTS "mahasiswa_update_self" ON mahasiswa;

CREATE POLICY "mahasiswa_update_unified" ON mahasiswa
  FOR UPDATE
  USING (
    is_admin() OR 
    (auth.uid() = user_id)
  );

-- ============================================================================
-- TABLE: users (SELECT & UPDATE: 4+2 duplicates)
-- ============================================================================
-- SELECT consolidation
DROP POLICY IF EXISTS "users_select_admin" ON users;
DROP POLICY IF EXISTS "users_select_dosen" ON users;
DROP POLICY IF EXISTS "users_select_laboran" ON users;
DROP POLICY IF EXISTS "users_select_mahasiswa" ON users;

CREATE POLICY "users_select_unified" ON users
  FOR SELECT
  USING (
    is_admin() OR
    is_dosen() OR
    is_laboran() OR
    is_mahasiswa()
  );

-- UPDATE consolidation
DROP POLICY IF EXISTS "users_update_admin" ON users;
DROP POLICY IF EXISTS "users_update_self" ON users;

CREATE POLICY "users_update_unified" ON users
  FOR UPDATE
  USING (
    is_admin() OR 
    (auth.uid() = id)
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename IN (
  'audit_logs_archive', 'mahasiswa_semester_audit', 'dosen', 
  'laboran', 'mahasiswa', 'users'
)
GROUP BY tablename
ORDER BY tablename;

-- Expected: Each table should have significant reduction in policies
