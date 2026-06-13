-- ============================================================================
-- FIX: Allow All Dosen to See All Active Kelas
-- ============================================================================
-- Issue: Dosen can only see kelas where dosen_id = their ID
-- Solution: Allow all dosen to see all active kelas (multi-dosen can use same kelas)
-- ============================================================================

-- Drop old restrictive policy
DROP POLICY IF EXISTS "kelas_select_dosen" ON kelas;

-- Create new flexible policy
CREATE POLICY "kelas_select_dosen" ON kelas
    FOR SELECT
    USING (
        is_dosen() AND is_active = TRUE
    );

COMMENT ON POLICY "kelas_select_dosen" ON kelas IS 
'Allow all dosen to see all active kelas - supports multi-dosen workflow';
