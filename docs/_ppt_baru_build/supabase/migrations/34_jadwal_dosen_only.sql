-- ============================================================================
-- Migration 34: Jadwal Praktikum - Dosen Only (Remove Admin Access)
-- ============================================================================
-- Requirement: Jadwal praktikum adalah fitur dosen, admin tidak perlu akses
-- Changes: Remove all admin policies from jadwal_praktikum
-- ============================================================================

-- Drop admin policies
DROP POLICY IF EXISTS "jadwal_praktikum_insert_admin" ON public.jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_update_admin" ON public.jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_delete_admin" ON public.jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_select_admin" ON public.jadwal_praktikum;

-- Keep only dosen policies (already exist from migration 33)
-- INSERT: Already exists - is_dosen()
-- UPDATE: Already exists - is_dosen()
-- DELETE: Already exists - is_dosen()
-- SELECT: Already exists - is_dosen() + kelas ownership filter

-- ============================================================================
-- COMMENT
-- ============================================================================

COMMENT ON TABLE jadwal_praktikum IS
'RLS enabled: DOSEN ONLY - Dosen can manage their jadwal, Admin has no access';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Should only show dosen policies, no admin policies
SELECT
  policyname,
  cmd,
  CASE
    WHEN cmd = 'SELECT' THEN qual::text
    ELSE with_check::text
  END as policy_condition
FROM pg_policies
WHERE tablename = 'jadwal_praktikum'
ORDER BY cmd, policyname;

-- Expected result: Only dosen, mahasiswa, laboran policies (no admin)
