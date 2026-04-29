-- ============================================================================
-- Harden nilai scope by mahasiswa + kelas + mata kuliah
-- Purpose:
-- - Penilaian dosen sekarang bebas memilih kelas dan mata kuliah dari master admin.
-- - Satu mahasiswa dalam satu kelas bisa punya nilai untuk beberapa mata kuliah.
-- - Struktur Supabase harus memakai unique index parsial, bukan unique lama
--   (mahasiswa_id, kelas_id) saja.
-- ============================================================================

ALTER TABLE public.nilai
ADD COLUMN IF NOT EXISTS mata_kuliah_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'nilai_mata_kuliah_id_fkey'
      AND conrelid = 'public.nilai'::regclass
  ) THEN
    ALTER TABLE public.nilai
    ADD CONSTRAINT nilai_mata_kuliah_id_fkey
    FOREIGN KEY (mata_kuliah_id)
    REFERENCES public.mata_kuliah(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- Backfill data legacy agar nilai lama tetap punya label mata kuliah jika kelas
-- lama masih memiliki mata_kuliah_id.
UPDATE public.nilai n
SET mata_kuliah_id = k.mata_kuliah_id
FROM public.kelas k
WHERE k.id = n.kelas_id
  AND n.mata_kuliah_id IS NULL
  AND k.mata_kuliah_id IS NOT NULL;

-- Drop semua kemungkinan unique constraint lama yang hanya membatasi
-- mahasiswa_id + kelas_id. Nama constraint bisa berbeda antar project.
ALTER TABLE public.nilai
DROP CONSTRAINT IF EXISTS nilai_unique;

ALTER TABLE public.nilai
DROP CONSTRAINT IF EXISTS nilai_mahasiswa_id_kelas_id_key;

DROP INDEX IF EXISTS public.idx_nilai_mahasiswa_kelas;
DROP INDEX IF EXISTS public.nilai_mahasiswa_id_kelas_id_key;

CREATE INDEX IF NOT EXISTS idx_nilai_mahasiswa_id
ON public.nilai(mahasiswa_id);

CREATE INDEX IF NOT EXISTS idx_nilai_kelas_id
ON public.nilai(kelas_id);

CREATE INDEX IF NOT EXISTS idx_nilai_mata_kuliah_id
ON public.nilai(mata_kuliah_id)
WHERE mata_kuliah_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_nilai_unique_mhs_kelas_mk
ON public.nilai(mahasiswa_id, kelas_id, mata_kuliah_id)
WHERE mata_kuliah_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_nilai_unique_mhs_kelas_legacy
ON public.nilai(mahasiswa_id, kelas_id)
WHERE mata_kuliah_id IS NULL;

COMMENT ON COLUMN public.nilai.mata_kuliah_id IS
'Mata kuliah yang dipilih dosen saat input nilai. Nilai dibedakan per mahasiswa + kelas + mata kuliah.';
