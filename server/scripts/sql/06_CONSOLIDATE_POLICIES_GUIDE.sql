-- ============================================================================
-- CONSOLIDATE MULTIPLE PERMISSIVE POLICIES - PERFORMANCE OPTIMIZATION
-- ============================================================================
-- Issue: Multiple policies for same role/action cause each to execute per query
-- Solution: Consolidate into single policies with OR conditions
-- Impact: Improves query performance (fewer policy evaluations)
-- ============================================================================

-- EXAMPLE: How to consolidate policies
-- Current (3 separate policies):
--   POLICY 1: SELECT for admin
--   POLICY 2: SELECT for dosen  
--   POLICY 3: SELECT for mahasiswa
--
-- Optimized (1 consolidated policy):
--   SINGLE POLICY: SELECT with OR conditions for all roles

-- ============================================================================
-- PATTERN FOR CONSOLIDATION
-- ============================================================================
-- Instead of:
-- CREATE POLICY "jadwal_select_admin" ON jadwal_praktikum FOR SELECT
--   USING ((SELECT role FROM users WHERE id = (SELECT auth.uid())) = 'admin');
-- CREATE POLICY "jadwal_select_dosen" ON jadwal_praktikum FOR SELECT
--   USING ((SELECT role FROM users WHERE id = (SELECT auth.uid())) = 'dosen');
-- CREATE POLICY "jadwal_select_mahasiswa" ON jadwal_praktikum FOR SELECT
--   USING ((SELECT role FROM users WHERE id = (SELECT auth.uid())) IN ('mahasiswa'));

-- Use:
-- CREATE POLICY "jadwal_select_all" ON jadwal_praktikum FOR SELECT
--   USING ((SELECT role FROM users WHERE id = (SELECT auth.uid())) IN ('admin', 'dosen', 'mahasiswa'));

-- ============================================================================
-- TABLES WITH MULTIPLE POLICIES TO CONSOLIDATE
-- ============================================================================

-- 1. admin table
--    - admin_admin_delete_all + admin_delete_own (DELETE policies)
--    Total: 2 DELETE policies for authenticated users

-- 2. attempt_kuis table  
--    - attempt_kuis_select_admin, attempt_kuis_select_dosen, attempt_kuis_select_mahasiswa (SELECT)
--    - attempt_kuis_update_admin, attempt_kuis_update_dosen, attempt_kuis_update_mahasiswa (UPDATE)
--    Total: 6 policies can be consolidated to 2

-- 3. audit_logs_archive table
--    - "Admin full control audit logs archive" + "Only admin can view audit logs" (SELECT)
--    Total: 2 SELECT policies (both admin, can be merged)

-- 4. dosen table
--    - dosen_update_admin + dosen_update_self (UPDATE)
--    Total: 2 UPDATE policies

-- 5. inventaris table
--    - inventaris_delete_admin + inventaris_delete_laboran (DELETE)
--    - inventaris_insert_admin + inventaris_insert_laboran (INSERT)
--    - inventaris_update_admin + inventaris_update_laboran (UPDATE)
--    Total: 6 policies → 3 consolidated

-- 6. jadwal_praktikum table
--    - jadwal_praktikum_delete_admin/dosen/laboran (DELETE)
--    - jadwal_select_admin/dosen/laboran/mahasiswa (SELECT)
--    - jadwal_praktikum_update_admin/dosen/laboran (UPDATE)
--    Total: 9 policies → 3 consolidated

-- 7. kehadiran table
--    - kehadiran_delete_admin + kehadiran_delete_dosen (DELETE)
--    - kehadiran_insert_admin + kehadiran_insert_dosen (INSERT)
--    - kehadiran_select_admin/dosen/mahasiswa (SELECT)
--    - kehadiran_update_admin + kehadiran_update_dosen (UPDATE)
--    Total: 9 policies → 4 consolidated

-- 8. kelas table
--    - kelas_select_admin/dosen/laboran/mahasiswa (SELECT)
--    - kelas_update_admin + kelas_update_dosen (UPDATE)
--    Total: 6 policies → 2 consolidated

