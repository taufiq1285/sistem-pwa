-- ============================================================================
-- CHECK DAY_OF_WEEK ENUM VALUES
-- ============================================================================

-- Check enum values yang aktif
SELECT 
    '=== CURRENT DAY_OF_WEEK VALUES ===' as info,
    enumlabel as value,
    enumsortorder as sort_order
FROM pg_enum
WHERE enumtypid = 'day_of_week'::regtype
ORDER BY enumsortorder;

-- Expected values (salah satu):
-- Option 1 (English): monday, tuesday, wednesday, thursday, friday, saturday, sunday
-- Option 2 (Indonesian): senin, selasa, rabu, kamis, jumat, sabtu, minggu
