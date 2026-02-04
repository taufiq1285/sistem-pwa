-- ============================================================================
-- CEK ATTEMPT DAN TOTAL_POIN
-- ============================================================================

-- Cek attempt untuk kuis "ted cbt"
SELECT
  ak.id,
  ak.status,
  ak.total_poin,
  ak.started_at,
  ak.submitted_at,
  m.nim,
  m.user_id,
  u.full_name
FROM attempt_kuis ak
JOIN mahasiswa m ON ak.mahasiswa_id = m.id
JOIN users u ON m.user_id = u.id
JOIN kuis k ON ak.kuis_id = k.id
WHERE k.judul = 'ted cbt'
ORDER BY ak.submitted_at DESC;

-- Cek jawaban untuk attempt ini
SELECT
  j.id,
  j.soal_id,
  j.jawaban,
  j.poin_diperoleh,
  j.is_correct,
  s.pertanyaan,
  s.poin as soal_poin
FROM jawaban j
JOIN soal s ON j.soal_id = s.id
WHERE j.attempt_id = (
  SELECT id FROM attempt_kuis
  WHERE kuis_id = (SELECT id FROM kuis WHERE judul = 'ted cbt' LIMIT 1)
  ORDER BY submitted_at DESC
  LIMIT 1
);
