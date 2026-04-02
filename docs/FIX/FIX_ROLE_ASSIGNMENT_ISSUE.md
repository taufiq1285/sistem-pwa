# 🔍 ROLE ASSIGNMENT ISSUE - DIAGNOSIS & FIX

**Date**: 2025-12-09
**Issue**: Some user registrations have NULL or unreadable roles
**Status**: ✅ Diagnosed, fix ready

---

## 📋 WHAT WAS FOUND

### ✅ Schema is CORRECT

**users.role column**:
```sql
role user_role NOT NULL DEFAULT 'mahasiswa'
```

**user_role ENUM**:
```sql
CREATE TYPE user_role AS ENUM ('admin', 'dosen', 'mahasiswa', 'laboran');
```

**Analysis**:
- ✅ Column is NOT NULL with default 'mahasiswa'
- ✅ ENUM constrains to valid values only
- ✅ This means role should NEVER be NULL in theory

### ✅ RLS Policies are CORRECT

**INSERT policy**:
```sql
CREATE POLICY "users_insert_own" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);
```

**Analysis**:
- ✅ Allows user to insert their own record
- ✅ No restriction on role value
- ✅ Policy is simple and correct

### ✅ Frontend Code is CORRECT

**RegisterForm.tsx**:
- ✅ Default role: "mahasiswa"
- ✅ Role selection UI with 3 cards
- ✅ Confirmation dialog shows selected role
- ✅ Data normalized before submission

**auth.ts - createUserProfile()**:
```typescript
const { error: userError } = await supabase.from("users").insert({
    id: userId,
    full_name: data.full_name,
    email: data.email,
    role: data.role, // ← Correctly assigned
});
```

**Analysis**:
- ✅ Role is explicitly passed to INSERT
- ✅ No transformation or manipulation

---

## 🔍 POSSIBLE ROOT CAUSES

### Scenario 1: Registration Flow Interrupted ⚠️

**What happens**:
1. User submits registration form
2. Supabase Auth creates account in `auth.users`
3. **BEFORE** `createUserProfile()` runs:
   - Browser closes
   - Network error
   - User navigates away
   - Server timeout
4. Result: User exists in `auth.users` but NOT in `public.users`

**Effect**: User can't login properly, role appears NULL because record doesn't exist

**Probability**: HIGH (most likely cause)

---

### Scenario 2: Transaction Rollback Due to Role-Specific Insert Failure ⚠️

**What happens**:
1. `users` table insert succeeds
2. Role-specific table insert fails (mahasiswa/dosen/laboran):
   - NIM/NIDN/NIP duplicate
   - Missing required field
   - Constraint violation
3. Transaction rolls back
4. User deleted from `users` table
5. But `auth.users` record remains

**Effect**: Auth user exists, public.users doesn't

**Probability**: MEDIUM

---

### Scenario 3: RLS Policy Interference 🔒

**What happens**:
1. During registration, `auth.uid()` might be NULL
2. INSERT policy checks `auth.uid() = id`
3. NULL = UUID always fails
4. INSERT blocked

**Effect**: Registration fails silently or with generic error

**Probability**: LOW (would cause consistent failures, not "some")

---

## 🧪 HOW TO DIAGNOSE

### Step 1: Run Diagnostic SQL

File created: `DIAGNOSE_ROLE_ASSIGNMENT.sql`

**Key queries**:

```sql
-- Find users with NULL role
SELECT id, full_name, email, role, created_at
FROM users
WHERE role IS NULL;

-- Find auth users without public.users record
SELECT au.id, au.email, au.created_at, u.role
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL;

-- Check role consistency
SELECT
    u.role,
    COUNT(*) as user_count,
    COUNT(m.user_id) as has_mahasiswa_record,
    COUNT(d.user_id) as has_dosen_record,
    COUNT(l.user_id) as has_laboran_record
FROM users u
LEFT JOIN mahasiswa m ON u.id = m.user_id AND u.role = 'mahasiswa'
LEFT JOIN dosen d ON u.id = d.user_id AND u.role = 'dosen'
LEFT JOIN laboran l ON u.id = l.user_id AND u.role = 'laboran'
GROUP BY u.role;
```

