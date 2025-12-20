@echo off
echo ============================================
echo COMPLETE FIX: Kehadiran + Export System
echo ============================================
echo.

cd /d "%~dp0"

echo [1/3] Running hybrid kehadiran migration...
npx supabase db execute --file supabase/migrations/20241219000000_hybrid_kehadiran_system.sql

echo.
echo [2/3] Adding mata_kuliah_id to kehadiran...
npx supabase db execute --file ADD_MK_TO_KEHADIRAN.sql

echo.
echo [3/3] Fixing RLS policies...
npx supabase db execute --file FIX_KEHADIRAN_RLS.sql

echo.
echo ============================================
echo DONE! Refresh browser.
echo - Kehadiran bisa disimpan
echo - Export CSV akan show mata kuliah
echo ============================================
pause
