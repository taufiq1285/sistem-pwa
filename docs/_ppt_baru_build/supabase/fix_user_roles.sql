-- ============================================================================
-- FIX USER ROLES - Perbaiki role yang salah
-- ============================================================================

-- 1. CEK SEMUA USER DAN ROLE MEREKA
SELECT
    u.id,
    u.email,
    u.full_name,
    u.role as current_role,
    au.raw_user_meta_data->>'role' as metadata_role,
    CASE
        WHEN u.email LIKE '%admin%' THEN 'admin'
        WHEN u.email LIKE '%dosen%' THEN 'dosen'
        WHEN u.email LIKE '%mahasiswa%' THEN 'mahasiswa'
        WHEN u.email LIKE '%laboran%' THEN 'laboran'
        ELSE u.role
    END as suggested_role
FROM public.users u
JOIN auth.users au ON u.id = au.id
ORDER BY u.created_at DESC;

-- ============================================================================
-- 2. FIX MANUAL - Update role sesuai email/metadata
-- ============================================================================

-- Option A: Update berdasarkan metadata dari auth.users
UPDATE public.users u
SET role = CASE
    WHEN au.raw_user_meta_data->>'role' = 'admin' THEN 'admin'::user_role
    WHEN au.raw_user_meta_data->>'role' = 'dosen' THEN 'dosen'::user_role
    WHEN au.raw_user_meta_data->>'role' = 'mahasiswa' THEN 'mahasiswa'::user_role
    WHEN au.raw_user_meta_data->>'role' = 'laboran' THEN 'laboran'::user_role
    ELSE u.role
END,
updated_at = NOW()
FROM auth.users au
WHERE u.id = au.id
AND au.raw_user_meta_data->>'role' IS NOT NULL
AND u.role != (au.raw_user_meta_data->>'role')::user_role;

-- Option B: Update manual untuk user tertentu
-- UPDATE public.users
-- SET role = 'dosen'::user_role
-- WHERE email = 'EMAIL_DOSEN@example.com';  -- ⚠️ GANTI dengan email dosen

-- ============================================================================
-- 3. BUAT PROFILE ROLE-SPECIFIC jika belum ada
-- ============================================================================

-- Buat dosen profiles
INSERT INTO public.dosen (user_id, nip, gelar_depan, gelar_belakang)
SELECT
    u.id,
    COALESCE(
        (SELECT au.raw_user_meta_data->>'nip' FROM auth.users au WHERE au.id = u.id),
        'NIP-' || SUBSTRING(u.id::text, 1, 8)
    ),
    (SELECT au.raw_user_meta_data->>'gelar_depan' FROM auth.users au WHERE au.id = u.id),
    (SELECT au.raw_user_meta_data->>'gelar_belakang' FROM auth.users au WHERE au.id = u.id)
FROM public.users u
WHERE u.role = 'dosen'
AND NOT EXISTS (SELECT 1 FROM public.dosen d WHERE d.user_id = u.id)
ON CONFLICT (user_id) DO NOTHING;

-- Buat mahasiswa profiles
INSERT INTO public.mahasiswa (user_id, nim, program_studi, angkatan, semester)
SELECT
    u.id,
    COALESCE(
        (SELECT au.raw_user_meta_data->>'nim' FROM auth.users au WHERE au.id = u.id),
        'NIM-' || SUBSTRING(u.id::text, 1, 8)
    ),
    COALESCE(
        (SELECT au.raw_user_meta_data->>'program_studi' FROM auth.users au WHERE au.id = u.id),
        'Teknik Informatika'
    ),
    COALESCE(
        (SELECT (au.raw_user_meta_data->>'angkatan')::integer FROM auth.users au WHERE au.id = u.id),
        EXTRACT(YEAR FROM NOW())::integer
    ),
    COALESCE(
        (SELECT (au.raw_user_meta_data->>'semester')::integer FROM auth.users au WHERE au.id = u.id),
        1
    )
FROM public.users u
WHERE u.role = 'mahasiswa'
AND NOT EXISTS (SELECT 1 FROM public.mahasiswa m WHERE m.user_id = u.id)
ON CONFLICT (user_id) DO NOTHING;

-- Buat laboran profiles
INSERT INTO public.laboran (user_id, nip)
SELECT
    u.id,
    COALESCE(
        (SELECT au.raw_user_meta_data->>'nip' FROM auth.users au WHERE au.id = u.id),
        'NIP-LAB-' || SUBSTRING(u.id::text, 1, 8)
    )
FROM public.users u
WHERE u.role = 'laboran'
AND NOT EXISTS (SELECT 1 FROM public.laboran l WHERE l.user_id = u.id)
ON CONFLICT (user_id) DO NOTHING;

-- Hapus profile admin untuk user yang bukan admin
DELETE FROM public.admin
WHERE user_id IN (SELECT id FROM public.users WHERE role != 'admin');

-- ============================================================================
-- 4. VERIFIKASI HASIL
-- ============================================================================
SELECT
    u.email,
    u.full_name,
    u.role,
    CASE
        WHEN u.role = 'admin' THEN (SELECT 'Admin profile: ' || a.level FROM admin a WHERE a.user_id = u.id LIMIT 1)
        WHEN u.role = 'dosen' THEN (SELECT 'Dosen profile: NIP=' || d.nip FROM dosen d WHERE d.user_id = u.id LIMIT 1)
        WHEN u.role = 'mahasiswa' THEN (SELECT 'Mahasiswa profile: NIM=' || m.nim FROM mahasiswa m WHERE m.user_id = u.id LIMIT 1)
        WHEN u.role = 'laboran' THEN (SELECT 'Laboran profile: NIP=' || l.nip FROM laboran l WHERE l.user_id = u.id LIMIT 1)
    END as profile_info,
    CASE
        WHEN u.role = 'admin' AND EXISTS(SELECT 1 FROM admin WHERE user_id = u.id) THEN '✅'
        WHEN u.role = 'dosen' AND EXISTS(SELECT 1 FROM dosen WHERE user_id = u.id) THEN '✅'
        WHEN u.role = 'mahasiswa' AND EXISTS(SELECT 1 FROM mahasiswa WHERE user_id = u.id) THEN '✅'
        WHEN u.role = 'laboran' AND EXISTS(SELECT 1 FROM laboran WHERE user_id = u.id) THEN '✅'
        ELSE '❌ Missing profile!'
    END as status
FROM public.users u
ORDER BY u.role, u.email;
