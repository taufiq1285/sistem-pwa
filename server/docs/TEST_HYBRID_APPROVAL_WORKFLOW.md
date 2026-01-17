# 🧪 TESTING GUIDE: Hybrid Approval Workflow

**Date:** 2025-12-09
**Status:** Ready for Testing
**Estimated Time:** 15-20 minutes

---

## 📋 Pre-Testing Checklist

Before you start testing, verify the migration is complete:

### Step 1: Run Verification SQL
```bash
# Open Supabase Dashboard → SQL Editor
# Copy and run: VERIFY_MIGRATION_COMPLETE.sql
```

**Expected Results:**
- ✅ 4 columns exist (status, cancelled_by, cancelled_at, cancellation_reason)
- ✅ 2 functions exist (cancel_jadwal_praktikum, reactivate_jadwal_praktikum)
- ✅ 1 view exists (active_jadwal_praktikum)
- ✅ 1 index exists (idx_jadwal_praktikum_status)

### Step 2: Clear Browser Cache
```bash
# Press Ctrl + Shift + Delete
# Or hard refresh: Ctrl + F5
```

### Step 3: Verify Menu Appears
- Login as **laboran**
- Check sidebar: "Kelola Jadwal" menu should appear
- Icon: Calendar icon
- Navigate to: `/laboran/jadwal`

---

## 🧪 TEST SUITE

### TEST 1: Dosen Create Jadwal (Auto-Approve) ✅

**Goal:** Verify new jadwal are automatically approved

**Steps:**
1. Login sebagai **dosen** (contoh: alfih@example.com)
2. Go to `/dosen/jadwal`
3. Click "Buat Jadwal Baru"
4. Fill in form:
   - Kelas: Pilih kelas yang valid (dengan mata kuliah assigned)
   - Tanggal: 2025-12-15
   - Jam Mulai: 08:00
   - Jam Selesai: 10:00
   - Laboratorium: Pilih lab ANC
   - Topik: "Test Auto-Approve Workflow"
5. Click "Simpan"

**Expected Results:**
- ✅ Success message: "Jadwal berhasil dibuat"
- ✅ Jadwal langsung muncul di calendar
- ✅ No approval needed
- ✅ Status = 'approved' (check in database)

**Database Verification:**
```sql
SELECT
  id,
  topik_praktikum,
  status,
  created_at
FROM jadwal_praktikum
WHERE topik_praktikum = 'Test Auto-Approve Workflow';
```

Expected: `status = 'approved'`

---

### TEST 2: Prevent Double Booking ❌

**Goal:** Verify system blocks conflicting schedules

**Steps:**
1. Still logged in as **dosen**
2. Try create another jadwal with SAME:
   - Tanggal: 2025-12-15
   - Jam Mulai: 08:00 (or 09:00 - overlapping)
   - Jam Selesai: 10:00
   - Laboratorium: Lab ANC (SAME as Test 1)
3. Click "Simpan"

**Expected Results:**
- ❌ Error message: "Jadwal bentrok! Laboratorium sudah digunakan pada waktu tersebut"
- ❌ Jadwal NOT created
- ❌ No entry in database

**Alternative Test - Different Lab Should Work:**
- Same date and time
- Different lab (e.g., Lab PNC)
- ✅ Should succeed

---

### TEST 3: Laboran View All Jadwal 📊

**Goal:** Verify laboran can see and manage all jadwal

**Steps:**
1. Logout from dosen
2. Login sebagai **laboran**
3. Go to `/laboran/jadwal`
4. Page should load

**Expected Results:**
- ✅ Stats cards showing:
  - Total Jadwal: [count]
  - Disetujui: [count]
  - Dibatalkan: 0
- ✅ Table showing all jadwal including the one from Test 1
- ✅ Each row shows:
  - Mata Kuliah name
  - Kelas name
  - Tanggal
  - Waktu
  - Laboratorium
  - Status badge (green "Disetujui")
  - Action buttons

**Table Columns:**
| Mata Kuliah | Kelas | Tanggal | Waktu | Lab | Status | Aksi |
|-------------|-------|---------|-------|-----|--------|------|
| [Askeb...] | [A] | 15/12/2025 | 08:00-10:00 | ANC | ✅ Disetujui | [Batalkan] |

---

### TEST 4: Laboran Cancel Jadwal ❌

**Goal:** Verify laboran can cancel approved jadwal

**Steps:**
1. Still at `/laboran/jadwal` as laboran
2. Find the jadwal from Test 1 ("Test Auto-Approve Workflow")
3. Click "Batalkan" button (red button)
4. Dialog appears: "Batalkan Jadwal Praktikum"
5. Enter reason: "Test cancellation - lab maintenance"
6. Click "Batalkan Jadwal"

**Expected Results:**
- ✅ Success message: "Jadwal berhasil dibatalkan"
- ✅ Stats update:
  - Disetujui: -1
  - Dibatalkan: +1
- ✅ Table updates:
  - Status badge changes to red "Dibatalkan"
  - Shows cancellation reason
  - Shows "Dibatalkan oleh: [laboran name]"
  - Action button changes to "Aktifkan Kembali" (green)

**Database Verification:**
```sql
SELECT
  id,
  topik_praktikum,
  status,
  cancelled_by,
  cancelled_at,
  cancellation_reason
FROM jadwal_praktikum
WHERE topik_praktikum = 'Test Auto-Approve Workflow';
```

Expected:
- `status = 'cancelled'`
- `cancelled_by = [laboran user_id]`
- `cancelled_at = [timestamp]`
- `cancellation_reason = 'Test cancellation - lab maintenance'`

---

### TEST 5: Dosen Cannot See Cancelled Jadwal 👁️

