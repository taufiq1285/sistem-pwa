-- ============================================================================
-- VERIFICATION QUERIES - JADWAL APPROVAL WORKFLOW
-- Copy-paste query di bawah satu per satu ke Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- QUERY 1: Check Default Value (harusnya 'false')
-- ============================================================================
SELECT
    column_name,
    column_default,
    data_type
FROM information_schema.columns
WHERE table_name = 'jadwal_praktikum'
  AND column_name = 'is_active';

-- Expected Result:
-- column_name | column_default | data_type
-- is_active   | false          | boolean


-- ============================================================================
-- QUERY 2: Check Index Created (harusnya ada idx_jadwal_pending)
-- ============================================================================
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'jadwal_praktikum'
  AND indexname = 'idx_jadwal_pending';

-- Expected Result: 1 row
-- indexname           | indexdef
-- idx_jadwal_pending  | CREATE INDEX idx_jadwal_pending ON public.jadwal_praktikum...


-- ============================================================================
-- QUERY 3: Check Existing Data Aman (semua existing tetap true)
-- ============================================================================
SELECT
    is_active,
    COUNT(*) as jumlah
FROM jadwal_praktikum
GROUP BY is_active
ORDER BY is_active;

-- Expected Result (jika ada data existing):
-- is_active | jumlah
-- true      | X      (semua existing jadwal tetap active)
--
-- Atau jika belum ada data:
-- (no rows) - OK!


-- ============================================================================
-- QUERY 4: Check All RLS Policies (harusnya 12 policies)
-- ============================================================================
SELECT
    policyname,
    cmd as operation,
    CASE
        WHEN cmd = 'SELECT' THEN '✅ Read'
        WHEN cmd = 'INSERT' THEN '➕ Create'
        WHEN cmd = 'UPDATE' THEN '✏️ Update'
        WHEN cmd = 'DELETE' THEN '🗑️ Delete'
    END as action
FROM pg_policies
WHERE tablename = 'jadwal_praktikum'
ORDER BY cmd, policyname;

-- Expected Result: 12 rows
-- 2 DELETE, 3 INSERT, 4 SELECT, 3 UPDATE


-- ============================================================================
-- QUERY 5: Summary Status
-- ============================================================================
SELECT
    'Default is_active' as component,
    (SELECT column_default FROM information_schema.columns
     WHERE table_name = 'jadwal_praktikum' AND column_name = 'is_active') as status,
    CASE
        WHEN (SELECT column_default FROM information_schema.columns
              WHERE table_name = 'jadwal_praktikum' AND column_name = 'is_active') = 'false'
        THEN '✅ SUCCESS'
        ELSE '❌ FAILED'
    END as result
UNION ALL
SELECT
    'Index Pending' as component,
    (SELECT COUNT(*)::text FROM pg_indexes
     WHERE tablename = 'jadwal_praktikum' AND indexname = 'idx_jadwal_pending') as status,
    CASE
        WHEN (SELECT COUNT(*) FROM pg_indexes
              WHERE tablename = 'jadwal_praktikum' AND indexname = 'idx_jadwal_pending') > 0
        THEN '✅ SUCCESS'
        ELSE '❌ FAILED'
    END as result
UNION ALL
SELECT
    'RLS Policies' as component,
    (SELECT COUNT(*)::text FROM pg_policies WHERE tablename = 'jadwal_praktikum') as status,
    CASE
        WHEN (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'jadwal_praktikum') = 12
        THEN '✅ SUCCESS'
        ELSE '⚠️ CHECK'
    END as result;

-- Expected Result:
-- component        | status | result
-- Default is_active| false  | ✅ SUCCESS
-- Index Pending    | 1      | ✅ SUCCESS
-- RLS Policies     | 12     | ✅ SUCCESS
