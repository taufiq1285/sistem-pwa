-- ============================================================================
-- CEK DATA SAAT INI - Jalankan di Supabase SQL Editor
-- ============================================================================

-- 1. Cek jumlah data di setiap tabel
SELECT 'kuis' as table_name, COUNT(*) as total, MAX(created_at) as latest_date FROM kuis
UNION ALL
SELECT 'soal_kuis', COUNT(*), MAX(created_at) FROM soal_kuis
UNION ALL
SELECT 'attempt_kuis', COUNT(*), MAX(created_at) FROM attempt_kuis
UNION ALL
SELECT 'jawaban', COUNT(*), MAX(created_at) FROM jawaban;

-- 2. Lihat detail kuis yang ada
SELECT
  id,
  judul,
  deskripsi,
  kategori,
  STATUS,
  created_at
FROM kuis
ORDER BY created_at DESC;

-- 3. Lihat attempt dengan status
SELECT
  ak.id,
  k.judul as kuis_judul,
  m.nama as mahasiswa,
  ak.status,
  ak.total_poin,
  ak.submitted_at,
  ak.created_at
FROM attempt_kuis ak
JOIN kuis k ON ak.kuis_id = k.id
JOIN mahasiswa m ON ak.mahasiswa_id = m.id
ORDER BY ak.submitted_at DESC NULLS LAST, ak.created_at DESC;

-- 4. Lihat attempt yang perlu dinilai (submitted)
SELECT
  ak.id,
  k.judul as kuis_judul,
  m.nama as mahasiswa,
  ak.status,
  ak.submitted_at
FROM attempt_kuis ak
JOIN kuis k ON ak.kuis_id = k.id
JOIN mahasiswa m ON ak.mahasiswa_id = m.id
WHERE ak.status = 'submitted'
ORDER BY ak.submitted_at DESC;

-- 5. Cek soal per kuis
SELECT
  k.judul as kuis_judul,
  COUNT(sk.id) as jumlah_soal,
  SUM(sk.poin_maksimal) as total_poin
FROM kuis k
LEFT JOIN soal_kuis sk ON k.id = sk.kuis_id
GROUP BY k.id, k.judul
ORDER BY k.created_at DESC;

-- ============================================================================
-- Tips:
-- - Query #1: Menampilkan total count di setiap tabel
-- - Query #2: Detail kuis yang ada
-- - Query #3: Semua attempt dengan status
-- - Query #4: Hanya attempt yang perlu dinilai (submitted)
-- - Query #5: Jumlah soal per kuis
-- ============================================================================
