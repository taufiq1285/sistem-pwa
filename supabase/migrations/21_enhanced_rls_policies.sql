-- ============================================================================
-- ENHANCED RLS POLICIES - ROLE-BASED ACCESS CONTROL
-- Week 3 Day 1-2: Database-Level Security
-- ============================================================================
-- Description: Comprehensive RLS policies untuk semua tables
-- Purpose: Enforce RBAC at database level (defense in depth)
-- Author: System Praktikum PWA Team
-- Date: 2025-11-28
-- Prerequisites: 20_rls_helper_functions.sql
-- ============================================================================

-- ============================================================================
-- DROP OLD PERMISSIVE POLICIES
-- ============================================================================

-- Drop old overly-permissive policies if they exist
DO $$
BEGIN
    -- Users table
    DROP POLICY IF EXISTS "users_select_all" ON users;
    DROP POLICY IF EXISTS "Enable read access for all users" ON users;

    -- Kuis table
    DROP POLICY IF EXISTS "kuis_select" ON kuis;
    DROP POLICY IF EXISTS "Enable read access for authenticated users only" ON kuis;

    -- Mata Kuliah table
    DROP POLICY IF EXISTS "mata_kuliah_select" ON mata_kuliah;
    DROP POLICY IF EXISTS "Enable read access for all users" ON mata_kuliah;

    -- Kelas table
    DROP POLICY IF EXISTS "kelas_select" ON kelas;

    -- Nilai table
    DROP POLICY IF EXISTS "nilai_select" ON nilai;

    RAISE NOTICE 'Old permissive policies dropped successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Some old policies may not exist - continuing...';
END $$;

-- ============================================================================
-- 1. USERS TABLE POLICIES
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ADMIN: Can see all users
CREATE POLICY "users_select_admin" ON users
    FOR SELECT
    USING (is_admin());

-- DOSEN: Can see their students + self
CREATE POLICY "users_select_dosen" ON users
    FOR SELECT
    USING (
        is_dosen() AND (
            -- Self
            id = auth.uid()
            OR
            -- Their students
            id IN (
                SELECT m.user_id
                FROM mahasiswa m
                INNER JOIN kelas_mahasiswa km ON km.mahasiswa_id = m.id
                INNER JOIN kelas k ON k.id = km.kelas_id
                WHERE k.dosen_id = get_current_dosen_id()
            )
        )
    );

-- MAHASISWA: Can see users in their kelas + self
CREATE POLICY "users_select_mahasiswa" ON users
    FOR SELECT
    USING (
        is_mahasiswa() AND (
            -- Self
            id = auth.uid()
            OR
            -- Dosen who teach them
            id IN (
                SELECT d.user_id
                FROM dosen d
                INNER JOIN kelas k ON k.dosen_id = d.id
                INNER JOIN kelas_mahasiswa km ON km.kelas_id = k.id
                WHERE km.mahasiswa_id = get_current_mahasiswa_id()
            )
            OR
            -- Classmates
            id IN (
                SELECT m.user_id
                FROM mahasiswa m
                INNER JOIN kelas_mahasiswa km ON km.mahasiswa_id = m.id
                WHERE km.kelas_id = ANY(get_mahasiswa_kelas_ids())
            )
        )
    );

-- LABORAN: Can see self only (minimal access)
CREATE POLICY "users_select_laboran" ON users
    FOR SELECT
    USING (
        is_laboran() AND id = auth.uid()
    );

-- ADMIN: Can update all users
CREATE POLICY "users_update_admin" ON users
    FOR UPDATE
    USING (is_admin());

-- ALL ROLES: Can update own profile
CREATE POLICY "users_update_self" ON users
    FOR UPDATE
    USING (id = auth.uid());

COMMENT ON TABLE users IS
'RLS enabled: Admin sees all, Dosen sees students, Mahasiswa sees classmates, Laboran sees self';

-- ============================================================================
-- 2. KUIS TABLE POLICIES
-- ============================================================================

ALTER TABLE kuis ENABLE ROW LEVEL SECURITY;

-- ADMIN: Can see all kuis
CREATE POLICY "kuis_select_admin" ON kuis
    FOR SELECT
    USING (is_admin());

