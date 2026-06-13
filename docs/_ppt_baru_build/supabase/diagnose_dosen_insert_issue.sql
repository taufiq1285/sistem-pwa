-- ============================================================================
-- DIAGNOSTIC: Why Dosen Can't Save Jadwal Praktikum
-- ============================================================================
-- Run this while logged in as a dosen user
-- ============================================================================

-- Step 1: Check current user and role detection
SELECT
  auth.uid() as current_user_id,
  auth.jwt() -> 'user_metadata' ->> 'role' as jwt_metadata_role,
  auth.jwt() -> 'app_metadata' ->> 'role' as jwt_app_metadata_role,
  get_user_role() as computed_role_from_function,
  is_dosen() as is_dosen_check,
  is_admin() as is_admin_check,
  is_laboran() as is_laboran_check,
  is_mahasiswa() as is_mahasiswa_check;

-- Step 2: Check if user exists in dosen table
SELECT
  *
FROM public.dosen
WHERE user_id = auth.uid();

-- Step 3: Check get_user_role() function code
SELECT
  proname,
  prosrc
FROM pg_proc
WHERE proname = 'get_user_role';

-- Step 4: Check is_dosen() function code
SELECT
  proname,
  prosrc
FROM pg_proc
WHERE proname = 'is_dosen';

-- Step 5: Check jadwal_praktikum INSERT policy
SELECT
  policyname,
  cmd,
  with_check::text as insert_condition
FROM pg_policies
WHERE tablename = 'jadwal_praktikum'
AND cmd = 'INSERT';

-- Step 6: Try a test INSERT to see exact error
/*
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
VALUES (
  (SELECT id FROM kelas LIMIT 1),
  (SELECT id FROM laboratorium LIMIT 1),
  CURRENT_DATE + 7,
  'senin',
  '08:00',
  '10:00',
  'TEST',
  true
)
RETURNING *;
*/

-- Step 7: Expected output when everything works
-- current_user_id: [UUID]
-- jwt_metadata_role: 'dosen' ← MUST NOT BE NULL
-- computed_role_from_function: 'dosen' ← MUST BE 'dosen'
-- is_dosen_check: true ← MUST BE TRUE
-- is_admin_check: false
-- is_laboran_check: false
-- is_mahasiswa_check: false

-- If is_dosen_check = FALSE, the INSERT will fail
-- ============================================================================
