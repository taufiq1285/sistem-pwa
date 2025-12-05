-- Script to check and delete test users from public.users table
-- Run this in Supabase SQL Editor

-- 1. Check if users exist in public.users
SELECT
  id,
  email,
  full_name,
  role,
  created_at
FROM public.users
WHERE id IN (
  'ea127368-9173-4838-9869-8617beb18c4f',  -- Asti
  '5de02c2b-0cbf-46a2-9b8e-7909096d70a2',  -- mahasiswa
  '7eb7eead-29e8-48aa-b8be-758b561d35cf'   -- Super Admin
);

-- 2. If users exist in public.users, delete them
-- Uncomment lines below to delete:

/*
DELETE FROM public.users
WHERE id IN (
  'ea127368-9173-4838-9869-8617beb18c4f',  -- Asti (budi2401@test.com)
  '5de02c2b-0cbf-46a2-9b8e-7909096d70a2',  -- mahasiswa@akbid.ac.id
  '7eb7eead-29e8-48aa-b8be-758b561d35cf'   -- superadmin@akbid.ac.id
);
*/

-- 3. Verify deletion
SELECT
  id,
  email,
  full_name,
  role
FROM public.users
WHERE id IN (
  'ea127368-9173-4838-9869-8617beb18c4f',
  '5de02c2b-0cbf-46a2-9b8e-7909096d70a2',
  '7eb7eead-29e8-48aa-b8be-758b561d35cf'
);
-- Should return 0 rows if deleted successfully
