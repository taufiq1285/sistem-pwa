# 📋 JADWAL APPROVAL SYSTEM - IMPACT ANALYSIS

**Date**: 2025-12-09
**Change**: Set `jadwal_praktikum.is_active` default dari `TRUE` → `FALSE`
**Reason**: Implement approval workflow untuk peminjaman ruangan (room booking)

---

## 🎯 RINGKASAN PERUBAHAN

### **SEBELUM (Current)**
```
DOSEN → Buat Jadwal → is_active = TRUE → Jadwal langsung aktif ✅
```

### **SESUDAH (With Approval)**
```
DOSEN → Buat Jadwal → is_active = FALSE (pending)
  ↓
LABORAN → Review di /laboran/persetujuan
  ↓
LABORAN → Approve → is_active = TRUE ✅
       → Reject → Jadwal dihapus ❌
```

---

## 🔍 AUDIT LENGKAP - SEMUA YANG TERPENGARUH

### ✅ 1. DATABASE SCHEMA

#### File: `supabase/migrations/01_tables.sql`
**Line 152:**
```sql
-- SEBELUM:
is_active BOOLEAN DEFAULT true,

-- SESUDAH:
is_active BOOLEAN DEFAULT false,
```

**Impact**: Semua jadwal baru akan default `pending` (is_active = false)

---

#### File: `supabase/migrations/02_indexes.sql`
**Line 50:**
```sql
-- Index saat ini hanya untuk is_active = true
CREATE INDEX IF NOT EXISTS idx_jadwal_active ON jadwal_praktikum(is_active) WHERE is_active = true;

-- PERLU DITAMBAH index untuk pending:
CREATE INDEX IF NOT EXISTS idx_jadwal_pending ON jadwal_praktikum(is_active) WHERE is_active = false;
```

**Impact**: Perlu index baru untuk query pending jadwal oleh laboran

---

### ✅ 2. API FUNCTIONS

#### File: `src/lib/api/jadwal.api.ts`

**Line 136: `getJadwalByLab()`**
```typescript
// SEBELUM:
return await getJadwal({ laboratorium_id: labId, is_active: true });

// SESUDAH: TIDAK PERLU UBAH (sudah benar)
// Function ini memang hanya ambil jadwal yang sudah approved
return await getJadwal({ laboratorium_id: labId, is_active: true });
```
**Impact**: ✅ Tidak perlu ubah - ini untuk tampilan jadwal aktif

---

**Line 385: `createJadwalImpl()`** ⚠️ **CRITICAL CHANGE**
```typescript
// SEBELUM:
is_active: data.is_active ?? true,

// SESUDAH:
is_active: data.is_active ?? false,
```
**Impact**: 🔴 **MUST CHANGE** - Ini yang membuat jadwal pending by default

---

**Line 627: `checkJadwalConflictByRecurring()`**
```typescript
// SEBELUM:
is_active: true,

// SESUDAH: TIDAK PERLU UBAH
is_active: true,
```
**Impact**: ✅ Tidak perlu ubah - conflict check hanya untuk jadwal yang sudah approved

---

### ✅ 3. FRONTEND PAGES

#### File: `src/pages/dosen/JadwalPage.tsx`

**Line 200:**
```typescript
// Filter untuk tampilan list jadwal
const filters: Record<string, string | boolean> = { is_active: true };
```
**Impact**: ✅ Tidak perlu ubah - Dosen lihat jadwal yang sudah approved

**TAPI perlu TAMBAH tab/section untuk:**
```typescript
// Jadwal Pending (menunggu approval)
const pendingJadwal = await getJadwal({ is_active: false, /* filter by dosen */ });

// Jadwal Aktif (sudah approved)
const activeJadwal = await getJadwal({ is_active: true });
```

**Recommendation**: Tambah 2 tabs:
- ✅ **Jadwal Aktif** (is_active = true)
- ⏳ **Menunggu Approval** (is_active = false)

---

#### File: `src/pages/laboran/PersetujuanPage.tsx`

**Line 131: `getPendingRoomBookings()`**
```typescript
// Sudah benar! Function ini query is_active = false
const data = await getPendingRoomBookings(50);
```
**Impact**: ✅ Tidak perlu ubah - sudah support approval workflow

---

