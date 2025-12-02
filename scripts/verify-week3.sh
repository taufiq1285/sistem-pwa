#!/bin/bash
# ============================================================================
# VERIFICATION SCRIPT - WEEK 3 DATABASE ENHANCEMENT
# ============================================================================
# Description: Comprehensive verification untuk Week 3 deployment
# Author: System Praktikum PWA Team
# Date: 2025-11-28
# ============================================================================

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ENVIRONMENT="${1:-local}"

# ============================================================================
# Database Connection
# ============================================================================

case "$ENVIRONMENT" in
    local)
        DB_URL="postgresql://postgres:postgres@localhost:54322/postgres"
        ;;
    *)
        echo "Unknown environment: $ENVIRONMENT"
        exit 1
        ;;
esac

# ============================================================================
# Helper Functions
# ============================================================================

print_header() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo ""
}

check_pass() {
    echo -e "${GREEN}✅ PASS${NC} - $1"
}

check_fail() {
    echo -e "${RED}❌ FAIL${NC} - $1"
}

check_warn() {
    echo -e "${YELLOW}⚠️  WARN${NC} - $1"
}

# ============================================================================
# Verification Checks
# ============================================================================

print_header "WEEK 3 DEPLOYMENT VERIFICATION"
echo "Environment: $ENVIRONMENT"
echo "Database: $DB_URL"
echo ""

TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

run_check() {
    local description="$1"
    local query="$2"
    local expected="$3"
    local operator="${4:-eq}"

    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    local result=$(psql "$DB_URL" -t -c "$query" 2>/dev/null | tr -d ' ')

    local pass=false
    case "$operator" in
        eq)
            [ "$result" = "$expected" ] && pass=true
            ;;
        ge)
            [ "$result" -ge "$expected" ] 2>/dev/null && pass=true
            ;;
        gt)
            [ "$result" -gt "$expected" ] 2>/dev/null && pass=true
            ;;
    esac

    if $pass; then
        check_pass "$description (expected: $expected, got: $result)"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        check_fail "$description (expected: $expected, got: $result)"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
}

# ============================================================================
# CHECK 1: RLS ENABLED
# ============================================================================

print_header "CHECK 1: ROW LEVEL SECURITY"

run_check \
    "users table RLS" \
    "SELECT rowsecurity::text FROM pg_tables WHERE tablename = 'users'" \
    "t"

run_check \
    "kuis table RLS" \
    "SELECT rowsecurity::text FROM pg_tables WHERE tablename = 'kuis'" \
    "t"

run_check \
    "nilai table RLS" \
    "SELECT rowsecurity::text FROM pg_tables WHERE tablename = 'nilai'" \
    "t"

run_check \
    "kelas table RLS" \
    "SELECT rowsecurity::text FROM pg_tables WHERE tablename = 'kelas'" \
    "t"

# ============================================================================
# CHECK 2: POLICY COUNT
# ============================================================================

print_header "CHECK 2: RLS POLICIES"

run_check \
    "Total policies created" \
    "SELECT COUNT(*)::text FROM pg_policies WHERE schemaname = 'public'" \
    "80" \
    "ge"

run_check \
    "users table policies" \
    "SELECT COUNT(*)::text FROM pg_policies WHERE tablename = 'users'" \
    "4" \
    "ge"

run_check \
    "kuis table policies" \
    "SELECT COUNT(*)::text FROM pg_policies WHERE tablename = 'kuis'" \
    "6" \
    "ge"

run_check \
    "nilai table policies" \
    "SELECT COUNT(*)::text FROM pg_policies WHERE tablename = 'nilai'" \
    "6" \
    "ge"

# ============================================================================
# CHECK 3: HELPER FUNCTIONS
# ============================================================================

print_header "CHECK 3: HELPER FUNCTIONS"

run_check \
    "get_user_role() exists" \
    "SELECT COUNT(*)::text FROM pg_proc WHERE proname = 'get_user_role'" \
    "1"

