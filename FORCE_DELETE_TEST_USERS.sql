-- ============================================================================
-- FORCE DELETE: Hapus semua test users (hanya keep original + Budi)
-- ============================================================================

-- Step 1: Delete mahasiswa yang tidak sesuai
DELETE FROM mahasiswa
WHERE user_id IN (
  SELECT id FROM users
  WHERE email IN ('asti@asti.com', 'asti@test.co.id')
);

-- Step 2: Delete users yang tidak sesuai
DELETE FROM users
WHERE email IN ('asti@asti.com', 'asti@test.co.id');

-- Step 3: Verify - Check remaining mahasiswa
SELECT
  COUNT(*) as total_mahasiswa
FROM users
WHERE role = 'mahasiswa';

-- Step 4: List remaining mahasiswa
SELECT
  u.id,
  u.email,
  u.full_name,
  u.role,
  m.nim,
  m.angkatan
FROM users u
LEFT JOIN mahasiswa m ON u.id = m.user_id
WHERE u.role = 'mahasiswa'
ORDER BY u.created_at;

SELECT '✅ Force delete complete!' as status;
