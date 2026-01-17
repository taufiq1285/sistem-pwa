-- ================================================
-- QUERY 1: Find users with NULL or invalid role
-- ================================================
-- Expected: 0 rows (karena ada constraint)
SELECT
    id,
    full_name,
    email,
    role,
    created_at
FROM users
WHERE role IS NULL
   OR role NOT IN ('admin', 'dosen', 'mahasiswa', 'laboran')
ORDER BY created_at DESC
LIMIT 20;

-- ================================================
-- QUERY 2: Find orphaned auth.users (MOST IMPORTANT!)
-- ================================================
-- Ini kemungkinan besar masalah yang Anda alami
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
  AND au.email_confirmed_at IS NOT NULL  -- Only confirmed emails
ORDER BY au.created_at DESC
LIMIT 20;

-- ================================================
-- QUERY 3: Check role consistency
-- ================================================
-- User dengan role tertentu harus punya record di tabel role-nya
SELECT
    'Mahasiswa without record' as issue,
    u.id,
    u.full_name,
    u.email,
    u.role,
    u.created_at
FROM users u
LEFT JOIN mahasiswa m ON u.id = m.user_id
WHERE u.role = 'mahasiswa' AND m.user_id IS NULL

UNION ALL

SELECT
    'Dosen without record' as issue,
    u.id,
    u.full_name,
    u.email,
    u.role,
    u.created_at
FROM users u
LEFT JOIN dosen d ON u.id = d.user_id
WHERE u.role = 'dosen' AND d.user_id IS NULL

UNION ALL

SELECT
    'Laboran without record' as issue,
    u.id,
    u.full_name,
    u.email,
    u.role,
    u.created_at
FROM users u
LEFT JOIN laboran l ON u.id = l.user_id
WHERE u.role = 'laboran' AND l.user_id IS NULL

ORDER BY created_at DESC
LIMIT 20;

-- ================================================
-- QUERY 4: Summary health check
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
    'Orphaned auth.users (PROBLEM!)',
    COUNT(*)::text
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL

UNION ALL

SELECT
    'Users with invalid role',
    COUNT(*)::text
FROM users
WHERE role NOT IN ('admin', 'dosen', 'mahasiswa', 'laboran')

UNION ALL

SELECT
    'Mahasiswa without record',
    COUNT(*)::text
FROM users u
LEFT JOIN mahasiswa m ON u.id = m.user_id
WHERE u.role = 'mahasiswa' AND m.user_id IS NULL

UNION ALL

SELECT
    'Dosen without record',
    COUNT(*)::text
FROM users u
LEFT JOIN dosen d ON u.id = d.user_id
WHERE u.role = 'dosen' AND d.user_id IS NULL

UNION ALL

SELECT
    'Laboran without record',
    COUNT(*)::text
FROM users u
LEFT JOIN laboran l ON u.id = l.user_id
WHERE u.role = 'laboran' AND l.user_id IS NULL;

-- ================================================
-- QUERY 5: Recent registrations (last 20)
-- ================================================
SELECT
    u.id,
    u.full_name,
    u.email,
    u.role,
    u.created_at,
    CASE
        WHEN u.role = 'mahasiswa' THEN EXISTS(SELECT 1 FROM mahasiswa WHERE user_id = u.id)
        WHEN u.role = 'dosen' THEN EXISTS(SELECT 1 FROM dosen WHERE user_id = u.id)
        WHEN u.role = 'laboran' THEN EXISTS(SELECT 1 FROM laboran WHERE user_id = u.id)
        ELSE true
    END as has_role_record,
    au.email_confirmed_at IS NOT NULL as email_confirmed
FROM users u
JOIN auth.users au ON u.id = au.id
ORDER BY u.created_at DESC
LIMIT 20;
