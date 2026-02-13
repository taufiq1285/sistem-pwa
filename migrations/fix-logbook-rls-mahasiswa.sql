-- Cek dan perbaiki RLS policies untuk mahasiswa
-- Jalankan di Supabase SQL Editor

-- 1. Cek policy UPDATE yang sudah ada
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'logbook_entries'
  AND cmd = 'UPDATE';

-- 2. Drop dan recreate policy UPDATE untuk mahasiswa
DROP POLICY IF EXISTS "mahasiswa_update_own_logbooks" ON public.logbook_entries;

CREATE POLICY "mahasiswa_update_own_logbooks"
ON public.logbook_entries FOR UPDATE
TO public
USING (
  -- Mahasiswa hanya bisa UPDATE logbook sendiri
  EXISTS (
    SELECT 1 FROM public.mahasiswa m
    WHERE m.id = logbook_entries.mahasiswa_id
    AND m.user_id = auth.uid()
  )
  -- Dan hanya jika status masih draft
  AND status = 'draft'
)
WITH CHECK (
  -- Setelah update, status harus tetap draft
  status = 'draft'
  -- Dan pastikan masih milik mahasiswa yang sama
  AND EXISTS (
    SELECT 1 FROM public.mahasiswa m
    WHERE m.id = logbook_entries.mahasiswa_id
    AND m.user_id = auth.uid()
  )
);

-- 3. Cek policy INSERT untuk mahasiswa
SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'logbook_entries'
  AND cmd = 'INSERT'
  AND policyname LIKE '%mahasiswa%';

-- 4. Drop dan recreate policy INSERT untuk mahasiswa (untuk memastikan)
DROP POLICY IF EXISTS "mahasiswa_create_own_logbooks" ON public.logbook_entries;

CREATE POLICY "mahasiswa_create_own_logbooks"
ON public.logbook_entries FOR INSERT
TO public
WITH CHECK (
  -- Pastikan user adalah mahasiswa
  EXISTS (
    SELECT 1 FROM public.mahasiswa m
    WHERE m.user_id = auth.uid()
    AND m.id = mahasiswa_id
  )
  -- Dan pastikan jadwal ada dan approved
  AND EXISTS (
    SELECT 1 FROM public.jadwal_praktikum jp
    WHERE jp.id = jadwal_id
    AND jp.status = 'approved'
    AND jp.is_active = true
  )
);

-- 5. Verifikasi semua policies mahasiswa
SELECT 
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE tablename = 'logbook_entries'
  AND policyname LIKE '%mahasiswa%'
ORDER BY cmd, policyname;
