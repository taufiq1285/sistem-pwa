-- ============================================================================
-- FIND MATA_KULIAH TRIGGERS AND FUNCTIONS
-- ============================================================================

-- 1. Find all triggers on mata_kuliah table
SELECT
    t.tgname as trigger_name,
    t.tgenabled as enabled,
    pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'mata_kuliah'
AND NOT t.tgisinternal
ORDER BY t.tgname;

-- 2. Find all functions that reference 'nama' field
SELECT
    proname as function_name,
    pg_get_function_identity_arguments(oid) as arguments,
    prosrc as function_body
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND prosrc LIKE '%NEW.nama%'
ORDER BY proname;

-- 3. Check mata_kuliah table columns
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'mata_kuliah'
AND table_schema = 'public'
ORDER BY ordinal_position;
