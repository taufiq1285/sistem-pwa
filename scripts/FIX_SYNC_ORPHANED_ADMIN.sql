-- ================================================
-- FIX: Sync Orphaned Super Admin to public.users
-- ================================================
-- Issue: superadmin@akbid.ac.id exists in auth.users but not in public.users
-- This causes "role NULL or unreadable" error

-- Step 1: Insert missing admin user into public.users
INSERT INTO public.users (
    id,
    email,
    full_name,
    role,
    is_active,
    created_at,
    updated_at
)
VALUES (
    '7eb7eead-29e8-48aa-b8be-758b561d35cf',
    'superadmin@akbid.ac.id',
    'Super Admin',
    'admin',
    true,
    '2025-11-15 04:31:28.426513+00',
    NOW()
)
ON CONFLICT (id) DO NOTHING;  -- Safety: don't overwrite if somehow exists

-- Step 2: Verify the fix
SELECT
    u.id,
    u.email,
    u.full_name,
    u.role,
    u.is_active,
    u.created_at,
    'SUCCESS - Admin synced' as status
FROM users u
WHERE u.id = '7eb7eead-29e8-48aa-b8be-758b561d35cf';

-- Step 3: Verify no more orphaned users
SELECT
    COUNT(*) as remaining_orphaned_users
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL;
-- Expected: 0

-- Step 4: Final health check
SELECT
    'Total auth.users' as metric,
    COUNT(*)::text as value
FROM auth.users

UNION ALL

SELECT
    'Total public.users',
    COUNT(*)::text
FROM users

UNION ALL

SELECT
    'Orphaned auth.users',
    COUNT(*)::text
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL;

-- Expected result:
-- Total auth.users: 5
-- Total public.users: 5  ← Should match now!
-- Orphaned auth.users: 0  ← Should be 0!
