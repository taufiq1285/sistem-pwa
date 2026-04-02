# 🚀 NEXT STEPS: Verify and Test the RLS Fix

## ✅ What's Already Done

- [x] Migration 39 applied - functions and policies created
- [x] All 6 RLS policies on jadwal_praktikum are active
- [x] `get_user_role()` has fallback logic
- [x] `is_dosen()` properly configured

## 📋 What You Need to Do

### Step 1: Verify User Roles in Database (1 min)

**Copy & paste this in Supabase SQL Editor:**

```sql
SELECT
  u.id,
  u.email,
  u.raw_user_meta_data ->> 'role' as jwt_metadata_role,
  CASE
    WHEN EXISTS(SELECT 1 FROM public.dosen WHERE user_id = u.id) THEN 'dosen'
    WHEN EXISTS(SELECT 1 FROM public.admin WHERE user_id = u.id) THEN 'admin'
    WHEN EXISTS(SELECT 1 FROM public.laboran WHERE user_id = u.id) THEN 'laboran'
    ELSE 'mahasiswa'
  END as actual_role
FROM auth.users u
WHERE u.created_at > now() - interval '30 days'
ORDER BY u.created_at DESC;
```

**Look for:**

- [ ] All dosen/admin/laboran users have `jwt_metadata_role` set
- [ ] If NULL, continue to Step 2

### Step 2: Update Missing Role Metadata (if needed)

**If Step 1 showed any NULL roles:**

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

### Step 3: Test the Fix in Application

1. **Log out completely** from the app
2. **Close the browser tab** (to clear JWT token)
3. **Log back in** as a dosen user
4. **Try creating a jadwal_praktikum**
   - Go to Jadwal Praktikum page
   - Click "Create New Schedule"
   - Fill in the form
   - Click Save

### Step 4: Verify It Works

**Expected:**

- ✅ No "violates row-level security policy" error
- ✅ jadwal_praktikum is created successfully
- ✅ You can see it in the list

**If error still occurs:**

- Copy the exact error message
- Run this diagnostic (while logged in as that user):

```sql
SELECT
  auth.uid() as user_id,
  auth.jwt() -> 'user_metadata' ->> 'role' as jwt_role,
  get_user_role() as computed_role,
  is_dosen() as is_dosen_check;
```

- The `is_dosen_check` must be `true` for INSERT to work

## 🔍 Quick Troubleshooting

| Symptom                           | Likely Cause                     | Fix                                             |
| --------------------------------- | -------------------------------- | ----------------------------------------------- |
| `is_dosen()` returns FALSE        | JWT missing role metadata        | Run Step 2 above                                |
| Still get RLS error after Step 2  | User didn't log back in          | Log out completely, clear cookies, log back in  |
| `computed_role` shows 'mahasiswa' | Fallback is checking role tables | Verify dosen entry exists in public.dosen table |
| Can't find jadwal page            | Feature might be disabled        | Check if route is registered                    |

## 📞 Support

If you're still having issues:

1. **Run the diagnostic query** (from troubleshooting table)
2. **Share the results** of:
   - `is_dosen_check` value
   - `computed_role` value
   - Exact error message from INSERT

3. **Review detailed docs:**
   - `RLS_VIOLATION_FIX.md` - Full technical explanation
   - `RLS_FIX_STATUS.md` - Complete status and next steps

## 🎯 Success Criteria

After completing all steps above:

- [x] Users have role set in JWT metadata
- [x] `is_dosen()` returns TRUE for dosen users
- [x] jadwal_praktikum INSERT succeeds without errors
- [x] Can create, update, and view schedules

---

**Time to complete:** 5-10 minutes  
**Difficulty:** Easy - mostly copy & paste SQL  
**Risk:** Very low - only updating metadata, not changing core logic
