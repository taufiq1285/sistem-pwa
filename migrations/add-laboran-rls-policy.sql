-- Tambahkan RLS Policy untuk Laboran
-- Jalankan ini di Supabase SQL Editor

-- 1. Buat function untuk cek apakah user adalah laboran
CREATE OR REPLACE FUNCTION is_laboran()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'laboran'
  );
$$;

-- 2. Buat policy SELECT untuk laboran
DROP POLICY IF EXISTS "jadwal_praktikum_select_laboran" ON jadwal_praktikum;

CREATE POLICY "jadwal_praktikum_select_laboran"
ON jadwal_praktikum
FOR SELECT
TO public
USING (is_laboran());

-- 3. Buat policy UPDATE untuk laboran (approve/reject)
DROP POLICY IF EXISTS "jadwal_praktikum_update_laboran" ON jadwal_praktikum;

CREATE POLICY "jadwal_praktikum_update_laboran"
ON jadwal_praktikum
FOR UPDATE
TO public
USING (is_laboran())
WITH CHECK (is_laboran());

-- 4. Verifikasi policy berhasil dibuat
SELECT
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'jadwal_praktikum'
  AND policyname LIKE '%laboran%';

-- 5. Test: Cek apakah policy bekerja
-- Ini akan mengembalikan 1 row jika policy berhasil
SELECT COUNT(*) as can_access
FROM jadwal_praktikum
WHERE is_active = true;
