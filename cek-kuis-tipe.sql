-- ============================================================================
-- CEK KUIS BERDASARKAN TIPE
-- ============================================================================

-- 1. Cek nilai unik di kolom tipe_kuis
SELECT DISTINCT tipe_kuis
FROM kuis
WHERE tipe_kuis IS NOT NULL;

-- 2. Lihat semua kuis dengan kolom yang benar
SELECT
  id,
  judul,
  deskripsi,
  tipe_kuis,
  STATUS,
  created_at
FROM kuis
ORDER BY created_at DESC;

-- 3. Cek count per tipe_kuis
SELECT
  tipe_kuis,
  COUNT(*) as jumlah,
  STRING_AGG(judul, ', ') as daftar_kuis
FROM kuis
GROUP BY tipe_kuis
ORDER BY tipe_kuis;

-- 4. Cek attempt dan relasi untuk tipe tertentu (misal: tugas praktikum)
SELECT
  k.id as kuis_id,
  k.judul as kuis_judul,
  k.tipe_kuis,
  COUNT(ak.id) as total_attempt,
  STRING_AGG(ak.status, ', ') as statuses
FROM kuis k
LEFT JOIN attempt_kuis ak ON k.id = ak.kuis_id
GROUP BY k.id, k.judul, k.tipe_kuis
ORDER BY k.created_at DESC;