-- DOSEN: Can see their own kuis
CREATE POLICY "kuis_select_dosen" ON kuis
    FOR SELECT
    USING (
        is_dosen() AND dosen_id = get_current_dosen_id()
    );

-- MAHASISWA: Can only see published kuis for their enrolled kelas
CREATE POLICY "kuis_select_mahasiswa" ON kuis
    FOR SELECT
    USING (
        is_mahasiswa()
        AND status = 'published'
        AND kelas_id = ANY(get_mahasiswa_kelas_ids())
    );

-- DOSEN: Can create kuis
CREATE POLICY "kuis_insert_dosen" ON kuis
    FOR INSERT
    WITH CHECK (
        is_dosen() AND dosen_id = get_current_dosen_id()
    );

-- ADMIN: Can create kuis
CREATE POLICY "kuis_insert_admin" ON kuis
    FOR INSERT
    WITH CHECK (is_admin());

-- DOSEN: Can update their own kuis
CREATE POLICY "kuis_update_dosen" ON kuis
    FOR UPDATE
    USING (
        is_dosen() AND dosen_id = get_current_dosen_id()
    );

-- ADMIN: Can update any kuis
CREATE POLICY "kuis_update_admin" ON kuis
    FOR UPDATE
    USING (is_admin());

-- DOSEN: Can delete their own kuis
CREATE POLICY "kuis_delete_dosen" ON kuis
    FOR DELETE
    USING (
        is_dosen() AND dosen_id = get_current_dosen_id()
    );

-- ADMIN: Can delete any kuis
CREATE POLICY "kuis_delete_admin" ON kuis
    FOR DELETE
    USING (is_admin());

COMMENT ON TABLE kuis IS
'RLS enabled: Admin full access, Dosen own kuis, Mahasiswa published only';

-- ============================================================================
-- 3. ATTEMPT_KUIS TABLE POLICIES
-- ============================================================================

ALTER TABLE attempt_kuis ENABLE ROW LEVEL SECURITY;

-- ADMIN: Can see all attempts
CREATE POLICY "attempt_kuis_select_admin" ON attempt_kuis
    FOR SELECT
    USING (is_admin());

-- DOSEN: Can see attempts for their kuis
CREATE POLICY "attempt_kuis_select_dosen" ON attempt_kuis
    FOR SELECT
    USING (
        is_dosen()
        AND kuis_id IN (
            SELECT id FROM kuis WHERE dosen_id = get_current_dosen_id()
        )
    );

-- MAHASISWA: Can see their own attempts
CREATE POLICY "attempt_kuis_select_mahasiswa" ON attempt_kuis
    FOR SELECT
    USING (
        is_mahasiswa() AND mahasiswa_id = get_current_mahasiswa_id()
    );

-- MAHASISWA: Can create attempts for published kuis in their kelas
CREATE POLICY "attempt_kuis_insert_mahasiswa" ON attempt_kuis
    FOR INSERT
    WITH CHECK (
        is_mahasiswa()
        AND mahasiswa_id = get_current_mahasiswa_id()
        AND kuis_id IN (
            SELECT id FROM kuis
            WHERE status = 'published'
            AND kelas_id = ANY(get_mahasiswa_kelas_ids())
        )
    );

-- MAHASISWA: Can update their own attempts (only if not submitted)
CREATE POLICY "attempt_kuis_update_mahasiswa" ON attempt_kuis
    FOR UPDATE
    USING (
        is_mahasiswa()
        AND mahasiswa_id = get_current_mahasiswa_id()
        AND status IN ('pending', 'in_progress')
    );

-- DOSEN: Can update attempts for their kuis (grading)
CREATE POLICY "attempt_kuis_update_dosen" ON attempt_kuis
    FOR UPDATE
    USING (
        is_dosen()
        AND kuis_id IN (
            SELECT id FROM kuis WHERE dosen_id = get_current_dosen_id()
        )
    );

-- ADMIN: Can update any attempt
CREATE POLICY "attempt_kuis_update_admin" ON attempt_kuis
    FOR UPDATE
    USING (is_admin());

COMMENT ON TABLE attempt_kuis IS
'RLS enabled: Mahasiswa own attempts, Dosen grading, Admin full access';

-- ============================================================================
-- 4. NILAI TABLE POLICIES
-- ============================================================================

