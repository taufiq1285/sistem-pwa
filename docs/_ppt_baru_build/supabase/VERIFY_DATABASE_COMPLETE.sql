-- ============================================================================
-- COMPLETE DATABASE VERIFICATION SCRIPT
-- Untuk dicek langsung di Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- SECTION 1: CHECK ALL TABLES EXISTS
-- ============================================================================

SELECT
    '=== CHECKING TABLES ===' as check_type,
    table_name,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = t.table_name
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM (
    VALUES
        ('users'),
        ('mahasiswa'),
        ('dosen'),
        ('laboran'),
        ('admin'),
        ('mata_kuliah'),
        ('laboratorium'),
        ('kelas'),
        ('kelas_mahasiswa'),
        ('jadwal_praktikum'),
        ('kehadiran'),
        ('kuis'),
        ('soal_kuis'),
        ('attempt_kuis'),
        ('jawaban_mahasiswa'),
        ('nilai'),
        ('materi'),
        ('pengumuman'),
        ('inventaris'),
        ('peminjaman'),
        ('notifikasi'),
        ('offline_queue'),
        ('sync_status')
) AS t(table_name)
ORDER BY table_name;

-- ============================================================================
-- SECTION 2: CHECK ENUMS
-- ============================================================================

SELECT
    '=== CHECKING ENUMS ===' as check_type,
    t.enum_name,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM pg_type
            WHERE typname = t.enum_name
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM pg_type
            WHERE typname = t.enum_name
        ) THEN (
            SELECT array_agg(enumlabel ORDER BY enumsortorder)::text
            FROM pg_enum e
            JOIN pg_type t2 ON e.enumtypid = t2.oid
            WHERE t2.typname = t.enum_name
        )
        ELSE NULL
    END as enum_values
FROM (
    VALUES
        ('user_role'),
        ('gender_type'),
        ('day_of_week'),
        ('jenis_soal'),
        ('attempt_status'),
        ('sync_status_type'),
        ('status_peminjaman')
) AS t(enum_name)
ORDER BY enum_name;

-- ============================================================================
-- SECTION 3: CHECK USERS TABLE STRUCTURE
-- ============================================================================

SELECT
    '=== USERS TABLE STRUCTURE ===' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'users'
ORDER BY ordinal_position;

-- ============================================================================
-- SECTION 4: CHECK MAHASISWA TABLE STRUCTURE
-- ============================================================================

SELECT
    '=== MAHASISWA TABLE STRUCTURE ===' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'mahasiswa'
ORDER BY ordinal_position;

-- ============================================================================
-- SECTION 5: CHECK DOSEN TABLE STRUCTURE
-- ============================================================================

SELECT
    '=== DOSEN TABLE STRUCTURE ===' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'dosen'
ORDER BY ordinal_position;

-- ============================================================================
-- SECTION 6: CHECK MATA_KULIAH TABLE
-- ============================================================================

SELECT
    '=== MATA_KULIAH TABLE STRUCTURE ===' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'mata_kuliah'
ORDER BY ordinal_position;

-- ============================================================================
-- SECTION 7: CHECK KELAS TABLE
-- ============================================================================

SELECT
    '=== KELAS TABLE STRUCTURE ===' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'kelas'
ORDER BY ordinal_position;

-- ============================================================================
-- SECTION 8: CHECK KELAS_MAHASISWA TABLE
-- ============================================================================

SELECT
    '=== KELAS_MAHASISWA TABLE STRUCTURE ===' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'kelas_mahasiswa'
ORDER BY ordinal_position;

-- ============================================================================
-- SECTION 9: CHECK KUIS TABLE
-- ============================================================================

SELECT
    '=== KUIS TABLE STRUCTURE ===' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'kuis'
ORDER BY ordinal_position;

-- ============================================================================
-- SECTION 10: CHECK INVENTARIS TABLE
-- ============================================================================

SELECT
    '=== INVENTARIS TABLE STRUCTURE ===' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'inventaris'
ORDER BY ordinal_position;

-- ============================================================================
-- SECTION 11: CHECK FOREIGN KEYS
-- ============================================================================

SELECT
    '=== FOREIGN KEY CONSTRAINTS ===' as check_type,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule,
    rc.update_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ============================================================================
