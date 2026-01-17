-- Debug query untuk mengecek data dosen dan kelas

-- 1. Cek user yang sedang login (sesuaikan dengan user ID Anda)
SELECT * FROM users WHERE email = 'alfiah@dosen.com';

-- 2. Cek data dosen yang terkait dengan user tersebut
SELECT * FROM dosen WHERE user_id IN (SELECT id FROM users WHERE email = 'alfiah@dosen.com');

-- 3. Cek semua kelas di database
SELECT
  k.id,
  k.nama_kelas,
  k.kode_kelas,
  k.dosen_id,
  k.mata_kuliah_id,
  k.is_active,
  mk.nama_mk,
  mk.kode_mk
FROM kelas k
LEFT JOIN mata_kuliah mk ON k.mata_kuliah_id = mk.id
WHERE k.is_active = true
ORDER BY k.nama_kelas;

-- 4. Cek kelas yang di-assign ke dosen tertentu
SELECT
  k.id,
  k.nama_kelas,
  k.kode_kelas,
  k.dosen_id,
  k.mata_kuliah_id,
  k.is_active,
  mk.nama_mk,
  mk.kode_mk
FROM kelas k
LEFT JOIN mata_kuliah mk ON k.mata_kuliah_id = mk.id
WHERE k.dosen_id = '17c835f6-6121-4c37-b1ce-a9fe7b98f64a' -- Ganti dengan dosen ID yang benar
AND k.is_active = true;

-- 5. Cek jadwal praktikum (untuk comparasi)
SELECT
  jp.id,
  jp.kelas_id,
  jp.dosen_id,
  jp.tanggal_praktikum,
  k.nama_kelas,
  mk.nama_mk
FROM jadwal_praktikum jp
LEFT JOIN kelas k ON jp.kelas_id = k.id
LEFT JOIN mata_kuliah mk ON k.mata_kuliah_id = mk.id
WHERE jp.dosen_id = '17c835f6-6121-4c37-b1ce-a9fe7b98f64a' -- Ganti dengan dosen ID yang benar
AND jp.is_active = true;