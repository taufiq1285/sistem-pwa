-- ============================================================================
-- FIX LOGIN ERROR - Database Schema Fix
-- Solusi untuk error "Database error querying schema"
-- ============================================================================

-- Step 1: Cek user yang ada di auth.users tapi TIDAK ada di public.users
SELECT
    au.id,
    au.email,
    au.raw_user_meta_data->>'role' as role,
    au.created_at,
    CASE
        WHEN pu.id IS NULL THEN 'MISSING PROFILE ⚠️'
        ELSE 'Profile exists ✓'
    END as status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
ORDER BY au.created_at DESC;

-- Step 2: Perbaiki profile yang hilang
-- Jalankan ini untuk setiap user yang MISSING PROFILE
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
    COALESCE(
        au.raw_user_meta_data->>'full_name',
        SPLIT_PART(au.email, '@', 1)
    ) as full_name,
    COALESCE(
        (au.raw_user_meta_data->>'role')::user_role,
        'mahasiswa'::user_role
    ) as role,
    true as is_active,
    au.created_at,
    NOW() as updated_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Step 3: Perbaiki admin profile yang hilang
-- Untuk setiap admin user, pastikan ada di table admin
INSERT INTO public.admin (
    user_id,
    level,
    permissions,
    created_at,
    updated_at
)
SELECT
    u.id as user_id,
    'admin' as level,
    '{}'::jsonb as permissions,
    NOW() as created_at,
    NOW() as updated_at
FROM public.users u
WHERE u.role = 'admin'
AND NOT EXISTS (
    SELECT 1 FROM public.admin a WHERE a.user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;

-- Step 4: Perbaiki dosen profile yang hilang
INSERT INTO public.dosen (
    user_id,
    nip,
    gelar_depan,
    gelar_belakang,
    created_at,
    updated_at
)
SELECT
    u.id as user_id,
    COALESCE(
        (SELECT au.raw_user_meta_data->>'nip' FROM auth.users au WHERE au.id = u.id),
        'NIP-' || SUBSTRING(u.id::text, 1, 8)
    ) as nip,
    (SELECT au.raw_user_meta_data->>'gelar_depan' FROM auth.users au WHERE au.id = u.id) as gelar_depan,
    (SELECT au.raw_user_meta_data->>'gelar_belakang' FROM auth.users au WHERE au.id = u.id) as gelar_belakang,
    NOW() as created_at,
    NOW() as updated_at
FROM public.users u
WHERE u.role = 'dosen'
AND NOT EXISTS (
    SELECT 1 FROM public.dosen d WHERE d.user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;

-- Step 5: Perbaiki mahasiswa profile yang hilang
INSERT INTO public.mahasiswa (
    user_id,
    nim,
    program_studi,
    angkatan,
    semester,
    created_at,
    updated_at
)
SELECT
    u.id as user_id,
    COALESCE(
        (SELECT raw_user_meta_data->>'nim' FROM auth.users WHERE id = u.id),
        'NIM-' || SUBSTRING(u.id::text, 1, 8)
    ) as nim,
    COALESCE(
        (SELECT raw_user_meta_data->>'program_studi' FROM auth.users WHERE id = u.id),
        'Teknik Informatika'
    ) as program_studi,
    COALESCE(
        (SELECT (raw_user_meta_data->>'angkatan')::integer FROM auth.users WHERE id = u.id),
        EXTRACT(YEAR FROM NOW())::integer
    ) as angkatan,
    COALESCE(
        (SELECT (raw_user_meta_data->>'semester')::integer FROM auth.users WHERE id = u.id),
        1
    ) as semester,
    NOW() as created_at,
    NOW() as updated_at
FROM public.users u
WHERE u.role = 'mahasiswa'
AND NOT EXISTS (
    SELECT 1 FROM public.mahasiswa m WHERE m.user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;

-- Step 6: Perbaiki laboran profile yang hilang
INSERT INTO public.laboran (
    user_id,
    nip,
    created_at,
    updated_at
)
SELECT
    u.id as user_id,
    COALESCE(
        (SELECT raw_user_meta_data->>'nip' FROM auth.users WHERE id = u.id),
        'NIP-LAB-' || SUBSTRING(u.id::text, 1, 8)
    ) as nip,
    NOW() as created_at,
    NOW() as updated_at
FROM public.users u
WHERE u.role = 'laboran'
AND NOT EXISTS (
    SELECT 1 FROM public.laboran l WHERE l.user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;

-- Step 7: Verifikasi hasil
SELECT
    'Users in auth.users' as table_name,
    COUNT(*) as count
FROM auth.users
UNION ALL
SELECT
    'Profiles in public.users' as table_name,
    COUNT(*) as count
FROM public.users
UNION ALL
SELECT
    'Admin profiles' as table_name,
    COUNT(*) as count
FROM public.admin
UNION ALL
SELECT
    'Dosen profiles' as table_name,
    COUNT(*) as count
FROM public.dosen
UNION ALL
SELECT
    'Mahasiswa profiles' as table_name,
    COUNT(*) as count
FROM public.mahasiswa
UNION ALL
SELECT
    'Laboran profiles' as table_name,
    COUNT(*) as count
FROM public.laboran;

-- Step 8: Tampilkan detail semua user dan profile mereka
SELECT
    u.email,
    u.role,
    u.full_name,
    u.is_active,
    CASE
        WHEN u.role = 'admin' THEN (SELECT 'Admin ID: ' || a.id FROM admin a WHERE a.user_id = u.id)
        WHEN u.role = 'dosen' THEN (SELECT 'Dosen ID: ' || d.id || ' NIP: ' || d.nip FROM dosen d WHERE d.user_id = u.id)
        WHEN u.role = 'mahasiswa' THEN (SELECT 'Mahasiswa ID: ' || m.id || ' NIM: ' || m.nim FROM mahasiswa m WHERE m.user_id = u.id)
        WHEN u.role = 'laboran' THEN (SELECT 'Laboran ID: ' || l.id || ' NIP: ' || l.nip FROM laboran l WHERE l.user_id = u.id)
    END as profile_info
FROM public.users u
ORDER BY u.created_at DESC;
