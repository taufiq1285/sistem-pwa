# Fix Mahasiswa Table RLS Policy - 406 Error Fix

## 🎯 Problem
When a mahasiswa registers and tries to access their profile/dashboard, they get:
```
GET /rest/v1/mahasiswa?select=id&user_id=eq.{userId} 406 (Not Acceptable)
```

**Root Cause:** The `mahasiswa` table has RLS policies that prevent users from seeing their own records, even though they own them.

---

## ✅ Solution: Update RLS Policy

### Step 1: Go to Supabase Dashboard
1. Open https://app.supabase.com
2. Select project: **sistem-praktikum-pwa**
3. Go to **SQL Editor** (sidebar left)

### Step 2: Run This SQL Code

Copy & paste the entire code below into SQL Editor and click **Run**:

```sql
-- ============================================================================
-- FIX: Mahasiswa Table RLS Policies
-- Allow mahasiswa to see THEIR OWN record + allow admin/super user access
-- ============================================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "mahasiswa_select_own" ON mahasiswa;
DROP POLICY IF EXISTS "mahasiswa_insert_own" ON mahasiswa;
DROP POLICY IF EXISTS "mahasiswa_update_own" ON mahasiswa;
DROP POLICY IF EXISTS "Allow authenticated" ON mahasiswa;
DROP POLICY IF EXISTS "Public access" ON mahasiswa;

-- ✅ POLICY 1: Select - Mahasiswa can see THEIR OWN record
CREATE POLICY "mahasiswa_select_own"
ON mahasiswa
FOR SELECT
USING (
  auth.uid() = user_id  -- Can only see their own record
  OR
  -- OR allow admin/super users to see all
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- ✅ POLICY 2: Insert - Only authenticated users can create
CREATE POLICY "mahasiswa_insert_own"
ON mahasiswa
FOR INSERT
WITH CHECK (
  auth.uid() = user_id  -- Can only insert their own record
  OR
  -- OR allow admin to insert for others
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- ✅ POLICY 3: Update - Mahasiswa can update THEIR OWN record
CREATE POLICY "mahasiswa_update_own"
ON mahasiswa
FOR UPDATE
USING (
  auth.uid() = user_id  -- Can only update their own record
  OR
  -- OR allow admin to update
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  auth.uid() = user_id
  OR
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Ensure RLS is enabled
ALTER TABLE mahasiswa ENABLE ROW LEVEL SECURITY;
```

### Step 3: Verify Success
You should see a success message. If you get errors, try this simpler version:

**FALLBACK (If above fails):**
```sql
DROP POLICY IF EXISTS "mahasiswa_select_own" ON mahasiswa;
DROP POLICY IF EXISTS "mahasiswa_insert_own" ON mahasiswa;
DROP POLICY IF EXISTS "mahasiswa_update_own" ON mahasiswa;

CREATE POLICY "mahasiswa_authenticated"
ON mahasiswa
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

ALTER TABLE mahasiswa ENABLE ROW LEVEL SECURITY;
```

---

## 🧪 Test Steps

After running SQL:

1. **Hard refresh** the app (Ctrl+F5 or Cmd+Shift+R)
2. **Log out** completely
3. **Create a NEW mahasiswa account**:
   - Go to Register page
   - Fill in: Name, Email, Password, NIM, Program Studi, etc.
   - Select Role: **Mahasiswa**
   - Click Create Account
4. **Verify email** (if required)
5. **Log in** with the new mahasiswa account
6. **Check browser console** (F12):
   - Should NOT see `406 (Not Acceptable)` errors
   - Should see dashboard load without errors

### ✅ Success Indicators
- Dashboard loads without console errors
- Mahasiswa can see their enrolled classes
- No 406 errors in Network tab
- Admin can see the new mahasiswa in Admin panel

### ❌ If Still Getting 406
1. Check browser console for exact error message
2. Go to Supabase Dashboard → Policies tab
3. Verify "mahasiswa_select_own" policy exists and is enabled
4. Hard refresh browser (Ctrl+F5)
5. Clear browser cache/localStorage:
   - F12 → Application → Storage → Clear All
   - Log in again

---

## 🔍 Explanation

**The Fix Does:**
- ✅ Allows mahasiswa to see their OWN record (via `auth.uid() = user_id`)
- ✅ Allows admin to see/manage all mahasiswa records
- ✅ Allows authenticated operations (insert/update) for own records
- ✅ Prevents mahasiswa from seeing other mahasiswa records (security)

**Why 406 Happened:**
- Old policy was blocking `.single()` query when RLS denied access
- Supabase returns 406 (Not Acceptable) when RLS rejects query
- Not same as 403 (Forbidden) - indicates RLS policy mismatch

---

## 📋 Checklist

- [ ] Copied & ran SQL code in Supabase
- [ ] Got success message
- [ ] Hard refreshed application
- [ ] Logged out & tested new mahasiswa registration
- [ ] Verified no 406 errors in console
- [ ] Admin can see new mahasiswa in dashboard
- [ ] Mahasiswa can log in and see their dashboard

---

## 💡 Related Files
- `src/lib/api/mahasiswa.api.ts:74-90` - getMahasiswaId() function that was failing
- `src/lib/supabase/auth.ts:314-330` - createUserProfile creates mahasiswa record

---

**Questions?** Check Supabase docs: https://supabase.com/docs/guides/auth/row-level-security
