-- Development Only: Hapus semua data jadwal praktikum
-- WARNING: Jangan jalankan di production!

-- 1. Hapus semua data jadwal praktikum
DELETE FROM jadwal_praktikum;

-- 2. Verifikasi data sudah terhapus
SELECT COUNT(*) as total_jadwal FROM jadwal_praktikum;

-- 3. Cek struktur tabel untuk memastikan
SELECT
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'jadwal_praktikum'
  AND column_name = 'id';
