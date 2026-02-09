-- ============================================================================
-- CEK STRUKTUR JSON PILIHAN JAWABAN
-- ============================================================================

-- Cek struktur pilihan_jawaban dengan jsonb_pretty
SELECT
  id,
  pertanyaan,
  jsonb_pretty(pilihan_jawaban) as pilihan_jawaban_struktur,
  jawaban_benar,
  typeof(pilihan_jawaban) as tipe_data
FROM soal
WHERE tipe = 'pilihan_ganda'
  AND pertanyaan = 'apa itu anc'
LIMIT 1;