ALTER TABLE nilai ENABLE ROW LEVEL SECURITY;

-- ADMIN: Can see all grades
CREATE POLICY "nilai_select_admin" ON nilai
    FOR SELECT
    USING (is_admin());

-- DOSEN: Can see grades for their students
CREATE POLICY "nilai_select_dosen" ON nilai
    FOR SELECT
    USING (
        is_dosen()
        AND dosen_teaches_mahasiswa(mahasiswa_id)
    );

-- MAHASISWA: Can see their own grades only
CREATE POLICY "nilai_select_mahasiswa" ON nilai
    FOR SELECT
    USING (
        is_mahasiswa() AND mahasiswa_id = get_current_mahasiswa_id()
    );

-- DOSEN: Can insert grades for their students
CREATE POLICY "nilai_insert_dosen" ON nilai
    FOR INSERT
    WITH CHECK (
        is_dosen()
        AND dosen_teaches_mahasiswa(mahasiswa_id)
    );

-- ADMIN: Can insert any grade
CREATE POLICY "nilai_insert_admin" ON nilai
    FOR INSERT
    WITH CHECK (is_admin());

-- DOSEN: Can update grades for their students
CREATE POLICY "nilai_update_dosen" ON nilai
    FOR UPDATE
    USING (
        is_dosen()
        AND dosen_teaches_mahasiswa(mahasiswa_id)
    );

-- ADMIN: Can update any grade
CREATE POLICY "nilai_update_admin" ON nilai
    FOR UPDATE
    USING (is_admin());

-- DOSEN: Can delete grades for their students
CREATE POLICY "nilai_delete_dosen" ON nilai
    FOR DELETE
    USING (
        is_dosen()
        AND dosen_teaches_mahasiswa(mahasiswa_id)
    );

-- ADMIN: Can delete any grade
CREATE POLICY "nilai_delete_admin" ON nilai
    FOR DELETE
    USING (is_admin());

COMMENT ON TABLE nilai IS
'RLS enabled: Privacy-protected - Mahasiswa own grades only, Dosen their students';

-- ============================================================================
-- 5. KELAS TABLE POLICIES
-- ============================================================================

ALTER TABLE kelas ENABLE ROW LEVEL SECURITY;

-- ADMIN: Can see all kelas
CREATE POLICY "kelas_select_admin" ON kelas
    FOR SELECT
    USING (is_admin());

-- DOSEN: Can see their kelas
CREATE POLICY "kelas_select_dosen" ON kelas
    FOR SELECT
    USING (
        is_dosen() AND dosen_id = get_current_dosen_id()
    );

-- MAHASISWA: Can see kelas they're enrolled in
CREATE POLICY "kelas_select_mahasiswa" ON kelas
    FOR SELECT
    USING (
        is_mahasiswa() AND id = ANY(get_mahasiswa_kelas_ids())
    );

-- LABORAN: Can see active kelas (for lab scheduling)
CREATE POLICY "kelas_select_laboran" ON kelas
    FOR SELECT
    USING (
        is_laboran() AND is_active = TRUE
    );

-- ADMIN: Can manage kelas
CREATE POLICY "kelas_insert_admin" ON kelas
    FOR INSERT
    WITH CHECK (is_admin());

CREATE POLICY "kelas_update_admin" ON kelas
    FOR UPDATE
    USING (is_admin());

CREATE POLICY "kelas_delete_admin" ON kelas
    FOR DELETE
    USING (is_admin());

-- DOSEN: Can update their own kelas
CREATE POLICY "kelas_update_dosen" ON kelas
    FOR UPDATE
    USING (
        is_dosen() AND dosen_id = get_current_dosen_id()
    );

COMMENT ON TABLE kelas IS
'RLS enabled: Admin full access, Dosen own kelas, Mahasiswa enrolled only';

-- ============================================================================
-- 6. KELAS_MAHASISWA TABLE POLICIES
-- ============================================================================

ALTER TABLE kelas_mahasiswa ENABLE ROW LEVEL SECURITY;

-- ADMIN: Can see all enrollments
CREATE POLICY "kelas_mahasiswa_select_admin" ON kelas_mahasiswa
    FOR SELECT
    USING (is_admin());