#### File: `src/pages/mahasiswa/JadwalPage.tsx` (if exists)

```typescript
// Mahasiswa hanya lihat jadwal yang sudah approved
const filters = { is_active: true };
```
**Impact**: ✅ Tidak perlu ubah - Mahasiswa tidak perlu lihat pending jadwal

---

### ✅ 4. RLS POLICIES

#### File: `supabase/migrations/21_enhanced_rls_policies.sql`

**Line 649-695: Policies untuk jadwal_praktikum**

```sql
-- SELECT: Semua authenticated user bisa lihat
CREATE POLICY "jadwal_praktikum_select_all" ON jadwal_praktikum
    FOR SELECT USING (auth.uid() IS NOT NULL);
```

**⚠️ POTENTIAL ISSUE:**
Dengan policy ini, **mahasiswa bisa lihat pending jadwal** (is_active = false)

**REKOMENDASI:**
```sql
-- Option 1: Mahasiswa & Dosen hanya lihat jadwal approved
DROP POLICY "jadwal_praktikum_select_all" ON jadwal_praktikum;

CREATE POLICY "jadwal_praktikum_select_mahasiswa" ON jadwal_praktikum
    FOR SELECT
    USING (
        is_mahasiswa()
        AND is_active = true  -- Hanya yang approved
        AND kelas_id = ANY(get_mahasiswa_kelas_ids())
    );

-- Option 2: Dosen bisa lihat pending mereka sendiri
CREATE POLICY "jadwal_praktikum_select_dosen" ON jadwal_praktikum
    FOR SELECT
    USING (
        is_dosen()
        AND (
            is_active = true  -- Semua jadwal approved
            OR (is_active = false AND dosen_teaches_kelas(kelas_id))  -- Pending mereka
        )
    );

-- Laboran lihat semua (untuk approval)
CREATE POLICY "jadwal_praktikum_select_laboran" ON jadwal_praktikum
    FOR SELECT
    USING (is_laboran());

-- Admin lihat semua
CREATE POLICY "jadwal_praktikum_select_admin" ON jadwal_praktikum
    FOR SELECT
    USING (is_admin());
```

**Impact**: 🔴 **PERLU REVISI RLS** - Agar mahasiswa tidak lihat pending jadwal

---

#### UPDATE Policy untuk Laboran

**Line 690-692:**
```sql
-- Laboran bisa UPDATE (untuk approve/reject)
CREATE POLICY "jadwal_praktikum_update_laboran" ON jadwal_praktikum
    FOR UPDATE
    USING (is_laboran());
```
**Impact**: ✅ Sudah OK - Laboran bisa approve (set is_active = true)

---

### ✅ 5. TRIGGERS & FUNCTIONS

#### File: `supabase/migrations/04_triggers.sql`

**Line 59-62:**
```sql
-- Trigger untuk update updated_at
CREATE TRIGGER update_jadwal_praktikum_updated_at
    BEFORE UPDATE ON jadwal_praktikum
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```
**Impact**: ✅ Tidak terpengaruh - Trigger generic untuk semua update

---

### ✅ 6. EXISTING APPROVAL INFRASTRUCTURE

Infrastructure sudah lengkap! Tinggal diaktifkan:

#### File: `src/lib/api/peminjaman-extensions.ts`

**Line 271-283: `getPendingRoomBookings()`** ✅
```typescript
const { data, error } = await supabase
  .from("jadwal_praktikum")
  .select("...")
  .eq("is_active", false)  // ← Ambil pending
  .order("created_at", { ascending: false })
  .limit(limit);
```

**Line 421-437: `approveRoomBooking()`** ✅
```typescript
const { error } = await supabase
  .from("jadwal_praktikum")
  .update({
    is_active: true,  // ← Set approved
    updated_at: new Date().toISOString(),
  })
  .eq("id", jadwalId)
  .eq("is_active", false);  // Only approve if still pending
```

**Line 442-465: `rejectRoomBooking()`** ✅
```typescript
const { error } = await supabase
  .from("jadwal_praktikum")
  .delete()
  .eq("id", jadwalId)
  .eq("is_active", false);
```

**Impact**: ✅ **SUDAH SIAP!** Tidak perlu ubah apapun

---

#### File: `src/pages/laboran/PersetujuanPage.tsx`

