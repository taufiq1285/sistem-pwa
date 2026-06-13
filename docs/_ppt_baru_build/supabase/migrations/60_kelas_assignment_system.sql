-- ============================================================================
-- KELAS ASSIGNMENT SYSTEM
-- Dosen Self-Assignment dengan Admin Oversight
-- ============================================================================
-- Description: Sistem assignment dosen ke kelas
-- Features:
-- - Dosen dapat self-assign ke kombinasi Mata Kuliah + Kelas
-- - Admin dapat view, reassign, dan unassign
-- - Audit logging otomatis untuk tracking perubahan
-- - Notifikasi otomatis saat reassignment
-- ============================================================================

-- ============================================================================
-- 1. PERFORMANCE INDEX
-- ============================================================================

-- Index untuk query assignment (filter by dosen atau mata kuliah)
CREATE INDEX IF NOT EXISTS idx_kelas_assignment ON kelas(dosen_id, mata_kuliah_id)
WHERE dosen_id IS NOT NULL;

COMMENT ON INDEX idx_kelas_assignment IS
'Performance index untuk query kelas assignment - filtered untuk hanya assigned kelas';

-- ============================================================================
-- 2. DATA INTEGRITY CONSTRAINT
-- ============================================================================

-- Ensure both dosen_id dan mata_kuliah_id di-set bersamaan atau keduanya NULL
DO $$
BEGIN
  -- Check if constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'kelas'::regclass
    AND conname = 'check_assignment_complete'
  ) THEN
    ALTER TABLE kelas ADD CONSTRAINT check_assignment_complete
    CHECK (
      (dosen_id IS NULL AND mata_kuliah_id IS NULL) OR
      (dosen_id IS NOT NULL AND mata_kuliah_id IS NOT NULL)
    );
  END IF;
END $$;

COMMENT ON CONSTRAINT check_assignment_complete ON kelas IS
'Ensures kelas assignment is complete - both dosen_id and mata_kuliah_id must be set together or both NULL';

-- ============================================================================
-- 3. AUDIT TRIGGER FUNCTION
-- ============================================================================

/**
 * Log kelas assignment changes ke audit_logs
 * Triggered on UPDATE when dosen_id or mata_kuliah_id changes
 */
CREATE OR REPLACE FUNCTION log_kelas_assignment_change()
RETURNS TRIGGER AS $$
DECLARE
  v_action TEXT;
  v_user_role TEXT;
  v_resource_description TEXT;
BEGIN
  -- Only log if assignment fields changed
  IF (OLD.dosen_id IS DISTINCT FROM NEW.dosen_id)
     OR (OLD.mata_kuliah_id IS DISTINCT FROM NEW.mata_kuliah_id) THEN

    -- Determine action type
    v_action := CASE
      WHEN OLD.dosen_id IS NULL AND NEW.dosen_id IS NOT NULL THEN 'assign'
      WHEN OLD.dosen_id IS NOT NULL AND NEW.dosen_id IS NULL THEN 'unassign'
      ELSE 'reassign'
    END;

    -- Get current user role
    SELECT role INTO v_user_role FROM users WHERE id = auth.uid();

    -- Build resource description
    v_resource_description := 'Kelas: ' || NEW.nama_kelas ||
                              ' (' || NEW.tahun_ajaran ||
                              ', Semester ' || NEW.semester_ajaran || ')';

    -- Log to audit_logs via existing function
    PERFORM log_audit_event(
      v_action,                           -- action
      'kelas_assignment',                 -- resource_type
      NEW.id,                             -- resource_id
      jsonb_build_object(                 -- old_values
        'dosen_id', OLD.dosen_id,
        'mata_kuliah_id', OLD.mata_kuliah_id
      ),
      jsonb_build_object(                 -- new_values
        'dosen_id', NEW.dosen_id,
        'mata_kuliah_id', NEW.mata_kuliah_id
      ),
      TRUE,                               -- success
      NULL,                               -- error_message
      jsonb_build_object(                 -- metadata
        'kelas_nama', NEW.nama_kelas,
        'tahun_ajaran', NEW.tahun_ajaran,
        'semester_ajaran', NEW.semester_ajaran,
        'user_role', v_user_role,
        'triggered_by', 'database_trigger'
      )
    );

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_kelas_assignment_change IS
'Audit trigger - logs all kelas assignment changes (assign, unassign, reassign)';

-- ============================================================================
-- 4. APPLY AUDIT TRIGGER
-- ============================================================================

DROP TRIGGER IF EXISTS kelas_assignment_audit ON kelas;

CREATE TRIGGER kelas_assignment_audit
  AFTER UPDATE ON kelas
  FOR EACH ROW
  EXECUTE FUNCTION log_kelas_assignment_change();

COMMENT ON TRIGGER kelas_assignment_audit ON kelas IS
'Audit trigger - logs assignment changes to audit_logs table';

-- ============================================================================
-- 5. HELPER VIEWS
-- ============================================================================

/**
 * View: Kelas assignments dengan informasi lengkap
 * Untuk admin dashboard dan reporting
 */
