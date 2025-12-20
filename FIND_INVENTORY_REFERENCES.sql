-- ============================================================================
-- FIND REFERENCES TO 'inventory' TABLE
-- ============================================================================
-- This will find all functions/triggers that incorrectly reference 'inventory'
-- instead of 'inventaris'
-- ============================================================================

-- 1. Find all functions that contain 'inventory' in their code
SELECT
    proname as function_name,
    pg_get_function_identity_arguments(oid) as arguments,
    prosrc as function_body
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND (
    prosrc LIKE '%inventory%'
    OR prosrc LIKE '%INVENTORY%'
)
ORDER BY proname;

-- 2. Find all triggers
SELECT
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger
WHERE NOT tgisinternal
ORDER BY tgname;

-- 3. Check if 'inventory' table exists (it shouldn't)
SELECT
    table_name,
    table_schema
FROM information_schema.tables
WHERE table_name LIKE '%inventory%'
OR table_name LIKE '%inventaris%'
ORDER BY table_name;

-- 4. Find all foreign key constraints that might reference wrong table
SELECT
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND (
    tc.table_name LIKE '%inventor%'
    OR ccu.table_name LIKE '%inventor%'
);
