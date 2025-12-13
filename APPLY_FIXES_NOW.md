# Quick Fix Guide - Apply Immediately

## Step-by-Step Instructions

### 1️⃣ Open Supabase Dashboard

Go to: https://supabase.com/dashboard
- Select your project
- Click **SQL Editor** on the left sidebar

---

### 2️⃣ Apply Migration 1: Add Missing Columns

1. Click **New query** button
2. Copy the **entire file** `supabase/migrations/50_fix_missing_kuis_columns.sql`
3. Paste into the SQL Editor
4. Click **Run** (or press Ctrl+Enter)
5. ✅ Wait for success message: "Missing columns migration complete!"

**Expected output:**
```
✅ Missing columns migration complete!

Added to attempt_kuis:
  - submitted_at
  - sisa_waktu
  - attempt_number
  - started_at
  - total_poin

Added to jawaban:
  - is_auto_saved
  - graded_at
  - graded_by
  - feedback
```

---

### 3️⃣ Apply Migration 2: Fix RLS Policies

1. Click **New query** button again
2. Copy the **entire file** `supabase/migrations/51_fix_jawaban_rls_policies.sql`
3. Paste into the SQL Editor
4. Click **Run** (or press Ctrl+Enter)
5. ✅ Wait for success message: "JAWABAN RLS POLICIES MIGRATION COMPLETE"

**Expected output:**
```
✅ JAWABAN RLS POLICIES MIGRATION COMPLETE
Total policies created: 9
```

---

### 4️⃣ Verify the Fixes

Run this verification query in the SQL Editor:

```sql
-- Check that all columns exist
SELECT
  'attempt_kuis' as table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'attempt_kuis'
  AND column_name IN ('submitted_at', 'sisa_waktu', 'attempt_number', 'started_at', 'total_poin')

UNION ALL

SELECT
  'jawaban' as table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'jawaban'
  AND column_name IN ('is_auto_saved', 'graded_at', 'graded_by', 'feedback');

-- Check that RLS policies exist
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'jawaban'
ORDER BY policyname;
```

**Expected results:**
- Should see all 9 columns (5 for attempt_kuis + 4 for jawaban)
- Should see 9+ RLS policies for jawaban table

---

### 5️⃣ Test the Quiz System

1. **Clear browser cache:**
   - Press F12 to open DevTools
   - Go to Application tab → Storage → Clear site data
   - Refresh the page (F5)

2. **Login as a student (mahasiswa)**

3. **Start a quiz** and answer some questions

4. **Check console** (F12 → Console tab)
   - ✅ No more 403 errors
   - ✅ No more "column does not exist" errors
   - ✅ Answers should auto-save successfully

5. **Submit the quiz**
   - ✅ Should complete without errors

---

## Troubleshooting

### If you get "function does not exist" errors:

The RLS helper functions might be missing. Run this query first:

```sql
-- Check if helper functions exist
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

If any are missing, you need to apply the `20_rls_helper_functions.sql` migration first.

### If columns already exist:

That's fine! The migrations use `IF NOT EXISTS`, so they won't fail if columns already exist.

### If you still see errors:

1. Check the browser console for the exact error message
2. Run the verification query above to see what's missing
3. Clear browser cache and localStorage completely
4. Try a different browser or incognito window

---

## Files to Apply

1. `supabase/migrations/50_fix_missing_kuis_columns.sql` - 153 lines
2. `supabase/migrations/51_fix_jawaban_rls_policies.sql` - 171 lines

Both files are in your project's `supabase/migrations/` folder.

---

## After Applying

The quiz system will be fully functional:
- ✅ Students can take quizzes
- ✅ Auto-save works properly
- ✅ Quiz submission works
- ✅ Teachers can grade answers
- ✅ All RLS policies are correct
- ✅ No more 403 or missing column errors

---

## Need Help?

If you encounter any issues, check `FIX_KUIS_ERRORS.md` for detailed troubleshooting steps.
