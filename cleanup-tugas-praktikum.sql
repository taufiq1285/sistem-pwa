-- ============================================================================
-- CLEANUP TUGAS PRAKTIKUM (ESSAY) SAJA
-- ============================================================================
-- Hapus semua kuis dengan tipe_kuis = 'essay' dan relasinya
-- Kuis pilihan_ganda TIDAK akan dihapus
-- ============================================================================

-- 1. Hapus jawaban dari attempt yang terkait dengan kuis essay
DELETE FROM jawaban
WHERE attempt_id IN (
  SELECT id FROM attempt_kuis
  WHERE kuis_id IN (
    SELECT id FROM kuis WHERE tipe_kuis = 'essay'
  )
);

-- 2. Hapus attempt_kuis untuk kuis essay
DELETE FROM attempt_kuis
WHERE kuis_id IN (
  SELECT id FROM kuis WHERE tipe_kuis = 'essay'
);

-- 3. Hapus soal untuk kuis essay
DELETE FROM soal
WHERE kuis_id IN (
  SELECT id FROM kuis WHERE tipe_kuis = 'essay'
);

-- 4. Hapus kuis essay
DELETE FROM kuis
WHERE tipe_kuis = 'essay';

-- ============================================================================
-- VERIFIKASI: Cek sisa data setelah cleanup
-- ============================================================================

-- 1. Summary count
SELECT 'kuis' as table_name, COUNT(*) as total FROM kuis
UNION ALL
SELECT 'soal', COUNT(*) FROM soal
UNION ALL
SELECT 'attempt_kuis', COUNT(*) FROM attempt_kuis
UNION ALL
SELECT 'jawaban', COUNT(*) FROM jawaban;

-- 2. Cek kuis yang tersisa (harusnya hanya pilihan_ganda)
SELECT
  id,
  judul,
  tipe_kuis,
  status,
  created_at
FROM kuis
ORDER BY created_at DESC;

-- 3. Cek attempt yang tersisa
SELECT
  ak.id,
  k.judul as kuis_judul,
  k.tipe_kuis,
  ak.status,
  ak.created_at
FROM attempt_kuis ak
JOIN kuis k ON ak.kuis_id = k.id
ORDER BY ak.created_at DESC;

-- ============================================================================
-- Catatan:
-- - Semua kuis essay (tugas praktikum) akan dihapus
-- - Kuis pilihan_ganda TIDAK akan dihapus
-- - Semua attempt, jawaban, dan soal terkait kuis essay juga dihapus
-- ============================================================================
