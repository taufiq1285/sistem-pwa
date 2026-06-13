-- ============================================================================
-- ENABLE JADWAL PRAKTIKUM APPROVAL WORKFLOW
-- ============================================================================
-- Description: Change jadwal_praktikum default is_active from TRUE to FALSE
--              to enable room booking approval workflow by laboran
-- Date: 2025-12-09
-- Impact: Only NEW jadwal will default to pending (is_active = false)
--         Existing jadwal remain active (is_active = true)
-- ============================================================================

-- ============================================================================
-- STEP 1: Add index for pending jadwal (performance optimization)
-- ============================================================================

-- Index untuk query pending jadwal oleh laboran
-- WHERE is_active = false akan digunakan oleh getPendingRoomBookings()
CREATE INDEX IF NOT EXISTS idx_jadwal_pending
ON jadwal_praktikum(is_active, created_at DESC)
WHERE is_active = false;

COMMENT ON INDEX idx_jadwal_pending IS
'Index for fetching pending room bookings by laboran. Used in approval workflow.';

-- ============================================================================
-- STEP 2: Change default value for is_active column
-- ============================================================================

-- IMPORTANT: This ONLY affects NEW records
-- Existing jadwal with is_active = true remain unchanged
ALTER TABLE jadwal_praktikum
ALTER COLUMN is_active SET DEFAULT false;

-- ============================================================================
-- STEP 3: Update RLS policies for better access control
-- ============================================================================

-- Drop the broad "select all" policy
DROP POLICY IF EXISTS "jadwal_praktikum_select_all" ON jadwal_praktikum;

-- ============================================================================
-- ADMIN: Can see all jadwal (approved & pending)
-- ============================================================================
CREATE POLICY "jadwal_select_admin" ON jadwal_praktikum
    FOR SELECT
    USING (is_admin());

-- ============================================================================
-- LABORAN: Can see all jadwal (for approval workflow)
-- ============================================================================
CREATE POLICY "jadwal_select_laboran" ON jadwal_praktikum
    FOR SELECT
    USING (is_laboran());

-- ============================================================================
-- DOSEN: Can see approved jadwal + their own pending jadwal
-- ============================================================================
CREATE POLICY "jadwal_select_dosen" ON jadwal_praktikum
    FOR SELECT
    USING (
        is_dosen()
        AND (
            is_active = true  -- All approved schedules
            OR (
                -- Own pending schedules
                is_active = false
                AND kelas_id IN (
                    SELECT id FROM kelas WHERE dosen_id = get_current_dosen_id()
                )
            )
        )
    );

-- ============================================================================
-- MAHASISWA: Can ONLY see approved jadwal for their enrolled kelas
-- ============================================================================
CREATE POLICY "jadwal_select_mahasiswa" ON jadwal_praktikum
    FOR SELECT
    USING (
        is_mahasiswa()
        AND is_active = true  -- Only approved schedules
        AND kelas_id = ANY(get_mahasiswa_kelas_ids())
    );

-- ============================================================================
-- VERIFICATION QUERIES (for testing)
-- ============================================================================

-- Check default value changed
SELECT
    column_name,
    column_default,
    data_type
FROM information_schema.columns
WHERE table_name = 'jadwal_praktikum'
  AND column_name = 'is_active';
-- Expected: column_default = 'false'

-- Check indexes exist
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'jadwal_praktikum'
  AND indexname IN ('idx_jadwal_active', 'idx_jadwal_pending');
-- Expected: Both indexes exist

-- Check RLS policies
SELECT
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'jadwal_praktikum'
ORDER BY policyname;
-- Expected: 4 SELECT policies (admin, laboran, dosen, mahasiswa)

-- ============================================================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================================================
/*
-- Restore default to true
ALTER TABLE jadwal_praktikum
ALTER COLUMN is_active SET DEFAULT true;

-- Drop new index
DROP INDEX IF EXISTS idx_jadwal_pending;

-- Restore old policy
DROP POLICY IF EXISTS "jadwal_select_admin" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_select_laboran" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_select_dosen" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_select_mahasiswa" ON jadwal_praktikum;

CREATE POLICY "jadwal_praktikum_select_all" ON jadwal_praktikum
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Approve all pending jadwal (if any)
UPDATE jadwal_praktikum
SET is_active = true
WHERE is_active = false;
*/

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. Existing jadwal remain is_active = true (not affected)
-- 2. New jadwal will default to is_active = false (pending approval)
-- 3. Laboran can approve via /laboran/persetujuan page
-- 4. approveRoomBooking() function will set is_active = true
-- 5. Mahasiswa will only see approved jadwal in their calendar
-- 6. Dosen can see their own pending jadwal for tracking
-- ============================================================================
