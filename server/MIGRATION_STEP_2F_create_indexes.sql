-- ============================================================================
-- MIGRATION STEP 2F: Create Indexes for Performance
-- ============================================================================
-- Jalankan file ini SETELAH STEP 2E
-- ============================================================================

-- Index for kelas_id lookups
CREATE INDEX IF NOT EXISTS idx_kehadiran_kelas_id
ON kehadiran(kelas_id)
WHERE kelas_id IS NOT NULL;

-- Index for tanggal lookups
CREATE INDEX IF NOT EXISTS idx_kehadiran_tanggal
ON kehadiran(tanggal)
WHERE tanggal IS NOT NULL;

-- Composite index for common query pattern (kelas + tanggal)
CREATE INDEX IF NOT EXISTS idx_kehadiran_kelas_tanggal
ON kehadiran(kelas_id, tanggal)
WHERE kelas_id IS NOT NULL AND tanggal IS NOT NULL;

-- ============================================================================
-- DONE! Lanjut ke MIGRATION_STEP_2G
-- ============================================================================
