-- ==========================================
-- CHECK: Admin access to users table
-- ==========================================

-- Cek apakah admin policy untuk users sudah ada
SELECT
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'users'
  AND policyname LIKE '%admin%';

-- Test query seperti di frontend (join dosen dengan users)
SELECT
  d.id,
  d.user_id,
  u.id as user_id,
  u.full_name,
  u.email,
  d.is_active
FROM dosen d
LEFT JOIN users u ON d.user_id = u.id
WHERE d.is_active = true
ORDER BY u.full_name;

-- Cek total dosen aktif
SELECT
  COUNT(*) as total_dosen_aktif
FROM dosen
WHERE is_active = true;
