# 🔄 Hybrid Approval Workflow - Implementation Guide

**Date:** 2025-12-09
**Feature:** Jadwal Praktikum Auto-Approve + Manual Override by Laboran

---

## 📋 Overview

### **Konsep Hybrid Approval:**

```
┌─────────────────────────────────────────────────────────────┐
│                    DOSEN CREATE JADWAL                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
         ┌─────────────────────────┐
         │ Auto-Check Double Book  │
         └─────────┬───────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
   ✅ OK                  ❌ BENTROK
        │                     │
        ▼                     ▼
Status: APPROVED         ERROR MESSAGE
(Auto, langsung)    "Jadwal bentrok!"
        │
        ▼
┌───────────────────────────────────┐
│   JADWAL MUNCUL DI CALENDAR       │
│   (Visible untuk dosen & mhs)     │
└───────────┬───────────────────────┘
            │
            │  ┌──────────────────────────────┐
            └─→│ LABORAN BISA CANCEL/OVERRIDE │
               └──────────┬───────────────────┘
                          │
                          ▼
                    ┌──────────┐
                    │  CANCEL  │
                    └─────┬────┘
                          │
                          ▼
                  Status: CANCELLED
                  (+ reason, who, when)
                          │
                          ▼
            ┌──────────────────────────────┐
            │ HILANG DARI CALENDAR DOSEN   │
            │ DOSEN DAPAT NOTIFIKASI       │
            └──────────────────────────────┘
```

---

## 🎯 Benefits

### **Untuk Dosen:**
- ✅ Tidak perlu nunggu approval (langsung approved jika OK)
- ✅ Langsung bisa lihat jadwal di calendar
- ✅ Workflow cepat dan efisien

### **Untuk Laboran:**
- ✅ Tetap punya kontrol penuh
- ✅ Bisa cancel jadwal jika ada masalah (maintenance, dll)
- ✅ Audit trail lengkap (siapa cancel, kapan, kenapa)

### **Untuk Sistem:**
- ✅ Prevent double booking (auto-validation)
- ✅ Flexible (laboran bisa intervene)
- ✅ Traceable (semua aksi tercatat)

---

## 🗄️ Database Changes

### **New Columns di `jadwal_praktikum`:**

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `status` | VARCHAR(20) | 'approved' | Status jadwal: 'approved' atau 'cancelled' |
| `cancelled_by` | UUID | NULL | User ID laboran yang cancel |
| `cancelled_at` | TIMESTAMPTZ | NULL | Waktu kapan di-cancel |
| `cancellation_reason` | TEXT | NULL | Alasan kenapa di-cancel |

### **New Functions:**

1. **`cancel_jadwal_praktikum(jadwal_id, reason)`**
   - Cancel jadwal dengan alasan
   - Hanya laboran yang bisa call
   - Auto-record who, when, why

2. **`reactivate_jadwal_praktikum(jadwal_id)`**
   - Reaktivasi jadwal yang sudah di-cancel
   - Hanya laboran yang bisa call
   - Clear semua cancel metadata

### **New View:**

- **`active_jadwal_praktikum`**
  - View untuk jadwal approved only
  - Include join dengan kelas, mata kuliah, lab
  - Exclude jadwal yang cancelled

---

## 🚀 Step-by-Step Implementation

### **STEP 1: Run Migration SQL** ⚠️ **USER MUST DO THIS**

1. **Buka Supabase Dashboard** → SQL Editor
2. **Copy semua isi file:** `supabase/migrations/45_add_jadwal_approval_workflow.sql`
3. **Paste dan RUN**
4. **Verify berhasil:**
   - Cek output verification queries
   - Harusnya ada 4 columns baru
   - Harusnya ada 2 functions baru
   - Harusnya ada 1 view baru

**Expected Output:**
```
✅ 4 new columns: status, cancelled_by, cancelled_at, cancellation_reason
✅ 2 new functions: cancel_jadwal_praktikum, reactivate_jadwal_praktikum
✅ 1 new view: active_jadwal_praktikum
```

---

### **STEP 2: Update API (AUTO - Claude will do)**

Will add these functions to `src/lib/api/jadwal.api.ts`:

```typescript
// Cancel jadwal (laboran only)
export async function cancelJadwal(
  jadwalId: string,
  reason: string
): Promise<void>

// Reactivate cancelled jadwal (laboran only)
export async function reactivateJadwal(
  jadwalId: string
): Promise<void>

// Get all jadwal including cancelled (laboran view)
export async function getAllJadwalForLaboran(): Promise<Jadwal[]>
```

---

### **STEP 3: Update Calendar Query (AUTO - Claude will do)**

Update `getCalendarEvents` to **filter out cancelled jadwal**:

```typescript
// BEFORE:
const jadwalList = await queryWithFilters("jadwal_praktikum", [
  { column: "is_active", operator: "eq", value: true }
]);

// AFTER:
const jadwalList = await queryWithFilters("jadwal_praktikum", [
  { column: "is_active", operator: "eq", value: true },
  { column: "status", operator: "eq", value: "approved" }  // ✅ NEW
]);
```

---

### **STEP 4: Create Laboran Management Page (AUTO - Claude will do)**

New page: `/laboran/jadwal-approval`

