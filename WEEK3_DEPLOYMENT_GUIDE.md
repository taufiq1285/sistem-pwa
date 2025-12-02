# Week 3 Deployment Guide
**Database Enhancement - RLS & Audit System Deployment**

**System:** Sistem Praktikum PWA
**Date:** 2025-11-28
**Week:** 3 (Database Enhancement)
**Status:** Ready for Deployment 🚀

---

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Migration Files](#migration-files)
4. [Deployment Steps](#deployment-steps)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Rollback Plan](#rollback-plan)
7. [Monitoring](#monitoring)

---

## ✅ Pre-Deployment Checklist

### Code & Documentation Review

- [ ] All migration files reviewed and tested
- [ ] RLS_TESTING_GUIDE.md tests executed successfully
- [ ] No open critical bugs
- [ ] Code backup created
- [ ] Database backup created
- [ ] Rollback plan documented
- [ ] Team notified of deployment

### Migration Files Ready

- [ ] `20_rls_helper_functions.sql` - Helper functions for RLS
- [ ] `21_enhanced_rls_policies.sql` - Role-based RLS policies
- [ ] `22_audit_logging_system.sql` - Audit trail system

### Environment Verification

- [ ] Supabase CLI installed (`supabase --version`)
- [ ] Database connection tested
- [ ] Service role key available
- [ ] Staging environment available
- [ ] Production environment ready

---

## 🛠 Environment Setup

### Local Development

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link project
supabase link --project-ref <your-project-ref>

# Verify connection
supabase db remote commit
```

### Environment Variables

Create `.env.deployment` file:

```bash
# Database URLs
LOCAL_DB_URL="postgresql://postgres:postgres@localhost:54322/postgres"
STAGING_DB_URL="postgresql://postgres:[password]@db.[staging-ref].supabase.co:5432/postgres"
PRODUCTION_DB_URL="postgresql://postgres:[password]@db.[prod-ref].supabase.co:5432/postgres"

# Service Role Keys
LOCAL_SERVICE_ROLE_KEY="eyJ..."
STAGING_SERVICE_ROLE_KEY="eyJ..."
PRODUCTION_SERVICE_ROLE_KEY="eyJ..."

# Deployment Settings
BACKUP_ENABLED=true
ROLLBACK_ENABLED=true
DRY_RUN=false
```

---

## 📦 Migration Files

### File 1: RLS Helper Functions
**File:** `supabase/migrations/20_rls_helper_functions.sql`

**Purpose:** Install helper functions untuk RLS policies

**Key Functions:**
- `get_user_role()` - Get current user's role
- `is_admin()`, `is_dosen()`, `is_laboran()`, `is_mahasiswa()` - Role checkers
- `get_current_mahasiswa_id()`, `get_current_dosen_id()`, `get_current_laboran_id()` - ID getters
- `mahasiswa_in_kelas()`, `dosen_teaches_kelas()`, `dosen_teaches_mahasiswa()` - Ownership validators
- `get_mahasiswa_kelas_ids()`, `get_dosen_kelas_ids()` - Kelas array getters

**Estimated Time:** 5 minutes
**Rollback:** Safe (functions only, no data changes)

---

### File 2: Enhanced RLS Policies
**File:** `supabase/migrations/21_enhanced_rls_policies.sql`

**Purpose:** Implement role-based access control at database level

**Tables Protected:**
1. `users` - Privacy-protected user access
2. `kuis` - Dosen own kuis, Mahasiswa published only
3. `attempt_kuis` - Mahasiswa own attempts, Dosen grading
4. `nilai` - Privacy-protected grades
5. `kelas` - Role-based class access
6. `kelas_mahasiswa` - Enrollment management
7. `peminjaman` - Laboran approval workflow
8. `inventaris` - Public view, Laboran/Admin manage
9. `laboratorium` - Public view, Laboran/Admin manage
10. `mata_kuliah` - Public view, Admin/Dosen manage
11. `jadwal_praktikum` - Public view, Admin/Dosen/Laboran manage
12. `materi` - Dosen own, Mahasiswa view for their kelas
13. `mahasiswa`, `dosen`, `laboran` - Profile access control

**Total Policies:** 80+

**Estimated Time:** 10-15 minutes
**Rollback:** Critical (reverses all RLS policies)

---

### File 3: Audit Logging System
**File:** `supabase/migrations/22_audit_logging_system.sql`

**Purpose:** Comprehensive audit trail for security and compliance

**Components:**
- `audit_logs` table - Main audit trail
- `sensitive_operations` table - High-value operation tracking
- Automatic triggers on 9 critical tables
- 4 analysis views for monitoring
- Helper functions for querying
- RLS protection (admin-only access)
- Archiving system for retention

**Estimated Time:** 10 minutes
**Rollback:** Safe (audit only, no impact on app functionality)

---

## 🚀 Deployment Steps

### Step 1: Local Testing (DEV)

```bash
# 1. Reset local database
supabase db reset

# 2. Apply migrations locally
supabase db push

# 3. Run RLS tests
psql $LOCAL_DB_URL -f tests/rls_tests.sql

# 4. Verify all tests pass
# Check RLS_TESTING_GUIDE.md for test scenarios

# 5. Check logs
supabase logs db --limit 100
```

**Expected Result:** All tests pass, no errors in logs

---

### Step 2: Staging Deployment

```bash
# ============================================================================
# STAGING DEPLOYMENT
# ============================================================================

# 1. Create backup
supabase db dump --db-url $STAGING_DB_URL > backups/staging_pre_week3_$(date +%Y%m%d_%H%M%S).sql

# 2. Verify backup
ls -lh backups/staging_pre_week3_*.sql

# 3. Apply migrations to staging
supabase db push --db-url $STAGING_DB_URL

# 4. Verify migrations applied
psql $STAGING_DB_URL -c "
SELECT migration_name, executed_at
FROM supabase_migrations.schema_migrations
WHERE migration_name LIKE '%rls%' OR migration_name LIKE '%audit%'
ORDER BY executed_at DESC;
"

# Expected output:
# 22_audit_logging_system     | 2025-11-28 ...
# 21_enhanced_rls_policies     | 2025-11-28 ...
# 20_rls_helper_functions      | 2025-11-28 ...

# 5. Run RLS verification tests
psql $STAGING_DB_URL -c "
SELECT
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
    'users', 'kuis', 'attempt_kuis', 'nilai', 'kelas'
)
ORDER BY tablename;
"

# Expected: All rls_enabled = TRUE

# 6. Run smoke tests
npm run test:staging

# 7. Monitor for 24 hours
# Check audit logs, performance, errors

# 8. If issues found:
# a. Check logs: supabase logs db --db-url $STAGING_DB_URL
# b. Run diagnostics (see Troubleshooting section)
# c. Rollback if critical (see Rollback Plan)
```

**Success Criteria:**
- [ ] All migrations applied successfully
- [ ] RLS enabled on all tables
- [ ] No application errors
- [ ] Performance acceptable
- [ ] Audit logs capturing events

---

### Step 3: Production Deployment

**⚠️ CAUTION: Production deployment requires maintenance window**

#### Pre-Production

```bash
# 1. Schedule maintenance window (recommend 2-hour window)
# 2. Notify users via pengumuman system
# 3. Put app in maintenance mode (optional)
```

#### Production Deployment

```bash
# ============================================================================
# PRODUCTION DEPLOYMENT
# ============================================================================

# 1. Create production backup
echo "Creating production backup..."
supabase db dump --db-url $PRODUCTION_DB_URL > backups/production_pre_week3_$(date +%Y%m%d_%H%M%S).sql

# 2. Verify backup integrity
ls -lh backups/production_pre_week3_*.sql
echo "Backup size should be > 1MB for realistic data"

# 3. Enable maintenance mode (optional)
# Update pengumuman or use feature flag

# 4. Apply migrations
echo "Applying RLS helper functions..."
psql $PRODUCTION_DB_URL -f supabase/migrations/20_rls_helper_functions.sql

echo "Applying enhanced RLS policies..."
psql $PRODUCTION_DB_URL -f supabase/migrations/21_enhanced_rls_policies.sql

echo "Applying audit logging system..."
psql $PRODUCTION_DB_URL -f supabase/migrations/22_audit_logging_system.sql

# 5. Verify migrations
psql $PRODUCTION_DB_URL -c "
SELECT migration_name, executed_at
FROM supabase_migrations.schema_migrations
WHERE migration_name LIKE '%rls%' OR migration_name LIKE '%audit%'
ORDER BY executed_at DESC;
"

# 6. Verify RLS enabled
psql $PRODUCTION_DB_URL -c "
SELECT
    tablename,
    COUNT(*) AS policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY policy_count DESC;
"

# Expected: 80+ total policies

# 7. Test critical flows
npm run test:production:smoke

# 8. Disable maintenance mode

# 9. Monitor closely for 1 hour
# Check:
# - Application errors
# - Slow queries
# - Failed requests
# - Audit logs
```

**Success Criteria:**
- [ ] All migrations completed
- [ ] No application errors
- [ ] Performance normal (< 10% degradation)
- [ ] Users can login and access appropriate data
- [ ] Audit logs capturing events
- [ ] No RLS violations in logs

---

## ✅ Post-Deployment Verification

### Immediate Checks (First Hour)

```sql
-- ============================================================================
-- POST-DEPLOYMENT VERIFICATION QUERIES
-- ============================================================================

-- 1. Check RLS is enabled
SELECT
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
    'users', 'kuis', 'attempt_kuis', 'nilai', 'kelas',
    'kelas_mahasiswa', 'peminjaman', 'inventaris'
)
ORDER BY tablename;
-- Expected: All TRUE

-- 2. Count policies
SELECT COUNT(*) AS total_policies FROM pg_policies WHERE schemaname = 'public';
-- Expected: 80+

-- 3. Verify helper functions exist
SELECT proname FROM pg_proc WHERE proname LIKE 'get_%' OR proname LIKE 'is_%';
-- Expected: 13 functions

-- 4. Check audit logs are being created
SELECT
    COUNT(*) AS log_count,
    MAX(created_at) AS latest_log
FROM audit_logs
WHERE created_at > NOW() - INTERVAL '1 hour';
-- Expected: log_count > 0, latest_log recent

-- 5. Check for errors in recent audit logs
SELECT
    user_role,
    action,
    resource_type,
    error_message,
    COUNT(*) AS error_count
FROM audit_logs
WHERE success = FALSE
AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY user_role, action, resource_type, error_message
ORDER BY error_count DESC;
-- Expected: Ideally 0 errors, investigate any that appear

-- 6. Performance check
EXPLAIN ANALYZE SELECT * FROM kuis LIMIT 10;
-- Check execution time < 50ms

-- 7. Check for RLS violations
SELECT * FROM v_failed_operations
WHERE created_at > NOW() - INTERVAL '1 hour'
LIMIT 20;
-- Investigate any access denied errors
```

### Functional Testing

```bash
# Test as different roles
# 1. Admin login and access
# 2. Dosen login and kuis access
# 3. Mahasiswa login and kuis attempt
# 4. Laboran login and peminjaman approval

# Run automated tests
npm run test:integration
```

### Performance Monitoring

```sql
-- Query performance stats
SELECT
    queryid,
    query,
    calls,
    mean_exec_time,
    max_exec_time
FROM pg_stat_statements
WHERE query LIKE '%kuis%' OR query LIKE '%nilai%'
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check for slow queries (> 100ms)
-- Investigate and optimize if needed
```

---

## ⏮ Rollback Plan

### When to Rollback

**Critical Issues:**
- Data access completely broken
- Performance degradation > 50%
- Critical functionality not working
- Security vulnerability detected

**Non-Critical (Monitor & Fix):**
- Performance degradation < 20%
- Minor permission issues
- Non-critical feature broken

### Rollback Steps

```bash
# ============================================================================
# ROLLBACK PROCEDURE
# ============================================================================

# 1. Assess severity
# If critical, proceed with rollback
# If non-critical, fix forward instead

# 2. Disable RLS (TEMPORARY - allows access while fixing)
psql $PRODUCTION_DB_URL << 'EOF'
-- Disable RLS on critical tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE kuis DISABLE ROW LEVEL SECURITY;
ALTER TABLE attempt_kuis DISABLE ROW LEVEL SECURITY;
ALTER TABLE nilai DISABLE ROW LEVEL SECURITY;
-- Add others as needed
EOF

# 3. Restore from backup (if needed)
psql $PRODUCTION_DB_URL < backups/production_pre_week3_YYYYMMDD_HHMMSS.sql

# 4. Verify app working
npm run test:production:smoke

# 5. Schedule re-deployment after fixing issues
```

### Partial Rollback (RLS Only)

```sql
-- Drop all RLS policies but keep helper functions and audit
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
            r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- Disable RLS
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        AND rowsecurity = TRUE
    LOOP
        EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', r.tablename);
    END LOOP;
END $$;
```

---

## 📊 Monitoring

### Daily Monitoring (First Week)

```sql
-- ============================================================================
-- DAILY MONITORING QUERIES
-- ============================================================================

-- 1. Audit log summary
SELECT
    DATE(created_at) AS date,
    user_role,
    action,
    resource_type,
    COUNT(*) AS event_count,
    COUNT(*) FILTER (WHERE success = FALSE) AS failures
FROM audit_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE(created_at), user_role, action, resource_type
ORDER BY event_count DESC;

-- 2. Failed operations
SELECT * FROM v_failed_operations
WHERE last_failure > NOW() - INTERVAL '24 hours'
LIMIT 20;

-- 3. Sensitive operations pending review
SELECT * FROM v_pending_sensitive_reviews
ORDER BY severity, created_at DESC;

-- 4. Performance metrics
SELECT
    tablename,
    n_live_tup AS row_count,
    n_tup_ins AS inserts,
    n_tup_upd AS updates,
    n_tup_del AS deletes
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;

-- 5. Database size
SELECT
    pg_size_pretty(pg_database_size(current_database())) AS db_size,
    pg_size_pretty(pg_total_relation_size('audit_logs')) AS audit_logs_size;
```

### Weekly Tasks

- [ ] Review audit logs for unusual patterns
- [ ] Check pending sensitive operations
- [ ] Analyze failed operations
- [ ] Monitor database size growth
- [ ] Review and optimize slow queries
- [ ] Archive old audit logs (if > 90 days)

### Monthly Tasks

- [ ] Run archive_old_audit_logs()
- [ ] Review RLS policy effectiveness
- [ ] Update documentation if policies changed
- [ ] Security audit review
- [ ] Performance optimization review

---

## 🔧 Troubleshooting

### Issue: Application Performance Degraded

**Symptoms:**
- Queries taking longer than before
- Timeouts on kuis/nilai queries
- Users reporting slowness

**Diagnosis:**
```sql
-- Check slow queries
SELECT
    query,
    mean_exec_time,
    calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check RLS function performance
EXPLAIN ANALYZE SELECT get_mahasiswa_kelas_ids();
```

**Solution:**
```sql
-- Add missing indexes if needed
CREATE INDEX CONCURRENTLY idx_name ON table (column);

-- Analyze tables
ANALYZE users;
ANALYZE kuis;
ANALYZE kelas_mahasiswa;

-- Optimize RLS functions if needed (cache results)
```

---

### Issue: RLS Blocking Legitimate Access

**Symptoms:**
- Users getting "No data" when they should see data
- 403 errors
- Empty query results

**Diagnosis:**
```sql
-- Check user role
SELECT get_user_role();

-- Check policies for table
SELECT * FROM pg_policies WHERE tablename = 'kuis';

-- Test with RLS disabled (temporarily)
SET ROLE service_role;
SELECT * FROM kuis;
RESET ROLE;
```

**Solution:**
- Review RLS policies in migration file
- Check if helper functions returning correct values
- Verify user profile tables (mahasiswa/dosen/laboran) populated
- Fix policy logic if incorrect

---

### Issue: Audit Logs Not Being Created

**Symptoms:**
- audit_logs table empty
- No triggers firing

**Diagnosis:**
```sql
-- Check if triggers exist
SELECT tgname, tgenabled FROM pg_trigger WHERE tgrelid = 'kuis'::regclass;

-- Manually test
SELECT log_audit_event('test', 'kuis', gen_random_uuid(), NULL, NULL, TRUE);
```

**Solution:**
```sql
-- Re-apply audit triggers
DROP TRIGGER IF EXISTS audit_kuis_changes ON kuis;
CREATE TRIGGER audit_kuis_changes
    AFTER INSERT OR UPDATE OR DELETE ON kuis
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
```

---

## ✅ Deployment Completion Checklist

### Sign-Off

- [ ] All migrations applied successfully
- [ ] RLS enabled and verified
- [ ] Audit system operational
- [ ] All tests passing
- [ ] Performance acceptable
- [ ] No critical errors in logs
- [ ] Users can access app normally
- [ ] Backup created and verified
- [ ] Rollback plan tested
- [ ] Monitoring in place
- [ ] Team notified of completion
- [ ] Documentation updated

**Deployed By:** ___________________
**Date:** ___________________
**Environment:** [ ] Staging [ ] Production
**Status:** [ ] Success [ ] Failed [ ] Partial

**Notes:**
```
(Add deployment notes here)
```

---

## 📚 Additional Resources

- [RLS_TESTING_GUIDE.md](./RLS_TESTING_GUIDE.md) - Comprehensive testing guide
- [RBAC_SECURITY_AUDIT.md](./RBAC_SECURITY_AUDIT.md) - Security analysis
- [RBAC_ANALYSIS.md](./RBAC_ANALYSIS.md) - RBAC system overview
- [Supabase RLS Docs](https://supabase.com/docs/guides/auth/row-level-security)

---

**Generated:** 2025-11-28
**System:** Sistem Praktikum PWA
**Week 3:** Database Enhancement Deployment - READY 🚀
