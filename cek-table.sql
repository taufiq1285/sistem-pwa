-- ============================================================================
-- CEK NAMA TABEL YANG ADA
-- ============================================================================

-- Lihat semua tabel di database
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Atau cek tabel yang mengandung 'kuis' atau 'soal'
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND (
    tablename LIKE '%kuis%'
    OR tablename LIKE '%soal%'
    OR tablename LIKE '%quiz%'
    OR tablename LIKE '%question%'
  )
ORDER BY tablename;
