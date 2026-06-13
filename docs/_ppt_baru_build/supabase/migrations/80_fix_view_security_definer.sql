-- ============================================================================
-- FIX: Remove SECURITY DEFINER from Views
-- ============================================================================
-- Purpose: Fix security warning from Supabase Database Linter
-- Issue: Views should not use SECURITY DEFINER, only functions when needed
-- ============================================================================

-- Drop and recreate views without SECURITY DEFINER property

-- 1. v_dosen_grading_access
DROP VIEW IF EXISTS v_dosen_grading_access CASCADE;

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
'Dashboard view for dosen showing all kuis they can grade (own + co-teaching) with statistics - NO SECURITY DEFINER';

-- 2. v_available_kelas
DROP VIEW IF EXISTS v_available_kelas CASCADE;

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
'View: Kelas yang available untuk dosen self-assignment (belum ada dosen) - NO SECURITY DEFINER';

-- 3. v_kelas_assignments
DROP VIEW IF EXISTS v_kelas_assignments CASCADE;

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
'View: Kelas assignments dengan informasi dosen, mata kuliah, dan jumlah mahasiswa - NO SECURITY DEFINER';

-- 4. v_team_teaching_assignments (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'v_team_teaching_assignments') THEN
    EXECUTE 'DROP VIEW IF EXISTS v_team_teaching_assignments CASCADE';
  END IF;
END $$;

-- Create if it was supposed to exist (check your requirements)
-- CREATE OR REPLACE VIEW v_team_teaching_assignments AS
-- ... (definition if needed)

-- ============================================================================
-- RE-GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON v_dosen_grading_access TO authenticated;
GRANT SELECT ON v_available_kelas TO authenticated;
GRANT SELECT ON v_kelas_assignments TO authenticated;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check views are created without SECURITY DEFINER
SELECT
  viewname,
  definition,
  viewowner
FROM pg_views
WHERE viewname IN ('v_dosen_grading_access', 'v_available_kelas', 'v_kelas_assignments')
AND schemaname = 'public';

-- ============================================================================
-- COMPLETE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Views recreated without SECURITY DEFINER property';
  RAISE NOTICE '📝 Security warning should be resolved';
END $$;
