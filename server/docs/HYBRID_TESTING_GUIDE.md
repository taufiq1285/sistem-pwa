# 🧪 HYBRID APPROVAL WORKFLOW - TESTING GUIDE

**Date**: 2025-12-09
**Workflow**: HYBRID (Auto-approve + Laboran can cancel)
**Status**: ✅ Code updated, ready for testing

---

## ✅ CHANGES APPLIED

### Code Change:
**File**: `src/lib/api/jadwal.api.ts` (Line 414)

**Before** (Manual):
```typescript
is_active: data.is_active ?? false, // Pending approval
```

**After** (Hybrid):
```typescript
is_active: true, // Auto-approved (laboran can cancel later)
```

**Impact**:
- ✅ Jadwal langsung active setelah dibuat (if no conflict)
- ✅ Muncul langsung di calendar mahasiswa
- ✅ Laboran bisa cancel later jika perlu

---

## 🎯 HYBRID WORKFLOW OVERVIEW

```
┌──────────────────────────────────────────────────────────┐
│ DOSEN - Create Jadwal                                    │
├──────────────────────────────────────────────────────────┤
│ 1. Fill form (lab, date, time, topic)                   │
│ 2. Click "Simpan"                                        │
│ 3. System validates:                                     │
│    ✅ Tanggal tidak masa lalu                            │
│    ✅ Check conflict (same lab + date + time)           │
│ 4. Result:                                               │
│    • If CONFLICT → ❌ ERROR "Jadwal bentrok!"           │
│    • If OK → ✅ INSERT with:                            │
│      - is_active = TRUE (auto-approved)                 │
│      - status = 'approved'                              │
│ 5. Jadwal LANGSUNG MUNCUL di calendar mahasiswa         │
└──────────────────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────────────────┐
│ LABORAN - Cancel (If Needed)                             │
├──────────────────────────────────────────────────────────┤
│ Use Case: Lab maintenance, equipment broken, etc        │
│ 1. Go to /laboran/persetujuan atau dashboard            │
│ 2. See all approved jadwal                              │
│ 3. Click "Cancel" on specific jadwal                    │
│ 4. Fill cancellation reason:                            │
│    - "Lab 1 maintenance 15-16 Dec"                      │
│    - "Equipment rusak, perlu perbaikan"                 │
│ 5. System calls: cancel_jadwal_praktikum()             │
│ 6. Update:                                               │
│    - status = 'cancelled'                               │
│    - cancelled_by = laboran_user_id                     │
│    - cancelled_at = NOW()                               │
│    - cancellation_reason = reason                       │
│ 7. Jadwal HILANG dari calendar mahasiswa                │
│ 8. (Optional) Dosen gets notification                   │
└──────────────────────────────────────────────────────────┘
```

---

## 🧪 TEST SCENARIOS

### TEST 1: Create Jadwal - No Conflict ✅

**Tester**: Dosen
**Expected**: Auto-approved & visible to mahasiswa

**Steps**:
1. Login sebagai **Dosen**
2. Go to `/dosen/jadwal`
3. Click **"Buat Jadwal"** atau **"+ Tambah"**
4. Fill form:
   - Kelas: Select kelas yang Anda ampu
   - Laboratorium: Pilih lab (e.g., Lab Komputer 1)
   - Tanggal: Besok atau tanggal masa depan
   - Jam Mulai: 08:00
   - Jam Selesai: 10:00
   - Topik: "Test Hybrid Workflow"
5. Click **"Simpan"**

**Expected Results**:
```
✅ Success toast: "Jadwal berhasil dibuat"
✅ No 403 error
✅ Jadwal muncul di list dengan status ACTIVE
✅ Check database:
   SELECT id, topik, is_active, status, created_at
   FROM jadwal_praktikum
   WHERE topik = 'Test Hybrid Workflow';

   Expected:
   is_active = TRUE ✅
   status = 'approved' ✅
```

**Verify Visibility**:
6. Logout dosen
7. Login sebagai **Mahasiswa** (dari kelas yang sama)
8. Go to `/mahasiswa/jadwal`
9. **Expected**: Jadwal "Test Hybrid Workflow" **MUNCUL** di calendar

---

### TEST 2: Create Jadwal - With Conflict ❌

**Tester**: Dosen (different dosen or same)
**Expected**: Error & tidak tersimpan

**Steps**:
1. Login sebagai **Dosen** (bisa dosen lain)
2. Go to `/dosen/jadwal`
3. Click **"Buat Jadwal"**
4. Fill form dengan **SAMA PERSIS** seperti TEST 1:
   - Lab: **Lab Komputer 1** (sama)
   - Tanggal: **Besok** (sama)
   - Jam: **08:00 - 10:00** (sama/overlap)
   - Topik: "Test Conflict Detection"
5. Click **"Simpan"**

