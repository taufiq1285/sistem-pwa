-- Migration: Add bobot_nilai to kelas table
-- Purpose: Allow each class to have custom grade weights

-- Add bobot_nilai column as JSONB with default weights
ALTER TABLE kelas
ADD COLUMN IF NOT EXISTS bobot_nilai JSONB DEFAULT '{
  "kuis": 15,
  "tugas": 20,
  "uts": 25,
  "uas": 30,
  "praktikum": 5,
  "kehadiran": 5
}'::jsonb;

-- Add comment to explain the structure
COMMENT ON COLUMN kelas.bobot_nilai IS 'Custom grade weights in percentage. Structure: {kuis, tugas, uts, uas, praktikum, kehadiran}. Total must equal 100.';

-- Create a function to validate bobot_nilai totals to 100
CREATE OR REPLACE FUNCTION validate_bobot_nilai()
RETURNS TRIGGER AS $$
DECLARE
  total INTEGER;
BEGIN
  -- Calculate total of all weights
  total := COALESCE((NEW.bobot_nilai->>'kuis')::INTEGER, 0) +
           COALESCE((NEW.bobot_nilai->>'tugas')::INTEGER, 0) +
           COALESCE((NEW.bobot_nilai->>'uts')::INTEGER, 0) +
           COALESCE((NEW.bobot_nilai->>'uas')::INTEGER, 0) +
           COALESCE((NEW.bobot_nilai->>'praktikum')::INTEGER, 0) +
           COALESCE((NEW.bobot_nilai->>'kehadiran')::INTEGER, 0);

  -- Check if total equals 100
  IF total != 100 THEN
    RAISE EXCEPTION 'Total bobot nilai harus 100%%. Saat ini: %%', total;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate bobot_nilai on insert/update
DROP TRIGGER IF EXISTS validate_bobot_nilai_trigger ON kelas;
CREATE TRIGGER validate_bobot_nilai_trigger
  BEFORE INSERT OR UPDATE OF bobot_nilai ON kelas
  FOR EACH ROW
  WHEN (NEW.bobot_nilai IS NOT NULL)
  EXECUTE FUNCTION validate_bobot_nilai();

-- Update existing kelas with default weights if NULL
UPDATE kelas
SET bobot_nilai = '{
  "kuis": 15,
  "tugas": 20,
  "uts": 25,
  "uas": 30,
  "praktikum": 5,
  "kehadiran": 5
}'::jsonb
WHERE bobot_nilai IS NULL;
