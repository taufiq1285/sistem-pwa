-- ============================================================================
-- ADD mata_kuliah_id TO kehadiran TABLE
-- Untuk simpan mata kuliah yang dipilih dosen saat input kehadiran
-- ============================================================================

-- Add mata_kuliah_id column
ALTER TABLE kehadiran
ADD COLUMN IF NOT EXISTS mata_kuliah_id UUID;

-- Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'kehadiran_mata_kuliah_id_fkey'
    ) THEN
        ALTER TABLE kehadiran
        ADD CONSTRAINT kehadiran_mata_kuliah_id_fkey
        FOREIGN KEY (mata_kuliah_id) REFERENCES mata_kuliah(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_kehadiran_mata_kuliah_id
ON kehadiran(mata_kuliah_id)
WHERE mata_kuliah_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN kehadiran.mata_kuliah_id IS
'Mata kuliah yang dipilih dosen saat input kehadiran (independent dari kelas)';

-- Verify
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'kehadiran'
  AND column_name = 'mata_kuliah_id';
