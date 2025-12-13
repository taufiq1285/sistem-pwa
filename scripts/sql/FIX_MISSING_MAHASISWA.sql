-- ============================================================================
-- FIX: Create missing mahasiswa record for "asti@asti.com"
-- ============================================================================

-- Check user asti
SELECT id, email, full_name, role FROM users WHERE email = 'asti@asti.com';

-- Create mahasiswa record untuk Asti (ganti data sesuai kebutuhan)
INSERT INTO mahasiswa (
  user_id,
  nim,
  program_studi,
  angkatan,
  semester
) VALUES (
  'df490dde-5738-4ecf-a5a2-b200ff48c248',  -- user_id dari asti@asti.com
  '232100002',  -- NIM baru (ganti sesuai kebutuhan)
  'D3 Kebidanan',  -- Program studi
  2023,  -- Angkatan
  1  -- Semester
);

-- Verify
SELECT
  u.id,
  u.email,
  u.full_name,
  m.id as mahasiswa_id,
  m.nim,
  m.program_studi,
  m.angkatan
FROM users u
LEFT JOIN mahasiswa m ON u.id = m.user_id
WHERE u.email = 'asti@asti.com';
