-- ============================================================================
-- FIX: normalize_kelas_data() Function
-- Problem: Function tries to access NEW.kode, but kelas table uses kode_kelas
-- Solution: Fix field name from 'kode' to 'kode_kelas'
-- ============================================================================

CREATE OR REPLACE FUNCTION public.normalize_kelas_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Normalize nama_kelas (trim whitespace)
    IF NEW.nama_kelas IS NOT NULL THEN
        NEW.nama_kelas = TRIM(NEW.nama_kelas);
    END IF;

    -- Normalize kode_kelas (uppercase and trim) - FIXED: kode -> kode_kelas
    IF NEW.kode_kelas IS NOT NULL THEN
        NEW.kode_kelas = UPPER(TRIM(NEW.kode_kelas));
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

COMMENT ON FUNCTION public.normalize_kelas_data IS
'Normalize kelas data before insert/update - trims nama_kelas and uppercases kode_kelas';

-- Verify the trigger exists and is attached
SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'kelas'
AND trigger_name LIKE '%normalize%';
