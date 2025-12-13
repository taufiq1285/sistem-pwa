# 🔧 Fix Summary: Error 400 Bad Request - NULL mata_kuliah_id

**Date:** 2025-12-09
**Issue:** Mahasiswa role mendapat error 400 saat akses dashboard
**Root Cause:** Ada record `kelas` dengan `mata_kuliah_id = NULL`

---

## 🐛 Problem Detail

### Error Message:
```
GET https://rkyoifqbfcztnhevpnpx.supabase.co/rest/v1/mata_kuliah?select=kode_mk%2Cnama_mk%2Csks&id=eq.null 400 (Bad Request)
```

### Root Cause:
1. Ada record di tabel `kelas` yang field `mata_kuliah_id`-nya **NULL**
2. Ketika mahasiswa login, API `getMahasiswaStats()` dan `getMyKelas()` mencoba query:
   ```typescript
   .eq("id", kelas.mata_kuliah_id)  // ← kelas.mata_kuliah_id is NULL
   ```
3. Supabase menerjemahkan ini menjadi `id=eq.null` yang invalid
4. Hasilnya: **400 Bad Request**

---

## ✅ Solution Applied

### 1. **Application Code Fix** (Immediate - Defense in Depth)

**File:** `src/lib/api/mahasiswa.api.ts`

**Changes:** Added null check sebelum query mata_kuliah di 2 tempat:

#### Fix #1: `getMahasiswaStats()` function (Line 275-284)

**BEFORE:**
```typescript
const { data: mkData } = await supabase
  .from("mata_kuliah")
  .select("id, kode_mk, nama_mk, sks, semester")
  .eq("id", kelas.mata_kuliah_id)  // ❌ Crashes if NULL
  .single();
```

**AFTER:**
```typescript
// FIX: Check if mata_kuliah_id exists before querying
let mkData = null;
if (kelas.mata_kuliah_id) {
  const { data } = await supabase
    .from("mata_kuliah")
    .select("id, kode_mk, nama_mk, sks, semester")
    .eq("id", kelas.mata_kuliah_id)
    .single();
  mkData = data;
}
```

#### Fix #2: `getMyKelas()` function (Line 487-496)

**BEFORE:**
```typescript
const { data: mkData } = await supabase
  .from("mata_kuliah")
  .select("kode_mk, nama_mk, sks")
  .eq("id", kelasData.mata_kuliah_id)  // ❌ Crashes if NULL
  .single();
```

**AFTER:**
```typescript
// FIX: Check if mata_kuliah_id exists before querying
let mkData = null;
if (kelasData.mata_kuliah_id) {
  const { data } = await supabase
    .from("mata_kuliah")
    .select("kode_mk, nama_mk, sks")
    .eq("id", kelasData.mata_kuliah_id)
    .single();
  mkData = data;
}
```

**Result:** Sekarang jika `mata_kuliah_id` NULL, `mkData` akan jadi `null` dan fallback ke default values (`"-"` untuk kode/nama, `0` untuk sks)

---

### 2. **Database Fix** (Recommended - Root Cause)

**File Created:** `supabase/fix-null-mata-kuliah-id.sql`

**Purpose:** Diagnostic dan perbaikan data di database

#### Steps to Fix Database:

1. **Cek berapa banyak record bermasalah:**
   ```sql
   SELECT COUNT(*)
   FROM kelas
   WHERE mata_kuliah_id IS NULL;
   ```

2. **Lihat detail record:**
   ```sql
   SELECT id, kode_kelas, nama_kelas, tahun_ajaran
   FROM kelas
   WHERE mata_kuliah_id IS NULL;
   ```

3. **Cek apakah ada mahasiswa enrolled:**
   ```sql
   SELECT COUNT(*)
   FROM kelas_mahasiswa km
   JOIN kelas k ON km.kelas_id = k.id
   WHERE k.mata_kuliah_id IS NULL
   AND km.is_active = true;
   ```

