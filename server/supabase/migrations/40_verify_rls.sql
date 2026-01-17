-- ============================================================================
-- Migration 40: Test and Verify RLS is Working Correctly
-- ============================================================================

-- Run this after applying migration 39 to verify everything works

-- ============================================================================
-- Test 1: Check if get_user_role() function exists and is correct
-- ============================================================================

SELECT
  proname,
  provolatile,
  prosecdef,
  length(prosrc) as function_size
FROM pg_proc
WHERE proname = 'get_user_role';

-- Expected:
-- proname: get_user_role
-- provolatile: s (STABLE)
-- prosecdef: t (SECURITY DEFINER)
-- function_size: > 1000 (should be a substantial function with fallback logic)

-- ============================================================================
-- Test 2: Check if is_dosen() function exists
-- ============================================================================

SELECT
  proname,
  prosrc,
  provolatile
FROM pg_proc
WHERE proname = 'is_dosen';

-- Expected:
-- prosrc should contain: get_user_role() = 'dosen'

-- ============================================================================
-- Test 3: List all policies on jadwal_praktikum
-- ============================================================================

SELECT
  policyname,
  cmd,
  permissive,
  roles,
  qual::text as select_using_clause,
  with_check::text as insert_update_clause
FROM pg_policies
WHERE tablename = 'jadwal_praktikum'
ORDER BY cmd DESC, policyname;

-- Expected policies (6 total):
-- jadwal_praktikum_delete_dosen   | DELETE | is_dosen()
-- jadwal_praktikum_insert_dosen   | INSERT | is_dosen()
-- jadwal_praktikum_update_dosen   | UPDATE | is_dosen()
-- jadwal_praktikum_select_dosen   | SELECT | is_dosen()
-- jadwal_praktikum_select_laboran | SELECT | is_laboran()
-- jadwal_praktikum_select_mahasiswa | SELECT | [subquery with kelas_mahasiswa]

-- ============================================================================
-- Test 4: Verify RLS is ENABLED on jadwal_praktikum
-- ============================================================================

SELECT
  tablename,
  rowsecurity as rls_enabled,
  CASE WHEN rowsecurity = true THEN '✓ RLS ENABLED' ELSE '✗ RLS DISABLED' END as status
FROM pg_tables
WHERE tablename = 'jadwal_praktikum';

-- Expected: rls_enabled = true

-- ============================================================================
-- Test 5: Check that no other policies exist (from old migrations)
-- ============================================================================

SELECT COUNT(*) as total_policies
FROM pg_policies
WHERE tablename = 'jadwal_praktikum';

-- Expected: Should be 6 policies (if migration 39 cleaned up all old ones)

-- ============================================================================
-- Test 6: RUN THIS WHILE LOGGED IN - Test role detection
-- ============================================================================

/*
SELECT
  auth.uid() as current_user_id,
  auth.jwt() -> 'user_metadata' ->> 'role' as jwt_metadata_role,
  auth.jwt() -> 'app_metadata' ->> 'role' as jwt_app_metadata_role,
  get_user_role() as computed_role_from_function,
  is_dosen() as is_dosen_result,
  is_admin() as is_admin_result,
  is_laboran() as is_laboran_result,
  is_mahasiswa() as is_mahasiswa_result;

-- Expected output for a dosen user:
-- current_user_id: [UUID]
-- jwt_metadata_role: 'dosen' (or NULL if not set)
-- jwt_app_metadata_role: (NULL or 'dosen')
-- computed_role_from_function: 'dosen'
-- is_dosen_result: true
-- is_admin_result: false
-- is_laboran_result: false
-- is_mahasiswa_result: false
*/

-- ============================================================================
-- Test 7: Check users table to see if roles are set in metadata
-- ============================================================================

SELECT
  u.id,
  u.email,
  u.raw_user_meta_data ->> 'role' as metadata_role,
  CASE
    WHEN EXISTS(SELECT 1 FROM public.admin WHERE user_id = u.id) THEN 'admin'
    WHEN EXISTS(SELECT 1 FROM public.dosen WHERE user_id = u.id) THEN 'dosen'
    WHEN EXISTS(SELECT 1 FROM public.laboran WHERE user_id = u.id) THEN 'laboran'
    WHEN EXISTS(SELECT 1 FROM public.mahasiswa WHERE user_id = u.id) THEN 'mahasiswa'
    ELSE 'unknown'
  END as actual_role,
  u.created_at
FROM auth.users u
WHERE u.created_at > now() - interval '30 days'
ORDER BY u.created_at DESC
LIMIT 10;

-- If metadata_role is NULL for dosen/admin/laboran users, run this fix:
/*
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  to_jsonb(
    CASE
      WHEN EXISTS(SELECT 1 FROM public.admin WHERE user_id = id) THEN 'admin'
      WHEN EXISTS(SELECT 1 FROM public.dosen WHERE user_id = id) THEN 'dosen'
      WHEN EXISTS(SELECT 1 FROM public.laboran WHERE user_id = id) THEN 'laboran'
      ELSE 'mahasiswa'
    END
  )
)
WHERE raw_user_meta_data ->> 'role' IS NULL
  AND id IN (
    SELECT user_id FROM public.dosen
    UNION
    SELECT user_id FROM public.admin
    UNION
    SELECT user_id FROM public.laboran
  );
*/

-- ============================================================================
-- SUCCESS CHECKLIST
-- ============================================================================
-- ✓ Test 1: get_user_role() function exists and is SECURITY DEFINER STABLE
-- ✓ Test 2: is_dosen() function exists and calls get_user_role()
-- ✓ Test 3: All 6 jadwal_praktikum policies exist
-- ✓ Test 4: RLS is ENABLED on jadwal_praktikum
-- ✓ Test 5: Exactly 6 policies (no duplicates from old migrations)
-- ✓ Test 6: Role functions return correct values when logged in
-- ✓ Test 7: Users have role set in metadata
-- ============================================================================
