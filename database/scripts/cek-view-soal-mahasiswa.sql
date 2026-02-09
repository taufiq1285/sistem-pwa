-- ============================================================================
-- CEK VIEW soal_mahasiswa
-- ============================================================================

-- 1. Lihat definisi view soal_mahasiswa
SELECT
  table_name,
  view_definition
FROM information_schema.views
WHERE table_name = 'soal_mahasiswa'
  AND table_schema = 'public';

-- 2. Cek apakah pilihan_jawaban ada di view
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'soal_mahasiswa'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Test query dari view
SELECT
  id,
  pertanyaan,
  tipe,
  pilihan_jawaban,
  jawaban_benar
FROM soal_mahasiswa
WHERE tipe = 'pilihan_ganda'
LIMIT 2;
