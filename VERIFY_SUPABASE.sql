-- ============================================================================
-- SUPABASE DATABASE VERIFICATION SCRIPT
-- Run this in Supabase SQL Editor to verify database schema
-- ============================================================================

-- 1. CHECK JAWABAN TABLE STRUCTURE
SELECT 
    '=== JAWABAN TABLE STRUCTURE ===' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'jawaban'
ORDER BY ordinal_position;

-- 2. CHECK FOR _VERSION COLUMNS (Optimistic Locking)
SELECT 
    '=== CHECKING FOR _VERSION COLUMNS ===' as info;

SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE column_name = '_version'
AND table_schema = 'public';
-- Expected: 0 rows (not implemented)

-- 3. CHECK ATTEMPT_KUIS TABLE STRUCTURE
SELECT 
    '=== ATTEMPT_KUIS TABLE STRUCTURE ===' as info;

SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'attempt_kuis'
ORDER BY ordinal_position;

-- 4. LIST ALL RPC FUNCTIONS (Should be only 6)
SELECT 
    '=== ALL RPC FUNCTIONS ===' as info;

SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION'
ORDER BY routine_name;
-- Expected: 6 functions

-- 5. CHECK FOR MISSING RPC FUNCTIONS
SELECT 
    '=== CHECKING FOR EXPECTED RPC FUNCTIONS ===' as info;

SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '❌ TIDAK ADA - Function tidak ditemukan'
        ELSE '✅ ADA - Function ditemukan'
    END as status,
    'safe_update_with_version' as function_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'safe_update_with_version'

UNION ALL

SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '❌ TIDAK ADA'
        ELSE '✅ ADA'
    END,
    'log_conflict'
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'log_conflict'

UNION ALL

SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '❌ TIDAK ADA'
        ELSE '✅ ADA'
    END,
    'check_version_conflict'
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'check_version_conflict'

UNION ALL

SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '❌ TIDAK ADA'
        ELSE '✅ ADA'
    END,
    'increment_bank_soal_usage'
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'increment_bank_soal_usage';

-- 6. CHECK JAWABAN TABLE CONSTRAINTS
SELECT 
    '=== JAWABAN TABLE CONSTRAINTS ===' as info;

SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'jawaban'
ORDER BY tc.constraint_type, tc.constraint_name;

-- 7. SAMPLE JAWABAN DATA (if exists)
SELECT 
    '=== SAMPLE JAWABAN DATA (Last 3 records) ===' as info;

SELECT 
    id,
    attempt_id,
    soal_id,
    LEFT(jawaban_mahasiswa, 50) as jawaban_preview,
    is_auto_saved,
    is_correct,
    poin_diperoleh,
    created_at
FROM jawaban
ORDER BY created_at DESC
LIMIT 3;

-- 8. COUNT TOTAL RECORDS
SELECT 
    '=== RECORD COUNTS ===' as info;

SELECT 
    'jawaban' as table_name,
    COUNT(*) as total_records
FROM jawaban

UNION ALL

SELECT 
    'attempt_kuis',
    COUNT(*)
FROM attempt_kuis

UNION ALL

SELECT 
    'soal',
    COUNT(*)
FROM soal;

-- ============================================================================
-- VERIFICATION SUMMARY
-- ============================================================================

SELECT 
    '=== VERIFICATION SUMMARY ===' as info;

SELECT 
    '✅ Database schema is valid' as result,
    'jawaban table has correct structure' as detail
WHERE EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jawaban'
    AND column_name = 'jawaban_mahasiswa'
)

UNION ALL

SELECT 
    '⚠️ Optimistic locking NOT implemented',
    '_version columns do not exist'
WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE column_name = '_version'
    AND table_schema = 'public'
)

UNION ALL

SELECT 
    '⚠️ RPC functions NOT implemented',
    'safe_update_with_version, log_conflict, check_version_conflict'
WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_schema = 'public'
    AND routine_name IN ('safe_update_with_version', 'log_conflict', 'check_version_conflict')
);

-- ============================================================================
-- END OF VERIFICATION
-- ============================================================================