-- DOSEN: Can see enrollments for their kelas
CREATE POLICY "kelas_mahasiswa_select_dosen" ON kelas_mahasiswa
    FOR SELECT
    USING (
        is_dosen() AND dosen_teaches_kelas(kelas_id)
    );

-- MAHASISWA: Can see their own enrollments
CREATE POLICY "kelas_mahasiswa_select_mahasiswa" ON kelas_mahasiswa
    FOR SELECT
    USING (
        is_mahasiswa() AND mahasiswa_id = get_current_mahasiswa_id()
    );

-- ADMIN: Can manage enrollments
CREATE POLICY "kelas_mahasiswa_insert_admin" ON kelas_mahasiswa
    FOR INSERT
    WITH CHECK (is_admin());

CREATE POLICY "kelas_mahasiswa_update_admin" ON kelas_mahasiswa
    FOR UPDATE
    USING (is_admin());

CREATE POLICY "kelas_mahasiswa_delete_admin" ON kelas_mahasiswa
    FOR DELETE
    USING (is_admin());

-- DOSEN: Can manage enrollments for their kelas
CREATE POLICY "kelas_mahasiswa_insert_dosen" ON kelas_mahasiswa
    FOR INSERT
    WITH CHECK (
        is_dosen() AND dosen_teaches_kelas(kelas_id)
    );

CREATE POLICY "kelas_mahasiswa_update_dosen" ON kelas_mahasiswa
    FOR UPDATE
    USING (
        is_dosen() AND dosen_teaches_kelas(kelas_id)
    );

CREATE POLICY "kelas_mahasiswa_delete_dosen" ON kelas_mahasiswa
    FOR DELETE
    USING (
        is_dosen() AND dosen_teaches_kelas(kelas_id)
    );

COMMENT ON TABLE kelas_mahasiswa IS
'RLS enabled: Admin and Dosen manage enrollments, Mahasiswa view own';

-- ============================================================================
-- 7. PEMINJAMAN TABLE POLICIES
-- ============================================================================

ALTER TABLE peminjaman ENABLE ROW LEVEL SECURITY;

-- ADMIN: Can see all peminjaman
CREATE POLICY "peminjaman_select_admin" ON peminjaman
    FOR SELECT
    USING (is_admin());

-- LABORAN: Can see all peminjaman (for approval)
CREATE POLICY "peminjaman_select_laboran" ON peminjaman
    FOR SELECT
    USING (is_laboran());

-- DOSEN: Can see their own peminjaman
CREATE POLICY "peminjaman_select_dosen" ON peminjaman
    FOR SELECT
    USING (
        is_dosen() AND dosen_id = get_current_dosen_id()
    );

-- MAHASISWA: Can see their own peminjaman
CREATE POLICY "peminjaman_select_mahasiswa" ON peminjaman
    FOR SELECT
    USING (
        is_mahasiswa() AND peminjam_id = get_current_mahasiswa_id()
    );

-- MAHASISWA: Can create peminjaman
CREATE POLICY "peminjaman_insert_mahasiswa" ON peminjaman
    FOR INSERT
    WITH CHECK (
        is_mahasiswa()
        AND peminjam_id = get_current_mahasiswa_id()
        AND status = 'pending'
    );

-- DOSEN: Can create peminjaman
CREATE POLICY "peminjaman_insert_dosen" ON peminjaman
    FOR INSERT
    WITH CHECK (
        is_dosen()
        AND dosen_id = get_current_dosen_id()
        AND status = 'pending'
    );

-- LABORAN: Can update peminjaman (approval)
CREATE POLICY "peminjaman_update_laboran" ON peminjaman
    FOR UPDATE
    USING (is_laboran());

-- ADMIN: Can update any peminjaman
CREATE POLICY "peminjaman_update_admin" ON peminjaman
    FOR UPDATE
    USING (is_admin());

-- MAHASISWA: Can update own pending peminjaman
CREATE POLICY "peminjaman_update_mahasiswa" ON peminjaman
    FOR UPDATE
    USING (
        is_mahasiswa()
        AND peminjam_id = get_current_mahasiswa_id()
        AND status = 'pending'
    );

