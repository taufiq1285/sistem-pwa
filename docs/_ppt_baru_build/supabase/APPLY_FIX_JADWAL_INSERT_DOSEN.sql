-- ============================================================================
-- INSTANT FIX: Dosen Cannot Insert Jadwal Praktikum (403 Forbidden)
-- ============================================================================
-- Copy semua SQL ini dan paste ke Supabase SQL Editor, lalu RUN
-- ============================================================================

-- STEP 1: Drop semua existing INSERT policies (bersihkan dulu)
-- ============================================================================

DROP POLICY IF EXISTS "jadwal_praktikum_insert_admin" ON public.jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_insert_dosen" ON public.jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_insert_laboran" ON public.jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_insert_test" ON public.jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_insert_dosen_only" ON public.jadwal_praktikum;

-- STEP 2: Recreate is_dosen() function (pastikan function benar)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_dosen()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.dosen
        WHERE dosen.user_id = auth.uid()
    );
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_dosen() TO authenticated;

-- STEP 3: Create NEW INSERT policy for dosen (simple & clear)
-- ============================================================================

CREATE POLICY "jadwal_praktikum_insert_dosen"
ON public.jadwal_praktikum
FOR INSERT
TO authenticated
WITH CHECK (
    -- Simple check: user must be a dosen
    public.is_dosen() = true
);

-- STEP 4: Verify policy created successfully
-- ============================================================================

SELECT
    '✅ VERIFICATION' as status,
    policyname,
    cmd,
    permissive,
    roles,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'jadwal_praktikum'
AND cmd = 'INSERT';

-- Expected output:
-- policyname: jadwal_praktikum_insert_dosen
-- cmd: INSERT
-- permissive: PERMISSIVE
-- roles: {authenticated}
-- with_check: (public.is_dosen() = true)

-- ============================================================================
-- DONE! Sekarang dosen seharusnya bisa insert jadwal
-- ============================================================================

-- TROUBLESHOOTING: Jika masih error 403 setelah run SQL ini:
-- 1. Logout dari aplikasi
-- 2. Clear browser cache
-- 3. Login ulang sebagai dosen
-- 4. Coba insert jadwal lagi
