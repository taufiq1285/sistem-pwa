-- ==========================================
-- QUICK FIX: Admin Dosen Dropdown Empty
-- ==========================================
-- Masalah: Dropdown "Dosen Baru" tidak menampilkan opsi di halaman Manajemen Assignment
-- Penyebab: Admin tidak punya akses ke tabel dosen dan users karena RLS
--
-- Cara jalankan:
-- 1. Buka Supabase Dashboard -> SQL Editor
-- 2. Login sebagai admin
-- 3. Copy-paste script ini
-- 4. Klik "Run"
-- ==========================================

-- STEP 1: Buat fungsi is_admin() jika belum ada
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION is_admin() TO public;

-- STEP 2: Buat RLS policy untuk admin di tabel dosen
DROP POLICY IF EXISTS dosen_select_admin ON dosen;

CREATE POLICY dosen_select_admin
ON dosen
FOR SELECT
TO public
USING (is_admin());

-- STEP 3: Buat RLS policy untuk admin di tabel users
-- (Diperlukan untuk relasi dosen.user)
DROP POLICY IF EXISTS users_select_admin ON users;

CREATE POLICY users_select_admin
ON users
FOR SELECT
TO public
USING (is_admin());

-- STEP 4: Test query seperti di frontend
-- Ini adalah query yang dijalankan oleh ManajemenAssignmentPage.tsx

-- Test 1: Cek apakah admin bisa baca dosen
SELECT
  'Test 1: Baca dosen' as test_name,
  COUNT(*) as total_dosen,
  CASE
    WHEN COUNT(*) > 0 THEN '✓ BERHASIL - Dropdown seharusnya muncul'
    ELSE '✗ GAGAL - Tidak ada data atau no access'
  END as status
FROM dosen
WHERE is_active = true;

-- Test 2: Cek apakah admin bisa baca dosen dengan relasi users
-- (Ini persis query yang dijalankan frontend di line 629-634)
SELECT
  'Test 2: Baca dosen dengan user relation' as test_name,
  COUNT(*) as total_dosen,
  CASE
    WHEN COUNT(*) > 0 THEN '✓ BERHASIL - Dropdown seharusnya menampilkan nama'
    ELSE '✗ GAGAL - Cek RLS policy users'
  END as status
FROM dosen
WHERE user_id IN (SELECT id FROM users)
  AND is_active = true;

-- Test 3: Simulasi query frontend lengkap
SELECT
  'Test 3: Query lengkap seperti frontend' as test_name,
  d.id,
  d.user_id,
  u.full_name,
  u.email
FROM dosen d
LEFT JOIN users u ON d.user_id = u.id
WHERE d.is_active = true
ORDER BY u.full_name
LIMIT 5;

-- STEP 5: Verifikasi policies sudah dibuat
SELECT
  'Policy Verification' as info,
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('dosen', 'users')
  AND policyname LIKE '%admin%'
ORDER BY tablename, policyname;
