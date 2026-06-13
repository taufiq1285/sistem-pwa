-- ============================================================================
-- Migration: Add dosen_id to jadwal_praktikum table
-- Purpose: Allow admin to override/assign specific dosen for a jadwal
-- ============================================================================

-- Add dosen_id column (nullable, will use kelas.dosen_id as fallback if null)
ALTER TABLE jadwal_praktikum
ADD COLUMN IF NOT EXISTS dosen_id UUID REFERENCES dosen(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_jadwal_praktikum_dosen_id ON jadwal_praktikum(dosen_id);

-- Comment
COMMENT ON COLUMN jadwal_praktikum.dosen_id IS 'Optional: Override dosen for this specific jadwal. If null, uses dosen from kelas.';
