@echo off
echo ============================================
echo FIXING KEHADIRAN SYSTEM
echo ============================================
echo.

cd /d "%~dp0"

echo [1/2] Running hybrid kehadiran migration...
npx supabase db execute --file supabase/migrations/20241219000000_hybrid_kehadiran_system.sql

echo.
echo [2/2] Fixing RLS policies...
npx supabase db execute --file FIX_KEHADIRAN_RLS.sql

echo.
echo ============================================
echo DONE! Refresh browser now.
echo ============================================
pause
