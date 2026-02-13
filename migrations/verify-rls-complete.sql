-- Verifikasi semua RLS policies untuk jadwal_praktikum
-- Jalankan di Supabase SQL Editor

-- Ringkasan policies by role
SELECT
  CASE 
    WHEN policyname LIKE '%dosen%' THEN 'Dosen'
    WHEN policyname LIKE '%laboran%' THEN 'Laboran'
    WHEN policyname LIKE '%mahasiswa%' THEN 'Mahasiswa'
    ELSE 'Other'
  END as role,
  cmd,
  STRING_AGG(policyname, ', ') as policies
FROM pg_policies
WHERE tablename = 'jadwal_praktikum'
GROUP BY 
  CASE 
    WHEN policyname LIKE '%dosen%' THEN 'Dosen'
    WHEN policyname LIKE '%laboran%' THEN 'Laboran'
    WHEN policyname LIKE '%mahasiswa%' THEN 'Mahasiswa'
    ELSE 'Other'
  END,
  cmd
ORDER BY role, cmd;

-- Test: Simulasi query dari mahasiswa
-- Ganti <MAHASISWA_USER_ID> dengan user_id mahasiswa
-- SELECT COUNT(*) FROM jadwal_praktikum WHERE status = 'approved' AND is_active = true;
