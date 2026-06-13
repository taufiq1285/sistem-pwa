-- ============================================================================
-- Migration 41: Comprehensive INSERT Test for jadwal_praktikum
-- ============================================================================
-- Run this AFTER migration 39 to verify INSERT works correctly
-- Prerequisites: Logged in as a dosen user
-- ============================================================================

-- ============================================================================
-- PART 1: Prepare test data
-- ============================================================================

-- Check if we have any kelas and laboratorium to use for testing
SELECT
  k.id as kelas_id,
  k.kode_kelas,
  l.id as laboratorium_id,
  l.nama_laboratorium
FROM kelas k
CROSS JOIN laboratorium l
LIMIT 1;

-- If no data above, create test data:
/*
-- Create a test kelas if it doesn't exist
INSERT INTO kelas (mata_kuliah_id, dosen_id, kode_kelas, nama_kelas, kuota, is_active)
VALUES (
  (SELECT id FROM mata_kuliah LIMIT 1),
  (SELECT id FROM dosen WHERE user_id = auth.uid() LIMIT 1),
  'TEST-001',
  'Test Class',
  30,
  true
)
ON CONFLICT DO NOTHING;

-- Create a test laboratorium if it doesn't exist
INSERT INTO laboratorium (nama_laboratorium, lokasi, kapasitas, is_active)
VALUES ('Test Lab', 'Test Location', 30, true)
ON CONFLICT DO NOTHING;
*/

-- ============================================================================
-- PART 2: RUN THIS TEST (while logged in as dosen)
-- ============================================================================

/*
-- Step 1: Verify you're logged in and your role is detected correctly
SELECT
  auth.uid() as logged_in_as,
  get_user_role() as your_role,
  is_dosen() as is_dosen_check;

-- Expected: is_dosen_check should be TRUE

-- Step 2: Attempt to INSERT a jadwal_praktikum
WITH test_data AS (
  SELECT
    k.id as kelas_id,
    l.id as laboratorium_id
  FROM kelas k
  CROSS JOIN laboratorium l
  WHERE k.is_active = true
  AND l.is_active = true
  LIMIT 1
)
INSERT INTO jadwal_praktikum (
  kelas_id,
  laboratorium_id,
  tanggal_praktikum,
  hari,
  jam_mulai,
  jam_selesai,
  topik,
  is_active
)
SELECT
  test_data.kelas_id,
  test_data.laboratorium_id,
  CURRENT_DATE + 7,
  'senin',
  '08:00',
  '10:00',
  'TEST - Verify RLS Fix',
  true
FROM test_data
RETURNING id, kelas_id, laboratorium_id, tanggal_praktikum, topik;

-- Expected: Should return the inserted row with all values
-- If you get error: "new row violates row-level security policy"
--   → is_dosen() is still returning FALSE
--   → Check that get_user_role() is working correctly

-- Step 3: Clean up the test record
DELETE FROM jadwal_praktikum WHERE topik = 'TEST - Verify RLS Fix';
*/

-- ============================================================================
-- PART 3: Diagnostic - If INSERT fails
-- ============================================================================

-- Run these diagnostics if INSERT fails:

-- Check 1: Verify is_dosen() function
SELECT
  proname,
  prosrc
FROM pg_proc
WHERE proname = 'is_dosen';

-- Check 2: Verify get_user_role() function contains fallback logic
SELECT
  proname,
  LENGTH(prosrc) as prosrc_length,
  CASE 
    WHEN prosrc LIKE '%auth.jwt()%' THEN 'Has JWT check'
    ELSE 'Missing JWT check'
  END as has_jwt_check,
  CASE
    WHEN prosrc LIKE '%public.admin%' THEN 'Has admin fallback'
    ELSE 'Missing admin fallback'
  END as has_admin_fallback,
  CASE
    WHEN prosrc LIKE '%public.dosen%' THEN 'Has dosen fallback'
    ELSE 'Missing dosen fallback'
  END as has_dosen_fallback
FROM pg_proc
WHERE proname = 'get_user_role';

-- Check 3: Verify policy condition
SELECT
  policyname,
  cmd,
  with_check::text as insert_condition
FROM pg_policies
WHERE tablename = 'jadwal_praktikum'
AND cmd = 'INSERT';

-- Check 4: When logged in, check JWT contents
/*
SELECT
  auth.uid() as user_id,
  auth.jwt() as full_jwt,
  auth.jwt() -> 'user_metadata' as user_metadata,
  auth.jwt() -> 'app_metadata' as app_metadata;

-- The user_metadata or app_metadata should contain:
-- {"role": "dosen", ...other fields...}
*/

-- ============================================================================
-- PART 4: Fix if role is not in JWT
-- ============================================================================

-- If Step 1 above showed is_dosen_check = FALSE, the JWT doesn't have role
-- Update the user's metadata:

/*
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"dosen"'::jsonb
)
WHERE id = auth.uid();

-- Then the user must LOG OUT and LOG BACK IN for JWT to refresh
*/

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- If everything is working:
-- 1. Check 1-4 all pass ✓
-- 2. INSERT in Step 2 succeeds
-- 3. No RLS violation errors

-- If INSERT still fails after migration 39:
-- 1. Check that user's auth.users.raw_user_meta_data has 'role' field
-- 2. User needs to log out and log back in
-- 3. Verify JWT now includes the role
-- ============================================================================
