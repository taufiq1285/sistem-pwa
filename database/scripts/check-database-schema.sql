-- ============================================================================
-- DATABASE SCHEMA VERIFICATION
-- Check jawaban table, RPC functions, and related tables
-- ============================================================================

-- 1. CHECK JAWABAN TABLE STRUCTURE
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'jawaban'
ORDER BY ordinal_position;

-- 2. CHECK IF _VERSION COLUMNS EXIST
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE column_name = '_version'
AND table_schema = 'public';

-- 3. CHECK ATTEMPT_KUIS TABLE STRUCTURE
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'attempt_kuis'
ORDER BY ordinal_position;

-- 4. LIST ALL RPC FUNCTIONS (STORED PROCEDURES)
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- 5. CHECK SPECIFIC RPC FUNCTIONS THAT CODE EXPECTS
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'safe_update_with_version',
    'log_conflict',
    'check_version_conflict',
    'increment_bank_soal_usage'
);

-- 6. CHECK JAWABAN TABLE CONSTRAINTS
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'jawaban';

-- 7. CHECK RECENT JAWABAN RECORDS (SAMPLE DATA)
SELECT 
    id,
    attempt_id,
    soal_id,
    jawaban_mahasiswa,
    poin_diperoleh,
    is_correct,
    is_auto_saved,
    created_at,
    updated_at
FROM jawaban
ORDER BY created_at DESC
LIMIT 5;

-- 8. CHECK IF GRADED_AT, GRADED_BY COLUMNS EXIST
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'jawaban'
AND column_name IN ('graded_at', 'graded_by', 'is_auto_saved');
