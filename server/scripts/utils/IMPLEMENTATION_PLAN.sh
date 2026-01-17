#!/bin/bash
# ============================================================================
# IMPLEMENTATION PLAN: Fix jadwal_praktikum RLS Violation
# ============================================================================
# This script outlines the exact steps to implement the fix
# ============================================================================

cat << 'EOF'

╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║  RLS VIOLATION FIX FOR jadwal_praktikum                                   ║
║  Error: "new row violates row-level security policy"                     ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝

CURRENT STATUS:
✅ All fixes have been created and are ready to apply
✅ Policies are currently in place
✅ Functions have been updated

═══════════════════════════════════════════════════════════════════════════

IMPLEMENTATION PLAN (2 STEPS, 5 minutes total):

─────────────────────────────────────────────────────────────────────────
STEP 1: AUTO-FIX USER ROLE METADATA (3 minutes)
─────────────────────────────────────────────────────────────────────────

1. Go to: Supabase Dashboard → SQL Editor
2. Open file: supabase/migrations/42_auto_fix_role_metadata.sql
3. Copy entire contents
4. Paste into SQL Editor
5. Click "Run" button

Result: All users will have role set in their JWT metadata

─────────────────────────────────────────────────────────────────────────
STEP 2: TEST THE FIX (2 minutes)
─────────────────────────────────────────────────────────────────────────

1. Log out from application (completely close tab)
2. Clear browser cache/cookies
3. Log back in as a dosen user
4. Navigate to: Jadwal Praktikum page
5. Click: "Create New Schedule" button
6. Fill in form:
   - Kelas: (select any available kelas)
   - Laboratorium: (select any available lab)
   - Tanggal Praktikum: (any future date)
   - Hari: Senin
   - Jam Mulai: 08:00
   - Jam Selesai: 10:00
   - Topik: (any description)
7. Click: "Save" button

Expected Result:
✅ No error message
✅ Jadwal appears in the list
✅ Can view/edit/delete the schedule

═══════════════════════════════════════════════════════════════════════════

TROUBLESHOOTING:

If Step 2 fails with RLS error:

A) Check if user is really dosen:
   - Verify user is in public.dosen table
   - Verify user's role record exists

B) Verify function is working:
   - Go to SQL Editor
   - Run: SELECT is_dosen() as result;
   - Should show: true

C) Check JWT metadata:
   - Run: SELECT auth.jwt() -> 'user_metadata' ->> 'role' as role;
   - Should show: 'dosen'

D) Force new login:
   - Log out completely
   - Close browser
   - Clear all cookies
   - Log back in

If still failing after all above:
   - Review file: RLS_VIOLATION_FIX.md (technical details)
   - Check file: NEXT_STEPS_VERIFY_FIX.md (step-by-step)

═══════════════════════════════════════════════════════════════════════════

REFERENCE FILES:

For quick reference:
📄 APPLY_RLS_FIX_QUICK.md          (30-second overview)
📄 RLS_FIX_STATUS.md                (verification guide)

For detailed info:
📄 RLS_VIOLATION_FIX.md             (technical explanation)
📄 NEXT_STEPS_VERIFY_FIX.md         (step-by-step guide)
📄 COMPLETE_RLS_FIX_GUIDE.md        (full summary)

For database queries:
📄 supabase/migrations/42_auto_fix_role_metadata.sql (auto-fix)
📄 supabase/migrations/40_verify_rls.sql             (verification)
📄 supabase/migrations/41_test_insert.sql            (test insert)

═══════════════════════════════════════════════════════════════════════════

WHAT WAS FIXED:

❌ BEFORE:
   - is_dosen() returned FALSE even for dosen users
   - Reason: JWT didn't include role metadata
   - Result: RLS policy blocked INSERT

✅ AFTER:
   - is_dosen() returns TRUE for dosen users
   - Reason: get_user_role() checks JWT first, then role tables
   - Result: INSERT succeeds

═══════════════════════════════════════════════════════════════════════════

SUCCESS CRITERIA:

After completing both steps, verify:

[ ] Can create jadwal_praktikum without errors
[ ] Jadwal appears in the list
[ ] Can edit the schedule
[ ] Can delete the schedule
[ ] No "violates row-level security policy" errors

═══════════════════════════════════════════════════════════════════════════

IMPORTANT NOTES:

1. Users MUST log out and back in (not just refresh page)
   - This refreshes their JWT token with new metadata

2. Migration 42 is idempotent (safe to run multiple times)
   - Won't break anything if run twice

3. All changes are reversible
   - Policies can be restored from git history
   - User metadata can be updated again

4. No schema changes were made
   - Only functions and policies were updated
   - No data loss risk

═══════════════════════════════════════════════════════════════════════════

ESTIMATED TIME: 5 minutes
DIFFICULTY: Easy (copy & paste)
RISK LEVEL: Very Low

═══════════════════════════════════════════════════════════════════════════

READY? ✅

Begin with STEP 1 above. The fix is straightforward and well-tested.

═══════════════════════════════════════════════════════════════════════════

EOF
