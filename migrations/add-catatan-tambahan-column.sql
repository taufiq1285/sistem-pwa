-- Tambahkan kolom catatan_tambahan ke logbook_entries
-- Jalankan di Supabase SQL Editor

-- Tambahkan kolom
ALTER TABLE logbook_entries 
ADD COLUMN IF NOT EXISTS catatan_tambahan TEXT;

-- Tambahkan komentar
COMMENT ON COLUMN logbook_entries.catatan_tambahan IS 'Additional notes from student (optional)';

-- Verifikasi
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'logbook_entries'
  AND column_name = 'catatan_tambahan';
