# Analisis Sistem Kehadiran Dosen

## 📊 1. DATA MODEL & DATABASE SCHEMA

### Tabel yang Terlibat

#### 1.1. `mata_kuliah` (Master Data)
```sql
CREATE TABLE mata_kuliah (
    id UUID PRIMARY KEY,
    kode_mk VARCHAR(50) UNIQUE NOT NULL,
    nama_mk VARCHAR(255) NOT NULL,
    sks INTEGER,
    semester INTEGER,
    program_studi VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```
**Purpose:** Master data mata kuliah yang dibuat oleh admin.

---

#### 1.2. `kelas` (Class Management)
```sql
CREATE TABLE kelas (
    id UUID PRIMARY KEY,
    mata_kuliah_id UUID NOT NULL,          -- FK to mata_kuliah
    dosen_id UUID NOT NULL,                -- FK to dosen
    kode_kelas VARCHAR(50),
    nama_kelas VARCHAR(100) NOT NULL,
    tahun_ajaran VARCHAR(20) NOT NULL,
    semester_ajaran INTEGER NOT NULL,
    kuota INTEGER DEFAULT 40,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    FOREIGN KEY (mata_kuliah_id) REFERENCES mata_kuliah(id) ON DELETE CASCADE,
    FOREIGN KEY (dosen_id) REFERENCES dosen(id) ON DELETE CASCADE
);
```
**Purpose:** Kelas untuk satu mata kuliah, diajar oleh satu dosen.

**CRITICAL DEPENDENCY:**
- **HARUS punya `mata_kuliah_id` yang valid** ← Ini masalahnya saat ini!
- **HARUS punya `dosen_id`** (opsional dalam implementasi sekarang)

---

#### 1.3. `kelas_mahasiswa` (Class Enrollment)
```sql
CREATE TABLE kelas_mahasiswa (
    id UUID PRIMARY KEY,
    kelas_id UUID NOT NULL,                -- FK to kelas
    mahasiswa_id UUID NOT NULL,            -- FK to mahasiswa
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,

    UNIQUE (kelas_id, mahasiswa_id),
    FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE CASCADE,
    FOREIGN KEY (mahasiswa_id) REFERENCES mahasiswa(id) ON DELETE CASCADE
);
```
**Purpose:** Mahasiswa yang terdaftar di kelas tertentu.

---

#### 1.4. `jadwal_praktikum` (Schedule - OPTIONAL)
```sql
CREATE TABLE jadwal_praktikum (
    id UUID PRIMARY KEY,
    kelas_id UUID NOT NULL,                -- FK to kelas
    laboratorium_id UUID NOT NULL,
    hari day_of_week NOT NULL,
    jam_mulai TIME NOT NULL,
    jam_selesai TIME NOT NULL,
    tanggal_praktikum DATE,                -- Specific date
    topik VARCHAR(255),
    is_active BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'approved',
    created_at TIMESTAMPTZ DEFAULT NOW(),

    FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE CASCADE
);
```
**Purpose:** Jadwal praktikum per kelas (OPTIONAL - tidak wajib untuk input kehadiran).

---

#### 1.5. `kehadiran` (Attendance Records) ⚠️ MISMATCH DETECTED

**Schema di Database (dari migration):**
```sql
CREATE TABLE kehadiran (
    id UUID PRIMARY KEY,
    jadwal_id UUID NOT NULL,               -- FK to jadwal_praktikum
    mahasiswa_id UUID NOT NULL,            -- FK to mahasiswa
    status VARCHAR(20) NOT NULL DEFAULT 'hadir',
    waktu_check_in TIMESTAMPTZ,
    waktu_check_out TIMESTAMPTZ,
    keterangan TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (jadwal_id, mahasiswa_id),      -- One attendance per mahasiswa per jadwal
    FOREIGN KEY (jadwal_id) REFERENCES jadwal_praktikum(id) ON DELETE CASCADE,
    FOREIGN KEY (mahasiswa_id) REFERENCES mahasiswa(id) ON DELETE CASCADE
);
```

**Kode Aplikasi (kehadiran.api.ts) MENGGUNAKAN:**
```typescript
{
  kelas_id: string,      // ← TIDAK ADA DI DATABASE!
  tanggal: string,       // ← TIDAK ADA DI DATABASE!
  mahasiswa_id: string,
  status: KehadiranStatus,
  keterangan?: string
}
```

