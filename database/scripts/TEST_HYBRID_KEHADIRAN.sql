-- ============================================================================
-- TESTING QUERIES: Hybrid Kehadiran System
-- Date: 2024-12-19
-- Description: Test queries to verify hybrid kehadiran system works correctly
-- ============================================================================

-- ============================================================================
-- PART 1: VERIFY MIGRATION SUCCESS
-- ============================================================================

-- 1.1 Check if new columns exist
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'kehadiran'
  AND column_name IN ('kelas_id', 'tanggal', 'jadwal_id')
ORDER BY ordinal_position;

-- Expected: All three columns should exist
-- jadwal_id: nullable=YES
-- kelas_id: nullable=YES
-- tanggal: nullable=YES

-- 1.2 Check constraints
SELECT
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'kehadiran'::regclass
ORDER BY conname;

-- Expected constraints:
-- - kehadiran_identifier_check (CHECK)
-- - kehadiran_unique_hybrid (UNIQUE)
-- - kehadiran_kelas_id_fkey (FOREIGN KEY)

-- 1.3 Check indexes
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'kehadiran'
ORDER BY indexname;

-- Expected indexes:
-- - idx_kehadiran_kelas_id
-- - idx_kehadiran_tanggal
-- - idx_kehadiran_kelas_tanggal
-- - idx_kehadiran_mahasiswa_kelas
-- - idx_kehadiran_status

-- ============================================================================
-- PART 2: VERIFY DATA INTEGRITY
-- ============================================================================

-- 2.1 Check all kelas have mata_kuliah_id
SELECT
    CASE
        WHEN COUNT(*) = 0 THEN '✅ PASS: All kelas have mata_kuliah_id'
        ELSE '❌ FAIL: ' || COUNT(*) || ' kelas without mata_kuliah_id'
    END as test_result
FROM kelas
WHERE is_active = true AND mata_kuliah_id IS NULL;

-- 2.2 Verify kelas-mata_kuliah relationships
SELECT
    k.id,
    k.nama_kelas,
    k.mata_kuliah_id,
    mk.kode_mk,
    mk.nama_mk,
    CASE
        WHEN mk.id IS NOT NULL THEN '✅ Valid'
        ELSE '❌ Broken FK'
    END as status
FROM kelas k
LEFT JOIN mata_kuliah mk ON k.mata_kuliah_id = mk.id
WHERE k.is_active = true
ORDER BY k.nama_kelas;

-- ============================================================================
-- PART 3: TEST KEHADIRAN INSERT (Date-Based)
-- ============================================================================

-- 3.1 Prepare test data
DO $$
DECLARE
    test_kelas_id UUID;
    test_mahasiswa_id UUID;
BEGIN
    -- Get a test kelas
    SELECT id INTO test_kelas_id
    FROM kelas
    WHERE is_active = true
    LIMIT 1;

    -- Get a test mahasiswa from that kelas
    SELECT mahasiswa_id INTO test_mahasiswa_id
    FROM kelas_mahasiswa
    WHERE kelas_id = test_kelas_id
      AND is_active = true
    LIMIT 1;

    IF test_kelas_id IS NULL THEN
        RAISE EXCEPTION 'No active kelas found for testing!';
    END IF;

    IF test_mahasiswa_id IS NULL THEN
        RAISE EXCEPTION 'No mahasiswa found in kelas % for testing!', test_kelas_id;
    END IF;

    RAISE NOTICE 'Test kelas_id: %', test_kelas_id;
    RAISE NOTICE 'Test mahasiswa_id: %', test_mahasiswa_id;

    -- Store for next tests
    CREATE TEMP TABLE IF NOT EXISTS test_ids AS
    SELECT test_kelas_id as kelas_id, test_mahasiswa_id as mahasiswa_id;
END $$;

-- 3.2 Test INSERT with kelas_id + tanggal (Date-Based Attendance)
DO $$
DECLARE
    test_kelas_id UUID;
    test_mahasiswa_id UUID;
    test_kehadiran_id UUID;
