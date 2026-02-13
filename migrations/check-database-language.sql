-- ============================================================================
-- CHECK DATABASE LANGUAGE & LOCALE SETTINGS
-- Purpose: Memeriksa pengaturan bahasa dan lokal di database Supabase
-- ============================================================================

-- 1. Cek Database Collation & Locale
-- ==========================================
SELECT
    datname as database_name,
    datcollate as collation,
    datctype as character_type,
    encoding,
    lc_collate,
    lc_ctype
FROM pg_database
WHERE datname = current_database();

-- 2. Cek Server Locale Settings
-- ==========================================
SHOW lc_collate;
SHOW lc_ctype;
SHOW server_encoding;

-- 3. Cek ENUM values yang menggunakan bahasa Indonesia
-- ==========================================

-- Status jadwal (Indonesian)
SELECT enumlabel
FROM pg_enum
WHERE enumtypid = 'jadwal_status_enum'::regtype
ORDER BY enumsortorder;

-- Equipment condition (Indonesian)
SELECT enumlabel
FROM pg_enum
WHERE enumtypid = 'equipment_condition'::regtype
ORDER BY enumsortorder;

-- Kuis tipe (Indonesian)
SELECT enumlabel
FROM pg_enum
WHERE enumtypid = 'question_type'::regtype
ORDER BY enumsortorder;

-- Role types (Indonesian)
SELECT enumlabel
FROM pg_enum
WHERE enumtypid = 'user_role'::regtype
ORDER BY enumsortorder;

-- 4. Cek kolom dengan nilai bahasa Indonesia
-- ==========================================

-- Status values in jadwal_praktikum
SELECT DISTINCT status
FROM jadwal_praktikum
WHERE status IS NOT NULL;

-- Status values in various tables
SELECT 'logbook_entries' as table_name, DISTINCT status FROM logbook_entries WHERE status IS NOT NULL
UNION ALL
SELECT 'pengajuan_jadwal', DISTINCT status FROM pengajuan_jadwal WHERE status IS NOT NULL
UNION ALL
SELECT 'peminjaman_alat', DISTINCT status FROM peminjaman_alat WHERE status IS NOT NULL;

-- 5. Cek Text Search Configuration (jika ada)
-- ==========================================
SELECT cfgname, cfgnamespace::regnamespace::text
FROM pg_ts_config
WHERE cfgname LIKE '%indonesian%' OR cfgname LIKE '%english%';

-- 6. Cek tanggal format settings
-- ==========================================
SHOW datestyle;
SHOW timezone;
SHOW intervalstyle;

-- 7. Sample data untuk verifikasi bahasa
-- ==========================================

-- Cek mata kuliah dengan nama Indonesia
SELECT nama_mk, kode_mk
FROM mata_kuliah
LIMIT 5;

-- Cek laboratorium dengan nama Indonesia
SELECT nama_lab, kode_lab
FROM laboratorium
LIMIT 5;

-- 8. Rekomendasi Collation untuk bahasa Indonesia
-- ==========================================
-- Jika perlu mengubah ke bahasa Indonesia:
-- ALTER DATABASE <your_database_name> COLLATE = "id_ID.UTF-8";
-- ALTER DATABASE <your_database_name> CTYPE = "id_ID.UTF-8";

-- Catatan: Supabase default biasanya menggunakan en_US.UTF-8
-- Untuk aplikasi Indonesia, pertimbangkan menggunakan:
-- - Collation: id_ID.UTF-8 atau en_US.UTF-8
-- - Ctype: id_ID.UTF-8 atau en_US.UTF-8
