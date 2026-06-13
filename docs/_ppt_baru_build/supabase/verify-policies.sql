-- ============================================================================
-- Verification: Check if jadwal_praktikum policies are working
-- ============================================================================

-- Step 1: Verify all policies are created
SELECT
  policyname,
  cmd,
  permissive,
  roles,
  CASE
    WHEN cmd = 'SELECT' THEN qual::text
    WHEN cmd = 'DELETE' THEN qual::text
    ELSE with_check::text
  END as policy_condition
FROM pg_policies
WHERE tablename = 'jadwal_praktikum'
ORDER BY cmd, policyname;

-- Step 2: Check function definitions
SELECT proname, prosrc
FROM pg_proc
WHERE proname IN ('is_dosen', 'get_user_role')
ORDER BY proname;

-- Step 3: Test the role-checking functions (when logged in)
/*
SELECT
  auth.uid() as current_user,
  get_user_role() as computed_role,
  is_dosen() as is_dosen_check,
  is_admin() as is_admin_check,
  is_laboran() as is_laboran_check,
  is_mahasiswa() as is_mahasiswa_check;
*/

-- Step 4: Verify RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'jadwal_praktikum';

-- ============================================================================
-- SUMMARY OF POLICIES
-- ============================================================================
-- Expected:
-- 1. jadwal_praktikum_select_dosen       | SELECT | is_dosen()
-- 2. jadwal_praktikum_select_laboran     | SELECT | is_laboran()
-- 3. jadwal_praktikum_select_mahasiswa   | SELECT | is_mahasiswa() AND kelas_mahasiswa check
-- 4. jadwal_praktikum_insert_dosen       | INSERT | is_dosen()
-- 5. jadwal_praktikum_update_dosen       | UPDATE | is_dosen()
-- 6. jadwal_praktikum_delete_dosen       | DELETE | is_dosen()
-- ============================================================================