**Features:**
- 📋 List all jadwal (approved + cancelled)
- ❌ Cancel button per jadwal
- ↩️ Reactivate button untuk jadwal cancelled
- 📝 Show cancellation details (who, when, why)
- 🔍 Filter by status, lab, date range

---

### **STEP 5: Add Notification (OPTIONAL - Later)**

When laboran cancel jadwal:
- 📧 Send notification to dosen
- 💬 Show in-app notification
- 📱 Push notification (if enabled)

---

## 🧪 Testing Checklist

### **Test Scenario 1: Normal Flow (Auto-Approve)**
- [ ] Login sebagai dosen
- [ ] Create jadwal baru (pilih lab, tanggal, jam)
- [ ] Verify: No error, jadwal langsung approved
- [ ] Check: Jadwal muncul di calendar
- [ ] Check database: `status = 'approved'`

### **Test Scenario 2: Double Booking Prevention**
- [ ] Login sebagai dosen lain
- [ ] Create jadwal di lab + tanggal + jam yang SAMA
- [ ] Verify: Error "Jadwal bentrok!"
- [ ] Check: Jadwal TIDAK tersimpan

### **Test Scenario 3: Laboran Cancel Jadwal**
- [ ] Login sebagai laboran
- [ ] Buka halaman jadwal management
- [ ] Click "Cancel" pada salah satu jadwal
- [ ] Isi alasan: "Lab sedang maintenance"
- [ ] Click "Confirm Cancel"
- [ ] Verify: Status berubah 'cancelled'
- [ ] Check: Jadwal hilang dari calendar dosen
- [ ] Check database: `cancelled_by`, `cancelled_at`, `cancellation_reason` terisi

### **Test Scenario 4: Reactivate Jadwal**
- [ ] Login sebagai laboran
- [ ] Buka halaman jadwal management
- [ ] Filter: Show cancelled only
- [ ] Click "Reactivate" pada jadwal yang tadi di-cancel
- [ ] Verify: Status kembali 'approved'
- [ ] Check: Jadwal muncul lagi di calendar dosen
- [ ] Check database: Cancel metadata cleared

---

## 📊 Database Queries untuk Monitoring

### **1. Lihat semua jadwal dengan status:**
```sql
SELECT
  jp.id,
  jp.status,
  jp.tanggal_praktikum,
  l.nama_lab,
  k.nama_kelas,
  u.full_name as cancelled_by,
  jp.cancelled_at,
  jp.cancellation_reason
FROM jadwal_praktikum jp
LEFT JOIN laboratorium l ON jp.laboratorium_id = l.id
LEFT JOIN kelas k ON jp.kelas_id = k.id
LEFT JOIN users u ON jp.cancelled_by = u.id
ORDER BY jp.tanggal_praktikum DESC;
```

### **2. Count by status:**
```sql
SELECT
  status,
  COUNT(*) as total
FROM jadwal_praktikum
GROUP BY status;
```

### **3. Laboran activity (siapa yang sering cancel):**
```sql
SELECT
  u.full_name as laboran_name,
  COUNT(*) as total_cancelled
FROM jadwal_praktikum jp
JOIN users u ON jp.cancelled_by = u.id
WHERE jp.status = 'cancelled'
GROUP BY u.full_name
ORDER BY total_cancelled DESC;
```

### **4. Most common cancellation reasons:**
```sql
SELECT
  cancellation_reason,
  COUNT(*) as frequency
FROM jadwal_praktikum
WHERE status = 'cancelled'
AND cancellation_reason IS NOT NULL
GROUP BY cancellation_reason
ORDER BY frequency DESC;
```

---

## ⚠️ Important Notes

### **Permissions:**
- ✅ **Dosen:** Create, edit, delete OWN jadwal
- ✅ **Laboran:** View ALL, cancel ANY, reactivate ANY
- ✅ **Mahasiswa:** View approved jadwal only (read-only)

### **Business Rules:**
1. **Auto-approve:** Semua jadwal baru default status = 'approved' (jika tidak bentrok)
2. **Cancel only:** Laboran TIDAK bisa reject saat create (auto-approve dulu, baru cancel jika perlu)
3. **Audit trail:** Semua cancel action tercatat (who, when, why)
4. **Reversible:** Cancelled jadwal bisa di-reactivate
5. **Visibility:** Cancelled jadwal HANYA visible untuk laboran (hidden dari calendar dosen/mahasiswa)

---

## 🎬 Next Actions

### **Immediate (USER):**
1. ✅ **RUN migration SQL** di Supabase
2. ✅ **Verify** migration berhasil
3. ✅ **Report back** ke Claude

### **Then (CLAUDE):**
4. Update `jadwal.api.ts` - add cancel/reactivate functions
5. Update `getCalendarEvents` - filter cancelled
6. Create laboran management page
7. Test end-to-end workflow

---

## 📞 Support

Jika ada masalah:
1. Check Supabase logs (SQL errors)
2. Check browser console (API errors)
3. Check RLS policies (permission errors)

---

**Status:** ⏳ **WAITING FOR USER** to run migration SQL

**Next:** After migration, Claude will implement API + UI updates

---

**Created:** 2025-12-09
**Version:** 1.0
**Author:** System (Claude Code)
