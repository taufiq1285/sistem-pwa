-- ============================================================================
-- Migration 35: Fix Users SELECT Policy for Dosen (Self-Query)
-- ============================================================================
-- Issue: Dosen cannot query their own user record from users table
--        This breaks getCurrentUserWithRole() → 403 permission errors
-- Solution: Ensure dosen can SELECT their own record
-- ============================================================================

-- Check current users SELECT policies
SELECT
  policyname,
  cmd,
  qual::text as using_clause
FROM pg_policies
WHERE tablename = 'users'
  AND cmd = 'SELECT'
ORDER BY policyname;

-- ============================================================================
-- FIX: Ensure dosen can SELECT own record
-- ============================================================================

-- Drop old dosen select policy if it exists
DROP POLICY IF EXISTS "users_select_dosen" ON users;

-- Recreate with proper self-select
CREATE POLICY "users_select_dosen" ON users
  FOR SELECT
  USING (
    is_dosen() AND (
      -- Self - MUST be able to see own record
      id = auth.uid()
      OR
      -- Their students
      id IN (
        SELECT m.user_id
        FROM mahasiswa m
        INNER JOIN kelas_mahasiswa km ON km.mahasiswa_id = m.id
        INNER JOIN kelas k ON k.id = km.kelas_id
        WHERE k.dosen_id = get_current_dosen_id()
      )
    )
  );

-- ============================================================================
-- ALSO: Ensure ALL roles can SELECT their own user record
-- ============================================================================

-- Add a universal policy for self-select (higher priority)
DROP POLICY IF EXISTS "users_select_self" ON users;

CREATE POLICY "users_select_self" ON users
  FOR SELECT
  USING (id = auth.uid());

-- This policy will allow ANY authenticated user to see their own record
-- This is CRITICAL for getCurrentUserWithRole() to work

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check all SELECT policies on users
SELECT
  policyname,
  cmd,
  qual::text as using_clause
FROM pg_policies
WHERE tablename = 'users'
  AND cmd = 'SELECT'
ORDER BY policyname;

-- Test as dosen (run this while logged in as dosen):
-- SELECT * FROM users WHERE id = auth.uid();
-- Should return 1 row (own record)

COMMENT ON TABLE users IS
'RLS enabled: All users can see own record (CRITICAL for auth), role-specific policies for other records';
