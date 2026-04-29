-- ============================================================================
-- Make nilai scoped by kelas + mata kuliah + mahasiswa
-- Safe, additive migration for the newer grading source of truth
-- ============================================================================

ALTER TABLE nilai
ADD COLUMN IF NOT EXISTS mata_kuliah_id UUID;

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

UPDATE nilai n
SET mata_kuliah_id = COALESCE(
    n.mata_kuliah_id,
    k.mata_kuliah_id
)
FROM kelas k
WHERE k.id = n.kelas_id
  AND n.mata_kuliah_id IS NULL;

ALTER TABLE nilai
DROP CONSTRAINT IF EXISTS nilai_unique;

DROP INDEX IF EXISTS idx_nilai_mahasiswa_kelas;

CREATE UNIQUE INDEX IF NOT EXISTS idx_nilai_unique_mhs_kelas_mk
ON nilai(mahasiswa_id, kelas_id, mata_kuliah_id)
WHERE mata_kuliah_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_nilai_unique_mhs_kelas_legacy
ON nilai(mahasiswa_id, kelas_id)
WHERE mata_kuliah_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_nilai_mata_kuliah_id
ON nilai(mata_kuliah_id)
WHERE mata_kuliah_id IS NOT NULL;

COMMENT ON COLUMN nilai.mata_kuliah_id IS
'Mata kuliah yang dipilih dosen saat input nilai. Nilai baru dibedakan per kelas + mata kuliah + mahasiswa.';
