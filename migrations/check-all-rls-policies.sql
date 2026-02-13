-- Cek semua RLS policies untuk jadwal_praktikum
-- Jalankan di Supabase SQL Editor

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'jadwal_praktikum'
ORDER BY policyname;

-- Cek apakah RLS enabled
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'jadwal_praktikum';
