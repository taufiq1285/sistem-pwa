-- Migration: Make mata_kuliah_id and dosen_id nullable in kelas table
-- Purpose: Allow creating kelas without assigning mata kuliah and dosen first
-- Author: Admin
-- Date: 2024-12-17

-- Make mata_kuliah_id nullable
ALTER TABLE kelas
  ALTER COLUMN mata_kuliah_id DROP NOT NULL;

-- Make dosen_id nullable
ALTER TABLE kelas
  ALTER COLUMN dosen_id DROP NOT NULL;

-- Add comment
COMMENT ON COLUMN kelas.mata_kuliah_id IS 'Nullable - Will be assigned later via separate feature';
COMMENT ON COLUMN kelas.dosen_id IS 'Nullable - Will be assigned later via separate feature';
