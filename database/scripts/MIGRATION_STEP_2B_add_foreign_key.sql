-- ============================================================================
-- MIGRATION STEP 2B: Add Foreign Key Constraint
-- ============================================================================
-- Jalankan file ini SETELAH STEP 2A
-- ============================================================================

-- Add foreign key for kelas_id
ALTER TABLE kehadiran
ADD CONSTRAINT kehadiran_kelas_id_fkey
FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE CASCADE;

-- NOTE: Jika error "constraint already exists", abaikan dan lanjut ke step berikutnya

-- ============================================================================
-- DONE! Lanjut ke MIGRATION_STEP_2C
-- ============================================================================
