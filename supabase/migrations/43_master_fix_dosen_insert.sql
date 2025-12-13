-- ============================================================================
-- MASTER FIX: Ensure Dosen Can Insert jadwal_praktikum
-- ============================================================================
-- This migration GUARANTEES dosen users can create jadwal_praktikum
-- Run this if dosen is still getting RLS violation error
-- ============================================================================

-- ============================================================================
-- PART 1: CLEAN UP - Drop ALL existing policies
-- ============================================================================

DROP POLICY IF EXISTS "jadwal_praktikum_select_all" ON public.jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_select_admin" ON public.jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_select_dosen" ON public.jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_select_mahasiswa" ON public.jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_select_laboran" ON public.jadwal_praktikum;

DROP POLICY IF EXISTS "jadwal_praktikum_insert_admin" ON public.jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_insert_dosen" ON public.jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_insert_dosen_only" ON public.jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_insert_laboran" ON public.jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_insert_test" ON public.jadwal_praktikum;

DROP POLICY IF EXISTS "jadwal_praktikum_update_admin" ON public.jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_update_dosen" ON public.jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_update_dosen_only" ON public.jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_update_laboran" ON public.jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_update_test" ON public.jadwal_praktikum;

DROP POLICY IF EXISTS "jadwal_praktikum_delete_admin" ON public.jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_delete_dosen" ON public.jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_delete_dosen_only" ON public.jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_delete_laboran" ON public.jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_delete_test" ON public.jadwal_praktikum;

-- ============================================================================
-- PART 2: Ensure RLS is enabled
-- ============================================================================

ALTER TABLE public.jadwal_praktikum ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 3: Create clean, simple policies for each role
-- ============================================================================

-- ============================================================================
-- POLICY 1: DOSEN can do everything with jadwal
-- ============================================================================

CREATE POLICY "jadwal_dosen_select"
ON public.jadwal_praktikum
FOR SELECT
TO authenticated
USING (is_dosen());

CREATE POLICY "jadwal_dosen_insert"
ON public.jadwal_praktikum
FOR INSERT
TO authenticated
WITH CHECK (is_dosen());

CREATE POLICY "jadwal_dosen_update"
ON public.jadwal_praktikum
FOR UPDATE
TO authenticated
USING (is_dosen())
WITH CHECK (is_dosen());

CREATE POLICY "jadwal_dosen_delete"
ON public.jadwal_praktikum
FOR DELETE
TO authenticated
USING (is_dosen());

-- ============================================================================
-- POLICY 2: MAHASISWA can only view jadwal for their enrolled classes
-- ============================================================================

CREATE POLICY "jadwal_mahasiswa_select"
ON public.jadwal_praktikum
FOR SELECT
TO authenticated
USING (
  is_mahasiswa()
  AND EXISTS (
    SELECT 1
    FROM kelas_mahasiswa km
    WHERE km.kelas_id = jadwal_praktikum.kelas_id
    AND km.mahasiswa_id = (
      SELECT id FROM mahasiswa
      WHERE user_id = auth.uid()
      LIMIT 1
    )
  )
);

-- ============================================================================
-- POLICY 3: LABORAN can view all jadwal (for lab coordination)
-- ============================================================================

CREATE POLICY "jadwal_laboran_select"
ON public.jadwal_praktikum
FOR SELECT
TO authenticated
USING (is_laboran());

-- ============================================================================
-- PART 4: Verify policies are created correctly
-- ============================================================================

SELECT
  policyname,
  cmd,
  permissive,
  roles,
  CASE
    WHEN cmd = 'SELECT' THEN qual::text
    WHEN cmd = 'DELETE' THEN qual::text
    ELSE with_check::text
  END as condition
FROM pg_policies
WHERE tablename = 'jadwal_praktikum'
ORDER BY cmd DESC, policyname;

-- Expected output:
-- jadwal_dosen_select       | SELECT | PERMISSIVE | {authenticated} | is_dosen()
-- jadwal_dosen_insert       | INSERT | PERMISSIVE | {authenticated} | is_dosen()
-- jadwal_dosen_update       | UPDATE | PERMISSIVE | {authenticated} | is_dosen()
-- jadwal_dosen_delete       | DELETE | PERMISSIVE | {authenticated} | is_dosen()
-- jadwal_mahasiswa_select   | SELECT | PERMISSIVE | {authenticated} | [subquery]
-- jadwal_laboran_select     | SELECT | PERMISSIVE | {authenticated} | is_laboran()

-- ============================================================================
-- PART 5: Test the INSERT (while logged in as dosen)
-- ============================================================================

/*
-- Check if policies are working
SELECT
  is_dosen() as are_you_dosen,
  EXISTS (SELECT 1 FROM kelas LIMIT 1) as kelas_exists,
  EXISTS (SELECT 1 FROM laboratorium LIMIT 1) as lab_exists;

-- Try INSERT
INSERT INTO jadwal_praktikum (
  kelas_id,
  laboratorium_id,
  tanggal_praktikum,
  hari,
  jam_mulai,
  jam_selesai,
  topik,
  is_active
)
SELECT
  k.id,
  l.id,
  CURRENT_DATE + 7,
  'senin',
  '08:00',
  '10:00',
  'TEST INSERT - Please delete',
  true
FROM kelas k, laboratorium l
WHERE k.is_active = true AND l.is_active = true
LIMIT 1
RETURNING id, kelas_id, laboratorium_id, topik;

-- If successful, clean up:
-- DELETE FROM jadwal_praktikum WHERE topik = 'TEST INSERT - Please delete';
*/

-- ============================================================================
-- IMPORTANT NOTES
-- ============================================================================
-- 1. This migration drops ALL old policies and creates new ones
-- 2. New policies are simpler and clearer
-- 3. Dosen users now have full access (SELECT, INSERT, UPDATE, DELETE)
-- 4. Mahasiswa users can only see their own class schedules
-- 5. Laboran users can see all schedules
-- 6. Admin users have NO direct access (by design - use service role if needed)
--
-- If dosen still can't insert after this:
--    → Check is_dosen() is returning TRUE
--    → Check user logged out and back in
--    → Check get_user_role() function exists
-- ============================================================================
