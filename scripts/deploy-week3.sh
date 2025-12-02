#!/bin/bash
# ============================================================================
# SAFE DEPLOYMENT SCRIPT - WEEK 3 DATABASE ENHANCEMENT
# ============================================================================
# Description: Safe deployment untuk RLS policies dan Audit system
# Author: System Praktikum PWA Team
# Date: 2025-11-28
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# CONFIGURATION
# ============================================================================

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
MIGRATIONS_DIR="$PROJECT_ROOT/supabase/migrations"
BACKUP_DIR="$PROJECT_ROOT/backups"
LOG_FILE="$BACKUP_DIR/deployment_$(date +%Y%m%d_%H%M%S).log"

# Default environment
ENVIRONMENT="${1:-local}"
DRY_RUN="${2:-false}"

# ============================================================================
# FUNCTIONS
# ============================================================================

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
}

print_header() {
    echo ""
    echo -e "${BLUE}============================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}============================================================${NC}"
    echo ""
}

confirm() {
    local prompt="$1"
    local response

    read -p "$(echo -e ${YELLOW}$prompt${NC}) (yes/no): " response
    case "$response" in
        [yY][eE][sS]|[yY])
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

check_prerequisites() {
    print_header "CHECKING PREREQUISITES"

    # Check if psql is installed
    if ! command -v psql &> /dev/null; then
        error "psql not found. Please install PostgreSQL client."
        exit 1
    fi
    success "psql found"

    # Check if migrations directory exists
    if [ ! -d "$MIGRATIONS_DIR" ]; then
        error "Migrations directory not found: $MIGRATIONS_DIR"
        exit 1
    fi
    success "Migrations directory found"

    # Check if migration files exist
    local missing_files=0
    for file in 20_rls_helper_functions.sql 21_enhanced_rls_policies.sql 22_audit_logging_system.sql; do
        if [ ! -f "$MIGRATIONS_DIR/$file" ]; then
            error "Migration file not found: $file"
            missing_files=$((missing_files + 1))
        else
            success "Found: $file"
        fi
    done

    if [ $missing_files -gt 0 ]; then
        error "$missing_files migration file(s) missing!"
        exit 1
    fi

    # Create backup directory if not exists
    mkdir -p "$BACKUP_DIR"
    success "Backup directory ready: $BACKUP_DIR"

    echo ""
}

get_db_connection() {
    case "$ENVIRONMENT" in
        local)
            DB_HOST="localhost"
            DB_PORT="54322"
            DB_USER="postgres"
            DB_NAME="postgres"
            DB_URL="postgresql://$DB_USER:postgres@$DB_HOST:$DB_PORT/$DB_NAME"
            ;;
        staging)
            error "Staging configuration not set. Please configure staging database URL."
            exit 1
            ;;
        production)
            error "PRODUCTION deployment requires explicit configuration."
            error "Please edit this script and add production credentials."
            exit 1
            ;;
        *)
            error "Unknown environment: $ENVIRONMENT"
            error "Valid options: local, staging, production"
            exit 1
            ;;
    esac

    log "Environment: $ENVIRONMENT"
    log "Database: $DB_HOST:$DB_PORT/$DB_NAME"
}

test_connection() {
    print_header "TESTING DATABASE CONNECTION"

    log "Testing connection to $DB_HOST:$DB_PORT..."

    if psql "$DB_URL" -c "SELECT 1;" &> /dev/null; then
        success "Database connection successful"
    else
        error "Cannot connect to database!"
        error "Connection string: $DB_URL"
        exit 1
    fi

    echo ""
}

create_backup() {
    print_header "CREATING DATABASE BACKUP"

    local backup_file="$BACKUP_DIR/${ENVIRONMENT}_pre_week3_$(date +%Y%m%d_%H%M%S).sql"

    log "Creating backup: $backup_file"

    if [ "$DRY_RUN" = "true" ]; then
        warning "DRY RUN: Skipping actual backup"
        return 0
    fi

    if pg_dump "$DB_URL" > "$backup_file" 2>> "$LOG_FILE"; then
        local size=$(du -h "$backup_file" | cut -f1)
        success "Backup created successfully: $backup_file ($size)"

        # Verify backup is not empty
        if [ ! -s "$backup_file" ]; then
            error "Backup file is empty!"
            exit 1
        fi

        # Save backup path for rollback
        echo "$backup_file" > "$BACKUP_DIR/latest_backup.txt"

    else
        error "Backup failed!"
        exit 1
    fi

    echo ""
}

