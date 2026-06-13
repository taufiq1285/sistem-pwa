-- ============================================================================
-- BUAT PROFILE UNTUK ADMIN YANG DIBUAT MANUAL DI SUPABASE
-- ============================================================================

-- STEP 1: Cek admin yang ada di auth.users tapi BELUM punya profile
SELECT
    au.id,
    au.email,
    au.created_at,
    au.raw_user_meta_data,
    CASE WHEN pu.id IS NULL THEN '❌ NO PROFILE - HARUS DIBUAT!' ELSE '✅ OK' END as status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
ORDER BY au.created_at;

-- STEP 2: Buat profile di public.users untuk SEMUA user yang belum punya
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
        'Admin User'
    ) as full_name,
    'admin'::user_role as role,  -- Paksa jadi admin
    true as is_active,
    au.created_at,
    NOW() as updated_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL  -- Hanya yang belum punya profile
ON CONFLICT (id) DO UPDATE SET
    role = 'admin'::user_role,  -- Update role jadi admin jika sudah ada
    updated_at = NOW();

-- STEP 3: Buat record di table admin untuk user dengan role admin
INSERT INTO public.admin (
    user_id,
    level,
    permissions,
    created_at,
    updated_at
)
SELECT
    u.id as user_id,
    'super_admin' as level,
    '{
        "manage_users": true,
        "manage_courses": true,
        "manage_labs": true,
        "view_reports": true,
        "manage_system": true
    }'::jsonb as permissions,
    NOW() as created_at,
    NOW() as updated_at
FROM public.users u
WHERE u.role = 'admin'
AND NOT EXISTS (
    SELECT 1 FROM public.admin a WHERE a.user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;

-- STEP 4: DISABLE RLS untuk semua table auth-related
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.dosen DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.mahasiswa DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.laboran DISABLE ROW LEVEL SECURITY;

-- STEP 5: Verifikasi - Cek semua admin users
SELECT
    u.id,
    u.email,
    u.full_name,
    u.role,
    u.is_active,
    a.level as admin_level,
    a.permissions as admin_permissions,
    CASE
        WHEN a.id IS NOT NULL THEN '✅ Admin profile exists'
        ELSE '❌ Admin profile MISSING'
    END as admin_status
FROM public.users u
LEFT JOIN public.admin a ON u.id = a.user_id
WHERE u.role = 'admin'
ORDER BY u.created_at;

-- STEP 6: Jika mau update email admin tertentu (OPSIONAL)
-- Ganti 'admin@example.com' dengan email admin Anda
-- UPDATE public.users
-- SET full_name = 'Super Admin', role = 'admin'
-- WHERE email = 'admin@example.com';