CREATE OR REPLACE VIEW v_kelas_assignments AS
SELECT
  k.id AS kelas_id,
  k.nama_kelas,
  k.kode_kelas,
  k.tahun_ajaran,
  k.semester_ajaran,
  k.kuota,
  k.is_active,

  -- Dosen info
  k.dosen_id,
  u_dosen.full_name AS dosen_name,
  u_dosen.email AS dosen_email,

  -- Mata kuliah info
  k.mata_kuliah_id,
  mk.nama_mk AS mata_kuliah_nama,
  mk.kode_mk AS mata_kuliah_kode,

  -- Stats
  COALESCE(
    (SELECT COUNT(*)
     FROM kelas_mahasiswa km
     WHERE km.kelas_id = k.id AND km.is_active = TRUE),
    0
  ) AS mahasiswa_count,

  -- Assignment status
  CASE
    WHEN k.dosen_id IS NULL THEN 'unassigned'
    ELSE 'assigned'
  END AS assignment_status,

  k.created_at,
  k.updated_at

FROM kelas k
LEFT JOIN dosen d ON k.dosen_id = d.id
LEFT JOIN users u_dosen ON d.user_id = u_dosen.id
LEFT JOIN mata_kuliah mk ON k.mata_kuliah_id = mk.id
ORDER BY k.tahun_ajaran DESC, k.semester_ajaran DESC, k.nama_kelas;

COMMENT ON VIEW v_kelas_assignments IS
'View: Kelas assignments dengan informasi dosen, mata kuliah, dan jumlah mahasiswa';

/**
 * View: Available kelas untuk dosen self-assignment
 * Only shows kelas yang belum di-assign
 */
CREATE OR REPLACE VIEW v_available_kelas AS
SELECT
  k.id AS kelas_id,
  k.nama_kelas,
  k.tahun_ajaran,
  k.semester_ajaran,
  k.kuota,
  k.is_active,
  k.created_at,
  k.updated_at
FROM kelas k
WHERE k.dosen_id IS NULL
  AND k.mata_kuliah_id IS NULL
  AND k.is_active = TRUE
ORDER BY k.tahun_ajaran DESC, k.semester_ajaran DESC, k.nama_kelas;

COMMENT ON VIEW v_available_kelas IS
'View: Kelas yang available untuk dosen self-assignment (belum ada dosen)';

-- ============================================================================
-- 6. HELPER FUNCTIONS
-- ============================================================================

/**
 * Get assignment statistics
 * Returns counts of assigned/unassigned kelas
 */
CREATE OR REPLACE FUNCTION get_assignment_stats()
RETURNS TABLE (
  total_kelas BIGINT,
  assigned_kelas BIGINT,
  unassigned_kelas BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_kelas,
    COUNT(*) FILTER (WHERE dosen_id IS NOT NULL)::BIGINT AS assigned_kelas,
    COUNT(*) FILTER (WHERE dosen_id IS NULL)::BIGINT AS unassigned_kelas
  FROM kelas
  WHERE is_active = TRUE;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_assignment_stats() TO authenticated;

COMMENT ON FUNCTION get_assignment_stats IS
'Get assignment statistics - total, assigned, and unassigned kelas counts';

/**
 * Check if kelas can be unassigned
 * Returns false if students are enrolled
 */
CREATE OR REPLACE FUNCTION can_unassign_kelas(p_kelas_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_student_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_student_count
  FROM kelas_mahasiswa
  WHERE kelas_id = p_kelas_id AND is_active = TRUE;

  RETURN v_student_count = 0;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION can_unassign_kelas(UUID) TO authenticated;

COMMENT ON FUNCTION can_unassign_kelas IS
'Check if kelas can be unassigned - returns false if students enrolled';

-- ============================================================================
-- 7. GRANTS & PERMISSIONS
-- ============================================================================

-- Grant SELECT on views to authenticated users
GRANT SELECT ON v_kelas_assignments TO authenticated;
GRANT SELECT ON v_available_kelas TO authenticated;

-- ============================================================================
-- 8. VERIFICATION QUERIES
-- ============================================================================

-- Verify index created
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE indexname = 'idx_kelas_assignment';

-- Verify constraint added
SELECT
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'kelas'::regclass
AND conname = 'check_assignment_complete';

-- Verify trigger created
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'kelas_assignment_audit';

-- Verify views created
SELECT
  viewname,
  definition
FROM pg_views
WHERE viewname IN ('v_kelas_assignments', 'v_available_kelas')
AND schemaname = 'public';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '
  ============================================================
  ✅ KELAS ASSIGNMENT SYSTEM MIGRATION COMPLETE
  ============================================================

  📊 Components Installed:
  ✓ Performance index: idx_kelas_assignment
  ✓ Data integrity constraint: check_assignment_complete
  ✓ Audit trigger: kelas_assignment_audit
  ✓ Helper views: v_kelas_assignments, v_available_kelas
  ✓ Helper functions: get_assignment_stats(), can_unassign_kelas()

  🎯 Features Enabled:
  - Dosen self-assignment to Mata Kuliah + Kelas
  - Admin oversight (view, reassign, unassign)
  - Automatic audit logging for all assignment changes
  - Performance optimized queries
  - Data integrity validation

  📝 Next Steps:
  1. Implement assignment.api.ts (TypeScript API layer)
  2. Create dosen assignment UI (/dosen/assignment)
  3. Create admin assignment UI (/admin/assignment-dosen)
  4. Test assignment workflows
  5. Monitor audit logs

  ============================================================
  ';
END $$;