**⚠️ CRITICAL ISSUE DETECTED:**
- **Kode aplikasi menggunakan `kelas_id` + `tanggal`**
- **Database schema menggunakan `jadwal_id`**
- **Ini adalah MISMATCH yang menyebabkan error!**

---

## 🔄 2. FLOW SISTEM KEHADIRAN (AS-IS)

### 2.1. User Flow (UI)

```
[Dosen Login] → [Buka Halaman Kehadiran]
       ↓
[Step 1: Pilih Mata Kuliah] ← Dropdown terisi dari getMyKelas()
       ↓
[Step 2: Pilih Kelas] ← Filter kelas by mata kuliah
       ↓
[Step 3: Pilih Tanggal] ← Input date
       ↓
[Load Mahasiswa] ← Query kelas_mahasiswa by kelas_id
       ↓
[Input Status Kehadiran] ← Hadir/Izin/Sakit/Alpha + Keterangan
       ↓
[Simpan Kehadiran] ← Call saveKehadiranBulk()
```

### 2.2. Data Flow

#### A. Load Mata Kuliah (KehadiranPage.tsx:162)
```typescript
loadMataKuliah() {
  1. Call getMyKelas()
     ↓
  2. Filter unique mata_kuliah dari kelas data
     ↓
  3. Set mataKuliahList state
     ↓
  4. Populate dropdown "Mata Kuliah"
}
```

**Query Chain:**
```sql
-- getMyKelas() di dosen.api.ts:321
SELECT id, kode_kelas, nama_kelas, tahun_ajaran,
       semester_ajaran, mata_kuliah_id
FROM kelas
WHERE is_active = true;

-- Then separate query:
SELECT id, kode_mk, nama_mk
FROM mata_kuliah
WHERE id IN (<mata_kuliah_ids dari kelas>);

-- Manual join di JavaScript
```

#### B. Load Kelas (KehadiranPage.tsx:215)
```typescript
loadKelas(mataKuliahId) {
  1. Get all kelas via getMyKelas()
     ↓
  2. Filter by selected mata_kuliah_id
     ↓
  3. Set kelasList state
     ↓
  4. Populate dropdown "Kelas"
}
```

#### C. Load Mahasiswa (KehadiranPage.tsx:253)
```typescript
loadMahasiswaForKehadiran(kelasId) {
  1. Query kelas_mahasiswa:
     SELECT mahasiswa_id, mahasiswa(id, nim, user_id)
     FROM kelas_mahasiswa
     WHERE kelas_id = ? AND is_active = true
     ↓
  2. Query users for names:
     SELECT id, full_name
     FROM users
     WHERE id IN (user_ids)
     ↓
  3. Map to AttendanceRecord[] (default status: "hadir")
     ↓
  4. Set attendanceRecords state
     ↓
  5. Render table with mahasiswa list
}
```

#### D. Save Kehadiran (KehadiranPage.tsx:322)
```typescript
handleSaveAttendance() {
  1. Prepare bulkData:
     {
       kelas_id: selectedKelas,      ← PROBLEM: DB tidak punya kolom ini!
       tanggal: selectedTanggal,     ← PROBLEM: DB tidak punya kolom ini!
       kehadiran: [{
         mahasiswa_id,
         status,
         keterangan
       }]
     }
     ↓
  2. Call saveKehadiranBulk(bulkData)
     ↓
  3. API tries to INSERT/UPDATE with kelas_id + tanggal
     ↓
  4. ⚠️ ERROR: Column 'kelas_id' doesn't exist in kehadiran table
}
```

---

## 🚨 3. MASALAH YANG DITEMUKAN

### 3.1. Schema Mismatch (CRITICAL)

**Problem:**
- Kode aplikasi menggunakan `kelas_id` + `tanggal` untuk kehadiran
- Database menggunakan `jadwal_id` (FK ke jadwal_praktikum)

**Impact:**
- Fitur kehadiran **TIDAK AKAN BERFUNGSI** saat save
- Error: `column "kelas_id" of relation "kehadiran" does not exist`

**Root Cause:**
- Perubahan desain sistem tanpa migration database
- Kode aplikasi di-update tapi schema tidak

**Possible Solutions:**

