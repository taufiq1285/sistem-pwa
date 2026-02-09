-- ============================================================================
-- MIGRATION STEP 2A: Add Columns to kehadiran table
-- ============================================================================
-- Jalankan file ini SETELAH STEP 1
-- ============================================================================

-- Add kelas_id column
ALTER TABLE kehadiran
ADD COLUMN IF NOT EXISTS kelas_id UUID;

-- Add tanggal column
ALTER TABLE kehadiran
ADD COLUMN IF NOT EXISTS tanggal DATE;

-- ============================================================================
-- DONE! Lanjut ke MIGRATION_STEP_2B
-- ============================================================================