**Run in Supabase**:
1. Go to SQL Editor
2. Copy-paste queries from `DIAGNOSE_ROLE_ASSIGNMENT.sql`
3. Run each section
4. Note results

---

## ✅ FIXES

### Fix 1: Sync Missing User Records ⚡

**For users who exist in auth.users but not public.users**

```sql
-- WARNING: Run diagnostics first to verify this is the issue!

-- Create missing user records with default role
INSERT INTO users (id, email, full_name, role)
SELECT
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', 'User'),
    'mahasiswa' -- Default to mahasiswa
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL
  AND au.email_confirmed_at IS NOT NULL; -- Only confirmed users

-- Note: This creates users with default role 'mahasiswa'
-- They need to re-register properly or admin updates their role
```

---

### Fix 2: Add Registration Error Handling 🛡️

**Update createUserProfile function**

File: `src/lib/supabase/auth.ts` (around line 380-474)

**Current code** (simplified):
```typescript
async function createUserProfile(userId: string, data: RegisterData): Promise<void> {
  // 1. Insert into users
  const { error: userError } = await supabase.from("users").insert({ ... });
  if (userError) throw userError;

  // 2. Insert into role-specific table
  if (data.role === "mahasiswa") {
    await supabase.from("mahasiswa").insert([{ ... }]);
  }
}
```

**Problem**: If step 2 fails, step 1 is already committed (no transaction)

**Recommended fix**:
```typescript
async function createUserProfile(userId: string, data: RegisterData): Promise<void> {
  try {
    // Use transaction-like approach with error handling
    const { error: userError } = await supabase
      .from("users")
      .insert({
        id: userId,
        full_name: data.full_name,
        email: data.email,
        role: data.role,
      });

    if (userError) {
      console.error("Failed to create user profile:", userError);
      throw new Error(`User profile creation failed: ${userError.message}`);
    }

    // Create role-specific record
    if (data.role === "mahasiswa" && data.nim) {
      const { error: mahasiswaError } = await supabase
        .from("mahasiswa")
        .insert([{
          user_id: userId,
          nim: data.nim,
          angkatan: data.angkatan || new Date().getFullYear(),
          semester: data.semester || 1,
          program_studi: data.program_studi,
        }]);

      if (mahasiswaError) {
        // Critical: user record created but mahasiswa failed
        console.error("Failed to create mahasiswa record:", mahasiswaError);

        // Try to cleanup user record (optional but recommended)
        await supabase.from("users").delete().eq("id", userId);

        throw new Error(`Mahasiswa record creation failed: ${mahasiswaError.message}`);
      }
    } else if (data.role === "dosen" && data.nidn) {
      const { error: dosenError } = await supabase
        .from("dosen")
        .insert([{
          user_id: userId,
          nidn: data.nidn,
          nip: data.nip,
          gelar_depan: data.gelar_depan,
          gelar_belakang: data.gelar_belakang,
        }]);

      if (dosenError) {
        console.error("Failed to create dosen record:", dosenError);
        await supabase.from("users").delete().eq("id", userId);
        throw new Error(`Dosen record creation failed: ${dosenError.message}`);
      }
    } else if (data.role === "laboran" && data.nip) {
      const { error: laboranError } = await supabase
        .from("laboran")
        .insert([{
          user_id: userId,
          nip: data.nip,
        }]);

      if (laboranError) {
        console.error("Failed to create laboran record:", laboranError);
        await supabase.from("users").delete().eq("id", userId);
        throw new Error(`Laboran record creation failed: ${laboranError.message}`);
      }
    }
  } catch (error) {
    console.error("createUserProfile error:", error);
    throw error;
  }
}
```

