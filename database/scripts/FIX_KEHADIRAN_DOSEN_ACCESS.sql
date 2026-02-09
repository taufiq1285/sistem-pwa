-- ============================================================================
-- FIX KEHADIRAN DOSEN ACCESS
-- Script untuk memperbaiki akses dosen ke data kelas dan mata kuliah
-- ============================================================================

-- 1. Verify RLS policies exist for dosen access to kelas
DO $$
BEGIN
    -- Check if kelas_select_dosen policy exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'kelas'
        AND policyname = 'kelas_select_dosen'
    ) THEN
        -- Create policy if it doesn't exist
        CREATE POLICY "kelas_select_dosen" ON kelas
            FOR SELECT
            USING (
                is_dosen() AND is_active = TRUE
            );
        RAISE NOTICE 'Created kelas_select_dosen policy';
    ELSE
        RAISE NOTICE 'kelas_select_dosen policy already exists';
    END IF;
END $$;

-- 2. Verify RLS policy for mata_kuliah
DO $$
BEGIN
    -- Check if mata_kuliah_select_all policy exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'mata_kuliah'
        AND policyname = 'mata_kuliah_select_all'
    ) THEN
        -- Create policy if it doesn't exist
        CREATE POLICY "mata_kuliah_select_all" ON mata_kuliah
            FOR SELECT
            USING (auth.uid() IS NOT NULL);
        RAISE NOTICE 'Created mata_kuliah_select_all policy';
    ELSE
        RAISE NOTICE 'mata_kuliah_select_all policy already exists';
    END IF;
END $$;

-- 3. Ensure RLS is enabled on both tables
ALTER TABLE kelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE mata_kuliah ENABLE ROW LEVEL SECURITY;

-- 4. Check if there's any data in kelas and mata_kuliah tables
DO $$
DECLARE
    kelas_count INTEGER;
    mk_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO kelas_count FROM kelas WHERE is_active = true;
    SELECT COUNT(*) INTO mk_count FROM mata_kuliah;

    RAISE NOTICE 'Active kelas count: %', kelas_count;
    RAISE NOTICE 'Mata kuliah count: %', mk_count;

    IF kelas_count = 0 THEN
        RAISE WARNING 'No active kelas found! Admin needs to create kelas data.';
    END IF;

    IF mk_count = 0 THEN
        RAISE WARNING 'No mata kuliah found! Admin needs to create mata kuliah data.';
    END IF;
END $$;

-- 5. Verify foreign key relationship
SELECT
    k.id,
    k.nama_kelas,
    k.mata_kuliah_id,
    mk.nama_mk,
    CASE
        WHEN mk.id IS NULL THEN 'BROKEN FK - Mata kuliah not found'
        ELSE 'OK'
    END as fk_status
FROM kelas k
LEFT JOIN mata_kuliah mk ON k.mata_kuliah_id = mk.id
WHERE k.is_active = true
LIMIT 10;

-- 6. Test query that dosen will use (simulate dosen access)
-- This shows what a dosen user would see
SELECT
    k.id,
    k.kode_kelas,
    k.nama_kelas,
    k.mata_kuliah_id,
    mk.kode_mk,
    mk.nama_mk
FROM kelas k
LEFT JOIN mata_kuliah mk ON k.mata_kuliah_id = mk.id
WHERE k.is_active = true
ORDER BY k.nama_kelas
LIMIT 10;

-- 7. Show current RLS policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename IN ('kelas', 'mata_kuliah')
ORDER BY tablename, policyname;
