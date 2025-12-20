-- DEBUG SCRIPT: Check kelas and mata_kuliah data
-- Run this in Supabase SQL Editor to debug the kehadiran page issue

-- 1. Check if there are any kelas records
SELECT
    COUNT(*) as total_kelas,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_kelas
FROM kelas;

-- 2. Check if there are any mata_kuliah records
SELECT
    COUNT(*) as total_mata_kuliah
FROM mata_kuliah;

-- 3. Check kelas with mata_kuliah join
SELECT
    k.id,
    k.kode_kelas,
    k.nama_kelas,
    k.mata_kuliah_id,
    k.is_active,
    mk.id as mk_id,
    mk.kode_mk,
    mk.nama_mk
FROM kelas k
LEFT JOIN mata_kuliah mk ON k.mata_kuliah_id = mk.id
WHERE k.is_active = true
LIMIT 10;

-- 4. Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('kelas', 'mata_kuliah')
ORDER BY tablename, policyname;

-- 5. Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('kelas', 'mata_kuliah');
