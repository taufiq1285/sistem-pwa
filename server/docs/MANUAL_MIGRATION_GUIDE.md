# 📘 PANDUAN MANUAL MIGRATION - JADWAL APPROVAL WORKFLOW

**Date**: 2025-12-09
**Migration File**: `supabase/migrations/99_enable_jadwal_approval_workflow.sql`
**Requirement**: Akses ke Supabase Dashboard atau Supabase CLI

---

## 🎯 OPSI MIGRATION

Pilih salah satu cara di bawah:

### **OPSI 1: Via Supabase Dashboard** (Recommended - Paling Mudah)
### **OPSI 2: Via Supabase CLI** (Untuk advanced users)
### **OPSI 3: Via psql/SQL Editor** (Manual query by query)

---

## 🌐 OPSI 1: VIA SUPABASE DASHBOARD (RECOMMENDED)

### Step 1: Login ke Supabase Dashboard
1. Buka https://supabase.com/dashboard
2. Login dengan akun Anda
3. Pilih project: **sistem-praktikum-pwa**

### Step 2: Buka SQL Editor
1. Di sidebar kiri, klik **"SQL Editor"**
2. Klik **"New query"**

### Step 3: Copy-Paste Migration SQL
1. Buka file: `supabase/migrations/99_enable_jadwal_approval_workflow.sql`
2. **Copy semua isi file** (Ctrl+A, Ctrl+C)
3. **Paste** ke SQL Editor di Supabase Dashboard
4. Klik tombol **"Run"** atau tekan `Ctrl+Enter`

### Step 4: Verify Success
Jika berhasil, Anda akan lihat output:

```
✓ CREATE INDEX
✓ ALTER TABLE
✓ DROP POLICY (jika ada)
✓ CREATE POLICY (4x)
```

### Step 5: Verification Queries
Run query ini untuk memastikan migration berhasil:

```sql
-- 1. Check default value changed
SELECT column_default
FROM information_schema.columns
WHERE table_name = 'jadwal_praktikum'
  AND column_name = 'is_active';
-- Expected: 'false'

-- 2. Check index exists
SELECT indexname
FROM pg_indexes
WHERE tablename = 'jadwal_praktikum'
  AND indexname = 'idx_jadwal_pending';
-- Expected: 1 row (idx_jadwal_pending)

-- 3. Check RLS policies
SELECT policyname
FROM pg_policies
WHERE tablename = 'jadwal_praktikum'
ORDER BY policyname;
-- Expected: 4 policies
-- - jadwal_select_admin
-- - jadwal_select_dosen
-- - jadwal_select_laboran
-- - jadwal_select_mahasiswa

-- 4. Check existing data tidak terpengaruh
SELECT is_active, COUNT(*)
FROM jadwal_praktikum
GROUP BY is_active;
-- Expected: Semua existing jadwal tetap is_active = true
```

---

## 💻 OPSI 2: VIA SUPABASE CLI

### Prerequisites
```bash
# Pastikan Supabase CLI sudah terinstall
npx supabase --version

# Pastikan sudah login
npx supabase login
```

### Step 1: Link ke Remote Project
```bash
cd "F:/tes 9/sistem-praktikum-pwa"

# Link ke remote project
npx supabase link --project-ref YOUR_PROJECT_REF
```

### Step 2: Push Migration
```bash
# Push semua pending migrations
npx supabase db push

# Atau push specific migration
npx supabase db push --include 99_enable_jadwal_approval_workflow
```

### Step 3: Verify
```bash
# Check migration history
npx supabase migration list

# Expected output:
# ✓ 99_enable_jadwal_approval_workflow (applied)
```

---

## 🔧 OPSI 3: VIA PSQL/SQL EDITOR (Manual Step-by-Step)

Jika Anda ingin run query satu per satu (untuk debugging):

### Step 1: Add Index
```sql
CREATE INDEX IF NOT EXISTS idx_jadwal_pending
ON jadwal_praktikum(is_active, created_at DESC)
WHERE is_active = false;
```

