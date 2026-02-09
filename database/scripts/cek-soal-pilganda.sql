-- ============================================================================
-- CEK SOAL PILIHAN GANDA
-- ============================================================================

-- 1. Cek semua soal pilihan_ganda
SELECT
  id,
  kuis_id,
  pertanyaan,
  tipe_soal,
  opsi_jawaban,
  jawaban_benar,
  poin_maksimal,
  urutan
FROM soal
WHERE tipe_soal = 'pilihan_ganda'
ORDER BY kuis_id, urutan;

-- 2. Cek apakah opsi_jawaban NULL atau kosong
SELECT
  id,
  pertanyaan,
  opsi_jawaban IS NULL as is_null,
  jsonb_array_length(opsi_jawaban) as opsi_count
FROM soal
WHERE tipe_soal = 'pilihan_ganda';
