-- ============================================================================
-- MIGRATION STEP 5A: Create Mata Kuliah (Jika Belum Ada)
-- ============================================================================
-- HANYA jalankan file ini jika STEP 4 menunjukkan "jumlah_mata_kuliah" = 0
-- ============================================================================

-- Buat mata kuliah sample
INSERT INTO mata_kuliah (kode_mk, nama_mk, sks, semester, program_studi)
VALUES
    ('IF101', 'Algoritma dan Pemrograman', 4, 1, 'Informatika'),
    ('IF201', 'Struktur Data', 3, 2, 'Informatika'),
    ('IF301', 'Basis Data', 4, 3, 'Informatika'),
    ('IF401', 'Pemrograman Web', 3, 4, 'Informatika')
ON CONFLICT (kode_mk) DO NOTHING;

-- Verify mata kuliah created
SELECT
    id,
    kode_mk,
    nama_mk,
    sks,
    semester,
    '✅ Created' as status
FROM mata_kuliah
ORDER BY kode_mk;

-- ============================================================================
-- DONE! Lanjut ke MIGRATION_STEP_5B untuk assign kelas ke mata kuliah
-- ============================================================================
