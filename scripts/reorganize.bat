@echo off
REM Script untuk memindahkan file-file ke struktur folder yang terorganisir
REM Tanggal: 11 Desember 2025

echo 🚀 Memulai reorganisasi file...

REM === ANALYSIS DOCUMENTS ===
echo 📁 Memindahkan dokumen analysis...
move /Y ANALISIS_ALUR_MATA_KULIAH_MAHASISWA.md docs\analysis\ 2>nul
move /Y ANALISIS_LOGIKA_KUIS_DOSEN.md docs\analysis\ 2>nul
move /Y ANALISIS_LOGIKA_MATA_KULIAH_MAHASISWA.md docs\analysis\ 2>nul
move /Y ANALISIS_SEMESTER_PROGRESSION.md docs\analysis\ 2>nul
move /Y SYSTEM_AUDIT_REPORT.md docs\analysis\ 2>nul
move /Y SYSTEM_ARCHITECTURE_DIAGRAMS.md docs\analysis\ 2>nul
move /Y REVIEW_CONSISTENCY_MATA_KULIAH_USAGE.md docs\analysis\ 2>nul

REM === API DOCUMENTATION ===
echo 📁 Memindahkan dokumen API...
move /Y API_DOCUMENTATION.md docs\api\ 2>nul
move /Y COMPONENT_INTEGRATION_GUIDE.md docs\api\ 2>nul
move /Y INTEGRATION_STEPS_DETAILED.md docs\api\ 2>nul

REM === DEPLOYMENT DOCS ===
echo 📁 Memindahkan dokumen deployment...
move /Y DEPLOYMENT_CHECKLIST.md docs\deployment\ 2>nul
move /Y DEPLOYMENT_GUIDE.md docs\deployment\ 2>nul
move /Y PRE_DEPLOYMENT_CHECKLIST.md docs\deployment\ 2>nul
move /Y PRODUCTION_READINESS_ASSESSMENT.md docs\deployment\ 2>nul
move /Y MANUAL_MIGRATION_GUIDE.md docs\deployment\ 2>nul
move /Y QUICK_START.md docs\deployment\ 2>nul
move /Y QUICK_START_FIXED_MIGRATION.md docs\deployment\ 2>nul

REM === GUIDES ===
echo 📁 Memindahkan panduan...
move /Y QUICK_REFERENCE.md docs\guides\ 2>nul
move /Y START_HERE.md docs\guides\ 2>nul
move /Y DOCUMENTATION_INDEX.md docs\guides\ 2>nul
move /Y HYBRID_APPROVAL_WORKFLOW_GUIDE.md docs\guides\ 2>nul
move /Y HYBRID_TESTING_GUIDE.md docs\guides\ 2>nul
move /Y WORKFLOW_ADMIN_DOSEN_MAHASISWA.md docs\guides\ 2>nul
move /Y LOGOUT_OPTIMIZATION_INSTANT.md docs\guides\ 2>nul

REM === TESTING DOCS ===
echo 📁 Memindahkan dokumen testing...
move /Y TEST_RESULTS_SUMMARY.md docs\testing\ 2>nul
move /Y TEST_EXECUTION_FINAL_REPORT.md docs\testing\ 2>nul
move /Y TEST_HYBRID_APPROVAL_WORKFLOW.md docs\testing\ 2>nul
move /Y TEST_OFFLINE_PWA.md docs\testing\ 2>nul
move /Y ASSESSMENT_QUICK_SUMMARY.md docs\testing\ 2>nul
move /Y VERIFICATION_CHECKLIST.md docs\testing\ 2>nul
move /Y VERIFICATION_REPORT.md docs\testing\ 2>nul
move /Y UI_VERIFICATION_REPORT.md docs\testing\ 2>nul
move /Y DATABASE_VERIFICATION_CHECKLIST.md docs\testing\ 2>nul

REM === SQL SCRIPTS ===
echo 📁 Memindahkan SQL scripts...
move /Y CHECK_DAY_OF_WEEK_ENUM.sql scripts\sql\ 2>nul
move /Y CHECK_DOSEN_USER_MAPPING.sql scripts\sql\ 2>nul
move /Y CHECK_JADWAL_POLICIES_SUPABASE.sql scripts\sql\ 2>nul
move /Y CHECK_JADWAL_STATUS_FIELD.sql scripts\sql\ 2>nul
move /Y CHECK_JADWAL_TABLE_STRUCTURE.sql scripts\sql\ 2>nul
move /Y VERIFICATION_QUERIES.sql scripts\sql\ 2>nul
move /Y VERIFY_MIGRATION_COMPLETE.sql scripts\sql\ 2>nul
move /Y QUERY_1_ORPHANED_USERS.sql scripts\sql\ 2>nul
move /Y QUERY_2_SUMMARY.sql scripts\sql\ 2>nul
move /Y CLEANUP_DUPLICATE_POLICIES.sql scripts\sql\ 2>nul
move /Y DELETE_ORPHANED_ADMIN.sql scripts\sql\ 2>nul
move /Y FIX_CREATE_DOSEN_RECORD.sql scripts\sql\ 2>nul
move /Y FIX_JADWAL_INSERT_PERMISSION.sql scripts\sql\ 2>nul
move /Y FIX_JADWAL_POLICIES_DUPLICATE.sql scripts\sql\ 2>nul
move /Y FIX_SYNC_ORPHANED_ADMIN.sql scripts\sql\ 2>nul
move /Y RUN_THESE_QUERIES.sql scripts\sql\ 2>nul