**Goal:** Verify cancelled jadwal disappear from dosen's calendar

**Steps:**
1. Logout from laboran
2. Login sebagai **dosen** (same as Test 1)
3. Go to `/dosen/jadwal`
4. Check calendar

**Expected Results:**
- ❌ Jadwal "Test Auto-Approve Workflow" should NOT appear in calendar
- ✅ Only approved jadwal visible
- ✅ Calendar updates in real-time

---

### TEST 6: Filter by Status 🔍

**Goal:** Verify laboran can filter jadwal by status

**Steps:**
1. Login as **laboran**
2. Go to `/laboran/jadwal`
3. Click "Status" dropdown
4. Select "Dibatalkan"

**Expected Results:**
- ✅ Table shows only cancelled jadwal
- ✅ Stats still show total counts
- ✅ "Test Auto-Approve Workflow" appears

**Test Other Filters:**
- Select "Disetujui" → Should hide cancelled jadwal
- Select "Semua" → Should show all jadwal

---

### TEST 7: Laboran Reactivate Jadwal ↩️

**Goal:** Verify laboran can reactivate cancelled jadwal

**Steps:**
1. Still at `/laboran/jadwal` as laboran
2. Filter: "Dibatalkan"
3. Find "Test Auto-Approve Workflow"
4. Click "Aktifkan Kembali" button (green)
5. Confirm dialog appears
6. Click "Aktifkan Kembali"

**Expected Results:**
- ✅ Success message: "Jadwal berhasil diaktifkan kembali"
- ✅ Stats update:
  - Disetujui: +1
  - Dibatalkan: -1
- ✅ Jadwal disappears from "Dibatalkan" filter
- ✅ Appears in "Disetujui" filter
- ✅ Status badge changes to green "Disetujui"
- ✅ Cancellation info cleared

**Database Verification:**
```sql
SELECT
  id,
  topik_praktikum,
  status,
  cancelled_by,
  cancelled_at,
  cancellation_reason
FROM jadwal_praktikum
WHERE topik_praktikum = 'Test Auto-Approve Workflow';
```

Expected:
- `status = 'approved'`
- `cancelled_by = NULL`
- `cancelled_at = NULL`
- `cancellation_reason = NULL`

---

### TEST 8: Dosen Can See Reactivated Jadwal 👁️

**Goal:** Verify reactivated jadwal reappear in dosen's calendar

**Steps:**
1. Logout from laboran
2. Login sebagai **dosen**
3. Go to `/dosen/jadwal`
4. Check calendar

**Expected Results:**
- ✅ Jadwal "Test Auto-Approve Workflow" reappears in calendar
- ✅ Shows on December 15, 2025 at 08:00-10:00
- ✅ No indication it was previously cancelled

---

### TEST 9: Filter by Laboratorium 🏢

**Goal:** Verify laboran can filter by specific lab

**Steps:**
1. Login as **laboran**
2. Go to `/laboran/jadwal`
3. Click "Laboratorium" dropdown
4. Select "Lab ANC"

**Expected Results:**
- ✅ Table shows only jadwal for Lab ANC
- ✅ Stats update to show counts for filtered view
- ✅ Filter persists when changing status filter

---

### TEST 10: Permission Check 🔒

**Goal:** Verify only laboran can access management page

**Steps:**
1. Login as **dosen**
2. Try to access `/laboran/jadwal` directly (type in URL)

**Expected Results:**
- ❌ Redirected to unauthorized page or dashboard
- ❌ Cannot access the page
- ✅ RoleGuard blocks access

---

## 📊 TEST RESULTS SUMMARY

After completing all tests, fill in:

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1 | Auto-Approve | ⬜ Pass / ⬜ Fail | |
| 2 | Prevent Double Booking | ⬜ Pass / ⬜ Fail | |
| 3 | Laboran View All | ⬜ Pass / ⬜ Fail | |
| 4 | Cancel Jadwal | ⬜ Pass / ⬜ Fail | |
| 5 | Dosen Cannot See Cancelled | ⬜ Pass / ⬜ Fail | |
| 6 | Filter by Status | ⬜ Pass / ⬜ Fail | |
| 7 | Reactivate Jadwal | ⬜ Pass / ⬜ Fail | |
| 8 | Dosen Can See Reactivated | ⬜ Pass / ⬜ Fail | |
| 9 | Filter by Lab | ⬜ Pass / ⬜ Fail | |
| 10 | Permission Check | ⬜ Pass / ⬜ Fail | |

---

## 🐛 If You Find Issues

### Common Issues and Solutions:

**Issue 1: Menu "Kelola Jadwal" tidak muncul**
- Solution: Clear cache, logout/login, verify laboran role

**Issue 2: Error "Permission denied"**
- Solution: Verify migration ran successfully, check RLS policies

**Issue 3: Jadwal masih muncul setelah cancel**
- Solution: Hard refresh (Ctrl+F5), check database status

**Issue 4: Cannot create jadwal - "column status does not exist"**
- Solution: Migration not complete, run full migration SQL

**Issue 5: Filter tidak bekerja**
- Solution: Check console for errors, verify API calls

---

## 🎯 Success Criteria

All tests must PASS for workflow to be considered complete:

- ✅ Auto-approve works
- ✅ Double booking prevented
- ✅ Laboran can cancel with reason
- ✅ Laboran can reactivate
- ✅ Calendar updates correctly for all roles
- ✅ Filters work properly
- ✅ Permissions enforced
- ✅ Audit trail recorded

---

## 📝 Report Results

After testing, report:

1. **Test Results:** How many passed/failed
2. **Issues Found:** Any bugs or unexpected behavior
3. **Screenshots:** Of the laboran management page
4. **Database Status:** Results from verification queries

---

**Happy Testing! 🚀**
