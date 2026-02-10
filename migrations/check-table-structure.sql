-- Cek struktur tabel dosen, kelas, dan laboratorium
-- Jalankan ini untuk mendapatkan nama kolom yang benar

-- 1. Cek struktur tabel dosen
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'dosen'
ORDER BY ordinal_position;

-- 2. Cek struktur tabel kelas
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'kelas'
ORDER BY ordinal_position;

-- 3. Cek struktur tabel laboratorium
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'laboratorium'
ORDER BY ordinal_position;

-- 4. Sample data untuk melihat struktur
-- Cek 1 row dari dosen
SELECT * FROM dosen LIMIT 1;

-- Cek 1 row dari kelas
SELECT * FROM kelas LIMIT 1;

-- Cek 1 row dari laboratorium
SELECT * FROM laboratorium LIMIT 1;
