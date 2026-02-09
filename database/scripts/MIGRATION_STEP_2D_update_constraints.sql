-- ============================================================================
-- MIGRATION STEP 2D: Update Constraints
-- ============================================================================
-- Jalankan file ini SETELAH STEP 2C
-- ============================================================================

-- Make jadwal_id nullable (untuk support date-based attendance)
ALTER TABLE kehadiran
ALTER COLUMN jadwal_id DROP NOT NULL;

-- Drop old unique constraint
ALTER TABLE kehadiran
DROP CONSTRAINT IF EXISTS kehadiran_unique;

-- Add new unique constraint (hybrid mode)
ALTER TABLE kehadiran
ADD CONSTRAINT kehadiran_unique_hybrid
UNIQUE NULLS NOT DISTINCT (jadwal_id, kelas_id, tanggal, mahasiswa_id);

-- ============================================================================
-- DONE! Lanjut ke MIGRATION_STEP_2E
-- ============================================================================