run_check \
    "is_admin() exists" \
    "SELECT COUNT(*)::text FROM pg_proc WHERE proname = 'is_admin'" \
    "1"

run_check \
    "is_dosen() exists" \
    "SELECT COUNT(*)::text FROM pg_proc WHERE proname = 'is_dosen'" \
    "1"

run_check \
    "is_mahasiswa() exists" \
    "SELECT COUNT(*)::text FROM pg_proc WHERE proname = 'is_mahasiswa'" \
    "1"

run_check \
    "get_current_mahasiswa_id() exists" \
    "SELECT COUNT(*)::text FROM pg_proc WHERE proname = 'get_current_mahasiswa_id'" \
    "1"

run_check \
    "Total helper functions" \
    "SELECT COUNT(*)::text FROM pg_proc WHERE proname IN ('get_user_role', 'is_admin', 'is_dosen', 'is_laboran', 'is_mahasiswa', 'get_current_mahasiswa_id', 'get_current_dosen_id', 'get_current_laboran_id')" \
    "8" \
    "ge"

# ============================================================================
# CHECK 4: AUDIT SYSTEM
# ============================================================================

print_header "CHECK 4: AUDIT SYSTEM"

run_check \
    "audit_logs table exists" \
    "SELECT COUNT(*)::text FROM information_schema.tables WHERE table_name = 'audit_logs'" \
    "1"

run_check \
    "sensitive_operations table exists" \
    "SELECT COUNT(*)::text FROM information_schema.tables WHERE table_name = 'sensitive_operations'" \
    "1"

run_check \
    "Audit triggers installed" \
    "SELECT COUNT(*)::text FROM pg_trigger WHERE tgname LIKE 'audit_%'" \
    "9" \
    "ge"

run_check \
    "log_audit_event() exists" \
    "SELECT COUNT(*)::text FROM pg_proc WHERE proname = 'log_audit_event'" \
    "1"

run_check \
    "Audit views created" \
    "SELECT COUNT(*)::text FROM information_schema.views WHERE table_name LIKE 'v_%audit%' OR table_name LIKE 'v_%operations%'" \
    "2" \
    "ge"

# ============================================================================
# CHECK 5: FUNCTIONAL TESTS
# ============================================================================

print_header "CHECK 5: FUNCTIONAL TESTS"

# Test: Can query tables
run_check \
    "Can query users table" \
    "SELECT CASE WHEN COUNT(*) >= 0 THEN 'true' ELSE 'false' END FROM users" \
    "true"

run_check \
    "Can query kuis table" \
    "SELECT CASE WHEN COUNT(*) >= 0 THEN 'true' ELSE 'false' END FROM kuis" \
    "true"

run_check \
    "Can query nilai table" \
    "SELECT CASE WHEN COUNT(*) >= 0 THEN 'true' ELSE 'false' END FROM nilai" \
    "true"

# Test: Helper functions work
run_check \
    "get_user_role() callable" \
    "SELECT CASE WHEN get_user_role() IS NULL OR get_user_role() IS NOT NULL THEN 'true' ELSE 'false' END" \
    "true"

# ============================================================================
# SUMMARY
# ============================================================================

print_header "VERIFICATION SUMMARY"

echo -e "Total Checks:  ${BLUE}$TOTAL_CHECKS${NC}"
echo -e "Passed:        ${GREEN}$PASSED_CHECKS${NC}"
echo -e "Failed:        ${RED}$FAILED_CHECKS${NC}"
echo ""

PASS_RATE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
echo -e "Pass Rate:     ${BLUE}$PASS_RATE%${NC}"
echo ""

if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║          ALL CHECKS PASSED! ✅                         ║${NC}"
    echo -e "${GREEN}║   Week 3 deployment verified successfully             ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║          VERIFICATION FAILED! ❌                       ║${NC}"
    echo -e "${RED}║   $FAILED_CHECKS check(s) failed                                    ║${NC}"
    echo -e "${RED}║   Please review and fix issues                         ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════╝${NC}"
    exit 1
fi