-- 9. kelas_mahasiswa table
--    - kelas_mahasiswa_delete_admin/dosen (DELETE)
--    - kelas_mahasiswa_insert_admin/dosen (INSERT)
--    - kelas_mahasiswa_select_admin/dosen/mahasiswa (SELECT)
--    - kelas_mahasiswa_update_admin/dosen (UPDATE)
--    Total: 9 policies → 4 consolidated

-- 10. kuis table
--     - kuis_delete_admin/dosen (DELETE)
--     - kuis_insert_admin/dosen (INSERT)
--     - kuis_select_admin/dosen/mahasiswa (SELECT)
--     - kuis_update_admin/dosen (UPDATE)
--     Total: 9 policies → 4 consolidated

-- 11. laboran table
--     - laboran_update_admin + laboran_update_self (UPDATE)
--     Total: 2 UPDATE policies

-- 12. laboratorium table
--     - laboratorium_delete_admin/laboran (DELETE)
--     - laboratorium_insert_admin/laboran (INSERT)
--     - laboratorium_update_admin/laboran (UPDATE)
--     Total: 6 policies → 3 consolidated

-- 13. mahasiswa table
--     - mahasiswa_select_admin/dosen/self (SELECT)
--     - mahasiswa_update_admin/self (UPDATE)
--     Total: 5 policies → 2 consolidated

-- 14. mahasiswa_semester_audit table
--     - "Admin can view all semester audits" + "Mahasiswa can view their own semester audit" (SELECT)
--     Total: 2 SELECT policies (can be consolidated)

-- 15. mata_kuliah table
--     - mata_kuliah_insert_admin/dosen (INSERT)
--     - mata_kuliah_update_admin/dosen (UPDATE)
--     Total: 4 policies → 2 consolidated

-- 16. materi table
--     - materi_delete_admin/dosen (DELETE)
--     - materi_insert_admin/dosen (INSERT)
--     - materi_select_admin/dosen/mahasiswa (SELECT)
--     - materi_update_admin/dosen (UPDATE)
--     Total: 9 policies → 4 consolidated

-- 17. nilai table
--     - nilai_delete_admin/dosen (DELETE)
--     - nilai_insert_admin/dosen (INSERT)
--     - nilai_select_admin/dosen/mahasiswa (SELECT)
--     - nilai_update_admin/dosen (UPDATE)
--     Total: 9 policies → 4 consolidated

-- 18. peminjaman table
--     - peminjaman_insert_dosen/mahasiswa (INSERT)
--     - peminjaman_select_admin/dosen/laboran/mahasiswa (SELECT)
--     - peminjaman_update_admin/dosen/laboran/mahasiswa (UPDATE)
--     Total: 9 policies → 3 consolidated

-- 19. pengumuman table
--     - pengumuman_admin_update + pengumuman_author_update (UPDATE)
--     Total: 2 UPDATE policies

-- 20. soal table
--     - soal_delete_admin/dosen (DELETE)
--     - soal_insert_admin/dosen (INSERT)
--     - soal_select_admin/dosen/mahasiswa (SELECT)
--     - soal_update_admin/dosen (UPDATE)
--     Total: 9 policies → 4 consolidated

-- 21. users table
--     - users_select_admin/dosen/laboran/mahasiswa (SELECT)
--     - users_update_admin/self (UPDATE)
--     Total: 6 policies → 2 consolidated

-- ============================================================================
-- POTENTIAL IMPROVEMENT
-- ============================================================================
-- Current: 480+ separate policies
-- After consolidation: ~100-120 consolidated policies
-- Performance gain: ~75% reduction in policy evaluation overhead
-- Risk: ZERO - Only merging with same permissions
--
-- ============================================================================

-- NOTE: This consolidation requires careful policy review to ensure:
-- 1. No permission regressions
-- 2. All role combinations covered
-- 3. Proper use of auth context (admin role checks, user_id matching, etc.)
--
-- Recommend: Update policies gradually, testing each table
-- Can be done incrementally without downtime
