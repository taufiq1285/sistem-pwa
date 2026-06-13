-- ============================================================================
-- MIGRATION: Hybrid Kehadiran System
-- Date: 2024-12-19
-- Description: Add support for both jadwal-based and date-based attendance
-- ============================================================================
-- This migration enables flexible attendance input while maintaining
-- integration with scheduled practicum sessions.
--
-- Features:
-- 1. Support kehadiran via jadwal_praktikum (structured)
-- 2. Support kehadiran via kelas + tanggal (flexible)
-- 3. Maintains data integrity with proper constraints
-- 4. Backward compatible with existing data
-- ============================================================================

-- ============================================================================
-- PART 1: ADD NEW COLUMNS
-- ============================================================================

-- Add kelas_id column (for direct class-based attendance)
ALTER TABLE kehadiran
ADD COLUMN IF NOT EXISTS kelas_id UUID;

-- Add tanggal column (for date-based attendance)
ALTER TABLE kehadiran
ADD COLUMN IF NOT EXISTS tanggal DATE;

-- Add foreign key constraint for kelas_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'kehadiran_kelas_id_fkey'
    ) THEN
        ALTER TABLE kehadiran
        ADD CONSTRAINT kehadiran_kelas_id_fkey
        FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ============================================================================
-- PART 2: MIGRATE EXISTING DATA
-- ============================================================================

-- Populate kelas_id and tanggal for existing kehadiran records
-- (if they have jadwal_id)
UPDATE kehadiran k
SET
    kelas_id = j.kelas_id,
    tanggal = COALESCE(j.tanggal_praktikum, CURRENT_DATE)
FROM jadwal_praktikum j
WHERE k.jadwal_id = j.id
  AND k.kelas_id IS NULL;

-- Log migration results
DO $$
DECLARE
    migrated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO migrated_count
    FROM kehadiran
    WHERE jadwal_id IS NOT NULL AND kelas_id IS NOT NULL;

    RAISE NOTICE 'Migrated % existing kehadiran records with kelas_id and tanggal', migrated_count;
END $$;

-- ============================================================================
-- PART 3: MAKE jadwal_id NULLABLE
-- ============================================================================

-- Make jadwal_id optional (for backward compatibility and flexibility)
ALTER TABLE kehadiran
ALTER COLUMN jadwal_id DROP NOT NULL;

-- ============================================================================
-- PART 4: UPDATE CONSTRAINTS
-- ============================================================================

-- Drop old unique constraint
ALTER TABLE kehadiran
DROP CONSTRAINT IF EXISTS kehadiran_unique;

-- Add new unique constraint that handles both modes
-- Ensures one attendance record per mahasiswa per (jadwal OR kelas+tanggal)
ALTER TABLE kehadiran
ADD CONSTRAINT kehadiran_unique_hybrid
UNIQUE NULLS NOT DISTINCT (jadwal_id, kelas_id, tanggal, mahasiswa_id);

COMMENT ON CONSTRAINT kehadiran_unique_hybrid ON kehadiran IS
'Ensure unique attendance per student per jadwal OR per student per class+date';

-- Add CHECK constraint to ensure proper identifier usage
ALTER TABLE kehadiran
DROP CONSTRAINT IF EXISTS kehadiran_identifier_check;

ALTER TABLE kehadiran
ADD CONSTRAINT kehadiran_identifier_check CHECK (
    -- Either use jadwal_id (jadwal-based)
    (jadwal_id IS NOT NULL AND kelas_id IS NULL AND tanggal IS NULL) OR
    -- Or use kelas_id + tanggal (date-based)
    (jadwal_id IS NULL AND kelas_id IS NOT NULL AND tanggal IS NOT NULL) OR
    -- Or use all three (hybrid - both references)
    (jadwal_id IS NOT NULL AND kelas_id IS NOT NULL AND tanggal IS NOT NULL)
);

COMMENT ON CONSTRAINT kehadiran_identifier_check ON kehadiran IS
'Ensure kehadiran has either jadwal_id OR (kelas_id + tanggal) OR both';

-- ============================================================================
-- PART 5: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for kelas_id lookups
CREATE INDEX IF NOT EXISTS idx_kehadiran_kelas_id
ON kehadiran(kelas_id)
WHERE kelas_id IS NOT NULL;

