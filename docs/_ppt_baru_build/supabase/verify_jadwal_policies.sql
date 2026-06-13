-- ============================================================================
-- CRITICAL CHECK: Verify jadwal_praktikum Policies Are Correct
-- ============================================================================

-- Check 1: List all policies on jadwal_praktikum
SELECT
  policyname,
  cmd,
  permissive,
  roles,
  CASE
    WHEN cmd IN ('SELECT', 'DELETE') THEN qual::text
    ELSE with_check::text
  END as policy_condition
FROM pg_policies
WHERE tablename = 'jadwal_praktikum'
ORDER BY cmd, policyname;

-- Check 2: Verify INSERT policy specifically
SELECT
  policyname,
  cmd,
  with_check::text
FROM pg_policies
WHERE tablename = 'jadwal_praktikum'
AND cmd = 'INSERT'
AND with_check::text LIKE '%is_dosen%';

-- Expected: Should find jadwal_praktikum_insert_dosen with condition "is_dosen()"

-- Check 3: If INSERT policy is missing, create it NOW
-- DROP POLICY IF EXISTS "jadwal_praktikum_insert_dosen" ON public.jadwal_praktikum;
-- 
-- CREATE POLICY "jadwal_praktikum_insert_dosen"
-- ON public.jadwal_praktikum
-- FOR INSERT
-- TO authenticated
-- WITH CHECK (is_dosen());

-- Check 4: Verify RLS is enabled
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'jadwal_praktikum';

-- Expected: rowsecurity = true

-- ============================================================================
-- POTENTIAL FIXES (if policy is missing or wrong)
-- ============================================================================

-- FIX 1: Recreate all policies cleanly
-- 
-- DROP POLICY IF EXISTS "jadwal_praktikum_select_dosen" ON public.jadwal_praktikum;
-- DROP POLICY IF EXISTS "jadwal_praktikum_select_mahasiswa" ON public.jadwal_praktikum;
-- DROP POLICY IF EXISTS "jadwal_praktikum_select_laboran" ON public.jadwal_praktikum;
-- DROP POLICY IF EXISTS "jadwal_praktikum_insert_dosen" ON public.jadwal_praktikum;
-- DROP POLICY IF EXISTS "jadwal_praktikum_update_dosen" ON public.jadwal_praktikum;
-- DROP POLICY IF EXISTS "jadwal_praktikum_delete_dosen" ON public.jadwal_praktikum;
-- 
-- CREATE POLICY "jadwal_praktikum_select_dosen"
-- ON public.jadwal_praktikum
-- FOR SELECT
-- TO authenticated
-- USING (is_dosen());
-- 
-- CREATE POLICY "jadwal_praktikum_insert_dosen"
-- ON public.jadwal_praktikum
-- FOR INSERT
-- TO authenticated
-- WITH CHECK (is_dosen());
-- 
-- CREATE POLICY "jadwal_praktikum_update_dosen"
-- ON public.jadwal_praktikum
-- FOR UPDATE
-- TO authenticated
-- USING (is_dosen())
-- WITH CHECK (is_dosen());
-- 
-- CREATE POLICY "jadwal_praktikum_delete_dosen"
-- ON public.jadwal_praktikum
-- FOR DELETE
-- TO authenticated
-- USING (is_dosen());
-- 
-- CREATE POLICY "jadwal_praktikum_select_mahasiswa"
-- ON public.jadwal_praktikum
-- FOR SELECT
-- TO authenticated
-- USING (
--   is_mahasiswa()
--   AND EXISTS (
--     SELECT 1 FROM kelas_mahasiswa
--     WHERE kelas_mahasiswa.kelas_id = jadwal_praktikum.kelas_id
--     AND kelas_mahasiswa.mahasiswa_id = (
--       SELECT id FROM mahasiswa WHERE user_id = auth.uid() LIMIT 1
--     )
--   )
-- );
-- 
-- CREATE POLICY "jadwal_praktikum_select_laboran"
-- ON public.jadwal_praktikum
-- FOR SELECT
-- TO authenticated
-- USING (is_laboran());

-- ============================================================================