**Verify:**
```sql
SELECT indexname FROM pg_indexes
WHERE tablename = 'jadwal_praktikum' AND indexname = 'idx_jadwal_pending';
```

### Step 2: Change Default Value
```sql
ALTER TABLE jadwal_praktikum
ALTER COLUMN is_active SET DEFAULT false;
```

**Verify:**
```sql
SELECT column_default FROM information_schema.columns
WHERE table_name = 'jadwal_praktikum' AND column_name = 'is_active';
-- Expected: 'false'
```

### Step 3: Drop Old Policy
```sql
DROP POLICY IF EXISTS "jadwal_praktikum_select_all" ON jadwal_praktikum;
```

### Step 4: Create Admin Policy
```sql
CREATE POLICY "jadwal_select_admin" ON jadwal_praktikum
    FOR SELECT
    USING (is_admin());
```

### Step 5: Create Laboran Policy
```sql
CREATE POLICY "jadwal_select_laboran" ON jadwal_praktikum
    FOR SELECT
    USING (is_laboran());
```

### Step 6: Create Dosen Policy
```sql
CREATE POLICY "jadwal_select_dosen" ON jadwal_praktikum
    FOR SELECT
    USING (
        is_dosen()
        AND (
            is_active = true
            OR (
                is_active = false
                AND kelas_id IN (
                    SELECT id FROM kelas WHERE dosen_id = get_current_dosen_id()
                )
            )
        )
    );
```

### Step 7: Create Mahasiswa Policy
```sql
CREATE POLICY "jadwal_select_mahasiswa" ON jadwal_praktikum
    FOR SELECT
    USING (
        is_mahasiswa()
        AND is_active = true
        AND kelas_id = ANY(get_mahasiswa_kelas_ids())
    );
```

### Step 8: Final Verification
```sql
-- Check all policies created
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'jadwal_praktikum'
ORDER BY policyname;

-- Expected: 4 SELECT policies
```

---

## ✅ POST-MIGRATION CHECKLIST

Setelah migration selesai, pastikan:

### Database Level
- [ ] Default `is_active` sekarang `false`
  ```sql
  SELECT column_default FROM information_schema.columns
  WHERE table_name = 'jadwal_praktikum' AND column_name = 'is_active';
  ```

- [ ] Index `idx_jadwal_pending` sudah dibuat
  ```sql
  SELECT indexname FROM pg_indexes
  WHERE tablename = 'jadwal_praktikum' AND indexname LIKE '%pending%';
  ```

- [ ] RLS policies sudah updated (4 policies)
  ```sql
  SELECT COUNT(*) FROM pg_policies WHERE tablename = 'jadwal_praktikum';
  -- Expected: Minimal 4 SELECT policies
  ```

- [ ] Existing jadwal tetap aktif
  ```sql
  SELECT is_active, COUNT(*) FROM jadwal_praktikum GROUP BY is_active;
  -- Expected: Semua existing = true (if any exist)
  ```

### Application Level
- [ ] Code changes sudah di commit
  ```bash
  git status
  # Should show: modified src/lib/api/jadwal.api.ts
  ```

- [ ] Type check passed
  ```bash
  npm run type-check
  # Expected: No errors
  ```

---

## 🧪 TESTING GUIDE

### Test 1: Create New Jadwal (Dosen)
```sql
-- Manual test via SQL
INSERT INTO jadwal_praktikum (
    kelas_id,
    laboratorium_id,
    hari,
    jam_mulai,
    jam_selesai,
    topik,
    tanggal_praktikum
) VALUES (
    'YOUR_KELAS_ID',
    'YOUR_LAB_ID',
    'senin',
    '08:00',
    '10:00',
    'Test Approval Workflow',
    CURRENT_DATE + INTERVAL '7 days'
);

-- Check: is_active should be FALSE
SELECT id, topik, is_active
FROM jadwal_praktikum
WHERE topik = 'Test Approval Workflow';
-- Expected: is_active = false
```