4. **Pilih opsi perbaikan:**

   **OPSI A:** Hapus kelas yang tidak valid (jika tidak ada mahasiswa)
   ```sql
   DELETE FROM kelas
   WHERE mata_kuliah_id IS NULL
   AND id NOT IN (
       SELECT DISTINCT kelas_id
       FROM kelas_mahasiswa
       WHERE is_active = true
   );
   ```

   **OPSI B:** Assign mata_kuliah yang valid
   ```sql
   -- Cek mata kuliah tersedia:
   SELECT id, kode_mk, nama_mk
   FROM mata_kuliah
   WHERE is_active = true;

   -- Update kelas:
   UPDATE kelas
   SET mata_kuliah_id = '<UUID_VALID>'
   WHERE mata_kuliah_id IS NULL;
   ```

5. **Enforce NOT NULL constraint (setelah data bersih):**
   ```sql
   ALTER TABLE kelas
   ALTER COLUMN mata_kuliah_id SET NOT NULL;
   ```

---

## 🧪 Testing

### How to Test:

1. **Before Fix:** Login sebagai mahasiswa → Error 400
2. **After Code Fix:** Login sebagai mahasiswa → Dashboard load (tapi data mata kuliah jadi "-")
3. **After DB Fix:** Login sebagai mahasiswa → Dashboard load dengan data lengkap

### Expected Behavior:

#### Dashboard Stats Card:
```
Kelas Praktikum
      2
Kelas yang diikuti
```

#### Kelas List:
| Kode Kelas | Mata Kuliah | Semester |
|------------|-------------|----------|
| PWA-A      | Praktikum Pemrograman Web | 1 |
| BD-B       | Praktikum Basis Data | 2 |

---

## ⚠️ Impact Analysis

### Before Fix:
- ❌ Mahasiswa tidak bisa akses dashboard
- ❌ Error 400 Bad Request
- ❌ Aplikasi tidak bisa digunakan

### After Code Fix:
- ✅ Mahasiswa bisa akses dashboard
- ✅ No more 400 errors
- ⚠️ Kelas dengan NULL mata_kuliah_id akan tampil dengan data "-"

### After DB Fix:
- ✅ Semua kelas punya mata_kuliah yang valid
- ✅ Data tampil lengkap
- ✅ Constraint database terjaga

---

## 📋 Recommended Actions

### Immediate (DONE ✅):
- [x] Fix application code untuk handle NULL
- [x] Deploy fix ke production
- [x] Test mahasiswa dashboard

### Short-term (TODO ⚠️):
- [ ] Run diagnostic SQL di Supabase
- [ ] Identify kelas dengan NULL mata_kuliah_id
- [ ] Fix database records (pilih opsi A atau B)
- [ ] Verify no more NULL values
- [ ] Add NOT NULL constraint

### Long-term (OPTIONAL):
- [ ] Add validation di admin form untuk prevent NULL
- [ ] Add database migration untuk enforce constraint
- [ ] Monitor untuk ensure no new NULL records

---

## 🔍 Related Files

### Modified:
- `src/lib/api/mahasiswa.api.ts` - Added null checks

### Created:
- `supabase/fix-null-mata-kuliah-id.sql` - Diagnostic & fix SQL
- `FIX_NULL_MATA_KULIAH_SUMMARY.md` - This document

### No Changes Needed:
- UI files (already handle NULL gracefully with `|| "-"`)
- Test files (mocks already valid)

---

## ✅ Verification Checklist

After applying fixes:

- [ ] No more 400 errors in browser console
- [ ] Mahasiswa dashboard loads successfully
- [ ] Stats cards show correct numbers
- [ ] Kelas list displays properly
- [ ] Database has no NULL mata_kuliah_id
- [ ] Constraint enforced (optional but recommended)

---

## 📝 Notes

**Why This Happened:**
- `mata_kuliah_id` should be NOT NULL according to schema
- Somehow NULL records got into database (possibly manual entry or migration issue)
- Application code didn't anticipate NULL values

**Defense in Depth:**
- **Code fix:** Prevents crashes even if bad data exists
- **DB fix:** Ensures data integrity at source
- **Constraint:** Prevents future NULL insertions

**Best Practice:**
- Always validate foreign keys before querying
- Use database constraints to enforce data integrity
- Have fallback values for optional/nullable fields

---

**Status:** ✅ **CODE FIX APPLIED** - Application won't crash anymore
**Next Step:** Run SQL diagnostic to clean database
**Priority:** Medium (app works, but data should be fixed)

---

**Created:** 2025-12-09
**Updated:** 2025-12-09
**Version:** 1.0
