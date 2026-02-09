-- ============================================================================
-- CEK SISA ATTEMPT YANG MASUK ADA
-- ============================================================================

-- Cek attempt yang masih ada
SELECT
  ak.id,
  k.judul as kuis_judul,
  k.tipe_kuis,
  m.nim as mahasiswa_nim,
  ak.status,
  ak.submitted_at
FROM attempt_kuis ak
JOIN kuis k ON ak.kuis_id = k.id
JOIN mahasiswa m ON ak.mahasiswa_id = m.id
WHERE ak.status = 'submitted'
ORDER BY ak.submitted_at DESC;

-- Cek jumlah jawaban
SELECT
  COUNT(*) as total_jawaban,
  COUNT(DISTINCT attempt_id) as attempt_with_answers
FROM jawaban;

-- Cek kuis yang masih ada
SELECT
  id,
  judul,
  tipe_kuis,
  status,
  COUNT(*) as jumlah_attempt
FROM kuis
GROUP BY id, judul, tipe_kuis, status
ORDER BY created_at DESC;
