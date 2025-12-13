# Week 4 Day 1-2: End-to-End Testing Plan 🧪

**Sistem Praktikum PWA - Production Readiness Testing**

**Date:** 2025-11-29
**Status:** 🟢 READY TO START
**Focus:** Comprehensive E2E testing for all 4 roles

---

## 📋 Table of Contents

1. [Testing Overview](#testing-overview)
2. [Test Environment Setup](#test-environment-setup)
3. [Test Users & Data](#test-users--data)
4. [Role-Based Testing](#role-based-testing)
5. [Security Testing](#security-testing)
6. [Performance Testing](#performance-testing)
7. [Offline/PWA Testing](#offlinepwa-testing)
8. [Issue Tracking](#issue-tracking)

---

## 🎯 Testing Overview

### Objectives

✅ **Functional Testing** - All features work as expected
✅ **Security Testing** - RBAC + RLS work correctly
✅ **Performance Testing** - System responds quickly
✅ **PWA Testing** - Offline functionality works
✅ **Integration Testing** - All layers work together
✅ **User Experience** - Smooth workflows for all roles

### Testing Layers

```
┌─────────────────────────────────────────┐
│  Frontend Testing                       │
│  ✓ UI components render correctly      │
│  ✓ Forms validation works               │
│  ✓ Navigation & routing                 │
└─────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────┐
│  RBAC Middleware Testing                │
│  ✓ Route guards work                    │
│  ✓ Permission checks enforced           │
│  ✓ Role hierarchy respected             │
└─────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────┐
│  RLS Database Testing                   │
│  ✓ Row-level security enforced          │
│  ✓ Ownership validation                 │
│  ✓ Privacy protection                   │
└─────────────────────────────────────────┘
```

### Success Criteria

- [ ] All critical user flows work for all 4 roles
- [ ] No security vulnerabilities found
- [ ] Performance meets targets (< 2s page load, < 500ms API)
- [ ] Offline mode works correctly
- [ ] No data leaks between roles
- [ ] Audit logs capture all sensitive operations

---

## 🔧 Test Environment Setup

### Prerequisites

```bash
# 1. Ensure all migrations are applied
supabase migration list

# Expected: All Week 3 migrations marked as applied
# ✓ 20_rls_helper_functions.sql
# ✓ 21_fix_attempt_status_enum.sql
# ✓ 21_drop_all_policies.sql
# ✓ 21_enhanced_rls_policies.sql
# ✓ 22_audit_logging_system.sql

# 2. Verify RLS is enabled
psql $DATABASE_URL -c "
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true;"

# 3. Check policy count
psql $DATABASE_URL -c "
SELECT COUNT(*) as total_policies
FROM pg_policies
WHERE schemaname = 'public';"
# Expected: 80+ policies
```

### Test Database Setup

```bash
# Option 1: Use existing dev database
# (Make sure you have test data)

# Option 2: Create fresh test database
supabase db reset
npm run seed:test-data  # If you have seed script
```

---

## 👥 Test Users & Data

### Required Test Users (4 Roles)

Create one user for each role with realistic data:

#### 1. Admin User
```sql
-- Username: admin@test.com
-- Password: Admin123!
-- Role: admin
```

**Test Data Needs:**
- Can see all users, kelas, kuis, nilai
- Can manage all resources

#### 2. Dosen User
```sql
-- Username: dosen1@test.com
-- Password: Dosen123!
-- Role: dosen
-- Has: 2 mata kuliah, 3 kelas, 5 kuis
```

**Test Data Needs:**
- Own kelas: Kelas A (10 mahasiswa), Kelas B (8 mahasiswa)
- Own kuis: 5 kuis (2 published, 3 draft)
- Students: 18 total mahasiswa across kelas
- Nilai: Grades for some mahasiswa

#### 3. Laboran User
```sql
-- Username: laboran1@test.com
-- Password: Laboran123!
-- Role: laboran
```

**Test Data Needs:**
- Inventaris: 20 items
- Laboratorium: 3 labs
- Peminjaman: 10 requests (5 pending, 3 approved, 2 returned)

#### 4. Mahasiswa User
```sql
-- Username: mahasiswa1@test.com
-- Password: Mhs123!
-- Role: mahasiswa
-- Enrolled in: 2 kelas
```

**Test Data Needs:**
- Enrolled kelas: 2 kelas (Kelas A, Kelas C)
- Kuis attempts: 3 attempts (1 in_progress, 2 completed)
- Nilai: Grades in both kelas
- Peminjaman: 2 borrowing requests

### Data Relationships

```
Admin
  └─> Can see/manage everything

Dosen (dosen1@test.com)
  ├─> Kelas A (10 mahasiswa)
  │   ├─> Kuis 1 (published)
  │   ├─> Kuis 2 (published)
  │   └─> Nilai for all 10 students
  └─> Kelas B (8 mahasiswa)
      └─> Kuis 3 (draft)

Mahasiswa (mahasiswa1@test.com)
  ├─> Enrolled in Kelas A
  │   ├─> Attempt Kuis 1 (completed, graded)
  │   └─> Nilai (visible)
  └─> Enrolled in Kelas C
      └─> Attempt Kuis 5 (in_progress)

Laboran (laboran1@test.com)
  ├─> Manages all inventaris
  ├─> Approves peminjaman from all users
  └─> Manages laboratorium
```

---

## 🧪 Role-Based Testing

### 1. ADMIN Testing (Priority: HIGH)

#### Login & Dashboard
- [ ] Can login with admin credentials
- [ ] Redirected to `/admin/dashboard`
- [ ] Dashboard shows all statistics
- [ ] Can see total users, kelas, kuis counts

#### User Management
- [ ] Can view all users (admin, dosen, laboran, mahasiswa)
- [ ] Can create new user of any role
- [ ] Can edit any user's profile
- [ ] Can deactivate/activate users
- [ ] Can delete users
- [ ] Cannot see passwords in plain text

#### Mata Kuliah Management
- [ ] Can view all mata kuliah
- [ ] Can create new mata kuliah
- [ ] Can edit any mata kuliah
- [ ] Can delete mata kuliah
- [ ] Deletion blocked if mata kuliah has kelas

#### Kelas Management
- [ ] Can view all kelas (all dosen)
- [ ] Can create kelas for any dosen
- [ ] Can edit any kelas
- [ ] Can manage kelas mahasiswa enrollments
- [ ] Can delete kelas

#### Kuis Management
- [ ] Can view all kuis (from all dosen)
- [ ] Can view all attempts
- [ ] Can view all grades
- [ ] Can edit any kuis
- [ ] Can delete any kuis

#### Inventaris & Laboratorium
- [ ] Can view all inventaris
- [ ] Can manage equipment
- [ ] Can view all peminjaman
- [ ] Can approve/reject peminjaman
- [ ] Can manage laboratorium

#### Analytics & Reports
- [ ] Can view system analytics
- [ ] Can generate reports
- [ ] Can export data
- [ ] Can view audit logs

#### Security Tests (Admin)
- [ ] Admin bypass works for RLS policies
- [ ] Can access any data (test with SQL queries)
- [ ] Audit logs capture admin actions

---

### 2. DOSEN Testing (Priority: HIGH)

#### Login & Dashboard
- [ ] Can login with dosen credentials
- [ ] Redirected to `/dosen/dashboard`
- [ ] Dashboard shows own statistics only
- [ ] See own kelas, kuis, mahasiswa counts

#### Kelas Management
- [ ] Can view only own kelas
- [ ] Cannot see other dosen's kelas
- [ ] Can create new kelas for own mata kuliah
- [ ] Can edit own kelas
- [ ] Can manage mahasiswa in own kelas
- [ ] Can view jadwal for own kelas

#### Kuis Management
- [ ] Can view only own kuis
- [ ] Cannot see other dosen's kuis
- [ ] Can create new kuis for own kelas
- [ ] Can edit own kuis
- [ ] Can publish/unpublish kuis
- [ ] Can add/edit soal (questions)
- [ ] Can set time limits and passing scores

#### Grading (Penilaian)
- [ ] Can view attempts for own kuis only
- [ ] Cannot view other dosen's kuis attempts
- [ ] Can grade mahasiswa attempts
- [ ] Can provide feedback
- [ ] Can update grades
- [ ] Mahasiswa sees updated grades immediately

#### Nilai (Grades)
- [ ] Can view nilai for own students only
- [ ] Cannot view other dosen's students' nilai
- [ ] Can create/update nilai
- [ ] Can set bobot (weight) for different components
- [ ] Can calculate final grades

#### Mahasiswa Management
- [ ] Can view students enrolled in own kelas
- [ ] Cannot view other mahasiswa profiles
- [ ] Can view student attendance
- [ ] Can view student grades in own kelas

#### Materi (Materials)
- [ ] Can upload materi for own kelas
- [ ] Can edit/delete own materi
- [ ] Cannot edit other dosen's materi
- [ ] Files upload to correct storage bucket

#### Security Tests (Dosen)
- [ ] Cannot access admin routes
- [ ] Cannot access other dosen's data
- [ ] Cannot modify other dosen's kuis
- [ ] Cannot see grades of students not in own kelas
- [ ] RLS policies enforce ownership

---

### 3. LABORAN Testing (Priority: MEDIUM)

#### Login & Dashboard
- [ ] Can login with laboran credentials
- [ ] Redirected to `/laboran/dashboard`
- [ ] Dashboard shows inventory & peminjaman stats

#### Inventaris Management
- [ ] Can view all inventaris
- [ ] Can create new equipment
- [ ] Can edit equipment details
- [ ] Can update kondisi (condition)
- [ ] Can set availability
- [ ] Can delete unused equipment

#### Laboratorium Management
- [ ] Can view all laboratories
- [ ] Can create new lab
- [ ] Can edit lab details (capacity, location)
- [ ] Can set lab availability

#### Peminjaman Approval
- [ ] Can view all peminjaman requests
- [ ] Can see pending requests
- [ ] Can approve requests
- [ ] Can reject requests with reason
- [ ] Can track borrowed items
- [ ] Can mark items as returned
- [ ] Can assess kondisi kembali (return condition)
- [ ] Can set denda (fine) for late/damaged returns

#### Jadwal Management
- [ ] Can view all jadwal praktikum
- [ ] Can create/edit jadwal
- [ ] Can assign laboratorium to kelas
- [ ] Cannot double-book labs

#### Laporan (Reports)
- [ ] Can generate borrowing reports
- [ ] Can view equipment usage statistics
- [ ] Can export data

#### Security Tests (Laboran)
- [ ] Cannot access admin routes
- [ ] Cannot access dosen routes
- [ ] Cannot view kuis or nilai
- [ ] Can only manage inventory-related data
- [ ] RLS policies enforce laboran access

---

### 4. MAHASISWA Testing (Priority: HIGH)

#### Login & Dashboard
- [ ] Can login with mahasiswa credentials
- [ ] Redirected to `/mahasiswa/dashboard`
- [ ] Dashboard shows enrolled kelas
- [ ] Shows upcoming kuis and jadwal

#### Kelas (Classes)
- [ ] Can view enrolled kelas only
- [ ] Cannot see other mahasiswa's kelas
- [ ] Can see kelas details (dosen, jadwal, materi)
- [ ] Can view classmates in same kelas

#### Kuis (Quizzes)
- [ ] Can see only published kuis for enrolled kelas
- [ ] Cannot see draft kuis
- [ ] Cannot see kuis from non-enrolled kelas
- [ ] Can start kuis attempt
- [ ] Can answer questions
- [ ] Timer works correctly
- [ ] Can submit kuis
- [ ] Cannot edit after submission
- [ ] Can view own results after grading

#### Nilai (Grades)
- [ ] Can view only own nilai
- [ ] Cannot see other mahasiswa's nilai
- [ ] Can see breakdown by component (kuis, tugas, UTS, UAS)
- [ ] Can view final grade
- [ ] Grade updates reflect immediately

#### Materi (Materials)
- [ ] Can view materi for enrolled kelas
- [ ] Can download files
- [ ] Cannot upload materi
- [ ] Cannot delete materi

#### Peminjaman (Borrowing)
- [ ] Can create peminjaman request
- [ ] Can view own peminjaman history
- [ ] Cannot see other mahasiswa's peminjaman
- [ ] Can view request status
- [ ] Can cancel pending requests
- [ ] Cannot cancel approved requests

#### Kehadiran (Attendance)
- [ ] Can view own attendance
- [ ] Cannot edit attendance
- [ ] Can see attendance percentage

#### Security Tests (Mahasiswa)
- [ ] Cannot access admin routes
- [ ] Cannot access dosen routes
- [ ] Cannot access laboran routes
- [ ] Cannot view other mahasiswa's data
- [ ] Cannot edit grades
- [ ] Cannot see unpublished kuis
- [ ] RLS policies enforce privacy

---

## 🔒 Security Testing

### Authentication Tests

- [ ] Cannot access app without login
- [ ] Invalid credentials rejected
- [ ] Session persists correctly
- [ ] Logout clears session
- [ ] Cannot access protected routes when logged out

### Authorization Tests (RBAC)

```typescript
// Test each role cannot access other role's routes
- [ ] Mahasiswa cannot access /admin/*
- [ ] Mahasiswa cannot access /dosen/*
- [ ] Mahasiswa cannot access /laboran/*
- [ ] Dosen cannot access /admin/*
- [ ] Dosen cannot access /laboran/*
- [ ] Laboran cannot access /admin/*
- [ ] Laboran cannot access /dosen/*
```

### RLS Policy Tests

```sql
-- Test data isolation
-- 1. Login as mahasiswa1@test.com
SELECT * FROM nilai;
-- Should only see own grades

-- 2. Login as dosen1@test.com
SELECT * FROM kuis;
-- Should only see own kuis

-- 3. Try to access other user's data directly
SELECT * FROM attempt_kuis WHERE mahasiswa_id = '<other_student_id>';
-- Should return empty if not your kuis

-- 4. Try SQL injection or direct API calls
-- Should be blocked by RLS
```

### Privacy Tests

- [ ] Mahasiswa cannot see other mahasiswa's nilai
- [ ] Dosen cannot see other dosen's kuis
- [ ] Users cannot modify data they don't own
- [ ] Grades are private
- [ ] Attempt details are private

### Audit Logging Tests

- [ ] Sensitive operations logged (create nilai, update kuis)
- [ ] Failed access attempts logged
- [ ] Admin actions logged
- [ ] Logs cannot be modified by users
- [ ] Logs contain correct information (user, action, timestamp)

---

## ⚡ Performance Testing

### Page Load Times

Target: < 2 seconds for initial page load

- [ ] Dashboard loads quickly
- [ ] Tables with 100+ rows render smoothly
- [ ] Images lazy load correctly
- [ ] No unnecessary re-renders

### API Response Times

Target: < 500ms for most API calls

```bash
# Test with browser DevTools Network tab
- [ ] GET /api/kuis - List kuis
- [ ] GET /api/nilai - List grades
- [ ] POST /api/attempt-kuis - Create attempt
- [ ] PUT /api/kuis/:id - Update kuis
```

### Database Query Performance

```sql
-- Test complex queries with EXPLAIN ANALYZE
EXPLAIN ANALYZE
SELECT * FROM kuis
WHERE kelas_id IN (
  SELECT kelas_id FROM kelas_mahasiswa
  WHERE mahasiswa_id = '<test_id>'
);

-- Should use indexes
-- Should complete in < 100ms
```

### Load Testing

```bash
# Simulate multiple concurrent users
- [ ] 10 concurrent users browsing
- [ ] 5 users taking kuis simultaneously
- [ ] System remains responsive
- [ ] No database deadlocks
```

---

## 📱 Offline/PWA Testing

### Service Worker

- [ ] Service worker registers correctly
- [ ] Static assets cached
- [ ] API responses cached when offline
- [ ] Cache invalidated on updates

### Offline Kuis

- [ ] Can start kuis while online
- [ ] Can continue kuis when going offline
- [ ] Answers saved locally
- [ ] Can submit when back online
- [ ] Sync status visible to user
- [ ] No data loss during offline period

### Offline Data Sync

- [ ] Offline changes queued
- [ ] Auto-sync when connection restored
- [ ] Conflict resolution works
- [ ] Sync status indicator accurate

### PWA Installation

- [ ] Install prompt appears
- [ ] Can install as app
- [ ] App opens in standalone mode
- [ ] Icons and splash screen correct

---

## 🐛 Issue Tracking

### Issue Template

For any bugs found, document with:

```markdown
### Issue #X: [Brief Description]

**Severity:** Critical / High / Medium / Low
**Role Affected:** Admin / Dosen / Laboran / Mahasiswa
**Feature:** [Feature name]

**Steps to Reproduce:**
1. Login as [role]
2. Navigate to [page]
3. Click [button]
4. Observe [issue]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Screenshots:**
[If applicable]

**Environment:**
- Browser: Chrome 120
- OS: Windows 11
- Database: PostgreSQL 15

**Proposed Fix:**
[If known]

**Priority:** P0 / P1 / P2 / P3
```

### Priority Levels

- **P0 (Critical)**: Security vulnerability, data loss, app crash
- **P1 (High)**: Core feature broken, blocks critical workflow
- **P2 (Medium)**: Feature partially working, workaround available
- **P3 (Low)**: UI polish, minor bugs, enhancement

### Tracking Sheet

Create a spreadsheet or use GitHub Issues:

| Issue # | Title | Severity | Role | Status | Assigned To | Fixed In |
|---------|-------|----------|------|--------|-------------|----------|
| #1 | ... | High | Mahasiswa | Open | - | - |
| #2 | ... | Medium | Dosen | Fixed | - | Day 3 |

---

## 📊 Testing Progress

### Completion Checklist

#### Day 1: Core Functionality
- [ ] All 4 roles can login
- [ ] Dashboard loads for each role
- [ ] CRUD operations work (Create, Read, Update, Delete)
- [ ] Forms validation works
- [ ] Navigation works

#### Day 2: Advanced Features
- [ ] Kuis creation and taking works
- [ ] Grading workflow works
- [ ] Peminjaman approval works
- [ ] File uploads work
- [ ] Reports generation works

#### Security Validation (Continuous)
- [ ] RBAC enforced at frontend
- [ ] RBAC enforced at middleware
- [ ] RLS enforced at database
- [ ] No data leaks found

#### Performance (Continuous)
- [ ] Pages load < 2s
- [ ] APIs respond < 500ms
- [ ] No memory leaks
- [ ] Smooth UX

---

## 🎯 Success Metrics

At the end of Day 1-2, you should have:

✅ **100% of critical user flows tested**
✅ **All P0/P1 issues documented**
✅ **Security validation passed**
✅ **Performance targets met**
✅ **Issue tracker created with all bugs**
✅ **Testing report documented**

---

## 📝 Daily Test Report Template

### Day 1 Report

**Date:** [Date]
**Tester:** [Name]

**Tests Completed:** X / Y
**Tests Passed:** X
**Tests Failed:** Y
**Issues Found:** Z

**Critical Issues:**
- [List P0 issues]

**Blocker Issues:**
- [List P1 issues that need immediate fix]

**Notes:**
- [Any observations]

**Tomorrow's Focus:**
- [What to test next]

---

## 🚀 Next Steps

After completing Day 1-2 testing:

**Day 3:** Fix all P0 and P1 issues found
**Day 4:** Update documentation based on testing feedback
**Day 5:** Final validation and deployment preparation

---

**Good luck with testing!** 🎯

Remember: **Quality over speed**. It's better to find issues now than in production!
