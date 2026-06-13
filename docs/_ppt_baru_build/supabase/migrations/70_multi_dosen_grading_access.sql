-- ============================================================================
-- MULTI-DOSEN GRADING ACCESS
-- ============================================================================
-- Purpose: Allow multiple dosen teaching same mata kuliah to grade student work
-- Scenario: Dosen A dan Dosen B mengajar "Praktikum Kimia" di kelas berbeda
--           Both should be able to grade laporan from any student in that mata kuliah
-- ============================================================================

-- ============================================================================
-- 1. ADD mata_kuliah_id TO kuis TABLE
-- ============================================================================

-- Add column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'kuis' AND column_name = 'mata_kuliah_id'
  ) THEN
    ALTER TABLE kuis ADD COLUMN mata_kuliah_id UUID REFERENCES mata_kuliah(id) ON DELETE SET NULL;
    
    COMMENT ON COLUMN kuis.mata_kuliah_id IS 
    'Mata kuliah reference - allows multiple dosen teaching same MK to access student work';
  END IF;
END $$;

-- Populate mata_kuliah_id from kelas relationship
UPDATE kuis k
SET mata_kuliah_id = (
  SELECT kl.mata_kuliah_id 
  FROM kelas kl 
  WHERE kl.id = k.kelas_id
)
WHERE mata_kuliah_id IS NULL AND kelas_id IS NOT NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_kuis_mata_kuliah ON kuis(mata_kuliah_id)
WHERE mata_kuliah_id IS NOT NULL;

COMMENT ON INDEX idx_kuis_mata_kuliah IS
'Performance index for filtering kuis by mata kuliah - supports multi-dosen grading queries';

-- ============================================================================
-- 2. HELPER FUNCTION: Check if dosen teaches mata kuliah
-- ============================================================================

/**
 * Check if dosen teaches specific mata kuliah
 * Returns TRUE if dosen has any active kelas for this mata kuliah
 */
