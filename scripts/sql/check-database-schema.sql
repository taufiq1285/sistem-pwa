-- ============================================================================
-- SQL Queries untuk Mengecek Schema Database Supabase
-- Copy dan jalankan di Supabase SQL Editor
-- ============================================================================

-- 1. CEK TABEL PENGUMUMAN (untuk fix PengumumanPage error)
-- Error: missing 'isi' and 'created_by' properties
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'pengumuman'
ORDER BY ordinal_position;

-- 2. CEK TABEL MAHASISWA (untuk fix ProfilePage error)
-- Error: missing 'prodi_id', 'semester_aktif', 'tahun_masuk', 'is_active'
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'mahasiswa'
ORDER BY ordinal_position;

-- 3. CEK TABEL PEMINJAMAN (untuk fix peminjaman-extensions error)
-- Error: column 'kondisi_saat_pinjam' mungkin tidak ada
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'peminjaman'
ORDER BY ordinal_position;

-- 4. CEK SEMUA TABEL DI DATABASE
SELECT
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = tables.table_name) as column_count
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 5. CEK STRUKTUR TABEL KUIS (untuk fix test errors)
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'kuis'
ORDER BY ordinal_position;

-- 6. CEK FOREIGN KEYS
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;

-- 7. CEK INDEXES
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
