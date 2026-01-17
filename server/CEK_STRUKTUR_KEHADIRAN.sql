-- ============================================================================
-- CEK STRUKTUR TABEL KEHADIRAN DI SUPABASE
-- Jalankan ini di Supabase SQL Editor untuk lihat struktur sebenarnya
-- ============================================================================

-- 1. CEK KOLOM APA SAJA YANG ADA DI TABEL KEHADIRAN
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'kehadiran'
ORDER BY ordinal_position;

-- 2. CEK CONSTRAINTS (PRIMARY KEY, FOREIGN KEY, UNIQUE, CHECK)
SELECT
    conname as constraint_name,
    contype as type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'kehadiran'::regclass
ORDER BY conname;

-- 3. CEK INDEXES
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'kehadiran'
ORDER BY indexname;

-- 4. CEK RLS POLICIES
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_expression,
    with_check as check_expression
FROM pg_policies
WHERE tablename = 'kehadiran'
ORDER BY policyname;

-- 5. CEK SAMPLE DATA (5 record terakhir)
SELECT *
FROM kehadiran
ORDER BY created_at DESC
LIMIT 5;

-- 6. CEK JUMLAH DATA
SELECT
    COUNT(*) as total_records,
    COUNT(DISTINCT mahasiswa_id) as unique_mahasiswa,
    COUNT(CASE WHEN status = 'hadir' THEN 1 END) as hadir,
    COUNT(CASE WHEN status = 'izin' THEN 1 END) as izin,
    COUNT(CASE WHEN status = 'sakit' THEN 1 END) as sakit,
    COUNT(CASE WHEN status = 'alpha' THEN 1 END) as alpha
FROM kehadiran;

-- 7. SUMMARY
SELECT
    '=== STRUKTUR TABEL KEHADIRAN ===' as info
UNION ALL
SELECT 'Kolom: ' || column_name || ' (' || data_type || ')' ||
       CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END
FROM information_schema.columns
WHERE table_name = 'kehadiran'
ORDER BY ordinal_position;
