# FASE 3: Analisis Database untuk Optimistic Locking

**Dibuat:** 2025-12-12
**Status:** READY FOR IMPLEMENTATION

---

## 📊 HASIL ANALISIS DATABASE

### ✅ Tabel yang Sudah Ada

Berdasarkan `database.types.ts`, berikut tabel yang ada di database:

| Tabel | Keterangan | Sudah Ada _version? |
|-------|------------|---------------------|
| `kuis` | Quiz/Kuis | ✅ **YA** (kolom `version`) |
| `attempt_kuis` | Attempt kuis mahasiswa | ❌ TIDAK |
| `jawaban` | Jawaban individual | ❌ TIDAK |
| `soal` | Soal kuis | ❌ TIDAK |
| `nilai` | Nilai mahasiswa | ❌ TIDAK |
| `materi` | Materi kuliah | ❌ TIDAK |
| `kehadiran` | Kehadiran/Presensi | ❌ TIDAK |
| `conflict_log` | Log konflik | ✅ **SUDAH ADA** |

### ⚠️ PENEMUAN PENTING

1. **Tabel `kuis` sudah punya kolom `version`** (line 699)
   - Kemungkinan sudah ada implementasi versioning
   - Kita akan rename ke `_version` untuk konsistensi

2. **Tabel `conflict_log` sudah ada** (line 190-256)
   - Struktur berbeda dari migration Fase 3
   - Perlu disesuaikan atau di-skip

3. **Perbedaan nama tabel:**
   - Offline types menyebut `kuis_jawaban`, tapi database aslinya `jawaban`
   - Offline types menyebut `kuis_soal`, tapi database aslinya `soal`

---

## 🎯 TABEL PRIORITAS UNTUK OPTIMISTIC LOCKING

### HIGH PRIORITY (Sering di-update offline)

#### 1. **attempt_kuis** - Quiz Attempts
- **Alasan:** Mahasiswa mengerjakan kuis offline, auto-save setiap 30 detik
- **Update Frequency:** SANGAT TINGGI
- **Conflict Risk:** TINGGI (banyak mahasiswa mengerjakan bersamaan)
- **Fields yang perlu dilindungi:**
  - `auto_save_data` - draft jawaban
  - `status` - in_progress/submitted
  - `started_at`, `submitted_at`

#### 2. **jawaban** - Individual Answers
- **Alasan:** Jawaban per soal, bisa di-update berkali-kali
- **Update Frequency:** SANGAT TINGGI
- **Conflict Risk:** TINGGI
- **Fields yang perlu dilindungi:**
  - `jawaban_mahasiswa` - jawaban mahasiswa
  - `is_auto_saved` - flag auto-save
  - `saved_at` - waktu save

### MEDIUM PRIORITY

#### 3. **nilai** - Grades
- **Alasan:** Dosen update nilai
- **Update Frequency:** SEDANG
- **Conflict Risk:** RENDAH (hanya dosen yang update)
- **Fields yang perlu dilindungi:**
  - `nilai_kuis`, `nilai_tugas`, dll
  - `nilai_akhir`

#### 4. **kehadiran** - Attendance
- **Alasan:** Check-in/check-out saat praktikum
- **Update Frequency:** SEDANG
- **Conflict Risk:** SEDANG
- **Fields yang perlu dilindungi:**
  - `status` - hadir/tidak
  - `waktu_check_in`, `waktu_check_out`

### LOW PRIORITY (Jarang di-update)

#### 5. **materi** - Course Materials
- **Alasan:** Mostly read-only, jarang di-edit
- **Update Frequency:** RENDAH
- **Conflict Risk:** RENDAH

#### 6. **kuis** - Quiz Definition
- **Alasan:** Sudah punya `version` column
- **Update Frequency:** RENDAH (setelah published)
- **Conflict Risk:** RENDAH

---

## 🔧 REKOMENDASI KONFIGURASI

### Pilihan 1: MINIMAL (Recommended untuk Start)

Hanya tabel yang BENAR-BENAR sering conflict:

```sql
v_tables TEXT[] := ARRAY['attempt_kuis', 'jawaban'];
```

**Keuntungan:**
- Minimal impact
- Fokus pada masalah utama (quiz offline)
- Mudah di-test

**Kerugian:**
- Tidak cover nilai dan kehadiran

---

### Pilihan 2: STANDARD (Recommended)

Tabel critical yang sering di-update:

```sql
v_tables TEXT[] := ARRAY['attempt_kuis', 'jawaban', 'nilai', 'kehadiran'];
```

**Keuntungan:**
- Cover semua use case penting
- Balance antara safety dan coverage
- Masih manageable untuk testing

**Kerugian:**
- Lebih banyak tabel untuk di-test

---

### Pilihan 3: COMPREHENSIVE

Semua tabel yang di-sync offline:

```sql
v_tables TEXT[] := ARRAY['attempt_kuis', 'jawaban', 'soal', 'nilai', 'kehadiran', 'materi'];
```

**Keuntungan:**
- Full coverage
- Future-proof

**Kerugian:**
- Overhead lebih besar
- Testing lebih kompleks

---

## 📋 BUSINESS RULES PER TABEL

### attempt_kuis
```typescript
{
  entity: "attempt_kuis",
  protectedFields: [
    "mahasiswa_id",        // Tidak boleh berubah
    "kuis_id",             // Tidak boleh berubah
    "started_at",          // Waktu mulai tetap
    "auto_save_data",      // Data mahasiswa prioritas
  ],
  serverAuthoritativeFields: [
    "status",              // Server yang tentukan final status
    "total_score",         // Server yang hitung score
    "is_passed",           // Server yang tentukan lulus/tidak
  ],
  autoResolveIfClient: ["auto_save_data"], // Selalu gunakan data mahasiswa
  manualReviewIf: (local, remote) => {
    // Manual review jika ada submit conflict
    if (local.status === "submitted" && remote.status === "submitted") {
      return "Cannot have duplicate submission";
    }
  }
}
```

### jawaban
```typescript
{
  entity: "jawaban",
  protectedFields: [
    "mahasiswa_id",        // Tidak boleh berubah
    "soal_id",             // Tidak boleh berubah
    "attempt_id",          // Tidak boleh berubah
    "jawaban_mahasiswa",   // Jawaban mahasiswa prioritas
  ],
  serverAuthoritativeFields: [
    "poin_diperoleh",      // Server/dosen yang beri nilai
    "is_correct",          // Server yang cek benar/salah
    "feedback",            // Feedback dari dosen
    "graded_by",           // Siapa yang grade
    "graded_at",           // Waktu grading
  ],
  autoResolveIfClient: ["jawaban_mahasiswa"], // Selalu gunakan jawaban mahasiswa
}
```

### nilai
```typescript
{
  entity: "nilai",
  protectedFields: [
    "mahasiswa_id",        // Tidak boleh berubah
    "kelas_id",            // Tidak boleh berubah
  ],
  serverAuthoritativeFields: [
    "nilai_akhir",         // Dosen yang tentukan
    "nilai_huruf",         // Auto-calculated di server
  ],
  manualReviewIf: (local, remote) => {
    // Manual review jika ada perubahan besar
    const diff = Math.abs((local.nilai_akhir || 0) - (remote.nilai_akhir || 0));
    if (diff > 10) {
      return "Large grade difference detected";
    }
  }
}
```

### kehadiran
```typescript
{
  entity: "kehadiran",
  protectedFields: [
    "mahasiswa_id",        // Tidak boleh berubah
    "jadwal_id",           // Tidak boleh berubah
    "waktu_check_in",      // First check-in time tetap
  ],
  serverAuthoritativeFields: [
    "status",              // Server final decision (bisa diedit dosen)
  ],
  autoResolveIfClient: ["waktu_check_in", "waktu_check_out"], // Client data prioritas
}
```

---

## 🚀 LANGKAH IMPLEMENTASI

### Step 1: Backup Database

