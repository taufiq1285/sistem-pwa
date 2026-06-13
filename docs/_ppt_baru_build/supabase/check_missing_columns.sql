-- ============================================================================
-- CEK COLUMN YANG HILANG - Ini yang sering jadi masalah!
-- ============================================================================

-- 1. Cek column di table DOSEN (mungkin kurang NIDN)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'dosen'
ORDER BY ordinal_position;

-- Expected columns di dosen: id, user_id, nip, nidn, gelar_depan, gelar_belakang, fakultas, program_studi

-- 2. Tambahkan NIDN jika belum ada
ALTER TABLE public.dosen
ADD COLUMN IF NOT EXISTS nidn VARCHAR(20);

-- 3. Cek column di table USERS
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;

-- 4. Cek RLS Policies yang mungkin block query
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'users';

-- 5. DISABLE RLS untuk testing
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.dosen DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.mahasiswa DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.laboran DISABLE ROW LEVEL SECURITY;

-- 6. Verifikasi
SELECT
    t.tablename,
    t.rowsecurity as rls_enabled
FROM pg_tables t
WHERE t.schemaname = 'public'
AND t.tablename IN ('users', 'dosen', 'admin', 'mahasiswa', 'laboran')
ORDER BY t.tablename;
