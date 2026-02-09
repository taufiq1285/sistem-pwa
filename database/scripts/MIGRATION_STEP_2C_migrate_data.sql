-- ============================================================================
-- MIGRATION STEP 2C: Migrate Existing Data
-- ============================================================================
-- Jalankan file ini SETELAH STEP 2B
-- ============================================================================

-- Migrate existing kehadiran data from jadwal_praktikum to kelas
UPDATE kehadiran k
SET kelas_id = j.kelas_id,
    tanggal = COALESCE(j.tanggal_praktikum, CURRENT_DATE)
FROM jadwal_praktikum j
WHERE k.jadwal_id = j.id
  AND k.kelas_id IS NULL;

-- NOTE: Jika tidak ada data kehadiran, akan update 0 rows (normal)

-- ============================================================================
-- DONE! Lanjut ke MIGRATION_STEP_2D
-- ============================================================================
