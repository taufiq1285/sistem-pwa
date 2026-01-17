-- Check if users still exist in auth.users
-- Run this in Supabase SQL Editor

-- 1. Check users in auth.users by email
SELECT
  id,
  email,
  created_at,
  last_sign_in_at,
  email_confirmed_at
FROM auth.users
WHERE email IN (
  'budi2401@test.com',
  'mahasiswa@akbid.ac.id',
  'superadmin@akbid.ac.id'
)
ORDER BY created_at DESC;

-- 2. Check users in auth.users by ID
SELECT
  id,
  email,
  created_at
FROM auth.users
WHERE id IN (
  'ea127368-9173-4838-9869-8617beb18c4f',
  '5de02c2b-0cbf-46a2-9b8e-7909096d70a2',
  '7eb7eead-29e8-48aa-b8be-758b561d35cf'
);

-- 3. If users exist, you need to use Supabase Dashboard UI to delete them
-- OR use the REST API with service_role key
