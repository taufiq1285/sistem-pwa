-- ============================================================================
-- REMOVE DURATION REQUIREMENT FOR LAPORAN
-- ============================================================================
-- Purpose: Make durasi_menit optional for laporan (no time limit)
-- Issue: Laporan praktikum shouldn't have strict time limits
-- Solution: 
--   1. Make durasi_menit nullable
--   2. Update default to 10080 menit (1 minggu)
--   3. Remove CHECK constraint on durasi_menit > 0
-- Date: 2026-01-14
-- ============================================================================

-- ============================================================================
-- STEP 1: Drop existing CHECK constraint
-- ============================================================================

ALTER TABLE kuis
DROP CONSTRAINT IF EXISTS kuis_durasi_check;

-- ============================================================================
-- STEP 2: Make durasi_menit nullable and update default
-- ============================================================================

ALTER TABLE kuis
ALTER COLUMN durasi_menit DROP NOT NULL;

ALTER TABLE kuis
ALTER COLUMN durasi_menit SET DEFAULT 10080; -- 1 minggu untuk laporan

-- ============================================================================
-- STEP 3: Update existing records with low duration (for laporan)
-- ============================================================================

-- Set durasi 1 minggu untuk tugas laporan yang ada (jika ada)
-- Asumsi: Laporan biasanya dibuat tanpa batasan waktu ketat
UPDATE kuis
SET durasi_menit = 10080
WHERE durasi_menit < 100 
  AND judul ILIKE '%laporan%';

-- ============================================================================
-- STEP 4: Add new CHECK constraint (allow NULL or positive values)
-- ============================================================================

ALTER TABLE kuis
ADD CONSTRAINT kuis_durasi_check 
CHECK (durasi_menit IS NULL OR durasi_menit > 0);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '
  ============================================================
  ✅ DURATION REQUIREMENT REMOVED FOR LAPORAN
  ============================================================

  📊 Changes:
  - durasi_menit is now NULLABLE
  - Default: 10080 menit (1 minggu)
  - CHECK: Allows NULL or positive values
  
  🎯 Impact:
  - Laporan: Dosen tidak perlu set durasi (no time limit)
  - CBT: Tetap bisa set durasi spesifik (5-300 menit)
  
  📋 Note:
  - UI akan hide field durasi untuk laporan mode
  - Default 10080 menit = 7 hari = 1 minggu
  - Mahasiswa bisa submit kapan saja sebelum deadline
  
  ============================================================
  ';
END $$;

-- ============================================================================
-- TABLE COMMENT
-- ============================================================================

COMMENT ON COLUMN kuis.durasi_menit IS 
'Duration in minutes (nullable for laporan). Default: 10080 menit (1 minggu). CBT: 5-300 menit, Laporan: flexible/no time limit';
