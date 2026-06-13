-- ============================================================================
-- Migration 44: Fix users.role Column for Middleware Permission Checks
-- ============================================================================
-- Issue: Middleware calls getCurrentUserWithRole() which queries users.role
--        But users.role is NULL/empty, so permission checks fail with 403
-- Solution: Populate users.role from role tables (admin, dosen, laboran, mahasiswa)
-- ============================================================================

-- ============================================================================
-- PART 1: Check current state
-- ============================================================================

SELECT
  COUNT(*) as total_users,
  COUNT(CASE WHEN role IS NOT NULL THEN 1 END) as users_with_role,
  COUNT(CASE WHEN role IS NULL THEN 1 END) as users_without_role
FROM public.users;

-- ============================================================================
-- PART 2: Populate users.role from role table membership
-- ============================================================================

UPDATE public.users u
SET role = CASE
  WHEN EXISTS(SELECT 1 FROM public.admin WHERE user_id = u.id) THEN 'admin'::user_role
  WHEN EXISTS(SELECT 1 FROM public.dosen WHERE user_id = u.id) THEN 'dosen'::user_role
  WHEN EXISTS(SELECT 1 FROM public.laboran WHERE user_id = u.id) THEN 'laboran'::user_role
  WHEN EXISTS(SELECT 1 FROM public.mahasiswa WHERE user_id = u.id) THEN 'mahasiswa'::user_role
  ELSE 'mahasiswa'::user_role
END
WHERE role IS NULL;

-- ============================================================================
-- PART 3: Verify the fix worked
-- ============================================================================

SELECT
  id,
  email,
  role::text as role,
  created_at,
  CASE
    WHEN EXISTS(SELECT 1 FROM public.dosen WHERE user_id = id) THEN 'dosen'
    WHEN EXISTS(SELECT 1 FROM public.admin WHERE user_id = id) THEN 'admin'
    WHEN EXISTS(SELECT 1 FROM public.laboran WHERE user_id = id) THEN 'laboran'
    WHEN EXISTS(SELECT 1 FROM public.mahasiswa WHERE user_id = id) THEN 'mahasiswa'
    ELSE 'unknown'
  END as computed_role,
  CASE
    WHEN role::text = CASE
      WHEN EXISTS(SELECT 1 FROM public.dosen WHERE user_id = id) THEN 'dosen'
      WHEN EXISTS(SELECT 1 FROM public.admin WHERE user_id = id) THEN 'admin'
      WHEN EXISTS(SELECT 1 FROM public.laboran WHERE user_id = id) THEN 'laboran'
      WHEN EXISTS(SELECT 1 FROM public.mahasiswa WHERE user_id = id) THEN 'mahasiswa'
      ELSE 'mahasiswa'
    END THEN '✓ OK'
    ELSE '✗ MISMATCH'
  END as verification
FROM public.users
ORDER BY created_at DESC;

-- Expected: All rows should show verification = '✓ OK'
-- role should match the actual role from role tables

-- ============================================================================
-- PART 4: Final verification - no NULL roles
-- ============================================================================

SELECT COUNT(*) as users_still_without_role
FROM public.users
WHERE role IS NULL;

-- Expected: 0

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- After this migration:
-- ✓ All users in public.users table have role set
-- ✓ Middleware can successfully query users.role
-- ✓ Permission checks will work: manage:jadwal for dosen
-- ✓ Dosen can now INSERT jadwal_praktikum
--
-- Result: 403 Forbidden errors will be replaced by successful creates
-- ============================================================================
