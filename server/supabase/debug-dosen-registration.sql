-- ============================================================================
-- Debug: Check Dosen Registration Status
-- ============================================================================
-- Run this while logged in as the problematic dosen user
-- ============================================================================

-- 1. Check current authenticated user
SELECT
  auth.uid() as "Current User ID",
  auth.email() as "Current Email";

-- 2. Check users table record
SELECT
  id,
  email,
  full_name,
  role,
  created_at
FROM users
WHERE id = auth.uid();

-- 3. Check if dosen record exists
SELECT
  d.id as dosen_id,
  d.user_id,
  d.nip,
  d.nidn,
  d.gelar_depan,
  d.gelar_belakang,
  d.fakultas,
  d.program_studi,
  d.created_at,
  u.email,
  u.full_name,
  u.role as user_role
FROM dosen d
LEFT JOIN users u ON u.id = d.user_id
WHERE d.user_id = auth.uid();

-- 4. Test helper functions
SELECT
  is_dosen() as "is_dosen()",
  is_admin() as "is_admin()",
  is_mahasiswa() as "is_mahasiswa()",
  is_laboran() as "is_laboran()";

-- 5. Test get_current_dosen_id()
SELECT get_current_dosen_id() as "current_dosen_id";

-- 6. Check available active kelas
SELECT
  id,
  kode_kelas,
  nama_kelas,
  dosen_id,
  is_active,
  tahun_ajaran
FROM kelas
WHERE is_active = true
ORDER BY created_at DESC
LIMIT 5;

-- 7. Test if dosen can see any kelas (based on SELECT policy)
SELECT
  k.id,
  k.kode_kelas,
  k.nama_kelas,
  k.dosen_id,
  k.is_active,
  CASE
    WHEN k.dosen_id = get_current_dosen_id() THEN 'OWNED BY ME'
    ELSE 'NOT MINE'
  END as ownership_status
FROM kelas k
WHERE k.is_active = true
ORDER BY created_at DESC
LIMIT 5;

-- 8. Test the INSERT policy condition manually
SELECT
  EXISTS (
    SELECT 1 FROM kelas
    WHERE id = (SELECT id FROM kelas WHERE is_active = true LIMIT 1)
    AND is_active = true
  ) as "Can Insert into First Active Kelas?";

-- ============================================================================
-- EXPECTED RESULTS for a properly registered dosen:
-- ============================================================================
-- 1. Should show user ID and email
-- 2. Should show role = 'dosen'
-- 3. Should show a dosen record with matching user_id
-- 4. is_dosen() should return TRUE
-- 5. get_current_dosen_id() should return a UUID (not NULL)
-- 6. Should show list of active kelas
-- 7. Should show kelas (even if not owned)
-- 8. Should return TRUE
-- ============================================================================
