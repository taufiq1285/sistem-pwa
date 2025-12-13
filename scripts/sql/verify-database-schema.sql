-- ============================================================================
-- COMPREHENSIVE DATABASE SCHEMA VERIFICATION
-- Jalankan di Supabase SQL Editor untuk cek semua tabel
-- ============================================================================

-- ============================================================================
-- PART 1: CEK TABEL APA SAJA YANG ADA
-- ============================================================================

SELECT '========================================' AS separator;
SELECT 'PART 1: DAFTAR SEMUA TABEL' AS title;
SELECT '========================================' AS separator;

SELECT
    tablename,
    schemaname,
    tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- PART 2: QUICK CHECK - APAKAH TABEL UTAMA ADA?
-- ============================================================================

SELECT '========================================' AS separator;
SELECT 'PART 2: QUICK CHECK TABEL UTAMA' AS title;
SELECT '========================================' AS separator;

SELECT
    CASE WHEN EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN '✅' ELSE '❌' END AS users,
    CASE WHEN EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'mahasiswa') THEN '✅' ELSE '❌' END AS mahasiswa,
    CASE WHEN EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'dosen') THEN '✅' ELSE '❌' END AS dosen,
    CASE WHEN EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'laboran') THEN '✅' ELSE '❌' END AS laboran,
    CASE WHEN EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'program_studi') THEN '✅' ELSE '❌' END AS program_studi,
    CASE WHEN EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'mata_kuliah') THEN '✅' ELSE '❌' END AS mata_kuliah,
    CASE WHEN EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'kelas') THEN '✅' ELSE '❌' END AS kelas,
    CASE WHEN EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'jadwal') THEN '✅' ELSE '❌' END AS jadwal;

SELECT
    CASE WHEN EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'laboratorium') THEN '✅' ELSE '❌' END AS laboratorium,
    CASE WHEN EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'inventaris') THEN '✅' ELSE '❌' END AS inventaris,
    CASE WHEN EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'peminjaman') THEN '✅' ELSE '❌' END AS peminjaman,
    CASE WHEN EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'materi') THEN '✅' ELSE '❌' END AS materi,
    CASE WHEN EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'kuis') THEN '✅' ELSE '❌' END AS kuis,
    CASE WHEN EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'soal') THEN '✅' ELSE '❌' END AS soal,
    CASE WHEN EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'jawaban_mahasiswa') THEN '✅' ELSE '❌' END AS jawaban_mahasiswa,
    CASE WHEN EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'kehadiran') THEN '✅' ELSE '❌' END AS kehadiran,
    CASE WHEN EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pengumuman') THEN '✅' ELSE '❌' END AS pengumuman;

-- ============================================================================
-- PART 3: DETAIL STRUKTUR TABEL - USERS
-- ============================================================================

SELECT '========================================' AS separator;
SELECT 'PART 3: STRUKTUR TABEL USERS' AS title;
SELECT '========================================' AS separator;

SELECT
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;

-- ============================================================================
-- PART 4: DETAIL STRUKTUR TABEL - MAHASISWA
-- ============================================================================

SELECT '========================================' AS separator;
SELECT 'PART 4: STRUKTUR TABEL MAHASISWA' AS title;
SELECT '========================================' AS separator;

SELECT
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'mahasiswa'
ORDER BY ordinal_position;

-- ============================================================================
-- PART 5: DETAIL STRUKTUR TABEL - PENGUMUMAN
-- ============================================================================

SELECT '========================================' AS separator;
SELECT 'PART 5: STRUKTUR TABEL PENGUMUMAN' AS title;
SELECT '========================================' AS separator;

SELECT
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'pengumuman'
ORDER BY ordinal_position;

