-- FIX: Grant laboran access to jadwal_praktikum
-- Jalankan ini di Supabase SQL Editor

-- Opsi 1: Tambahkan RLS policy untuk laboran (RECOMMENDED)
DROP POLICY IF EXISTS "laboran_can_view_all_jadwal" ON jadwal_praktikum;

CREATE POLICY "laboran_can_view_all_jadwal"
ON jadwal_praktikum
FOR SELECT
TO authenticated
USING (
  -- Cek apakah user adalah laboran
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'laboran'
  )
  -- Atau user adalah pemilik jadwal (dosen)
  OR (dosen_id IN (
    SELECT id FROM dosen WHERE user_id = auth.uid()
  ))
);

-- Opsi 2: Atau gunakan service_role bypass (tidak disarankan untuk production)
-- Ini akan membiarkan semua user authenticated melihat semua jadwal
-- DROP POLICY IF EXISTS "authenticated_users_can_view_jadwal" ON jadwal_praktikum;
--
-- CREATE POLICY "authenticated_users_can_view_jadwal"
-- ON jadwal_praktikum
-- FOR SELECT
-- TO authenticated
-- USING (true);

-- Verifikasi policy
SELECT
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'jadwal_praktikum'
  AND policyname LIKE '%laboran%';
