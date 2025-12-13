-- ============================================================================
-- Migration 38: Add Missing RLS SELECT Policies for jadwal_praktikum
-- ============================================================================
-- Issue: Might be missing SELECT policies that prevent data visibility
-- Solution: Ensure all roles can SELECT jadwal_praktikum appropriately
-- ============================================================================

-- ============================================================================
-- Check existing policies first
-- ============================================================================
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

-- ============================================================================
-- Drop old SELECT policies if they exist (to rebuild cleanly)
-- ============================================================================
DROP POLICY IF EXISTS "jadwal_praktikum_select_all" ON public.jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_select_admin" ON public.jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_select_dosen" ON public.jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_select_mahasiswa" ON public.jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_select_laboran" ON public.jadwal_praktikum;

-- ============================================================================
-- Add SELECT policies for all roles
-- ============================================================================

-- DOSEN: Can SELECT all jadwal (they manage schedules)
CREATE POLICY "jadwal_praktikum_select_dosen"
ON public.jadwal_praktikum
FOR SELECT
TO authenticated
USING (is_dosen());

-- MAHASISWA: Can SELECT jadwal for their enrolled classes
CREATE POLICY "jadwal_praktikum_select_mahasiswa"
ON public.jadwal_praktikum
FOR SELECT
TO authenticated
USING (
  is_mahasiswa()
  AND EXISTS (
    SELECT 1 FROM kelas_mahasiswa km
    WHERE km.kelas_id = jadwal_praktikum.kelas_id
    AND km.mahasiswa_id = (SELECT id FROM mahasiswa WHERE user_id = auth.uid())
  )
);

-- LABORAN: Can SELECT all jadwal (lab coordination)
CREATE POLICY "jadwal_praktikum_select_laboran"
ON public.jadwal_praktikum
FOR SELECT
TO authenticated
USING (is_laboran());

-- ============================================================================
-- IMPORTANT: Also ensure INSERT/UPDATE/DELETE policies exist
-- ============================================================================

-- Check if INSERT policies exist
SELECT COUNT(*) as insert_policies_count
FROM pg_policies
WHERE tablename = 'jadwal_praktikum' AND cmd = 'INSERT';

-- If count = 0, create them:
-- (These should already exist from migration 33)

-- ADMIN: Can INSERT jadwal (if needed for special admin tasks)
-- Note: Migration 34 removed admin access, so this is commented out
-- CREATE POLICY "jadwal_praktikum_insert_admin"
-- ON public.jadwal_praktikum
-- FOR INSERT
-- TO authenticated
-- WITH CHECK (is_admin());

-- DOSEN: Can INSERT jadwal
-- CREATE POLICY "jadwal_praktikum_insert_dosen"
-- ON public.jadwal_praktikum
-- FOR INSERT
-- TO authenticated
-- WITH CHECK (is_dosen());

-- ============================================================================
-- SUMMARY OF POLICIES
-- ============================================================================
-- After this migration, jadwal_praktikum should have:
--
-- SELECT:
--   - dosen: all jadwal
--   - mahasiswa: only enrolled classes
--   - laboran: all jadwal
--
-- INSERT:
--   - dosen: all jadwal (no ownership check)
--   - admin: REMOVED (migration 34)
--
-- UPDATE:
--   - dosen: all jadwal
--   - admin: REMOVED (migration 34)
--
-- DELETE:
--   - dosen: all jadwal
--   - admin: REMOVED (migration 34)
-- ============================================================================

-- Final verification
SELECT
  policyname,
  cmd,
  roles,
  CASE
    WHEN cmd = 'SELECT' THEN qual::text
    ELSE with_check::text
  END as policy_condition
FROM pg_policies
WHERE tablename = 'jadwal_praktikum'
ORDER BY cmd, policyname;