-- SECTION 12: CHECK INDEXES
-- ============================================================================

SELECT
    '=== INDEXES ===' as check_type,
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================================================
-- SECTION 13: CHECK RLS POLICIES
-- ============================================================================

SELECT
    '=== RLS POLICIES ===' as check_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- SECTION 14: CHECK RLS ENABLED
-- ============================================================================

SELECT
    '=== RLS STATUS ===' as check_type,
    tablename,
    CASE
        WHEN rowsecurity THEN '✅ ENABLED'
        ELSE '❌ DISABLED'
    END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- SECTION 15: CHECK FUNCTIONS
-- ============================================================================

SELECT
    '=== CUSTOM FUNCTIONS ===' as check_type,
    n.nspname as schema,
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.prokind = 'f'
ORDER BY p.proname;

-- ============================================================================
-- SECTION 16: CHECK TRIGGERS
-- ============================================================================

SELECT
    '=== TRIGGERS ===' as check_type,
    event_object_schema AS schema_name,
    event_object_table AS table_name,
    trigger_name,
    event_manipulation AS event,
    action_timing AS timing,
    action_statement AS action
FROM information_schema.triggers
WHERE event_object_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- SECTION 17: DATA COUNTS (VERIFY DATA EXISTS)
-- ============================================================================

SELECT
    '=== TABLE ROW COUNTS ===' as check_type,
    'users' as table_name,
    COUNT(*) as row_count
FROM users
UNION ALL
SELECT
    '=== TABLE ROW COUNTS ===' as check_type,
    'mahasiswa',
    COUNT(*)
FROM mahasiswa
UNION ALL
SELECT
    '=== TABLE ROW COUNTS ===' as check_type,
    'dosen',
    COUNT(*)
FROM dosen
UNION ALL
SELECT
    '=== TABLE ROW COUNTS ===' as check_type,
    'laboran',
    COUNT(*)
FROM laboran
UNION ALL
SELECT
    '=== TABLE ROW COUNTS ===' as check_type,
    'admin',
    COUNT(*)
FROM admin
UNION ALL
SELECT
    '=== TABLE ROW COUNTS ===' as check_type,
    'mata_kuliah',
    COUNT(*)
FROM mata_kuliah
UNION ALL
SELECT
    '=== TABLE ROW COUNTS ===' as check_type,
    'kelas',
    COUNT(*)
FROM kelas
UNION ALL
SELECT
    '=== TABLE ROW COUNTS ===' as check_type,
    'kelas_mahasiswa',
    COUNT(*)
FROM kelas_mahasiswa
UNION ALL
SELECT
    '=== TABLE ROW COUNTS ===' as check_type,
    'jadwal_praktikum',
    COUNT(*)
FROM jadwal_praktikum
UNION ALL
SELECT
    '=== TABLE ROW COUNTS ===' as check_type,
    'kuis',
    COUNT(*)
FROM kuis
UNION ALL
SELECT
    '=== TABLE ROW COUNTS ===' as check_type,
    'inventaris',
    COUNT(*)
FROM inventaris;

-- ============================================================================
-- SECTION 18: CHECK CRITICAL MISSING COLUMNS
-- ============================================================================

-- Check if kelas_mahasiswa has is_active column
SELECT
    '=== CRITICAL COLUMNS CHECK ===' as check_type,
    'kelas_mahasiswa.is_active' as column_check,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'kelas_mahasiswa'
            AND column_name = 'is_active'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING - NEED TO ADD!'
    END as status;

-- Check if kelas_mahasiswa has enrolled_at column
SELECT
    '=== CRITICAL COLUMNS CHECK ===' as check_type,
    'kelas_mahasiswa.enrolled_at' as column_check,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'kelas_mahasiswa'
            AND column_name = 'enrolled_at'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING - NEED TO ADD!'
    END as status;

-- Check if dosen has nidn column
SELECT
    '=== CRITICAL COLUMNS CHECK ===' as check_type,
    'dosen.nidn' as column_check,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'dosen'
            AND column_name = 'nidn'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING - NEED TO ADD!'
    END as status;