CREATE OR REPLACE FUNCTION dosen_teaches_mata_kuliah(p_mata_kuliah_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_dosen UUID;
    v_teaches BOOLEAN;
BEGIN
    -- Get current dosen ID
    v_current_dosen := get_current_dosen_id();
    
    IF v_current_dosen IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check if dosen has any active kelas for this mata kuliah
    SELECT EXISTS (
        SELECT 1 
        FROM kelas
        WHERE mata_kuliah_id = p_mata_kuliah_id
        AND dosen_id = v_current_dosen
        AND is_active = TRUE
    ) INTO v_teaches;
    
    RETURN COALESCE(v_teaches, FALSE);
END;
$$;

COMMENT ON FUNCTION dosen_teaches_mata_kuliah(UUID) IS
'Returns TRUE if current dosen teaches the specified mata kuliah (has any active kelas for it)';

-- ============================================================================
-- 3. UPDATE RLS POLICIES FOR MULTI-DOSEN ACCESS
-- ============================================================================

-- Drop old restrictive policies
DROP POLICY IF EXISTS "kuis_select_dosen" ON kuis;
DROP POLICY IF EXISTS "attempt_kuis_select_dosen" ON attempt_kuis;
DROP POLICY IF EXISTS "attempt_kuis_update_dosen" ON attempt_kuis;
DROP POLICY IF EXISTS "jawaban_select_dosen" ON jawaban;
DROP POLICY IF EXISTS "jawaban_update_dosen" ON jawaban;

-- ============================================================================
-- KUIS: Dosen can see kuis if they teach the mata kuliah OR own the kuis
-- ============================================================================

CREATE POLICY "kuis_select_dosen" ON kuis
    FOR SELECT
    USING (
        is_dosen() AND (
            -- Own kuis (original creator)
            dosen_id = get_current_dosen_id()
            OR
            -- Teaching same mata kuliah (co-teaching access)
            (mata_kuliah_id IS NOT NULL AND dosen_teaches_mata_kuliah(mata_kuliah_id))
        )
    );

COMMENT ON POLICY "kuis_select_dosen" ON kuis IS
'Dosen can see: (1) their own kuis, (2) kuis from mata kuliah they teach - supports multi-dosen grading';

-- ============================================================================
-- ATTEMPT_KUIS: Dosen can see attempts if they teach the mata kuliah
-- ============================================================================

CREATE POLICY "attempt_kuis_select_dosen" ON attempt_kuis
    FOR SELECT
    USING (
        is_dosen()
        AND kuis_id IN (
            SELECT id FROM kuis 
            WHERE dosen_id = get_current_dosen_id()  -- Own kuis
            OR (mata_kuliah_id IS NOT NULL AND dosen_teaches_mata_kuliah(mata_kuliah_id))  -- Co-teaching
        )
    );

COMMENT ON POLICY "attempt_kuis_select_dosen" ON attempt_kuis IS
'Dosen can see attempts for: (1) their own kuis, (2) kuis from mata kuliah they teach';

-- ============================================================================
-- ATTEMPT_KUIS UPDATE: Dosen can grade if they teach the mata kuliah
-- ============================================================================

CREATE POLICY "attempt_kuis_update_dosen" ON attempt_kuis
    FOR UPDATE
    USING (
        is_dosen()
        AND kuis_id IN (
            SELECT id FROM kuis 
            WHERE dosen_id = get_current_dosen_id()
            OR (mata_kuliah_id IS NOT NULL AND dosen_teaches_mata_kuliah(mata_kuliah_id))
        )
    );

COMMENT ON POLICY "attempt_kuis_update_dosen" ON attempt_kuis IS
'Dosen can grade attempts from mata kuliah they teach - enables co-teaching grading workflow';

-- ============================================================================
-- JAWABAN: Dosen can see/update if they teach the mata kuliah
-- ============================================================================

CREATE POLICY "jawaban_select_dosen" ON jawaban
    FOR SELECT
    USING (
        is_dosen()
        AND attempt_id IN (
            SELECT ak.id FROM attempt_kuis ak
            INNER JOIN kuis k ON ak.kuis_id = k.id
            WHERE k.dosen_id = get_current_dosen_id()
            OR (k.mata_kuliah_id IS NOT NULL AND dosen_teaches_mata_kuliah(k.mata_kuliah_id))
        )
    );

COMMENT ON POLICY "jawaban_select_dosen" ON jawaban IS
'Dosen can see jawaban from mata kuliah they teach';

CREATE POLICY "jawaban_update_dosen" ON jawaban
    FOR UPDATE
    USING (
        is_dosen()
        AND attempt_id IN (
            SELECT ak.id FROM attempt_kuis ak
            INNER JOIN kuis k ON ak.kuis_id = k.id
            WHERE k.dosen_id = get_current_dosen_id()
            OR (k.mata_kuliah_id IS NOT NULL AND dosen_teaches_mata_kuliah(k.mata_kuliah_id))
        )
    );

COMMENT ON POLICY "jawaban_update_dosen" ON jawaban IS
'Dosen can grade jawaban from mata kuliah they teach - supports file upload grading';

-- ============================================================================
-- 4. CREATE TRIGGER TO AUTO-POPULATE mata_kuliah_id (OPTIONAL FALLBACK)
-- ============================================================================

/**
 * Automatically set mata_kuliah_id when kuis is created
 * 
 * WORKFLOW SUPPORT:
 * - PRIMARY: Dosen explicitly selects mata_kuliah when creating tugas (recommended)
 * - FALLBACK: If mata_kuliah_id is NULL, auto-populate from kelas relationship
 * 
 * Use case:
 * - Dosen pilih mata kuliah + kelas → mata_kuliah_id sudah diset
 * - Legacy tugas (tanpa mata_kuliah) → auto-fill dari kelas jika available
 */
CREATE OR REPLACE FUNCTION auto_set_kuis_mata_kuliah()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only set if mata_kuliah_id is NULL and kelas_id exists
    -- This is a FALLBACK - dosen should explicitly set mata_kuliah_id in UI
    IF NEW.mata_kuliah_id IS NULL AND NEW.kelas_id IS NOT NULL THEN
        SELECT mata_kuliah_id INTO NEW.mata_kuliah_id
        FROM kelas
        WHERE id = NEW.kelas_id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_auto_set_kuis_mata_kuliah ON kuis;
CREATE TRIGGER trigger_auto_set_kuis_mata_kuliah
    BEFORE INSERT OR UPDATE ON kuis
    FOR EACH ROW
    EXECUTE FUNCTION auto_set_kuis_mata_kuliah();

COMMENT ON FUNCTION auto_set_kuis_mata_kuliah() IS
'Fallback: Auto-populate mata_kuliah_id from kelas if not explicitly set by dosen. Primary workflow: dosen selects mata_kuliah explicitly in UI.';

-- ============================================================================
-- 5. CREATE VIEW: Multi-Dosen Grading Dashboard
-- ============================================================================

/**
 * View for dosen to see all students work they can grade
 * Includes both own kuis and co-teaching mata kuliah
 */
CREATE OR REPLACE VIEW v_dosen_grading_access AS
SELECT 
    k.id AS kuis_id,
    k.judul AS kuis_judul,
    k.deskripsi AS kuis_deskripsi,
    k.dosen_id AS kuis_creator_dosen_id,
    k.mata_kuliah_id,
    mk.kode_mk,
    mk.nama_mk,
    
    -- Kelas info
    kl.id AS kelas_id,
    kl.nama_kelas,
    kl.dosen_id AS kelas_dosen_id,
    
    -- Creator dosen info
    d_creator.user_id AS creator_user_id,
    u_creator.full_name AS creator_name,
    
    -- Kelas dosen info
    d_kelas.user_id AS kelas_dosen_user_id,
    u_kelas.full_name AS kelas_dosen_name,
    
    -- Stats
    (SELECT COUNT(*) FROM attempt_kuis WHERE kuis_id = k.id) AS total_attempts,
    (SELECT COUNT(*) FROM attempt_kuis WHERE kuis_id = k.id AND status = 'submitted') AS pending_grading,
    (SELECT COUNT(*) FROM attempt_kuis WHERE kuis_id = k.id AND status = 'graded') AS graded_count,
    
    k.created_at,
    k.tanggal_selesai
    
FROM kuis k
LEFT JOIN mata_kuliah mk ON k.mata_kuliah_id = mk.id
LEFT JOIN kelas kl ON k.kelas_id = kl.id
LEFT JOIN dosen d_creator ON k.dosen_id = d_creator.id
LEFT JOIN users u_creator ON d_creator.user_id = u_creator.id
LEFT JOIN dosen d_kelas ON kl.dosen_id = d_kelas.id
LEFT JOIN users u_kelas ON d_kelas.user_id = u_kelas.id
WHERE k.status = 'published'
ORDER BY k.tanggal_selesai DESC NULLS LAST, k.created_at DESC;

COMMENT ON VIEW v_dosen_grading_access IS
'Dashboard view for dosen showing all kuis they can grade (own + co-teaching) with statistics';

-- ============================================================================
-- 6. GRANT PERMISSIONS
-- ============================================================================

-- Grant execute on helper function
GRANT EXECUTE ON FUNCTION dosen_teaches_mata_kuliah(UUID) TO authenticated;

-- Grant select on view
GRANT SELECT ON v_dosen_grading_access TO authenticated;

-- ============================================================================
-- VERIFICATION QUERIES (commented out - for testing)
-- ============================================================================

/*
-- Test 1: Check if mata_kuliah_id populated correctly
SELECT 
    k.id, 
    k.judul,
    k.kelas_id,
    k.mata_kuliah_id,
    kl.mata_kuliah_id AS kelas_mk_id,
    mk.nama_mk
FROM kuis k
LEFT JOIN kelas kl ON k.kelas_id = kl.id
LEFT JOIN mata_kuliah mk ON k.mata_kuliah_id = mk.id
LIMIT 10;

-- Test 2: Check grading access view
SELECT * FROM v_dosen_grading_access LIMIT 10;

-- Test 3: Verify dosen can see co-teaching kuis
-- (Run as specific dosen)
SELECT 
    k.judul,
    k.dosen_id = get_current_dosen_id() AS is_creator,
    dosen_teaches_mata_kuliah(k.mata_kuliah_id) AS can_grade_via_mata_kuliah
FROM kuis k
WHERE k.mata_kuliah_id IS NOT NULL
LIMIT 10;
*/
