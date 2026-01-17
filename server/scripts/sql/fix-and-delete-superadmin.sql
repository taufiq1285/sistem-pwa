-- Fix: Recreate user in public.users, then delete from both
-- Run this in Supabase SQL Editor

-- Step 1: Recreate user in public.users with minimal data
INSERT INTO public.users (id, email, full_name, role, created_at, updated_at)
VALUES (
  '7eb7eead-29e8-48aa-b8be-758b561d35cf',
  'superadmin@akbid.ac.id',
  'Super Admin (TO DELETE)',
  'admin',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;

-- Step 2: Verify user recreated
SELECT id, email, full_name, role
FROM public.users
WHERE id = '7eb7eead-29e8-48aa-b8be-758b561d35cf';

-- Step 3: Now you can delete from Dashboard UI:
-- Go to Authentication > Users > Find superadmin@akbid.ac.id > Delete

-- OR Step 3 Alternative: Delete from public.users (will trigger cascade to related tables)
-- DELETE FROM public.users WHERE id = '7eb7eead-29e8-48aa-b8be-758b561d35cf';

-- Note: User in auth.users can ONLY be deleted via:
-- 1. Dashboard UI (Authentication > Users)
-- 2. REST API with service_role key (which we tried but got error)
-- 3. After this script, try Dashboard UI again
