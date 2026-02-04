-- ============================================================================
-- CEK STRUKTUR TABEL attempt_kuis
-- ============================================================================

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'attempt_kuis'
  AND table_schema = 'public'
ORDER BY ordinal_position;
