# RLS VIOLATION FIX: jadwal_praktikum INSERT Error

**Error:** `new row violates row-level security policy for table "jadwal_praktikum"`

## Root Cause Analysis

The error occurs because:

1. **Migration 34** removed admin policies from `jadwal_praktikum`
2. **Migration 36** changed role checking to use JWT tokens instead of database queries
3. **is_dosen() function returns FALSE** when:
   - JWT token doesn't include `user_metadata.role` field, OR
   - User's `auth.users.raw_user_meta_data` wasn't set during registration, OR
   - JWT role format doesn't match expected value

## Why This Happens

### Current is_dosen() Function (Migration 36)

```sql
CREATE OR REPLACE FUNCTION is_dosen()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(get_user_role() = 'dosen', FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

### Current get_user_role() Function (Migration 36)

```sql
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN COALESCE(
        (auth.jwt() -> 'user_metadata' ->> 'role')::TEXT,
        'mahasiswa' -- Default role if not set
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

**Problem:** If JWT doesn't have `user_metadata.role`, it returns 'mahasiswa' as default, and `is_dosen()` returns FALSE, blocking the INSERT.

## Current jadwal_praktikum INSERT Policy

```sql
CREATE POLICY "jadwal_praktikum_insert_dosen"
ON public.jadwal_praktikum
FOR INSERT
TO authenticated
WITH CHECK (is_dosen());
```

**This blocks INSERT unless is_dosen() returns TRUE**

## Solutions

### Solution 1: Fix JWT Role Metadata (Recommended)

Ensure all user registrations set the role in JWT metadata.

**Check current auth.users setup:**

```sql
SELECT
  u.id,
  u.email,
  u.raw_user_meta_data ->> 'role' as metadata_role,
  u.created_at
FROM auth.users u
WHERE u.raw_user_meta_data ->> 'role' IS NULL
LIMIT 5;
```

**If users are missing role metadata:**

```sql
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"dosen"'::jsonb
)
WHERE id = '[user_uuid]';

-- User must log out and log back in for JWT to refresh
```

### Solution 2: Add Fallback Role Checking (Applied in Migration 39)

Rewrite `get_user_role()` to try JWT first, then fall back to checking role tables.

**New get_user_role() with fallback:**

```sql
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
    jwt_role TEXT;
BEGIN
    -- Get role from JWT token (primary source)
    jwt_role := (auth.jwt() -> 'user_metadata' ->> 'role')::TEXT;

    -- If JWT has role, return it
    IF jwt_role IS NOT NULL AND jwt_role != 'null' AND jwt_role != '' THEN
        RETURN jwt_role;
    END IF;

    -- Try app_metadata as secondary source
    jwt_role := (auth.jwt() -> 'app_metadata' ->> 'role')::TEXT;
    IF jwt_role IS NOT NULL AND jwt_role != 'null' AND jwt_role != '' THEN
        RETURN jwt_role;
    END IF;

    -- Last resort: check role tables directly
    IF EXISTS(SELECT 1 FROM public.admin WHERE user_id = auth.uid()) THEN
        RETURN 'admin';
    ELSIF EXISTS(SELECT 1 FROM public.dosen WHERE user_id = auth.uid()) THEN
        RETURN 'dosen';
    ELSIF EXISTS(SELECT 1 FROM public.laboran WHERE user_id = auth.uid()) THEN
        RETURN 'laboran';
    ELSIF EXISTS(SELECT 1 FROM public.mahasiswa WHERE user_id = auth.uid()) THEN
        RETURN 'mahasiswa';
    END IF;

    -- Default role
    RETURN 'mahasiswa';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

**This ensures:**

- ✅ JWT role is checked first (fast)
- ✅ If JWT is missing, role tables are checked (reliable)
- ✅ Default to mahasiswa if all else fails

### Solution 3: Emergency Permissive Policy (Testing Only)

If you need to test quickly, temporarily create a permissive policy:

```sql
CREATE POLICY "jadwal_praktikum_insert_test"
ON public.jadwal_praktikum
FOR INSERT
TO authenticated
WITH CHECK (true);
```

**⚠️ WARNING:** This allows anyone to insert, use for testing only!

## How to Apply Fix

### Step 1: Run Migration 39

Go to Supabase SQL Editor and run:

```
supabase/migrations/39_final_rls_fix.sql
```

### Step 2: Update Users' JWT Metadata (if needed)

Check if users need role metadata updated:

```sql
SELECT
  u.id,
  u.email,
  u.raw_user_meta_data ->> 'role' as has_role_metadata,
  CASE
    WHEN EXISTS(SELECT 1 FROM public.dosen WHERE user_id = u.id) THEN 'dosen'
    WHEN EXISTS(SELECT 1 FROM public.admin WHERE user_id = u.id) THEN 'admin'
    WHEN EXISTS(SELECT 1 FROM public.laboran WHERE user_id = u.id) THEN 'laboran'
    ELSE 'mahasiswa'
  END as should_be_role
FROM auth.users u;
```

If metadata is missing for any user:

```sql
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  to_jsonb(
    CASE
      WHEN EXISTS(SELECT 1 FROM public.dosen WHERE user_id = id) THEN 'dosen'
      WHEN EXISTS(SELECT 1 FROM public.admin WHERE user_id = id) THEN 'admin'
      WHEN EXISTS(SELECT 1 FROM public.laboran WHERE user_id = id) THEN 'laboran'
      ELSE 'mahasiswa'
    END
  )
)
WHERE raw_user_meta_data ->> 'role' IS NULL;
```

### Step 3: Test

1. Log out of application
2. Log back in (to get new JWT with updated metadata)
3. Try creating jadwal_praktikum
4. Should succeed now!

## Verification

After applying fix, run:

```sql
-- Check function definitions
SELECT proname, prosrc FROM pg_proc WHERE proname = 'get_user_role';

-- Check policies
SELECT policyname, cmd, with_check::text
FROM pg_policies
WHERE tablename = 'jadwal_praktikum'
ORDER BY cmd;

-- Test while logged in (shows what the functions return)
SELECT
  get_user_role() as role,
  is_dosen() as is_dosen,
  is_admin() as is_admin;
```

## Expected Outcome

After this fix:

- ✅ `is_dosen()` returns TRUE for users with role='dosen'
- ✅ jadwal_praktikum INSERT works for dosen users
- ✅ Fallback ensures backward compatibility with existing users
- ✅ No more RLS violation errors for valid users

## Files Created

1. `supabase/migrations/37_fix_rls_with_fallback.sql` - Initial fallback implementation
2. `supabase/migrations/38_add_select_policies.sql` - Ensure SELECT policies exist
3. `supabase/migrations/39_final_rls_fix.sql` - Complete comprehensive fix (use this one)
4. `supabase/37_debug_rls_violation.sql` - Diagnostic queries

## Next Steps

1. **Apply Migration 39** - Fixes all functions and policies
2. **Check user metadata** - Ensure JWT has role set
3. **Test INSERT** - Verify jadwal_praktikum creation works
4. **Monitor** - Watch for any other RLS issues
