-- ============================================================================
-- DEBUG SCRIPT FOR KELAS UPDATE ERROR
-- ============================================================================
-- Purpose: To investigate the error 'record "new" has no field "nama"'
-- when updating the 'kelas' table.
--
-- How to use:
-- 1. Connect to your Supabase database.
-- 2. Run the queries in this file.
-- 3. Paste the output of all queries back to me.
-- ============================================================================

-- Query 1: List all triggers on the 'kelas' table
-- This will show us if there are any unexpected triggers.
SELECT
    trigger_name,
    event_manipulation AS event,
    event_object_table AS table_name,
    action_statement AS function_body
FROM
    information_schema.triggers
WHERE
    event_object_table = 'kelas'
ORDER BY
    trigger_name;

-- Query 2: List all policies on the 'kelas' table
-- This will show us the USING and WITH CHECK clauses for all policies.
SELECT
    policyname,
    permissive,
    cmd AS command,
    qual AS using_clause,
    with_check AS check_clause
FROM
    pg_policies
WHERE
    tablename = 'kelas';

-- Query 3: Get the source code of functions used in 'kelas' triggers
-- This will show the actual code of the trigger functions found in Query 1.
-- Replace 'function_name_from_query_1' with the function names you find.
SELECT
    p.proname AS function_name,
    p.prosrc AS function_source_code
FROM
    pg_proc p
JOIN
    information_schema.triggers t ON t.action_statement = p.proname
WHERE
    t.event_object_table = 'kelas';

-- Query 4: Detailed view of the 'kelas_update_admin' policy
-- This is to double-check the policy that should be allowing the update.
SELECT
    *
FROM
    pg_policies
WHERE
    tablename = 'kelas' AND policyname = 'kelas_update_admin';

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================
