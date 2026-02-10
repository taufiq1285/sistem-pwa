-- Debug Calendar Query - Test apakah query bisa menemukan jadwal
-- Ganti dosen_id dengan ID dosen Anda

SELECT
  j.id,
  j.topik,
  j.tanggal_praktikum,
  j.hari,
  j.jam_mulai,
  j.jam_selesai,
  j.is_active,
  j.status,
  j.dosen_id,
  k.nama_kelas,
  l.nama_lab
FROM jadwal_praktikum j
LEFT JOIN kelas k ON j.kelas_id = k.id
LEFT JOIN laboratorium l ON j.laboratorium_id = l.id
WHERE j.tanggal_praktikum >= '2026-01-26'
  AND j.tanggal_praktikum <= '2026-03-01'
  AND j.is_active = true
  AND j.dosen_id = '17c835f6-6121-4c37-b1ce-a9fe7b98f64a'
ORDER BY j.tanggal_praktikum ASC;

-- Kalau result 0, coba TANPA filter dosen_id:
SELECT
  j.id,
  j.topik,
  j.tanggal_praktikum,
  j.dosen_id,
  j.is_active,
  j.status
FROM jadwal_praktikum j
WHERE j.tanggal_praktikum >= '2026-01-26'
  AND j.tanggal_praktikum <= '2026-03-01'
  AND j.is_active = true
ORDER BY j.tanggal_praktikum ASC;

-- Dan cek juga APAPUNPA tanggal filter:
SELECT
  j.id,
  j.topik,
  j.tanggal_praktikum,
  j.dosen_id,
  j.is_active
FROM jadwal_praktikum j
WHERE j.dosen_id = '17c835f6-6121-4c37-b1ce-a9fe7b98f64a'
ORDER BY j.tanggal_praktikum DESC;
