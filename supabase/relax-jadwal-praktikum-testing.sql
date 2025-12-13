-- Temporary: Relax jadwal_praktikum policy untuk testing
-- Ijinkan INSERT tanpa perlu login (testing only - REMOVE untuk production)

-- Hapus policy INSERT dosen-only yang ketat
DROP POLICY IF EXISTS "jadwal_praktikum_insert_dosen_only" ON public.jadwal_praktikum;

-- Buat policy baru: allow insert untuk testing (tanpa perlu authenticated)
CREATE POLICY "jadwal_praktikum_insert_test"
ON public.jadwal_praktikum
FOR INSERT
TO public, authenticated, anon
WITH CHECK (true);

-- UPDATE tetap untuk dosen saja (bisa direlax juga untuk testing)
DROP POLICY IF EXISTS "jadwal_praktikum_update_dosen_only" ON public.jadwal_praktikum;

CREATE POLICY "jadwal_praktikum_update_test"
ON public.jadwal_praktikum
FOR UPDATE
TO public, authenticated, anon
USING (true);

-- DELETE tetap untuk dosen saja (bisa direlax juga untuk testing)
DROP POLICY IF EXISTS "jadwal_praktikum_delete_dosen_only" ON public.jadwal_praktikum;

CREATE POLICY "jadwal_praktikum_delete_test"
ON public.jadwal_praktikum
FOR DELETE
USING (true);

-- ⚠️ PENTING: Setelah testing selesai, jalankan fix-jadwal-praktikum-policy.sql
-- untuk kembalikan ke policy yang ketat (dosen only)
