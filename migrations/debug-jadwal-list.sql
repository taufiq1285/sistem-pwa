-- Debug: Cek semua jadwal untuk melihat masalah
-- Jalankan ini di Supabase SQL Editor

-- 1. Cek SEMUA jadwal (termasuk yang is_active = NULL)
SELECT
  id,
  dosen_id,
  kelas_id,
  laboratorium_id,
  topik,
  tanggal_praktikum,
  jam_mulai,
  jam_selesai,
  status,
  is_active,
  created_at
FROM jadwal_praktikum
ORDER BY created_at DESC;

-- 2. Cek jadwal berdasarkan status
SELECT
  status,
  is_active,
  COUNT(*) as total
FROM jadwal_praktikum
GROUP BY status, is_active;

-- 3. Cek jadwal dengan join untuk melihat nama dosen & kelas
SELECT
  jp.id,
  u.full_name as dosen_nama,
  k.nama_kelas,
  l.nama_lab,
  jp.topik,
  jp.tanggal_praktikum,
  jp.status,
  jp.is_active,
  jp.created_at
FROM jadwal_praktikum jp
LEFT JOIN dosen d ON jp.dosen_id = d.id
LEFT JOIN users u ON d.user_id = u.id
LEFT JOIN kelas k ON jp.kelas_id = k.id
LEFT JOIN laboratorium l ON jp.laboratorium_id = l.id
ORDER BY jp.created_at DESC;

-- 4. Cek apakah ada jadwal dengan is_active NULL atau FALSE
SELECT
  id,
  topik,
  is_active,
  status,
  CASE
    WHEN is_active IS NULL THEN 'NULL - tidak akan muncul di list!'
    WHEN is_active = false THEN 'FALSE - soft deleted'
    WHEN is_active = true THEN 'TRUE - aktif'
  END as status_check
FROM jadwal_praktikum
ORDER BY created_at DESC;
