# Fix Registration Orphaned User Bug - Complete Guide

## Problem Summary
User registration was creating orphaned users (users exist in `auth.users` but not in `public.users`). This caused "User account has been deleted" errors.

**Root Cause**: RLS policies block INSERT operations during registration because `auth.uid()` is NULL before login.

## Solution Steps

### Quick Fix (Recommended)

**Run this single SQL file in Supabase SQL Editor:**

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy contents from `APPLY_FIX_NOW.sql` and paste
3. Click **Run**
4. Go to **Authentication** → **Users** → Delete `asti@test.com` manually

This will:
- ✅ Clean up orphaned user from public.users
- ✅ Fix all RLS INSERT policies
- ✅ Verify changes applied

### Step-by-Step Alternative

#### Step 1: Apply RLS Policy Fix

Open **Supabase Dashboard** → **SQL Editor** and run:
- Copy contents from `supabase/migrations/30_fix_registration_rls_policies.sql`
- Or copy from `APPLY_FIX_NOW.sql`

This updates INSERT policies for:
- ✅ `users` table
- ✅ `mahasiswa` table
- ✅ `dosen` table
- ✅ `laboran` table
- ✅ `admin` table

**What changed**: All INSERT policies now allow `auth.uid() IS NULL` during registration.

#### Step 2: Clean Up Orphaned User

1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Search for `asti@test.com`
3. Click **Delete** button

### Step 3: Verify Migration Applied

Run in **Supabase SQL Editor**:
```sql
SELECT
    tablename,
    policyname,
    with_check
FROM pg_policies
WHERE tablename IN ('users', 'mahasiswa', 'dosen', 'laboran', 'admin')
    AND policyname LIKE '%insert%'
ORDER BY tablename;
```

Expected result: All policies should have `with_check` containing `OR auth.uid() IS NULL`

### Step 4: Test Registration

1. Open registration page: http://localhost:5173/register
2. Register new mahasiswa user:
   - **Email**: asti@test.com
   - **Full Name**: Asti Budi
   - **Password**: (your choice)
   - **Role**: Mahasiswa
   - **NIM**: 2401XXXX

3. Expected behavior:
   - ✅ User created in `auth.users`
   - ✅ User profile created in `public.users`
   - ✅ Mahasiswa record created in `mahasiswa` table
   - ✅ No "User account has been deleted" error
   - ✅ Successful registration and redirect

### Step 5: Verify User Created Properly

Run in **Supabase SQL Editor**:
```sql
-- Check auth.users
SELECT id, email, created_at
FROM auth.users
WHERE email = 'asti@test.com';

-- Check public.users
SELECT id, email, full_name, role
FROM public.users
WHERE email = 'asti@test.com';

-- Check mahasiswa table
SELECT m.id, m.nim, m.user_id, u.full_name
FROM mahasiswa m
JOIN users u ON u.id = m.user_id
WHERE u.email = 'asti@test.com';
```

All three queries should return results (no orphaned user).

## Files Created

1. **cleanup-orphaned-asti.sql** - SQL to delete orphaned user from public.users
2. **delete-orphaned-asti.js** - Node script to delete from auth.users via API
3. **supabase/migrations/30_fix_registration_rls_policies.sql** - Permanent RLS fix
4. **FIX_REGISTRATION_GUIDE.md** - This guide

## Other Orphaned Users to Clean

Based on previous conversation, these users may also be orphaned:

1. **budi2401@test.com** (ID: ea127368-9173-4838-9869-8617beb18c4f)
2. **mahasiswa@akbid.ac.id** (ID: 5de02c2b-0cbf-46a2-9b8e-7909096d70a2)
3. **superadmin@akbid.ac.id** (ID: 7eb7eead-29e8-48aa-b8be-758b561d35cf)

To clean these, manually delete via Dashboard UI or modify `delete-orphaned-asti.js` with their user IDs.

## Troubleshooting

### Issue: "duplicate key value violates unique constraint 'users_email_key'"
**Solution**: Orphaned user still exists. Run Step 1 again.

### Issue: "Database error loading user"
**Solution**: User exists in auth.users but not public.users. Run cleanup scripts.

### Issue: Migration fails with "policy already exists"
**Solution**: Migration drops existing policies first. Safe to re-run.

### Issue: Still getting "User account has been deleted" after fix
**Possible causes**:
1. Migration not applied - verify Step 3
2. Orphaned user still exists - run cleanup again
3. Browser cache - clear cookies and try incognito mode

## Technical Details

### Registration Flow (Before Fix)
1. `supabase.auth.signUp()` → Creates user in `auth.users` ✅
2. `createUserProfile()` → Tries to INSERT into `public.users` ❌
3. RLS policy blocks INSERT (auth.uid() is NULL)
4. User orphaned in auth.users only

### Registration Flow (After Fix)
1. `supabase.auth.signUp()` → Creates user in `auth.users` ✅
2. `createUserProfile()` → INSERT into `public.users` ✅ (auth.uid() IS NULL allowed)
3. Role-specific INSERT → Creates mahasiswa/dosen/etc record ✅
4. Complete registration, no orphaned users

### RLS Policy Change

**Before**:
```sql
CREATE POLICY "users_insert_own" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);
```

**After**:
```sql
CREATE POLICY "users_insert_registration" ON users
    FOR INSERT WITH CHECK (auth.uid() = id OR auth.uid() IS NULL);
```

The `OR auth.uid() IS NULL` allows INSERT during registration when user hasn't logged in yet.

## Next Steps After Fix

Once registration works properly:

1. **Delete old cleanup scripts** (optional):
   - delete-superadmin.js
   - check-and-delete-users.sql
   - force-delete-auth-user.sql
   - fix-and-delete-superadmin.sql
   - check-auth-users.sql

2. **Test all role registrations**:
   - Register mahasiswa ✅
   - Register dosen
   - Register laboran
   - Register admin (if allowed)

3. **Monitor for orphaned users**:
   ```sql
   -- Find users in auth but not public
   SELECT au.id, au.email
   FROM auth.users au
   LEFT JOIN public.users pu ON au.id = pu.id
   WHERE pu.id IS NULL;
   ```

## Success Criteria

✅ No orphaned users in database
✅ Registration creates user in both auth.users AND public.users
✅ No "User account has been deleted" errors
✅ All role registrations work (mahasiswa, dosen, laboran, admin)
✅ RLS policies allow registration while maintaining security
