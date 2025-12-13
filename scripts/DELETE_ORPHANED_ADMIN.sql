-- ================================================
-- DELETE Orphaned Super Admin (not used)
-- ================================================

-- Delete from auth.users (will cascade to other auth tables)
-- Note: This requires service_role or admin access
-- If this fails, delete manually from Supabase Dashboard → Authentication → Users

-- Check before delete
SELECT
    id,
    email,
    created_at,
    'Will be deleted' as action
FROM auth.users
WHERE email = 'superadmin@akbid.ac.id';

-- Uncomment to delete:
-- DELETE FROM auth.users WHERE email = 'superadmin@akbid.ac.id';

-- Verify deleted
SELECT COUNT(*) as orphaned_users
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL;
-- Expected: 0
