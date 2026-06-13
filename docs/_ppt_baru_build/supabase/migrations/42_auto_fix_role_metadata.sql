-- ============================================================================
-- Migration 42: AUTO-FIX - Set Missing Role Metadata for All Users
-- ============================================================================
-- Run this migration to automatically populate role metadata for all users
-- This ensures JWT tokens will have the correct role after login
-- ============================================================================

-- ============================================================================
-- PART 1: Backup - See which users are missing role metadata
-- ============================================================================

SELECT
  u.id,
  u.email,
  u.created_at,
  CASE
    WHEN EXISTS(SELECT 1 FROM public.admin WHERE user_id = u.id) THEN 'admin'
    WHEN EXISTS(SELECT 1 FROM public.dosen WHERE user_id = u.id) THEN 'dosen'
    WHEN EXISTS(SELECT 1 FROM public.laboran WHERE user_id = u.id) THEN 'laboran'
    WHEN EXISTS(SELECT 1 FROM public.mahasiswa WHERE user_id = u.id) THEN 'mahasiswa'
    ELSE 'unknown'
  END as computed_role,
  u.raw_user_meta_data ->> 'role' as current_metadata_role,
  CASE
    WHEN u.raw_user_meta_data ->> 'role' IS NULL THEN 'NEEDS_UPDATE'
    ELSE 'OK'
  END as status
FROM auth.users u
ORDER BY u.created_at DESC;

-- ============================================================================
-- PART 2: AUTO-FIX - Set role metadata for all users who are missing it
-- ============================================================================

UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  to_jsonb(
    CASE
      WHEN EXISTS(SELECT 1 FROM public.admin WHERE user_id = id) THEN 'admin'
      WHEN EXISTS(SELECT 1 FROM public.dosen WHERE user_id = id) THEN 'dosen'
      WHEN EXISTS(SELECT 1 FROM public.laboran WHERE user_id = id) THEN 'laboran'
      WHEN EXISTS(SELECT 1 FROM public.mahasiswa WHERE user_id = id) THEN 'mahasiswa'
      ELSE 'mahasiswa' -- Default for unknown users
    END
  )
)
WHERE raw_user_meta_data ->> 'role' IS NULL
   OR raw_user_meta_data ->> 'role' = 'null'
   OR raw_user_meta_data ->> 'role' = '';

-- ============================================================================
-- PART 3: Verify the fix worked
-- ============================================================================

SELECT
  COUNT(*) as total_users,
  COUNT(CASE WHEN raw_user_meta_data ->> 'role' IS NOT NULL THEN 1 END) as users_with_role,
  COUNT(CASE WHEN raw_user_meta_data ->> 'role' IS NULL THEN 1 END) as users_without_role
FROM auth.users;

-- Expected:
-- total_users: [total count]
-- users_with_role: [should equal total_users after fix]
-- users_without_role: 0

-- ============================================================================
-- PART 4: Show sample of fixed users
-- ============================================================================

SELECT
  u.id,
  u.email,
  u.raw_user_meta_data ->> 'role' as role_from_metadata,
  CASE
    WHEN EXISTS(SELECT 1 FROM public.admin WHERE user_id = u.id) THEN 'admin'
    WHEN EXISTS(SELECT 1 FROM public.dosen WHERE user_id = u.id) THEN 'dosen'
    WHEN EXISTS(SELECT 1 FROM public.laboran WHERE user_id = u.id) THEN 'laboran'
    WHEN EXISTS(SELECT 1 FROM public.mahasiswa WHERE user_id = u.id) THEN 'mahasiswa'
    ELSE 'unknown'
  END as role_from_table,
  CASE
    WHEN u.raw_user_meta_data ->> 'role' = 
      CASE
        WHEN EXISTS(SELECT 1 FROM public.admin WHERE user_id = u.id) THEN 'admin'
        WHEN EXISTS(SELECT 1 FROM public.dosen WHERE user_id = u.id) THEN 'dosen'
        WHEN EXISTS(SELECT 1 FROM public.laboran WHERE user_id = u.id) THEN 'laboran'
        ELSE 'mahasiswa'
      END
    THEN '✓ MATCH'
    ELSE '✗ MISMATCH'
  END as verification
FROM auth.users u
ORDER BY u.created_at DESC
LIMIT 10;

-- Expected:
-- All rows should show: verification = '✓ MATCH'
-- role_from_metadata should match role_from_table

-- ============================================================================
-- PART 5: IMPORTANT - Users must log out and back in
-- ============================================================================

-- CRITICAL: After running this migration, all users MUST:
-- 1. Log out from the application
-- 2. Clear browser cache/cookies
-- 3. Log back in
--
-- This will refresh their JWT token with the new role metadata
-- WITHOUT this step, the old JWT (without role) will still be used

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- This migration:
-- ✓ Checks all auth.users for missing role metadata
-- ✓ Automatically populates role based on role table membership
-- ✓ Verifies all users now have role set
-- ✓ Ensures JWT will include role after next login
--
-- Result: All users will have role in JWT, is_dosen() will work correctly
-- ============================================================================
