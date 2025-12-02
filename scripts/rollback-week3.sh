#!/bin/bash
# ============================================================================
# ROLLBACK SCRIPT - WEEK 3 DATABASE ENHANCEMENT
# ============================================================================
# Description: Safe rollback untuk RLS policies dan Audit system
# Author: System Praktikum PWA Team
# Date: 2025-11-28
# Usage: ./rollback-week3.sh [environment] [backup_file]
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ============================================================================
# CONFIGURATION
# ============================================================================

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
BACKUP_DIR="$PROJECT_ROOT/backups"
LOG_FILE="$BACKUP_DIR/rollback_$(date +%Y%m%d_%H%M%S).log"

ENVIRONMENT="${1:-local}"
BACKUP_FILE="${2:-}"

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
    echo -e "${RED}============================================================${NC}"
    echo -e "${RED}$1${NC}"
    echo -e "${RED}============================================================${NC}"
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

get_db_connection() {
    case "$ENVIRONMENT" in
        local)
            DB_HOST="localhost"
            DB_PORT="54322"
            DB_USER="postgres"
            DB_NAME="postgres"
            DB_URL="postgresql://$DB_USER:postgres@$DB_HOST:$DB_PORT/$DB_NAME"
            ;;
        staging|production)
            error "Please configure database URL for $ENVIRONMENT"
            exit 1
            ;;
        *)
            error "Unknown environment: $ENVIRONMENT"
            exit 1
            ;;
    esac
}

find_latest_backup() {
    if [ -f "$BACKUP_DIR/latest_backup.txt" ]; then
        BACKUP_FILE=$(cat "$BACKUP_DIR/latest_backup.txt")
        if [ -f "$BACKUP_FILE" ]; then
            log "Found latest backup: $BACKUP_FILE"
            return 0
        fi
    fi

    # Try to find most recent backup
    local latest=$(ls -t "$BACKUP_DIR"/${ENVIRONMENT}_pre_week3_*.sql 2>/dev/null | head -1)
    if [ -n "$latest" ]; then
        BACKUP_FILE="$latest"
        log "Found backup: $BACKUP_FILE"
        return 0
    fi

    error "No backup file found!"
    error "Please specify backup file: ./rollback-week3.sh $ENVIRONMENT /path/to/backup.sql"
    exit 1
}

disable_rls() {
    print_header "DISABLING RLS (QUICK FIX)"

    warning "This will temporarily disable RLS on all tables"
    warning "Use this only for emergency access restoration"

    if ! confirm "Disable RLS on all tables?"; then
        return 1
    fi

    log "Disabling RLS..."

    local tables=(
        "users" "kuis" "attempt_kuis" "nilai" "kelas"
        "kelas_mahasiswa" "peminjaman" "inventaris" "laboratorium"
        "mata_kuliah" "jadwal_praktikum" "materi"
        "mahasiswa" "dosen" "laboran"
    )

    for table in "${tables[@]}"; do
        if psql "$DB_URL" -c "ALTER TABLE $table DISABLE ROW LEVEL SECURITY;" >> "$LOG_FILE" 2>&1; then
            success "RLS disabled on: $table"
        else
            warning "Could not disable RLS on: $table (may not exist)"
        fi
    done

    success "RLS disabled on all tables"
    warning "Remember to re-enable RLS after fixing issues!"
    echo ""
}

drop_policies() {
    print_header "DROPPING RLS POLICIES"

    log "Dropping all RLS policies..."

    psql "$DB_URL" >> "$LOG_FILE" 2>&1 << 'EOF'
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I CASCADE',
            r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;
EOF

    success "All RLS policies dropped"
    echo ""
}

drop_triggers() {
    print_header "DROPPING AUDIT TRIGGERS"

    log "Dropping audit triggers..."

    psql "$DB_URL" >> "$LOG_FILE" 2>&1 << 'EOF'
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT tgname, tgrelid::regclass AS table_name
        FROM pg_trigger
        WHERE tgname LIKE 'audit_%'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I CASCADE',
            r.tgname, r.table_name);
    END LOOP;
END $$;
EOF

    success "Audit triggers dropped"
    echo ""
}

drop_functions() {
    print_header "DROPPING HELPER FUNCTIONS"

    log "Dropping RLS helper functions..."

    local functions=(
        "get_user_role()"
        "is_admin()"
        "is_dosen()"
        "is_laboran()"
        "is_mahasiswa()"
        "get_current_mahasiswa_id()"
        "get_current_dosen_id()"
        "get_current_laboran_id()"
        "mahasiswa_in_kelas(UUID)"
        "dosen_teaches_kelas(UUID)"
        "dosen_teaches_mahasiswa(UUID)"
        "get_mahasiswa_kelas_ids()"
        "get_dosen_kelas_ids()"
        "log_audit_event"
        "log_sensitive_operation"
        "audit_trigger_function()"
        "get_resource_audit_trail"
        "get_failed_logins"
        "review_sensitive_operation"
        "archive_old_audit_logs()"
    )

    for func in "${functions[@]}"; do
        if psql "$DB_URL" -c "DROP FUNCTION IF EXISTS $func CASCADE;" >> "$LOG_FILE" 2>&1; then
            log "Dropped: $func"
        fi
    done

    success "Helper functions dropped"
    echo ""
}

drop_audit_tables() {
    print_header "DROPPING AUDIT TABLES"

    warning "This will delete all audit logs!"

    if ! confirm "Drop audit tables? (This will delete all audit history)"; then
        warning "Keeping audit tables"
        return 0
    fi

    log "Dropping audit tables..."

    psql "$DB_URL" >> "$LOG_FILE" 2>&1 << 'EOF'
DROP TABLE IF EXISTS sensitive_operations CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS audit_logs_archive CASCADE;
DROP VIEW IF EXISTS v_recent_audit_activity CASCADE;
DROP VIEW IF EXISTS v_failed_operations CASCADE;
DROP VIEW IF EXISTS v_pending_sensitive_reviews CASCADE;
DROP VIEW IF EXISTS v_user_activity_summary CASCADE;
EOF

    success "Audit tables dropped"
    echo ""
}

