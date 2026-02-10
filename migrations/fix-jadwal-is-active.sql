-- Fix jadwal_praktikum with NULL is_active
-- Set is_active = true for all jadwal where is_active is NULL
-- This ensures old jadwal are visible after adding is_active filter

UPDATE jadwal_praktikum
SET is_active = true
WHERE is_active IS NULL;

-- Verify the update
SELECT
  id,
  topik,
  tanggal_praktikum,
  is_active,
  status,
  dosen_id
FROM jadwal_praktikum
ORDER BY created_at DESC
LIMIT 10;
