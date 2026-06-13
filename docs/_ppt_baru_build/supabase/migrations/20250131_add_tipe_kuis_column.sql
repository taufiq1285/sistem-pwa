-- ============================================================================
-- ADD tipe_kuis COLUMN TO kuis TABLE
-- Purpose: Differentiate between "Laporan Praktikum" (essay) and "Tes CBT" (pilihan_ganda)
-- Date: 2025-01-31
-- ============================================================================

-- Step 1: Create enum type for tipe_kuis
DO $$ BEGIN
    CREATE TYPE kuis_type AS ENUM ('essay', 'pilihan_ganda', 'campuran');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Step 2: Add column to kuis table
ALTER TABLE kuis
ADD COLUMN IF NOT EXISTS tipe_kuis kuis_type DEFAULT 'campuran';

-- Step 3: Migrate existing data based on durasi_menit
-- 10080 minutes (1 week) = Laporan (essay)
-- 60 minutes (1 hour) = Tes CBT (pilihan_ganda)
UPDATE kuis
SET tipe_kuis = CASE
    WHEN durasi_menit >= 10000 THEN 'essay'::kuis_type           -- Laporan Praktikum
    WHEN durasi_menit <= 300 THEN 'pilihan_ganda'::kuis_type    -- Tes CBT
    ELSE 'campuran'::kuis_type                                         -- Mixed/other
END;

-- Step 4: Add comment
COMMENT ON COLUMN kuis.tipe_kuis IS
'Type of quiz: essay = Laporan Praktikum (no time limit), pilihan_ganda = Tes CBT (time-limited), campuran = Mixed';

-- Step 5: Verify the migration
SELECT
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_name = 'kuis'
  AND column_name = 'tipe_kuis';

-- Show affected rows
SELECT
    judul,
    durasi_menit,
    tipe_kuis,
    CASE tipe_kuis
        WHEN 'essay' THEN 'Laporan Praktikum'
        WHEN 'pilihan_ganda' THEN 'Tes CBT'
        ELSE 'Campuran'
    END as type_label
FROM kuis
ORDER BY created_at DESC
LIMIT 10;
