CREATE OR REPLACE FUNCTION public.normalize_kelas_data()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Trim whitespace from nama_kelas
    NEW.nama_kelas = TRIM(NEW.nama_kelas);
    -- Trim and uppercase the kode_kelas
    NEW.kode_kelas = UPPER(TRIM(NEW.kode_kelas));
    RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public.normalize_kelas_data() IS 'Normalizes data for the kelas table before insert/update. Trims whitespace and uppercases code.';