-- Check if dosen has nuptk column
SELECT
    '=== CRITICAL COLUMNS CHECK ===' as check_type,
    'dosen.nuptk' as column_check,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'dosen'
            AND column_name = 'nuptk'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING - NEED TO ADD!'
    END as status;

-- ============================================================================
-- SECTION 19: CHECK STORAGE BUCKETS
-- ============================================================================

SELECT
    '=== STORAGE BUCKETS ===' as check_type,
    name as bucket_name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets
ORDER BY name;

-- ============================================================================
-- SECTION 20: CHECK AUTH USERS (SAMPLE)
-- ============================================================================

SELECT
    '=== AUTH USERS SAMPLE ===' as check_type,
    COUNT(*) as total_auth_users,
    COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_users,
    COUNT(CASE WHEN deleted_at IS NOT NULL THEN 1 END) as deleted_users
FROM auth.users;

-- ============================================================================
-- SECTION 21: VERIFY ROLE DISTRIBUTION
-- ============================================================================

SELECT
    '=== USER ROLE DISTRIBUTION ===' as check_type,
    role,
    COUNT(*) as count
FROM users
WHERE is_active = true
GROUP BY role
ORDER BY role;

-- ============================================================================
-- SECTION 22: CHECK ORPHANED RECORDS
-- ============================================================================

-- Check mahasiswa without users
SELECT
    '=== ORPHANED RECORDS CHECK ===' as check_type,
    'mahasiswa_without_users' as orphan_type,
    COUNT(*) as count
FROM mahasiswa m
LEFT JOIN users u ON m.user_id = u.id
WHERE u.id IS NULL;

-- Check dosen without users
SELECT
    '=== ORPHANED RECORDS CHECK ===' as check_type,
    'dosen_without_users' as orphan_type,
    COUNT(*) as count
FROM dosen d
LEFT JOIN users u ON d.user_id = u.id
WHERE u.id IS NULL;

-- Check kelas without mata_kuliah
SELECT
    '=== ORPHANED RECORDS CHECK ===' as check_type,
    'kelas_without_mata_kuliah' as orphan_type,
    COUNT(*) as count
FROM kelas k
LEFT JOIN mata_kuliah mk ON k.mata_kuliah_id = mk.id
WHERE mk.id IS NULL;

-- Check kelas_mahasiswa without mahasiswa
SELECT
    '=== ORPHANED RECORDS CHECK ===' as check_type,
    'enrollment_without_mahasiswa' as orphan_type,
    COUNT(*) as count
FROM kelas_mahasiswa km
LEFT JOIN mahasiswa m ON km.mahasiswa_id = m.id
WHERE m.id IS NULL;

-- ============================================================================
-- SECTION 23: SUMMARY REPORT
-- ============================================================================

SELECT
    '=== DATABASE SUMMARY ===' as section,
    'Tables' as metric,
    COUNT(DISTINCT table_name)::text as value
FROM information_schema.tables
WHERE table_schema = 'public'
UNION ALL
SELECT
    '=== DATABASE SUMMARY ===',
    'Indexes',
    COUNT(*)::text
FROM pg_indexes
WHERE schemaname = 'public'
UNION ALL
SELECT
    '=== DATABASE SUMMARY ===',
    'Foreign Keys',
    COUNT(*)::text
FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY'
AND table_schema = 'public'
UNION ALL
SELECT
    '=== DATABASE SUMMARY ===',
    'RLS Policies',
    COUNT(*)::text
FROM pg_policies
WHERE schemaname = 'public'
UNION ALL
SELECT
    '=== DATABASE SUMMARY ===',
    'Custom Functions',
    COUNT(*)::text
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.prokind = 'f'
UNION ALL
SELECT
    '=== DATABASE SUMMARY ===',
    'Triggers',
    COUNT(*)::text
FROM information_schema.triggers
WHERE event_object_schema = 'public';

-- ============================================================================
-- END OF VERIFICATION SCRIPT
-- ============================================================================

-- INSTRUCTIONS:
-- 1. Copy this entire script
-- 2. Go to Supabase Dashboard > SQL Editor
-- 3. Paste and run the script
-- 4. Review all sections to check database health
-- 5. Look for any ❌ MISSING items
-- 6. Check row counts to verify data exists
-- 7. Check for orphaned records (should be 0)
