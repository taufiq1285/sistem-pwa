-- ============================================================================
-- Test: is_dosen() Function
-- ============================================================================
-- Run this as the dosen user to test if is_dosen() returns TRUE
-- ============================================================================

-- 1. Check current user
SELECT
  auth.uid() as "User ID",
  auth.email() as "Email";

-- 2. Check dosen record exists
SELECT
  id as "Dosen ID",
  user_id as "User ID",
  nip,
  nidn
FROM dosen
WHERE user_id = auth.uid();

-- 3. Test is_dosen() function
SELECT is_dosen() as "is_dosen() result";

-- 4. Test get_current_dosen_id() function
SELECT get_current_dosen_id() as "get_current_dosen_id() result";

-- 5. Check the is_dosen() function definition
SELECT
  proname as function_name,
  prosrc as function_body
FROM pg_proc
WHERE proname = 'is_dosen';

-- 6. Test the INSERT policy condition manually for a specific kelas
-- Replace 'KELAS_ID_HERE' with one of the kelas IDs from the diagnostic
SELECT
  is_dosen() as "is_dosen",
  EXISTS (
    SELECT 1 FROM kelas
    WHERE id = '2eece690-f13e-4afb-9e7f-030de419b97a'::uuid  -- Kelas A
    AND is_active = true
  ) as "kelas_exists_and_active",
  (
    is_dosen()
    AND EXISTS (
      SELECT 1 FROM kelas
      WHERE id = '2eece690-f13e-4afb-9e7f-030de419b97a'::uuid
      AND is_active = true
    )
  ) as "INSERT_policy_should_pass";

-- ============================================================================
-- EXPECTED: All should return TRUE if setup is correct
-- ============================================================================
