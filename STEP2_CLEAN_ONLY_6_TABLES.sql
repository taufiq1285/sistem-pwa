-- ============================================================================
-- MODIFIED STEP 2: CLEAN ONLY 6 CRITICAL TABLES
-- Drop policies ONLY dari: users, mahasiswa, dosen, admin, kelas, kelas_mahasiswa
-- Jangan touch other tables!
-- ============================================================================

-- Keep RLS ENABLED, hanya drop policies lama yang bermasalah

-- ============================================================================
-- DROP POLICIES dari users
-- ============================================================================
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to read for auth" ON users;
DROP POLICY IF EXISTS "Enable read access for users" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Allow insert for registration" ON users;
DROP POLICY IF EXISTS "users_allow_select" ON users;
DROP POLICY IF EXISTS "users_allow_insert_own" ON users;
DROP POLICY IF EXISTS "users_allow_update_own" ON users;

-- ============================================================================
-- DROP POLICIES dari mahasiswa
-- ============================================================================
DROP POLICY IF EXISTS "Admins can manage mahasiswa" ON mahasiswa;
DROP POLICY IF EXISTS "Allow authenticated users to view mahasiswa" ON mahasiswa;
DROP POLICY IF EXISTS "Mahasiswa can update own profile" ON mahasiswa;
DROP POLICY IF EXISTS "mahasiswa_insert_own" ON mahasiswa;
DROP POLICY IF EXISTS "mahasiswa_select_own" ON mahasiswa;
DROP POLICY IF EXISTS "mahasiswa_update_own" ON mahasiswa;
DROP POLICY IF EXISTS "mahasiswa_select_admin" ON mahasiswa;
DROP POLICY IF EXISTS "mahasiswa_insert_admin" ON mahasiswa;
DROP POLICY IF EXISTS "mahasiswa_update_admin" ON mahasiswa;

-- ============================================================================
-- DROP POLICIES dari dosen
-- ============================================================================
DROP POLICY IF EXISTS "dosen_manage" ON dosen;
DROP POLICY IF EXISTS "dosen_read_own" ON dosen;
DROP POLICY IF EXISTS "dosen_select_own" ON dosen;
DROP POLICY IF EXISTS "dosen_select_admin" ON dosen;
DROP POLICY IF EXISTS "dosen_insert_own" ON dosen;
DROP POLICY IF EXISTS "dosen_insert_admin" ON dosen;
DROP POLICY IF EXISTS "dosen_update_own" ON dosen;
DROP POLICY IF EXISTS "dosen_update_admin" ON dosen;

-- ============================================================================
-- DROP POLICIES dari admin
-- ============================================================================
DROP POLICY IF EXISTS "admin_can_manage" ON admin;
DROP POLICY IF EXISTS "admin_read_own" ON admin;
DROP POLICY IF EXISTS "Admins can manage admin records" ON admin;
DROP POLICY IF EXISTS "admin_select_all" ON admin;
DROP POLICY IF EXISTS "admin_insert" ON admin;
DROP POLICY IF EXISTS "admin_update" ON admin;

-- ============================================================================
-- DROP POLICIES dari kelas
-- ============================================================================
DROP POLICY IF EXISTS "Admins can manage all kelas" ON kelas;
DROP POLICY IF EXISTS "Dosen can insert kelas" ON kelas;
DROP POLICY IF EXISTS "Dosen can manage own kelas" ON kelas;
DROP POLICY IF EXISTS "Kelas viewable by authenticated users" ON kelas;
DROP POLICY IF EXISTS "kelas_admin_all" ON kelas;
DROP POLICY IF EXISTS "kelas_dosen_own" ON kelas;
DROP POLICY IF EXISTS "kelas_dosen_manage" ON kelas;
DROP POLICY IF EXISTS "kelas_mahasiswa_view" ON kelas;

-- ============================================================================
-- DROP POLICIES dari kelas_mahasiswa
-- ============================================================================
DROP POLICY IF EXISTS "kelas_mahasiswa_manage" ON kelas_mahasiswa;
DROP POLICY IF EXISTS "kelas_mahasiswa_insert" ON kelas_mahasiswa;
DROP POLICY IF EXISTS "kelas_mahasiswa_select" ON kelas_mahasiswa;
DROP POLICY IF EXISTS "kelas_mahasiswa_update" ON kelas_mahasiswa;
DROP POLICY IF EXISTS "kelas_mahasiswa_delete" ON kelas_mahasiswa;
DROP POLICY IF EXISTS "kelas_mahasiswa_admin" ON kelas_mahasiswa;
DROP POLICY IF EXISTS "kelas_mhs_admin_all" ON kelas_mahasiswa;
DROP POLICY IF EXISTS "kelas_mhs_mahasiswa_own" ON kelas_mahasiswa;
DROP POLICY IF EXISTS "kelas_mhs_dosen_view" ON kelas_mahasiswa;

-- ============================================================================
-- VERIFY - Check RLS still enabled, policies removed from 6 tables
-- ============================================================================

-- Check RLS status pada 6 table
SELECT
  tablename,
  rowsecurity,
  CASE WHEN rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as rls_status
FROM pg_tables
WHERE tablename IN ('users', 'mahasiswa', 'dosen', 'admin', 'kelas', 'kelas_mahasiswa')
ORDER BY tablename;

-- Check NO policies exist pada 6 table
SELECT
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN ('users', 'mahasiswa', 'dosen', 'admin', 'kelas', 'kelas_mahasiswa')
GROUP BY tablename
ORDER BY tablename;

-- Show message
SELECT 'All old policies DROPPED from 6 critical tables - Ready for fresh policies!' as status;
