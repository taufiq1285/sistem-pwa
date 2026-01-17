## RLS Testing Guide - Week 3 Day 3
**Sistem Praktikum PWA - Database Security Testing**

**Date:** 2025-11-28
**Purpose:** Comprehensive testing guide untuk RLS policies
**Environment:** Dev/Staging database sebelum production deployment

---

## 📋 Table of Contents

1. [Pre-Testing Checklist](#pre-testing-checklist)
2. [Test Environment Setup](#test-environment-setup)
3. [Test Users & Data](#test-users--data)
4. [RLS Policy Tests](#rls-policy-tests)
5. [Performance Testing](#performance-testing)
6. [Security Validation](#security-validation)
7. [Audit Log Testing](#audit-log-testing)
8. [Troubleshooting](#troubleshooting)

---

## 🔍 Pre-Testing Checklist

### Migration Status

```sql
-- ✅ Verify all migrations applied
SELECT
    migration_name,
    executed_at
FROM supabase_migrations.schema_migrations
WHERE migration_name LIKE '%rls%' OR migration_name LIKE '%audit%'
ORDER BY executed_at DESC;

-- Expected results:
-- 22_audit_logging_system.sql
-- 21_enhanced_rls_policies.sql
-- 20_rls_helper_functions.sql
```

### RLS Enabled Verification

```sql
-- ✅ Check RLS is enabled on all critical tables
SELECT
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
    'users', 'kuis', 'attempt_kuis', 'nilai', 'kelas',
    'kelas_mahasiswa', 'peminjaman', 'inventaris',
    'laboratorium', 'mata_kuliah', 'jadwal_praktikum',
    'materi', 'mahasiswa', 'dosen', 'laboran'
)
ORDER BY tablename;

-- ✅ All should have rls_enabled = TRUE
```

### Policy Count Verification

```sql
-- ✅ Check number of policies per table
SELECT
    schemaname,
    tablename,
    COUNT(*) AS policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY policy_count DESC, tablename;

-- Expected: 80+ policies total
-- Critical tables should have 4-8 policies each
```

### Helper Functions Verification

```sql
-- ✅ Test all helper functions exist
SELECT
    proname AS function_name,
    pg_get_functiondef(oid) IS NOT NULL AS defined
FROM pg_proc
WHERE proname IN (
    'get_user_role',
    'is_admin',
    'is_dosen',
    'is_laboran',
    'is_mahasiswa',
    'get_current_mahasiswa_id',
    'get_current_dosen_id',
    'get_current_laboran_id',
    'mahasiswa_in_kelas',
    'dosen_teaches_kelas',
    'dosen_teaches_mahasiswa',
    'get_mahasiswa_kelas_ids',
    'get_dosen_kelas_ids'
)
ORDER BY proname;

-- ✅ All 13 functions should exist
```

---

## 🛠 Test Environment Setup

### Create Test Database

```bash
# Option 1: Use Supabase CLI
supabase db reset --db-url "postgresql://postgres:password@localhost:54322/postgres"

# Option 2: Manual setup
psql -h localhost -p 54322 -U postgres -d postgres -f supabase/migrations/20_rls_helper_functions.sql
psql -h localhost -p 54322 -U postgres -d postgres -f supabase/migrations/21_enhanced_rls_policies.sql
psql -h localhost -p 54322 -U postgres -d postgres -f supabase/migrations/22_audit_logging_system.sql
```

### Create Test Users

```sql
-- ===========================================
-- CREATE TEST USERS (Run as service_role)
-- ===========================================

-- 1. ADMIN User
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'admin@test.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"role": "admin", "full_name": "Test Admin"}'::jsonb
);

INSERT INTO public.users (id, email, full_name, role)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin@test.com',
    'Test Admin',
    'admin'
);

-- 2. DOSEN User
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data
) VALUES (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'dosen@test.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"role": "dosen", "full_name": "Test Dosen"}'::jsonb
);

INSERT INTO public.users (id, email, full_name, role)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    'dosen@test.com',
    'Test Dosen',
    'dosen'
);

INSERT INTO public.dosen (id, user_id, nip, program_studi)
VALUES (
    '00000000-0000-0000-0000-0000000000D1',
    '00000000-0000-0000-0000-000000000002',
    '199001012020121001',
    'Teknik Informatika'
);

-- 3. MAHASISWA User
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data
) VALUES (
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'mahasiswa@test.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"role": "mahasiswa", "full_name": "Test Mahasiswa"}'::jsonb
);

INSERT INTO public.users (id, email, full_name, role)
VALUES (
    '00000000-0000-0000-0000-000000000003',
    'mahasiswa@test.com',
    'Test Mahasiswa',
    'mahasiswa'
);

INSERT INTO public.mahasiswa (id, user_id, nim, angkatan, program_studi)
VALUES (
    '00000000-0000-0000-0000-0000000000M1',
    '00000000-0000-0000-0000-000000000003',
    '2021010101',
    2021,
    'Teknik Informatika'
);

-- 4. LABORAN User
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data
) VALUES (
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000000',
    'laboran@test.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"role": "laboran", "full_name": "Test Laboran"}'::jsonb
);

INSERT INTO public.users (id, email, full_name, role)
VALUES (
    '00000000-0000-0000-0000-000000000004',
    'laboran@test.com',
    'Test Laboran',
    'laboran'
);

INSERT INTO public.laboran (id, user_id, nip)
VALUES (
    '00000000-0000-0000-0000-0000000000L1',
    '00000000-0000-0000-0000-000000000004',
    '199002022020122001'
);
```

### Create Test Data

```sql
-- ===========================================
-- CREATE TEST DATA
-- ===========================================

-- Mata Kuliah
INSERT INTO mata_kuliah (id, kode_mk, nama_mk, sks, semester, program_studi)
VALUES (
    '00000000-0000-0000-0000-00000000MK01',
    'TIF101',
    'Algoritma dan Pemrograman',
    4,
    1,
    'Teknik Informatika'
);

-- Kelas
INSERT INTO kelas (id, kode_kelas, nama_kelas, mata_kuliah_id, dosen_id, tahun_ajaran, semester_ajaran, is_active)
VALUES (
    '00000000-0000-0000-0000-00000000KL01',
    'TIF101-A',
    'Algoritma A',
    '00000000-0000-0000-0000-00000000MK01',
    '00000000-0000-0000-0000-0000000000D1',
    '2024/2025',
    1,
    TRUE
);

-- Enrollment
INSERT INTO kelas_mahasiswa (id, kelas_id, mahasiswa_id, enrolled_at, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000KM1',
    '00000000-0000-0000-0000-00000000KL01',
    '00000000-0000-0000-0000-0000000000M1',
    NOW(),
    TRUE
);

-- Kuis
INSERT INTO kuis (
    id,
    judul,
    deskripsi,
    kelas_id,
    dosen_id,
    status,
    tanggal_mulai,
    tanggal_selesai
) VALUES (
    '00000000-0000-0000-0000-000000000KU1',
    'Quiz 1: Pengenalan Algoritma',
    'Quiz tentang dasar algoritma',
    '00000000-0000-0000-0000-00000000KL01',
    '00000000-0000-0000-0000-0000000000D1',
    'published',
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '7 days'
);

-- Laboratorium
INSERT INTO laboratorium (id, kode_lab, nama_lab, kapasitas, lokasi, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000LAB',
    'LAB-01',
    'Laboratorium Komputer 1',
    40,
    'Gedung A Lt. 2',
    TRUE
);

-- Inventaris
INSERT INTO inventaris (
    id,
    kode_barang,
    nama_barang,
    kategori,
    laboratorium_id,
    jumlah,
    jumlah_tersedia,
    kondisi
) VALUES (
    '00000000-0000-0000-0000-000000000INV',
    'COMP-001',
    'Komputer PC',
    'Hardware',
    '00000000-0000-0000-0000-000000000LAB',
    20,
    15,
    'baik'
);
```

---

## 🧪 RLS Policy Tests

### Test 1: USERS Table Access Control

```sql
-- =============================================
-- TEST 1.1: Admin can see all users
-- =============================================
SET ROLE authenticated;
SET request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000001"}'::jsonb;

SELECT COUNT(*) AS admin_should_see_all FROM users;
-- Expected: 4 (all test users)

-- =============================================
-- TEST 1.2: Dosen can see their students
-- =============================================
SET request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000002"}'::jsonb;

SELECT email, role FROM users;
-- Expected: dosen@test.com (self) + mahasiswa@test.com (student)
-- Should NOT see: admin@test.com, laboran@test.com

-- =============================================
-- TEST 1.3: Mahasiswa can see classmates + dosen
-- =============================================
SET request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000003"}'::jsonb;

SELECT email, role FROM users;
-- Expected: mahasiswa@test.com (self) + dosen@test.com (teacher)
-- Should NOT see: admin@test.com, laboran@test.com

-- =============================================
-- TEST 1.4: Laboran can only see self
-- =============================================
SET request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000004"}'::jsonb;

SELECT email, role FROM users;
-- Expected: laboran@test.com (self only)

RESET ROLE;
```

**Expected Results:**
| Role | Can See |
|------|---------|
| Admin | All 4 users |
| Dosen | Self + Student (2 users) |
| Mahasiswa | Self + Dosen (2 users) |
| Laboran | Self only (1 user) |

---

### Test 2: KUIS Table Access Control

```sql
-- =============================================
-- TEST 2.1: Dosen can see their own kuis
-- =============================================
SET ROLE authenticated;
SET request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000002"}'::jsonb;

SELECT id, judul, status FROM kuis;
-- Expected: 1 kuis (Quiz 1)

-- =============================================
-- TEST 2.2: Mahasiswa can see published kuis in their kelas
-- =============================================
SET request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000003"}'::jsonb;

SELECT id, judul, status FROM kuis;
-- Expected: 1 kuis (Quiz 1) - status = published

-- =============================================
-- TEST 2.3: Mahasiswa CANNOT see draft kuis
-- =============================================
-- First create a draft kuis (as service_role)
RESET ROLE;
INSERT INTO kuis (id, judul, kelas_id, dosen_id, status)
VALUES (
    '00000000-0000-0000-0000-000000000KU2',
    'Draft Quiz',
    '00000000-0000-0000-0000-00000000KL01',
    '00000000-0000-0000-0000-0000000000D1',
    'draft'
);

-- Now test as mahasiswa
SET ROLE authenticated;
SET request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000003"}'::jsonb;

SELECT id, judul, status FROM kuis;
-- Expected: 1 kuis (Quiz 1 only, NOT Draft Quiz)

-- =============================================
-- TEST 2.4: Dosen can see their draft kuis
-- =============================================
SET request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000002"}'::jsonb;

SELECT id, judul, status FROM kuis;
-- Expected: 2 kuis (Quiz 1 + Draft Quiz)

RESET ROLE;
```

**Expected Results:**
| Role | Published Kuis | Draft Kuis |
|------|----------------|------------|
| Dosen (owner) | ✅ Yes | ✅ Yes |
| Mahasiswa (enrolled) | ✅ Yes | ❌ No |
| Mahasiswa (not enrolled) | ❌ No | ❌ No |

---

### Test 3: NILAI Table - Privacy Protection

```sql
-- =============================================
-- TEST 3.1: Create nilai for testing
-- =============================================
RESET ROLE;
INSERT INTO nilai (
    id,
    mahasiswa_id,
    kelas_id,
    komponen,
    nilai,
    created_at
) VALUES (
    '00000000-0000-0000-0000-000000000NL1',
    '00000000-0000-0000-0000-0000000000M1',
    '00000000-0000-0000-0000-00000000KL01',
    'Kuis',
    85,
    NOW()
);

-- =============================================
-- TEST 3.2: Mahasiswa can ONLY see their own nilai
-- =============================================
SET ROLE authenticated;
SET request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000003"}'::jsonb;

SELECT mahasiswa_id, komponen, nilai FROM nilai;
-- Expected: 1 row (their own nilai)

-- Create another mahasiswa for negative test
RESET ROLE;
INSERT INTO public.users (id, email, full_name, role)
VALUES (
    '00000000-0000-0000-0000-000000000005',
    'mahasiswa2@test.com',
    'Test Mahasiswa 2',
    'mahasiswa'
);

INSERT INTO public.mahasiswa (id, user_id, nim, angkatan, program_studi)
VALUES (
    '00000000-0000-0000-0000-0000000000M2',
    '00000000-0000-0000-0000-000000000005',
    '2021010102',
    2021,
    'Teknik Informatika'
);

-- Try as mahasiswa2 (should see nothing)
SET ROLE authenticated;
SET request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000005"}'::jsonb;

SELECT mahasiswa_id, komponen, nilai FROM nilai;
-- Expected: 0 rows (not their nilai)

-- =============================================
-- TEST 3.3: Dosen can see nilai for their students
-- =============================================
SET request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000002"}'::jsonb;

SELECT mahasiswa_id, komponen, nilai FROM nilai;
-- Expected: 1 row (their student's nilai)

-- =============================================
-- TEST 3.4: Admin can see all nilai
-- =============================================
SET request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000001"}'::jsonb;

SELECT mahasiswa_id, komponen, nilai FROM nilai;
-- Expected: 1 row (all nilai)

RESET ROLE;
```

**Expected Results:**
| Role | Can See Own Nilai | Can See Other Nilai |
|------|-------------------|---------------------|
| Mahasiswa | ✅ Yes | ❌ No |
| Dosen | ❌ N/A | ✅ Yes (their students only) |
| Admin | ❌ N/A | ✅ Yes (all) |

---

### Test 4: PEMINJAMAN Approval Workflow

```sql
-- =============================================
-- TEST 4.1: Mahasiswa can create peminjaman
-- =============================================
SET ROLE authenticated;
SET request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000003"}'::jsonb;

INSERT INTO peminjaman (
    id,
    mahasiswa_id,
    inventaris_id,
    jumlah_pinjam,
    keperluan,
    tanggal_pinjam,
    tanggal_kembali_rencana,
    status
) VALUES (
    '00000000-0000-0000-0000-000000000PM1',
    '00000000-0000-0000-0000-0000000000M1',
    '00000000-0000-0000-0000-000000000INV',
    2,
    'Praktikum',
    NOW(),
    NOW() + INTERVAL '7 days',
    'pending'
);
-- Expected: SUCCESS

-- =============================================
-- TEST 4.2: Mahasiswa CANNOT approve peminjaman
-- =============================================
SET request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000003"}'::jsonb;

UPDATE peminjaman
SET status = 'approved'
WHERE id = '00000000-0000-0000-0000-000000000PM1';
-- Expected: 0 rows updated (RLS blocks this)

SELECT status FROM peminjaman WHERE id = '00000000-0000-0000-0000-000000000PM1';
-- Expected: status still = 'pending'

-- =============================================
-- TEST 4.3: Laboran CAN approve peminjaman
-- =============================================
SET request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000004"}'::jsonb;

UPDATE peminjaman
SET status = 'approved'
WHERE id = '00000000-0000-0000-0000-000000000PM1';
-- Expected: 1 row updated

SELECT status FROM peminjaman WHERE id = '00000000-0000-0000-0000-000000000PM1';
-- Expected: status = 'approved'

RESET ROLE;
```

**Expected Results:**
| Action | Mahasiswa | Laboran | Admin |
|--------|-----------|---------|-------|
| Create peminjaman | ✅ Yes | ✅ Yes | ✅ Yes |
| Update own pending | ✅ Yes | ❌ N/A | ✅ Yes |
| Approve peminjaman | ❌ No | ✅ Yes | ✅ Yes |
| View all peminjaman | ❌ No (own only) | ✅ Yes | ✅ Yes |

---

## ⚡ Performance Testing

### Test Query Performance

```sql
-- =============================================
-- PERFORMANCE TEST 1: Users query
-- =============================================
EXPLAIN ANALYZE
SELECT * FROM users
WHERE role = 'mahasiswa';

-- Check for:
-- ✓ Index usage (idx_users_role)
-- ✓ Execution time < 10ms
-- ✓ No sequential scans on large tables

-- =============================================
-- PERFORMANCE TEST 2: Kuis with RLS
-- =============================================
SET ROLE authenticated;
SET request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000003"}'::jsonb;

EXPLAIN ANALYZE
SELECT * FROM kuis;

-- Check for:
-- ✓ RLS function calls (get_mahasiswa_kelas_ids)
-- ✓ Index usage
-- ✓ Execution time acceptable

RESET ROLE;

-- =============================================
-- PERFORMANCE TEST 3: Helper function performance
-- =============================================
EXPLAIN ANALYZE
SELECT get_mahasiswa_kelas_ids();

-- Check execution time < 5ms
```

### Load Testing

```sql
-- Create 100 test kuis
INSERT INTO kuis (id, judul, kelas_id, dosen_id, status)
SELECT
    gen_random_uuid(),
    'Test Kuis ' || i,
    '00000000-0000-0000-0000-00000000KL01',
    '00000000-0000-0000-0000-0000000000D1',
    CASE WHEN random() > 0.5 THEN 'published' ELSE 'draft' END
FROM generate_series(1, 100) AS i;

-- Test query performance with larger dataset
SET ROLE authenticated;
SET request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000003"}'::jsonb;

EXPLAIN ANALYZE
SELECT * FROM kuis;
-- Check that performance is still acceptable

RESET ROLE;
```

---

## 🔐 Security Validation

### Test 1: Unauthorized Access Attempts

```sql
-- =============================================
-- SECURITY TEST 1: Mahasiswa trying to see admin data
-- =============================================
SET ROLE authenticated;
SET request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000003"}'::jsonb;

SELECT * FROM users WHERE role = 'admin';
-- Expected: 0 rows (RLS blocks)

-- =============================================
-- SECURITY TEST 2: Try to bypass RLS with UNION
-- =============================================
SELECT * FROM users WHERE role = 'mahasiswa'
UNION
SELECT * FROM users WHERE role = 'admin';
-- Expected: Only see mahasiswa role users allowed by RLS

-- =============================================
-- SECURITY TEST 3: Ownership bypass attempt
-- =============================================
-- Try to update other mahasiswa's nilai
UPDATE nilai
SET nilai = 100
WHERE mahasiswa_id != get_current_mahasiswa_id();
-- Expected: 0 rows updated (RLS blocks)

RESET ROLE;
```

### Test 2: Admin Bypass Verification

```sql
-- =============================================
-- SECURITY TEST 4: Verify admin can bypass ownership
-- =============================================
SET ROLE authenticated;
SET request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000001"}'::jsonb;

-- Admin should be able to update any nilai
UPDATE nilai
SET nilai = 90
WHERE id = '00000000-0000-0000-0000-000000000NL1';
-- Expected: 1 row updated (admin bypass works)

-- Admin should see all kuis (draft and published)
SELECT COUNT(*) FROM kuis;
-- Expected: All kuis count

RESET ROLE;
```

---

## 📊 Audit Log Testing

### Test Audit Triggers

```sql
-- =============================================
-- AUDIT TEST 1: Verify triggers fire on INSERT
-- =============================================
-- Count existing audit logs
SELECT COUNT(*) AS before_count FROM audit_logs;

-- Insert a new kuis (will trigger audit)
RESET ROLE;
INSERT INTO kuis (id, judul, kelas_id, dosen_id, status)
VALUES (
    gen_random_uuid(),
    'Audit Test Kuis',
    '00000000-0000-0000-0000-00000000KL01',
    '00000000-0000-0000-0000-0000000000D1',
    'draft'
);

-- Check audit log created
SELECT COUNT(*) AS after_count FROM audit_logs;
-- Expected: after_count = before_count + 1

-- Verify audit details
SELECT
    action,
    resource_type,
    user_role,
    new_values->>'judul' AS kuis_title
FROM audit_logs
WHERE resource_type = 'kuis'
ORDER BY created_at DESC
LIMIT 1;
-- Expected: action = 'insert', kuis_title = 'Audit Test Kuis'

-- =============================================
-- AUDIT TEST 2: Verify triggers fire on UPDATE
-- =============================================
UPDATE kuis
SET status = 'published'
WHERE judul = 'Audit Test Kuis';

-- Check audit log for update
SELECT
    action,
    resource_type,
    old_values->>'status' AS old_status,
    new_values->>'status' AS new_status
FROM audit_logs
WHERE resource_type = 'kuis' AND action = 'update'
ORDER BY created_at DESC
LIMIT 1;
-- Expected: old_status = 'draft', new_status = 'published'

-- =============================================
-- AUDIT TEST 3: Sensitive operations logging
-- =============================================
-- Update nilai (sensitive operation)
UPDATE nilai
SET nilai = 95
WHERE id = '00000000-0000-0000-0000-000000000NL1';

-- Check sensitive_operations table
SELECT
    so.operation_type,
    so.severity,
    so.requires_review,
    al.action,
    al.resource_type
FROM sensitive_operations so
INNER JOIN audit_logs al ON al.id = so.audit_log_id
WHERE al.resource_type = 'nilai'
ORDER BY so.created_at DESC
LIMIT 1;
-- Expected: severity = 'high', requires_review = TRUE
```

### Test Audit Views

```sql
-- =============================================
-- AUDIT TEST 4: Test audit views
-- =============================================

-- Recent audit activity
SELECT * FROM v_recent_audit_activity LIMIT 10;

-- Failed operations (should be empty in test)
SELECT * FROM v_failed_operations;

-- Pending sensitive reviews
SELECT * FROM v_pending_sensitive_reviews;

-- User activity summary
SELECT * FROM v_user_activity_summary;
```

---

## 🔧 Troubleshooting

### Common Issues

#### Issue 1: RLS Blocking Legitimate Access

**Symptom:** Query returns 0 rows when it should return data

**Debug Steps:**
```sql
-- 1. Check if RLS is enabled
SELECT relrowsecurity FROM pg_class WHERE relname = 'kuis';

-- 2. Check current user context
SELECT auth.uid(), get_user_role();

-- 3. List applicable policies
SELECT policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'kuis';

-- 4. Disable RLS temporarily to test (DEV ONLY)
ALTER TABLE kuis DISABLE ROW LEVEL SECURITY;
-- Run query
-- Re-enable
ALTER TABLE kuis ENABLE ROW LEVEL SECURITY;
```

#### Issue 2: Performance Degradation

**Symptom:** Queries slow after RLS enabled

**Debug Steps:**
```sql
-- 1. Check query plan
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM kuis;

-- 2. Check for missing indexes
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE tablename IN ('kelas_mahasiswa', 'kelas', 'dosen', 'mahasiswa');

-- 3. Analyze tables
ANALYZE kuis;
ANALYZE kelas_mahasiswa;
ANALYZE kelas;

-- 4. Check function performance
EXPLAIN ANALYZE SELECT get_mahasiswa_kelas_ids();
```

#### Issue 3: Audit Logs Not Creating

**Symptom:** No audit logs despite changes

**Debug Steps:**
```sql
-- 1. Check if triggers exist
SELECT tgname, tgtype, tgenabled
FROM pg_trigger
WHERE tgrelid = 'kuis'::regclass;

-- 2. Check trigger function
SELECT pg_get_functiondef('audit_trigger_function'::regproc);

-- 3. Manually test audit function
SELECT log_audit_event(
    'test',
    'kuis',
    gen_random_uuid(),
    '{"test": "old"}'::jsonb,
    '{"test": "new"}'::jsonb,
    TRUE
);

-- Check if log created
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 1;
```

---

## ✅ Test Completion Checklist

### Before Marking Week 3 Day 3 Complete

- [ ] All RLS policies enabled and verified
- [ ] 80+ policies created and active
- [ ] All 13 helper functions working
- [ ] Test users created successfully
- [ ] Test data inserted
- [ ] Users table RLS tests pass (4 tests)
- [ ] Kuis table RLS tests pass (4 tests)
- [ ] Nilai table privacy tests pass (4 tests)
- [ ] Peminjaman workflow tests pass (3 tests)
- [ ] Performance tests acceptable (<10ms for simple queries)
- [ ] Security validation tests pass (4 tests)
- [ ] Audit triggers working (3 tests)
- [ ] Audit views returning data
- [ ] No errors in logs
- [ ] Documentation updated

### Sign-Off

**Tested By:** ___________________
**Date:** ___________________
**Environment:** [ ] Dev [ ] Staging [ ] Production
**Status:** [ ] Pass [ ] Fail [ ] Needs Review

**Notes:**
```
(Add any issues, concerns, or observations here)
```

---

## 📝 Next Steps (Week 3 Day 4-5)

1. ✅ **Deploy to Staging**
   - Run migrations on staging database
   - Re-run all tests in staging environment
   - Monitor performance for 24 hours

2. ✅ **Production Deployment**
   - Schedule maintenance window
   - Run migrations on production
   - Verify RLS policies active
   - Monitor audit logs

3. ✅ **Post-Deployment**
   - Review audit logs daily (first week)
   - Monitor query performance
   - Check for failed access attempts
   - Adjust policies if needed

---

**Generated:** 2025-11-28
**System:** Sistem Praktikum PWA
**Week 3 Day 3:** RLS Testing - READY FOR EXECUTION ✅