**Option A: Update Database Schema (Recommended)**
```sql
-- Add missing columns to kehadiran table
ALTER TABLE kehadiran
ADD COLUMN kelas_id UUID REFERENCES kelas(id),
ADD COLUMN tanggal DATE;

-- Make jadwal_id nullable (untuk backward compatibility)
ALTER TABLE kehadiran
ALTER COLUMN jadwal_id DROP NOT NULL;

-- Create new unique constraint
ALTER TABLE kehadiran
DROP CONSTRAINT kehadiran_unique;

ALTER TABLE kehadiran
ADD CONSTRAINT kehadiran_unique_kelas_tanggal
UNIQUE (kelas_id, mahasiswa_id, tanggal);

-- Create index for performance
CREATE INDEX idx_kehadiran_kelas_tanggal
ON kehadiran(kelas_id, tanggal);
```

**Option B: Update Aplikasi Code (Alternative)**
- Ubah kode aplikasi untuk create jadwal_praktikum dulu
- Baru create kehadiran dengan jadwal_id
- Lebih kompleks, tidak sesuai UX saat ini

---

### 3.2. Data Integrity Issue

**Problem:**
- Kelas tidak punya `mata_kuliah_id` (NULL)
- Ditemukan: `kelas.id = 'df6527c4-...'` dengan `mata_kuliah_id = NULL`

**Impact:**
- Dropdown "Mata Kuliah" kosong
- Tidak bisa load kelas untuk kehadiran

**Root Cause:**
- Kelas dibuat tanpa assign mata kuliah
- Tidak ada NOT NULL constraint di `mata_kuliah_id`

**Solution:**
```sql
-- Fix existing data
UPDATE kelas
SET mata_kuliah_id = (SELECT id FROM mata_kuliah LIMIT 1)
WHERE mata_kuliah_id IS NULL AND is_active = true;

-- Prevent future issues
ALTER TABLE kelas
ALTER COLUMN mata_kuliah_id SET NOT NULL;
```

---

### 3.3. Business Logic Issues

**Issue 1: Jadwal Praktikum Requirement**

Current schema REQUIRES `jadwal_id`, tapi UX tidak meminta user create jadwal dulu.

**Scenarios:**
1. ✅ **Happy Path:** Ada jadwal → Input kehadiran via jadwal
2. ❌ **Current Flow:** Tidak ada jadwal → Input kehadiran via kelas + tanggal → **BREAKS**

**Issue 2: Duplicate Attendance Prevention**

Schema: `UNIQUE (jadwal_id, mahasiswa_id)`
Aplikasi: Checks `UNIQUE (kelas_id, tanggal, mahasiswa_id)`

**Problem:** Constraint mismatch!

---

## 📐 4. ARCHITECTURE ANALYSIS

### 4.1. Current Architecture (Broken)

```
┌─────────────────────┐
│   KehadiranPage     │
│   (UI Component)    │
└──────────┬──────────┘
           │
           │ 1. getMyKelas()
           │    └─> Get kelas + mata_kuliah
           │
           │ 2. loadMahasiswa()
           │    └─> Get mahasiswa by kelas_id
           │
           │ 3. saveKehadiranBulk()
           │    └─> Save with kelas_id + tanggal
           ↓
┌─────────────────────┐
│   dosen.api.ts      │
│   kehadiran.api.ts  │
└──────────┬──────────┘
           │
           │ SQL Queries
           ↓
┌─────────────────────┐
│   Supabase DB       │
│                     │
│  ❌ kehadiran table  │
│     (no kelas_id,   │
│      no tanggal)    │
└─────────────────────┘
```

**Problem:** Kode mengharapkan kolom yang tidak ada!

### 4.2. Expected Architecture (Design Intent)

**Two Possible Designs:**

#### Design A: Jadwal-Based (Original Schema)
```
User selects: Kelas → Jadwal Praktikum → Input Kehadiran
Database: kehadiran.jadwal_id
Constraint: UNIQUE(jadwal_id, mahasiswa_id)
```

#### Design B: Date-Based (Current Code)
```
User selects: Kelas → Tanggal → Input Kehadiran
Database: kehadiran.kelas_id + kehadiran.tanggal
Constraint: UNIQUE(kelas_id, mahasiswa_id, tanggal)
```

**Current State:** Hybrid/Broken - Code uses Design B, DB uses Design A!

