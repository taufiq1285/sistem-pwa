-- Debug script for assignment tracking
-- Run this in Supabase SQL Editor while logged in as admin

-- 1. Check current user
SELECT
    auth.uid() as current_user_id,
    auth.role() as auth_role,
    auth.jwt() ->> 'role' as jwt_role,
    auth.jwt() ->> 'email' as jwt_email;

-- 2. Check jadwal_praktikum table structure
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'jadwal_praktikum'
    AND column_name IN ('id', 'kelas_id', 'dosen_id', 'is_active')
ORDER BY ordinal_position;

-- 3. Check all jadwal records
SELECT
    jp.id,
    jp.kelas_id,
    jp.dosen_id,
    jp.is_active,
    jp.hari,
    jp.jam_mulai,
    jp.jam_selesai,
    jp.tanggal_praktikum,
    k.nama_kelas,
    k.kode_kelas,
    mk.nama_mk,
    mk.kode_mk,
    d_jadwal.users ->> 'full_name' as dosen_jadwal_name,
    d_kelas.users ->> 'full_name' as dosen_kelas_name
FROM jadwal_praktikum jp
LEFT JOIN kelas k ON jp.kelas_id = k.id
LEFT JOIN mata_kuliah mk ON k.mata_kuliah_id = mk.id
LEFT JOIN dosen d_jadwal ON jp.dosen_id = d_jadwal.id
LEFT JOIN users u_jadwal ON d_jadwal.user_id = u_jadwal.id
LEFT JOIN dosen d_kelas ON k.dosen_id = d_kelas.id
LEFT JOIN users u_kelas ON d_kelas.user_id = u_kelas.id
WHERE jp.is_active = true
ORDER BY jp.created_at DESC;

-- 4. Check the specific query used by getAllAssignments
SELECT
    id,
    hari,
    jam_mulai,
    jam_selesai,
    tanggal_praktikum,
    minggu_ke,
    topik,
    status,
    is_active,
    created_at,
    updated_at,
    dosen_id,
    laboratorium_id,
    kelas_id
FROM jadwal_praktikum
WHERE is_active = true
ORDER BY created_at DESC;

-- 5. Check RLS policies on jadwal_praktikum
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
WHERE tablename = 'jadwal_praktikum';

-- 6. Test is_admin() function
SELECT is_admin() as is_admin_result;