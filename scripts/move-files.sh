#!/bin/bash
# Script simpel untuk pindahkan file ke folder yang sudah ada

echo "🚀 Memindahkan file-file ke folder yang sudah ada..."

# Pindah SQL files ke scripts/
mv -n *.sql scripts/ 2>/dev/null

# Pindah markdown docs ke docs/
mv -n ANALISIS_*.md docs/ 2>/dev/null
mv -n API_*.md docs/ 2>/dev/null
mv -n ASSESSMENT_*.md docs/ 2>/dev/null
mv -n COMPONENT_*.md docs/ 2>/dev/null
mv -n DATABASE_*.md docs/ 2>/dev/null
mv -n DEBUG_*.md docs/ 2>/dev/null
mv -n DEPLOYMENT_*.md docs/ 2>/dev/null
mv -n DOCUMENTATION_*.md docs/ 2>/dev/null
mv -n FINAL_*.md docs/ 2>/dev/null
mv -n FIX_*.md docs/ 2>/dev/null
mv -n HYBRID_*.md docs/ 2>/dev/null
mv -n IMPLEMENTATION_*.md docs/ 2>/dev/null
mv -n INTEGRATION_*.md docs/ 2>/dev/null
mv -n JADWAL_*.md docs/ 2>/dev/null
mv -n LABORAN_*.md docs/ 2>/dev/null
mv -n LOGOUT_*.md docs/ 2>/dev/null
mv -n MANUAL_*.md docs/ 2>/dev/null
mv -n MIGRATION_*.md docs/ 2>/dev/null
mv -n PRE_*.md docs/ 2>/dev/null
mv -n PREVENT_*.md docs/ 2>/dev/null
mv -n PROCESS_*.md docs/ 2>/dev/null
mv -n PRODUCTION_*.md docs/ 2>/dev/null
mv -n QUICK_*.md docs/ 2>/dev/null
mv -n QUIZ_*.md docs/ 2>/dev/null
mv -n REMOVE_*.md docs/ 2>/dev/null
mv -n REORGANIZATION_*.md docs/ 2>/dev/null
mv -n REORGANIZE_*.md docs/ 2>/dev/null
mv -n REVIEW_*.md docs/ 2>/dev/null
mv -n ROLE_*.md docs/ 2>/dev/null
mv -n SEMESTER_*.md docs/ 2>/dev/null
mv -n SESSION_*.md docs/ 2>/dev/null
mv -n START_*.md docs/ 2>/dev/null
mv -n STATUS_*.md docs/ 2>/dev/null
mv -n SYSTEM_*.md docs/ 2>/dev/null
mv -n TEST_*.md docs/ 2>/dev/null
mv -n TOTAL_*.md docs/ 2>/dev/null
mv -n UI_*.md docs/ 2>/dev/null
mv -n VERIFICATION_*.md docs/ 2>/dev/null
mv -n WORKFLOW_*.md docs/ 2>/dev/null

# Pindah test files ke testing/
mv -n test-*.ts testing/ 2>/dev/null
mv -n fix-*.ts testing/ 2>/dev/null
mv -n *-test*.ts testing/ 2>/dev/null
mv -n test-results.log testing/ 2>/dev/null

# Pindah misc files ke scripts/
mv -n delete-users-api.html scripts/ 2>/dev/null
mv -n dosen-peminjaman-update-functions.ts scripts/ 2>/dev/null
mv -n MIGRATION_FIX.txt scripts/ 2>/dev/null

echo "✅ Selesai! File-file sudah dipindahkan."
