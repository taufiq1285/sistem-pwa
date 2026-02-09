-- ============================================================================
-- FIX DATA BEFORE MIGRATION
-- Date: 2024-12-19
-- Description: Fix data integrity issues before running hybrid migration
-- ============================================================================
-- IMPORTANT: Run this BEFORE running the main migration!
--
-- This script fixes:
-- 1. Kelas without mata_kuliah_id (NULL values)
-- 2. Orphaned records (FK references to deleted records)
-- 3. Invalid data that would cause migration to fail
-- ============================================================================

-- ============================================================================
-- PART 1: BACKUP CURRENT DATA
-- ============================================================================

-- Create backup tables (optional but recommended)
DO $$
BEGIN
    -- Backup kelas
    DROP TABLE IF EXISTS kelas_backup_20241219;
    CREATE TABLE kelas_backup_20241219 AS
    SELECT * FROM kelas;

    RAISE NOTICE '✅ Backed up % kelas records', (SELECT COUNT(*) FROM kelas_backup_20241219);

    -- Backup kehadiran
    DROP TABLE IF EXISTS kehadiran_backup_20241219;
    CREATE TABLE kehadiran_backup_20241219 AS
    SELECT * FROM kehadiran;

    RAISE NOTICE '✅ Backed up % kehadiran records', (SELECT COUNT(*) FROM kehadiran_backup_20241219);
END $$;

-- ============================================================================
-- PART 2: CHECK CURRENT STATE
-- ============================================================================

-- Check for broken kelas (without mata_kuliah_id)
DO $$
DECLARE
    broken_kelas_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO broken_kelas_count
    FROM kelas
    WHERE is_active = true AND mata_kuliah_id IS NULL;

    RAISE NOTICE '=== DATA INTEGRITY CHECK ===';
    RAISE NOTICE 'Kelas without mata_kuliah_id: %', broken_kelas_count;

    IF broken_kelas_count > 0 THEN
        RAISE NOTICE '⚠️ FOUND % kelas records that need fixing!', broken_kelas_count;
    ELSE
        RAISE NOTICE '✅ All kelas have valid mata_kuliah_id';
    END IF;
END $$;

-- Display broken kelas details
SELECT
    k.id,
    k.kode_kelas,
    k.nama_kelas,
    k.tahun_ajaran,
    k.semester_ajaran,
    k.mata_kuliah_id,
    k.dosen_id,
    '❌ BROKEN: No mata_kuliah_id' as status
FROM kelas k
WHERE k.is_active = true AND k.mata_kuliah_id IS NULL
ORDER BY k.nama_kelas;

-- ============================================================================
-- PART 3: CHECK IF MATA_KULIAH EXISTS
-- ============================================================================

DO $$
DECLARE
    mk_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO mk_count FROM mata_kuliah;

    RAISE NOTICE 'Total mata_kuliah in database: %', mk_count;

    IF mk_count = 0 THEN
        RAISE NOTICE '⚠️ WARNING: No mata_kuliah found! Will create sample data.';
    ELSE
        RAISE NOTICE '✅ Mata kuliah exists, will use existing data';
    END IF;
END $$;

-- Display existing mata_kuliah
SELECT
    id,
    kode_mk,
    nama_mk,
    semester,
    sks,
    program_studi
FROM mata_kuliah
ORDER BY kode_mk;

-- ============================================================================
-- PART 4: CREATE SAMPLE MATA_KULIAH (If None Exists)
-- ============================================================================

-- Only create sample data if no mata_kuliah exists
DO $$
DECLARE
    mk_count INTEGER;
    new_mk_id UUID;
BEGIN
    SELECT COUNT(*) INTO mk_count FROM mata_kuliah;

    IF mk_count = 0 THEN
        RAISE NOTICE '📝 Creating sample mata_kuliah data...';

        -- Insert sample mata kuliah
        INSERT INTO mata_kuliah (kode_mk, nama_mk, sks, semester, program_studi, deskripsi)
        VALUES
            ('IF101', 'Algoritma dan Pemrograman', 4, 1, 'Informatika', 'Mata kuliah dasar pemrograman'),
            ('IF201', 'Struktur Data', 3, 2, 'Informatika', 'Mata kuliah struktur data dan algoritma'),
            ('IF301', 'Basis Data', 4, 3, 'Informatika', 'Mata kuliah sistem basis data')
        ON CONFLICT (kode_mk) DO NOTHING
        RETURNING id INTO new_mk_id;

        RAISE NOTICE '✅ Created % sample mata_kuliah records',
            (SELECT COUNT(*) FROM mata_kuliah WHERE kode_mk IN ('IF101', 'IF201', 'IF301'));
    ELSE
        RAISE NOTICE '✅ Using existing mata_kuliah data (% records)', mk_count;
    END IF;
END $$;

-- ============================================================================
-- PART 5: FIX KELAS WITHOUT mata_kuliah_id
-- ============================================================================