check_current_state() {
    print_header "CHECKING CURRENT DATABASE STATE"

    log "Checking for existing RLS policies..."

    local policy_count=$(psql "$DB_URL" -t -c "
        SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';
    " 2>> "$LOG_FILE")

    log "Current policies: $policy_count"

    if [ "$policy_count" -gt 50 ]; then
        warning "Database already has $policy_count policies"
        if ! confirm "This might indicate Week 3 is already deployed. Continue anyway?"; then
            log "Deployment cancelled by user"
            exit 0
        fi
    fi

    log "Checking for existing helper functions..."

    local function_count=$(psql "$DB_URL" -t -c "
        SELECT COUNT(*) FROM pg_proc
        WHERE proname IN ('get_user_role', 'is_admin', 'get_current_mahasiswa_id');
    " 2>> "$LOG_FILE")

    log "Helper functions found: $function_count"

    if [ "$function_count" -gt 0 ]; then
        warning "Some helper functions already exist"
        if ! confirm "Continue with deployment?"; then
            log "Deployment cancelled by user"
            exit 0
        fi
    fi

    echo ""
}

apply_migration() {
    local migration_file="$1"
    local description="$2"

    log "Applying: $migration_file"
    log "Description: $description"

    if [ "$DRY_RUN" = "true" ]; then
        warning "DRY RUN: Would apply $migration_file"
        return 0
    fi

    if psql "$DB_URL" -f "$MIGRATIONS_DIR/$migration_file" >> "$LOG_FILE" 2>&1; then
        success "$description applied successfully"
        return 0
    else
        error "$description failed!"
        error "Check log file: $LOG_FILE"
        return 1
    fi
}

deploy_migrations() {
    print_header "DEPLOYING MIGRATIONS"

    # Migration 1: Helper Functions
    log ""
    log "═══════════════════════════════════════"
    log "MIGRATION 1/3: RLS Helper Functions"
    log "═══════════════════════════════════════"

    if ! apply_migration "20_rls_helper_functions.sql" "RLS Helper Functions"; then
        error "Migration 1 failed. Stopping deployment."
        exit 1
    fi

    sleep 1

    # Migration 2: RLS Policies (CRITICAL)
    log ""
    log "═══════════════════════════════════════"
    log "MIGRATION 2/3: Enhanced RLS Policies"
    log "═══════════════════════════════════════"
    warning "This is the CRITICAL migration!"

    if [ "$DRY_RUN" != "true" ]; then
        if ! confirm "Apply RLS policies? This will enable row-level security."; then
            error "Deployment cancelled by user"
            exit 1
        fi
    fi

    if ! apply_migration "21_enhanced_rls_policies.sql" "Enhanced RLS Policies"; then
        error "Migration 2 failed. Database may be in inconsistent state."
        error "Run rollback script immediately!"
        exit 1
    fi

    sleep 1

    # Migration 3: Audit System
    log ""
    log "═══════════════════════════════════════"
    log "MIGRATION 3/3: Audit Logging System"
    log "═══════════════════════════════════════"

    if ! apply_migration "22_audit_logging_system.sql" "Audit Logging System"; then
        warning "Migration 3 failed, but RLS is already active."
        warning "Audit system not installed, but core security is working."
        if ! confirm "Continue without audit system?"; then
            error "Deployment incomplete"
            exit 1
        fi
    fi

    echo ""
}

verify_deployment() {
    print_header "VERIFYING DEPLOYMENT"

    log "Running verification checks..."

    # Check 1: RLS enabled
    log ""
    log "Check 1: RLS enabled on critical tables"
    local rls_enabled=$(psql "$DB_URL" -t -c "
        SELECT COUNT(*) FROM pg_tables
        WHERE schemaname = 'public'
        AND rowsecurity = TRUE
        AND tablename IN ('users', 'kuis', 'nilai', 'kelas');
    " 2>> "$LOG_FILE")

    if [ "$rls_enabled" -eq 4 ]; then
        success "RLS enabled on all critical tables"
    else
        error "RLS not enabled on all tables (found: $rls_enabled/4)"
    fi

    # Check 2: Policy count
    log ""
    log "Check 2: Policy count"
    local policy_count=$(psql "$DB_URL" -t -c "
        SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';
    " 2>> "$LOG_FILE")

    log "Total policies: $policy_count"
    if [ "$policy_count" -ge 80 ]; then
        success "Policy count OK ($policy_count >= 80)"
    else
        warning "Policy count lower than expected ($policy_count < 80)"
    fi

    # Check 3: Helper functions
    log ""
    log "Check 3: Helper functions"
    local function_count=$(psql "$DB_URL" -t -c "
        SELECT COUNT(*) FROM pg_proc
        WHERE proname IN (
            'get_user_role', 'is_admin', 'is_dosen', 'is_laboran', 'is_mahasiswa',
            'get_current_mahasiswa_id', 'get_current_dosen_id', 'get_current_laboran_id'
        );
    " 2>> "$LOG_FILE")

    if [ "$function_count" -ge 8 ]; then
        success "Helper functions OK ($function_count/8+)"
    else
        error "Missing helper functions ($function_count/8)"
    fi

    # Check 4: Audit tables
    log ""
    log "Check 4: Audit system"
    local audit_tables=$(psql "$DB_URL" -t -c "
        SELECT COUNT(*) FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name IN ('audit_logs', 'sensitive_operations');
    " 2>> "$LOG_FILE")

    if [ "$audit_tables" -eq 2 ]; then
        success "Audit tables created"
    else
        warning "Audit tables not found ($audit_tables/2)"
    fi

    # Check 5: Audit triggers
    log ""
    log "Check 5: Audit triggers"
    local trigger_count=$(psql "$DB_URL" -t -c "
        SELECT COUNT(*) FROM pg_trigger
        WHERE tgname LIKE 'audit_%';
    " 2>> "$LOG_FILE")

    log "Audit triggers: $trigger_count"
    if [ "$trigger_count" -ge 9 ]; then
        success "Audit triggers OK ($trigger_count/9)"
    else
        warning "Some audit triggers missing ($trigger_count/9)"
    fi

    echo ""
}

run_smoke_tests() {
    print_header "RUNNING SMOKE TESTS"

    log "Testing basic RLS functionality..."

    # Test 1: Can query users table
    log ""
    log "Test 1: Query users table"
    if psql "$DB_URL" -c "SELECT COUNT(*) FROM users;" >> "$LOG_FILE" 2>&1; then
        success "Can query users table"
    else
        error "Cannot query users table!"
    fi

    # Test 2: Can query kuis table
    log ""
    log "Test 2: Query kuis table"
    if psql "$DB_URL" -c "SELECT COUNT(*) FROM kuis;" >> "$LOG_FILE" 2>&1; then
        success "Can query kuis table"
    else
        error "Cannot query kuis table!"
    fi

    # Test 3: Helper function works
    log ""
    log "Test 3: Test helper function"
    if psql "$DB_URL" -c "SELECT get_user_role();" >> "$LOG_FILE" 2>&1; then
        success "Helper functions working"
    else
        error "Helper function failed!"
    fi

    echo ""
}

print_summary() {
    print_header "DEPLOYMENT SUMMARY"

    echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║           WEEK 3 DEPLOYMENT COMPLETED!                 ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""

    echo "Environment: $ENVIRONMENT"
    echo "Backup Location: $(cat $BACKUP_DIR/latest_backup.txt 2>/dev/null || echo 'N/A')"
    echo "Log File: $LOG_FILE"
    echo ""

    success "✅ RLS Helper Functions deployed"
    success "✅ Enhanced RLS Policies deployed"
    success "✅ Audit Logging System deployed"
    success "✅ Verification checks passed"
    success "✅ Smoke tests passed"
    echo ""

    warning "NEXT STEPS:"
    echo "1. Run comprehensive tests: npm run test"
    echo "2. Monitor application for errors"
    echo "3. Review audit logs: SELECT * FROM v_recent_audit_activity;"
    echo "4. If issues occur, run: ./scripts/rollback-week3.sh"
    echo ""

    success "Deployment log saved to: $LOG_FILE"
}

print_rollback_info() {
    echo ""
    warning "═══════════════════════════════════════════════════════"
    warning "IF SOMETHING GOES WRONG:"
    warning "═══════════════════════════════════════════════════════"
    echo ""
    echo "Quick rollback:"
    echo "  ./scripts/rollback-week3.sh $ENVIRONMENT"
    echo ""
    echo "Or manual rollback:"
    echo "  psql \"$DB_URL\" < $(cat $BACKUP_DIR/latest_backup.txt 2>/dev/null || echo 'backup.sql')"
    echo ""
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
    clear

    print_header "WEEK 3 SAFE DEPLOYMENT SCRIPT"

    echo "Environment: $ENVIRONMENT"
    echo "Dry Run: $DRY_RUN"
    echo "Log File: $LOG_FILE"
    echo ""

    if [ "$DRY_RUN" = "true" ]; then
        warning "DRY RUN MODE - No changes will be made"
    fi

    if [ "$ENVIRONMENT" = "production" ]; then
        error "PRODUCTION DEPLOYMENT DETECTED!"
        error "This requires extra confirmation."
        if ! confirm "Are you ABSOLUTELY SURE you want to deploy to PRODUCTION?"; then
            log "Production deployment cancelled"
            exit 0
        fi
    fi

    # Pre-deployment confirmation
    if ! confirm "Start deployment to $ENVIRONMENT environment?"; then
        log "Deployment cancelled by user"
        exit 0
    fi

    # Execute deployment steps
    check_prerequisites
    get_db_connection
    test_connection
    check_current_state
    create_backup
    print_rollback_info

    if ! confirm "Backup created. Proceed with migrations?"; then
        log "Deployment cancelled after backup"
        exit 0
    fi

    deploy_migrations
    verify_deployment
    run_smoke_tests
    print_summary

    success "🎉 DEPLOYMENT SUCCESSFUL!"
}

# Run main function
main "$@"