**Benefits**:
- ✅ Better error logging
- ✅ Cleanup on failure
- ✅ Clear error messages
- ✅ Prevents orphaned user records

---

### Fix 3: Add Database Trigger for Cleanup 🔧

**Automatically delete user if role-specific record creation fails**

```sql
-- Create function to cleanup orphaned users
CREATE OR REPLACE FUNCTION cleanup_orphaned_users()
RETURNS TRIGGER AS $$
BEGIN
    -- When a user is created, check if they have corresponding role record
    -- This runs after INSERT, giving time for role record to be created

    -- Schedule check for 5 seconds later (gives time for role record insert)
    -- If no role record exists, delete user

    -- Note: This is a safety net, not primary solution
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Or better: Use CHECK constraint on users table
-- to ensure consistency
```

**Alternative: Use database-level transaction**

Create a stored procedure for registration:

```sql
CREATE OR REPLACE FUNCTION register_user(
    p_user_id UUID,
    p_email TEXT,
    p_full_name TEXT,
    p_role user_role,
    p_nim TEXT DEFAULT NULL,
    p_nidn TEXT DEFAULT NULL,
    p_nip TEXT DEFAULT NULL,
    -- ... other fields
)
RETURNS void AS $$
BEGIN
    -- Use transaction
    INSERT INTO users (id, email, full_name, role)
    VALUES (p_user_id, p_email, p_full_name, p_role);

    IF p_role = 'mahasiswa' THEN
        INSERT INTO mahasiswa (user_id, nim, ...)
        VALUES (p_user_id, p_nim, ...);
    ELSIF p_role = 'dosen' THEN
        INSERT INTO dosen (user_id, nidn, ...)
        VALUES (p_user_id, p_nidn, ...);
    ELSIF p_role = 'laboran' THEN
        INSERT INTO laboran (user_id, nip)
        VALUES (p_user_id, p_nip);
    END IF;

    -- If any insert fails, entire transaction rolls back
END;
$$ LANGUAGE plpgsql;
```

---

### Fix 4: Add Frontend Validation ✅

**Ensure required fields are filled before submission**

```typescript
// In RegisterForm.tsx, add validation
const validateForm = (data: RegisterFormData): string[] => {
  const errors: string[] = [];

  if (data.role === "mahasiswa" && !data.nim?.trim()) {
    errors.push("NIM wajib diisi untuk mahasiswa");
  }

  if (data.role === "dosen" && !data.nidn?.trim()) {
    errors.push("NIDN wajib diisi untuk dosen");
  }

  if (data.role === "laboran" && !data.nip?.trim()) {
    errors.push("NIP wajib diisi untuk laboran");
  }

  return errors;
};

// Before submit
const validationErrors = validateForm(pendingData);
if (validationErrors.length > 0) {
  validationErrors.forEach(error => toast.error(error));
  return;
}
```

---

## 🎯 RECOMMENDED ACTION PLAN

### Phase 1: Diagnose (5 min) 🔍

1. Open Supabase SQL Editor
2. Run `DIAGNOSE_ROLE_ASSIGNMENT.sql`
3. Focus on:
   - Query 2A: Users with NULL role
   - Query 5A: Auth users without public.users record
   - Query 7: Summary health check
4. Note results

---

### Phase 2: Immediate Fix (10 min) ⚡

**If you find orphaned auth.users**:

```sql
-- Run Fix 1: Sync missing user records
INSERT INTO users (id, email, full_name, role)
SELECT
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', 'User'),
    'mahasiswa'
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL
  AND au.email_confirmed_at IS NOT NULL;

-- Verify
SELECT COUNT(*) FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL;
-- Expected: 0
```

---

### Phase 3: Long-term Fix (30 min) 🛡️

**Option A: Quick Fix (Recommended)**

Apply Fix 2 - Add better error handling to `createUserProfile` function.

