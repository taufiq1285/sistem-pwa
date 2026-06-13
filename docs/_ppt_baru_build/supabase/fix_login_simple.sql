-- ============================================================================
-- SIMPLE FIX - Jalankan Step by Step
-- ============================================================================

-- STEP 1: CEK USER YANG BERMASALAH
-- Copy & paste query ini, RUN, lalu lihat hasilnya
-- ============================================================================
SELECT
    au.id,
    au.email,
    au.raw_user_meta_data->>'role' as role,
    CASE
        WHEN pu.id IS NULL THEN '❌ MISSING PROFILE'
        ELSE '✅ OK'
    END as status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id;

-- ============================================================================
-- STEP 2: BUAT PROFILE YANG HILANG di public.users
-- Jalankan ini HANYA jika ada user dengan status "MISSING PROFILE"
-- ============================================================================
INSERT INTO public.users (
    id,
    email,
    full_name,
    role,
    is_active,
    created_at,
    updated_at
)
SELECT
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', SPLIT_PART(au.email, '@', 1)) as full_name,
    COALESCE((au.raw_user_meta_data->>'role')::user_role, 'mahasiswa'::user_role) as role,
    true,
    au.created_at,
    NOW()
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 3: BUAT ADMIN PROFILE (Jika role = admin)
-- ============================================================================
INSERT INTO public.admin (user_id, level, permissions)
SELECT u.id, 'admin', '{}'::jsonb
FROM public.users u
WHERE u.role = 'admin'
AND NOT EXISTS (SELECT 1 FROM public.admin a WHERE a.user_id = u.id)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- STEP 4: BUAT DOSEN PROFILE (Jika role = dosen)
-- ============================================================================
INSERT INTO public.dosen (user_id, nip)
SELECT
    u.id,
    'NIP-' || SUBSTRING(u.id::text, 1, 8)
FROM public.users u
WHERE u.role = 'dosen'
AND NOT EXISTS (SELECT 1 FROM public.dosen d WHERE d.user_id = u.id)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- STEP 5: BUAT MAHASISWA PROFILE (Jika role = mahasiswa)
-- ============================================================================
INSERT INTO public.mahasiswa (user_id, nim, program_studi, angkatan, semester)
SELECT
    u.id,
    'NIM-' || SUBSTRING(u.id::text, 1, 8),
    'Teknik Informatika',
    EXTRACT(YEAR FROM NOW())::integer,
    1
FROM public.users u
WHERE u.role = 'mahasiswa'
AND NOT EXISTS (SELECT 1 FROM public.mahasiswa m WHERE m.user_id = u.id)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- STEP 6: BUAT LABORAN PROFILE (Jika role = laboran)
-- ============================================================================
INSERT INTO public.laboran (user_id, nip)
SELECT
    u.id,
    'NIP-LAB-' || SUBSTRING(u.id::text, 1, 8)
FROM public.users u
WHERE u.role = 'laboran'
AND NOT EXISTS (SELECT 1 FROM public.laboran l WHERE l.user_id = u.id)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- STEP 7: VERIFIKASI - Cek semua user dan profile
-- ============================================================================
SELECT
    u.email,
    u.role,
    u.full_name,
    CASE
        WHEN u.role = 'admin' THEN
            CASE WHEN EXISTS(SELECT 1 FROM admin WHERE user_id = u.id) THEN '✅' ELSE '❌' END
        WHEN u.role = 'dosen' THEN
            CASE WHEN EXISTS(SELECT 1 FROM dosen WHERE user_id = u.id) THEN '✅' ELSE '❌' END
        WHEN u.role = 'mahasiswa' THEN
            CASE WHEN EXISTS(SELECT 1 FROM mahasiswa WHERE user_id = u.id) THEN '✅' ELSE '❌' END
        WHEN u.role = 'laboran' THEN
            CASE WHEN EXISTS(SELECT 1 FROM laboran WHERE user_id = u.id) THEN '✅' ELSE '❌' END
        ELSE '❓'
    END as profile_status
FROM public.users u
ORDER BY u.created_at DESC;
