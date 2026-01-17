-- Add mata_kuliah_id column to jadwal_praktikum table
-- Run this in Supabase SQL Editor

-- Check if column already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'jadwal_praktikum'
        AND column_name = 'mata_kuliah_id'
    ) THEN
        ALTER TABLE jadwal_praktikum
        ADD COLUMN mata_kuliah_id UUID REFERENCES mata_kuliah(id) ON DELETE SET NULL;

        RAISE NOTICE '✅ Added mata_kuliah_id column to jadwal_praktikum table';
    ELSE
        RAISE NOTICE 'ℹ️ mata_kuliah_id column already exists in jadwal_praktikum table';
    END IF;
END $$;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_jadwal_praktikum_mata_kuliah_id
ON jadwal_praktikum(mata_kuliah_id);

-- Add comment
COMMENT ON COLUMN jadwal_praktikum.mata_kuliah_id IS 'Mata kuliah yang diajar dalam jadwal ini (flexible - dosen bisa mengajar mata kuliah apapun di kelas umum)';

-- Verify the column
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'jadwal_praktikum'
    AND column_name = 'mata_kuliah_id';