---

## 🎯 5. DEPENDENCIES & CONSTRAINTS

### Data Dependencies

```
mata_kuliah (MASTER)
    ↓ (FK: mata_kuliah_id)
kelas ← MUST have valid mata_kuliah_id
    ↓ (FK: kelas_id)
    ├─> kelas_mahasiswa (enrollment)
    ├─> jadwal_praktikum (schedule - optional)
    └─> kehadiran (attendance - MISMATCH!)
```

### Business Rules

1. **Mata Kuliah:**
   - Created by Admin only
   - Cannot be deleted if has kelas

2. **Kelas:**
   - MUST belong to one mata_kuliah
   - MUST have dosen assigned (in schema, optional in current code)
   - Can have multiple mahasiswa enrolled

3. **Kehadiran (Intended):**
   - One record per mahasiswa per kelas per tanggal
   - Status: hadir, izin, sakit, alpha
   - Optional keterangan

4. **Kehadiran (Actual Schema):**
   - One record per mahasiswa per jadwal
   - Requires jadwal_praktikum exists first

---

## 🔍 6. API ANALYSIS

### getMyKelas() - src/lib/api/dosen.api.ts:314

**Purpose:** Get all active kelas with mata kuliah info

**Current Implementation:**
```typescript
1. Query kelas table (select id, nama, mata_kuliah_id)
2. Extract unique mata_kuliah_ids
3. Query mata_kuliah table separately
4. Manual join in JavaScript
5. Return KelasWithStats[]
```

**Returns:**
```typescript
{
  id: string,
  nama_kelas: string,
  mata_kuliah_id: string,      // ← Can be NULL! (bug)
  mata_kuliah_kode: string,    // ← Can be undefined! (bug)
  mata_kuliah_nama: string,    // ← Can be undefined! (bug)
  totalMahasiswa: number
}
```

**Issues:**
- ✅ Manual join works (robust)
- ❌ No validation for NULL mata_kuliah_id
- ❌ Returns all kelas (ignores dosen ownership - by design?)

---

### saveKehadiranBulk() - src/lib/api/kehadiran.api.ts:201

**Purpose:** Save attendance for all students in a class on a date

**Current Implementation:**
```typescript
async function saveKehadiranBulk(data: BulkKehadiranData) {
  // 1. Try to use kelas_id if provided
  const identifier = data.kelas_id || data.jadwal_id;
  const identifierType = data.kelas_id ? 'kelas_id' : 'jadwal_id';

  // 2. Build records
  const records = data.kehadiran.map(item => ({
    [identifierType]: identifier,  // ← kelas_id doesn't exist!
    mahasiswa_id: item.mahasiswa_id,
    status: item.status,
    keterangan: item.keterangan
  }));

  // 3. Check existing by identifier + tanggal
  const existing = await supabase
    .from("kehadiran")
    .select("id, mahasiswa_id")
    .eq(identifierType, identifier)
    .eq("tanggal", data.tanggal);  // ← tanggal doesn't exist!

  // 4. Insert/Update
  // ❌ This will FAIL because columns don't exist!
}
```

**Issues:**
- ❌ Uses `kelas_id` column that doesn't exist
- ❌ Uses `tanggal` column that doesn't exist
- ❌ Will throw PostgreSQL error on save

---

## 💡 7. RECOMMENDED SOLUTIONS

### Solution 1: Add Missing Columns to Database (RECOMMENDED)

**Migration File:** `add_kelas_id_tanggal_to_kehadiran.sql`

