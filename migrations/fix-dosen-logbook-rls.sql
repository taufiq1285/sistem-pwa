-- Perbaiki RLS Policies untuk Dosen pada logbook_entries
-- Jalankan di Supabase SQL Editor

-- 1. Cek policy dosen yang sudah ada
SELECT 
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE tablename = 'logbook_entries'
  AND policyname LIKE '%dosen%'
ORDER BY policyname;

-- 2. Drop dan recreate policy SELECT untuk dosen
DROP POLICY IF EXISTS "dosen_view_assigned_logbooks" ON public.logbook_entries;

CREATE POLICY "dosen_view_assigned_logbooks"
ON public.logbook_entries FOR SELECT
TO public
USING (
  -- Dosen bisa lihat logbook untuk jadwal yang dia pegang
  EXISTS (
    SELECT 1 FROM public.jadwal_praktikum jp
    WHERE jp.id = logbook_entries.jadwal_id
    AND (
      -- Cek berdasarkan kelas.dosen_id (old schema)
      EXISTS (
        SELECT 1 FROM public.kelas k
        WHERE k.id = jp.kelas_id
        AND k.dosen_id = (
          SELECT d.id FROM public.dosen d WHERE d.user_id = auth.uid()
        )
      )
      -- ATAU cek berdasarkan jadwal.dosen_id (new schema)
      OR (
        jp.dosen_id = (
          SELECT d.id FROM public.dosen d WHERE d.user_id = auth.uid()
        )
      )
    )
  )
  -- ATAU dosen yang sudah direview/logbook_id-nya ada
  OR (
    logbook_entries.dosen_id = (
      SELECT d.id FROM public.dosen d WHERE d.user_id = auth.uid()
    )
  )
);

-- 3. Drop dan recreate policy UPDATE untuk dosen (review & grading)
DROP POLICY IF EXISTS "dosen_review_assigned_logbooks" ON public.logbook_entries;

CREATE POLICY "dosen_review_assigned_logbooks"
ON public.logbook_entries FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.dosen d
    WHERE d.user_id = auth.uid()
    AND (
      d.id = logbook_entries.dosen_id
      OR logbook_entries.dosen_id IS NULL
    )
  )
  -- Hanya logbook milik dosen atau yang belum ada reviewer
  AND EXISTS (
    SELECT 1 FROM public.jadwal_praktikum jp
    WHERE jp.id = logbook_entries.jadwal_id
    AND (
      EXISTS (
        SELECT 1 FROM public.kelas k
        WHERE k.id = jp.kelas_id
        AND k.dosen_id = (
          SELECT d.id FROM public.dosen d WHERE d.user_id = auth.uid()
        )
      )
      OR (
        jp.dosen_id = (
          SELECT d.id FROM public.dosen d WHERE d.user_id = auth.uid()
        )
      )
    )
  )
)
WITH CHECK (
  -- Pastikan user dosen valid
  EXISTS (
    SELECT 1 FROM public.dosen d
    WHERE d.user_id = auth.uid()
  )
  -- Izinkan update untuk review (status -> reviewed)
  AND (
    (logbook_entries.status = 'reviewed')
    OR (logbook_entries.status = 'graded')
    OR (logbook_entries.dosen_feedback IS NOT NULL)
    OR (logbook_entries.nilai IS NOT NULL)
  )
);

-- 4. Verifikasi
SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'logbook_entries'
  AND policyname LIKE '%dosen%'
ORDER BY cmd;

-- Expected:
-- dosen_review_assigned_logbooks | UPDATE
-- dosen_view_assigned_logbooks | SELECT
