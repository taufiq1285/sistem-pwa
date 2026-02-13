-- ==========================================
-- DEBUG: Manajemen Assignment & Jadwal Praktikum
-- ==========================================
-- File ini untuk mengecek mengapa jadwal tidak muncul di admin page

-- STEP 1: Cek struktur tabel jadwal_praktikum
-- ==========================================
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'jadwal_praktikum'
ORDER BY ordinal_position;

-- STEP 2: Cek apakah ada data di jadwal_praktikum
-- ==========================================
SELECT
    id,
    dosen_id,
    kelas_id,
    laboratorium_id,
    tanggal_praktikum,
    jam_mulai,
    jam_selesai,
    status,
    is_active,
    created_at
FROM jadwal_praktikum
ORDER BY created_at DESC
LIMIT 10;

-- STEP 3: Cek join dengan kelas dan mata_kuliah
-- ==========================================
-- Query ini meniru query di ManajemenAssignmentPage.tsx line 169-187
SELECT
    jp.kelas_id,
    jp.dosen_id,  -- ⚠️ FIELD INI MUNGKIN TIDAK DI-SELECT DI FRONTEND
    k.id as kelas_id,
    k.nama_kelas,
    k.kode_kelas,
    k.mata_kuliah_id,
    mk.nama_mk,
    mk.kode_mk,
    l.nama_lab,
    l.kode_lab
FROM jadwal_praktikum jp
INNER JOIN kelas k ON jp.kelas_id = k.id
INNER JOIN mata_kuliah mk ON k.mata_kuliah_id = mk.id
LEFT JOIN laboratorium l ON jp.laboratorium_id = l.id
WHERE jp.is_active = true
ORDER BY jp.created_at DESC
LIMIT 10;

-- STEP 4: Cek apakah dosen_id terisi dengan benar
-- ==========================================
SELECT
    jp.id,
    jp.dosen_id,
    d.nidn,
    u.full_name as dosen_name,
    u.email as dosen_email,
    jp.tanggal_praktikum,
    jp.status
FROM jadwal_praktikum jp
LEFT JOIN dosen d ON jp.dosen_id = d.id
LEFT JOIN users u ON d.user_id = u.id
ORDER BY jp.created_at DESC
LIMIT 10;

-- STEP 5: Cek data yang NULL
-- ==========================================
SELECT
    COUNT(*) as total_jadwal,
    COUNT(dosen_id) as jadwal_with_dosen,
    COUNT(kelas_id) as jadwal_with_kelas,
    COUNT(laboratorium_id) as jadwal_with_lab,
    COUNT(*) - COUNT(dosen_id) as jadwal_without_dosen,
    COUNT(*) - COUNT(kelas_id) as jadwal_without_kelas
FROM jadwal_praktikum
WHERE is_active = true;

-- STEP 6: Test query grouping seperti di frontend
-- ==========================================
-- Ini adalah query yang seharusnya dilakukan oleh ManajemenAssignmentPage
SELECT
    jp.dosen_id,
    k.mata_kuliah_id,
    jp.kelas_id,
    COUNT(*) as total_jadwal,
    MIN(jp.tanggal_praktikum) as tanggal_mulai,
    MAX(jp.tanggal_praktikum) as tanggal_selesai
FROM jadwal_praktikum jp
INNER JOIN kelas k ON jp.kelas_id = k.id
WHERE jp.is_active = true
GROUP BY jp.dosen_id, k.mata_kuliah_id, jp.kelas_id
LIMIT 10;

-- STEP 7: Cek RLS policies
-- ==========================================
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'jadwal_praktikum'
ORDER BY policyname;

-- STEP 8: Verifikasi admin access
-- ==========================================
-- Cek apakah admin bisa mengakses data jadwal
-- (Jalankan query ini sebagai user admin di Supabase SQL Editor)
SELECT
    'Current user:' as info,
    current_user;

-- Test select dengan RLS enabled
SELECT
    COUNT(*) as total_accessible_records
FROM jadwal_praktikum;