-- DOSEN: Can update own pending peminjaman
CREATE POLICY "peminjaman_update_dosen" ON peminjaman
    FOR UPDATE
    USING (
        is_dosen()
        AND dosen_id = get_current_dosen_id()
        AND status = 'pending'
    );

COMMENT ON TABLE peminjaman IS
'RLS enabled: Laboran approves, Mahasiswa/Dosen own requests, Admin full access';

-- ============================================================================
-- 8. INVENTARIS TABLE POLICIES
-- ============================================================================

ALTER TABLE inventaris ENABLE ROW LEVEL SECURITY;

-- ALL AUTHENTICATED: Can view inventaris (read-only for non-laboran)
CREATE POLICY "inventaris_select_all" ON inventaris
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- LABORAN: Can manage inventaris
CREATE POLICY "inventaris_insert_laboran" ON inventaris
    FOR INSERT
    WITH CHECK (is_laboran());

CREATE POLICY "inventaris_update_laboran" ON inventaris
    FOR UPDATE
    USING (is_laboran());

CREATE POLICY "inventaris_delete_laboran" ON inventaris
    FOR DELETE
    USING (is_laboran());

-- ADMIN: Can manage inventaris
CREATE POLICY "inventaris_insert_admin" ON inventaris
    FOR INSERT
    WITH CHECK (is_admin());

CREATE POLICY "inventaris_update_admin" ON inventaris
    FOR UPDATE
    USING (is_admin());

CREATE POLICY "inventaris_delete_admin" ON inventaris
    FOR DELETE
    USING (is_admin());

COMMENT ON TABLE inventaris IS
'RLS enabled: All can view, Laboran and Admin can manage';

-- ============================================================================
-- 9. LABORATORIUM TABLE POLICIES
-- ============================================================================

ALTER TABLE laboratorium ENABLE ROW LEVEL SECURITY;

-- ALL AUTHENTICATED: Can view laboratorium
CREATE POLICY "laboratorium_select_all" ON laboratorium
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- LABORAN: Can manage laboratorium
CREATE POLICY "laboratorium_insert_laboran" ON laboratorium
    FOR INSERT
    WITH CHECK (is_laboran());

CREATE POLICY "laboratorium_update_laboran" ON laboratorium
    FOR UPDATE
    USING (is_laboran());

CREATE POLICY "laboratorium_delete_laboran" ON laboratorium
    FOR DELETE
    USING (is_laboran());

-- ADMIN: Can manage laboratorium
CREATE POLICY "laboratorium_insert_admin" ON laboratorium
    FOR INSERT
    WITH CHECK (is_admin());

CREATE POLICY "laboratorium_update_admin" ON laboratorium
    FOR UPDATE
    USING (is_admin());

CREATE POLICY "laboratorium_delete_admin" ON laboratorium
    FOR DELETE
    USING (is_admin());

COMMENT ON TABLE laboratorium IS
'RLS enabled: All can view, Laboran and Admin can manage';

-- ============================================================================
-- 10. MATA_KULIAH TABLE POLICIES
-- ============================================================================

ALTER TABLE mata_kuliah ENABLE ROW LEVEL SECURITY;

-- ALL AUTHENTICATED: Can view mata kuliah
CREATE POLICY "mata_kuliah_select_all" ON mata_kuliah
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- ADMIN: Can manage mata kuliah
CREATE POLICY "mata_kuliah_insert_admin" ON mata_kuliah
    FOR INSERT
    WITH CHECK (is_admin());

CREATE POLICY "mata_kuliah_update_admin" ON mata_kuliah
    FOR UPDATE
    USING (is_admin());

CREATE POLICY "mata_kuliah_delete_admin" ON mata_kuliah
    FOR DELETE
    USING (is_admin());

-- DOSEN: Can create mata kuliah
CREATE POLICY "mata_kuliah_insert_dosen" ON mata_kuliah
    FOR INSERT
    WITH CHECK (is_dosen());

-- DOSEN: Can update mata kuliah they teach
CREATE POLICY "mata_kuliah_update_dosen" ON mata_kuliah
    FOR UPDATE
    USING (
        is_dosen()
        AND id IN (
            SELECT DISTINCT mata_kuliah_id
            FROM kelas
            WHERE dosen_id = get_current_dosen_id()
        )
    );

