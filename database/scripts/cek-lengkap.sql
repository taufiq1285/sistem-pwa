-- ============================================================================
-- CEK SEMUA DATA LENGKAP SEBELUM CLEANUP
-- ============================================================================

-- 1. Summary count semua tabel
SELECT
  'kuis' as table_name,
  COUNT(*) as total,
  MAX(created_at) as latest
FROM kuis
UNION ALL
SELECT 'soal_kuis', COUNT(*), MAX(created_at) FROM soal_kuis
UNION ALL
SELECT 'attempt_kuis', COUNT(*), MAX(created_at) FROM attempt_kuis
UNION ALL
SELECT 'jawaban', COUNT(*), MAX(created_at) FROM jawaban;

-- 2. Detail semua kuis
SELECT
  id,
  judul,
  deskripsi,
  kategori,
  STATUS,
  created_at
FROM kuis
ORDER BY created_at DESC;

-- 3. Detail semua attempt dengan relasi
SELECT
  ak.id,
  k.judul as kuis_judul,
  m.nama as mahasiswa,
  m.nim,
  ak.status,
  ak.total_poin,
  ak.started_at,
  ak.submitted_at,
  ak.created_at
FROM attempt_kuis ak
LEFT JOIN kuis k ON ak.kuis_id = k.id
LEFT JOIN mahasiswa m ON ak.mahasiswa_id = m.id
ORDER BY ak.created_at DESC;

-- 4. Detail semua jawaban
SELECT
  j.id,
  k.judul as kuis_judul,
  m.nama as mahasiswa,
  sk.tipe as tipe_soal,
  j.poin_diperoleh,
  j.feedback,
  j.created_at
FROM jawaban j
LEFT JOIN attempt_kuis ak ON j.attempt_id = ak.id
LEFT JOIN kuis k ON ak.kuis_id = k.id
LEFT JOIN mahasiswa m ON ak.mahasiswa_id = m.id
LEFT JOIN soal_kuis sk ON j.soal_id = sk.id
ORDER BY j.created_at DESC;

-- 5. Group: Berapa attempt per mahasiswa per kuis
SELECT
  k.judul as kuis,
  m.nama as mahasiswa,
  COUNT(*) as total_attempt,
  STRING_AGG(ak.status, ', ') as statuses
FROM attempt_kuis ak
LEFT JOIN kuis k ON ak.kuis_id = k.id
LEFT JOIN mahasiswa m ON ak.mahasiswa_id = m.id
GROUP BY k.judul, m.nama
ORDER BY k.judul, m.nama;
