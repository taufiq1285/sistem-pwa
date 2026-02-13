-- ==========================================
-- FIX: Add Admin RLS Policy for users table
-- ==========================================
-- Masalah: Admin tidak bisa join dosen.users karena tidak punya akses ke users table

-- Drop existing admin policy if any
DROP POLICY IF EXISTS users_select_admin ON users;

-- Create SELECT policy for admin
-- Admin bisa melihat SEMUA users (diperlukan untuk join dengan dosen/mahasiswa)
CREATE POLICY users_select_admin
ON users
FOR SELECT
TO public
USING (is_admin());

-- Verification
SELECT
  'USERS' as table_name,
  COUNT(*) as total_accessible
FROM users;

-- Verify policy
SELECT
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'users'
  AND policyname LIKE '%admin%';
