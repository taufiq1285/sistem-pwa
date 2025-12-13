-- ============================================================================
-- FIX: Kelas dengan mata_kuliah_id NULL
-- ============================================================================
-- Purpose: Mencari dan memperbaiki record kelas yang mata_kuliah_id-nya NULL
-- Issue: Menyebabkan error 400 Bad Request saat mahasiswa akses dashboard
-- Date: 2025-12-09
-- ============================================================================

-- STEP 1: CEK KELAS DENGAN mata_kuliah_id NULL
-- ============================================================================

SELECT
    '=== KELAS DENGAN MATA_KULIAH_ID NULL ===' as check_section,
    COUNT(*) as total_records_bermasalah
FROM kelas
WHERE mata_kuliah_id IS NULL;

-- Detail record yang bermasalah
SELECT
    id,
    kode_kelas,
    nama_kelas,
    tahun_ajaran,
    semester_ajaran,
    dosen_id,
    mata_kuliah_id,  -- Ini yang NULL
    created_at
FROM kelas
WHERE mata_kuliah_id IS NULL
ORDER BY created_at DESC;

-- ============================================================================
-- STEP 2: CEK APAKAH ADA MAHASISWA YANG ENROLLED DI KELAS BERMASALAH
-- ============================================================================

SELECT
    '=== MAHASISWA DI KELAS BERMASALAH ===' as check_section,
    km.id as enrollment_id,
    km.kelas_id,
    k.kode_kelas,
    k.nama_kelas,
    m.nim,
    u.full_name as nama_mahasiswa,
    km.enrolled_at
FROM kelas_mahasiswa km
JOIN kelas k ON km.kelas_id = k.id
LEFT JOIN mahasiswa m ON km.mahasiswa_id = m.id
LEFT JOIN users u ON m.user_id = u.id
WHERE k.mata_kuliah_id IS NULL
AND km.is_active = true
ORDER BY km.enrolled_at DESC;

-- ============================================================================
-- STEP 3: OPSI PERBAIKAN
-- ============================================================================

-- OPSI A: HAPUS KELAS YANG TIDAK VALID (jika tidak ada mahasiswa enrolled)
-- ⚠️ HATI-HATI: Ini akan menghapus kelas beserta semua data terkait (cascade)
-- Uncomment jika yakin ingin menghapus:

/*
DELETE FROM kelas
WHERE mata_kuliah_id IS NULL
AND id NOT IN (
    SELECT DISTINCT kelas_id
    FROM kelas_mahasiswa
    WHERE is_active = true
);
*/

-- OPSI B: ASSIGN MATA_KULIAH DUMMY untuk kelas yang sudah ada mahasiswa
-- (Anda perlu ganti <UUID_MATA_KULIAH> dengan ID mata kuliah yang valid)

/*
-- Cek dulu mata kuliah yang tersedia:
SELECT id, kode_mk, nama_mk FROM mata_kuliah WHERE is_active = true;

-- Kemudian update kelas bermasalah:
UPDATE kelas
SET mata_kuliah_id = '<UUID_MATA_KULIAH>'  -- Ganti dengan UUID yang valid
WHERE mata_kuliah_id IS NULL;
*/

-- ============================================================================
-- STEP 4: VERIFIKASI SETELAH PERBAIKAN
-- ============================================================================

-- Jalankan query ini setelah perbaikan untuk memastikan tidak ada lagi NULL
SELECT
    '=== VERIFIKASI PERBAIKAN ===' as check_section,
    COUNT(*) as total_kelas_null_mata_kuliah
FROM kelas
WHERE mata_kuliah_id IS NULL;

-- Harusnya return 0 rows

-- ============================================================================
-- STEP 5: PREVENT FUTURE ISSUES - ENFORCE NOT NULL CONSTRAINT
-- ============================================================================

-- Setelah data dibersihkan, enforce NOT NULL constraint
-- ⚠️ Jalankan ini HANYA setelah yakin tidak ada lagi NULL values

/*
ALTER TABLE kelas
ALTER COLUMN mata_kuliah_id SET NOT NULL;
*/

-- ============================================================================
-- TROUBLESHOOTING NOTES
-- ============================================================================

-- Jika error masih terjadi setelah perbaikan:
-- 1. Clear browser cache/localStorage
-- 2. Logout dan login ulang
-- 3. Restart aplikasi frontend
-- 4. Cek Supabase cache (bisa delay beberapa detik)

-- ============================================================================
-- END OF FIX SCRIPT
-- ============================================================================
