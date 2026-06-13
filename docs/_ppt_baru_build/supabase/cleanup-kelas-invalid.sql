-- ============================================================================
-- CLEANUP: Kelas dengan mata_kuliah_id NULL (Development Mode)
-- ============================================================================
-- Issue: Kelas "Kelas A" punya mata_kuliah_id = NULL dan dosen_id = NULL
-- Impact: Jadwal yang reference kelas ini menampilkan "undefined"
-- Solution: Hapus kelas invalid atau assign mata kuliah yang benar
-- ============================================================================

-- STEP 1: CEK KELAS YANG BERMASALAH
-- ============================================================================

SELECT
    '=== KELAS DENGAN MATA_KULIAH_ID NULL ===' as check_section,
    id,
    kode_kelas,
    nama_kelas,
    mata_kuliah_id,  -- NULL
    dosen_id,        -- NULL
    is_active,
    created_at
FROM kelas
WHERE mata_kuliah_id IS NULL
ORDER BY created_at DESC;

-- ============================================================================
-- STEP 2: CEK APAKAH ADA JADWAL YANG REFERENCE KELAS INI
-- ============================================================================

SELECT
    '=== JADWAL YANG REFERENCE KELAS BERMASALAH ===' as check_section,
    jp.id as jadwal_id,
    jp.topik,
    jp.tanggal_praktikum,
    jp.hari,
    jp.jam_mulai,
    jp.kelas_id,
    k.nama_kelas,
    k.mata_kuliah_id  -- NULL
FROM jadwal_praktikum jp
JOIN kelas k ON jp.kelas_id = k.id
WHERE k.mata_kuliah_id IS NULL
ORDER BY jp.tanggal_praktikum DESC;

-- ============================================================================
-- STEP 3: CEK APAKAH ADA MAHASISWA ENROLLED DI KELAS INI
-- ============================================================================

SELECT
    '=== MAHASISWA DI KELAS BERMASALAH ===' as check_section,
    km.id as enrollment_id,
    km.kelas_id,
    k.nama_kelas,
    k.mata_kuliah_id,
    m.nim,
    u.full_name
FROM kelas_mahasiswa km
JOIN kelas k ON km.kelas_id = k.id
LEFT JOIN mahasiswa m ON km.mahasiswa_id = m.id
LEFT JOIN users u ON m.user_id = u.id
WHERE k.mata_kuliah_id IS NULL
AND km.is_active = true;

-- ============================================================================
-- STEP 4: OPSI PERBAIKAN
-- ============================================================================

-- OPSI A: HAPUS SEMUA (jadwal + enrollment + kelas)
-- ⚠️ HATI-HATI: Ini akan menghapus semua data terkait kelas invalid!
-- Untuk DEVELOPMENT MODE saja!

-- Uncomment untuk execute:
/*
-- 1. Hapus jadwal yang reference kelas invalid
DELETE FROM jadwal_praktikum
WHERE kelas_id IN (
    SELECT id FROM kelas WHERE mata_kuliah_id IS NULL
);

-- 2. Hapus enrollment mahasiswa di kelas invalid
DELETE FROM kelas_mahasiswa
WHERE kelas_id IN (
    SELECT id FROM kelas WHERE mata_kuliah_id IS NULL
);

-- 3. Hapus kelas yang mata_kuliah_id NULL
DELETE FROM kelas
WHERE mata_kuliah_id IS NULL;
*/

-- ============================================================================

-- OPSI B: ASSIGN MATA KULIAH YANG BENAR
-- (Jika kelas ini sebenarnya valid, cuma belum di-assign mata kuliah)

/*
-- 1. Lihat mata kuliah yang tersedia
SELECT id, kode_mk, nama_mk, sks FROM mata_kuliah WHERE is_active = true;

-- 2. Update kelas dengan mata kuliah yang benar
UPDATE kelas
SET
    mata_kuliah_id = '<UUID_MATA_KULIAH>',  -- Ganti dengan UUID yang valid
    dosen_id = '<UUID_DOSEN>'                -- Ganti dengan UUID dosen
WHERE mata_kuliah_id IS NULL;
*/

-- ============================================================================
-- STEP 5: VERIFIKASI SETELAH CLEANUP
-- ============================================================================

SELECT
    '=== VERIFICATION AFTER CLEANUP ===' as check_section,
    COUNT(*) as total_kelas_invalid
FROM kelas
WHERE mata_kuliah_id IS NULL;

-- Expected: 0 rows

-- Cek jadwal masih ada
SELECT
    '=== JADWAL SETELAH CLEANUP ===' as check_section,
    COUNT(*) as total_jadwal_tersisa
FROM jadwal_praktikum;

-- ============================================================================
-- STEP 6: PREVENT FUTURE ISSUES
-- ============================================================================

-- Setelah cleanup, enforce NOT NULL constraint
-- ⚠️ Jalankan HANYA setelah yakin semua kelas punya mata_kuliah_id valid

/*
ALTER TABLE kelas
ALTER COLUMN mata_kuliah_id SET NOT NULL;
*/

-- ============================================================================
-- RECOMMENDED ACTION (DEVELOPMENT MODE)
-- ============================================================================

-- Karena ini development dan kelas tidak punya data lengkap:
-- ✅ HAPUS kelas invalid (OPSI A)
-- ✅ Buat kelas baru yang lengkap dari UI admin
-- ✅ Test buat jadwal dengan kelas yang benar

-- ============================================================================
-- END OF CLEANUP SCRIPT
-- ============================================================================
