-- ============================================================================
-- Test: is_dosen() Function as Authenticated User
-- ============================================================================
-- Run this while logged in as dosen (use RLS Test in Supabase Dashboard)
-- ============================================================================

-- 1. Check who you are
SELECT
  auth.uid() as "My User ID",
  auth.email() as "My Email";

-- 2. Check your users record
SELECT
  id,
  email,
  role
FROM users
WHERE id = auth.uid();

-- 3. Check your dosen record
SELECT
  id,
  user_id,
  nip,
  nidn
FROM dosen
WHERE user_id = auth.uid();

-- 4. Test database functions
SELECT
  is_dosen() as "is_dosen() result",
  is_admin() as "is_admin() result",
  get_user_role() as "get_user_role() result",
  get_current_dosen_id() as "get_current_dosen_id() result";

-- 5. Test the actual INSERT policy condition
SELECT
  is_dosen() as "is_dosen",
  is_dosen() = true as "will_pass_policy";

-- ============================================================================
-- EXPECTED RESULTS:
-- is_dosen() should return TRUE
-- get_user_role() should return 'dosen'
-- get_current_dosen_id() should return a UUID
-- ============================================================================

-- If is_dosen() returns FALSE, there's a problem with:
-- 1. RLS policy on 'users' table blocking get_user_role()
-- 2. RLS policy on 'dosen' table blocking get_current_dosen_id()
-- 3. Function definition itself
