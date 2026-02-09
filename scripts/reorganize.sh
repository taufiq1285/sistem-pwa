#!/bin/bash

# Script untuk memindahkan file-file ke struktur folder yang terorganisir
# Tanggal: 11 Desember 2025

echo "🚀 Memulai reorganisasi file..."

# === ANALYSIS DOCUMENTS ===
echo "📁 Memindahkan dokumen analysis..."
mv -n ANALISIS_ALUR_MATA_KULIAH_MAHASISWA.md docs/analysis/ 2>/dev/null
mv -n ANALISIS_LOGIKA_KUIS_DOSEN.md docs/analysis/ 2>/dev/null
mv -n ANALISIS_LOGIKA_MATA_KULIAH_MAHASISWA.md docs/analysis/ 2>/dev/null
mv -n ANALISIS_SEMESTER_PROGRESSION.md docs/analysis/ 2>/dev/null
mv -n SYSTEM_AUDIT_REPORT.md docs/analysis/ 2>/dev/null
mv -n SYSTEM_ARCHITECTURE_DIAGRAMS.md docs/analysis/ 2>/dev/null
mv -n REVIEW_CONSISTENCY_MATA_KULIAH_USAGE.md docs/analysis/ 2>/dev/null

# === API DOCUMENTATION ===
echo "📁 Memindahkan dokumen API..."
mv -n API_DOCUMENTATION.md docs/api/ 2>/dev/null
mv -n COMPONENT_INTEGRATION_GUIDE.md docs/api/ 2>/dev/null
mv -n INTEGRATION_STEPS_DETAILED.md docs/api/ 2>/dev/null

# === DEPLOYMENT DOCS ===
echo "📁 Memindahkan dokumen deployment..."
mv -n DEPLOYMENT_CHECKLIST.md docs/deployment/ 2>/dev/null
mv -n DEPLOYMENT_GUIDE.md docs/deployment/ 2>/dev/null
mv -n PRE_DEPLOYMENT_CHECKLIST.md docs/deployment/ 2>/dev/null
mv -n PRODUCTION_READINESS_ASSESSMENT.md docs/deployment/ 2>/dev/null
mv -n MANUAL_MIGRATION_GUIDE.md docs/deployment/ 2>/dev/null
mv -n QUICK_START.md docs/deployment/ 2>/dev/null
mv -n QUICK_START_FIXED_MIGRATION.md docs/deployment/ 2>/dev/null

# === GUIDES ===
echo "📁 Memindahkan panduan..."
mv -n QUICK_REFERENCE.md docs/guides/ 2>/dev/null
mv -n START_HERE.md docs/guides/ 2>/dev/null
mv -n DOCUMENTATION_INDEX.md docs/guides/ 2>/dev/null
mv -n HYBRID_APPROVAL_WORKFLOW_GUIDE.md docs/guides/ 2>/dev/null
mv -n HYBRID_TESTING_GUIDE.md docs/guides/ 2>/dev/null
mv -n WORKFLOW_ADMIN_DOSEN_MAHASISWA.md docs/guides/ 2>/dev/null
mv -n LOGOUT_OPTIMIZATION_INSTANT.md docs/guides/ 2>/dev/null

# === TESTING DOCS ===
echo "📁 Memindahkan dokumen testing..."
mv -n TEST_RESULTS_SUMMARY.md docs/testing/ 2>/dev/null
mv -n TEST_EXECUTION_FINAL_REPORT.md docs/testing/ 2>/dev/null
mv -n TEST_HYBRID_APPROVAL_WORKFLOW.md docs/testing/ 2>/dev/null
mv -n TEST_OFFLINE_PWA.md docs/testing/ 2>/dev/null
mv -n ASSESSMENT_QUICK_SUMMARY.md docs/testing/ 2>/dev/null
mv -n VERIFICATION_CHECKLIST.md docs/testing/ 2>/dev/null
mv -n VERIFICATION_REPORT.md docs/testing/ 2>/dev/null
mv -n UI_VERIFICATION_REPORT.md docs/testing/ 2>/dev/null
mv -n DATABASE_VERIFICATION_CHECKLIST.md docs/testing/ 2>/dev/null

# === SQL SCRIPTS - VERIFICATION ===
echo "📁 Memindahkan SQL verification scripts..."
mv -n CHECK_DAY_OF_WEEK_ENUM.sql scripts/sql/ 2>/dev/null
mv -n CHECK_DOSEN_USER_MAPPING.sql scripts/sql/ 2>/dev/null
mv -n CHECK_JADWAL_POLICIES_SUPABASE.sql scripts/sql/ 2>/dev/null
mv -n CHECK_JADWAL_STATUS_FIELD.sql scripts/sql/ 2>/dev/null
mv -n CHECK_JADWAL_TABLE_STRUCTURE.sql scripts/sql/ 2>/dev/null
mv -n VERIFICATION_QUERIES.sql scripts/sql/ 2>/dev/null
mv -n VERIFY_MIGRATION_COMPLETE.sql scripts/sql/ 2>/dev/null
mv -n QUERY_1_ORPHANED_USERS.sql scripts/sql/ 2>/dev/null
mv -n QUERY_2_SUMMARY.sql scripts/sql/ 2>/dev/null

# === SQL SCRIPTS - FIX ===
echo "📁 Memindahkan SQL fix scripts..."
mv -n CLEANUP_DUPLICATE_POLICIES.sql scripts/sql/ 2>/dev/null
mv -n DELETE_ORPHANED_ADMIN.sql scripts/sql/ 2>/dev/null
mv -n FIX_CREATE_DOSEN_RECORD.sql scripts/sql/ 2>/dev/null
mv -n FIX_JADWAL_INSERT_PERMISSION.sql scripts/sql/ 2>/dev/null
mv -n FIX_JADWAL_POLICIES_DUPLICATE.sql scripts/sql/ 2>/dev/null
mv -n FIX_SYNC_ORPHANED_ADMIN.sql scripts/sql/ 2>/dev/null
mv -n RUN_THESE_QUERIES.sql scripts/sql/ 2>/dev/null

