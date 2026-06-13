-- ============================================================================
-- DIAGNOSTIC: Check users table role field
-- ============================================================================

-- This checks if the users table has the role column and if it's populated

-- Step 1: Check if users table has role column
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'users'
AND column_name = 'role';

-- Expected: Should show a column named 'role'

-- Step 2: Check role values for recent users
SELECT
  id,
  email,
  role,
  created_at,
  CASE
    WHEN EXISTS(SELECT 1 FROM public.dosen WHERE user_id = id) THEN 'dosen_table'
    WHEN EXISTS(SELECT 1 FROM public.admin WHERE user_id = id) THEN 'admin_table'
    WHEN EXISTS(SELECT 1 FROM public.laboran WHERE user_id = id) THEN 'laboran_table'
    WHEN EXISTS(SELECT 1 FROM public.mahasiswa WHERE user_id = id) THEN 'mahasiswa_table'
    ELSE 'none'
  END as role_table_status
FROM public.users
ORDER BY created_at DESC
LIMIT 10;

-- Expected: role column should have values like 'dosen', 'admin', etc.
-- NOT NULL

-- Step 3: If role column is NULL or empty, this is the problem!
-- The middleware gets role from users.role, but it's not set

-- SOLUTION: Set role in users table from role tables
-- UPDATE public.users u
-- SET role = CASE
--   WHEN EXISTS(SELECT 1 FROM public.dosen WHERE user_id = u.id) THEN 'dosen'
--   WHEN EXISTS(SELECT 1 FROM public.admin WHERE user_id = u.id) THEN 'admin'
--   WHEN EXISTS(SELECT 1 FROM public.laboran WHERE user_id = u.id) THEN 'laboran'
--   WHEN EXISTS(SELECT 1 FROM public.mahasiswa WHERE user_id = u.id) THEN 'mahasiswa'
--   ELSE 'mahasiswa'
-- END
-- WHERE role IS NULL OR role = '';

-- Step 4: Verify the fix
-- SELECT COUNT(*) as users_without_role
-- FROM public.users
-- WHERE role IS NULL OR role = '';
-- Should return: 0

-- ============================================================================