**Steps**:
1. Open `src/lib/supabase/auth.ts`
2. Update `createUserProfile` function with try-catch and cleanup
3. Test registration for all roles
4. Verify error messages are clear

**Option B: Robust Fix (Advanced)**

Implement Fix 3 - Create stored procedure for atomic registration.

**Steps**:
1. Create SQL migration file
2. Implement `register_user` stored procedure
3. Update frontend to call stored procedure
4. Test thoroughly

---

## 🧪 TESTING PLAN

### Test 1: Normal Registration
```
1. Register as Mahasiswa with valid NIM
2. Expected: Success, can login, role = 'mahasiswa'
3. Verify:
   - Record in users table ✅
   - Record in mahasiswa table ✅
   - Can login ✅
```

### Test 2: Registration with Duplicate NIM
```
1. Register as Mahasiswa with existing NIM
2. Expected: Error message "NIM sudah terdaftar"
3. Verify:
   - NO record in users table ✅
   - NO orphaned auth.users ✅
```

### Test 3: Registration with Network Error (Simulated)
```
1. Register, then close browser before redirect
2. Check database
3. Expected: Either complete record or nothing (no orphans)
```

---

## 📊 SUCCESS CRITERIA

✅ **Zero** users with NULL role
✅ **Zero** orphaned auth.users records (auth.users without public.users)
✅ **100%** role-specific record creation (all users have mahasiswa/dosen/laboran record)
✅ Clear error messages when registration fails
✅ No silent failures

---

## 🚨 MONITORING

### After Fix, Monitor These Queries:

```sql
-- Run daily for 1 week
-- Should always return 0 for problems

-- 1. Orphaned auth users
SELECT COUNT(*) FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL;

-- 2. Users with NULL role
SELECT COUNT(*) FROM users WHERE role IS NULL;

-- 3. Users without role-specific record
SELECT
    u.role,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE m.user_id IS NULL AND u.role = 'mahasiswa') as missing_mahasiswa,
    COUNT(*) FILTER (WHERE d.user_id IS NULL AND u.role = 'dosen') as missing_dosen,
    COUNT(*) FILTER (WHERE l.user_id IS NULL AND u.role = 'laboran') as missing_laboran
FROM users u
LEFT JOIN mahasiswa m ON u.id = m.user_id
LEFT JOIN dosen d ON u.id = d.user_id
LEFT JOIN laboran l ON u.id = l.user_id
GROUP BY u.role;
```

---

## 📞 IF ISSUES PERSIST

### Check These:

1. **Supabase Logs**:
   - Go to Supabase Dashboard → Logs
   - Filter by "error"
   - Look for INSERT failures

2. **Browser Console**:
   - Open DevTools during registration
   - Check Network tab for failed requests
   - Check Console for JavaScript errors

3. **Database Constraints**:
   - Check if NIM/NIDN/NIP has unique constraint violations
   - Check if any triggers are blocking inserts

4. **RLS Debugging**:
   ```sql
   -- Temporarily disable RLS to test
   ALTER TABLE users DISABLE ROW LEVEL SECURITY;
   -- Try registration
   -- Re-enable
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ```

---

## 📝 SUMMARY

**Root Cause**: Likely orphaned auth.users records due to:
- Registration flow interrupted
- Role-specific table insert failures
- Poor error handling

**Solution**:
1. ✅ Run diagnostic SQL
2. ✅ Sync orphaned records
3. ✅ Improve error handling in createUserProfile
4. ✅ Add frontend validation
5. ✅ Monitor for 1 week

**Files**:
- ✅ `DIAGNOSE_ROLE_ASSIGNMENT.sql` - Diagnostic queries
- ✅ `FIX_ROLE_ASSIGNMENT_ISSUE.md` - This file

**Status**: Ready to apply fixes

---

**Next Action**: Run diagnostic SQL to confirm the issue! 👉

**File**: `FIX_ROLE_ASSIGNMENT_ISSUE.md`
**Created**: 2025-12-09
