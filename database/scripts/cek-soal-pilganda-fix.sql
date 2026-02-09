-- ============================================================================
-- CEK SOAL PILIHAN GANDA - DENGAN NAMA KOLOM YANG BENAR
-- ============================================================================

-- 1. Cek semua soal berdasarkan tipe
SELECT
  id,
  kuis_id,
  tipe,
  pertanyaan,
  pilihan_jawaban,
  jawaban_benar,
  poin,
  urutan
FROM soal
ORDER BY kuis_id, urutan;

-- 2. Cek apakah pilihan_jawaban NULL atau kosong
SELECT
  tipe,
  COUNT(*) as jumlah_soal,
  COUNT(pilihan_jawaban) as jumlah_berisi_opsi,
  COUNT(*) - COUNT(pilihan_jawaban) as jumlah_tanpa_opsi
FROM soal
GROUP BY tipe;

-- 3. Lihat detail soal dengan tipe 'pilihan_ganda'
SELECT
  id,
  pertanyaan,
  pilihan_jawaban,
  jsonb_pretty(pilihan_jawaban) as opsi_formatted
FROM soal
WHERE tipe = 'pilihan_ganda';
