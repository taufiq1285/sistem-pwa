-- ============================================================================
-- CEK ENUM tipe_soal
-- ============================================================================

-- 1. Lihat definisi enum tipe_soal
SELECT enumlabel
FROM pg_enum
WHERE enumtypid = (
  SELECT oid FROM pg_type WHERE typname = 'tipe_soal'
)
ORDER BY enumsortorder;

-- 2. Cek apakah ada tipe yang berbeda di database
SELECT DISTINCT tipe
FROM soal;

-- 3. Test query dengan kondisi tipe
SELECT
  id,
  pertanyaan,
  tipe,
  tipe::text = 'pilihan_ganda' as is_pilihan_ganda,
  tipe = 'pilihan_ganda'::tipe_soal as is_pilihan_ganda_cast
FROM soal
WHERE tipe::text = 'pilihan_ganda';