```sql
-- Step 1: Add columns
ALTER TABLE kehadiran
ADD COLUMN IF NOT EXISTS kelas_id UUID REFERENCES kelas(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS tanggal DATE;

-- Step 2: Make jadwal_id nullable (for backward compat)
ALTER TABLE kehadiran
ALTER COLUMN jadwal_id DROP NOT NULL;

-- Step 3: Migrate existing data (if any)
UPDATE kehadiran k
SET kelas_id = j.kelas_id,
    tanggal = j.tanggal_praktikum
FROM jadwal_praktikum j
WHERE k.jadwal_id = j.id
  AND k.kelas_id IS NULL;

-- Step 4: Create new unique constraint
ALTER TABLE kehadiran
DROP CONSTRAINT IF EXISTS kehadiran_unique;

ALTER TABLE kehadiran
ADD CONSTRAINT kehadiran_unique_kelas_tanggal
UNIQUE NULLS NOT DISTINCT (kelas_id, mahasiswa_id, tanggal);

-- Step 5: Add indexes
CREATE INDEX IF NOT EXISTS idx_kehadiran_kelas_id
ON kehadiran(kelas_id);

CREATE INDEX IF NOT EXISTS idx_kehadiran_tanggal
ON kehadiran(tanggal);

CREATE INDEX IF NOT EXISTS idx_kehadiran_kelas_tanggal
ON kehadiran(kelas_id, tanggal);

-- Step 6: Add check constraint
ALTER TABLE kehadiran
ADD CONSTRAINT kehadiran_identifier_check
CHECK (
  (jadwal_id IS NOT NULL AND kelas_id IS NULL AND tanggal IS NULL) OR
  (jadwal_id IS NULL AND kelas_id IS NOT NULL AND tanggal IS NOT NULL)
);

COMMENT ON CONSTRAINT kehadiran_identifier_check ON kehadiran IS
'Ensure either jadwal_id OR (kelas_id + tanggal) is provided, not both';
```

**Pros:**
- ✅ Minimal code changes
- ✅ Supports both jadwal-based and date-based attendance
- ✅ Backward compatible with existing data

**Cons:**
- ⚠️ Requires database migration
- ⚠️ Need to handle both patterns in queries

---

### Solution 2: Fix Existing Data Issues

```sql
-- Fix kelas without mata_kuliah_id
UPDATE kelas
SET mata_kuliah_id = (
  SELECT id FROM mata_kuliah
  WHERE kode_mk = 'DEFAULT' -- or first available
  LIMIT 1
)
WHERE mata_kuliah_id IS NULL;

-- Add NOT NULL constraint after fixing data
ALTER TABLE kelas
ALTER COLUMN mata_kuliah_id SET NOT NULL;
```

---

## 📋 8. SUMMARY & ACTION ITEMS

### Current State
- ❌ **Broken:** Save kehadiran tidak berfungsi (schema mismatch)
- ❌ **Broken:** Dropdown mata kuliah kosong (data integrity issue)
- ✅ **Working:** Load kelas dan mahasiswa (setelah fix getMyKelas)

### Root Causes
1. **Schema mismatch** between code and database
2. **Data integrity issue** (kelas without mata_kuliah_id)
3. **Design confusion** (jadwal-based vs date-based)

### Recommended Actions

**URGENT (Required for Basic Function):**
1. ✅ Fix `getMyKelas()` to handle NULL mata_kuliah (DONE)
2. 🔴 Run `FIX_KELAS_BROKEN_FK.sql` to fix data
3. 🔴 Run migration to add `kelas_id` + `tanggal` columns to kehadiran
4. 🔴 Update RLS policies for new columns

**IMPORTANT (Prevent Future Issues):**
5. Add NOT NULL constraint to `kelas.mata_kuliah_id`
6. Add validation in UI forms
7. Add database-level CHECK constraints

**NICE TO HAVE:**
8. Add comprehensive error handling
9. Add logging for debugging
10. Write integration tests

---

## 📊 9. TESTING CHECKLIST

After fixes, verify:

- [ ] Can create mata kuliah via admin
- [ ] Can create kelas with mata kuliah assigned
- [ ] Can enroll mahasiswa to kelas
- [ ] Dropdown mata kuliah shows data
- [ ] Dropdown kelas shows data after selecting mata kuliah
- [ ] Mahasiswa list loads for selected kelas
- [ ] Can change attendance status
- [ ] Can add keterangan
- [ ] **Can save kehadiran without error**
- [ ] **Saved data appears in database correctly**
- [ ] Can view saved kehadiran
- [ ] Can update existing kehadiran

---

## 🎓 LEARNING POINTS

1. **Schema-Code Sync:** Always keep database schema in sync with application code
2. **Migration Strategy:** Use proper migration files for schema changes
3. **Data Validation:** Add constraints early to prevent bad data
4. **Testing:** Test full flow end-to-end, not just individual functions
5. **Documentation:** Document design decisions and data model clearly

---

**Created:** 2024-12-19
**Author:** Claude Code Analysis
**Status:** Analysis Complete - Awaiting User Decision on Solution Path