```sql
-- Run di Supabase SQL Editor
-- Export current schema
pg_dump --schema-only your_database > schema_backup_before_fase3.sql

-- Export critical data
COPY (SELECT * FROM attempt_kuis) TO '/tmp/attempt_kuis_backup.csv' CSV HEADER;
COPY (SELECT * FROM jawaban) TO '/tmp/jawaban_backup.csv' CSV HEADER;
COPY (SELECT * FROM nilai) TO '/tmp/nilai_backup.csv' CSV HEADER;
```

### Step 2: Run Check Script

```bash
# Copy isi file: supabase/check-database-structure.sql
# Paste ke Supabase SQL Editor
# Jalankan dan catat hasilnya
```

**Yang perlu dicek:**
- ✅ Tabel mana saja yang ada
- ✅ Apakah ada kolom `_version` yang sudah ada
- ✅ Apakah ada trigger version yang sudah ada
- ✅ Struktur `conflict_log` (jika ada)

### Step 3: Adjust Migration Script

Edit file `supabase/migrations/fase3_optimistic_locking_SAFE.sql`:

```sql
-- Line 23: Sesuaikan tabel yang akan di-versioning
DECLARE
  v_tables TEXT[] := ARRAY['attempt_kuis', 'jawaban', 'nilai', 'kehadiran']; -- <-- EDIT DI SINI
```

### Step 4: Handle Existing `conflict_log`

Jika tabel `conflict_log` sudah ada dengan struktur berbeda:

**Option A: Skip creation**
```sql
-- Di migration, cek dulu
IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'conflict_log') THEN
  -- Create table...
END IF;
```

**Option B: Rename existing**
```sql
-- Rename old conflict_log
ALTER TABLE conflict_log RENAME TO conflict_log_old;
-- Then create new one
```

**Option C: Extend existing**
```sql
-- Add missing columns to existing table
ALTER TABLE conflict_log ADD COLUMN IF NOT EXISTS entity TEXT;
ALTER TABLE conflict_log ADD COLUMN IF NOT EXISTS local_version INTEGER;
-- etc...
```

### Step 5: Handle `kuis.version` Column

Tabel `kuis` sudah punya kolom `version`. Pilih salah satu:

**Option A: Rename ke `_version`**
```sql
-- Rename existing column
ALTER TABLE kuis RENAME COLUMN version TO _version;
```

**Option B: Skip kuis table**
```sql
-- Exclude 'kuis' from v_tables array
v_tables TEXT[] := ARRAY['attempt_kuis', 'jawaban', 'nilai', 'kehadiran'];
```

**Option C: Use existing `version`**
```sql
-- Di smart-conflict-resolver.ts, check both:
const version = data._version || data.version;
```

### Step 6: Run Migration

```bash
# Upload file ke Supabase Dashboard > SQL Editor
# Atau gunakan Supabase CLI:
supabase db push

# Atau copy-paste isi file ke SQL Editor dan run
```

### Step 7: Verify

```sql
-- Check version columns added
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE column_name = '_version'
ORDER BY table_name;

-- Check triggers created
SELECT
  trigger_name,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE '%version%'
ORDER BY event_object_table;

-- Test version increment
UPDATE attempt_kuis
SET status = 'in_progress'
WHERE id = 'some-id';

SELECT id, status, _version
FROM attempt_kuis
WHERE id = 'some-id';
-- Should show _version = 2
```

---

## ⚠️ MASALAH YANG MUNGKIN MUNCUL

### 1. Tabel Tidak Ditemukan

**Error:**
```
⚠️  Table attempt_kuis does not exist (skipping)
```

**Solusi:**
- Cek nama tabel di database (bisa jadi `kuis_attempt` bukan `attempt_kuis`)
- Update array v_tables dengan nama yang benar

### 2. Kolom Sudah Ada

**Error:**
```
column "_version" of relation "jawaban" already exists
```

**Solusi:**
- Migration sudah di-handle dengan `IF NOT EXISTS`
- Kalau error, berarti IF NOT EXISTS tidak berjalan
- Cek PostgreSQL version (harus >= 9.6)

