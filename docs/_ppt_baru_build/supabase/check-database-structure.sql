/**
 * Database Structure Check
 *
 * Run script ini di Supabase SQL Editor untuk cek struktur database
 * Sebelum apply Fase 3 migration
 */

-- ============================================================================
-- 1. LIST ALL TABLES
-- ============================================================================
SELECT
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- 2. CHECK CRITICAL TABLES EXISTENCE
-- ============================================================================
SELECT
  tablename,
  CASE
    WHEN tablename IN ('kuis', 'kuis_soal', 'kuis_jawaban', 'nilai', 'kehadiran', 'materi')
    THEN '✅ CRITICAL'
    ELSE '⚪ OPTIONAL'
  END as priority
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('kuis', 'kuis_soal', 'kuis_jawaban', 'nilai', 'kehadiran', 'materi', 'kelas', 'users', 'mahasiswa', 'dosen')
ORDER BY priority DESC, tablename;

-- ============================================================================
-- 3. CHECK COLUMNS FOR KUIS TABLE
-- ============================================================================
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable,
  character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'kuis'
ORDER BY ordinal_position;

-- ============================================================================
-- 4. CHECK IF _VERSION COLUMN ALREADY EXISTS
-- ============================================================================
SELECT
  table_name,
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND column_name = '_version'
ORDER BY table_name;

-- ============================================================================
-- 5. CHECK COLUMNS FOR KUIS_JAWABAN TABLE
-- ============================================================================
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable,
  character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'kuis_jawaban'
ORDER BY ordinal_position;

-- ============================================================================
-- 6. CHECK COLUMNS FOR NILAI TABLE
-- ============================================================================
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable,
  character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'nilai'
ORDER BY ordinal_position;

-- ============================================================================
-- 7. CHECK COLUMNS FOR KEHADIRAN TABLE (IF EXISTS)
-- ============================================================================
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'kehadiran'
ORDER BY ordinal_position;

-- ============================================================================
-- 8. CHECK COLUMNS FOR MATERI TABLE
-- ============================================================================
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'materi'
ORDER BY ordinal_position;

-- ============================================================================
-- 9. CHECK EXISTING TRIGGERS
-- ============================================================================
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table IN ('kuis', 'kuis_jawaban', 'nilai', 'kehadiran', 'materi')
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- 10. CHECK EXISTING FUNCTIONS (FOR VERSION INCREMENT)
-- ============================================================================
SELECT
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%version%'
ORDER BY routine_name;

-- ============================================================================
-- 11. CHECK PRIMARY KEYS
-- ============================================================================
SELECT
  tc.table_name,
  kcu.column_name,
  tc.constraint_type
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
AND tc.constraint_type = 'PRIMARY KEY'
AND tc.table_name IN ('kuis', 'kuis_jawaban', 'nilai', 'kehadiran', 'materi')
ORDER BY tc.table_name;

-- ============================================================================
-- 12. CHECK FOREIGN KEYS
-- ============================================================================
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name IN ('kuis', 'kuis_jawaban', 'nilai', 'kehadiran', 'materi')
ORDER BY tc.table_name, kcu.column_name;

-- ============================================================================
-- 13. CHECK IF SCHEMA_MIGRATIONS TABLE EXISTS
-- ============================================================================
SELECT EXISTS (
  SELECT FROM pg_tables
  WHERE schemaname = 'public'
  AND tablename = 'schema_migrations'
) as schema_migrations_exists;

-- ============================================================================
-- 14. CHECK EXISTING MIGRATIONS (IF TABLE EXISTS)
-- ============================================================================
SELECT * FROM public.schema_migrations
WHERE version LIKE '%fase%' OR version LIKE '%202412%'
ORDER BY version;

-- ============================================================================
-- 15. SAMPLE DATA CHECK - KUIS
-- ============================================================================
SELECT
  id,
  judul,
  created_at,
  updated_at,
  CASE WHEN EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'kuis' AND column_name = '_version'
  ) THEN 'Has _version column' ELSE 'No _version column' END as version_status
FROM kuis
LIMIT 3;

-- ============================================================================
-- 16. SUMMARY REPORT
-- ============================================================================
SELECT
  'TABLES' as category,
  COUNT(*) as count,
  string_agg(tablename, ', ') as items
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('kuis', 'kuis_jawaban', 'nilai', 'kehadiran', 'materi')

UNION ALL

SELECT
  '_VERSION COLUMNS' as category,
  COUNT(*) as count,
  string_agg(table_name, ', ') as items
FROM information_schema.columns
WHERE table_schema = 'public'
AND column_name = '_version'

UNION ALL

SELECT
  'VERSION TRIGGERS' as category,
  COUNT(*) as count,
  string_agg(trigger_name, ', ') as items
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name LIKE '%version%'

UNION ALL

SELECT
  'VERSION FUNCTIONS' as category,
  COUNT(*) as count,
  string_agg(routine_name, ', ') as items
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%version%';

-- ============================================================================
-- EXPECTED RESULTS GUIDE
-- ============================================================================

/*
WHAT TO LOOK FOR:

1. TABLES:
   ✅ kuis - should exist
   ✅ kuis_jawaban - should exist
   ✅ nilai - should exist
   ⚪ kehadiran - may or may not exist
   ✅ materi - should exist

2. _VERSION COLUMN:
   ❌ Should NOT exist yet (we will add it)
   If exists → Already migrated, skip Fase 3 SQL

3. COLUMNS TO CHECK:
   - id (UUID PRIMARY KEY)
   - created_at (TIMESTAMPTZ)
   - updated_at (TIMESTAMPTZ)

4. TRIGGERS:
   ❌ No version increment triggers yet
   If exists → Already migrated

5. PRIMARY KEYS:
   ✅ All tables should have 'id' as primary key

NEXT STEPS:
- If _version NOT exists → Safe to run Fase 3 migration
- If _version EXISTS → Skip migration or modify to UPDATE only
- If tables missing → Need to create them first
*/
