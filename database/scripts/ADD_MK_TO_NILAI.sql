-- ============================================================================
-- ADD MATA_KULIAH_ID TO NILAI TABLE
-- Jalankan di Supabase SQL Editor
-- Safe to run multiple times (idempotent)
-- ============================================================================

-- Add mata_kuliah_id column
ALTER TABLE nilai
ADD COLUMN IF NOT EXISTS mata_kuliah_id UUID;

-- Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'nilai_mata_kuliah_id_fkey'
    ) THEN
        ALTER TABLE nilai
        ADD CONSTRAINT nilai_mata_kuliah_id_fkey
        FOREIGN KEY (mata_kuliah_id) REFERENCES mata_kuliah(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_nilai_mata_kuliah_id
ON nilai(mata_kuliah_id)
WHERE mata_kuliah_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN nilai.mata_kuliah_id IS
'Mata kuliah yang dipilih dosen saat input nilai (independent dari kelas)';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
    mk_id_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'nilai' AND column_name = 'mata_kuliah_id'
    ) INTO mk_id_exists;

    RAISE NOTICE '
    ============================================================
    ✅ VERIFICATION RESULTS
    ============================================================

    mata_kuliah_id column added: %

    🎯 Next Steps:
    1. Update nilai API to include mata_kuliah_id
    2. Update PenilaianPage to pass mata_kuliah_id when saving
    3. Dosen can select mata kuliah independently from kelas

    ============================================================
    ',
    CASE WHEN mk_id_exists THEN '✓' ELSE '✗' END;
END $$;