**Expected Results**:
```
❌ Error toast: "Jadwal bentrok! Lab sudah terpakai pada [tanggal] jam 08:00-10:00"
❌ Jadwal TIDAK tersimpan
❌ Form masih terbuka (bisa edit waktu)

✅ Check database:
   SELECT * FROM jadwal_praktikum
   WHERE topik = 'Test Conflict Detection';

   Expected: 0 rows (tidak tersimpan)
```

**Retry with Different Time**:
6. Change **Jam Mulai: 10:00**, **Jam Selesai: 12:00**
7. Click **"Simpan"**
8. **Expected**: ✅ Success (no conflict)

---

### TEST 3: Laboran Cancel Jadwal 🗙

**Tester**: Laboran
**Expected**: Jadwal cancelled & hidden from mahasiswa

**Prerequisites**: TEST 1 sudah selesai (ada jadwal active)

**Steps**:
1. Login sebagai **Laboran**
2. Go to `/laboran/persetujuan` atau `/laboran/jadwal`
3. Find jadwal "Test Hybrid Workflow"
4. Click **"Cancel"** atau **"Batalkan"** button
5. Dialog muncul dengan textarea
6. Fill reason:
   ```
   "Lab 1 maintenance - AC rusak, perlu perbaikan urgent"
   ```
7. Click **"Confirm Cancel"**

**Expected Results**:
```
✅ Success toast: "Jadwal berhasil dibatalkan"
✅ Jadwal hilang dari list atau status berubah jadi "Cancelled"
✅ Check database:
   SELECT
       id,
       topik,
       is_active,
       status,
       cancellation_reason,
       cancelled_at
   FROM jadwal_praktikum
   WHERE topik = 'Test Hybrid Workflow';

   Expected:
   is_active = TRUE (masih true)
   status = 'cancelled' ✅
   cancellation_reason = 'Lab 1 maintenance...' ✅
   cancelled_at = NOW() ✅
```

**Verify Hidden from Mahasiswa**:
8. Logout laboran
9. Login sebagai **Mahasiswa**
10. Go to `/mahasiswa/jadwal`
11. **Expected**: Jadwal "Test Hybrid Workflow" **TIDAK MUNCUL** (hidden)

**Verify Conflict Check Excludes Cancelled**:
12. Login sebagai **Dosen**
13. Try create jadwal dengan **same lab + same date + same time**
14. **Expected**: ✅ Success (cancelled jadwal not counted as conflict)

---

### TEST 4: Laboran Reactivate Jadwal ♻️ (Optional)

**Tester**: Laboran
**Expected**: Cancelled jadwal kembali active

**Prerequisites**: TEST 3 sudah selesai (ada jadwal cancelled)

**Steps**:
1. Login sebagai **Laboran**
2. Go to cancelled jadwal list
3. Find "Test Hybrid Workflow" (status: cancelled)
4. Click **"Reactivate"** atau **"Aktifkan Kembali"**
5. Confirm action

**Expected Results**:
```
✅ Success toast: "Jadwal berhasil diaktifkan kembali"
✅ Status berubah jadi "Active" atau "Approved"
✅ Muncul kembali di calendar mahasiswa
✅ Check database:
   SELECT status, cancelled_by, cancelled_at, cancellation_reason
   FROM jadwal_praktikum
   WHERE topik = 'Test Hybrid Workflow';

   Expected:
   status = 'approved' ✅
   cancelled_by = NULL ✅
   cancelled_at = NULL ✅
   cancellation_reason = NULL ✅
```

---

### TEST 5: Past Date Validation ❌

**Tester**: Dosen
**Expected**: Error untuk tanggal masa lalu

**Steps**:
1. Login sebagai **Dosen**
2. Go to `/dosen/jadwal`
3. Click **"Buat Jadwal"**
4. Fill form:
   - Tanggal: **Kemarin** atau tanggal masa lalu
   - Fill other fields
5. Click **"Simpan"**

**Expected Results**:
```
❌ Error toast: "Tanggal praktikum tidak boleh di masa lalu. Tanggal yang dipilih: [date]"
❌ Jadwal tidak tersimpan
```

---

### TEST 6: Time Overlap Detection ⏰

**Tester**: Dosen
**Expected**: Detect overlapping time ranges

**Test Cases**:

**Case A: Exact Same Time** (08:00 - 10:00 vs 08:00 - 10:00)
```
✅ Expected: Conflict detected ❌
```

**Case B: Partial Overlap** (08:00 - 10:00 vs 09:00 - 11:00)
```
✅ Expected: Conflict detected ❌
```

**Case C: Fully Contained** (08:00 - 10:00 vs 08:30 - 09:30)
```
✅ Expected: Conflict detected ❌
```

**Case D: No Overlap** (08:00 - 10:00 vs 10:00 - 12:00)
```
✅ Expected: No conflict, created successfully ✅
```

