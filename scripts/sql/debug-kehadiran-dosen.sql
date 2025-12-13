-- ============================================================================
-- DEBUG KEHADIRAN DOSEN ISSUE
-- ============================================================================
-- User: dosen@akbid.ac.id
-- User ID: 1084ba70-2a0a-4b11-9a54-374cb20d7b07
-- ============================================================================

-- 1. CEK DOSEN RECORD
-- ============================================================================
SELECT
    id as dosen_id,
    user_id,
    nidn,
    created_at
FROM dosen
WHERE user_id = '1084ba70-2a0a-4b11-9a54-374cb20d7b07';

-- Expected: Should return 1 row with dosen_id
-- If no rows: Dosen record tidak ada (harus dibuat dulu)

-- ============================================================================
-- 2. CEK KELAS PRAKTIKUM (Ganti DOSEN_ID dengan hasil query #1)
-- ============================================================================
SELECT
    k.id as kelas_id,
    k.nama_kelas,
    k.dosen_id,
    mk.nama_mk,
    k.is_active,
    k.created_at
FROM kelas k
LEFT JOIN mata_kuliah mk ON mk.id = k.mata_kuliah_id
WHERE k.dosen_id = 'PASTE_DOSEN_ID_FROM_QUERY_1_HERE'
ORDER BY k.created_at DESC;

-- Expected: Should show all kelas for this dosen
-- If no rows: Dosen belum punya kelas (harus dibuat dulu di menu Kelas)

-- ============================================================================
-- 3. CEK JADWAL PRAKTIKUM (Ganti DOSEN_ID dengan hasil query #1)
-- ============================================================================
SELECT
    jp.id as jadwal_id,
    jp.kelas_id,
    k.nama_kelas,
    mk.nama_mk,
    jp.tanggal_praktikum,
    jp.jam_mulai,
    jp.jam_selesai,
    jp.created_at
FROM jadwal_praktikum jp
JOIN kelas k ON k.id = jp.kelas_id
LEFT JOIN mata_kuliah mk ON mk.id = k.mata_kuliah_id
WHERE k.dosen_id = 'PASTE_DOSEN_ID_FROM_QUERY_1_HERE'
ORDER BY jp.tanggal_praktikum DESC;

-- Expected: Should show jadwal praktikum for dosen's kelas
-- If no rows: Belum ada jadwal praktikum (harus dibuat dulu di menu Jadwal)

-- ============================================================================
-- 4. CEK MAHASISWA ENROLLED (Ganti DOSEN_ID dengan hasil query #1)
-- ============================================================================
SELECT
    k.id as kelas_id,
    k.nama_kelas,
    COUNT(km.mahasiswa_id) as jumlah_mahasiswa
FROM kelas k
LEFT JOIN kelas_mahasiswa km ON km.kelas_id = k.id
WHERE k.dosen_id = 'PASTE_DOSEN_ID_FROM_QUERY_1_HERE'
GROUP BY k.id, k.nama_kelas
ORDER BY k.nama_kelas;

-- Expected: Should show student count per kelas
-- If count = 0: Kelas tidak punya mahasiswa (enroll mahasiswa dulu)

-- ============================================================================
-- 5. CEK RLS POLICY DOSEN (Test apakah RLS memblokir)
-- ============================================================================
-- Run this as the dosen user (login as dosen@akbid.ac.id first)
-- Then run in SQL Editor:

-- SET ROLE authenticated;
-- SET request.jwt.claim.sub = '1084ba70-2a0a-4b11-9a54-374cb20d7b07';

SELECT
    k.id,
    k.nama_kelas,
    k.dosen_id
FROM kelas k
LIMIT 5;

-- If returns empty but query #2 shows data: RLS policy problem
-- If returns data: RLS working correctly

-- ============================================================================
-- DIAGNOSIS GUIDE
-- ============================================================================

/*
CASE 1: Query #1 returns nothing
→ Dosen record tidak ada
→ FIX: Buat dosen record atau link user ke dosen yang ada

CASE 2: Query #1 OK, Query #2 returns nothing
→ Dosen belum punya kelas
→ FIX: Buat kelas baru di menu Kelas Management

CASE 3: Query #1 & #2 OK, Query #3 returns nothing
→ Belum ada jadwal praktikum
→ FIX: Buat jadwal praktikum di menu Jadwal
→ THIS IS MOST LIKELY THE ISSUE

CASE 4: Query #1-3 OK, Query #4 shows 0 students
→ Kelas tidak punya mahasiswa
→ FIX: Enroll mahasiswa ke kelas

CASE 5: All queries return data but UI still empty
→ RLS policy or frontend issue
→ Check browser console for errors
→ Check RLS policies in query #5
*/

-- ============================================================================
-- END OF DEBUG SCRIPT
-- ============================================================================
