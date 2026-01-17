# Week 3 Deployment Scripts
**Safe Deployment Tools untuk Database Enhancement**

---

## 📁 Available Scripts

### 1. `deploy-week3.sh` - Main Deployment Script

**Safe deployment dengan multiple safety checks**

#### Features
✅ Pre-deployment checks
✅ Automatic backup
✅ Step-by-step confirmation
✅ Dry-run mode
✅ Verification checks
✅ Smoke tests
✅ Rollback information

#### Usage

```bash
# Local deployment (recommended first)
./scripts/deploy-week3.sh local

# Dry run (test without changes)
./scripts/deploy-week3.sh local true

# Staging deployment
./scripts/deploy-week3.sh staging

# Production deployment (requires extra confirmation)
./scripts/deploy-week3.sh production
```

#### What it does

1. ✅ Checks prerequisites (psql, files exist)
2. ✅ Tests database connection
3. ✅ Checks current state
4. ✅ Creates automatic backup
5. ✅ Asks for confirmation
6. ✅ Applies migrations (20 → 21 → 22)
7. ✅ Verifies deployment
8. ✅ Runs smoke tests
9. ✅ Prints summary

#### Output

- Backup file: `backups/[env]_pre_week3_YYYYMMDD_HHMMSS.sql`
- Log file: `backups/deployment_YYYYMMDD_HHMMSS.log`

---

### 2. `rollback-week3.sh` - Rollback Script

**Safe rollback dengan multiple options**

#### Features
✅ Quick fix (disable RLS temporarily)
✅ Partial rollback (remove policies)
✅ Full restore (from backup)
✅ Custom rollback (choose what to remove)

#### Usage

```bash
# Interactive rollback menu
./scripts/rollback-week3.sh local

# With specific backup file
./scripts/rollback-week3.sh local /path/to/backup.sql
```

#### Rollback Options

**Option 1: Quick Fix** (Non-destructive)
- Disables RLS on all tables
- Temporary fix for emergency access
- Can re-enable later

**Option 2: Partial Rollback** (Data preserved)
- Disables RLS
- Drops policies
- Drops triggers
- Drops functions
- Optionally drops audit tables
- Keeps all data intact

**Option 3: Full Rollback** (Destructive)
- Restores entire database from backup
- ALL changes since backup are lost
- Use only as last resort

**Option 4: Custom** (Pick and choose)
- Choose which components to remove
- Fine-grained control

---

### 3. `verify-week3.sh` - Verification Script

**Comprehensive verification checks**

#### Features
✅ RLS enabled checks
✅ Policy count validation
✅ Helper function verification
✅ Audit system checks
✅ Functional tests

#### Usage

```bash
# Verify deployment
./scripts/verify-week3.sh local
```

#### Checks Performed

1. **RLS Enabled** (4 checks)
   - users, kuis, nilai, kelas tables

2. **Policy Count** (4 checks)
   - Total policies >= 80
   - Per-table policy counts

3. **Helper Functions** (6 checks)
   - All 8+ helper functions exist

4. **Audit System** (5 checks)
   - Tables, triggers, functions, views

5. **Functional Tests** (4 checks)
   - Can query tables
   - Functions callable

#### Output

```
═══════════════════════════════════════
VERIFICATION SUMMARY
═══════════════════════════════════════
Total Checks:  23
Passed:        23
Failed:        0

Pass Rate:     100%

╔════════════════════════════════════╗
║    ALL CHECKS PASSED! ✅           ║
╚════════════════════════════════════╝
```

---

## 🚀 Recommended Workflow

### First-Time Deployment

```bash
# 1. Test with dry-run
./scripts/deploy-week3.sh local true

# 2. Deploy to local
./scripts/deploy-week3.sh local

# 3. Verify deployment
./scripts/verify-week3.sh local

# 4. If successful, test app
npm run dev

# 5. If issues, rollback
./scripts/rollback-week3.sh local
```

### Staging Deployment

