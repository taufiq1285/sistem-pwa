-- Script untuk debugging loading saat simpan jadwal
-- Cek masalah yang mungkin terjadi

-- 1. Cek apakah ada jadwal yang berhasil dibuat 1 jam terakhir
SELECT
    jp.id,
    jp.kelas_id,
    jp.laboratorium_id,
    jp.dosen_id,
    jp.tanggal_praktikum,
    jp.jam_mulai,
    jp.jam_selesai,
    jp.status,
    jp.is_active,
    jp.created_at,
    jp.updated_at,
    k.nama_kelas,
    mk.nama_mk,
    l.nama_lab
FROM jadwal_praktikum jp
LEFT JOIN kelas k ON jp.kelas_id = k.id
LEFT JOIN mata_kuliah mk ON k.mata_kuliah_id = mk.id
LEFT JOIN laboratorium l ON jp.laboratorium_id = l.id
WHERE jp.created_at >= NOW() - INTERVAL '1 hour'
ORDER BY jp.created_at DESC;

-- 2. Cek data kelas dan dosen
SELECT
    k.id,
    k.nama_kelas,
    k.kode_kelas,
    k.dosen_id,
    mk.nama_mk,
    u.full_name as dosen_name,
    u.email as dosen_email
FROM kelas k
LEFT JOIN mata_kuliah mk ON k.mata_kuliah_id = mk.id
LEFT JOIN dosen d ON k.dosen_id = d.id
LEFT JOIN users u ON d.user_id = u.id
WHERE k.is_active = true
ORDER BY k.nama_kelas;

-- 3. Cek permission issue
-- Cek apakah user dosen sudah terhubung dengan kelas
SELECT
    u.id as user_id,
    u.full_name,
    u.email,
    d.id as dosen_id,
    d.nip,
    k.nama_kelas,
    k.id as kelas_id
FROM users u
JOIN dosen d ON u.id = d.user_id
LEFT JOIN kelas k ON d.id = k.dosen_id
WHERE u.raw_user_meta_data->>'role' = 'dosen' OR u.raw_user_meta_data->>'role' = 'DOSEN'
ORDER BY u.full_name;

-- 4. Cek constraint atau policy yang mungkin blocking
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'jadwal_praktikum';

-- 5. Cek trigger yang mungkin ada di jadwal_praktikum
SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_condition,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'jadwal_praktikum';