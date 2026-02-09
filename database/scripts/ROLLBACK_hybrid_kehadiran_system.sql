-- ============================================================================
-- ROLLBACK: Hybrid Kehadiran System Migration
-- Date: 2024-12-19
-- Description: Rollback migration 20241219000000_hybrid_kehadiran_system.sql
-- ============================================================================
-- IMPORTANT: Only run this if you need to undo the hybrid migration!
--
-- This will:
-- 1. Remove added columns (kelas_id, tanggal)
-- 2. Restore original constraints
-- 3. Restore original RLS policies
-- 4. Remove helper functions
-- ============================================================================

-- Safety check
DO $$
BEGIN
    RAISE NOTICE '⚠️  WARNING: You are about to ROLLBACK the hybrid kehadiran migration!';
    RAISE NOTICE '⚠️  This will remove kelas_id and tanggal columns from kehadiran table.';
    RAISE NOTICE '⚠️  Any attendance data entered using these columns will be LOST!';
    RAISE NOTICE '';
    RAISE NOTICE 'To proceed, uncomment the rollback code below.';
    RAISE NOTICE 'To cancel, do not uncomment and do not run this script.';
END $$;

-- ============================================================================
-- UNCOMMENT BELOW TO ACTUALLY PERFORM ROLLBACK
-- ============================================================================

