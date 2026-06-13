-- Add explicit mata kuliah context to materi.
-- Materi remains visible by kelas_id; mata_kuliah_id is for context/filtering.

ALTER TABLE public.materi
ADD COLUMN IF NOT EXISTS mata_kuliah_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'materi_mata_kuliah_id_fkey'
  ) THEN
    ALTER TABLE public.materi
    ADD CONSTRAINT materi_mata_kuliah_id_fkey
    FOREIGN KEY (mata_kuliah_id)
    REFERENCES public.mata_kuliah(id)
    ON DELETE SET NULL;
  END IF;
END $$;

UPDATE public.materi m
SET mata_kuliah_id = k.mata_kuliah_id
FROM public.kelas k
WHERE m.kelas_id = k.id
  AND m.mata_kuliah_id IS NULL
  AND k.mata_kuliah_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_materi_mata_kuliah_id
ON public.materi(mata_kuliah_id)
WHERE mata_kuliah_id IS NOT NULL;

COMMENT ON COLUMN public.materi.mata_kuliah_id IS
'Explicit mata kuliah selected by dosen when uploading materi. Visibility remains controlled by kelas_id enrollment.';