-- CEK KOLOM PENTING
SELECT
    CASE WHEN EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'pengumuman' AND column_name = 'konten'
    ) THEN '✅ konten' ELSE '❌ konten (should exist)' END AS check_konten,
    CASE WHEN EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'pengumuman' AND column_name = 'penulis_id'
    ) THEN '✅ penulis_id' ELSE '❌ penulis_id (should exist)' END AS check_penulis_id,
    CASE WHEN EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'pengumuman' AND column_name = 'is_pinned'
    ) THEN '✅ is_pinned' ELSE '❌ is_pinned (should exist)' END AS check_is_pinned,
    CASE WHEN EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'pengumuman' AND column_name = 'view_count'
    ) THEN '✅ view_count' ELSE '❌ view_count (should exist)' END AS check_view_count;

-- ============================================================================
-- PART 6: DETAIL STRUKTUR TABEL - KUIS
-- ============================================================================

SELECT '========================================' AS separator;
SELECT 'PART 6: STRUKTUR TABEL KUIS' AS title;
SELECT '========================================' AS separator;

SELECT
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'kuis'
ORDER BY ordinal_position;

-- ============================================================================
-- PART 7: DETAIL STRUKTUR TABEL - PEMINJAMAN
-- ============================================================================

SELECT '========================================' AS separator;
SELECT 'PART 7: STRUKTUR TABEL PEMINJAMAN' AS title;
SELECT '========================================' AS separator;

SELECT
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'peminjaman'
ORDER BY ordinal_position;

-- CEK KOLOM PENTING
SELECT
    CASE WHEN EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'peminjaman' AND column_name = 'tanggal_kembali_aktual'
    ) THEN '✅ tanggal_kembali_aktual' ELSE '❌ tanggal_kembali_aktual (should exist)' END AS check_tanggal_kembali;

-- ============================================================================
-- PART 8: CEK FOREIGN KEYS
-- ============================================================================

SELECT '========================================' AS separator;
SELECT 'PART 8: FOREIGN KEYS' AS title;
SELECT '========================================' AS separator;

SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ============================================================================
-- PART 9: CEK ROW LEVEL SECURITY (RLS)
-- ============================================================================

SELECT '========================================' AS separator;
SELECT 'PART 9: ROW LEVEL SECURITY STATUS' AS title;
SELECT '========================================' AS separator;

SELECT
    tablename,
    CASE WHEN rowsecurity THEN '✅ Enabled' ELSE '❌ Disabled' END AS rls_status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- PART 10: CEK INDEXES
-- ============================================================================

SELECT '========================================' AS separator;
SELECT 'PART 10: INDEXES' AS title;
SELECT '========================================' AS separator;

SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================================================
-- PART 11: COUNT DATA - BERAPA BANYAK DATA DI SETIAP TABEL
-- ============================================================================

SELECT '========================================' AS separator;
SELECT 'PART 11: DATA COUNT PER TABEL' AS title;
SELECT '========================================' AS separator;

-- Note: Uncomment queries below jika ingin cek jumlah data
-- WARNING: Bisa lambat jika data banyak

-- SELECT 'users' AS table_name, COUNT(*) AS row_count FROM users
-- UNION ALL
-- SELECT 'mahasiswa', COUNT(*) FROM mahasiswa
-- UNION ALL
-- SELECT 'dosen', COUNT(*) FROM dosen
-- UNION ALL
-- SELECT 'kelas', COUNT(*) FROM kelas
-- UNION ALL
-- SELECT 'kuis', COUNT(*) FROM kuis
-- UNION ALL
-- SELECT 'pengumuman', COUNT(*) FROM pengumuman
-- ORDER BY table_name;

-- ============================================================================
-- SUMMARY
-- ============================================================================

SELECT '========================================' AS separator;
SELECT 'VERIFICATION COMPLETE!' AS status;
SELECT '========================================' AS separator;
SELECT 'Review hasil di atas untuk memastikan:' AS instruction;
SELECT '1. Semua tabel ada (✅)' AS step1;
SELECT '2. Semua kolom sesuai expected' AS step2;
SELECT '3. Foreign keys ada dan benar' AS step3;
SELECT '4. RLS enabled (✅)' AS step4;
