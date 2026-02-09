-- ============================================================================
-- FIX: Unindexed Foreign Keys & Unused Indexes
-- Run this script di Supabase SQL Editor
-- ============================================================================
-- Part 1: Add indexes for unindexed foreign keys (RECOMMENDED)
-- Part 2: Drop unused indexes (OPTIONAL - review carefully before running)
-- ============================================================================

-- ============================================================================
-- PART 1: ADD INDEXES FOR UNINDEXED FOREIGN KEYS
-- These indexes improve JOIN and DELETE performance
-- ============================================================================

-- 1. conflict_log - resolved_by foreign key
CREATE INDEX IF NOT EXISTS idx_conflict_log_resolved_by 
    ON public.conflict_log(resolved_by);

-- 2. conflict_log - user_id foreign key
CREATE INDEX IF NOT EXISTS idx_conflict_log_user_id 
    ON public.conflict_log(user_id);

-- 3. jawaban - graded_by foreign key
CREATE INDEX IF NOT EXISTS idx_jawaban_graded_by 
    ON public.jawaban(graded_by);

-- 4. kuis - dosen_id foreign key
CREATE INDEX IF NOT EXISTS idx_kuis_dosen_id 
    ON public.kuis(dosen_id);

-- 5. mahasiswa_semester_audit - mahasiswa_id foreign key
CREATE INDEX IF NOT EXISTS idx_mahasiswa_semester_audit_mahasiswa_id 
    ON public.mahasiswa_semester_audit(mahasiswa_id);

-- 6. materi - dosen_id foreign key
CREATE INDEX IF NOT EXISTS idx_materi_dosen_id 
    ON public.materi(dosen_id);

-- 7. peminjaman - approved_by foreign key
CREATE INDEX IF NOT EXISTS idx_peminjaman_approved_by 
    ON public.peminjaman(approved_by);

-- 8. peminjaman - dosen_id foreign key
CREATE INDEX IF NOT EXISTS idx_peminjaman_dosen_id 
    ON public.peminjaman(dosen_id);

-- 9. pengumuman - penulis_id foreign key
CREATE INDEX IF NOT EXISTS idx_pengumuman_penulis_id 
    ON public.pengumuman(penulis_id);

-- 10. pengumuman - target_kelas_id foreign key
CREATE INDEX IF NOT EXISTS idx_pengumuman_target_kelas_id 
    ON public.pengumuman(target_kelas_id);

-- 11. permintaan_perbaikan_nilai - nilai_id foreign key
CREATE INDEX IF NOT EXISTS idx_permintaan_perbaikan_nilai_nilai_id 
    ON public.permintaan_perbaikan_nilai(nilai_id);

-- 12. sensitive_operations - audit_log_id foreign key
CREATE INDEX IF NOT EXISTS idx_sensitive_operations_audit_log_id 
    ON public.sensitive_operations(audit_log_id);

-- 13. sensitive_operations - reviewed_by foreign key
CREATE INDEX IF NOT EXISTS idx_sensitive_operations_reviewed_by 
    ON public.sensitive_operations(reviewed_by);

-- ============================================================================
-- VERIFY FOREIGN KEY INDEXES
-- ============================================================================

SELECT 
    'Foreign Key Indexes Created' as status,
    count(*) as count
FROM pg_indexes 
WHERE indexname IN (
    'idx_conflict_log_resolved_by',
    'idx_conflict_log_user_id',
    'idx_jawaban_graded_by',
    'idx_kuis_dosen_id',
    'idx_mahasiswa_semester_audit_mahasiswa_id',
    'idx_materi_dosen_id',
    'idx_peminjaman_approved_by',
    'idx_peminjaman_dosen_id',
    'idx_pengumuman_penulis_id',
    'idx_pengumuman_target_kelas_id',
    'idx_permintaan_perbaikan_nilai_nilai_id',
    
    'idx_sensitive_operations_audit_log_id',
    'idx_sensitive_operations_reviewed_by'
);

-- ============================================================================
-- PART 2: UNUSED INDEXES (OPTIONAL - REVIEW CAREFULLY)
-- ============================================================================
-- WARNING: These indexes are reported as unused, but:
-- 1. The application might not have been used enough to trigger them
-- 2. Some might be needed for future features
-- 3. Some might be used by background processes not tracked by stats
--
-- RECOMMENDATION: Keep most indexes, especially:
-- - Primary lookup indexes (user_id, dosen_id, etc.)
-- - Search indexes (GIN indexes for text search)
-- - Status/filter indexes that might be used in admin queries
--
-- SAFE TO DROP: Redundant or clearly obsolete indexes
-- ============================================================================

-- Uncomment the lines below ONLY if you want to drop unused indexes
-- Make sure to backup your database first!

/*
-- ============================================================================
-- SAFE TO DROP - These appear redundant or unused
-- ============================================================================

-- jadwal_praktikum - multiple similar indexes
DROP INDEX IF EXISTS idx_jadwal_praktikum_status;
DROP INDEX IF EXISTS idx_jadwal_praktikum_cancelled_by;

-- audit_logs_archive - too many indexes, keep only essential ones
DROP INDEX IF EXISTS audit_logs_archive_success_idx;
DROP INDEX IF EXISTS audit_logs_archive_user_role_idx;

-- ============================================================================
-- KEEP FOR NOW - Might be used in production
-- ============================================================================
-- These indexes are marked unused but likely important:
-- - idx_jadwal_praktikum_dosen_id (for dosen queries)
-- - idx_users_role (for role-based filtering)
-- - idx_dosen_user_id (for dosen lookup)
-- - idx_laboran_user_id (for laboran lookup)
-- - idx_kuis_status (for quiz filtering)
-- - idx_soal_kuis_id (for soal lookup)
-- - idx_attempt_status (for attempt filtering)
-- - All search indexes (GIN indexes)

*/

-- ============================================================================
-- ANALYZE TABLES - Update statistics after adding indexes
-- ============================================================================

ANALYZE public.conflict_log;
ANALYZE public.jawaban;
ANALYZE public.kuis;
ANALYZE public.mahasiswa_semester_audit;
ANALYZE public.materi;
ANALYZE public.peminjaman;
ANALYZE public.pengumuman;
ANALYZE public.permintaan_perbaikan_nilai;
ANALYZE public.sensitive_operations;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Foreign key indexes created successfully!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Indexes added for:';
    RAISE NOTICE '   - conflict_log (resolved_by, user_id)';
    RAISE NOTICE '   - jawaban (graded_by)';
    RAISE NOTICE '   - kuis (dosen_id)';
    RAISE NOTICE '   - mahasiswa_semester_audit (mahasiswa_id)';
    RAISE NOTICE '   - materi (dosen_id)';
    RAISE NOTICE '   - peminjaman (approved_by, dosen_id)';
    RAISE NOTICE '   - pengumuman (penulis_id, target_kelas_id)';
    RAISE NOTICE '   - permintaan_perbaikan_nilai (nilai_id)';
    RAISE NOTICE '   - sensitive_operations (audit_log_id, reviewed_by)';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  Unused indexes NOT dropped - review Part 2 carefully';
    RAISE NOTICE '    before deciding to drop any indexes.';
END $$;
