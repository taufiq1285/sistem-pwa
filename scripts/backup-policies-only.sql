-- ============================================================================
-- BACKUP EXISTING RLS POLICIES - Week 3 Pre-Migration
-- ============================================================================
-- Purpose: Save current RLS policies before applying new enhanced policies
-- Date: 2025-11-29
-- Run this in Supabase SQL Editor and SAVE THE OUTPUT!
-- ============================================================================

-- ============================================================================
-- 1. CURRENT RLS STATUS
-- ============================================================================

SELECT
    '-- RLS STATUS BACKUP: ' || NOW()::TEXT AS backup_info;

SELECT
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- 2. EXISTING POLICIES DETAILS
-- ============================================================================

SELECT
    '-- POLICIES BACKUP: ' || NOW()::TEXT AS backup_info;

SELECT
    schemaname,
    tablename,
    policyname,
    cmd AS command,
    permissive,
    roles,
    pg_get_expr(qual, (schemaname||'.'||tablename)::regclass::oid) AS using_clause,
    pg_get_expr(with_check, (schemaname||'.'||tablename)::regclass::oid) AS with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- 3. POLICY COUNT BY TABLE
-- ============================================================================

SELECT
    '-- POLICY COUNT: ' || NOW()::TEXT AS backup_info;

SELECT
    tablename,
    COUNT(*) AS policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY policy_count DESC, tablename;

-- ============================================================================
-- 4. GENERATE RESTORE SCRIPT
-- ============================================================================

SELECT
    '-- RESTORE SCRIPT GENERATOR: ' || NOW()::TEXT AS backup_info;

-- This generates the SQL to recreate current policies
SELECT
    'CREATE POLICY "' || policyname || '" ON ' || tablename || E'\n' ||
    '    FOR ' || cmd || E'\n' ||
    '    USING (' || COALESCE(pg_get_expr(qual, (schemaname||'.'||tablename)::regclass::oid), 'true') || ')' ||
    CASE
        WHEN with_check IS NOT NULL
        THEN E'\n    WITH CHECK (' || pg_get_expr(with_check, (schemaname||'.'||tablename)::regclass::oid) || ')'
        ELSE ''
    END || ';' AS restore_sql
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- INSTRUCTIONS
-- ============================================================================

/*
HOW TO USE THIS BACKUP:

1. Run this script in Supabase SQL Editor
2. Copy ALL the results to a text file
3. Save as: backup_policies_YYYYMMDD_HHMMSS.txt
4. Keep this file safe!

TO RESTORE:
- If migration fails, run the generated CREATE POLICY statements
- Or restore full database from Supabase Dashboard backup

IMPORTANT:
- This backup is for RLS policies only
- For full database backup, use Supabase Dashboard or supabase db dump
- Always test migrations on staging/local first!
*/

-- ============================================================================
-- BACKUP COMPLETE
-- ============================================================================

SELECT
    '✅ Backup queries completed at: ' || NOW()::TEXT AS backup_complete,
    'Save all results above to a file!' AS reminder;
