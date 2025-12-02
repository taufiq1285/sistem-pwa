# Verification Checklist - Post Build Fixes

## 🎯 Tujuan
Memastikan perbaikan build tidak mengganggu logika yang sudah jalan dan database Supabase compatible.

---

## ⚠️ CRITICAL CHANGES - MUST VERIFY

### 1. ❌ BREAKING: Equipment Condition Type 'hilang'

**File Changed:** `src/types/inventaris.types.ts`
```typescript
// BEFORE: export type EquipmentCondition = 'baik' | 'rusak_ringan' | 'rusak_berat' | 'maintenance';
// AFTER:  export type EquipmentCondition = 'baik' | 'rusak_ringan' | 'rusak_berat' | 'maintenance' | 'hilang';
```

**Database Check Required:**
```sql
-- Check if enum 'hilang' exists in database
SELECT unnest(enum_range(NULL::equipment_condition));

-- If 'hilang' NOT exists, add it:
ALTER TYPE equipment_condition ADD VALUE 'hilang';
```

**Files Affected:**
- `src/lib/api/dosen.api.ts:1140` - returnBorrowingRequest function

**Impact:**
- ❌ HIGH - Jika database enum tidak punya 'hilang', akan ERROR saat dosen kembalikan barang hilang
- ✅ Solusi: Tambahkan 'hilang' ke database enum ATAU hapus dari type definition

**Test Case:**
```
1. Login sebagai Dosen
2. Buka halaman Peminjaman
3. Kembalikan barang dengan kondisi "Hilang"
4. Expected: Berhasil tersimpan
5. Actual: ? (perlu test)
```

---

### 2. ⚠️ MEDIUM: Offline Auth Session Structure

**File Changed:** `src/lib/offline/offline-auth.ts:331-336`
```typescript
// BEFORE:
const offlineSession: AuthSession = {
  access_token: 'offline_session_token',
  refresh_token: 'offline_refresh_token',
  expires_in: SESSION_EXPIRY / 1000,  // ❌ REMOVED
  expires_at: Math.floor((Date.now() + SESSION_EXPIRY) / 1000),
  token_type: 'bearer',                // ❌ REMOVED
  user: userData,
};

// AFTER:
const offlineSession: AuthSession = {
  access_token: 'offline_session_token',
  refresh_token: 'offline_refresh_token',
  expires_at: Math.floor((Date.now() + SESSION_EXPIRY) / 1000),
  user: userData,
};
```

**Impact:**
- ⚠️ MEDIUM - Offline login mungkin broken
- Existing offline sessions di browser users mungkin invalid format

**Files Affected:**
- `src/providers/AuthProvider.tsx:128, 144` - restoreOfflineSession usage

**Test Case:**
```
1. Login online (Chrome)
2. Clear offline data di IndexedDB
3. Logout
4. Set network to Offline (DevTools)
5. Login dengan credentials yang sama
6. Expected: Login berhasil dengan offline session
7. Actual: ? (perlu test)
```

**Migration Strategy:**
```javascript
// Option 1: Clear all offline sessions (safe but users logout)
indexedDB.deleteDatabase('praktikum-db');

// Option 2: Migrate old sessions to new format (complex)
// Check if session has 'expires_in' or 'token_type', remove them
```

---

### 3. ⚠️ MEDIUM: React useEffect Dependencies

**Files Changed:**
- `src/pages/dosen/MateriPage.tsx:94`
- `src/pages/dosen/PeminjamanPage.tsx:176`

**Before:**
```typescript
// MateriPage.tsx
useEffect(() => {
  if (user?.dosen?.id) {
    loadData();
  }
}, [user?.dosen?.id, loadData]); // ❌ loadData causes re-render loop

// PeminjamanPage.tsx
useEffect(() => {
  loadBorrowings();
  loadEquipment();
}, [loadBorrowings, loadEquipment]); // ❌ Functions not defined yet
```

**After:**
```typescript
// MateriPage.tsx
useEffect(() => {
  if (user?.dosen?.id) {
    loadData();
  }
}, [user?.dosen?.id]); // ✅ Only depends on user.dosen.id

// PeminjamanPage.tsx
useEffect(() => {
  loadBorrowings();
  loadEquipment();
}, []); // ✅ Run once on mount
```

