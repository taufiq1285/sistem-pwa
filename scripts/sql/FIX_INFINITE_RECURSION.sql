-- ============================================================================
-- FIX: Infinite Recursion in Users Table Policy
-- Error: "infinite recursion detected in policy for relation "users""
-- ============================================================================

-- The problem: Some policies reference "users" table within themselves
-- Solution: Drop problematic policies and keep only simple ones

-- Step 1: Drop all problematic policies on users table
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to read for auth" ON users;
DROP POLICY IF EXISTS "Enable read access for users" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view all users" ON users;

-- Step 2: Create safe, non-recursive policies
-- Policy 1: Everyone can read (for auth purposes)
CREATE POLICY "Enable read access for users" ON users
  FOR SELECT USING (true);

-- Policy 2: User can update own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 3: Allow INSERT for registration (authenticated users only)
CREATE POLICY "Allow insert for registration" ON users
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Verify RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Check what policies remain
SELECT policyname, qual, with_check, cmd
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;
