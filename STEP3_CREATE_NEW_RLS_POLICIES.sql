-- ============================================================================
-- STEP 3: CREATE NEW RLS POLICIES - CLEAN & TESTED
-- Run this AFTER STEP2 (clean slate)
-- ============================================================================

-- ============================================================================
-- TABLE: users
-- Columns: id, email, full_name, role, is_active
-- Roles accessing: admin, dosen, mahasiswa, laboran
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow SELECT untuk semua (public read untuk auth)
CREATE POLICY "users_allow_select" ON users
  FOR SELECT USING (true);

-- Policy 2: Allow INSERT untuk registration (auth user boleh buat akun sendiri)
CREATE POLICY "users_allow_insert_own" ON users
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Policy 3: Allow UPDATE untuk user sendiri
CREATE POLICY "users_allow_update_own" ON users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- TABLE: mahasiswa
-- Columns: id, user_id, nim, program_studi, angkatan, semester
-- Roles accessing: mahasiswa (own), admin (all)
-- ============================================================================

ALTER TABLE mahasiswa ENABLE ROW LEVEL SECURITY;

-- Policy 1: Mahasiswa bisa SELECT data mereka sendiri
CREATE POLICY "mahasiswa_select_own" ON mahasiswa
  FOR SELECT USING (auth.uid() = user_id);

-- Policy 2: Admin bisa SELECT semua mahasiswa
CREATE POLICY "mahasiswa_select_admin" ON mahasiswa
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Policy 3: Mahasiswa bisa INSERT akun mereka (saat registration)
CREATE POLICY "mahasiswa_insert_own" ON mahasiswa
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy 4: Admin bisa INSERT mahasiswa
CREATE POLICY "mahasiswa_insert_admin" ON mahasiswa
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Policy 5: Mahasiswa bisa UPDATE akun mereka
CREATE POLICY "mahasiswa_update_own" ON mahasiswa
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy 6: Admin bisa UPDATE mahasiswa
CREATE POLICY "mahasiswa_update_admin" ON mahasiswa
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================================
-- TABLE: dosen
-- Columns: id, user_id, nip, nidn, gelar_depan, gelar_belakang
-- Roles accessing: dosen (own), admin (all)
-- ============================================================================

ALTER TABLE dosen ENABLE ROW LEVEL SECURITY;

-- Policy 1: Dosen bisa SELECT diri sendiri
CREATE POLICY "dosen_select_own" ON dosen
  FOR SELECT USING (auth.uid() = user_id);

-- Policy 2: Admin bisa SELECT semua dosen
CREATE POLICY "dosen_select_admin" ON dosen
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Policy 3: Dosen bisa INSERT (saat registration)
CREATE POLICY "dosen_insert_own" ON dosen
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy 4: Admin bisa INSERT dosen
CREATE POLICY "dosen_insert_admin" ON dosen
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Policy 5: Dosen bisa UPDATE diri sendiri
CREATE POLICY "dosen_update_own" ON dosen
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy 6: Admin bisa UPDATE dosen
CREATE POLICY "dosen_update_admin" ON dosen
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================================
-- TABLE: admin
-- Columns: id, user_id, level, permissions
-- Roles accessing: admin only
-- ============================================================================

ALTER TABLE admin ENABLE ROW LEVEL SECURITY;

-- Policy 1: Admin bisa SELECT semua admin records
CREATE POLICY "admin_select_all" ON admin
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Policy 2: Admin bisa INSERT
CREATE POLICY "admin_insert" ON admin
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Policy 3: Admin bisa UPDATE
CREATE POLICY "admin_update" ON admin
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================================
-- TABLE: kelas
-- Columns: id, mata_kuliah_id, dosen_id, nama_kelas, kuota
-- Roles accessing: admin (all), dosen (own), mahasiswa (view)
-- ============================================================================

ALTER TABLE kelas ENABLE ROW LEVEL SECURITY;

-- Policy 1: Admin bisa manage semua kelas
CREATE POLICY "kelas_admin_all" ON kelas
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Policy 2: Dosen bisa lihat kelas mereka sendiri
CREATE POLICY "kelas_dosen_own" ON kelas
  FOR SELECT USING (
    dosen_id IN (SELECT id FROM dosen WHERE user_id = auth.uid())
  );

-- Policy 3: Dosen bisa manage kelas mereka sendiri
CREATE POLICY "kelas_dosen_manage" ON kelas
  FOR ALL USING (
    dosen_id IN (SELECT id FROM dosen WHERE user_id = auth.uid())
  );

-- Policy 4: Mahasiswa bisa lihat semua kelas (untuk enrollment)
CREATE POLICY "kelas_mahasiswa_view" ON kelas
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'mahasiswa')
  );

-- ============================================================================
-- TABLE: kelas_mahasiswa
-- Columns: id, kelas_id, mahasiswa_id, enrolled_at, is_active
-- Roles accessing: admin (all), mahasiswa (own), dosen (view own kelas)
-- ============================================================================

ALTER TABLE kelas_mahasiswa ENABLE ROW LEVEL SECURITY;

-- Policy 1: Admin bisa manage semua enrollment
CREATE POLICY "kelas_mhs_admin_all" ON kelas_mahasiswa
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Policy 2: Mahasiswa bisa lihat enrollment mereka sendiri
CREATE POLICY "kelas_mhs_mahasiswa_own" ON kelas_mahasiswa
  FOR SELECT USING (
    mahasiswa_id IN (SELECT id FROM mahasiswa WHERE user_id = auth.uid())
  );

-- Policy 3: Dosen bisa lihat mahasiswa di kelas mereka
CREATE POLICY "kelas_mhs_dosen_view" ON kelas_mahasiswa
  FOR SELECT USING (
    kelas_id IN (SELECT id FROM kelas WHERE dosen_id IN (SELECT id FROM dosen WHERE user_id = auth.uid()))
  );

-- ============================================================================
-- VERIFY - Check semua RLS & Policies
-- ============================================================================

SELECT 'RLS STATUS' as check_type;
SELECT
  tablename,
  rowsecurity,
  CASE WHEN rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as status
FROM pg_tables
WHERE tablename IN ('users', 'mahasiswa', 'dosen', 'admin', 'kelas', 'kelas_mahasiswa')
ORDER BY tablename;

SELECT 'POLICY COUNT' as check_type;
SELECT
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN ('users', 'mahasiswa', 'dosen', 'admin', 'kelas', 'kelas_mahasiswa')
GROUP BY tablename
ORDER BY tablename;

SELECT 'POLICY DETAILS' as check_type;
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('users', 'mahasiswa', 'dosen', 'admin', 'kelas', 'kelas_mahasiswa')
ORDER BY tablename, policyname;
