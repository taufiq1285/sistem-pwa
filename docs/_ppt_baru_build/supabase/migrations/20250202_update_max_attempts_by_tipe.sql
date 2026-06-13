-- ============================================================================
-- UPDATE max_attempts BASED ON tipe_kuis
-- Purpose: Update existing kuis data to follow UKOM standards
-- Date: 2025-02-02
-- ============================================================================

-- ============================================================================
-- PROBLEM: Existing kuis data has max_attempts = 1 for all types
-- SOLUTION: Update based on tipe_kuis:
--   - essay (Laporan) → 3 attempts (can resubmit)
--   - pilihan_ganda (CBT) → 1 attempt (UKOM standard, no retry)
--   - campuran → 3 attempts (default to more flexible)
-- ============================================================================

-- ============================================================================
-- PART 1: UPDATE max_attempts BASED ON tipe_kuis
-- ============================================================================

UPDATE kuis
SET max_attempts = CASE
    WHEN tipe_kuis = 'essay' THEN 3          -- Laporan: bisa kirim ulang
    WHEN tipe_kuis = 'pilihan_ganda' THEN 1  -- CBT: standar UKOM, 1x kesempatan
    WHEN tipe_kuis = 'campuran' THEN 3        -- Campuran: default lebih fleksibel
    ELSE 3                                    -- Default: 3 attempts
END;

-- ============================================================================
-- PART 2: VERIFY THE UPDATE
-- ============================================================================

SELECT
    judul,
    tipe_kuis,
    max_attempts,
    durasi_menit,
    status,
    CASE tipe_kuis
        WHEN 'essay' THEN 'Laporan Praktikum (3x percobaan)'
        WHEN 'pilihan_ganda' THEN 'Tes CBT (1x percobaan - UKOM Standard)'
        ELSE 'Campuran (3x percobaan)'
    END as keterangan
FROM kuis
ORDER BY created_at DESC
LIMIT 15;

-- ============================================================================
-- PART 3: SHOW SUMMARY
-- ============================================================================

SELECT
    tipe_kuis,
    max_attempts,
    COUNT(*) as jumlah
FROM kuis
GROUP BY tipe_kuis, max_attempts
ORDER BY tipe_kuis;

-- Show completion notice
DO $$
BEGIN
    RAISE NOTICE '✅ Migration complete! max_attempts updated based on tipe_kuis:';
    RAISE NOTICE '  - essay (Laporan): max_attempts = 3 (can resubmit)';
    RAISE NOTICE '  - pilihan_ganda (CBT): max_attempts = 1 (UKOM standard)';
    RAISE NOTICE '  - campuran: max_attempts = 3 (flexible)';
END $$;