COMMENT ON TABLE mata_kuliah IS
'RLS enabled: All can view, Admin and Dosen can manage';

-- ============================================================================
-- 11. JADWAL_PRAKTIKUM TABLE POLICIES
-- ============================================================================

ALTER TABLE jadwal_praktikum ENABLE ROW LEVEL SECURITY;

-- ALL AUTHENTICATED: Can view jadwal
CREATE POLICY "jadwal_praktikum_select_all" ON jadwal_praktikum
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- ADMIN: Can manage jadwal
CREATE POLICY "jadwal_praktikum_insert_admin" ON jadwal_praktikum
    FOR INSERT
    WITH CHECK (is_admin());

CREATE POLICY "jadwal_praktikum_update_admin" ON jadwal_praktikum
    FOR UPDATE
    USING (is_admin());

CREATE POLICY "jadwal_praktikum_delete_admin" ON jadwal_praktikum
    FOR DELETE
    USING (is_admin());

-- DOSEN: Can manage jadwal for their kelas
CREATE POLICY "jadwal_praktikum_insert_dosen" ON jadwal_praktikum
    FOR INSERT
    WITH CHECK (
        is_dosen() AND dosen_teaches_kelas(kelas_id)
    );

CREATE POLICY "jadwal_praktikum_update_dosen" ON jadwal_praktikum
    FOR UPDATE
    USING (
        is_dosen() AND dosen_teaches_kelas(kelas_id)
    );

CREATE POLICY "jadwal_praktikum_delete_dosen" ON jadwal_praktikum
    FOR DELETE
    USING (
        is_dosen() AND dosen_teaches_kelas(kelas_id)
    );

-- LABORAN: Can manage all jadwal (lab coordination)
CREATE POLICY "jadwal_praktikum_insert_laboran" ON jadwal_praktikum
    FOR INSERT
    WITH CHECK (is_laboran());

CREATE POLICY "jadwal_praktikum_update_laboran" ON jadwal_praktikum
    FOR UPDATE
    USING (is_laboran());

COMMENT ON TABLE jadwal_praktikum IS
'RLS enabled: All can view, Admin/Dosen/Laboran can manage';

-- ============================================================================
-- 12. MATERI TABLE POLICIES
-- ============================================================================

ALTER TABLE materi ENABLE ROW LEVEL SECURITY;

-- ADMIN: Can see all materi
CREATE POLICY "materi_select_admin" ON materi
    FOR SELECT
    USING (is_admin());

-- DOSEN: Can see their own materi
CREATE POLICY "materi_select_dosen" ON materi
    FOR SELECT
    USING (
        is_dosen() AND dosen_id = get_current_dosen_id()
    );

-- MAHASISWA: Can see materi for their kelas
CREATE POLICY "materi_select_mahasiswa" ON materi
    FOR SELECT
    USING (
        is_mahasiswa()
        AND kelas_id = ANY(get_mahasiswa_kelas_ids())
    );

-- DOSEN: Can create materi
CREATE POLICY "materi_insert_dosen" ON materi
    FOR INSERT
    WITH CHECK (
        is_dosen() AND dosen_id = get_current_dosen_id()
    );

-- ADMIN: Can create materi
CREATE POLICY "materi_insert_admin" ON materi
    FOR INSERT
    WITH CHECK (is_admin());

-- DOSEN: Can update their own materi
CREATE POLICY "materi_update_dosen" ON materi
    FOR UPDATE
    USING (
        is_dosen() AND dosen_id = get_current_dosen_id()
    );

-- ADMIN: Can update any materi
CREATE POLICY "materi_update_admin" ON materi
    FOR UPDATE
    USING (is_admin());

-- DOSEN: Can delete their own materi
CREATE POLICY "materi_delete_dosen" ON materi
    FOR DELETE
    USING (
        is_dosen() AND dosen_id = get_current_dosen_id()
    );

-- ADMIN: Can delete any materi
CREATE POLICY "materi_delete_admin" ON materi
    FOR DELETE
    USING (is_admin());

COMMENT ON TABLE materi IS
'RLS enabled: Dosen own materi, Mahasiswa can view for their kelas';

-- ============================================================================
-- ROLE-SPECIFIC PROFILE TABLES
-- ============================================================================

