# 🛡️ PREVENT ORPHANED USERS - LONG-TERM FIX

**Date**: 2025-12-09
**Issue Found**: User `superadmin@akbid.ac.id` stuck in auth.users without public.users record
**Status**: Quick fix applied, need long-term prevention

---

## 🔍 WHAT HAPPENED

### Timeline:
```
2025-11-15 04:31:28 - User "Super Admin" registered
                    - ✅ auth.users record created
                    - ❌ public.users record NOT created
                    - Result: User can't login properly, role "NULL"
```

### Root Cause:
Registration flow has **2 separate steps**:
1. Supabase Auth creates account → `auth.users` (ATOMIC, always succeeds)
2. Our code creates profile → `public.users` (CAN FAIL)

**Problem**: If step 2 fails (network error, timeout, browser closed), user is stuck.

---

## ✅ IMMEDIATE FIX (Applied)

Run `FIX_SYNC_ORPHANED_ADMIN.sql` to sync the orphaned admin user.

---

## 🛡️ LONG-TERM PREVENTION

### Option 1: Database Trigger (RECOMMENDED) ⚡

Create trigger that auto-creates `public.users` record when `auth.users` is created.

**File**: `supabase/migrations/XX_auto_create_user_profile.sql`

```sql
-- ================================================
-- Auto-create public.users when auth.users created
-- ================================================

-- Function to sync auth.users → public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert into public.users with data from auth metadata
    INSERT INTO public.users (
        id,
        email,
        full_name,
        role,
        is_active,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'mahasiswa'),
        true,
        NEW.created_at,
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;  -- Don't overwrite if exists

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users INSERT
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO postgres, service_role;
GRANT SELECT ON auth.users TO postgres, service_role;
```

**Benefits**:
- ✅ Automatic sync (no code changes needed)
- ✅ Atomic (happens in same transaction)
- ✅ Prevents orphaned users
- ✅ Uses metadata from registration form

**Drawbacks**:
- Role-specific tables (mahasiswa/dosen/laboran) still need manual creation
- Requires database migration

---

### Option 2: Improve Error Handling in Code (GOOD) 🔧

**File**: `src/lib/supabase/auth.ts` - Line ~380

**Current code** (simplified):
```typescript
export async function registerUser(data: RegisterData): Promise<AuthResponse> {
  // 1. Create auth user
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        full_name: data.full_name,
        role: data.role,
      },
    },
  });

  if (signUpError || !authData.user) {
    throw signUpError || new Error("Registration failed");
  }

  // 2. Create profile (CAN FAIL HERE!)
  try {
    await createUserProfile(authData.user.id, data);
  } catch (error) {
    // Profile creation failed but user already created!
    // What to do?? 😱
    console.error("Profile creation failed:", error);
    // Currently: User is orphaned
    throw error;
  }

  return { user: authData.user, session: authData.session };
}
```

**Improved code**:
```typescript
export async function registerUser(data: RegisterData): Promise<AuthResponse> {
  let userId: string | undefined;

  try {
    // 1. Create auth user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.full_name,
          role: data.role,
        },
      },
    });

    if (signUpError || !authData.user) {
      throw signUpError || new Error("Registration failed");
    }

    userId = authData.user.id;

    // 2. Create profile with better error handling
    await createUserProfile(userId, data);

    return { user: authData.user, session: authData.session };

  } catch (error) {
    console.error("Registration error:", error);

    // If profile creation failed, try to cleanup auth user
    if (userId) {
      try {
        console.warn(`Attempting to cleanup orphaned user: ${userId}`);
        // Note: supabase.auth.admin.deleteUser() requires service role
        // This might not work from client-side
        await supabase.auth.admin.deleteUser(userId);
      } catch (cleanupError) {
        console.error("Failed to cleanup user:", cleanupError);
        // Log this for manual cleanup
        console.error("ORPHANED USER CREATED:", {
          userId,
          email: data.email,
          timestamp: new Date().toISOString(),
        });
      }
    }

    throw error;
  }
}
```

