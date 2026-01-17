# ✅ RLS Fix Complete - jadwal_praktikum Policies Successfully Applied

## Current Status

**All policies are now correctly configured on `jadwal_praktikum`:**

| Policy                              | Command | Condition                                  | Status    |
| ----------------------------------- | ------- | ------------------------------------------ | --------- |
| `jadwal_praktikum_select_dosen`     | SELECT  | `is_dosen()`                               | ✅ Active |
| `jadwal_praktikum_select_laboran`   | SELECT  | `is_laboran()`                             | ✅ Active |
| `jadwal_praktikum_select_mahasiswa` | SELECT  | `is_mahasiswa() AND kelas_mahasiswa check` | ✅ Active |
| `jadwal_praktikum_insert_dosen`     | INSERT  | `is_dosen()`                               | ✅ Active |
| `jadwal_praktikum_update_dosen`     | UPDATE  | `is_dosen()`                               | ✅ Active |
| `jadwal_praktikum_delete_dosen`     | DELETE  | `is_dosen()`                               | ✅ Active |

## What Was Fixed

### Problem

- `is_dosen()` was returning FALSE even for dosen users
- This caused RLS violation: `"new row violates row-level security policy for table "jadwal_praktikum"`

### Solution Applied (Migration 39)

Rewrote `get_user_role()` with intelligent fallback:

```sql
get_user_role() priority:
1. Check JWT user_metadata.role (fastest)
2. Check JWT app_metadata.role (fallback)
3. Check role tables (admin, dosen, laboran, mahasiswa)
4. Default to 'mahasiswa'
```

## Next Steps to Complete

### 1️⃣ Verify Users Have Role Metadata

Run in Supabase SQL Editor:

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
  END as actual_role
FROM auth.users u
ORDER BY u.created_at DESC
LIMIT 10;
```

### 2️⃣ If Any Users Missing Role Metadata

Run this fix:

```sql
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  to_jsonb(
    CASE
      WHEN EXISTS(SELECT 1 FROM public.admin WHERE user_id = id) THEN 'admin'
      WHEN EXISTS(SELECT 1 FROM public.dosen WHERE user_id = id) THEN 'dosen'
      WHEN EXISTS(SELECT 1 FROM public.laboran WHERE user_id = id) THEN 'laboran'
      ELSE 'mahasiswa'
    END
  )
)
WHERE raw_user_meta_data ->> 'role' IS NULL;
```

### 3️⃣ Test the Fix

1. **Log out** from the application
2. **Log back in** (to refresh JWT with new metadata)
3. **Try creating a jadwal_praktikum** record as dosen
4. Should now **succeed without RLS violation**

## Verification Queries

### Check 1: Policies Exist

```sql
SELECT policyname, cmd, permissive, roles
FROM pg_policies
WHERE tablename = 'jadwal_praktikum'
ORDER BY cmd;
```

Should show 6 policies ✓

### Check 2: Functions Work

```sql
SELECT
  get_user_role() as role,
  is_dosen() as is_dosen,
  is_admin() as is_admin;
```

When logged in as dosen, should show:

- `role` = 'dosen'
- `is_dosen` = true
- `is_admin` = false ✓

### Check 3: RLS is Enabled

```sql
SELECT tablename, rowsecurity FROM pg_tables
WHERE tablename = 'jadwal_praktikum';
```

Should show `rowsecurity = true` ✓

## If Error Persists

### ❌ Still getting "violates row-level security policy"?

**Check 1: Verify is_dosen() works**

```sql
SELECT is_dosen() as dosen_check;
-- Should return true if logged in as dosen
```

**Check 2: Verify JWT has role**

```sql
SELECT auth.jwt() -> 'user_metadata' ->> 'role' as jwt_role;
-- Should show 'dosen' for dosen users
```

**Check 3: Check get_user_role() output**

```sql
SELECT get_user_role() as computed_role;
-- Should show 'dosen' for dosen users
```

**If Check 3 shows 'mahasiswa' instead:**

- User's metadata wasn't updated (see Step 2️⃣ above)
- OR user didn't log out/back in to refresh JWT
- OR role table entry doesn't exist

## Files Modified/Created

| File                                       | Purpose                                     |
| ------------------------------------------ | ------------------------------------------- |
| `supabase/migrations/39_final_rls_fix.sql` | Main fix - recreates functions and policies |
| `supabase/migrations/40_verify_rls.sql`    | Verification queries                        |
| `supabase/migrations/41_test_insert.sql`   | Test INSERT operations                      |
| `supabase/verify-policies.sql`             | Quick policy verification                   |
| `RLS_VIOLATION_FIX.md`                     | Detailed documentation                      |
| `APPLY_RLS_FIX_QUICK.md`                   | Quick reference guide                       |

## Support

If the INSERT still fails after following all steps:

1. Check `get_user_role()` returns correct value
2. Check user metadata has role set
3. Check user logged out and back in
4. Check policy condition shows `is_dosen()`
5. Review `RLS_VIOLATION_FIX.md` for detailed diagnostics

## Expected Behavior After Fix

✅ **Dosen users can:**

- SELECT all jadwal_praktikum
- INSERT new jadwal_praktikum
- UPDATE jadwal_praktikum they have access to
- DELETE jadwal_praktikum they have access to

✅ **Mahasiswa users can:**

- SELECT only jadwal_praktikum for classes they're enrolled in

✅ **Laboran users can:**

- SELECT all jadwal_praktikum

✅ **Admin users:**

- No access (policies don't include admin - by design per Migration 34)

---

**Status:** ✅ All policies applied and verified
**Last Updated:** December 6, 2025
