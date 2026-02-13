-- PERBAIKAN LENGKAP RLS Policies untuk Logbook
-- Jalankan di Supabase SQL Editor

-- =====================================================
-- STEP 1: Drop semua policy mahasiswa yang lama
-- =====================================================

DROP POLICY IF EXISTS "mahasiswa_view_own_logbooks" ON public.logbook_entries;
DROP POLICY IF EXISTS "mahasiswa_create_own_logbooks" ON public.logbook_entries;
DROP POLICY IF EXISTS "mahasiswa_update_own_logbooks" ON public.logbook_entries;
DROP POLICY IF EXISTS "mahasiswa_delete_own_logbooks" ON public.logbook_entries;
DROP POLICY IF EXISTS "mahasiswa_submit_own_logbooks" ON public.logbook_entries;

-- =====================================================
-- STEP 2: Buat ulang semua policy mahasiswa
-- =====================================================

-- Policy 1: Mahasiswa bisa VIEW logbook sendiri
CREATE POLICY "mahasiswa_view_own_logbooks"
ON public.logbook_entries FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.mahasiswa m
    WHERE m.id = logbook_entries.mahasiswa_id
    AND m.user_id = auth.uid()
  )
);

-- Policy 2: Mahasiswa bisa CREATE logbook (hanya untuk jadwal approved)
CREATE POLICY "mahasiswa_create_own_logbooks"
ON public.logbook_entries FOR INSERT
TO public
WITH CHECK (
  -- User harus mahasiswa
  EXISTS (
    SELECT 1 FROM public.mahasiswa m
    WHERE m.user_id = auth.uid()
    AND m.id = mahasiswa_id
  )
  -- Jadwal harus ada dan approved
  AND EXISTS (
    SELECT 1 FROM public.jadwal_praktikum jp
    WHERE jp.id = jadwal_id
    AND jp.status = 'approved'
    AND jp.is_active = true
  )
);

-- Policy 3: Mahasiswa bisa UPDATE & SUBMIT logbook sendiri
CREATE POLICY "mahasiswa_update_own_logbooks"
ON public.logbook_entries FOR UPDATE
TO public
USING (
  -- Hanya pemilik logbook
  EXISTS (
    SELECT 1 FROM public.mahasiswa m
    WHERE m.id = logbook_entries.mahasiswa_id
    AND m.user_id = auth.uid()
  )
  -- Dan hanya jika status masih draft ATAU sedang submit
  AND (status = 'draft' OR status = 'submitted')
)
WITH CHECK (
  -- Izinkan: update biasa (status tetap draft)
  (
    status = 'draft'
    AND EXISTS (
      SELECT 1 FROM public.mahasiswa m
      WHERE m.id = logbook_entries.mahasiswa_id
      AND m.user_id = auth.uid()
    )
  )
  -- ATAU izinkan: submit (ubah status ke submitted)
  OR (
    status = 'submitted'
    AND EXISTS (
      SELECT 1 FROM public.mahasiswa m
      WHERE m.id = logbook_entries.mahasiswa_id
      AND m.user_id = auth.uid()
    )
  )
);

-- Policy 4: Mahasiswa bisa DELETE logbook sendiri (hanya draft)
CREATE POLICY "mahasiswa_delete_own_logbooks"
ON public.logbook_entries FOR DELETE
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.mahasiswa m
    WHERE m.id = logbook_entries.mahasiswa_id
    AND m.user_id = auth.uid()
  )
  AND status = 'draft'
);

-- =====================================================
-- STEP 3: Verifikasi
-- =====================================================

SELECT 
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE tablename = 'logbook_entries'
  AND policyname LIKE '%mahasiswa%'
ORDER BY cmd, policyname;

-- Expected output:
-- mahasiswa_create_own_logbooks  | INSERT  | PERMISSIVE
-- mahasiswa_delete_own_logbooks  | DELETE  | PERMISSIVE
-- mahasiswa_update_own_logbooks  | UPDATE  | PERMISSIVE
-- mahasiswa_view_own_logbooks   | SELECT  | PERMISSIVE
