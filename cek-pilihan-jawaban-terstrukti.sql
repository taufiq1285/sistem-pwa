-- ============================================================================
-- CEK STRUKTUR PILIHAN JAWABAN
-- ============================================================================

-- Cek soal dengan detail pilihan_jawaban dan jawaban_benar
SELECT
  id,
  pertanyaan,
  tipe,
  pilihan_jawaban,
  jawaban_benar,
  poin
FROM soal
WHERE tipe = 'pilihan_ganda'
  AND kuis_id = (SELECT id FROM kuis WHERE judul = 'ted cbt' LIMIT 1)
LIMIT 5;
