-- ============================================================================
-- CARI ATTEMPT TERBARU
-- ============================================================================

-- Cari attempt untuk kuis "tes cbt" atau kuis dengan ID tertentu
SELECT
  ak.id,
  k.judul as kuis_judul,
  m.nim as mahasiswa_nim,
  ak.status,
  ak.submitted_at,
  ak.created_at
FROM attempt_kuis ak
JOIN kuis k ON ak.kuis_id = k.id
JOIN mahasiswa m ON ak.mahasiswa_id = m.id
WHERE ak.submitted_at >= '2026-02-04 12:00:00'
  AND ak.submitted_at <= '2026-02-04 13:00:00'
ORDER BY ak.submitted_at DESC;

-- Cek jawaban untuk attempt ini
SELECT
  j.id,
  j.attempt_id,
  j.soal_id,
  s.pertanyaan,
  s.tipe,
  j.jawaban_text,
  j.jawaban,
  j.poin_diperoleh,
  j.feedback
FROM jawaban j
JOIN soal s ON j.soal_id = s.id
WHERE j.attempt_id = 'f1b4d30a-e753-4731-8e3d-0ffc85f75746'  -- Ganti dengan ID attempt yang ditemukan di atas
ORDER BY s.urutan;
