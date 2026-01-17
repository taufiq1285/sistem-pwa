-- ============================================================================
-- STEP-BY-STEP FIX untuk 2 Kelas dengan NULL mata_kuliah_id
-- ============================================================================
-- Copy dan paste query ini SATU PER SATU ke Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- STEP 1: LIHAT DETAIL 2 KELAS YANG BERMASALAH
-- ============================================================================

SELECT
    id,
    kode_kelas,
    nama_kelas,
    tahun_ajaran,
    semester_ajaran,
    dosen_id,
    mata_kuliah_id,  -- NULL
    kuota,
    is_active,
    created_at
FROM kelas
WHERE mata_kuliah_id IS NULL
ORDER BY created_at DESC;

-- Catat ID kelas dan nama kelas dari hasil query ini!

-- ============================================================================
-- STEP 2: CEK APAKAH ADA MAHASISWA YANG ENROLLED
-- ============================================================================

SELECT
    k.id as kelas_id,
    k.kode_kelas,
    k.nama_kelas,
    COUNT(km.id) as jumlah_mahasiswa_enrolled,
    STRING_AGG(m.nim || ' - ' || u.full_name, ', ') as daftar_mahasiswa
FROM kelas k
LEFT JOIN kelas_mahasiswa km ON k.id = km.kelas_id AND km.is_active = true
LEFT JOIN mahasiswa m ON km.mahasiswa_id = m.id
LEFT JOIN users u ON m.user_id = u.id
WHERE k.mata_kuliah_id IS NULL
GROUP BY k.id, k.kode_kelas, k.nama_kelas;

-- Jika jumlah_mahasiswa_enrolled = 0 → Bisa hapus kelas
-- Jika jumlah_mahasiswa_enrolled > 0 → Harus assign mata_kuliah dulu

-- ============================================================================
-- STEP 3A: CEK MATA KULIAH YANG TERSEDIA
-- ============================================================================

SELECT
    id,
    kode_mk,
    nama_mk,
    sks,
    semester,
    is_active
FROM mata_kuliah
WHERE is_active = true
ORDER BY nama_mk;

-- Catat ID mata kuliah yang sesuai!

-- ============================================================================
-- STEP 3B: OPSI 1 - HAPUS KELAS (jika tidak ada mahasiswa)
-- ============================================================================

-- ⚠️ HANYA jalankan ini jika STEP 2 menunjukkan jumlah_mahasiswa_enrolled = 0
-- ⚠️ Ganti <KELAS_ID_1> dan <KELAS_ID_2> dengan ID yang actual

/*
-- Hapus kelas pertama
DELETE FROM kelas
WHERE id = '<KELAS_ID_1>';

-- Hapus kelas kedua
DELETE FROM kelas
WHERE id = '<KELAS_ID_2>';
*/

-- ============================================================================
-- STEP 3C: OPSI 2 - ASSIGN MATA_KULIAH (jika ada mahasiswa enrolled)
-- ============================================================================

-- ⚠️ Ganti placeholder dengan nilai actual:
-- <KELAS_ID> → ID kelas dari STEP 1
-- <MATA_KULIAH_ID> → ID mata kuliah dari STEP 3A

/*
-- Update kelas pertama
UPDATE kelas
SET mata_kuliah_id = '<MATA_KULIAH_ID>'
WHERE id = '<KELAS_ID_1>';

-- Update kelas kedua (jika berbeda mata kuliah)
UPDATE kelas
SET mata_kuliah_id = '<MATA_KULIAH_ID>'
WHERE id = '<KELAS_ID_2>';
*/

-- CONTOH REAL:
-- Misalnya hasil STEP 1:
--   Kelas 1: id = 'abc123', nama = 'Kelas A Praktikum Web'
--   Kelas 2: id = 'def456', nama = 'Kelas B Basis Data'
-- Dan hasil STEP 3A:
--   PWA: id = 'xyz789', nama = 'Praktikum Pemrograman Web'
--   BD:  id = 'uvw101', nama = 'Praktikum Basis Data'
--
-- Maka query-nya:
/*
UPDATE kelas SET mata_kuliah_id = 'xyz789' WHERE id = 'abc123';
UPDATE kelas SET mata_kuliah_id = 'uvw101' WHERE id = 'def456';
*/

-- ============================================================================
-- STEP 4: VERIFY PERBAIKAN BERHASIL
-- ============================================================================

-- Cek lagi, harusnya return 0
SELECT
    '=== VERIFIKASI PERBAIKAN ===' as check_section,
    COUNT(*) as total_kelas_null_mata_kuliah
FROM kelas
WHERE mata_kuliah_id IS NULL;

-- Expected: total_kelas_null_mata_kuliah = 0

-- ============================================================================
-- STEP 5: CEK SEMUA KELAS SEKARANG PUNYA MATA_KULIAH
-- ============================================================================

SELECT
    k.id,
    k.kode_kelas,
    k.nama_kelas,
    mk.kode_mk,
    mk.nama_mk,
    k.tahun_ajaran,
    k.semester_ajaran
FROM kelas k
LEFT JOIN mata_kuliah mk ON k.mata_kuliah_id = mk.id
WHERE k.is_active = true
ORDER BY k.created_at DESC
LIMIT 10;

-- Semua kelas harusnya punya kode_mk dan nama_mk yang valid (bukan NULL)

-- ============================================================================
-- STEP 6 (OPTIONAL): ENFORCE NOT NULL CONSTRAINT
-- ============================================================================

-- Setelah yakin SEMUA kelas punya mata_kuliah_id yang valid,
-- enforce constraint agar tidak bisa insert NULL lagi di masa depan:

/*
ALTER TABLE kelas
ALTER COLUMN mata_kuliah_id SET NOT NULL;
*/

-- ============================================================================
-- DONE!
-- ============================================================================

-- Setelah selesai:
-- 1. Logout dari aplikasi
-- 2. Clear browser cache/localStorage
-- 3. Login ulang sebagai mahasiswa
-- 4. Cek dashboard → harusnya tidak ada error 400 lagi
