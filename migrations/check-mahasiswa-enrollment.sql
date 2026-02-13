-- Cek data mahasiswa dan enrollment
-- Jalankan di Supabase SQL Editor

-- 1. Cek semua mahasiswa
SELECT 
  u.id as user_id,
  u.full_name,
  u.email,
  m.id as mahasiswa_id
FROM users u
LEFT JOIN mahasiswa m ON u.id = m.user_id
WHERE u.role = 'mahasiswa'
ORDER BY u.created_at DESC;

-- 2. Cek enrollment mahasiswa di kelas
SELECT 
  km.mahasiswa_id,
  km.kelas_id,
  k.nama_kelas,
  mk.nama_mk
FROM kelas_mahasiswa km
LEFT JOIN kelas k ON km.kelas_id = k.id
LEFT JOIN mata_kuliah mk ON k.mata_kuliah_id = mk.id
ORDER BY km.mahasiswa_id, k.nama_kelas;

-- 3. Cek jadwal yang aktif
SELECT 
  jp.id,
  jp.kelas_id,
  k.nama_kelas,
  jp.topik,
  jp.tanggal_praktikum,
  jp.status,
  jp.is_active
FROM jadwal_praktikum jp
LEFT JOIN kelas k ON jp.kelas_id = k.id
WHERE jp.is_active = true
ORDER BY jp.tanggal_praktikum DESC;

-- 4. Cek logbook yang sudah ada
SELECT 
  le.id,
  le.mahasiswa_id,
  u.full_name as mahasiswa_nama,
  le.jadwal_id,
  jp.topik,
  le.status
FROM logbook_entries le
LEFT JOIN users u ON le.mahasiswa_id = (
  SELECT m.id FROM mahasiswa m WHERE m.user_id = u.id
)
LEFT JOIN jadwal_praktikum jp ON le.jadwal_id = jp.id
ORDER BY le.created_at DESC;