**Also improve `createUserProfile`**:
```typescript
async function createUserProfile(
  userId: string,
  data: RegisterData,
): Promise<void> {
  // Use transaction-like approach
  const errors: string[] = [];

  try {
    // 1. Create user record
    const { error: userError } = await supabase.from("users").insert({
      id: userId,
      full_name: data.full_name,
      email: data.email,
      role: data.role,
    });

    if (userError) {
      errors.push(`User table: ${userError.message}`);
      throw new Error(`Failed to create user profile: ${userError.message}`);
    }

    // 2. Create role-specific record
    if (data.role === "mahasiswa" && data.nim) {
      const { error: mahasiswaError } = await supabase.from("mahasiswa").insert([{
        user_id: userId,
        nim: data.nim,
        angkatan: data.angkatan || new Date().getFullYear(),
        semester: data.semester || 1,
        program_studi: data.program_studi,
      }]);

      if (mahasiswaError) {
        errors.push(`Mahasiswa table: ${mahasiswaError.message}`);

        // Cleanup: delete user record
        await supabase.from("users").delete().eq("id", userId);

        throw new Error(`Failed to create mahasiswa record: ${mahasiswaError.message}`);
      }
    } else if (data.role === "dosen" && data.nidn) {
      const { error: dosenError } = await supabase.from("dosen").insert([{
        user_id: userId,
        nidn: data.nidn,
        nip: data.nip,
        gelar_depan: data.gelar_depan,
        gelar_belakang: data.gelar_belakang,
      }]);

      if (dosenError) {
        errors.push(`Dosen table: ${dosenError.message}`);
        await supabase.from("users").delete().eq("id", userId);
        throw new Error(`Failed to create dosen record: ${dosenError.message}`);
      }
    } else if (data.role === "laboran" && data.nip) {
      const { error: laboranError } = await supabase.from("laboran").insert([{
        user_id: userId,
        nip: data.nip,
      }]);

      if (laboranError) {
        errors.push(`Laboran table: ${laboranError.message}`);
        await supabase.from("users").delete().eq("id", userId);
        throw new Error(`Failed to create laboran record: ${laboranError.message}`);
      }
    }

    console.log(`✅ User profile created successfully: ${userId}`);

  } catch (error) {
    console.error("createUserProfile failed:", error, errors);
    throw error;
  }
}
```

**Benefits**:
- ✅ Better error logging
- ✅ Cleanup on failure
- ✅ Clear error messages
- ✅ No code deployment needed (Option 1 better)

**Drawbacks**:
- Can't always cleanup auth.users from client-side
- Still possible to create orphans in edge cases

---

### Option 3: Scheduled Cleanup Job (BACKUP) 🔄

Run periodic job to sync orphaned users.

**File**: `supabase/migrations/XX_cleanup_orphaned_users_function.sql`

```sql
-- Function to sync all orphaned users
CREATE OR REPLACE FUNCTION cleanup_orphaned_users()
RETURNS TABLE (
    synced_count INTEGER,
    synced_users JSONB
) AS $$
DECLARE
    v_synced_count INTEGER := 0;
    v_synced_users JSONB := '[]'::jsonb;
BEGIN
    -- Insert orphaned auth.users into public.users
    WITH inserted AS (
        INSERT INTO public.users (
            id,
            email,
            full_name,
            role,
            is_active,
            created_at,
            updated_at
        )
        SELECT
            au.id,
            au.email,
            COALESCE(au.raw_user_meta_data->>'full_name', 'User'),
            COALESCE((au.raw_user_meta_data->>'role')::user_role, 'mahasiswa'),
            true,
            au.created_at,
            NOW()
        FROM auth.users au
        LEFT JOIN public.users u ON au.id = u.id
        WHERE u.id IS NULL
          AND au.email_confirmed_at IS NOT NULL  -- Only confirmed emails
        ON CONFLICT (id) DO NOTHING
        RETURNING id, email, full_name, role
    )
    SELECT
        COUNT(*)::INTEGER,
        jsonb_agg(to_jsonb(inserted))
    INTO v_synced_count, v_synced_users
    FROM inserted;

    RETURN QUERY SELECT v_synced_count, v_synced_users;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION cleanup_orphaned_users() TO authenticated, service_role;
```

**Setup cron job** (Supabase Dashboard → Database → Cron Jobs):
```sql
-- Run daily at 2 AM
SELECT cron.schedule(
    'cleanup-orphaned-users',
    '0 2 * * *',  -- Every day at 2 AM
    $$ SELECT cleanup_orphaned_users(); $$
);
```

**Benefits**:
- ✅ Automatic recovery
- ✅ Runs in background
- ✅ Fixes past and future issues

**Drawbacks**:
- Only runs periodically (not immediate)
- Requires pg_cron extension

---

## 🎯 RECOMMENDED APPROACH

**Best combination**:
1. ✅ **Apply Option 1** (Database Trigger) - Prevents future orphans
2. ✅ **Apply Option 3** (Cleanup Job) - Fixes any that slip through
3. ✅ **Monitor with queries** - Weekly check for orphaned users

---

## 📊 MONITORING QUERIES

Run weekly to ensure no orphans:

```sql
-- Check for orphaned users
SELECT
    COUNT(*) as orphaned_count,
    jsonb_agg(jsonb_build_object(
        'email', au.email,
        'created_at', au.created_at,
        'attempted_role', au.raw_user_meta_data->>'role'
    )) as orphaned_users
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL
  AND au.email_confirmed_at IS NOT NULL;
```

**Expected**: `orphaned_count = 0`

---

## ✅ NEXT STEPS

1. ✅ **NOW**: Run `FIX_SYNC_ORPHANED_ADMIN.sql` (fixes current issue)
2. 🔧 **TODAY**: Apply Option 1 (Database Trigger) - Create migration
3. 🔄 **THIS WEEK**: Apply Option 3 (Cleanup Job) - Setup cron
4. 📊 **ONGOING**: Monitor weekly with queries

---

**File**: `PREVENT_ORPHANED_USERS.md`
**Created**: 2025-12-09
**Priority**: HIGH (affects login reliability)
