-- ============================================
-- CHECK ALL DATA (Bypass RLS)
-- ============================================
-- Jalankan ini di Supabase Dashboard > SQL Editor

-- ============================================
-- 1. CEK DATA DI AUTH.USERS (sistem authentication)
-- ============================================
SELECT
  'auth.users' as source,
  id,
  email,
  created_at,
  raw_user_meta_data->>'role' as role
FROM auth.users
ORDER BY created_at DESC;

-- ============================================
-- 2. CEK DATA DI PUBLIC.USERS (profil users kita)
-- ============================================
SELECT
  'public.users' as source,
  id,
  email,
  full_name,
  role,
  created_at
FROM public.users
ORDER BY created_at DESC;

-- ============================================
-- 3. CEK DATA DOSEN
-- ============================================
SELECT
  'dosen' as source,
  d.id,
  d.nip,
  u.email,
  u.full_name
FROM dosen d
LEFT JOIN users u ON d.user_id = u.id;

-- ============================================
-- 4. CEK DATA MAHASISWA
-- ============================================
SELECT
  'mahasiswa' as source,
  m.id,
  m.nim,
  u.email,
  u.full_name
FROM mahasiswa m
LEFT JOIN users u ON m.user_id = u.id;

-- ============================================
-- 5. COUNT SEMUA DATA
-- ============================================
SELECT
  'auth.users' as tabel, COUNT(*) as jumlah FROM auth.users
UNION ALL
SELECT 'public.users', COUNT(*) FROM public.users
UNION ALL
SELECT 'dosen', COUNT(*) FROM dosen
UNION ALL
SELECT 'mahasiswa', COUNT(*) FROM mahasiswa
UNION ALL
SELECT 'laboran', COUNT(*) FROM laboran
UNION ALL
SELECT 'admin', COUNT(*) FROM admin
UNION ALL
SELECT 'kelas', COUNT(*) FROM kelas
UNION ALL
SELECT 'jadwal_praktikum', COUNT(*) FROM jadwal_praktikum
UNION ALL
SELECT 'kuis', COUNT(*) FROM kuis
UNION ALL
SELECT 'peminjaman', COUNT(*) FROM peminjaman;
