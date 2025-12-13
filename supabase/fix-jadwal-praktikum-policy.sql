-- Fix: jadwal_praktikum hanya dibuat oleh dosen

-- Hapus policy INSERT lama (admin, dosen, laboran)
DROP POLICY IF EXISTS "jadwal_praktikum_insert_admin" ON public.jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_insert_dosen" ON public.jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_insert_laboran" ON public.jadwal_praktikum;

-- Policy baru: HANYA DOSEN yang bisa INSERT
CREATE POLICY "jadwal_praktikum_insert_dosen_only"
ON public.jadwal_praktikum
FOR INSERT
TO authenticated
WITH CHECK (
  is_dosen() AND dosen_teaches_kelas(kelas_id)
);

-- UPDATE tetap untuk dosen saja (sudah ada, tapi pastikan logiknya benar)
-- Policy UPDATE baru untuk dosen owner
DROP POLICY IF EXISTS "jadwal_praktikum_update_dosen" ON public.jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_update_admin" ON public.jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_update_laboran" ON public.jadwal_praktikum;

CREATE POLICY "jadwal_praktikum_update_dosen_only"
ON public.jadwal_praktikum
FOR UPDATE
USING (
  is_dosen() AND dosen_teaches_kelas(kelas_id)
);

-- DELETE tetap untuk dosen saja
DROP POLICY IF EXISTS "jadwal_praktikum_delete_dosen" ON public.jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_delete_admin" ON public.jadwal_praktikum;

CREATE POLICY "jadwal_praktikum_delete_dosen_only"
ON public.jadwal_praktikum
FOR DELETE
USING (
  is_dosen() AND dosen_teaches_kelas(kelas_id)
);

-- SELECT policies tetap sama (admin, dosen, mahasiswa, laboran dapat read)
-- Tidak perlu diubah kecuali ada kebutuhan khusus
