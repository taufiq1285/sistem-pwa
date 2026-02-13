-- Tambahkan policy khusus untuk mahasiswa submit logbook
-- Jalankan di Supabase SQL Editor

-- Policy ini mengizinkan mahasiswa mengubah status dari draft ke submitted
DROP POLICY IF EXISTS "mahasiswa_submit_own_logbooks" ON public.logbook_entries;

CREATE POLICY "mahasiswa_submit_own_logbooks"
ON public.logbook_entries FOR UPDATE
TO public
USING (
  -- Hanya untuk submit (ubah status dari draft ke submitted)
  EXISTS (
    SELECT 1 FROM public.mahasiswa m
    WHERE m.id = logbook_entries.mahasiswa_id
    AND m.user_id = auth.uid()
  )
  AND status = 'draft'
)
WITH CHECK (
  -- Setelah submit, status harus menjadi submitted
  (
    status = 'submitted'
    AND EXISTS (
      SELECT 1 FROM public.mahasiswa m
      WHERE m.id = logbook_entries.mahasiswa_id
      AND m.user_id = auth.uid()
    )
  )
  -- ATAU izinkan update biasa (status tetap draft)
  OR (
    status = 'draft'
    AND EXISTS (
      SELECT 1 FROM public.mahasiswa m
      WHERE m.id = logbook_entries.mahasiswa_id
      AND m.user_id = auth.uid()
    )
  )
);

-- Verifikasi
SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'logbook_entries'
  AND policyname LIKE '%mahasiswa%'
ORDER BY policyname;
