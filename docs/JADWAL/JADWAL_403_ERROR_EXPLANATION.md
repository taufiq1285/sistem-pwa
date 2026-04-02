# 🔴 JADWAL 403 FORBIDDEN ERROR - ROOT CAUSE & FIX

**Date**: 2025-12-09
**Error**: `Insufficient permissions` saat create jadwal praktikum
**Status**: 🔧 **FIXABLE** (butuh update RLS policies)

---

## 🐛 ROOT CAUSE

### Yang Terjadi:
Migration `99_enable_jadwal_approval_workflow.sql` yang kita jalankan sebelumnya **HANYA membuat SELECT policies**, tapi **MENGHAPUS INSERT/UPDATE/DELETE policies** yang lama.

### Akibatnya:
```sql
-- ✅ SELECT policies: ADA (4 policies)
jadwal_select_admin
jadwal_select_dosen
jadwal_select_laboran
jadwal_select_mahasiswa

-- ❌ INSERT policies: TIDAK ADA (0 policies) → 403 Error!
-- ❌ UPDATE policies: TIDAK ADA (0 policies) → 403 Error!
-- ❌ DELETE policies: TIDAK ADA (0 policies) → 403 Error!
```

### Error Message:
```
🔴 API Error (insert:jadwal_praktikum)
Message: Insufficient permissions
Code: FORBIDDEN
Status: 403
```

**Artinya**: Database **MENOLAK** semua INSERT operation karena **tidak ada RLS policy** yang mengizinkan.

---

## ✅ SOLUSI CEPAT

### Step 1: Buka Supabase SQL Editor
1. Login ke https://supabase.com/dashboard
2. Pilih project: **sistem-praktikum-pwa**
3. Klik **SQL Editor** di sidebar kiri
4. Klik **New query**

### Step 2: Copy-Paste File Fix
1. Buka file: `FIX_JADWAL_INSERT_PERMISSION.sql`
2. **Copy SEMUA isi file** (Ctrl+A, Ctrl+C)
3. **Paste** ke SQL Editor
4. Klik **Run** atau tekan `Ctrl+Enter`

### Step 3: Verify Success
Setelah run, Anda akan lihat output seperti ini:

```
✓ DROP POLICY (9x - old policies removed)
✓ CREATE POLICY (9x - new policies created)

Verification Result:
┌─────────────────┬────────┬────────────┐
│ check_name      │ result │ status     │
├─────────────────┼────────┼────────────┤
│ Total Policies  │ 12     │ ✅ CORRECT │
└─────────────────┴────────┴────────────┘

Policies by Operation:
┌───────────┬───────┬──────────────────────────────────────────┐
│ operation │ count │ policy_names                             │
├───────────┼───────┼──────────────────────────────────────────┤
│ DELETE    │ 3     │ jadwal_delete_admin, ...                 │
│ INSERT    │ 3     │ jadwal_insert_admin, ...                 │
│ SELECT    │ 4     │ jadwal_select_admin, ...                 │
│ UPDATE    │ 3     │ jadwal_update_admin, ...                 │
└───────────┴───────┴──────────────────────────────────────────┘
```

**Jika ada ✅ CORRECT** → Fix berhasil!

---

## 📋 POLICY DETAILS (yang dibuat)

### INSERT Policies (3):
```sql
✅ jadwal_insert_admin
   → Admin bisa insert semua jadwal

✅ jadwal_insert_laboran
   → Laboran bisa insert semua jadwal

✅ jadwal_insert_dosen
   → Dosen bisa insert jadwal untuk kelas mereka sendiri
```

### UPDATE Policies (3):
```sql
✅ jadwal_update_admin
   → Admin bisa update semua jadwal

✅ jadwal_update_laboran
   → Laboran bisa update semua jadwal (untuk approve/reject)

✅ jadwal_update_dosen
   → Dosen bisa update jadwal kelas mereka
```

### DELETE Policies (3):
```sql
✅ jadwal_delete_admin
   → Admin bisa delete semua jadwal

✅ jadwal_delete_laboran
   → Laboran bisa delete jadwal pending (reject action)

✅ jadwal_delete_dosen
   → Dosen bisa delete jadwal pending milik mereka
```