/*

-- ============================================================================
-- PART 1: BACKUP DATA BEFORE ROLLBACK
-- ============================================================================

-- Backup kehadiran with new columns
DROP TABLE IF EXISTS kehadiran_before_rollback_20241219;
CREATE TABLE kehadiran_before_rollback_20241219 AS
SELECT * FROM kehadiran;

DO $$
BEGIN
    RAISE NOTICE '✅ Backed up kehadiran table to kehadiran_before_rollback_20241219';
    RAISE NOTICE '   Total records: %', (SELECT COUNT(*) FROM kehadiran_before_rollback_20241219);
END $$;

-- ============================================================================
-- PART 2: CHECK FOR DATA THAT WILL BE LOST
-- ============================================================================

DO $$
DECLARE
    kelas_based_count INTEGER;
BEGIN
    -- Count records that use kelas_id (not jadwal_id)
    SELECT COUNT(*) INTO kelas_based_count
    FROM kehadiran
    WHERE jadwal_id IS NULL AND kelas_id IS NOT NULL;

    IF kelas_based_count > 0 THEN
        RAISE WARNING '⚠️  ATTENTION: % kehadiran records use kelas_id instead of jadwal_id!', kelas_based_count;
        RAISE WARNING '⚠️  These records will need to be migrated back to jadwal-based or will be LOST!';
    ELSE
        RAISE NOTICE '✅ All kehadiran records use jadwal_id. Safe to rollback.';
    END IF;
END $$;

-- Show records that will be affected
SELECT
    id,
    kelas_id,
    tanggal,
    mahasiswa_id,
    status,
    jadwal_id,
    created_at,
    '⚠️ Will be affected by rollback' as warning
FROM kehadiran
WHERE jadwal_id IS NULL AND kelas_id IS NOT NULL
ORDER BY created_at DESC;

-- ============================================================================
-- PART 3: REMOVE HELPER FUNCTIONS
-- ============================================================================

DROP FUNCTION IF EXISTS get_kehadiran_by_kelas_daterange(UUID, DATE, DATE);
DROP FUNCTION IF EXISTS calculate_attendance_percentage(UUID, UUID);

RAISE NOTICE '✅ Removed helper functions';

-- ============================================================================
-- PART 4: DROP NEW CONSTRAINTS
-- ============================================================================

-- Drop hybrid unique constraint
ALTER TABLE kehadiran
DROP CONSTRAINT IF EXISTS kehadiran_unique_hybrid;

-- Drop check constraint
ALTER TABLE kehadiran
DROP CONSTRAINT IF EXISTS kehadiran_identifier_check;

RAISE NOTICE '✅ Removed hybrid constraints';

-- ============================================================================
-- PART 5: DROP NEW INDEXES
-- ============================================================================

DROP INDEX IF EXISTS idx_kehadiran_kelas_id;
DROP INDEX IF EXISTS idx_kehadiran_tanggal;
DROP INDEX IF EXISTS idx_kehadiran_kelas_tanggal;
DROP INDEX IF EXISTS idx_kehadiran_mahasiswa_kelas;
DROP INDEX IF EXISTS idx_kehadiran_status;

RAISE NOTICE '✅ Removed new indexes';

-- ============================================================================
-- PART 6: RESTORE ORIGINAL RLS POLICIES
-- ============================================================================

-- Drop hybrid policies
DROP POLICY IF EXISTS "kehadiran_select_dosen" ON kehadiran;
DROP POLICY IF EXISTS "kehadiran_insert_dosen" ON kehadiran;
DROP POLICY IF EXISTS "kehadiran_update_dosen" ON kehadiran;
DROP POLICY IF EXISTS "kehadiran_select_mahasiswa" ON kehadiran;
DROP POLICY IF EXISTS "kehadiran_admin_all" ON kehadiran;

-- Restore original policies (jadwal-based only)
CREATE POLICY "kehadiran_select_dosen" ON kehadiran
    FOR SELECT
    USING (
        is_dosen() AND
        jadwal_id IN (
            SELECT j.id FROM jadwal_praktikum j
            JOIN kelas k ON j.kelas_id = k.id
            WHERE k.dosen_id = get_dosen_id()
        )
    );

CREATE POLICY "kehadiran_insert_dosen" ON kehadiran
    FOR INSERT
    WITH CHECK (
        is_dosen() AND
        jadwal_id IN (
            SELECT j.id FROM jadwal_praktikum j
            JOIN kelas k ON j.kelas_id = k.id
            WHERE k.dosen_id = get_dosen_id()
        )
    );

CREATE POLICY "kehadiran_update_dosen" ON kehadiran
    FOR UPDATE
    USING (
        is_dosen() AND
        jadwal_id IN (
            SELECT j.id FROM jadwal_praktikum j
            JOIN kelas k ON j.kelas_id = k.id
            WHERE k.dosen_id = get_dosen_id()
        )
    );

CREATE POLICY "kehadiran_select_mahasiswa" ON kehadiran
    FOR SELECT
    USING (
        is_mahasiswa() AND
        mahasiswa_id = get_mahasiswa_id()
    );

CREATE POLICY "kehadiran_admin_all" ON kehadiran
    FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

RAISE NOTICE '✅ Restored original RLS policies';

-- ============================================================================
-- PART 7: RESTORE jadwal_id NOT NULL CONSTRAINT
-- ============================================================================

-- First, ensure all records have jadwal_id
DO $$
DECLARE
    null_jadwal_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_jadwal_count
    FROM kehadiran
    WHERE jadwal_id IS NULL;

    IF null_jadwal_count > 0 THEN
        RAISE EXCEPTION 'Cannot restore NOT NULL constraint: % records have NULL jadwal_id. Delete or fix these records first.', null_jadwal_count;
    END IF;
END $$;

-- Restore NOT NULL constraint
ALTER TABLE kehadiran
ALTER COLUMN jadwal_id SET NOT NULL;

RAISE NOTICE '✅ Restored jadwal_id NOT NULL constraint';

-- ============================================================================
-- PART 8: RESTORE ORIGINAL UNIQUE CONSTRAINT
-- ============================================================================

-- Restore original unique constraint
ALTER TABLE kehadiran
ADD CONSTRAINT kehadiran_unique UNIQUE (jadwal_id, mahasiswa_id);

RAISE NOTICE '✅ Restored original unique constraint';

-- ============================================================================
-- PART 9: REMOVE NEW COLUMNS
-- ============================================================================

-- Drop kelas_id column
ALTER TABLE kehadiran
DROP COLUMN IF EXISTS kelas_id CASCADE;

-- Drop tanggal column
ALTER TABLE kehadiran
DROP COLUMN IF EXISTS tanggal CASCADE;

RAISE NOTICE '✅ Removed kelas_id and tanggal columns';

-- ============================================================================
-- PART 10: VERIFICATION
-- ============================================================================

DO $$
DECLARE
    col_exists BOOLEAN;
BEGIN
    -- Check if kelas_id still exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'kehadiran' AND column_name = 'kelas_id'
    ) INTO col_exists;

    IF col_exists THEN
        RAISE EXCEPTION '❌ Rollback failed: kelas_id column still exists!';
    ELSE
        RAISE NOTICE '✅ Verified: kelas_id column removed';
    END IF;

    -- Check if tanggal still exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'kehadiran' AND column_name = 'tanggal'
    ) INTO col_exists;

    IF col_exists THEN
        RAISE EXCEPTION '❌ Rollback failed: tanggal column still exists!';
    ELSE
        RAISE NOTICE '✅ Verified: tanggal column removed';
    END IF;
END $$;

-- ============================================================================
-- ROLLBACK COMPLETE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ ROLLBACK COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '';
    RAISE NOTICE 'Kehadiran table has been restored to original schema:';
    RAISE NOTICE '- jadwal_id (NOT NULL)';
    RAISE NOTICE '- mahasiswa_id';
    RAISE NOTICE '- status';
    RAISE NOTICE '- keterangan';
    RAISE NOTICE '';
    RAISE NOTICE 'Backup table created: kehadiran_before_rollback_20241219';
    RAISE NOTICE 'Original backup table: kehadiran_backup_20241219';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Update application code to use jadwal_id instead of kelas_id';
    RAISE NOTICE '2. Review and migrate any lost data from backup tables';
    RAISE NOTICE '3. Drop backup tables when no longer needed';
    RAISE NOTICE '════════════════════════════════════════════════════════';
END $$;

*/

-- ============================================================================
-- TO RUN ROLLBACK:
-- ============================================================================
-- 1. UNCOMMENT all code between /* and */ above
-- 2. Review the warnings about data loss
-- 3. Run this script in Supabase SQL Editor
-- 4. Verify the rollback was successful
-- 5. Update your application code to match the original schema
-- ============================================================================
