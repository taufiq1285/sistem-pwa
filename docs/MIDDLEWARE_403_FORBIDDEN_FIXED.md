# 🔧 ROOT CAUSE FOUND: 403 Forbidden Error Explained

## The Real Problem

The **403 Forbidden error is NOT from RLS policies** - it's from the **application middleware**!

### How It Works

```
Client (Dosen) → createJadwal()
    ↓
Application Middleware: requirePermission('manage:jadwal', ...)
    ↓
Check: Does user have 'manage:jadwal' permission?
    ↓
Get user role from: getCurrentUserWithRole()
    ↓
Query: SELECT role FROM public.users WHERE id = auth.uid()
    ↓
❌ PROBLEM: users.role is NULL or empty!
    ↓
Throw: PermissionError (403 Forbidden)
```

## The Root Cause

**The `users` table doesn't have the `role` column populated!**

The middleware tries to query `users.role` to determine if the user is a dosen, but:

- ✗ users.role is NULL or empty
- ✓ The role tables (admin, dosen, laboran, mahasiswa) ARE populated correctly
- ✓ The RLS policies ARE working correctly

## The Fix: Migration 44

Run this migration in Supabase SQL Editor:

```
supabase/migrations/44_fix_users_role_column.sql
```

**What it does:**

1. Checks how many users are missing role in the users table
2. Populates `users.role` from the role table membership (admin, dosen, laboran, mahasiswa)
3. Verifies all users now have correct role
4. Confirms no NULL roles remain

## After the Fix

```
Client (Dosen) → createJadwal()
    ↓
Application Middleware: requirePermission('manage:jadwal', ...)
    ↓
Check: Does user have 'manage:jadwal' permission?
    ↓
Get user role from: getCurrentUserWithRole()
    ↓
Query: SELECT role FROM public.users WHERE id = auth.uid()
    ↓
✅ Returns: 'dosen'
    ↓
Check: Does 'dosen' role have 'manage:jadwal' permission?
    ↓
✅ YES - Permission granted!
    ↓
RLS Policy: INSERT into jadwal_praktikum
    ↓
Check: is_dosen() = true?
    ✓ YES - Created successfully!
```

## Implementation

### Step 1: Run Migration 44

Go to Supabase SQL Editor and run:

```sql
-- Copy entire contents of supabase/migrations/44_fix_users_role_column.sql
```

### Step 2: Verify

Check the output - should show:

- ✅ All users now have role set
- ✅ No mismatches between users.role and actual role
- ✅ Count of users_still_without_role = 0

### Step 3: Test

Dosen user tries to create jadwal_praktikum:

- Should now succeed ✅
- No more 403 Forbidden errors

## Technical Details

### Three-Layer Security Architecture

```
Layer 1: Frontend
├─ useAuth hook
├─ useRole hook
└─ RoleGuard components

Layer 2: API Middleware (APPLICATION LEVEL)
├─ requirePermission() wrapper
├─ checkPermission() function
├─ getCurrentUserWithRole() - Queries users.role
└─ Permission check: manage:jadwal, create:kuis, etc.

Layer 3: Database RLS (DATABASE LEVEL)
├─ RLS policies
├─ Role functions: is_dosen(), is_admin()
└─ Data isolation: SELECT, INSERT, UPDATE, DELETE
```

**The 403 error was happening in Layer 2 (middleware), not Layer 3 (database RLS)**

### Why users.role Was Empty

The users.role column exists but wasn't being populated during:

- User registration
- Role assignment
- Data migrations

The middleware expected this column to be populated, but it wasn't.

## Permission Flow for Dosen

```typescript
// In createJadwal middleware:
1. getCurrentUserWithRole()
   - Gets auth.uid() from Supabase Auth
   - Queries: SELECT role FROM public.users WHERE id = auth.uid()
   - Expected: 'dosen'
   - Problem: Returns NULL → throws RoleNotFoundError

2. hasPermission('dosen', 'manage:jadwal')
   - Checks ROLE_METADATA['dosen'].permissions
   - Finds 'manage:jadwal' in list → returns true
   - Skipped because step 1 failed
```

## What's Different Now

**Before Migration 44:**

- users.role = NULL
- middleware throws 403
- RLS policies never even get evaluated

**After Migration 44:**

- users.role = 'dosen'
- middleware passes permission check
- RLS policies allow INSERT
- jadwal_praktikum is created ✅

## Related Migrations

This issue is separate from the earlier RLS migrations:

- Migration 36: Fixed is_dosen() infinite recursion
- Migration 39: Added RLS policy fallback
- Migration 42: Fixed JWT metadata
- **Migration 44: Fixed users.role column** ← YOU ARE HERE

All four migrations work together to ensure both:

1. ✅ Database RLS is working (Migration 36, 39)
2. ✅ Middleware permission checks work (Migration 44)
3. ✅ JWT tokens have role metadata (Migration 42)

## Verification Query

After running Migration 44, verify with:

```sql
-- Check users.role is populated
SELECT
  email,
  role,
  CASE
    WHEN role IS NULL THEN '❌ NULL'
    WHEN role = '' THEN '❌ EMPTY'
    ELSE '✅ ' || role
  END as status
FROM public.users
WHERE email IN ('alfiah@dosen.com', 'dosen@akbid.ac.id')
LIMIT 5;

-- Expected:
-- alfiah@dosen.com    | dosen   | ✅ dosen
-- dosen@akbid.ac.id   | dosen   | ✅ dosen
```

## Quick Summary

| Component        | Before Fix     | After Fix                   |
| ---------------- | -------------- | --------------------------- |
| RLS Policy       | ✅ Working     | ✅ Working                  |
| JWT Metadata     | ✅ Set         | ✅ Set                      |
| users.role       | ❌ NULL        | ✅ Populated                |
| Middleware Check | ❌ Fails (403) | ✅ Passes                   |
| Result           | 403 Error      | ✅ jadwal_praktikum created |

---

**Time to fix:** 1 minute (run Migration 44)  
**Impact:** Dosen can finally create jadwal_praktikum!  
**Risk:** Very low (just populating existing data)
