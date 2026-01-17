# QUICK REFERENCE: Apply RLS Fix

## The Problem

```
Error: new row violates row-level security policy for table "jadwal_praktikum"
Code: 42501
```

## Quick Fix (30 seconds)

### Step 1: Open Supabase SQL Editor

- Go to your Supabase project
- Click "SQL Editor" in left sidebar
- Click "New Query"

### Step 2: Paste This Fix

Open and copy the entire contents of:

```
supabase/migrations/39_final_rls_fix.sql
```

Paste into Supabase SQL Editor

### Step 3: Run It

Click the "Run" button (or Ctrl+Enter)

### Step 4: Log Out & Log Back In

- Log out of the application
- Log back in (to get new JWT token)

### Step 5: Try Again

Try creating a jadwal_praktikum - should work now!

---

## What This Fix Does

1. **Recreates `get_user_role()`** - Now tries JWT first, then checks role tables
2. **Updates all role functions** - `is_dosen()`, `is_admin()`, etc.
3. **Fixes all RLS policies** - Ensures correct INSERT/UPDATE/DELETE/SELECT permissions

---

## If It Still Doesn't Work

Check if user's JWT has role metadata:

```sql
-- Run in Supabase SQL Editor
SELECT
  auth.jwt() -> 'user_metadata' ->> 'role' as jwt_role,
  get_user_role() as computed_role,
  is_dosen() as is_dosen_check;
```

If `jwt_role` is NULL, the user needs their metadata updated:

```sql
-- Run this (replace [USER_UUID] with actual user ID)
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"dosen"'::jsonb
)
WHERE id = '[USER_UUID]';

-- Then user logs out and back in
```

---

## Files to Reference

- **Main Fix:** `supabase/migrations/39_final_rls_fix.sql`
- **Documentation:** `RLS_VIOLATION_FIX.md`
- **Debug Queries:** `supabase/37_debug_rls_violation.sql`

---

## Expected Result

After fix:

- ✅ `is_dosen()` returns TRUE for dosen users
- ✅ jadwal_praktikum INSERT succeeds
- ✅ No more RLS violation errors