```bash
# 1. Deploy to staging
./scripts/deploy-week3.sh staging

# 2. Verify
./scripts/verify-week3.sh staging

# 3. Monitor for 24 hours
# Check logs, performance, errors

# 4. If OK, proceed to production
```

### Production Deployment

```bash
# 1. Schedule maintenance window
# 2. Notify users

# 3. Deploy
./scripts/deploy-week3.sh production

# 4. Verify immediately
./scripts/verify-week3.sh production

# 5. Monitor closely
# First hour: every 5 minutes
# First day: every hour

# 6. If critical issues:
./scripts/rollback-week3.sh production
```

---

## 🛡️ Safety Features

### Automatic Backups
- Created before every deployment
- Stored in `backups/` directory
- Named with timestamp
- Verified non-empty

### Pre-Flight Checks
- psql installed
- Migration files exist
- Database connection works
- Current state checked

### Confirmations
- Multiple confirmation prompts
- Extra confirmation for production
- Clear warnings for destructive actions

### Logging
- All actions logged
- Timestamped entries
- Errors captured
- Log file preserved

### Verification
- Post-deployment checks
- Smoke tests
- Functional tests
- Summary report

---

## 📊 File Locations

```
sistem-praktikum-pwa/
├── scripts/
│   ├── deploy-week3.sh       ← Main deployment
│   ├── rollback-week3.sh     ← Rollback tool
│   ├── verify-week3.sh       ← Verification
│   └── README.md             ← This file
│
├── backups/
│   ├── local_pre_week3_*.sql
│   ├── deployment_*.log
│   ├── rollback_*.log
│   └── latest_backup.txt     ← Points to last backup
│
└── supabase/migrations/
    ├── 20_rls_helper_functions.sql
    ├── 21_enhanced_rls_policies.sql
    └── 22_audit_logging_system.sql
```

---

## ⚠️ Important Notes

### Before Running

1. **Backup Exists**: Scripts create backups, but have manual backup too
2. **Test Environment**: ALWAYS test in local/dev first
3. **Maintenance Window**: Production needs 2-hour window
4. **Team Ready**: Have support team on standby

### During Deployment

1. **Don't Interrupt**: Let scripts complete
2. **Watch Logs**: Monitor log files in real-time
3. **Note Errors**: Screenshot any errors immediately
4. **Be Ready to Rollback**: Have rollback script ready

### After Deployment

1. **Verify Immediately**: Run verify script
2. **Test App**: Login as different roles
3. **Monitor Logs**: Check for errors
4. **Watch Performance**: Query times acceptable?

---

## 🔧 Troubleshooting

### Script Won't Run

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Or run with bash
bash scripts/deploy-week3.sh local
```

### psql Not Found

```bash
# Install PostgreSQL client
# Windows (with chocolatey):
choco install postgresql

# Mac:
brew install postgresql

# Linux:
sudo apt-get install postgresql-client
```

### Connection Failed

```bash
# Check Supabase is running
supabase status

# Start if not running
supabase start

# Test connection manually
psql postgresql://postgres:postgres@localhost:54322/postgres
```

### Deployment Failed

```bash
# Check log file
cat backups/deployment_*.log

# Run rollback
./scripts/rollback-week3.sh local

# Get help
# Check WEEK3_DEPLOYMENT_GUIDE.md
```

---

## 📞 Support

If you encounter issues:

1. Check log files in `backups/`
2. Review `WEEK3_DEPLOYMENT_GUIDE.md`
3. Check `RLS_TESTING_GUIDE.md`
4. Run verify script for diagnostics

---

## ✅ Success Criteria

Deployment is successful when:

- [x] `verify-week3.sh` passes all checks (23/23)
- [x] App can access data normally
- [x] Users can login as all 4 roles
- [x] No errors in application logs
- [x] Performance acceptable (<50ms queries)
- [x] Audit logs capturing events

---

**Last Updated:** 2025-11-28
**Version:** 1.0
**Status:** Production Ready ✅
