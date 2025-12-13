-- ================================================
-- Summary: Compare auth.users vs public.users
-- ================================================
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