---

## 🔍 DATABASE VERIFICATION QUERIES

### Check Active Jadwal
```sql
SELECT
    jp.id,
    jp.topik,
    jp.tanggal_praktikum,
    jp.jam_mulai,
    jp.jam_selesai,
    jp.is_active,
    jp.status,
    l.nama_lab,
    k.nama_kelas
FROM jadwal_praktikum jp
LEFT JOIN laboratorium l ON jp.laboratorium_id = l.id
LEFT JOIN kelas k ON jp.kelas_id = k.id
WHERE jp.status = 'approved'
  AND jp.is_active = true
ORDER BY jp.tanggal_praktikum, jp.jam_mulai;
```

### Check Cancelled Jadwal
```sql
SELECT
    jp.id,
    jp.topik,
    jp.status,
    jp.cancellation_reason,
    jp.cancelled_at,
    u.full_name as cancelled_by_name
FROM jadwal_praktikum jp
LEFT JOIN users u ON jp.cancelled_by = u.id
WHERE jp.status = 'cancelled'
ORDER BY jp.cancelled_at DESC;
```

### Check Conflict Detection Logic
```sql
-- Should find conflict (same lab + date + time)
SELECT
    id,
    topik,
    laboratorium_id,
    tanggal_praktikum,
    jam_mulai,
    jam_selesai,
    status
FROM jadwal_praktikum
WHERE laboratorium_id = 'LAB_ID_HERE'
  AND tanggal_praktikum = '2025-12-10'
  AND status = 'approved'
  AND is_active = true
ORDER BY jam_mulai;

-- Check time overlap
-- If jam_mulai < other.jam_selesai AND other.jam_mulai < jam_selesai
-- Then CONFLICT!
```

---

## ✅ SUCCESS CRITERIA

**System is working correctly if**:

1. ✅ Jadwal creation without conflict → Auto-approved & visible
2. ✅ Jadwal creation with conflict → Error & not saved
3. ✅ Past date validation → Error
4. ✅ Laboran can cancel → Status updated, hidden from mahasiswa
5. ✅ Cancelled jadwal excluded from conflict check
6. ✅ Laboran can reactivate → Visible again
7. ✅ Time overlap detection working (all cases)
8. ✅ No 403 errors
9. ✅ Type check passed ✅
10. ✅ Database constraints working

---

## 🚨 COMMON ISSUES & FIXES

### Issue 1: 403 Forbidden on Create
**Cause**: RLS policies not cleaned up

**Fix**:
```bash
Run: CLEANUP_DUPLICATE_POLICIES.sql in Supabase
```

### Issue 2: Kelas NULL Values
**Cause**: Missing mata_kuliah_id or dosen_id

**Fix**:
```sql
UPDATE kelas
SET
    mata_kuliah_id = 'ACTUAL_MK_ID',
    dosen_id = 'ACTUAL_DOSEN_ID'
WHERE mata_kuliah_id IS NULL OR dosen_id IS NULL;
```

### Issue 3: Cancel Button Not Found
**Cause**: UI not implemented yet

**Check**:
- Look for cancel button in laboran pages
- Check if `cancelJadwal` API is called

### Issue 4: Conflict Not Detected
**Cause**: Wrong query or status check

**Debug**:
```sql
-- Check what conflicts are checked
SELECT * FROM jadwal_praktikum
WHERE laboratorium_id = 'LAB_ID'
  AND tanggal_praktikum = 'DATE'
  AND status = 'approved'
  AND is_active = true;
```

---

## 📊 TESTING CHECKLIST

Copy this checklist for manual testing:

```
Manual Testing Checklist:

□ Environment Setup
  □ Database migration 45 applied
  □ RLS policies cleaned (12 total)
  □ Kelas data fixed (no NULL values)
  □ Type check passed

□ TEST 1: Create - No Conflict
  □ Jadwal created successfully
  □ is_active = TRUE
  □ status = 'approved'
  □ Visible to mahasiswa

□ TEST 2: Create - With Conflict
  □ Error shown
  □ Jadwal NOT saved
  □ Can retry with different time

□ TEST 3: Laboran Cancel
  □ Cancel button works
  □ Reason saved
  □ Hidden from mahasiswa
  □ Database updated correctly

□ TEST 4: Reactivate (Optional)
  □ Reactivate works
  □ Visible again to mahasiswa

□ TEST 5: Past Date Validation
  □ Error for past dates
  □ Not saved

□ TEST 6: Time Overlap
  □ All overlap cases detected
  □ Non-overlap allowed

□ Final Verification
  □ No console errors
  □ No 403 errors
  □ UI responsive
  □ Database consistent
```

---

**File**: `HYBRID_TESTING_GUIDE.md`
**Status**: ✅ **READY FOR TESTING**
**Next**: Run through all test scenarios
