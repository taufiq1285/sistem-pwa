-- ============================================================================
-- CHECK CURRENT DATABASE STATUS
-- Run these queries in Supabase SQL Editor to verify current schema
-- ============================================================================

-- ============================================================================
-- 1. CHECK IF mata_kuliah_id EXISTS IN kuis TABLE
-- ============================================================================

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'kuis'
ORDER BY ordinal_position;

-- Expected columns:
-- id, kelas_id, dosen_id, mata_kuliah_id (NEW), judul, deskripsi, etc.

-- ============================================================================
-- 2. CHECK CURRENT RLS POLICIES ON kuis TABLE
-- ============================================================================

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'kuis'
ORDER BY policyname;

-- Look for: "kuis_select_dosen" policy

-- ============================================================================
-- 3. CHECK CURRENT RLS POLICIES ON attempt_kuis TABLE
-- ============================================================================

SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'attempt_kuis'
AND policyname LIKE '%dosen%'
ORDER BY policyname;

-- Look for: "attempt_kuis_select_dosen", "attempt_kuis_update_dosen"

-- ============================================================================
-- 4. CHECK IF HELPER FUNCTION EXISTS
-- ============================================================================

SELECT 
    routine_name,
    routine_type,
    data_type,
    type_udt_name
FROM information_schema.routines
WHERE routine_name LIKE '%dosen_teaches%'
OR routine_name LIKE '%mata_kuliah%'
ORDER BY routine_name;

-- Look for: dosen_teaches_mata_kuliah(UUID)

-- ============================================================================
-- 5. CHECK EXISTING TRIGGERS ON kuis TABLE
-- ============================================================================

SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'kuis'
ORDER BY trigger_name;

-- Look for: trigger_auto_set_kuis_mata_kuliah

-- ============================================================================
-- 6. SAMPLE DATA CHECK: kuis with mata_kuliah relationship
-- ============================================================================

SELECT 
    k.id,
    k.judul,
    k.kelas_id,
    k.dosen_id,
    k.mata_kuliah_id,  -- Check if this exists
    kl.nama_kelas,
    kl.mata_kuliah_id AS kelas_mk_id,
    mk.kode_mk,
    mk.nama_mk
FROM kuis k
LEFT JOIN kelas kl ON k.kelas_id = kl.id
LEFT JOIN mata_kuliah mk ON kl.mata_kuliah_id = mk.id
LIMIT 5;

-- Check if mata_kuliah_id column exists and has values

-- ============================================================================
-- 7. CHECK VIEWS
-- ============================================================================

SELECT 
    table_name,
    view_definition
FROM information_schema.views
WHERE table_schema = 'public'
AND table_name LIKE '%dosen%grading%'
OR table_name LIKE '%kuis%'
ORDER BY table_name;

-- Look for: v_dosen_grading_access

-- ============================================================================
-- 8. COUNT EXISTING DATA
-- ============================================================================

SELECT 
    'Total Kuis' AS metric,
    COUNT(*) AS count
FROM kuis
UNION ALL
SELECT 
    'Kuis Published' AS metric,
    COUNT(*) AS count
FROM kuis
WHERE status = 'published'
UNION ALL
SELECT 
    'Total Attempts' AS metric,
    COUNT(*) AS count
FROM attempt_kuis
UNION ALL
SELECT 
    'Total Mata Kuliah' AS metric,
    COUNT(*) AS count
FROM mata_kuliah
UNION ALL
SELECT 
    'Total Kelas' AS metric,
    COUNT(*) AS count
FROM kelas;

-- ============================================================================
-- 9. CHECK FOR MULTI-DOSEN SCENARIO (Same MK, Different Dosen)
-- ============================================================================

SELECT 
    mk.kode_mk,
    mk.nama_mk,
    COUNT(DISTINCT k.dosen_id) AS jumlah_dosen,
    COUNT(k.id) AS jumlah_kelas,
    STRING_AGG(DISTINCT u.full_name, ', ') AS nama_dosen
FROM mata_kuliah mk
INNER JOIN kelas k ON mk.id = k.mata_kuliah_id
INNER JOIN dosen d ON k.dosen_id = d.id
INNER JOIN users u ON d.user_id = u.id
WHERE k.is_active = TRUE
GROUP BY mk.id, mk.kode_mk, mk.nama_mk
HAVING COUNT(DISTINCT k.dosen_id) > 1
ORDER BY jumlah_dosen DESC;

-- This shows which mata kuliah have multiple dosen teaching (co-teaching scenario)

-- ============================================================================
-- 10. CHECK CURRENT kuis_select_dosen POLICY DEFINITION
-- ============================================================================

SELECT 
    pg_get_expr(polqual, polrelid) AS policy_using_clause
FROM pg_policy
WHERE polname = 'kuis_select_dosen'
AND polrelid = 'kuis'::regclass;

-- This shows the exact SQL condition in the policy

-- ============================================================================
-- QUICK SUMMARY QUERY
-- ============================================================================

SELECT 
    'mata_kuliah_id exists in kuis' AS check_item,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'kuis' AND column_name = 'mata_kuliah_id'
        ) THEN '✅ YES' 
        ELSE '❌ NO - Need Migration' 
    END AS status
UNION ALL
SELECT 
    'dosen_teaches_mata_kuliah function exists' AS check_item,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'dosen_teaches_mata_kuliah'
        ) THEN '✅ YES' 
        ELSE '❌ NO - Need Migration' 
    END AS status
UNION ALL
SELECT 
    'trigger_auto_set_kuis_mata_kuliah exists' AS check_item,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.triggers 
            WHERE trigger_name = 'trigger_auto_set_kuis_mata_kuliah'
        ) THEN '✅ YES' 
        ELSE '❌ NO - Need Migration' 
    END AS status
UNION ALL
SELECT 
    'v_dosen_grading_access view exists' AS check_item,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.views 
            WHERE table_name = 'v_dosen_grading_access'
        ) THEN '✅ YES' 
        ELSE '❌ NO - Need Migration' 
    END AS status;

-- ============================================================================
-- END OF CHECKS
-- ============================================================================

/*
INTERPRETATION:

1. If mata_kuliah_id column does NOT exist:
   → Need to run migration 70_multi_dosen_grading_access.sql

2. If mata_kuliah_id exists but is NULL for most kuis:
   → Migration was partially run, need to populate data

3. If dosen_teaches_mata_kuliah function does NOT exist:
   → RLS policies cannot work properly, need full migration

4. If you see multiple dosen teaching same mata kuliah (query #9):
   → This is the scenario that benefits from multi-dosen grading

NEXT STEPS:
- Copy and paste relevant queries to Supabase SQL Editor
- Share the results
- I'll advise whether to proceed with migration
*/
