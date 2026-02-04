-- ============================================================================
-- CEK STRUKTUR TABEL jawaban
-- ============================================================================

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'jawaban'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Cek data jawaban untuk attempt tsb
SELECT *
FROM jawaban
WHERE attempt_id = 'f1b4d30a-e753-4731-8e3d-0ffc85f75746'  -- Ganti dengan attempt_id dari screenshot
ORDER BY created_at;
