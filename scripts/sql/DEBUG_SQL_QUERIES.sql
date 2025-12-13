-- ============================================================================
-- DEBUG SQL QUERIES - Cek Kelas & Jadwal
-- ============================================================================

-- QUERY 1: List semua kelas dengan dosen info
SELECT
  k.id,
  k.nama_kelas,
  k.kode_kelas,
  k.dosen_id,
  d.id as dosen_check_id,
  d.user_id as dosen_user_id,
  COUNT(j.id) as jumlah_jadwal
FROM kelas k
LEFT JOIN dosen d ON d.id = k.dosen_id
LEFT JOIN jadwal_praktikum j ON j.kelas_id = k.id
GROUP BY k.id, k.nama_kelas, k.kode_kelas, k.dosen_id, d.id, d.user_id
ORDER BY k.created_at DESC
LIMIT 20;

-- ============================================================================

-- QUERY 2: Cek kelas yang punya dosen_id NULL (MASALAH!)
SELECT
  k.id,
  k.nama_kelas,
  k.created_at,
  COUNT(j.id) as jumlah_jadwal
FROM kelas k
LEFT JOIN jadwal_praktikum j ON j.kelas_id = k.id
WHERE k.dosen_id IS NULL
GROUP BY k.id, k.nama_kelas, k.created_at
ORDER BY k.created_at DESC;

-- ============================================================================

-- QUERY 3: Cek semua jadwal dengan detail kelas & dosen
SELECT
  j.id as jadwal_id,
  j.tanggal_praktikum,
  j.jam_mulai,
  j.jam_selesai,
  j.kelas_id,
  k.nama_kelas,
  k.dosen_id,
  d.id as dosen_id_check
FROM jadwal_praktikum j
LEFT JOIN kelas k ON k.id = j.kelas_id
LEFT JOIN dosen d ON d.id = k.dosen_id
ORDER BY j.tanggal_praktikum DESC
LIMIT 20;

-- ============================================================================

-- QUERY 4: Cek jadwal yang kelas_id NULL (MASALAH!)
SELECT
  j.id,
  j.tanggal_praktikum,
  j.jam_mulai,
  j.kelas_id,
  j.created_at
FROM jadwal_praktikum j
WHERE j.kelas_id IS NULL
ORDER BY j.created_at DESC;

-- ============================================================================

-- QUERY 5: List semua dosen
SELECT
  id,
  user_id,
  nama_dosen,
  nip
FROM dosen
ORDER BY created_at DESC
LIMIT 20;

-- ============================================================================

-- QUERY 6: Cek kelas yang paling baru dibuat
SELECT
  k.id,
  k.nama_kelas,
  k.kode_kelas,
  k.dosen_id,
  k.created_at,
  (SELECT COUNT(*) FROM jadwal_praktikum WHERE kelas_id = k.id) as jadwal_count
FROM kelas k
ORDER BY k.created_at DESC
LIMIT 5;

-- ============================================================================

-- QUERY 7: Cek jadwal yang paling baru dibuat
SELECT
  j.id,
  j.kelas_id,
  j.tanggal_praktikum,
  j.jam_mulai,
  k.nama_kelas,
  k.dosen_id,
  j.created_at
FROM jadwal_praktikum j
LEFT JOIN kelas k ON k.id = j.kelas_id
ORDER BY j.created_at DESC
LIMIT 5;

-- ============================================================================

-- QUERY 8: Cek user_id dosen yang login (jika tau email)
-- Replace 'email@example.com' dengan email dosen
SELECT
  u.id as user_id,
  u.email,
  d.id as dosen_id,
  d.nama_dosen
FROM auth.users u
LEFT JOIN dosen d ON d.user_id = u.id
WHERE u.email = 'email@example.com'  -- GANTI DENGAN EMAIL DOSEN
LIMIT 5;

-- ============================================================================

-- QUERY 9: Cek enrollment (mahasiswa yang sudah di-enroll ke kelas)
SELECT
  n.id,
  n.mahasiswa_id,
  n.kelas_id,
  m.nim,
  u.full_name as mahasiswa_nama,
  k.nama_kelas,
  n.is_active
FROM nilai n
LEFT JOIN mahasiswa m ON m.id = n.mahasiswa_id
LEFT JOIN users u ON u.id = m.user_id
LEFT JOIN kelas k ON k.id = n.kelas_id
ORDER BY n.created_at DESC
LIMIT 20;

-- ============================================================================

-- QUERY 10: SUMMARY - Quick check
SELECT
  'Total Kelas' as metric,
  COUNT(*)::text as value
FROM kelas
UNION ALL
SELECT 'Kelas dengan dosen_id', COUNT(*)::text FROM kelas WHERE dosen_id IS NOT NULL
UNION ALL
SELECT 'Kelas tanpa dosen_id (NULL)', COUNT(*)::text FROM kelas WHERE dosen_id IS NULL
UNION ALL
SELECT 'Total Jadwal', COUNT(*)::text FROM jadwal_praktikum
UNION ALL
SELECT 'Jadwal dengan kelas_id', COUNT(*)::text FROM jadwal_praktikum WHERE kelas_id IS NOT NULL
UNION ALL
SELECT 'Jadwal tanpa kelas_id (NULL)', COUNT(*)::text FROM jadwal_praktikum WHERE kelas_id IS NULL;

-- ============================================================================
-- HOW TO USE:
-- ============================================================================
-- 1. Copy query yang ingin cek
-- 2. Buka Supabase SQL Editor
-- 3. Paste query
-- 4. Klik "RUN"
-- 5. Share hasil dengan developer
--
-- RECOMMENDED ORDER:
-- 1. Query 10 (SUMMARY - cepat lihat overview)
-- 2. Query 6 (Cek kelas terbaru - ada dosen_id?)
-- 3. Query 7 (Cek jadwal terbaru - ada kelas_id?)
-- 4. Query 1 (Lihat semua kelas detail)
-- 5. Query 3 (Lihat semua jadwal detail)
-- ============================================================================
