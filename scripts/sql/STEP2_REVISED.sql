-- ============================================================================
-- STEP 2 REVISED: DROP ACTUAL POLICIES (dengan nama yang benar)
-- Drop policies ONLY dari: users, mahasiswa, dosen, admin, kelas, kelas_mahasiswa
-- ============================================================================

-- ============================================================================
-- DROP POLICIES dari admin (3 policies)
-- ============================================================================
DROP POLICY IF EXISTS "Admins can manage admin data" ON admin;
DROP POLICY IF EXISTS "Admins can read all admin data" ON admin;
DROP POLICY IF EXISTS "Users can read own admin data" ON admin;

-- ============================================================================
-- DROP POLICIES dari dosen (3 policies)
-- ============================================================================
DROP POLICY IF EXISTS "Admins can manage dosen" ON dosen;
DROP POLICY IF EXISTS "Dosen can update own profile" ON dosen;
DROP POLICY IF EXISTS "Users can view own dosen profile" ON dosen;

-- ============================================================================
-- DROP POLICIES dari kelas_mahasiswa (6 policies)
-- ============================================================================
DROP POLICY IF EXISTS "Admin and Dosen can manage enrollments" ON kelas_mahasiswa;
DROP POLICY IF EXISTS "Dosen and Admin can view all enrollments" ON kelas_mahasiswa;
DROP POLICY IF EXISTS "Mahasiswa can enroll to kelas" ON kelas_mahasiswa;
DROP POLICY IF EXISTS "Mahasiswa can update own enrollments" ON kelas_mahasiswa;
DROP POLICY IF EXISTS "Mahasiswa can view own enrollments" ON kelas_mahasiswa;
DROP POLICY IF EXISTS "Students can view own enrollments" ON kelas_mahasiswa;

-- ============================================================================
-- VERIFY - Check policies removed from 6 tables
-- ============================================================================

-- Check RLS status pada 6 table (should all be TRUE/ENABLED)
SELECT
  tablename,
  rowsecurity,
  CASE WHEN rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as rls_status
FROM pg_tables
WHERE tablename IN ('users', 'mahasiswa', 'dosen', 'admin', 'kelas', 'kelas_mahasiswa')
ORDER BY tablename;

-- Check NO policies exist pada 6 table (should all be 0)
SELECT
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN ('users', 'mahasiswa', 'dosen', 'admin', 'kelas', 'kelas_mahasiswa')
GROUP BY tablename
ORDER BY tablename;

-- Show message
SELECT 'All old policies DROPPED from 6 critical tables - Ready for fresh policies!' as status;