**Impact:**
- ⚠️ MEDIUM - Data loading behavior might change
- MateriPage: Now only reloads when dosen.id changes (SAFER)
- PeminjamanPage: Now only loads once on mount (might miss updates)

**Test Case - MateriPage:**
```
1. Login sebagai Dosen
2. Buka halaman Materi
3. Check: Materi data loads correctly
4. Switch to another tab, come back
5. Expected: Data should NOT reload (unless dosen.id changed)
```

**Test Case - PeminjamanPage:**
```
1. Login sebagai Dosen
2. Buka halaman Peminjaman
3. Check: Borrowings & Equipment data loads
4. Create new peminjaman in another tab
5. Come back to Peminjaman page
6. Expected: New data might NOT show (because [] dependency)
7. Action: Refresh page manually OR add refresh button
```

---

### 4. ⚠️ LOW: Middleware Signature Change

**Files Changed:**
- `src/lib/api/jadwal.api.ts:462-466, 491-495`
- `src/lib/api/materi.api.ts:270-274, 313-317`

**Before:**
```typescript
export const updateJadwal = requirePermissionAndOwnership(
  'manage:jadwal',
  'jadwal',           // ❌ String table name
  'dosen_id',         // ❌ String owner field
  updateJadwalImpl
);
```

**After:**
```typescript
export const updateJadwal = requirePermissionAndOwnership(
  'manage:jadwal',
  { table: 'jadwal_praktikum', ownerField: 'dosen_id' }, // ✅ Object config
  0,  // resourceId index in arguments
  updateJadwalImpl
);
```

**Impact:**
- ✅ LOW - Ini fixing bug (table name was wrong: 'jadwal' → 'jadwal_praktikum')
- Actually SAFER now because ownership check will work correctly

**Test Case:**
```
1. Login sebagai Dosen A
2. Create Jadwal Praktikum
3. Logout, login as Dosen B
4. Try to update Dosen A's Jadwal
5. Expected: ERROR "Anda hanya dapat mengakses resource milik Anda sendiri"
6. Before fix: Might have failed silently or wrong table error
```

---

## 📊 Database Schema Verification

### Required SQL Checks:

```sql
-- 1. Check equipment_condition enum values
SELECT
  e.enumlabel as value,
  e.enumsortorder as order
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname = 'equipment_condition'
ORDER BY e.enumsortorder;

-- Expected output should include:
-- baik
-- rusak_ringan
-- rusak_berat
-- maintenance
-- hilang  ← CHECK IF EXISTS!

-- 2. Check jadwal_praktikum table exists (not 'jadwal')
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('jadwal', 'jadwal_praktikum');

-- Expected: 'jadwal_praktikum' exists

-- 3. Check RLS policies on jadwal_praktikum for dosen_id ownership
SELECT
  schemaname,
  tablename,
  policyname,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'jadwal_praktikum'
  AND policyname LIKE '%dosen%';

-- Expected: Policy checking (dosen_id = auth.uid()) exists

-- 4. Verify Permission Types in Application
SELECT DISTINCT permission
FROM admin
WHERE permission LIKE '%sync%'
   OR permission LIKE '%dashboard%'
   OR permission LIKE '%analytics%';

-- If no results: New permissions need to be added to roles
```

---

## 🧪 Critical Test Scenarios

### Test 1: Peminjaman Return dengan Kondisi "Hilang"
```
Priority: HIGH
Files: dosen.api.ts:1140, inventaris.types.ts:22

Steps:
1. Login as Dosen
2. Create peminjaman baru
3. Laboran approve
4. Dosen return dengan kondisi = "hilang"
5. Check database: kondisi_kembali = 'hilang'
6. Check inventory: jumlah_tersedia should increase (or not?)

Expected:
- If 'hilang' = barang hilang, inventory SHOULD NOT increase
- Current code DOES increase inventory (line 1147-1162)
- ⚠️ LOGIC BUG: Barang hilang kok stock bertambah?

CRITICAL FIX NEEDED:
```typescript
// dosen.api.ts line 1147
// Auto-increase inventory stock (return the equipment)
const { data: invData, error: invFetchError } = await supabase
  .from('inventaris')
  .select('jumlah_tersedia')
  .eq('id', peminjamanData.inventaris_id)
  .single();

