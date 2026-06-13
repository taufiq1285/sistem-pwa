-- ============================================================================
-- Migration 37: Debug RLS Violation on jadwal_praktikum INSERT
-- ============================================================================
-- Error: "new row violates row-level security policy for table "jadwal_praktikum""
-- Diagnosis: Check if is_dosen() and JWT roles are properly configured
-- ============================================================================

-- ============================================================================
-- STEP 1: Check the current jadwal_praktikum policies
-- ============================================================================
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

-- Expected INSERT policies:
-- - jadwal_praktikum_insert_dosen: WITH CHECK (is_dosen())

-- ============================================================================
-- STEP 2: Check the is_dosen() function definition
-- ============================================================================
SELECT
  proname,
  prosrc,
  provolatile,
  prosecdef
FROM pg_proc
WHERE proname = 'is_dosen';

-- Expected output:
-- proname: is_dosen
-- prosrc: Should contain: get_user_role() = 'dosen'
-- prosecdef: t (SECURITY DEFINER)

-- ============================================================================
-- STEP 3: Check the get_user_role() function definition
-- ============================================================================
SELECT
  proname,
  prosrc,
  provolatile,
  prosecdef
FROM pg_proc
WHERE proname = 'get_user_role';

-- Expected output:
-- Should read from JWT: auth.jwt() -> 'user_metadata' ->> 'role'

-- ============================================================================
-- STEP 4: Test the functions (requires being logged in as dosen)
-- ============================================================================

-- Run this while logged in as a dosen user:
/*
SELECT
  auth.uid() as current_user_id,
  auth.jwt() -> 'user_metadata' ->> 'role' as jwt_role_from_token,
  get_user_role() as role_from_function,
  is_dosen() as is_dosen_result,
  is_admin() as is_admin_result;

-- Expected output when logged in as dosen:
-- current_user_id: [dosen's UUID]
-- jwt_role_from_token: 'dosen'
-- role_from_function: 'dosen'
-- is_dosen_result: true
-- is_admin_result: false
*/

-- ============================================================================
-- STEP 5: Verify JWT token includes role metadata
-- ============================================================================

-- Check if users table has role in raw_user_meta_data
SELECT
  u.id,
  u.email,
  u.raw_user_meta_data ->> 'role' as metadata_role,
  u.raw_user_meta_data ->> 'name' as metadata_name,
  u.created_at,
  CASE
    WHEN EXISTS(SELECT 1 FROM dosen WHERE user_id = u.id) THEN 'dosen'
    WHEN EXISTS(SELECT 1 FROM admin WHERE user_id = u.id) THEN 'admin'
    WHEN EXISTS(SELECT 1 FROM laboran WHERE user_id = u.id) THEN 'laboran'
    WHEN EXISTS(SELECT 1 FROM mahasiswa WHERE user_id = u.id) THEN 'mahasiswa'
    ELSE 'unknown'
  END as computed_role
FROM auth.users u
ORDER BY u.created_at DESC
LIMIT 10;

-- Expected: All dosen users should have raw_user_meta_data.role = 'dosen'

-- ============================================================================
-- STEP 6: Check if RLS is even enabled
-- ============================================================================
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'jadwal_praktikum';

-- Expected: rls_enabled = true

-- ============================================================================
-- POTENTIAL FIXES
-- ============================================================================

-- IF is_dosen() returns FALSE, check:
-- 1. JWT token has role metadata (Step 4)
-- 2. User's auth.users.raw_user_meta_data includes role field (Step 5)
-- 3. get_user_role() properly extracts from JWT (Step 3)

-- IF JWT doesn't include role, you need to set it during registration:
-- UPDATE auth.users
-- SET raw_user_meta_data = jsonb_set(
--   COALESCE(raw_user_meta_data, '{}'::jsonb),
--   '{role}',
--   '"dosen"'::jsonb
-- )
-- WHERE id = '[user_id]';

-- After update, user must log out and log back in for JWT to refresh

-- ============================================================================
-- STEP 7: Alternative fix - if JWT role is not available
-- ============================================================================

-- Rewrite is_dosen() to fall back to checking users.role column
-- (This is less secure but will work if JWT is not set up)

-- CREATE OR REPLACE FUNCTION is_dosen()
-- RETURNS BOOLEAN AS $$
-- BEGIN
--     RETURN COALESCE(
--         -- Try JWT first
--         (auth.jwt() -> 'user_metadata' ->> 'role') = 'dosen',
--         -- Fall back to users table (if JWT is not available)
--         EXISTS(SELECT 1 FROM users WHERE id = auth.uid() AND role = 'dosen'),
--         FALSE
--     );
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