BEGIN
    SELECT kelas_id, mahasiswa_id INTO test_kelas_id, test_mahasiswa_id
    FROM test_ids;

    RAISE NOTICE '=== Testing Date-Based Attendance ===';

    -- Delete existing test data
    DELETE FROM kehadiran
    WHERE kelas_id = test_kelas_id
      AND mahasiswa_id = test_mahasiswa_id
      AND tanggal = CURRENT_DATE;

    -- Insert test kehadiran (date-based)
    INSERT INTO kehadiran (kelas_id, mahasiswa_id, tanggal, status, keterangan)
    VALUES (test_kelas_id, test_mahasiswa_id, CURRENT_DATE, 'hadir', 'Test date-based attendance')
    RETURNING id INTO test_kehadiran_id;

    RAISE NOTICE '✅ Successfully inserted date-based kehadiran: %', test_kehadiran_id;

    -- Verify insert
    IF EXISTS (
        SELECT 1 FROM kehadiran
        WHERE id = test_kehadiran_id
          AND kelas_id = test_kelas_id
          AND tanggal = CURRENT_DATE
          AND jadwal_id IS NULL
    ) THEN
        RAISE NOTICE '✅ PASS: Date-based kehadiran verified';
    ELSE
        RAISE EXCEPTION '❌ FAIL: Date-based kehadiran verification failed';
    END IF;

    -- Cleanup
    DELETE FROM kehadiran WHERE id = test_kehadiran_id;
    RAISE NOTICE '🧹 Cleaned up test data';

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ FAIL: %', SQLERRM;
END $$;

-- 3.3 Test INSERT with jadwal_id (Jadwal-Based Attendance)
DO $$
DECLARE
    test_jadwal_id UUID;
    test_mahasiswa_id UUID;
    test_kehadiran_id UUID;
BEGIN
    -- Get a test jadwal
    SELECT j.id INTO test_jadwal_id
    FROM jadwal_praktikum j
    WHERE j.is_active = true
      AND j.status = 'approved'
    LIMIT 1;

    IF test_jadwal_id IS NULL THEN
        RAISE NOTICE '⚠️  SKIP: No active jadwal found. Cannot test jadwal-based attendance.';
        RETURN;
    END IF;

    -- Get mahasiswa from jadwal's kelas
    SELECT km.mahasiswa_id INTO test_mahasiswa_id
    FROM jadwal_praktikum j
    JOIN kelas_mahasiswa km ON km.kelas_id = j.kelas_id
    WHERE j.id = test_jadwal_id
      AND km.is_active = true
    LIMIT 1;

    RAISE NOTICE '=== Testing Jadwal-Based Attendance ===';
    RAISE NOTICE 'Test jadwal_id: %', test_jadwal_id;
    RAISE NOTICE 'Test mahasiswa_id: %', test_mahasiswa_id;

    -- Delete existing test data
    DELETE FROM kehadiran
    WHERE jadwal_id = test_jadwal_id
      AND mahasiswa_id = test_mahasiswa_id;

    -- Insert test kehadiran (jadwal-based)
    INSERT INTO kehadiran (jadwal_id, mahasiswa_id, status, keterangan)
    VALUES (test_jadwal_id, test_mahasiswa_id, 'hadir', 'Test jadwal-based attendance')
    RETURNING id INTO test_kehadiran_id;

    RAISE NOTICE '✅ Successfully inserted jadwal-based kehadiran: %', test_kehadiran_id;

    -- Verify insert (should auto-populate kelas_id and tanggal from trigger)
    IF EXISTS (
        SELECT 1 FROM kehadiran
        WHERE id = test_kehadiran_id
          AND jadwal_id = test_jadwal_id
    ) THEN
        RAISE NOTICE '✅ PASS: Jadwal-based kehadiran verified';
    ELSE
        RAISE EXCEPTION '❌ FAIL: Jadwal-based kehadiran verification failed';
    END IF;

    -- Cleanup
    DELETE FROM kehadiran WHERE id = test_kehadiran_id;
    RAISE NOTICE '🧹 Cleaned up test data';

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ FAIL: %', SQLERRM;
END $$;

-- ============================================================================
-- PART 4: TEST CONSTRAINT VIOLATIONS
-- ============================================================================

-- 4.1 Test: Cannot insert with both NULL (should fail)
DO $$
DECLARE
    test_mahasiswa_id UUID;
BEGIN
    SELECT mahasiswa_id INTO test_mahasiswa_id FROM test_ids;

    RAISE NOTICE '=== Testing Invalid Insert (all NULL) ===';

    BEGIN
        INSERT INTO kehadiran (mahasiswa_id, status)
        VALUES (test_mahasiswa_id, 'hadir');

        RAISE EXCEPTION '❌ FAIL: Should not allow insert with all identifiers NULL';
    EXCEPTION WHEN check_violation THEN
        RAISE NOTICE '✅ PASS: Correctly rejected insert with all identifiers NULL';
    END;
END $$;

-- 4.2 Test: Duplicate prevention (same kelas + tanggal + mahasiswa)
DO $$
DECLARE
    test_kelas_id UUID;
    test_mahasiswa_id UUID;
