-- ============================================================================
-- MIGRATION STEP 2E: Add Check Constraint
-- ============================================================================
-- Jalankan file ini SETELAH STEP 2D
-- ============================================================================

-- Drop old check constraint if exists
ALTER TABLE kehadiran
DROP CONSTRAINT IF EXISTS kehadiran_identifier_check;

-- Add check constraint to ensure proper identifier usage
-- Either: jadwal_id only, OR kelas_id+tanggal, OR all three
ALTER TABLE kehadiran
ADD CONSTRAINT kehadiran_identifier_check CHECK (
    (jadwal_id IS NOT NULL AND kelas_id IS NULL AND tanggal IS NULL) OR
    (jadwal_id IS NULL AND kelas_id IS NOT NULL AND tanggal IS NOT NULL) OR
    (jadwal_id IS NOT NULL AND kelas_id IS NOT NULL AND tanggal IS NOT NULL)
);

-- ============================================================================
-- DONE! Lanjut ke MIGRATION_STEP_2F
-- ============================================================================
