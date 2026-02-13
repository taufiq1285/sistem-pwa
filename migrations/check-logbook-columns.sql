-- Cek struktur tabel logbook_entries
-- Jalankan di Supabase SQL Editor

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'logbook_entries'
ORDER BY ordinal_position;