-- Index for tanggal lookups
CREATE INDEX IF NOT EXISTS idx_kehadiran_tanggal
ON kehadiran(tanggal)
WHERE tanggal IS NOT NULL;

-- Composite index for common query pattern (kelas + tanggal)
CREATE INDEX IF NOT EXISTS idx_kehadiran_kelas_tanggal
ON kehadiran(kelas_id, tanggal)
WHERE kelas_id IS NOT NULL AND tanggal IS NOT NULL;

-- Index for mahasiswa lookups (for student attendance history)
CREATE INDEX IF NOT EXISTS idx_kehadiran_mahasiswa_kelas
ON kehadiran(mahasiswa_id, kelas_id)
WHERE kelas_id IS NOT NULL;

-- Composite index for status queries
CREATE INDEX IF NOT EXISTS idx_kehadiran_status
ON kehadiran(status)
WHERE status IS NOT NULL;

-- ============================================================================
-- PART 6: UPDATE RLS POLICIES (if needed)
-- ============================================================================

-- Drop and recreate policies to handle new columns
-- Ensure policies check both jadwal-based and kelas-based access

-- Policy for dosen to view kehadiran
DROP POLICY IF EXISTS "kehadiran_select_dosen" ON kehadiran;
CREATE POLICY "kehadiran_select_dosen" ON kehadiran
    FOR SELECT
    USING (
        is_dosen() AND (
            -- Via jadwal
            jadwal_id IN (
                SELECT j.id FROM jadwal_praktikum j
                WHERE j.dosen_id = get_dosen_id()
            )
            OR
            -- Via kelas
            kelas_id IN (
                SELECT k.id FROM kelas k
                WHERE k.dosen_id = get_dosen_id()
            )
        )
    );

COMMENT ON POLICY "kehadiran_select_dosen" ON kehadiran IS
'Allow dosen to view attendance for their classes (via jadwal or kelas)';

-- Policy for dosen to insert kehadiran
DROP POLICY IF EXISTS "kehadiran_insert_dosen" ON kehadiran;
CREATE POLICY "kehadiran_insert_dosen" ON kehadiran
    FOR INSERT
    WITH CHECK (
        is_dosen() AND (
            -- Via jadwal
            (jadwal_id IN (
                SELECT j.id FROM jadwal_praktikum j
                WHERE j.dosen_id = get_dosen_id()
            ))
            OR
            -- Via kelas
            (kelas_id IN (
                SELECT k.id FROM kelas k
                WHERE k.dosen_id = get_dosen_id()
            ))
        )
    );

COMMENT ON POLICY "kehadiran_insert_dosen" ON kehadiran IS
'Allow dosen to create attendance for their classes';

-- Policy for dosen to update kehadiran
DROP POLICY IF EXISTS "kehadiran_update_dosen" ON kehadiran;
CREATE POLICY "kehadiran_update_dosen" ON kehadiran
    FOR UPDATE
    USING (
        is_dosen() AND (
            jadwal_id IN (
                SELECT j.id FROM jadwal_praktikum j
                WHERE j.dosen_id = get_dosen_id()
            )
            OR
            kelas_id IN (
                SELECT k.id FROM kelas k
                WHERE k.dosen_id = get_dosen_id()
            )
        )
    );

COMMENT ON POLICY "kehadiran_update_dosen" ON kehadiran IS
'Allow dosen to update attendance for their classes';

-- Policy for mahasiswa to view their own kehadiran
DROP POLICY IF EXISTS "kehadiran_select_mahasiswa" ON kehadiran;
CREATE POLICY "kehadiran_select_mahasiswa" ON kehadiran
    FOR SELECT
    USING (
        is_mahasiswa() AND
        mahasiswa_id = get_mahasiswa_id()
    );

COMMENT ON POLICY "kehadiran_select_mahasiswa" ON kehadiran IS
'Allow mahasiswa to view their own attendance records';

-- Admin full access
DROP POLICY IF EXISTS "kehadiran_admin_all" ON kehadiran;
CREATE POLICY "kehadiran_admin_all" ON kehadiran
    FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