### SELECT Policies (4) - Already exist:
```sql
✅ jadwal_select_admin - See all
✅ jadwal_select_laboran - See all
✅ jadwal_select_dosen - See approved + own pending
✅ jadwal_select_mahasiswa - See approved only
```

---

## 🧪 TESTING SETELAH FIX

### Test 1: Create Jadwal (Dosen)
1. Login sebagai **Dosen**
2. Buka `/dosen/jadwal`
3. Klik **"Buat Jadwal"**
4. Isi form dan **Save**

**Expected Result**:
```
✅ Success toast muncul
✅ Jadwal tersimpan dengan is_active = false (pending)
✅ Tidak ada 403 error lagi
```

### Test 2: Approve Jadwal (Laboran)
1. Login sebagai **Laboran**
2. Buka `/laboran/persetujuan`
3. Tab **"Booking Ruangan"**
4. Klik **"Approve"** pada pending jadwal

**Expected Result**:
```
✅ Jadwal status berubah ke active
✅ Muncul di kalender mahasiswa
```

### Test 3: Delete Pending (Dosen)
1. Login sebagai **Dosen**
2. Buka jadwal pending milik sendiri
3. Klik **Delete**

**Expected Result**:
```
✅ Jadwal terhapus
✅ Tidak ada 403 error
```

---

## 🔍 DEBUGGING (Jika Masih Error)

Jika setelah fix masih ada error, run debug queries:

### Check User Role
```sql
SELECT
    auth.uid() as my_id,
    (SELECT role FROM users WHERE id = auth.uid()) as my_role,
    (SELECT full_name FROM users WHERE id = auth.uid()) as my_name;
```

**Expected**: `my_role` harus ada (admin/dosen/laboran/mahasiswa)

### Check Helper Functions
```sql
SELECT
    is_admin() as am_i_admin,
    is_dosen() as am_i_dosen,
    is_laboran() as am_i_laboran,
    is_mahasiswa() as am_i_mahasiswa;
```

**Expected**: Salah satu harus `true`

### Check Dosen ID (if you're dosen)
```sql
SELECT get_current_dosen_id() as my_dosen_id;
```

**Expected**: UUID jika Anda dosen

### Check Policies Exist
```sql
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'jadwal_praktikum'
ORDER BY cmd, policyname;
```

**Expected**: 12 rows (3 DELETE, 3 INSERT, 4 SELECT, 3 UPDATE)

---

## ⚠️ CATATAN PENTING

### Kenapa Migration 99 Tidak Lengkap?
Migration sebelumnya fokus ke **approval workflow** (change default + SELECT policies), tapi **lupa** menambahkan INSERT/UPDATE/DELETE policies.

### Apakah Data Aman?
✅ **YA** - Tidak ada data yang hilang atau rusak
✅ **YA** - Existing jadwal tetap aman
✅ **YA** - Hanya RLS policies yang perlu ditambahkan

### Apakah Perlu Rollback?
❌ **TIDAK** - Tidak perlu rollback
✅ **CUKUP** jalankan file fix untuk melengkapi policies

---

## 📊 SUMMARY

### Before Fix:
```
❌ INSERT jadwal → 403 Forbidden
❌ UPDATE jadwal → 403 Forbidden
❌ DELETE jadwal → 403 Forbidden
✅ SELECT jadwal → OK (sudah ada policies)
```

### After Fix:
```
✅ INSERT jadwal → OK (3 policies created)
✅ UPDATE jadwal → OK (3 policies created)
✅ DELETE jadwal → OK (3 policies created)
✅ SELECT jadwal → OK (4 policies exist)
```

---

## ✅ CHECKLIST

Setelah run fix, pastikan:

- [ ] Total policies = 12 (check dengan verification query)
- [ ] Dosen bisa create jadwal ✅
- [ ] Laboran bisa approve jadwal ✅
- [ ] Admin bisa CRUD semua jadwal ✅
- [ ] Mahasiswa bisa lihat approved jadwal ✅
- [ ] Tidak ada 403 error lagi ✅

---

**File**: `JADWAL_403_ERROR_EXPLANATION.md`
**Fix File**: `FIX_JADWAL_INSERT_PERMISSION.sql`
**Debug File**: `DEBUG_JADWAL_403_ERROR.sql`

**Status**: 🔧 **FIX READY - Run SQL now!**
