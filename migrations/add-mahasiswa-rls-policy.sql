-- Tambahkan RLS Policy untuk Mahasiswa membaca jadwal_praktikum
-- Jalankan di Supabase SQL Editor

-- 1. Buat function is_mahasiswa()
CREATE OR REPLACE FUNCTION is_mahasiswa()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'mahasiswa'
  );
$$;

-- 2. Cek apakah policy sudah ada
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'jadwal_praktikum'
  AND policyname LIKE '%mahasiswa%';

-- 3. Tambahkan SELECT policy untuk mahasiswa
-- Mahasiswa boleh baca jadwal yang:
-- - Status = 'approved'
-- - Kelas_id cocok dengan enrollment mahasiswa

CREATE POLICY "jadwal_praktikum_select_mahasiswa"
ON jadwal_praktikum
FOR SELECT
TO public
USING (
  is_mahasiswa()
  AND status = 'approved'
  AND is_active = true
  AND EXISTS (
    SELECT 1 FROM kelas_mahasiswa
    WHERE kelas_mahasiswa.kelas_id = jadwal_praktikum.kelas_id
    AND kelas_mahasiswa.mahasiswa_id = (
      SELECT m.id FROM mahasiswa m WHERE m.user_id = auth.uid()
    )
  )
);

-- 4. Verifikasi policy
SELECT 
  'Policy berhasil dibuat!' as result,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'jadwal_praktikum'
  AND policyname = 'jadwal_praktikum_select_mahasiswa';

-- 5. Test: Apakah mahasiswa bisa SELECT?
-- Ini akan di-test oleh aplikasi
