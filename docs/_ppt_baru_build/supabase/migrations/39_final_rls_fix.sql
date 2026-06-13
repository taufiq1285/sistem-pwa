-- ============================================================================
-- QUICK FIX: Reset All RLS Functions with Proper JWT Handling
-- ============================================================================
-- Run this migration to fix the INSERT RLS violation
-- ============================================================================

-- ============================================================================
-- PART 1: Recreate get_user_role() with better error handling
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
    jwt_role TEXT;
BEGIN
    -- Get role from JWT token (primary source)
    jwt_role := (auth.jwt() -> 'user_metadata' ->> 'role')::TEXT;
    
    -- If JWT has role, return it
    IF jwt_role IS NOT NULL AND jwt_role != 'null' AND jwt_role != '' THEN
        RETURN jwt_role;
    END IF;
    
    -- Try app_metadata as secondary source
    jwt_role := (auth.jwt() -> 'app_metadata' ->> 'role')::TEXT;
    IF jwt_role IS NOT NULL AND jwt_role != 'null' AND jwt_role != '' THEN
        RETURN jwt_role;
    END IF;
    
    -- Last resort: check user_id exists in role tables
    -- (This is safe because it uses simple existence checks, not RLS policies)
    IF EXISTS(SELECT 1 FROM auth.users WHERE id = auth.uid()) THEN
        -- Can't query users.role directly, so try to infer from role tables
        IF EXISTS(SELECT 1 FROM public.admin WHERE user_id = auth.uid()) THEN
            RETURN 'admin';
        ELSIF EXISTS(SELECT 1 FROM public.dosen WHERE user_id = auth.uid()) THEN
            RETURN 'dosen';
        ELSIF EXISTS(SELECT 1 FROM public.laboran WHERE user_id = auth.uid()) THEN
            RETURN 'laboran';
        ELSIF EXISTS(SELECT 1 FROM public.mahasiswa WHERE user_id = auth.uid()) THEN
            RETURN 'mahasiswa';
        END IF;
    END IF;
    
    -- Default role
    RETURN 'mahasiswa';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- PART 2: Recreate role checker functions
-- ============================================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_dosen()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() = 'dosen';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_laboran()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() = 'laboran';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_mahasiswa()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() = 'mahasiswa';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- PART 3: Ensure jadwal_praktikum has correct INSERT policy
-- ============================================================================

-- Drop all existing policies on jadwal_praktikum to start fresh
DROP POLICY IF EXISTS "jadwal_praktikum_insert_admin" ON public.jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_insert_dosen" ON public.jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_insert_laboran" ON public.jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_insert_test" ON public.jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_insert_dosen_only" ON public.jadwal_praktikum;

DROP POLICY IF EXISTS "jadwal_praktikum_update_admin" ON public.jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_update_dosen" ON public.jadwal_praktikum;

DROP POLICY IF EXISTS "jadwal_praktikum_delete_admin" ON public.jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_delete_dosen" ON public.jadwal_praktikum;

DROP POLICY IF EXISTS "jadwal_praktikum_select_admin" ON public.jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_select_dosen" ON public.jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_select_mahasiswa" ON public.jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_select_laboran" ON public.jadwal_praktikum;

-- Re-enable RLS to make sure it's on
ALTER TABLE public.jadwal_praktikum ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE NEW SIMPLIFIED POLICIES
-- ============================================================================

-- SELECT: Dosen can see all, Mahasiswa can see only their classes, Laboran can see all
CREATE POLICY "jadwal_praktikum_select_dosen"
ON public.jadwal_praktikum
FOR SELECT
TO authenticated
USING (is_dosen());

CREATE POLICY "jadwal_praktikum_select_mahasiswa"
ON public.jadwal_praktikum
FOR SELECT
TO authenticated
USING (
  is_mahasiswa()
  AND EXISTS (
    SELECT 1 FROM kelas_mahasiswa
    WHERE kelas_mahasiswa.kelas_id = jadwal_praktikum.kelas_id
    AND kelas_mahasiswa.mahasiswa_id = (
      SELECT id FROM mahasiswa WHERE user_id = auth.uid() LIMIT 1
    )
  )
);

CREATE POLICY "jadwal_praktikum_select_laboran"
ON public.jadwal_praktikum
FOR SELECT
TO authenticated
USING (is_laboran());

-- INSERT: Only Dosen and Admin can insert
-- (Admin removed in migration 34, but keeping comment for reference)
CREATE POLICY "jadwal_praktikum_insert_dosen"
ON public.jadwal_praktikum
FOR INSERT
TO authenticated
WITH CHECK (is_dosen());

-- UPDATE: Dosen and Admin (admin removed in migration 34)
CREATE POLICY "jadwal_praktikum_update_dosen"
ON public.jadwal_praktikum
FOR UPDATE
TO authenticated
USING (is_dosen())
WITH CHECK (is_dosen());

-- DELETE: Dosen and Admin (admin removed in migration 34)
CREATE POLICY "jadwal_praktikum_delete_dosen"
ON public.jadwal_praktikum
FOR DELETE
TO authenticated
USING (is_dosen());

-- ============================================================================
-- PART 4: Verify policies are correct
-- ============================================================================

SELECT
  policyname,
  cmd,
  permissive,
  roles,
  CASE
    WHEN cmd = 'SELECT' THEN qual::text
    ELSE with_check::text
  END as policy_condition
FROM pg_policies
WHERE tablename = 'jadwal_praktikum'
ORDER BY cmd, policyname;

-- Expected output:
-- jadwal_praktikum_delete_dosen | DELETE | t | {authenticated} | is_dosen()
-- jadwal_praktikum_insert_dosen | INSERT | t | {authenticated} | is_dosen()
-- jadwal_praktikum_select_dosen | SELECT | t | {authenticated} | is_dosen()
-- jadwal_praktikum_select_laboran | SELECT | t | {authenticated} | is_laboran()
-- jadwal_praktikum_select_mahasiswa | SELECT | t | {authenticated} | [subquery]
-- jadwal_praktikum_update_dosen | UPDATE | t | {authenticated} | is_dosen()

-- ============================================================================
-- PART 5: Verify function behavior (run while logged in)
-- ============================================================================

/*
SELECT
  auth.uid() as user_id,
  auth.jwt() -> 'user_metadata' ->> 'role' as jwt_user_metadata_role,
  auth.jwt() -> 'app_metadata' ->> 'role' as jwt_app_metadata_role,
  get_user_role() as computed_role,
  is_dosen() as is_dosen_result,
  is_admin() as is_admin_result,
  is_laboran() as is_laboran_result,
  is_mahasiswa() as is_mahasiswa_result;
*/

-- ============================================================================
