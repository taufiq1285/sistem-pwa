-- Cek struktur tabel jadwal_praktikum
-- Jalankan ini dulu untuk melihat tipe data id

-- Cek semua kolom di jadwal_praktikum
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'jadwal_praktikum'
ORDER BY ordinal_position;

-- Cek apakah ada sequence
SELECT
  sequence_name
FROM information_schema.sequences
WHERE sequence_name LIKE '%jadwal%';

-- Cek constraints
SELECT
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'jadwal_praktikum';

-- Sample data untuk melihat format id
SELECT
  id,
  topik,
  created_at
FROM jadwal_praktikum
ORDER BY created_at DESC
LIMIT 3;
