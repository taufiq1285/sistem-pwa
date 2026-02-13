-- Tambahkan kolom yang hilang di tabel logbook_entries
-- Jalankan di Supabase SQL Editor

-- 1. Cek kolom yang sudah ada
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'logbook_entries'
ORDER BY ordinal_position;

-- 2. Tambahkan kolom catatan_tambahan jika belum ada
ALTER TABLE logbook_entries 
ADD COLUMN IF NOT EXISTS catatan_tambahan TEXT;

-- 3. Verifikasi kolom berhasil ditambahkan
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'logbook_entries'
  AND column_name = 'catatan_tambahan';