REM === DEBUG SCRIPTS ===
echo 📁 Memindahkan debug scripts...
move /Y DEBUG_JADWAL_403_ERROR.sql scripts\debug\ 2>nul
move /Y DIAGNOSE_ROLE_ASSIGNMENT.sql scripts\debug\ 2>nul

REM === MIGRATION SCRIPTS ===
echo 📁 Memindahkan migration scripts...
move /Y MIGRATION_FIX.txt scripts\migration\ 2>nul

REM === SUMMARY DOCS ===
echo 📁 Memindahkan summary docs...
move /Y FINAL_ACCOMPLISHMENT_SUMMARY.md docs\ 2>nul
move /Y FINAL_CONSISTENCY_GUIDELINE.md docs\ 2>nul
move /Y FINAL_SYSTEM_STATUS.md docs\ 2>nul
move /Y SESSION_SUMMARY_FINAL.md docs\ 2>nul
move /Y STATUS_PERBAIKAN_LENGKAP.md docs\ 2>nul
move /Y REORGANIZATION_COMPLETE.md docs\ 2>nul
move /Y REORGANIZE_SUMMARY.md docs\ 2>nul

REM === IMPLEMENTATION DOCS ===
echo 📁 Memindahkan implementation docs...
move /Y IMPLEMENTATION_DETAILS.md docs\ 2>nul
move /Y HYBRID_APPROVAL_IMPLEMENTATION_COMPLETE.md docs\ 2>nul
move /Y HYBRID_APPROVAL_STATUS.md docs\ 2>nul
move /Y HYBRID_IMPLEMENTATION_COMPLETE.md docs\ 2>nul
move /Y SEMESTER_PROGRESSION_COMPLETE.md docs\ 2>nul
move /Y SEMESTER_PROGRESSION_IMPLEMENTATION.md docs\ 2>nul

REM === FIX SUMMARY DOCS ===
echo 📁 Memindahkan fix summary docs...
move /Y FIX_APPLIED_SUMMARY.md docs\ 2>nul
move /Y FIX_DOSEN_ERRORS_SUMMARY.md docs\ 2>nul
move /Y FIX_KELAS_MULTI_DOSEN_SUMMARY.md docs\ 2>nul
move /Y FIX_MATA_KULIAH_TO_KELAS_PRAKTIKUM_SUMMARY.md docs\ 2>nul
move /Y FIX_NULL_MATA_KULIAH_SUMMARY.md docs\ 2>nul
move /Y FIX_ROLE_ASSIGNMENT_ISSUE.md docs\ 2>nul
move /Y MIGRATION_FIX_SUMMARY.md docs\ 2>nul
move /Y MIGRATION_VERIFICATION_FINAL.md docs\ 2>nul

REM === FEATURE DOCS ===
echo 📁 Memindahkan feature docs...
move /Y JADWAL_403_ERROR_EXPLANATION.md docs\ 2>nul
move /Y JADWAL_APPROVAL_IMPACT_ANALYSIS.md docs\ 2>nul
move /Y JADWAL_APPROVAL_IMPLEMENTATION_SUMMARY.md docs\ 2>nul
move /Y LABORAN_CRUD_LABORATORIUM_SUMMARY.md docs\ 2>nul
move /Y QUIZ_KELAS_EDIT_PROTECTION.md docs\ 2>nul
move /Y REMOVE_BOBOT_NILAI_SUMMARY.md docs\ 2>nul
move /Y TOTAL_MATA_KULIAH_DASHBOARD_SOURCE.md docs\ 2>nul
move /Y PREVENT_ORPHANED_USERS.md docs\ 2>nul
move /Y PROCESS_FIX_SUMMARY.md docs\ 2>nul
move /Y ROLE_ISSUE_SOLUTION.md docs\ 2>nul
move /Y QUICK_FIX_CARD.md docs\ 2>nul
move /Y DEBUG_MATA_KULIAH_STUCK.md docs\ 2>nul

REM === TEST SCRIPTS ===
echo 📁 Memindahkan test scripts...
move /Y test-laboran-api.ts testing\ 2>nul
move /Y fix-dosen-tests.ts testing\ 2>nul
move /Y test-results.log testing\ 2>nul

REM === MISC SCRIPTS ===
echo 📁 Memindahkan misc scripts...
move /Y delete-users-api.html scripts\ 2>nul
move /Y dosen-peminjaman-update-functions.ts scripts\ 2>nul

echo.
echo ✅ Reorganisasi selesai!
echo.
echo 📂 Struktur folder baru:
echo    docs\analysis\     - Dokumen analisis
echo    docs\api\          - Dokumentasi API
echo    docs\deployment\   - Panduan deployment
echo    docs\guides\       - Panduan pengguna
echo    docs\testing\      - Dokumentasi testing
echo    scripts\sql\       - SQL scripts
echo    scripts\debug\     - Debug scripts
echo    scripts\migration\ - Migration scripts
echo.
echo 📖 Baca REORGANIZATION_GUIDE.md untuk detail lengkap
pause