-- MAHASISWA TABLE
ALTER TABLE mahasiswa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mahasiswa_select_admin" ON mahasiswa
    FOR SELECT USING (is_admin());

CREATE POLICY "mahasiswa_select_dosen" ON mahasiswa
    FOR SELECT USING (
        is_dosen() AND dosen_teaches_mahasiswa(id)
    );

CREATE POLICY "mahasiswa_select_self" ON mahasiswa
    FOR SELECT USING (
        is_mahasiswa() AND user_id = auth.uid()
    );

CREATE POLICY "mahasiswa_update_self" ON mahasiswa
    FOR UPDATE USING (
        is_mahasiswa() AND user_id = auth.uid()
    );

CREATE POLICY "mahasiswa_update_admin" ON mahasiswa
    FOR UPDATE USING (is_admin());

-- DOSEN TABLE
ALTER TABLE dosen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dosen_select_all" ON dosen
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "dosen_update_self" ON dosen
    FOR UPDATE USING (
        is_dosen() AND user_id = auth.uid()
    );

CREATE POLICY "dosen_update_admin" ON dosen
    FOR UPDATE USING (is_admin());

-- LABORAN TABLE
ALTER TABLE laboran ENABLE ROW LEVEL SECURITY;

CREATE POLICY "laboran_select_all" ON laboran
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "laboran_update_self" ON laboran
    FOR UPDATE USING (
        is_laboran() AND user_id = auth.uid()
    );

CREATE POLICY "laboran_update_admin" ON laboran
    FOR UPDATE USING (is_admin());

-- ============================================================================
-- PERFORMANCE OPTIMIZATION
-- ============================================================================

-- Analyze tables for query planner
ANALYZE users;
ANALYZE kuis;
ANALYZE attempt_kuis;
ANALYZE nilai;
ANALYZE kelas;
ANALYZE kelas_mahasiswa;
ANALYZE peminjaman;
ANALYZE inventaris;
ANALYZE laboratorium;
ANALYZE mata_kuliah;
ANALYZE jadwal_praktikum;
ANALYZE materi;
ANALYZE mahasiswa;
ANALYZE dosen;
ANALYZE laboran;

-- ============================================================================
-- VALIDATION QUERIES (for testing)
-- ============================================================================

-- Test RLS is enabled
DO $$
DECLARE
    table_name TEXT;
    rls_enabled BOOLEAN;
BEGIN
    FOR table_name IN
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename IN (
            'users', 'kuis', 'attempt_kuis', 'nilai', 'kelas',
            'kelas_mahasiswa', 'peminjaman', 'inventaris', 'laboratorium',
            'mata_kuliah', 'jadwal_praktikum', 'materi',
            'mahasiswa', 'dosen', 'laboran'
        )
    LOOP
        SELECT relrowsecurity INTO rls_enabled
        FROM pg_class
        WHERE relname = table_name;

        IF rls_enabled THEN
            RAISE NOTICE 'RLS ENABLED: %', table_name;
        ELSE
            RAISE WARNING 'RLS NOT ENABLED: %', table_name;
        END IF;
    END LOOP;
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON SCHEMA public IS
'Enhanced RLS Policies installed - Week 3 Day 1-2 Complete

Security Level: HIGH
- 15 tables protected with RLS
- 80+ policies implemented
- Role-based access control enforced
- Ownership validation at database level
- Admin bypass implemented
- Defense in depth strategy active

Next Steps:
1. Test RLS policies (Day 3)
2. Deploy to staging (Day 3)
3. Implement audit logging (Day 4-5)
4. Deploy to production (Day 5)
';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '
    ============================================================
    ✅ ENHANCED RLS POLICIES MIGRATION COMPLETE
    ============================================================

    📊 Statistics:
    - Tables Protected: 15
    - Policies Created: 80+
    - Helper Functions Used: 13

    🛡️  Security Features:
    ✓ Role-based access control
    ✓ Ownership validation
    ✓ Privacy protection (Nilai, Users)
    ✓ Admin bypass
    ✓ Granular permissions

    📝 Next Actions:
    1. Run RLS tests (see 22_rls_testing_guide.sql)
    2. Verify policies with test users
    3. Deploy audit logging system
    4. Monitor performance

    ============================================================
    ';
END $$;
