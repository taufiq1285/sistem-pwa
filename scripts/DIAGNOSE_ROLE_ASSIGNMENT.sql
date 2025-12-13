-- ================================================
-- DIAGNOSTIC QUERIES FOR ROLE ASSIGNMENT ISSUE
-- ================================================
-- Issue: Some registrations have NULL or unreadable roles
-- Date: 2025-12-09

-- ================================================
-- PART 1: CHECK USERS TABLE SCHEMA
-- ================================================

-- 1A. Check role column definition
SELECT
    column_name,
    data_type,
    column_default,
    is_nullable,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND column_name = 'role';

-- Expected:
-- role | text or varchar | NULL | NO (not nullable) | -

-- 1B. Check if role has CHECK constraint
SELECT
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'users'
  AND tc.constraint_type = 'CHECK'
  AND cc.check_clause LIKE '%role%';

-- Expected: Constraint like role IN ('admin', 'dosen', 'mahasiswa', 'laboran')


-- ================================================
-- PART 2: FIND USERS WITH PROBLEMATIC ROLES
-- ================================================

-- 2A. Find users with NULL role
SELECT
    id,
    full_name,
    email,
    role,
    created_at,
    updated_at
FROM users
WHERE role IS NULL
ORDER BY created_at DESC;

-- Expected: Should be 0 rows if working correctly

-- 2B. Find users with invalid role values
SELECT
    id,
    full_name,
    email,
    role,
    created_at
FROM users
WHERE role NOT IN ('admin', 'dosen', 'mahasiswa', 'laboran')
ORDER BY created_at DESC;

-- Expected: Should be 0 rows

-- 2C. Count users by role
SELECT
    role,
    COUNT(*) as count
FROM users
GROUP BY role
ORDER BY count DESC;

-- Expected: admin, dosen, mahasiswa, laboran with counts


-- ================================================
-- PART 3: CHECK ROLE-SPECIFIC TABLE CONSISTENCY
-- ================================================

-- 3A. Find users with role='mahasiswa' but no mahasiswa record
SELECT
    u.id,
    u.full_name,
    u.email,
    u.role,
    u.created_at
FROM users u
LEFT JOIN mahasiswa m ON u.id = m.user_id
WHERE u.role = 'mahasiswa'
  AND m.user_id IS NULL
ORDER BY u.created_at DESC;

-- Expected: Should be 0 rows (all mahasiswa users should have mahasiswa record)

-- 3B. Find users with role='dosen' but no dosen record
SELECT
    u.id,
    u.full_name,
    u.email,
    u.role,
    u.created_at
FROM users u
LEFT JOIN dosen d ON u.id = d.user_id
WHERE u.role = 'dosen'
  AND d.user_id IS NULL
ORDER BY u.created_at DESC;

-- Expected: Should be 0 rows

-- 3C. Find users with role='laboran' but no laboran record
SELECT
    u.id,
    u.full_name,
    u.email,
    u.role,
    u.created_at
FROM users u
LEFT JOIN laboran l ON u.id = l.user_id
WHERE u.role = 'laboran'
  AND l.user_id IS NULL
ORDER BY u.created_at DESC;

-- Expected: Should be 0 rows


-- ================================================
-- PART 4: CHECK RLS POLICIES ON USERS TABLE
-- ================================================

-- 4A. List all policies on users table
SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY cmd, policyname;

-- Expected: Should have INSERT policies that don't block role assignment

-- 4B. Check specific INSERT policies
SELECT
    policyname,
    cmd,
    qual AS using_expression,
    with_check AS with_check_expression
FROM pg_policies
WHERE tablename = 'users'
  AND cmd = 'INSERT'
ORDER BY policyname;

-- Expected: Policies should allow INSERT with any valid role


-- ================================================
-- PART 5: CHECK AUTH.USERS vs PUBLIC.USERS SYNC
-- ================================================

-- 5A. Find auth.users without public.users record
SELECT
    au.id,
    au.email,
    au.created_at,
    au.email_confirmed_at,
    u.role
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL
ORDER BY au.created_at DESC
LIMIT 20;

-- Expected: Might show recently created but not yet synced users

-- 5B. Check if there are auth users with confirmed email but no public.users
SELECT
    COUNT(*) as count_missing_profile,
    COUNT(*) FILTER (WHERE au.email_confirmed_at IS NOT NULL) as count_confirmed_no_profile
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL;


-- ================================================
-- PART 6: RECENT REGISTRATIONS AUDIT
-- ================================================

-- 6. Check last 20 registrations and their completeness
SELECT
    u.id,
    u.full_name,
    u.email,
    u.role,
    u.created_at,
    CASE
        WHEN u.role = 'mahasiswa' THEN (SELECT COUNT(*) FROM mahasiswa WHERE user_id = u.id)
        WHEN u.role = 'dosen' THEN (SELECT COUNT(*) FROM dosen WHERE user_id = u.id)
        WHEN u.role = 'laboran' THEN (SELECT COUNT(*) FROM laboran WHERE user_id = u.id)
        ELSE 0
    END as has_role_record,
    au.email_confirmed_at IS NOT NULL as email_confirmed
FROM users u
JOIN auth.users au ON u.id = au.id
ORDER BY u.created_at DESC
LIMIT 20;

-- Expected: has_role_record should be 1 for all users


-- ================================================
-- SUMMARY QUERY
-- ================================================

-- 7. Overall health check
SELECT
    'Total Users' as metric,
    COUNT(*) as count
FROM users
UNION ALL
SELECT
    'Users with NULL role',
    COUNT(*)
FROM users
WHERE role IS NULL
UNION ALL
SELECT
    'Users with invalid role',
    COUNT(*)
FROM users
WHERE role NOT IN ('admin', 'dosen', 'mahasiswa', 'laboran')
UNION ALL
SELECT
    'Mahasiswa without record',
    COUNT(*)
FROM users u
LEFT JOIN mahasiswa m ON u.id = m.user_id
WHERE u.role = 'mahasiswa' AND m.user_id IS NULL
UNION ALL
SELECT
    'Dosen without record',
    COUNT(*)
FROM users u
LEFT JOIN dosen d ON u.id = d.user_id
WHERE u.role = 'dosen' AND d.user_id IS NULL
UNION ALL
SELECT
    'Laboran without record',
    COUNT(*)
FROM users u
LEFT JOIN laboran l ON u.id = l.user_id
WHERE u.role = 'laboran' AND l.user_id IS NULL;

-- All counts except "Total Users" should be 0
