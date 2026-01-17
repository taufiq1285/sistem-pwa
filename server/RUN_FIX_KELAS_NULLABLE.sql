-- ============================================================================
-- FIX: Make kelas fields nullable for universal class system
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Make mata_kuliah_id nullable
ALTER TABLE kelas
  ALTER COLUMN mata_kuliah_id DROP NOT NULL;

-- Make dosen_id nullable
ALTER TABLE kelas
  ALTER COLUMN dosen_id DROP NOT NULL;

-- Add comments
COMMENT ON COLUMN kelas.mata_kuliah_id IS 'Nullable - Supports universal class system where classes are not tied to specific mata kuliah';
COMMENT ON COLUMN kelas.dosen_id IS 'Nullable - Supports universal class system where classes are not tied to specific dosen';

-- Verify changes
SELECT
  column_name,
  is_nullable,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'kelas'
AND column_name IN ('mata_kuliah_id', 'dosen_id');
