-- ============================================================================
-- VERIFICATION QUERIES FOR WEEK 3 RLS DEPLOYMENT
-- ============================================================================
-- Run these queries in Supabase SQL Editor or via psql
-- ============================================================================

-- 1. CHECK RLS IS ENABLED ON ALL TABLES
-- ============================================================================
SELECT
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Expected: 15 tables with rls_enabled = true
-- users, kuis, attempt_kuis, nilai, kelas, kelas_mahasiswa, peminjaman,
-- inventaris, laboratorium, mata_kuliah, jadwal_praktikum, materi,
-- mahasiswa, dosen, laboran

-- ============================================================================
-- 2. COUNT POLICIES PER TABLE
-- ============================================================================
SELECT
    tablename,
    COUNT(*) AS policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY policy_count DESC, tablename;

-- Expected: 80+ policies total
-- Critical tables should have 4-8 policies each

-- ============================================================================
-- 3. VERIFY HELPER FUNCTIONS EXIST
-- ============================================================================
SELECT
    proname AS function_name,
    pg_get_function_arguments(oid) AS arguments
FROM pg_proc
WHERE proname IN (
    'is_admin',
    'is_dosen',
    'is_mahasiswa',
    'is_laboran',
    'get_current_dosen_id',
    'get_current_mahasiswa_id',
    'get_current_laboran_id',
    'get_mahasiswa_kelas_ids',
    'dosen_teaches_mahasiswa',
    'dosen_teaches_kelas',
    'is_kelas_active',
    'is_kuis_published',
    'user_belongs_to_role'
)
ORDER BY proname;

-- Expected: 13 functions

-- ============================================================================
-- 4. CHECK ATTEMPT_STATUS ENUM VALUES
-- ============================================================================
SELECT
    enumlabel AS enum_value,
    enumsortorder AS sort_order
FROM pg_enum
WHERE enumtypid = 'attempt_status'::regtype
ORDER BY enumsortorder;

-- Expected values (in order):
-- pending, in_progress, completed, graded, abandoned

-- ============================================================================
-- 5. CHECK BORROWING_STATUS ENUM VALUES
-- ============================================================================
SELECT
    enumlabel AS enum_value,
    enumsortorder AS sort_order
FROM pg_enum
WHERE enumtypid = 'borrowing_status'::regtype
ORDER BY enumsortorder;

-- Expected values (in order):
-- pending, approved, rejected, returned, overdue

-- ============================================================================
-- 6. VERIFY AUDIT LOG TABLES EXIST
-- ============================================================================
SELECT
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('audit_log', 'sensitive_operations', 'failed_access_attempts')
ORDER BY table_name;

-- Expected: 3 tables

-- ============================================================================
-- 7. CHECK MIGRATION STATUS
-- ============================================================================
-- Run in Supabase dashboard or with supabase CLI
-- supabase migration list

-- Expected migrations applied:
-- 20_rls_helper_functions.sql
-- 21_fix_attempt_status_enum.sql
-- 21_drop_all_policies.sql
-- 21_enhanced_rls_policies.sql
-- 22_audit_logging_system.sql

-- ============================================================================
-- 8. QUICK RLS TEST - Run as Different Users
-- ============================================================================

-- Test 1: As Admin (should see all)
-- Login as admin user first, then run:
SELECT COUNT(*) AS total_kuis FROM kuis;
SELECT COUNT(*) AS total_nilai FROM nilai;

-- Test 2: As Dosen (should see own kuis only)
-- Login as dosen user first, then run:
SELECT COUNT(*) AS my_kuis FROM kuis;
-- Should only see kuis created by this dosen

-- Test 3: As Mahasiswa (should see own nilai only)
-- Login as mahasiswa user first, then run:
SELECT COUNT(*) AS my_nilai FROM nilai;
-- Should only see own grades

-- Test 4: As Laboran (should see all peminjaman)
-- Login as laboran user first, then run:
SELECT COUNT(*) AS all_peminjaman FROM peminjaman;
-- Should see all borrowing requests

-- ============================================================================
-- 9. PERFORMANCE CHECK - Explain Analyze
-- ============================================================================

-- Check query performance with RLS
EXPLAIN ANALYZE
SELECT * FROM kuis
WHERE status = 'published'
LIMIT 10;

-- Should use indexes and complete in < 100ms

-- ============================================================================
-- 10. AUDIT LOG VERIFICATION
-- ============================================================================

-- Check if audit logs are being created
SELECT COUNT(*) AS total_audit_logs FROM audit_log;
SELECT COUNT(*) AS sensitive_ops FROM sensitive_operations;
SELECT COUNT(*) AS failed_attempts FROM failed_access_attempts;

-- If counts are 0, audit triggers may not be active yet
-- If counts > 0, audit logging is working

-- ============================================================================
-- SUMMARY QUERY - RUN THIS FOR QUICK OVERVIEW
-- ============================================================================

SELECT
    'RLS Tables' AS metric,
    COUNT(*)::TEXT AS value
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true

UNION ALL

SELECT
    'Total Policies' AS metric,
    COUNT(*)::TEXT AS value
FROM pg_policies
WHERE schemaname = 'public'

UNION ALL

SELECT
    'Helper Functions' AS metric,
    COUNT(*)::TEXT AS value
FROM pg_proc
WHERE proname LIKE 'is_%' OR proname LIKE 'get_current_%' OR proname LIKE 'dosen_teaches_%'

UNION ALL

SELECT
    'Audit Tables' AS metric,
    COUNT(*)::TEXT AS value
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('audit_log', 'sensitive_operations', 'failed_access_attempts')

ORDER BY metric;

-- Expected results:
-- Audit Tables: 3
-- Helper Functions: 13
-- RLS Tables: 15
-- Total Policies: 80+

-- ============================================================================
-- END OF VERIFICATION QUERIES
-- ============================================================================
