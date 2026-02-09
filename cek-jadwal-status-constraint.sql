-- ============================================================================
-- CEK STRUKTUR TABEL jadwal_praktikum
-- ============================================================================
-- Jalankan query ini di Supabase SQL Editor untuk melihat struktur dan constraint

-- 1. Cek semua kolom di tabel jadwal_praktikum
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM
    information_schema.columns
WHERE
    table_name = 'jadwal_praktikum'
ORDER BY
    ordinal_position;

-- 2. Cek semua constraint di tabel jadwal_praktikum
SELECT
    con.conname AS constraint_name,
    con.contype AS constraint_type,
    CASE
        WHEN con.contype = 'c' THEN 'CHECK'
        WHEN con.contype = 'f' THEN 'FOREIGN KEY'
        WHEN con.contype = 'p' THEN 'PRIMARY KEY'
        WHEN con.contype = 'u' THEN 'UNIQUE'
        ELSE con.contype::text
    END AS type,
    pg_get_constraintdef(con.oid) AS definition
FROM
    pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE
    rel.relname = 'jadwal_praktikum'
ORDER BY
    con.conname;

-- 3. Cek nilai status yang sudah ada di database
SELECT DISTINCT status FROM jadwal_praktikum ORDER BY status;

-- 4. Sample data untuk melihat contoh jadwal
SELECT id, kelas_id, tanggal_praktikum, topik, is_active, status
FROM jadwal_praktikum
ORDER BY created_at DESC
LIMIT 5;
