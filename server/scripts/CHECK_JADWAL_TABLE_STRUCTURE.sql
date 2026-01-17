-- ============================================================================
-- CHECK JADWAL_PRAKTIKUM TABLE STRUCTURE
-- ============================================================================

-- 1. Check table columns
SELECT 
    '=== TABLE COLUMNS ===' as info,
    column_name,
    data_type,
    udt_name,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'jadwal_praktikum'
ORDER BY ordinal_position;

-- 2. Check day_of_week enum values
SELECT 
    '=== DAY_OF_WEEK ENUM VALUES ===' as info,
    enumlabel as value,
    enumsortorder as sort_order
FROM pg_enum
WHERE enumtypid = 'day_of_week'::regtype
ORDER BY enumsortorder;

-- 3. Check sample data in jadwal_praktikum
SELECT 
    '=== SAMPLE JADWAL DATA ===' as info,
    id,
    kelas_id,
    laboratorium_id,
    hari,
    jam_mulai,
    jam_selesai,
    is_active
FROM jadwal_praktikum
LIMIT 5;

-- 4. Check distinct hari values
SELECT 
    '=== DISTINCT HARI VALUES ===' as info,
    hari,
    COUNT(*) as count
FROM jadwal_praktikum
GROUP BY hari
ORDER BY hari;
