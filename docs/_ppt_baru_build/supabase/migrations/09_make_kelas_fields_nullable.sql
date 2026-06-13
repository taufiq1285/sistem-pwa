-- Migration: Make mata_kuliah_id and dosen_id nullable in kelas table
-- Purpose: Allow kelas to exist without being tied to mata_kuliah or dosen
-- Date: 2025-01-17

-- Make mata_kuliah_id nullable
ALTER TABLE kelas
ALTER COLUMN mata_kuliah_id DROP NOT NULL;

-- Make dosen_id nullable
ALTER TABLE kelas
ALTER COLUMN dosen_id DROP NOT NULL;

-- Also make kode_kelas nullable (since it might not be needed for simple class lists)
ALTER TABLE kelas
ALTER COLUMN kode_kelas DROP NOT NULL;

-- Add comments
COMMENT ON COLUMN kelas.mata_kuliah_id IS 'Optional reference to mata kuliah - nullable to support standalone class lists';
COMMENT ON COLUMN kelas.dosen_id IS 'Optional reference to dosen - nullable to support standalone class lists';
