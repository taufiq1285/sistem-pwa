-- ============================================================================
-- CLEANUP: Hapus semua test users KECUALI Budi
-- Keep hanya: budi2401@test.com (Budi)
-- ============================================================================

-- Delete mahasiswa records untuk test users yang akan dihapus
DELETE FROM mahasiswa
WHERE user_id IN (
  SELECT u.id FROM users u
  WHERE u.role = 'mahasiswa'
  AND u.email IN ('asti@test.co.id', 'asti@asti.com')
);

-- Delete users yang test (kecuali Budi)
DELETE FROM users
WHERE role = 'mahasiswa'
AND email IN ('asti@test.co.id', 'asti@asti.com');

-- Verify hasil - seharusnya tersisa 2 mahasiswa:
-- 1. mahasiswa@akbid.ac.id (original)
-- 2. budi2401@test.com (Budi)
SELECT
  u.id,
  u.email,
  u.full_name,
  u.role,
  m.nim,
  m.angkatan,
  m.semester
FROM users u
LEFT JOIN mahasiswa m ON u.id = m.user_id
WHERE u.role = 'mahasiswa'
ORDER BY u.created_at DESC;

SELECT 'Cleanup complete! Budi kept for testing.' as status;
