-- ================================================
-- Find orphaned auth.users (MOST IMPORTANT!)
-- ================================================
-- User di auth.users tapi TIDAK ada di public.users
SELECT
    au.id,
    au.email,
    au.created_at,
    au.email_confirmed_at,
    au.raw_user_meta_data->>'full_name' as attempted_name,
    au.raw_user_meta_data->>'role' as attempted_role
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL
ORDER BY au.created_at DESC;
