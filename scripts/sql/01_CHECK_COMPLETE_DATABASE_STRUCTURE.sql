-- ============================================================================
-- DATABASE STRUCTURE VERIFICATION
-- Jalankan di Supabase SQL Editor untuk cek struktur lengkap database
-- ============================================================================

-- ============================================================================
-- 1. CEK SEMUA TABEL YANG ADA
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  tableowner,
  hasindexes
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- 2. CEK STRUKTUR TABEL USERS
-- ============================================================================
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- ============================================================================
-- 3. CEK STRUKTUR TABEL JADWAL (YANG HILANG)
-- ============================================================================
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'jadwal'
ORDER BY ordinal_position;

-- ============================================================================
-- 4. CEK STRUKTUR TABEL KUIS
-- ============================================================================
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'kuis'
ORDER BY ordinal_position;

-- ============================================================================
-- 5. CEK DATA DI TABEL USERS
-- ============================================================================
SELECT COUNT(*) as total_users, array_agg(DISTINCT role) as roles_found
FROM users;

-- ============================================================================
-- 6. CEK DATA DI TABEL MAHASISWA
-- ============================================================================
SELECT COUNT(*) as total_mahasiswa
FROM mahasiswa;

-- ============================================================================
-- 7. CEK DATA DI TABEL DOSEN
-- ============================================================================
SELECT COUNT(*) as total_dosen
FROM dosen;

-- ============================================================================
-- 8. CEK DATA DI TABEL KELAS
-- ============================================================================
SELECT COUNT(*) as total_kelas
FROM kelas;

-- ============================================================================
-- 9. CEK ENUMS YANG TERDAFTAR
-- ============================================================================
SELECT enumname, enumlabel
FROM pg_enum
ORDER BY enumname, enumlabel;

-- ============================================================================
-- 10. CEK ROW LEVEL SECURITY STATUS
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- 11. CEK POLICIES (RLS POLICIES)
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- 12. CEK FOREIGN KEYS
-- ============================================================================
SELECT 
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS referenced_table,
  ccu.column_name AS referenced_column,
  rc.update_rule,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- ============================================================================
-- 13. CEK FUNCTIONS & TRIGGERS
-- ============================================================================
SELECT 
  trigger_name,
  event_object_table,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- 14. CEK MISING COLUMNS DI JADWAL
-- ============================================================================
-- Cek apakah kolom status, cancelled_by, cancelled_at ada
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name='jadwal' AND column_name='status'
) as has_status,
EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name='jadwal' AND column_name='cancelled_by'
) as has_cancelled_by,
EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name='jadwal' AND column_name='cancelled_at'
) as has_cancelled_at,
EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name='jadwal' AND column_name='kelas_id'
) as has_kelas_id;

-- ============================================================================
-- 15. SAMPLE DATA DARI SETIAP TABEL
-- ============================================================================
-- Users
SELECT 'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
-- Mahasiswa
SELECT 'mahasiswa', COUNT(*) FROM mahasiswa
UNION ALL
-- Dosen
SELECT 'dosen', COUNT(*) FROM dosen
UNION ALL
-- Admin
SELECT 'admin', COUNT(*) FROM admin
UNION ALL
-- Mata Kuliah
SELECT 'mata_kuliah', COUNT(*) FROM mata_kuliah
UNION ALL
-- Kelas
SELECT 'kelas', COUNT(*) FROM kelas
UNION ALL
-- Kelas Mahasiswa
SELECT 'kelas_mahasiswa', COUNT(*) FROM kelas_mahasiswa
UNION ALL
-- Laboratorium
SELECT 'laboratorium', COUNT(*) FROM laboratorium
UNION ALL
-- Kehadiran
SELECT 'kehadiran', COUNT(*) FROM kehadiran
UNION ALL
-- Kuis
SELECT 'kuis', COUNT(*) FROM kuis
UNION ALL
-- Attempt Kuis
SELECT 'attempt_kuis', COUNT(*) FROM attempt_kuis
UNION ALL
-- Inventaris
SELECT 'inventaris', COUNT(*) FROM inventaris
UNION ALL
-- Peminjaman
SELECT 'peminjaman', COUNT(*) FROM peminjaman
ORDER BY table_name;
