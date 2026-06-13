-- ============================================================================
-- MIGRATION: Strengthen Hybrid Kehadiran by Mata Kuliah
-- Date: 2026-04-23
-- Description:
--   Ensure attendance can be stored independently from jadwal_praktikum
--   using kelas + mata_kuliah + tanggal, while keeping legacy jadwal data.
-- ============================================================================

ALTER TABLE kehadiran
ADD COLUMN IF NOT EXISTS mata_kuliah_id UUID;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'kehadiran_mata_kuliah_id_fkey'
    ) THEN
        ALTER TABLE kehadiran
        ADD CONSTRAINT kehadiran_mata_kuliah_id_fkey
        FOREIGN KEY (mata_kuliah_id) REFERENCES mata_kuliah(id) ON DELETE SET NULL;
    END IF;
END $$;

UPDATE kehadiran k
SET mata_kuliah_id = COALESCE(
    j.mata_kuliah_id,
    kelas_data.mata_kuliah_id
)
FROM jadwal_praktikum j
LEFT JOIN kelas kelas_data ON kelas_data.id = COALESCE(k.kelas_id, j.kelas_id)
WHERE k.jadwal_id = j.id
  AND k.mata_kuliah_id IS NULL;

UPDATE kehadiran k
SET mata_kuliah_id = kelas_data.mata_kuliah_id
FROM kelas kelas_data
WHERE k.kelas_id = kelas_data.id
  AND k.jadwal_id IS NULL
  AND k.mata_kuliah_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_kehadiran_mata_kuliah_id
ON kehadiran(mata_kuliah_id)
WHERE mata_kuliah_id IS NOT NULL;

ALTER TABLE kehadiran
DROP CONSTRAINT IF EXISTS kehadiran_unique_hybrid;

ALTER TABLE kehadiran
ADD CONSTRAINT kehadiran_unique_hybrid
UNIQUE NULLS NOT DISTINCT (
    jadwal_id,
    kelas_id,
    mata_kuliah_id,
    tanggal,
    mahasiswa_id
);

COMMENT ON COLUMN kehadiran.mata_kuliah_id IS
'Mata kuliah sumber kehadiran untuk mode mandiri maupun hybrid';

COMMENT ON CONSTRAINT kehadiran_unique_hybrid ON kehadiran IS
'Satu mahasiswa hanya boleh punya satu record kehadiran untuk kombinasi jadwal atau kelas+mata kuliah+tanggal';