### 3. Trigger Sudah Ada

**Error:**
```
trigger "trigger_increment_jawaban_version" already exists
```

**Solusi:**
- Script sudah pakai `DROP TRIGGER IF EXISTS`
- Jika masih error, manual drop dulu:

```sql
DROP TRIGGER IF EXISTS trigger_increment_jawaban_version ON jawaban;
```

### 4. conflict_log Structure Mismatch

**Error:**
```
column "entity" does not exist in conflict_log
```

**Solusi:**
- Lihat Step 4 di atas
- Pilih salah satu: skip, rename, atau extend

---

## 🎯 RECOMMENDED CONFIGURATION

Untuk **implementasi pertama yang aman**:

```sql
-- File: supabase/migrations/fase3_optimistic_locking_SAFE.sql
-- Line 23:

DECLARE
  v_tables TEXT[] := ARRAY[
    'attempt_kuis',  -- HIGH PRIORITY - quiz attempts
    'jawaban'        -- HIGH PRIORITY - answers
  ];
```

**Alasan:**
1. Fokus pada fitur offline quiz yang paling berisiko conflict
2. Minimal impact, mudah rollback
3. Bisa test dulu sebelum expand ke tabel lain

**Setelah test berhasil (1-2 minggu):**

```sql
DECLARE
  v_tables TEXT[] := ARRAY[
    'attempt_kuis',
    'jawaban',
    'nilai',         -- MEDIUM PRIORITY
    'kehadiran'      -- MEDIUM PRIORITY
  ];
```

---

## 📝 CHECKLIST SEBELUM RUN MIGRATION

- [ ] Backup database sudah dibuat
- [ ] File check-database-structure.sql sudah dijalankan
- [ ] Array v_tables sudah disesuaikan
- [ ] Handling untuk kuis.version sudah ditentukan
- [ ] Handling untuk conflict_log sudah ditentukan
- [ ] Test environment sudah siap (jangan langsung production!)
- [ ] Rollback plan sudah ada

---

## 🔄 ROLLBACK PLAN

Jika ada masalah:

```sql
-- 1. Drop triggers
DROP TRIGGER IF EXISTS trigger_increment_attempt_kuis_version ON attempt_kuis;
DROP TRIGGER IF EXISTS trigger_increment_jawaban_version ON jawaban;
DROP TRIGGER IF EXISTS trigger_increment_nilai_version ON nilai;
DROP TRIGGER IF EXISTS trigger_increment_kehadiran_version ON kehadiran;

-- 2. Drop functions
DROP FUNCTION IF EXISTS increment_version();
DROP FUNCTION IF EXISTS check_version_conflict(TEXT, UUID, INTEGER);
DROP FUNCTION IF EXISTS safe_update_with_version(TEXT, UUID, INTEGER, JSONB);
DROP FUNCTION IF EXISTS log_conflict(TEXT, UUID, INTEGER, INTEGER, JSONB, JSONB);

-- 3. Drop columns (HATI-HATI - data akan hilang!)
ALTER TABLE attempt_kuis DROP COLUMN IF EXISTS _version;
ALTER TABLE jawaban DROP COLUMN IF EXISTS _version;
ALTER TABLE nilai DROP COLUMN IF EXISTS _version;
ALTER TABLE kehadiran DROP COLUMN IF EXISTS _version;

-- 4. Drop conflict_log (jika baru dibuat)
DROP TABLE IF EXISTS conflict_log;
```

---

## 📞 NEXT STEPS

1. ✅ Review dokumen ini
2. ⏳ Run check-database-structure.sql di Supabase
3. ⏳ Tentukan pilihan konfigurasi (Minimal/Standard/Comprehensive)
4. ⏳ Adjust migration script
5. ⏳ Test di staging/development dulu
6. ⏳ Deploy ke production

---

**Catatan:** Dokumen ini dibuat berdasarkan analisis database.types.ts dan offline.types.ts. Selalu cross-check dengan database aktual di Supabase sebelum run migration.