### Test 2: Approve Jadwal (Laboran)
```sql
-- Find pending jadwal
SELECT id, topik, is_active
FROM jadwal_praktikum
WHERE is_active = false;

-- Approve (simulate laboran action)
UPDATE jadwal_praktikum
SET is_active = true, updated_at = NOW()
WHERE id = 'YOUR_JADWAL_ID' AND is_active = false;

-- Verify approved
SELECT id, topik, is_active
FROM jadwal_praktikum
WHERE id = 'YOUR_JADWAL_ID';
-- Expected: is_active = true
```

### Test 3: RLS Policy Test
```sql
-- Test as mahasiswa (should only see approved)
SET ROLE authenticated;
SET request.jwt.claims TO '{"role": "mahasiswa"}';

SELECT COUNT(*) FROM jadwal_praktikum WHERE is_active = false;
-- Expected: 0 (mahasiswa tidak bisa lihat pending)

SELECT COUNT(*) FROM jadwal_praktikum WHERE is_active = true;
-- Expected: > 0 (mahasiswa bisa lihat approved)

RESET ROLE;
```

---

## 🔄 ROLLBACK PROCEDURE

Jika ada masalah, rollback dengan query ini:

```sql
-- 1. Restore default to true
ALTER TABLE jadwal_praktikum
ALTER COLUMN is_active SET DEFAULT true;

-- 2. Drop new index
DROP INDEX IF EXISTS idx_jadwal_pending;

-- 3. Restore old policy
DROP POLICY IF EXISTS "jadwal_select_admin" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_select_laboran" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_select_dosen" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_select_mahasiswa" ON jadwal_praktikum;

CREATE POLICY "jadwal_praktikum_select_all" ON jadwal_praktikum
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- 4. Approve all pending jadwal (if any)
UPDATE jadwal_praktikum
SET is_active = true
WHERE is_active = false;

-- 5. Verify rollback
SELECT column_default FROM information_schema.columns
WHERE table_name = 'jadwal_praktikum' AND column_name = 'is_active';
-- Expected: 'true'
```

---

## ⚠️ TROUBLESHOOTING

### Issue 1: "policy already exists"
**Solution:**
```sql
-- Drop semua policies dulu
DROP POLICY IF EXISTS "jadwal_select_admin" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_select_laboran" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_select_dosen" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_select_mahasiswa" ON jadwal_praktikum;
DROP POLICY IF EXISTS "jadwal_praktikum_select_all" ON jadwal_praktikum;

-- Kemudian run ulang migration
```

### Issue 2: "function get_current_dosen_id does not exist"
**Check:**
```sql
-- Verify function exists
SELECT proname FROM pg_proc WHERE proname = 'get_current_dosen_id';

-- If not exists, check migration files:
-- supabase/migrations/03_functions.sql
```

### Issue 3: "function get_mahasiswa_kelas_ids does not exist"
**Check:**
```sql
-- Verify function exists
SELECT proname FROM pg_proc WHERE proname = 'get_mahasiswa_kelas_ids';
```

### Issue 4: Migration tidak muncul di history
**Solution:**
```bash
# Repair migration history
npx supabase migration repair --status applied 99
```

---

## 📞 SUPPORT

Jika ada error saat migration:

1. **Screenshot error message**
2. **Copy full error text**
3. **Check verification queries** (di atas)
4. **Run rollback** jika perlu
5. Contact support atau tanyakan di sini

---

## ✅ SUMMARY

### Quick Steps (Supabase Dashboard):
```
1. Login → supabase.com/dashboard
2. Open SQL Editor
3. Copy-paste isi file: 99_enable_jadwal_approval_workflow.sql
4. Run query (Ctrl+Enter)
5. Verify dengan verification queries
6. Done! ✅
```

### Estimated Time:
- **5 minutes** (via Dashboard)
- **10 minutes** (via CLI)
- **15 minutes** (step-by-step manual)

---

**File**: `MANUAL_MIGRATION_GUIDE.md`
**Created**: 2025-12-09
**Status**: ✅ Ready for manual execution
