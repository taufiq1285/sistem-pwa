-- ============================================================================
-- CLEANUP SCRIPT: Remove Orphaned Auth Users
-- ============================================================================
-- Use this script to clean up users who have auth account but incomplete profile
-- Run this in Supabase SQL Editor

-- 1. Find auth users without profile data
SELECT 
  au.id,
  au.email,
  au.created_at,
  CASE 
    WHEN u.id IS NULL THEN 'Missing users table entry'
    WHEN u.role = 'mahasiswa' AND m.id IS NULL THEN 'Missing mahasiswa profile'
    WHEN u.role = 'dosen' AND d.id IS NULL THEN 'Missing dosen profile'
    WHEN u.role = 'laboran' AND l.id IS NULL THEN 'Missing laboran profile'
    ELSE 'Complete'
  END as status
FROM auth.users au
LEFT JOIN users u ON u.id = au.id
LEFT JOIN mahasiswa m ON m.user_id = au.id AND u.role = 'mahasiswa'
LEFT JOIN dosen d ON d.user_id = au.id AND u.role = 'dosen'
LEFT JOIN laboran l ON l.user_id = au.id AND u.role = 'laboran'
WHERE 
  -- Find incomplete registrations
  u.id IS NULL 
  OR (u.role = 'mahasiswa' AND m.id IS NULL)
  OR (u.role = 'dosen' AND d.id IS NULL)
  OR (u.role = 'laboran' AND l.id IS NULL)
ORDER BY au.created_at DESC;

-- 2. Delete specific user by email (CAREFUL!)
-- Replace 'email@example.com' with actual email
DO $$
DECLARE
  user_uuid UUID;
BEGIN
  -- Get user ID from email
  SELECT id INTO user_uuid 
  FROM auth.users 
  WHERE email = 'asti@test.com'; -- CHANGE THIS EMAIL
  
  IF user_uuid IS NOT NULL THEN
    -- Delete from role tables first
    DELETE FROM mahasiswa WHERE user_id = user_uuid;
    DELETE FROM dosen WHERE user_id = user_uuid;
    DELETE FROM laboran WHERE user_id = user_uuid;
    
    -- Delete from users table
    DELETE FROM users WHERE id = user_uuid;
    
    -- Delete from auth (requires service role)
    -- This needs to be done via Supabase Dashboard or API
    RAISE NOTICE 'Profile data deleted for user: %. Auth user must be deleted manually from Dashboard.', user_uuid;
  ELSE
    RAISE NOTICE 'User not found with email: asti@test.com';
  END IF;
END $$;

-- 3. Bulk cleanup for all incomplete registrations (BE VERY CAREFUL!)
-- Uncomment only if you're sure!
/*
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT au.id, au.email
    FROM auth.users au
    LEFT JOIN users u ON u.id = au.id
    WHERE u.id IS NULL
  LOOP
    -- Delete orphaned auth users
    RAISE NOTICE 'Cleaning up orphaned auth user: % (%)', user_record.email, user_record.id;
    -- Actual deletion must be done via API/Dashboard
  END LOOP;
END $$;
*/

-- ============================================================================
-- PREVENTION: Enable RLS and add constraints
-- ============================================================================

-- Ensure users table has proper foreign key to auth.users
ALTER TABLE users
  ADD CONSTRAINT users_id_fkey 
  FOREIGN KEY (id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- Add CHECK constraints to prevent incomplete data
ALTER TABLE mahasiswa 
  DROP CONSTRAINT IF EXISTS mahasiswa_nim_required,
  ADD CONSTRAINT mahasiswa_nim_required CHECK (nim IS NOT NULL AND nim != '');

ALTER TABLE dosen 
  DROP CONSTRAINT IF EXISTS dosen_nidn_required,
  ADD CONSTRAINT dosen_nidn_required CHECK (nidn IS NOT NULL AND nidn != '');

ALTER TABLE laboran 
  DROP CONSTRAINT IF EXISTS laboran_nip_required,
  ADD CONSTRAINT laboran_nip_required CHECK (nip IS NOT NULL AND nip != '');

-- ============================================================================
-- VERIFICATION: Check if cleanup was successful
-- ============================================================================
SELECT 
  'Total auth users' as metric,
  COUNT(*) as count
FROM auth.users
UNION ALL
SELECT 
  'Users with complete profile',
  COUNT(*)
FROM users u
INNER JOIN auth.users au ON au.id = u.id
LEFT JOIN mahasiswa m ON m.user_id = u.id AND u.role = 'mahasiswa'
LEFT JOIN dosen d ON d.user_id = u.id AND u.role = 'dosen'
LEFT JOIN laboran l ON l.user_id = u.id AND u.role = 'laboran'
WHERE 
  (u.role = 'mahasiswa' AND m.id IS NOT NULL)
  OR (u.role = 'dosen' AND d.id IS NOT NULL)
  OR (u.role = 'laboran' AND l.id IS NOT NULL)
  OR u.role NOT IN ('mahasiswa', 'dosen', 'laboran');
