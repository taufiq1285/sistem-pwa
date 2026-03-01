@echo off
setlocal ENABLEDELAYEDEXPANSION

REM =========================================================
REM Supabase PostgreSQL Backup/Restore Script (No Docker)
REM =========================================================
REM Cara pakai cepat:
REM 1) Isi konfigurasi di bagian CONFIG.
REM 2) Jalankan:
REM    scripts\supabase-backup-restore.bat backup
REM 3) Untuk restore ke project baru:
REM    scripts\supabase-backup-restore.bat restore "backups\supabase\YYYYMMDD_HHMMSS"
REM
REM Catatan:
REM - Butuh pg_dump dan psql di PATH (install PostgreSQL client tools).
REM - File backup berisi data sensitif. Simpan di lokasi aman.
REM =========================================================

REM ===================== CONFIG ============================
set "DB_HOST=ISI_HOST_SUPABASE_ANDA"
set "DB_PORT=5432"
set "DB_NAME=postgres"
set "DB_USER=postgres"
set "DB_PASSWORD=ISI_PASSWORD_SUPABASE_ANDA"

REM Untuk restore ke project baru, isi TARGET_*.
set "TARGET_HOST=ISI_HOST_PROJECT_BARU"
set "TARGET_PORT=5432"
set "TARGET_DB=postgres"
set "TARGET_USER=postgres"
set "TARGET_PASSWORD=ISI_PASSWORD_PROJECT_BARU"
REM =========================================================

if "%~1"=="" goto :usage

where pg_dump >nul 2>nul
if errorlevel 1 (
  echo [ERROR] pg_dump tidak ditemukan di PATH.
  echo Install PostgreSQL client tools dulu.
  exit /b 1
)

where psql >nul 2>nul
if errorlevel 1 (
  echo [ERROR] psql tidak ditemukan di PATH.
  echo Install PostgreSQL client tools dulu.
  exit /b 1
)

if /I "%~1"=="backup" goto :backup
if /I "%~1"=="restore" goto :restore
goto :usage

:backup
if "%DB_HOST%"=="ISI_HOST_SUPABASE_ANDA" (
  echo [ERROR] DB_HOST belum diisi.
  exit /b 1
)
if "%DB_PASSWORD%"=="ISI_PASSWORD_SUPABASE_ANDA" (
  echo [ERROR] DB_PASSWORD belum diisi.
  exit /b 1
)

for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd_HHmmss"') do set "TS=%%i"
set "OUT_DIR=backups\supabase\%TS%"
if not exist "%OUT_DIR%" mkdir "%OUT_DIR%"

echo [INFO] Menjalankan backup ke: %OUT_DIR%

set "PGPASSWORD=%DB_PASSWORD%"

echo [INFO] Dump schema...
pg_dump -h "%DB_HOST%" -p "%DB_PORT%" -U "%DB_USER%" -d "%DB_NAME%" --schema-only --no-owner --no-privileges -f "%OUT_DIR%\schema.sql"
if errorlevel 1 (
  echo [ERROR] Gagal dump schema.
  exit /b 1
)

echo [INFO] Dump data...
pg_dump -h "%DB_HOST%" -p "%DB_PORT%" -U "%DB_USER%" -d "%DB_NAME%" --data-only --inserts --no-owner --no-privileges -f "%OUT_DIR%\data.sql"
if errorlevel 1 (
  echo [ERROR] Gagal dump data.
  exit /b 1
)

echo [INFO] Validasi cepat schema (TABLE/POLICY/TRIGGER/FUNCTION)...
findstr /I /C:"CREATE TABLE" "%OUT_DIR%\schema.sql" >nul && echo [OK] CREATE TABLE ditemukan.
findstr /I /C:"CREATE POLICY" "%OUT_DIR%\schema.sql" >nul && echo [OK] CREATE POLICY ditemukan.
findstr /I /C:"CREATE TRIGGER" "%OUT_DIR%\schema.sql" >nul && echo [OK] CREATE TRIGGER ditemukan.
findstr /I /C:"CREATE FUNCTION" "%OUT_DIR%\schema.sql" >nul && echo [OK] CREATE FUNCTION ditemukan.

echo [SUCCESS] Backup selesai.
echo [OUTPUT] %OUT_DIR%\schema.sql
echo [OUTPUT] %OUT_DIR%\data.sql
exit /b 0

:restore
if "%~2"=="" (
  echo [ERROR] Path folder backup belum diberikan.
  echo Contoh: scripts\supabase-backup-restore.bat restore "backups\supabase\20260301_230000"
  exit /b 1
)

if "%TARGET_HOST%"=="ISI_HOST_PROJECT_BARU" (
  echo [ERROR] TARGET_HOST belum diisi.
  exit /b 1
)
if "%TARGET_PASSWORD%"=="ISI_PASSWORD_PROJECT_BARU" (
  echo [ERROR] TARGET_PASSWORD belum diisi.
  exit /b 1
)

set "IN_DIR=%~2"
if not exist "%IN_DIR%\schema.sql" (
  echo [ERROR] File schema.sql tidak ditemukan di "%IN_DIR%".
  exit /b 1
)
if not exist "%IN_DIR%\data.sql" (
  echo [ERROR] File data.sql tidak ditemukan di "%IN_DIR%".
  exit /b 1
)

echo [INFO] Restore schema ke project baru...
set "PGPASSWORD=%TARGET_PASSWORD%"
psql -h "%TARGET_HOST%" -p "%TARGET_PORT%" -U "%TARGET_USER%" -d "%TARGET_DB%" -f "%IN_DIR%\schema.sql"
if errorlevel 1 (
  echo [ERROR] Restore schema gagal.
  exit /b 1
)

echo [INFO] Restore data ke project baru...
psql -h "%TARGET_HOST%" -p "%TARGET_PORT%" -U "%TARGET_USER%" -d "%TARGET_DB%" -f "%IN_DIR%\data.sql"
if errorlevel 1 (
  echo [ERROR] Restore data gagal.
  exit /b 1
)

echo [SUCCESS] Restore selesai.
exit /b 0

:usage
echo Penggunaan:
echo   scripts\supabase-backup-restore.bat backup
echo   scripts\supabase-backup-restore.bat restore "backups\supabase\YYYYMMDD_HHMMSS"
exit /b 1
