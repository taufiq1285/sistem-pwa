-- DEBUG: Cek data mahasiswa, enrollment, dan jadwal
-- Jalankan di Supabase SQL Editor

-- 1. Cek user yang sedang login (ganti email dengan email mahasiswa)
SELECT 
  u.id as user_id,
  u.full_name,
  u.email,
  u.role,
  m.id as mahasiswa_id
FROM users u
LEFT JOIN mahasiswa m ON u.id = m.user_id
WHERE u.role = 'mahasiswa'
ORDER BY u.created_at DESC;

-- 2. Cek enrollment mahasiswa di kelas
SELECT 
  km.id,
  km.mahasiswa_id,
  km.kelas_id,
  k.nama_kelas,
  mk.nama_mk,
  mk.kode_mk
FROM kelas_mahasiswa km
LEFT JOIN kelas k ON km.kelas_id = k.id
LEFT JOIN mata_kuliah mk ON k.mata_kuliah_id = mk.id
ORDER BY km.mahasiswa_id, k.nama_kelas;

-- 3. Cek semua jadwal dengan kelas_id
SELECT 
  jp.id,
  jp.kelas_id,
  k.nama_kelas,
  mk.nama_mk,
  jp.topik,
  jp.tanggal_praktikum,
  jp.status,
  jp.is_active,
  l.nama_lab
FROM jadwal_praktikum jp
LEFT JOIN kelas k ON jp.kelas_id = k.id
LEFT JOIN mata_kuliah mk ON k.mata_kuliah_id = mk.id
LEFT JOIN laboratorium l ON jp.laboratorium_id = l.id
WHERE jp.is_active = true
ORDER BY jp.tanggal_praktikum DESC;

-- 4. Cek apakah ada jadwal yang approved
SELECT 
  jp.id,
  jp.kelas_id,
  k.nama_kelas,
  jp.topik,
  jp.status,
  jp.is_active
FROM jadwal_praktikum jp
LEFT JOIN kelas k ON jp.kelas_id = k.id
WHERE jp.is_active = true 
  AND jp.status = 'approved'
ORDER BY jp.created_at DESC;

-- 5. Join test: Cek jadwal untuk kelas tertentu
-- Ganti <KELAS_ID> dengan ID kelas dari query #2
SELECT 
  km.mahasiswa_id,
  km.kelas_id,
  k.nama_kelas,
  COUNT(jp.id) as total_jadwal,
  COUNT(CASE WHEN jp.status = 'approved' THEN 1 END) as approved_jadwal
FROM kelas_mahasiswa km
LEFT JOIN kelas k ON km.kelas_id = k.id
LEFT JOIN jadwal_praktikum jp ON jp.kelas_id = km.kelas_id AND jp.is_active = true
GROUP BY km.mahasiswa_id, km.kelas_id, k.nama_kelas
ORDER BY km.mahasiswa_id;
