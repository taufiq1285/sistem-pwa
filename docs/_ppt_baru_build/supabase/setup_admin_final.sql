-- ============================================================================
-- SETUP ADMIN ACCOUNT - Option 1: Gunakan test@admin.com
-- ============================================================================

-- 1. Update email admin (OPSIONAL - jika mau ganti email)
-- Ganti 'EMAIL_BARU@example.com' dengan email yang diinginkan
/*
UPDATE auth.users
SET email = 'EMAIL_BARU@example.com',
    raw_user_meta_data = jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb),
        '{full_name}',
        '"Admin User"'
    )
WHERE email = 'test@admin.com';

UPDATE public.users
SET email = 'EMAIL_BARU@example.com',
    full_name = 'Admin User',
    updated_at = NOW()
WHERE email = 'test@admin.com';
*/

-- 2. Update full name admin
UPDATE public.users
SET full_name = 'Super Admin',  -- ⚠️ GANTI sesuai nama yang diinginkan
    updated_at = NOW()
WHERE email = 'test@admin.com';

-- 3. Update admin level & permissions
UPDATE public.admin
SET level = 'super_admin',
    permissions = '{
        "manage_users": true,
        "manage_courses": true,
        "manage_labs": true,
        "manage_equipment": true,
        "view_reports": true,
        "manage_system": true,
        "manage_announcements": true
    }'::jsonb,
    updated_at = NOW()
WHERE user_id IN (SELECT id FROM public.users WHERE email = 'test@admin.com');

-- 4. Verifikasi data admin
SELECT
    u.id,
    u.email,
    u.full_name,
    u.role,
    u.is_active,
    a.level,
    a.permissions,
    au.email_confirmed_at IS NOT NULL as email_confirmed,
    au.last_sign_in_at
FROM public.users u
JOIN public.admin a ON u.id = a.user_id
JOIN auth.users au ON u.id = au.id
WHERE u.email = 'test@admin.com';

-- 5. OPTIONAL: Hapus admin lama yang corrupt (jika ada)
-- Uncomment baris di bawah jika mau hapus user admin lama
/*
DELETE FROM auth.users
WHERE email = 'EMAIL_ADMIN_LAMA@example.com';  -- ⚠️ GANTI dengan email admin lama
*/