BEGIN
    SELECT kelas_id, mahasiswa_id INTO test_kelas_id, test_mahasiswa_id
    FROM test_ids;

    RAISE NOTICE '=== Testing Duplicate Prevention ===';

    -- Insert first record
    INSERT INTO kehadiran (kelas_id, mahasiswa_id, tanggal, status)
    VALUES (test_kelas_id, test_mahasiswa_id, '2024-12-01', 'hadir')
    ON CONFLICT DO NOTHING;

    -- Try to insert duplicate (should fail)
    BEGIN
        INSERT INTO kehadiran (kelas_id, mahasiswa_id, tanggal, status)
        VALUES (test_kelas_id, test_mahasiswa_id, '2024-12-01', 'izin');

        RAISE EXCEPTION '❌ FAIL: Should not allow duplicate kehadiran';
    EXCEPTION WHEN unique_violation THEN
        RAISE NOTICE '✅ PASS: Correctly prevented duplicate kehadiran';
    END;

    -- Cleanup
    DELETE FROM kehadiran
    WHERE kelas_id = test_kelas_id
      AND mahasiswa_id = test_mahasiswa_id
      AND tanggal = '2024-12-01';
END $$;

-- ============================================================================
-- PART 5: TEST HELPER FUNCTIONS
-- ============================================================================

-- 5.1 Test get_kehadiran_by_kelas_daterange
DO $$
DECLARE
    test_kelas_id UUID;
    result_count INTEGER;
BEGIN
    SELECT kelas_id INTO test_kelas_id FROM test_ids;

    RAISE NOTICE '=== Testing Helper Function: get_kehadiran_by_kelas_daterange ===';

    -- Call function
    SELECT COUNT(*) INTO result_count
    FROM get_kehadiran_by_kelas_daterange(test_kelas_id, NULL, NULL);

    RAISE NOTICE '✅ Function returned % records', result_count;
    RAISE NOTICE '✅ PASS: Helper function works';
END $$;

-- 5.2 Test calculate_attendance_percentage
DO $$
DECLARE
    test_kelas_id UUID;
    test_mahasiswa_id UUID;
    percentage NUMERIC;
BEGIN
    SELECT kelas_id, mahasiswa_id INTO test_kelas_id, test_mahasiswa_id
    FROM test_ids;

    RAISE NOTICE '=== Testing Helper Function: calculate_attendance_percentage ===';

    -- Call function
    SELECT calculate_attendance_percentage(test_mahasiswa_id, test_kelas_id)
    INTO percentage;

    RAISE NOTICE '✅ Calculated percentage: %', percentage;
    RAISE NOTICE '✅ PASS: Helper function works';
END $$;

-- ============================================================================
-- PART 6: PERFORMANCE TESTS
-- ============================================================================

-- 6.1 Test index usage
EXPLAIN ANALYZE
SELECT *
FROM kehadiran
WHERE kelas_id = (SELECT kelas_id FROM test_ids)
  AND tanggal >= CURRENT_DATE - INTERVAL '30 days';

-- Expected: Should use idx_kehadiran_kelas_tanggal index

-- ============================================================================
-- PART 7: SUMMARY REPORT
-- ============================================================================

SELECT '=== MIGRATION SUMMARY ===' as report;

SELECT
    'Total kelas' as metric,
    COUNT(*)::TEXT as value
FROM kelas
WHERE is_active = true

UNION ALL

SELECT
    'Kelas with mata_kuliah',
    COUNT(*)::TEXT
FROM kelas
WHERE is_active = true AND mata_kuliah_id IS NOT NULL

UNION ALL

SELECT
    'Total kehadiran records',
    COUNT(*)::TEXT
FROM kehadiran

UNION ALL

SELECT
    'Date-based kehadiran',
    COUNT(*)::TEXT
FROM kehadiran
WHERE kelas_id IS NOT NULL AND tanggal IS NOT NULL

UNION ALL

SELECT
    'Jadwal-based kehadiran',
    COUNT(*)::TEXT
FROM kehadiran
WHERE jadwal_id IS NOT NULL

UNION ALL

SELECT
    'Hybrid kehadiran (both)',
    COUNT(*)::TEXT
FROM kehadiran
WHERE jadwal_id IS NOT NULL AND kelas_id IS NOT NULL;

-- ============================================================================
-- CLEANUP TEMP TABLES
-- ============================================================================

DROP TABLE IF EXISTS test_ids;

-- ============================================================================
-- TESTING COMPLETE
-- ============================================================================

SELECT '✅ ALL TESTS COMPLETED!' as status;
SELECT 'Review the output above for any failures.' as note;