full_restore() {
    print_header "FULL DATABASE RESTORE"

    error "⚠️  WARNING: DESTRUCTIVE OPERATION!"
    error "This will restore the entire database from backup"
    error "ALL changes since backup will be LOST!"
    echo ""

    if [ ! -f "$BACKUP_FILE" ]; then
        error "Backup file not found: $BACKUP_FILE"
        exit 1
    fi

    local backup_size=$(du -h "$BACKUP_FILE" | cut -f1)
    log "Backup file: $BACKUP_FILE ($backup_size)"
    echo ""

    if ! confirm "RESTORE database from backup? This cannot be undone!"; then
        log "Full restore cancelled"
        return 1
    fi

    log "Creating safety backup before restore..."
    local safety_backup="$BACKUP_DIR/pre_rollback_$(date +%Y%m%d_%H%M%S).sql"
    pg_dump "$DB_URL" > "$safety_backup" 2>> "$LOG_FILE"
    success "Safety backup created: $safety_backup"

    log "Restoring database..."
    if psql "$DB_URL" < "$BACKUP_FILE" >> "$LOG_FILE" 2>&1; then
        success "Database restored successfully!"
    else
        error "Restore failed! Check log: $LOG_FILE"
        error "Emergency: Database may be in inconsistent state!"
        exit 1
    fi

    echo ""
}

verify_rollback() {
    print_header "VERIFYING ROLLBACK"

    log "Checking database state..."

    # Check policy count
    local policy_count=$(psql "$DB_URL" -t -c "
        SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';
    " 2>> "$LOG_FILE")
    log "Policies remaining: $policy_count"

    # Check helper functions
    local function_count=$(psql "$DB_URL" -t -c "
        SELECT COUNT(*) FROM pg_proc
        WHERE proname LIKE 'get_%' OR proname LIKE 'is_%';
    " 2>> "$LOG_FILE")
    log "Helper functions remaining: $function_count"

    # Check audit tables
    local audit_tables=$(psql "$DB_URL" -t -c "
        SELECT COUNT(*) FROM information_schema.tables
        WHERE table_name IN ('audit_logs', 'sensitive_operations');
    " 2>> "$LOG_FILE")
    log "Audit tables remaining: $audit_tables"

    # Check RLS status
    local rls_enabled=$(psql "$DB_URL" -t -c "
        SELECT COUNT(*) FROM pg_tables
        WHERE schemaname = 'public' AND rowsecurity = TRUE;
    " 2>> "$LOG_FILE")
    log "Tables with RLS enabled: $rls_enabled"

    echo ""
}

# ============================================================================
# ROLLBACK OPTIONS
# ============================================================================

rollback_menu() {
    clear
    print_header "WEEK 3 ROLLBACK OPTIONS"

    echo "Choose rollback strategy:"
    echo ""
    echo "1. Quick Fix - Disable RLS only (non-destructive, temporary)"
    echo "2. Partial Rollback - Remove policies and functions (keep data)"
    echo "3. Full Rollback - Restore from backup (destructive)"
    echo "4. Custom - Choose what to remove"
    echo "5. Cancel"
    echo ""

    read -p "Enter choice (1-5): " choice

    case $choice in
        1)
            log "User selected: Quick Fix (Disable RLS)"
            disable_rls
            ;;
        2)
            log "User selected: Partial Rollback"
            disable_rls
            drop_policies
            drop_triggers
            drop_functions
            drop_audit_tables
            verify_rollback
            ;;
        3)
            log "User selected: Full Rollback"
            find_latest_backup
            full_restore
            verify_rollback
            ;;
        4)
            log "User selected: Custom"
            custom_rollback
            ;;
        5)
            log "Rollback cancelled by user"
            exit 0
            ;;
        *)
            error "Invalid choice"
            exit 1
            ;;
    esac
}

custom_rollback() {
    print_header "CUSTOM ROLLBACK"

    if confirm "Disable RLS?"; then
        disable_rls
    fi

    if confirm "Drop RLS policies?"; then
        drop_policies
    fi

    if confirm "Drop audit triggers?"; then
        drop_triggers
    fi

    if confirm "Drop helper functions?"; then
        drop_functions
    fi

    if confirm "Drop audit tables?"; then
        drop_audit_tables
    fi

    verify_rollback
}

print_summary() {
    print_header "ROLLBACK SUMMARY"

    success "Rollback completed!"
    log "Log file: $LOG_FILE"
    echo ""

    warning "NEXT STEPS:"
    echo "1. Test application access"
    echo "2. Check for errors in logs"
    echo "3. If issues persist, contact support"
    echo "4. To re-deploy: ./scripts/deploy-week3.sh"
    echo ""
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
    echo ""
    warning "╔════════════════════════════════════════════════════════╗"
    warning "║              ROLLBACK SCRIPT - WEEK 3                  ║"
    warning "║                                                        ║"
    warning "║  This script will undo Week 3 database changes        ║"
    warning "╚════════════════════════════════════════════════════════╝"
    echo ""

    log "Environment: $ENVIRONMENT"
    log "Log file: $LOG_FILE"
    echo ""

    if ! confirm "Continue with rollback?"; then
        log "Rollback cancelled by user"
        exit 0
    fi

    get_db_connection
    rollback_menu
    print_summary
}

# Run main
main "$@"