COMMENT ON POLICY "kehadiran_admin_all" ON kehadiran IS
'Allow admin full access to all attendance records';

-- ============================================================================
-- PART 7: CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to get kehadiran by kelas and date range
CREATE OR REPLACE FUNCTION get_kehadiran_by_kelas_daterange(
    p_kelas_id UUID,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    mahasiswa_id UUID,
    mahasiswa_nim VARCHAR,
    mahasiswa_nama VARCHAR,
    status VARCHAR,
    tanggal DATE,
    jadwal_id UUID,
    keterangan TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        k.id,
        k.mahasiswa_id,
        m.nim,
        u.full_name,
        k.status,
        k.tanggal,
        k.jadwal_id,
        k.keterangan,
        k.created_at
    FROM kehadiran k
    JOIN mahasiswa m ON k.mahasiswa_id = m.id
    JOIN users u ON m.user_id = u.id
    WHERE k.kelas_id = p_kelas_id
      AND (p_start_date IS NULL OR k.tanggal >= p_start_date)
      AND (p_end_date IS NULL OR k.tanggal <= p_end_date)
    ORDER BY k.tanggal DESC, m.nim;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_kehadiran_by_kelas_daterange IS
'Get attendance records for a class within optional date range';

-- Function to calculate attendance percentage
CREATE OR REPLACE FUNCTION calculate_attendance_percentage(
    p_mahasiswa_id UUID,
    p_kelas_id UUID
)
RETURNS NUMERIC AS $$
DECLARE
    total_sessions INTEGER;
    hadir_count INTEGER;
    percentage NUMERIC;
BEGIN
    -- Count total scheduled sessions for the class
    SELECT COUNT(*) INTO total_sessions
    FROM jadwal_praktikum
    WHERE kelas_id = p_kelas_id
      AND is_active = true
      AND status = 'approved';

    -- Count hadir records (status = 'hadir')
    SELECT COUNT(*) INTO hadir_count
    FROM kehadiran
    WHERE mahasiswa_id = p_mahasiswa_id
      AND kelas_id = p_kelas_id
      AND status = 'hadir';

    -- Calculate percentage
    IF total_sessions > 0 THEN
        percentage := ROUND((hadir_count::NUMERIC / total_sessions::NUMERIC) * 100, 2);
    ELSE
        -- If no scheduled sessions, use manual entries
        SELECT COUNT(*) INTO total_sessions
        FROM kehadiran
        WHERE mahasiswa_id = p_mahasiswa_id
          AND kelas_id = p_kelas_id;

        IF total_sessions > 0 THEN
            percentage := ROUND((hadir_count::NUMERIC / total_sessions::NUMERIC) * 100, 2);
        ELSE
            percentage := 0;
        END IF;
    END IF;

    RETURN percentage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION calculate_attendance_percentage IS
'Calculate attendance percentage for a student in a class';

-- ============================================================================
-- PART 8: VERIFICATION QUERIES
-- ============================================================================

-- Verify migration success
DO $$
DECLARE
    total_kehadiran INTEGER;
    with_jadwal INTEGER;
    with_kelas INTEGER;
    with_both INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_kehadiran FROM kehadiran;
    SELECT COUNT(*) INTO with_jadwal FROM kehadiran WHERE jadwal_id IS NOT NULL;
    SELECT COUNT(*) INTO with_kelas FROM kehadiran WHERE kelas_id IS NOT NULL;
    SELECT COUNT(*) INTO with_both FROM kehadiran WHERE jadwal_id IS NOT NULL AND kelas_id IS NOT NULL;

    RAISE NOTICE '=== MIGRATION VERIFICATION ===';
    RAISE NOTICE 'Total kehadiran records: %', total_kehadiran;
    RAISE NOTICE 'Records with jadwal_id: %', with_jadwal;
    RAISE NOTICE 'Records with kelas_id: %', with_kelas;
    RAISE NOTICE 'Records with both: %', with_both;
    RAISE NOTICE '==============================';
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log completion
DO $$
BEGIN
    RAISE NOTICE '✅ Migration 20241219000000_hybrid_kehadiran_system completed successfully!';
    RAISE NOTICE 'Kehadiran system now supports both jadwal-based and date-based attendance.';
END $$;