**Line 128-138: Load pending room bookings** ✅
```typescript
const loadRoomRequests = async () => {
  try {
    setLoadingRoom(true);
    const data = await getPendingRoomBookings(50);
    setRoomRequests(data);
  } catch (error) {
    toast.error("Gagal memuat permintaan booking ruangan");
  } finally {
    setLoadingRoom(false);
  }
};
```

**Line 155-176: Approve/Reject handlers** ✅
```typescript
const handleApprove = async () => {
  if (approveDialog.type === "room") {
    await approveRoomBooking(approveDialog.id);
    toast.success("Booking ruangan berhasil disetujui");
    await loadRoomRequests();
  }
};
```

**Impact**: ✅ **SUDAH SIAP!** UI approval sudah ada

---

## 📊 SUMMARY: FILES YANG PERLU DIUBAH

### 🔴 WAJIB UBAH (Critical)

| File | Line | Change | Reason |
|------|------|--------|--------|
| `supabase/migrations/01_tables.sql` | 152 | `DEFAULT true` → `DEFAULT false` | Default pending |
| `src/lib/api/jadwal.api.ts` | 385 | `?? true` → `?? false` | Default pending di API |

### 🟡 STRONGLY RECOMMENDED

| File | Line | Change | Reason |
|------|------|--------|--------|
| `supabase/migrations/02_indexes.sql` | - | Add index for `is_active = false` | Performance untuk query pending |
| `supabase/migrations/25_fix_jadwal_rls_policy.sql` | - | Revisi SELECT policies | Mahasiswa tidak lihat pending |
| `src/pages/dosen/JadwalPage.tsx` | - | Add "Pending" tab | Dosen lihat status jadwal mereka |

### 🟢 OPTIONAL (Enhancement)

| File | Change | Reason |
|------|--------|--------|
| `src/lib/api/peminjaman-extensions.ts` | Add `rejection_reason` field | Track kenapa jadwal ditolak |
| `supabase/migrations/` | Add `jadwal_praktikum.rejection_reason` column | Store rejection reason |

---

## 🚀 MIGRATION PLAN

### Step 1: Create Migration File
```sql
-- File: supabase/migrations/99_enable_jadwal_approval.sql

-- Step 1: Add index for pending jadwal
CREATE INDEX IF NOT EXISTS idx_jadwal_pending
ON jadwal_praktikum(is_active, created_at DESC)
WHERE is_active = false;

-- Step 2: Change default for new records
ALTER TABLE jadwal_praktikum
ALTER COLUMN is_active SET DEFAULT false;

-- Step 3: (Optional) Add rejection_reason field
ALTER TABLE jadwal_praktikum
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Step 4: Update RLS policies (see detailed SQL below)
```

### Step 2: Update RLS Policies
```sql
-- Drop existing broad policy
DROP POLICY IF EXISTS "jadwal_praktikum_select_all" ON jadwal_praktikum;

-- Admin: See all
CREATE POLICY "jadwal_select_admin" ON jadwal_praktikum
    FOR SELECT USING (is_admin());

-- Laboran: See all (for approval)
CREATE POLICY "jadwal_select_laboran" ON jadwal_praktikum
    FOR SELECT USING (is_laboran());

-- Dosen: See approved + own pending
CREATE POLICY "jadwal_select_dosen" ON jadwal_praktikum
    FOR SELECT
    USING (
        is_dosen() AND (
            is_active = true  -- All approved schedules
            OR (
                is_active = false
                AND kelas_id IN (
                    SELECT id FROM kelas WHERE dosen_id = get_current_dosen_id()
                )
            )
        )
    );

-- Mahasiswa: See only approved for their classes
CREATE POLICY "jadwal_select_mahasiswa" ON jadwal_praktikum
    FOR SELECT
    USING (
        is_mahasiswa()
        AND is_active = true
        AND kelas_id = ANY(get_mahasiswa_kelas_ids())
    );
```

### Step 3: Update API Code
```typescript
// File: src/lib/api/jadwal.api.ts
// Line 385
is_active: data.is_active ?? false,  // Changed from true
```

### Step 4: Update Frontend (Optional)
```typescript
// File: src/pages/dosen/JadwalPage.tsx
// Add tabs untuk Pending & Approved jadwal
```