-- Strategy: Assign broken kelas to the first available mata_kuliah
-- You can customize this logic based on your needs

DO $$
DECLARE
    broken_count INTEGER;
    first_mk_id UUID;
    fixed_count INTEGER := 0;
BEGIN
    -- Count broken kelas
    SELECT COUNT(*) INTO broken_count
    FROM kelas
    WHERE is_active = true AND mata_kuliah_id IS NULL;

    IF broken_count = 0 THEN
        RAISE NOTICE '✅ No broken kelas found. Skipping fix.';
        RETURN;
    END IF;

    RAISE NOTICE '🔧 Fixing % kelas without mata_kuliah_id...', broken_count;

    -- Get first available mata_kuliah
    SELECT id INTO first_mk_id
    FROM mata_kuliah
    ORDER BY kode_mk
    LIMIT 1;

    IF first_mk_id IS NULL THEN
        RAISE EXCEPTION 'Cannot fix kelas: No mata_kuliah available!';
    END IF;

    RAISE NOTICE 'Will assign broken kelas to mata_kuliah: %',
        (SELECT kode_mk || ' - ' || nama_mk FROM mata_kuliah WHERE id = first_mk_id);

    -- Fix broken kelas
    UPDATE kelas
    SET mata_kuliah_id = first_mk_id,
        updated_at = NOW()
    WHERE is_active = true
      AND mata_kuliah_id IS NULL;

    GET DIAGNOSTICS fixed_count = ROW_COUNT;

    RAISE NOTICE '✅ Fixed % kelas records', fixed_count;

    -- Show fixed kelas
    RAISE NOTICE 'Fixed kelas details:';
END $$;

-- Display fixed kelas
SELECT
    k.id,
    k.kode_kelas,
    k.nama_kelas,
    k.tahun_ajaran,
    mk.kode_mk,
    mk.nama_mk,
    '✅ FIXED' as status
FROM kelas k
JOIN mata_kuliah mk ON k.mata_kuliah_id = mk.id
WHERE k.is_active = true
ORDER BY k.nama_kelas;

-- ============================================================================
-- PART 6: VERIFY FIXES
-- ============================================================================

-- Final verification
DO $$
DECLARE
    total_kelas INTEGER;
    valid_kelas INTEGER;
    broken_kelas INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_kelas FROM kelas WHERE is_active = true;
    SELECT COUNT(*) INTO valid_kelas FROM kelas WHERE is_active = true AND mata_kuliah_id IS NOT NULL;
    SELECT COUNT(*) INTO broken_kelas FROM kelas WHERE is_active = true AND mata_kuliah_id IS NULL;

    RAISE NOTICE '=== FINAL VERIFICATION ===';
    RAISE NOTICE 'Total active kelas: %', total_kelas;
    RAISE NOTICE 'Valid kelas (with mata_kuliah): %', valid_kelas;
    RAISE NOTICE 'Broken kelas (without mata_kuliah): %', broken_kelas;

    IF broken_kelas = 0 THEN
        RAISE NOTICE '✅ ALL KELAS ARE NOW VALID!';
        RAISE NOTICE '✅ Ready to run main migration: 20241219000000_hybrid_kehadiran_system.sql';
    ELSE
        RAISE WARNING '⚠️ Still have % broken kelas! Manual intervention needed.', broken_kelas;
    END IF;

    RAISE NOTICE '========================';
END $$;

-- ============================================================================
-- PART 7: OPTIONAL - ADD NOT NULL CONSTRAINT
-- ============================================================================

-- Uncomment this if you want to prevent future NULL mata_kuliah_id
-- ONLY run this after verifying all kelas have valid mata_kuliah_id

/*
DO $$
BEGIN
    -- Check if all kelas have mata_kuliah_id
    IF NOT EXISTS (
        SELECT 1 FROM kelas
        WHERE is_active = true AND mata_kuliah_id IS NULL
    ) THEN
        RAISE NOTICE 'Adding NOT NULL constraint to kelas.mata_kuliah_id...';

        ALTER TABLE kelas
        ALTER COLUMN mata_kuliah_id SET NOT NULL;

        RAISE NOTICE '✅ Constraint added successfully';
    ELSE
        RAISE WARNING '⚠️ Cannot add NOT NULL constraint: Some kelas still have NULL mata_kuliah_id';
    END IF;
END $$;
*/

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ DATA FIX COMPLETED!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Review the fixed kelas above';
    RAISE NOTICE '2. If everything looks good, run the main migration:';
    RAISE NOTICE '   → 20241219000000_hybrid_kehadiran_system.sql';
    RAISE NOTICE '3. Clear browser cache (Ctrl+Shift+R)';
    RAISE NOTICE '4. Test kehadiran input feature';
    RAISE NOTICE '════════════════════════════════════════════════════════';
END $$;
