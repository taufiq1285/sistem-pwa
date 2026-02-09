# Fix Guide: Quiz System Errors

## Errors Found

### 1. **Missing Columns Error**
```
Could not find the 'sisa_waktu' column of 'attempt_kuis' in the schema cache
```

**Cause**: The database schema is missing several columns that the TypeScript code expects:

**Missing in `attempt_kuis` table:**
- `submitted_at` - when quiz was submitted
- `sisa_waktu` - remaining time when submitted
- `attempt_number` - which attempt (1st, 2nd, etc.)
- `started_at` - when quiz started
- `total_poin` - total points earned

**Missing in `jawaban` table:**
- `is_auto_saved` - indicates auto-save
- `graded_at` - when answer was graded
- `graded_by` - who graded it
- `feedback` - teacher feedback

### 2. **RLS Policy Violation Error**
```
new row violates row-level security policy for table "jawaban"
```

**Cause**: The old RLS policies for `jawaban` table are too restrictive and prevent students from inserting their quiz answers.

---

## Solution

### Step 1: Start Supabase (if not running)

```bash
# Start Docker first
# Then start Supabase
npx supabase start
```

### Step 2: Apply the Migration Files

Two migration files have been created:

1. **`50_fix_missing_kuis_columns.sql`** - Adds all missing columns (UPDATED - Safe version)
2. **`51_fix_jawaban_rls_policies.sql`** - Fixes RLS policies for jawaban table

**Important:** These migrations are designed to be safe and idempotent - they won't fail if columns already exist.

**Option A: Via Supabase Dashboard (Recommended for Remote Database)**

1. Go to your Supabase project dashboard at https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor** in the left sidebar
4. Create a new query
5. Copy and paste the **entire contents** of `supabase/migrations/50_fix_missing_kuis_columns.sql`
6. Click **Run** or press Ctrl+Enter
7. Wait for success message (should show ✅ Missing columns migration complete!)
8. Create another new query
9. Copy and paste the **entire contents** of `supabase/migrations/51_fix_jawaban_rls_policies.sql`
10. Click **Run**
11. Wait for success message (should show ✅ JAWABAN RLS POLICIES MIGRATION COMPLETE)

**Option B: Via Supabase CLI (if using local Supabase)**

```bash
# First, start Supabase (requires Docker)
npx supabase start

# Then apply migrations
npx supabase migration up

# Or reset the database (WARNING: This will delete all data!)
npx supabase db reset
```

### Step 3: Verify the Fixes

Run this SQL in the Supabase dashboard to verify all columns exist:

```sql
-- Check attempt_kuis columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'attempt_kuis'
ORDER BY ordinal_position;

-- Check jawaban columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'jawaban'
ORDER BY ordinal_position;

-- Check jawaban RLS policies
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'jawaban';
```

### Step 4: Test the Quiz System

1. **Login as a student (mahasiswa)**
2. **Start a quiz**
3. **Answer some questions** - should auto-save without errors
4. **Submit the quiz** - should complete successfully
5. **Check browser console** - no more 403 or column errors

---

## What Was Fixed

### Migration 50: Missing Columns (UPDATED - Safe Version)

This migration now uses a safer approach that doesn't assume any existing columns.

**Added to `attempt_kuis`:**
- `submitted_at TIMESTAMPTZ` - Timestamp when quiz was submitted
- `sisa_waktu INTEGER` - Remaining time in seconds
- `attempt_number INTEGER DEFAULT 1` - Attempt number
- `started_at TIMESTAMPTZ` - When quiz started (populated from created_at for existing records)
- `total_poin DECIMAL(5,2)` - Total points earned

**Added to `jawaban`:**
- `is_auto_saved BOOLEAN DEFAULT false` - Auto-save indicator
- `graded_at TIMESTAMPTZ` - Grading timestamp
- `graded_by UUID` - References users(id)
- `feedback TEXT` - Teacher feedback

**Note:** The migration includes automatic verification to ensure all columns are created successfully.

### Migration 51: RLS Policies

**Fixed RLS policies for `jawaban` table:**

**SELECT policies:**
- Admin: Can see all answers
- Dosen: Can see answers for their students
- Mahasiswa: Can see their own answers

**INSERT policies:**
- Mahasiswa: Can insert answers for their own active attempts
- Admin: Can insert any answer

**UPDATE policies:**
- Mahasiswa: Can update their own answers (before submission)
- Dosen: Can update for grading (poin_diperoleh, is_correct, feedback)
- Admin: Can update any answer

**DELETE policies:**
- Admin: Can delete any answer
- Dosen: Can delete answers for their kuis

---

## Troubleshooting

### If you still see errors after applying migrations:

1. **Clear Supabase cache:**
   ```bash
   npx supabase db reset
   ```

2. **Restart Supabase:**
   ```bash
   npx supabase stop
   npx supabase start
   ```

3. **Check that migrations were applied:**
   ```bash
   npx supabase migration list
   ```

4. **Clear browser cache and localStorage:**
   - Open DevTools (F12)
   - Go to Application tab
   - Clear Storage
   - Refresh page

### If RLS errors persist:

Check if the helper functions exist:
```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'is_admin',
    'is_dosen',
    'is_mahasiswa',
    'get_current_dosen_id',
    'get_current_mahasiswa_id'
);
```

If any are missing, run the `20_rls_helper_functions.sql` migration first.

---

## Next Steps

After applying these fixes, the quiz system should work properly:
- ✅ Students can take quizzes
- ✅ Answers auto-save without errors
- ✅ Quiz submissions work correctly
- ✅ Teachers can grade answers
- ✅ No more 403 or missing column errors
