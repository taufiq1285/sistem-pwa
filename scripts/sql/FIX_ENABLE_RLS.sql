-- ============================================================================
-- FIX: ENABLE RLS pada tabel users, admin, dosen
-- Run this di Supabase SQL Editor
-- ============================================================================

-- 1. Enable RLS pada tabel users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 2. Enable RLS pada tabel admin
ALTER TABLE admin ENABLE ROW LEVEL SECURITY;

-- 3. Enable RLS pada tabel dosen
ALTER TABLE dosen ENABLE ROW LEVEL SECURITY;

-- Verify
SELECT
  tablename,
  rowsecurity,
  CASE WHEN rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'admin', 'dosen', 'mahasiswa', 'kelas', 'kelas_mahasiswa')
ORDER BY tablename;
