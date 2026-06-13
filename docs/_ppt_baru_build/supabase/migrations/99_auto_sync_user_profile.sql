-- ================================================
-- MIGRATION 99: AUTO-SYNC USER PROFILE
-- ================================================
-- Purpose: Prevent orphaned users by auto-creating public.users
--          when auth.users is created
-- Date: 2025-12-09
-- Issue: Users stuck in auth.users without public.users (role NULL)
-- ================================================

-- ============================================================================
-- FUNCTION: Auto-create public.users when auth.users is created
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Only proceed if user confirmed their email
    -- (Prevents creating profiles for unconfirmed signups)
    IF NEW.email_confirmed_at IS NOT NULL THEN
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
            -- Get full_name from metadata, default to 'User' if not provided
            COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
            -- Get role from metadata, cast to user_role enum, default to 'mahasiswa'
            COALESCE(
                (NEW.raw_user_meta_data->>'role')::user_role,
                'mahasiswa'::user_role
            ),
            true,
            NEW.created_at,
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            -- Update if somehow already exists (safety)
            email = EXCLUDED.email,
            updated_at = NOW();

        -- Log success
        RAISE NOTICE 'Auto-created user profile for: % (role: %)',
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'role', 'mahasiswa');
    END IF;

    RETURN NEW;
END;
$$;

-- ============================================================================
-- TRIGGER: Execute on auth.users INSERT
-- ============================================================================

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_auth_user();

-- ============================================================================
-- PERMISSIONS
-- ============================================================================

-- Grant necessary permissions for trigger to work
GRANT USAGE ON SCHEMA auth TO postgres;
GRANT SELECT ON auth.users TO postgres;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Test query: Check if trigger is created
SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Expected result: 1 row showing the trigger

-- ============================================================================
-- NOTES
-- ============================================================================

-- Benefits:
-- ✅ Prevents orphaned users (auth.users without public.users)
-- ✅ Automatic (no code changes needed)
-- ✅ Uses metadata from registration form
-- ✅ Default role 'mahasiswa' if not specified
-- ✅ Handles email confirmation properly

-- Limitations:
-- ⚠️ Role-specific tables (mahasiswa/dosen/laboran) still need to be created
--    by the application code (createUserProfile function)
-- ⚠️ Only syncs basic user info (id, email, full_name, role)

-- How it works:
-- 1. User submits registration form
-- 2. Supabase Auth creates user in auth.users
-- 3. Trigger AUTOMATICALLY creates matching record in public.users
-- 4. Application code then creates role-specific record (mahasiswa/dosen/laboran)
-- 5. If step 4 fails, at least user has basic profile (can login, role visible)

-- Monitoring:
-- Run this query daily to ensure no orphaned users:
/*
SELECT COUNT(*) as orphaned_users
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL AND au.email_confirmed_at IS NOT NULL;
-- Expected: 0
*/

-- Rollback (if needed):
/*
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_auth_user();
*/