---

## ⚠️ MIGRATION CONSIDERATIONS

### Data Migration (Existing Records)
```sql
-- JANGAN ubah existing records!
-- Jadwal yang sudah ada tetap is_active = true
-- Hanya jadwal baru yang default false

-- Check existing data:
SELECT
  is_active,
  COUNT(*)
FROM jadwal_praktikum
GROUP BY is_active;

-- Expected result:
-- is_active | count
-- ----------|-------
-- true      | XXX   (existing - tetap active)
-- false     | 0     (belum ada yang pending)
```

### Rollback Plan
```sql
-- Jika perlu rollback:
ALTER TABLE jadwal_praktikum
ALTER COLUMN is_active SET DEFAULT true;

-- Approve all pending jadwal
UPDATE jadwal_praktikum
SET is_active = true
WHERE is_active = false;
```

---

## 🧪 TESTING CHECKLIST

### Database Level
- [ ] Migration berhasil di local Supabase
- [ ] Index untuk pending jadwal dibuat
- [ ] RLS policies updated
- [ ] Existing jadwal tetap active (tidak terpengaruh)

### API Level
- [ ] `createJadwal()` → jadwal baru is_active = false
- [ ] `getPendingRoomBookings()` → return pending jadwal
- [ ] `approveRoomBooking()` → set is_active = true
- [ ] `rejectRoomBooking()` → delete jadwal
- [ ] `getJadwal({ is_active: true })` → hanya approved

### UI Level
- [ ] **Dosen**: Buat jadwal → Status "Menunggu Approval"
- [ ] **Laboran**: Lihat pending di `/laboran/persetujuan`
- [ ] **Laboran**: Approve → Jadwal muncul di kalender
- [ ] **Laboran**: Reject → Jadwal hilang
- [ ] **Mahasiswa**: Hanya lihat jadwal approved
- [ ] **Dosen**: Lihat pending jadwal sendiri

### Workflow End-to-End
```
1. Login sebagai Dosen
2. Buat jadwal praktikum baru
3. Verify: Jadwal status = "Pending" (is_active = false)
4. Verify: Jadwal TIDAK muncul di kalender mahasiswa

5. Login sebagai Laboran
6. Buka /laboran/persetujuan
7. Verify: Ada pending room booking
8. Approve jadwal
9. Verify: is_active berubah jadi true

10. Login sebagai Mahasiswa
11. Verify: Jadwal sekarang muncul di kalender
```

---

## 📝 COMMUNICATION PLAN

### For Users (Dosen)
```
⚠️ PERUBAHAN SISTEM JADWAL

Mulai [TANGGAL], jadwal praktikum yang Anda buat akan:
1. Status awal: "Menunggu Approval"
2. Laboran akan review & approve
3. Setelah approved, jadwal aktif di kalender mahasiswa

Manfaat:
✅ Cegah konflik ruangan
✅ Koordinasi lebih baik dengan laboran
✅ Ketersediaan alat terjamin
```

### For Laboran
```
🆕 FITUR BARU: APPROVAL JADWAL RUANGAN

Sekarang Anda bisa approve/reject jadwal praktikum:
1. Buka /laboran/persetujuan
2. Tab "Booking Ruangan"
3. Review → Approve/Reject

Kenapa?
- Kontrol penggunaan laboratorium
- Cegah double booking
- Pastikan alat tersedia
```

---

## ✅ RECOMMENDATION

**GO with OPSI 1 (Dengan Approval)** karena:

1. ✅ Infrastructure sudah 90% ready
2. ✅ Konsisten dengan peminjaman alat (perlu approval)
3. ✅ Mencegah konflik jadwal
4. ✅ Laboran punya kontrol penuh
5. ✅ Lebih aman untuk sistem akademik

**Files yang WAJIB diubah**: HANYA 2 files!
- `supabase/migrations/99_enable_jadwal_approval.sql` (new)
- `src/lib/api/jadwal.api.ts` (1 line)

**Effort**: 🟢 LOW (< 1 jam)
**Risk**: 🟢 LOW (tidak break existing data)
**Impact**: 🟢 HIGH (better workflow)

---

**Created by**: Claude Code
**Date**: 2025-12-09
**Status**: ✅ READY FOR IMPLEMENTATION
