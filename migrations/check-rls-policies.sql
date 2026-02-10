-- Check RLS Policies for jadwal_praktikum
-- Jalankan ini di Supabase SQL Editor

-- 1. Cek semua RLS policies di jadwal_praktikum
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'jadwal_praktikum';

-- 2. Cek apakah laboran role ada access
SELECT
  rolname,
  rolsuper,
  rolcreaterole,
  rolcreatebase,
  rolcanlogin
FROM pg_roles
WHERE rolname LIKE '%laboran%' OR rolname LIKE '%authenticated%';

-- 3. Cek RLS status
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'jadwal_praktikum';

-- 4. Test: Apakah laboran bisa SELECT?
-- Jalankan sebagai service_role (bypass RLS)
SELECT COUNT(*) as total_rows
FROM jadwal_praktikum
WHERE is_active = true;

-- 5. Cek current user
SELECT current_user, current_role;
