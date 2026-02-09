@echo off
REM Script untuk pindahkan file ke folder yang sudah ada

echo 🚀 Memindahkan file-file...

REM Pindah SQL files
move /Y *.sql scripts\ 2>nul

REM Pindah markdown docs
move /Y ANALISIS_*.md docs\ 2>nul
move /Y API_*.md docs\ 2>nul
move /Y ASSESSMENT_*.md docs\ 2>nul
move /Y COMPONENT_*.md docs\ 2>nul
move /Y DATABASE_*.md docs\ 2>nul
move /Y DEBUG_*.md docs\ 2>nul
move /Y DEPLOYMENT_*.md docs\ 2>nul
move /Y DOCUMENTATION_*.md docs\ 2>nul
move /Y FINAL_*.md docs\ 2>nul
move /Y FIX_*.md docs\ 2>nul
move /Y HYBRID_*.md docs\ 2>nul
move /Y IMPLEMENTATION_*.md docs\ 2>nul
move /Y INTEGRATION_*.md docs\ 2>nul
move /Y JADWAL_*.md docs\ 2>nul
move /Y LABORAN_*.md docs\ 2>nul
move /Y LOGOUT_*.md docs\ 2>nul
move /Y MANUAL_*.md docs\ 2>nul
move /Y MIGRATION_*.md docs\ 2>nul
move /Y PRE_*.md docs\ 2>nul
move /Y PREVENT_*.md docs\ 2>nul
move /Y PROCESS_*.md docs\ 2>nul
move /Y PRODUCTION_*.md docs\ 2>nul
move /Y QUICK_*.md docs\ 2>nul
move /Y QUIZ_*.md docs\ 2>nul
move /Y REMOVE_*.md docs\ 2>nul
move /Y REORGANIZATION_*.md docs\ 2>nul
move /Y REORGANIZE_*.md docs\ 2>nul
move /Y REVIEW_*.md docs\ 2>nul
move /Y ROLE_*.md docs\ 2>nul
move /Y SEMESTER_*.md docs\ 2>nul
move /Y SESSION_*.md docs\ 2>nul
move /Y START_*.md docs\ 2>nul
move /Y STATUS_*.md docs\ 2>nul
move /Y SYSTEM_*.md docs\ 2>nul
move /Y TEST_*.md docs\ 2>nul
move /Y TOTAL_*.md docs\ 2>nul
move /Y UI_*.md docs\ 2>nul
move /Y VERIFICATION_*.md docs\ 2>nul
move /Y WORKFLOW_*.md docs\ 2>nul

REM Pindah test files
move /Y test-*.ts testing\ 2>nul
move /Y fix-*.ts testing\ 2>nul
move /Y test-results.log testing\ 2>nul

REM Pindah misc files
move /Y delete-users-api.html scripts\ 2>nul
move /Y dosen-peminjaman-update-functions.ts scripts\ 2>nul
move /Y MIGRATION_FIX.txt scripts\ 2>nul

echo ✅ Selesai!
echo 📂 SQL files → scripts\
echo 📂 Markdown docs → docs\
echo 📂 Test files → testing\
pause
