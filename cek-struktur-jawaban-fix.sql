-- ============================================================================
-- CEK STRUKTUR TABEL jawaban
-- ============================================================================

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'jawaban'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Lihat semua data di tabel jawaban
SELECT *
FROM jawaban
LIMIT 5;
