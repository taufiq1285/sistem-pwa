#!/bin/bash
# ============================================================================
# apply-rls-fix.sh
# ============================================================================
# This script applies the RLS fix for jadwal_praktikum INSERT violation
# Usage: bash apply-rls-fix.sh
# ============================================================================

echo "================================"
echo "Applying RLS Fix for jadwal_praktikum"
echo "================================"
echo ""
echo "This script will:"
echo "1. Fix get_user_role() to properly handle JWT and fallback"
echo "2. Fix is_dosen(), is_admin(), is_laboran(), is_mahasiswa() functions"
echo "3. Ensure jadwal_praktikum has correct RLS policies"
echo "4. Test the functions"
echo ""

# The fix SQL is in migrations/39_final_rls_fix.sql
echo "✓ Fix script: supabase/migrations/39_final_rls_fix.sql"
echo ""
echo "To apply this fix:"
echo "1. Go to Supabase SQL Editor"
echo "2. Copy the contents of: supabase/migrations/39_final_rls_fix.sql"
echo "3. Paste into SQL Editor"
echo "4. Click 'Run'"
echo ""
echo "After running the migration:"
echo "1. Log out from the application"
echo "2. Log back in"
echo "3. Try creating a jadwal_praktikum again"
echo ""