// ⚠️ ADD THIS CHECK:
if (data.kondisi_kembali !== 'hilang') {
  // Only increase stock if not lost
  const newStock = invData.jumlah_tersedia + peminjamanData.jumlah_pinjam;

  const { error: invUpdateError } = await supabase
    .from('inventaris')
    .update({ jumlah_tersedia: newStock })
    .eq('id', peminjamanData.inventaris_id);

  if (invUpdateError) throw invUpdateError;
} else {
  // Barang hilang, inventory berkurang permanent
  console.warn(`⚠️ Barang ${peminjamanData.inventaris_id} hilang, stock tidak dikembalikan`);
}
```

### Test 2: Offline Login Flow
```
Priority: HIGH
Files: offline-auth.ts:331, AuthProvider.tsx:128

Steps:
1. Clear browser cache & IndexedDB
2. Login online → should create offline session
3. Check IndexedDB 'offline_session' structure
4. Logout
5. Go offline (DevTools → Network → Offline)
6. Login with same credentials
7. Should restore from offline session

Expected: Login successful offline
Actual: ? (MUST TEST)
```

### Test 3: Materi Page Data Loading
```
Priority: MEDIUM
Files: MateriPage.tsx:94

Steps:
1. Login as Dosen
2. Open Materi page → data loads
3. Switch to Kelas page
4. Switch back to Materi page
5. Check: Does data reload?

Before fix: Might reload every time (if loadData in deps)
After fix: Should NOT reload (only on mount or dosen.id change)

Expected: Data cached, no unnecessary reloads
Impact: Better performance, but might not show real-time updates
```

### Test 4: Jadwal Ownership Check
```
Priority: MEDIUM
Files: jadwal.api.ts:462-466

Steps:
1. Login as Dosen A
2. Create Jadwal Praktikum X
3. Logout
4. Login as Dosen B
5. Try to edit Jadwal X
6. Should see error: "Anda hanya dapat mengakses resource milik Anda sendiri"

Expected: Ownership check works
Before fix: Might have crashed (wrong table name 'jadwal')
After fix: Should work with correct table 'jadwal_praktikum'
```

---

## 🔧 Recommended Fixes Before Production

### Fix 1: Handle 'hilang' Condition Properly
```typescript
// src/lib/api/dosen.api.ts:1147
if (data.kondisi_kembali !== 'hilang') {
  // Only return to inventory if not lost
  const newStock = invData.jumlah_tersedia + peminjamanData.jumlah_pinjam;
  await supabase
    .from('inventaris')
    .update({ jumlah_tersedia: newStock })
    .eq('id', peminjamanData.inventaris_id);
}
```

### Fix 2: Add Database Migration for 'hilang' Enum
```sql
-- supabase/migrations/XX_add_hilang_to_equipment_condition.sql
ALTER TYPE equipment_condition ADD VALUE IF NOT EXISTS 'hilang';
```

### Fix 3: Add Refresh Button to PeminjamanPage
```typescript
// Since useEffect now runs once, add manual refresh
<Button onClick={() => { loadBorrowings(); loadEquipment(); }}>
  Refresh Data
</Button>
```

---

## ✅ Verification Steps

1. **Run Database Checks** (SQL queries above)
2. **Test Offline Login** (clear cache, go offline, login)
3. **Test Peminjaman Return** (especially kondisi 'hilang')
4. **Test Jadwal Ownership** (dosen can only edit their own)
5. **Test Materi Page** (data loads correctly)

---

## 🚨 Risk Assessment

| Change | Risk Level | Impact | Mitigation |
|--------|-----------|--------|------------|
| 'hilang' enum | HIGH | Database error if enum missing | Add to DB first |
| Offline auth | MEDIUM | Users might need re-login | Clear IndexedDB on deploy |
| useEffect deps | MEDIUM | Stale data on page revisit | Add refresh buttons |
| Middleware signature | LOW | Ownership check now works | Actually a fix! |

---

## 📝 Deployment Checklist

- [ ] Run database migration for 'hilang' enum
- [ ] Test offline login flow
- [ ] Test peminjaman return with all kondisi values
- [ ] Test jadwal ownership check
- [ ] Clear user IndexedDB on first load (version check)
- [ ] Add refresh buttons where needed (PeminjamanPage, etc.)

---

Generated: 2025-12-01
Status: NEEDS VERIFICATION BEFORE PRODUCTION
