# 🚨 CRITICAL FIX: Dosen Can't Save Jadwal Praktikum

## Problem

**Dosen users still can't create jadwal_praktikum** - getting RLS violation error

## Solution: Apply Migration 43 NOW

### Step 1: Run in Supabase SQL Editor

```
supabase/migrations/43_master_fix_dosen_insert.sql
```

**This migration:**

- ✅ Drops ALL old policies (cleanup)
- ✅ Creates fresh, clean policies for dosen
- ✅ Ensures dosen can INSERT, SELECT, UPDATE, DELETE

### Step 2: Dosen User Action

1. Log out completely
2. Close browser tab
3. Log back in
4. Try creating jadwal_praktikum again

### Step 3: Verify

Try this in Supabase SQL Editor (while logged in as dosen):

```sql
SELECT
  is_dosen() as are_you_dosen,
  get_user_role() as your_role;
```

**Expected result:**

```
are_you_dosen: true
your_role: 'dosen'
```

If this shows FALSE or 'mahasiswa', the user is not recognized as dosen.

---

## If Still Doesn't Work

### Check 1: Verify is_dosen() function

```sql
SELECT is_dosen() as result;
-- Must return: true
```

### Check 2: Verify get_user_role() function

```sql
SELECT get_user_role() as role;
-- Must return: 'dosen'
```

### Check 3: Check JWT has role

```sql
SELECT auth.jwt() -> 'user_metadata' ->> 'role' as jwt_role;
-- Must show: 'dosen' (NOT NULL)
```

### Check 4: Verify user exists in dosen table

```sql
SELECT * FROM public.dosen WHERE user_id = auth.uid();
-- Must return a row
```

---

## Root Cause

The issue is likely **one of these**:

1. ❌ **is_dosen() returns FALSE**
   - Fix: Check JWT has role metadata
   - Fix: User must log out/back in

2. ❌ **Wrong policies on jadwal_praktikum**
   - Fix: Run Migration 43 (clears and recreates all policies)

3. ❌ **User not in dosen table**
   - Fix: Add user to dosen table
   - Query: `INSERT INTO public.dosen (user_id) VALUES ('[user_uuid]');`

4. ❌ **get_user_role() function is broken**
   - Fix: Check function exists and has correct code
   - Query: `SELECT prosrc FROM pg_proc WHERE proname = 'get_user_role';`

---

## Implementation Timeline

**Migration 43 cleanup:** Drops all policies  
**Migration 43 recreate:** Creates 6 fresh policies  
**User action:** Log out/back in (refresh JWT)  
**Test:** Try creating jadwal_praktikum ✅

**Total time:** 2 minutes

---

## Success Indicators

✅ No "violates row-level security policy" error  
✅ Jadwal praktikum is created  
✅ Can edit/delete the schedule  
✅ Appears in the jadwal list

---

**Action:** Run Migration 43 immediately!
