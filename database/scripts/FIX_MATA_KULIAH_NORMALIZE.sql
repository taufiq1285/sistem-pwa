-- ============================================================================
-- FIX NORMALIZE_MATA_KULIAH_DATA FUNCTION
-- ============================================================================
-- Problem: Function tries to access NEW.nama, but mata_kuliah table has nama_mk
-- Solution: Fix field name from 'nama' to 'nama_mk'
-- ============================================================================

-- Drop and recreate with correct field name
CREATE OR REPLACE FUNCTION public.normalize_mata_kuliah_data()
RETURNS TRIGGER AS $$
BEGIN
    -- FIXED: NEW.nama -> NEW.nama_mk
    NEW.nama_mk = TRIM(NEW.nama_mk);

    -- Also normalize kode_mk if it exists
    IF NEW.kode_mk IS NOT NULL THEN
        NEW.kode_mk = UPPER(TRIM(NEW.kode_mk));
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

COMMENT ON FUNCTION public.normalize_mata_kuliah_data IS
'Normalize mata_kuliah data before insert/update - trims nama_mk and uppercases kode_mk';

-- ============================================================================
-- ALSO FIX OTHER NORMALIZE FUNCTIONS (if they have wrong field names)
-- ============================================================================

-- Fix normalize_kelas_data (kelas table uses nama_kelas, not nama)
CREATE OR REPLACE FUNCTION public.normalize_kelas_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if nama_kelas field exists (correct field name)
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        IF NEW.nama_kelas IS NOT NULL THEN
            NEW.nama_kelas = TRIM(NEW.nama_kelas);
        END IF;

        IF NEW.kode IS NOT NULL THEN
            NEW.kode = UPPER(TRIM(NEW.kode));
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

COMMENT ON FUNCTION public.normalize_kelas_data IS
'Normalize kelas data before insert/update';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
    v_func_count INTEGER;
BEGIN
    -- Check if normalize functions exist
    SELECT COUNT(*) INTO v_func_count
    FROM pg_proc
    WHERE proname LIKE 'normalize_%'
    AND pronamespace = 'public'::regnamespace;

    RAISE NOTICE '
    ============================================================
    ✅ NORMALIZE FUNCTIONS FIX
    ============================================================
    ';

    RAISE NOTICE 'Found % normalize functions', v_func_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Fixed:';
    RAISE NOTICE '  - normalize_mata_kuliah_data: nama → nama_mk';
    RAISE NOTICE '  - normalize_kelas_data: nama → nama_kelas';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '1. Try creating mata_kuliah again';
    RAISE NOTICE '2. Error should be gone! ✨';
    RAISE NOTICE '
    ============================================================
    ';
END $$;

-- List all normalize functions for verification
SELECT
    proname as function_name,
    pg_get_function_identity_arguments(oid) as arguments
FROM pg_proc
WHERE proname LIKE 'normalize_%'
AND pronamespace = 'public'::regnamespace
ORDER BY proname;
