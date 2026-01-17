-- ============================================================================
-- STEP 2: CLEAN SLATE - DROP ALL POLICIES & DISABLE RLS
-- Run this to start fresh
-- ============================================================================

-- ============================================================================
-- DROP ALL POLICIES dari 6 table utama
-- ============================================================================

-- DROP dari users
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to read for auth" ON users;
DROP POLICY IF EXISTS "Enable read access for users" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Allow insert for registration" ON users;

-- DROP dari mahasiswa
DROP POLICY IF EXISTS "Admins can manage mahasiswa" ON mahasiswa;
DROP POLICY IF EXISTS "Allow authenticated users to view mahasiswa" ON mahasiswa;
DROP POLICY IF EXISTS "Mahasiswa can update own profile" ON mahasiswa;
DROP POLICY IF EXISTS "mahasiswa_insert_own" ON mahasiswa;
DROP POLICY IF EXISTS "mahasiswa_select_own" ON mahasiswa;
DROP POLICY IF EXISTS "mahasiswa_update_own" ON mahasiswa;

-- DROP dari dosen
DROP POLICY IF EXISTS "dosen_manage" ON dosen;
DROP POLICY IF EXISTS "dosen_read_own" ON dosen;

-- DROP dari admin
DROP POLICY IF EXISTS "admin_can_manage" ON admin;
DROP POLICY IF EXISTS "admin_read_own" ON admin;
DROP POLICY IF EXISTS "Admins can manage admin records" ON admin;

-- DROP dari kelas
DROP POLICY IF EXISTS "Admins can manage all kelas" ON kelas;
DROP POLICY IF EXISTS "Dosen can insert kelas" ON kelas;
DROP POLICY IF EXISTS "Dosen can manage own kelas" ON kelas;
DROP POLICY IF EXISTS "Kelas viewable by authenticated users" ON kelas;

-- DROP dari kelas_mahasiswa
DROP POLICY IF EXISTS "kelas_mahasiswa_manage" ON kelas_mahasiswa;
DROP POLICY IF EXISTS "kelas_mahasiswa_insert" ON kelas_mahasiswa;
DROP POLICY IF EXISTS "kelas_mahasiswa_select" ON kelas_mahasiswa;
DROP POLICY IF EXISTS "kelas_mahasiswa_update" ON kelas_mahasiswa;
DROP POLICY IF EXISTS "kelas_mahasiswa_delete" ON kelas_mahasiswa;
DROP POLICY IF EXISTS "kelas_mahasiswa_admin" ON kelas_mahasiswa;

-- ============================================================================
-- DISABLE RLS pada semua table
-- ============================================================================
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE mahasiswa DISABLE ROW LEVEL SECURITY;
ALTER TABLE dosen DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE kelas DISABLE ROW LEVEL SECURITY;
ALTER TABLE kelas_mahasiswa DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- VERIFY - Semua RLS sudah disabled, no policies
-- ============================================================================
SELECT
  tablename,
  rowsecurity,
  CASE WHEN rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as rls_status
FROM pg_tables
WHERE tablename IN ('users', 'mahasiswa', 'dosen', 'admin', 'kelas', 'kelas_mahasiswa')
ORDER BY tablename;

-- Check no policies exist
SELECT
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN ('users', 'mahasiswa', 'dosen', 'admin', 'kelas', 'kelas_mahasiswa')
GROUP BY tablename;