# === DEBUG SCRIPTS ===
echo "📁 Memindahkan debug scripts..."
mv -n DEBUG_JADWAL_403_ERROR.sql scripts/debug/ 2>/dev/null
mv -n DIAGNOSE_ROLE_ASSIGNMENT.sql scripts/debug/ 2>/dev/null

# === MIGRATION SCRIPTS ===
echo "📁 Memindahkan migration scripts..."
mv -n MIGRATION_FIX.txt scripts/migration/ 2>/dev/null

# === SUMMARY DOCS ===
echo "📁 Memindahkan summary docs..."
mv -n FINAL_ACCOMPLISHMENT_SUMMARY.md docs/ 2>/dev/null
mv -n FINAL_CONSISTENCY_GUIDELINE.md docs/ 2>/dev/null
mv -n FINAL_SYSTEM_STATUS.md docs/ 2>/dev/null
mv -n SESSION_SUMMARY_FINAL.md docs/ 2>/dev/null
mv -n STATUS_PERBAIKAN_LENGKAP.md docs/ 2>/dev/null
mv -n REORGANIZATION_COMPLETE.md docs/ 2>/dev/null
mv -n REORGANIZE_SUMMARY.md docs/ 2>/dev/null

# === IMPLEMENTATION DOCS ===
echo "📁 Memindahkan implementation docs..."
mv -n IMPLEMENTATION_DETAILS.md docs/ 2>/dev/null
mv -n HYBRID_APPROVAL_IMPLEMENTATION_COMPLETE.md docs/ 2>/dev/null
mv -n HYBRID_APPROVAL_STATUS.md docs/ 2>/dev/null
mv -n HYBRID_IMPLEMENTATION_COMPLETE.md docs/ 2>/dev/null
mv -n SEMESTER_PROGRESSION_COMPLETE.md docs/ 2>/dev/null
mv -n SEMESTER_PROGRESSION_IMPLEMENTATION.md docs/ 2>/dev/null

# === FIX SUMMARY DOCS ===
echo "📁 Memindahkan fix summary docs..."
mv -n FIX_APPLIED_SUMMARY.md docs/ 2>/dev/null
mv -n FIX_DOSEN_ERRORS_SUMMARY.md docs/ 2>/dev/null
mv -n FIX_KELAS_MULTI_DOSEN_SUMMARY.md docs/ 2>/dev/null
mv -n FIX_MATA_KULIAH_TO_KELAS_PRAKTIKUM_SUMMARY.md docs/ 2>/dev/null
mv -n FIX_NULL_MATA_KULIAH_SUMMARY.md docs/ 2>/dev/null
mv -n FIX_ROLE_ASSIGNMENT_ISSUE.md docs/ 2>/dev/null
mv -n MIGRATION_FIX_SUMMARY.md docs/ 2>/dev/null
mv -n MIGRATION_VERIFICATION_FINAL.md docs/ 2>/dev/null

# === FEATURE DOCS ===
echo "📁 Memindahkan feature docs..."
mv -n JADWAL_403_ERROR_EXPLANATION.md docs/ 2>/dev/null
mv -n JADWAL_APPROVAL_IMPACT_ANALYSIS.md docs/ 2>/dev/null
mv -n JADWAL_APPROVAL_IMPLEMENTATION_SUMMARY.md docs/ 2>/dev/null
mv -n LABORAN_CRUD_LABORATORIUM_SUMMARY.md docs/ 2>/dev/null
mv -n QUIZ_KELAS_EDIT_PROTECTION.md docs/ 2>/dev/null
mv -n REMOVE_BOBOT_NILAI_SUMMARY.md docs/ 2>/dev/null
mv -n TOTAL_MATA_KULIAH_DASHBOARD_SOURCE.md docs/ 2>/dev/null
mv -n PREVENT_ORPHANED_USERS.md docs/ 2>/dev/null
mv -n PROCESS_FIX_SUMMARY.md docs/ 2>/dev/null
mv -n ROLE_ISSUE_SOLUTION.md docs/ 2>/dev/null
mv -n QUICK_FIX_CARD.md docs/ 2>/dev/null
mv -n DEBUG_MATA_KULIAH_STUCK.md docs/ 2>/dev/null

# === TEST SCRIPTS ===
echo "📁 Memindahkan test scripts..."
mv -n test-laboran-api.ts testing/ 2>/dev/null
mv -n fix-dosen-tests.ts testing/ 2>/dev/null
mv -n test-results.log testing/ 2>/dev/null

# === MISC SCRIPTS ===
echo "📁 Memindahkan misc scripts..."
mv -n delete-users-api.html scripts/ 2>/dev/null
mv -n dosen-peminjaman-update-functions.ts scripts/ 2>/dev/null

echo ""
echo "✅ Reorganisasi selesai!"
echo ""
echo "📂 Struktur folder baru:"
echo "   docs/analysis/     - Dokumen analisis"
echo "   docs/api/          - Dokumentasi API"
echo "   docs/deployment/   - Panduan deployment"
echo "   docs/guides/       - Panduan pengguna"
echo "   docs/testing/      - Dokumentasi testing"
echo "   scripts/sql/       - SQL scripts"
echo "   scripts/debug/     - Debug scripts"
echo "   scripts/migration/ - Migration scripts"
echo ""
echo "📖 Baca REORGANIZATION_GUIDE.md untuk detail lengkap"
