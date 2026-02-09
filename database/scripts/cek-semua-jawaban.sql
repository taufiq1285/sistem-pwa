-- ============================================================================
-- CEK SEMUA JAWABAN (tanpa filter attempt)
-- ============================================================================

SELECT
  j.id,
  j.attempt_id,
  j.soal_id,
  s.pertanyaan,
  s.tipe,
  j.jawaban,
  j.poin_diperoleh,
  j.feedback,
  j.created_at
FROM jawaban j
JOIN soal s ON j.soal_id = s.id
WHERE s.tipe = 'pilihan_ganda'
ORDER BY j.created_at DESC
LIMIT 10;
