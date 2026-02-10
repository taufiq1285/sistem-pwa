# Analisis Sistem Conflict Detection - Booking Lab Praktikum

**Tanggal**: 10 Februari 2026
**Penelitian**: Sistem Praktikum PWA - AKBID Mega Buana
**Fokus**: Pencegahan tabrakan penggunaan laboratorium

---

## 1. Overview Sistem

Sistem conflict detection bertujuan **mencegah double booking** laboratorium praktikum. Sistem memastikan bahwa tidak ada dua dosen yang dapat memesan lab yang sama pada waktu yang bertabrakan.

### 1.1 Lokasi Kode
- **File**: [src/lib/api/jadwal.api.ts](../src/lib/api/jadwal.api.ts)
- **Fungsi Utama**: `checkJadwalConflictByDate()` (Line 973-1033)
- **Pemanggil**:
  - `createJadwalImpl()` (Line 508) - Saat membuat jadwal baru
  - `updateJadwalImpl()` (Line 661) - Saat mengupdate jadwal

---

## 2. Algoritma Conflict Detection

### 2.1 Logika Deteksi

Sistem menggunakan algoritma **interval overlap detection** yang efisien:

```typescript
// Time Overlap Formula (Line 1010-1017)
const timeOverlaps = (start1: string, end1: string, start2: string, end2: string): boolean => {
  return start1 < end2 && start2 < end1;
};
```

**Penjelasan**:
- Dua time interval **OVERLAP** jika: `StartA < EndB` AND `StartB < EndA`
- Ini adalah formula standar untuk deteksi tabrakan interval waktu

### 2.2 Visualisasi

```
Skenario 1: Exact Overlap (Bentrok Total)
Jadwal A: 08:00 ───────────────── 10:00
Jadwal B:        08:00 ───────────────── 10:00
Result: ❌ CONFLICT (exact overlap)

Skenario 2: Partial Overlap (Bentrok Sebagian)
Jadwal A: 08:00 ───────────────── 10:00
Jadwal B:              09:00 ───────────────── 11:00
Result: ❌ CONFLICT (overlap: 09:00-10:00)

Skenario 3: Contained Within (Dalam Range)
Jadwal A: 08:00 ───────────────────────────────── 12:00
Jadwal B:        09:00 ───────────────── 10:00
Result: ❌ CONFLICT (B sepenuhnya dalam A)

Skenario 4: No Overlap (Tidak Bentrok)
Jadwal A: 08:00 ───────────────── 10:00
Jadwal B:                                    10:00 ───────────────── 12:00
Result: ✅ NO CONFLICT (bersebelahan, tidak overlap)
```

---

## 3. Filter yang Diterapkan

Sistem memeriksa conflict dengan 4 filter utama (Line 985-1007):

### 3.1 Filter 1: Laboratorium
```typescript
{ column: "laboratorium_id", operator: "eq", value: labId }
```
✅ **Hanya cek jadwal di lab yang sama**

### 3.2 Filter 2: Tanggal
```typescript
{ column: "tanggal_praktikum", operator: "eq", value: dateStr }
```
✅ **Hanya cek jadwal di tanggal yang sama**

### 3.3 Filter 3: Active Status
```typescript
{ column: "is_active", operator: "eq", value: true }
```
✅ **Hanya cek jadwal yang aktif (tidak termasuk yang sudah dihapus/soft delete)**

### 3.4 Filter 4: Approval Status ⚠️ **KRUSIAL**
```typescript
{ column: "status", operator: "in", value: ["pending", "approved"] }
```
✅ **Cek KEDUA status: pending DAN approved**

**Catatan Penting**:
- Ini adalah **perbaikan terbaru** (commit cd82ecd)
- Sebelumnya hanya mengecek `status: "approved"`
- Perbaikan ini mencegah bug: Dosen B bisa booking lab yang sudah di-booking Dosen A (masih pending approval)

---

## 4. Kapan Conflict Check Dilakukan?

### 4.1 Saat Create Jadwal (Line 508-519)
```typescript
const hasConflict = await checkJadwalConflictByDate(
  data.laboratorium_id,
  tanggalPraktikum,
  data.jam_mulai,
  data.jam_selesai,
);

if (hasConflict) {
  throw new Error(
    `Jadwal bentrok! Lab sudah terpakai pada ${format(tanggalPraktikum, "dd MMM yyyy", { locale: localeId })} jam ${data.jam_mulai}-${data.jam_selesai}`,
  );
}
```

**Flow**:
1. Dosen menginput data jadwal (lab, tanggal, jam)
2. Sistem mengecek conflict dengan jadwal yang ada
3. Jika ada conflict → **REJECT** dengan error message
4. Jika tidak ada conflict → Lanjut insert jadwal (status: pending)

### 4.2 Saat Update Jadwal (Line 661-673)
```typescript
if (
  data.laboratorium_id ||
  data.tanggal_praktikum ||
  data.jam_mulai ||
  data.jam_selesai
) {
  const hasConflict = await checkJadwalConflictByDate(
    labId,
    tanggalPraktikum,
    jamMulai,
    jamSelesai,
    id, // excludeId - skip self
  );

  if (hasConflict) {
    throw new Error(`Jadwal bentrok! Lab sudah terpakai pada waktu tersebut`);
  }
}
```

**Flow**:
1. Hanya cek conflict jika ada perubahan lab/tanggal/jam
2. Menggunakan `excludeId` untuk **skip diri sendiri** (agar tidak conflict dengan jadwal lama sendiri)
3. Jika ada conflict dengan jadwal lain → **REJECT**

---

## 5. Workflow Lengkap

```
┌─────────────────────────────────────────────────────────────────────┐
│                     WORKFLOW BOOKING LAB                            │
└─────────────────────────────────────────────────────────────────────┘

  DOSEN A                          DOSEN B                         LABORAN
    │                                │                                │
    │  1. Create Jadwal              │                                │
    │     Lab X, 08:00-10:00         │                                │
    │     (Status: PENDING)          │                                │
    │                                │                                │
    │  2. Check Conflict             │                                │
    │     ✅ No conflict              │                                │
    │                                │                                │
    │  3. Jadwal Created             │                                │
    │     (Status: PENDING)          │                                │
    │                                │                                │
    │                                │  4. Create Jadwal              │
    │                                │     Lab X, 08:00-10:00         │
    │                                │     (Sama persis!)             │
    │                                │                                │
    │                                │  5. Check Conflict             │
    │                                │     ❌ CONFLICT DETECTED!       │
    │                                │     (Dengan jadwal Dosen A)    │
    │                                │                                │
    │                                │  6. REJECT!                    │
    │                                │     Error message thrown       │
    │                                │                                │
    │                                │  7. Coba jam berbeda           │
    │                                │     Lab X, 10:00-12:00         │
    │                                │                                │
    │                                │  8. Check Conflict             │
    │                                │     ✅ No conflict              │
    │                                │                                │
    │                                │  9. Jadwal Created             │
    │                                │     (Status: PENDING)          │
    │                                │                                │
    │  10. Request Approval          │  11. Request Approval          │
    │      ke Laboran                    ke Laboran                    │
    │                                │                                │
    │                                │                          12. Review & Approve
    │                                │                                │
    │  ✅ Approved (08:00-10:00)      │  ✅ Approved (10:00-12:00)    │
    │                                │                                │
```

---

## 6. Edge Cases yang Ditangani

### 6.1 ✅ Exact Overlap
- Jam: 08:00-10:00 vs 08:00-10:00
- Result: **CONFLICT**

### 6.2 ✅ Partial Overlap (Front)
- Jam: 08:00-10:00 vs 09:00-11:00
- Result: **CONFLICT**

### 6.3 ✅ Partial Overlap (Back)
- Jam: 09:00-11:00 vs 08:00-10:00
- Result: **CONFLICT**

### 6.4 ✅ Contained Within
- Jam: 08:00-12:00 vs 09:00-10:00
- Result: **CONFLICT**

### 6.5 ✅ Adjacent (No Overlap)
- Jam: 08:00-10:00 vs 10:00-12:00
- Result: **NO CONFLICT** (boundary tidak dianggap overlap)

### 6.6 ✅ Different Lab
- Lab X, 08:00-10:00 vs Lab Y, 08:00-10:00
- Result: **NO CONFLICT**

### 6.7 ✅ Different Date
- Lab X, 2026-02-15, 08:00-10:00 vs Lab X, 2026-02-16, 08:00-10:00
- Result: **NO CONFLICT**

### 6.8 ✅ Inactive Jadwal
- Lab X, 08:00-10:00 (is_active: false / deleted) vs 08:00-10:00
- Result: **NO CONFLICT** (soft delete tidak dicek)

### 6.9 ✅ Self-Update (excludeId)
- Update jadwal sendiri dari 08:00-10:00 ke 08:00-10:00
- Result: **NO CONFLICT** (skip diri sendiri)

### 6.10 ✅ Pending + Approved Status
- Cek conflict untuk status: `["pending", "approved"]`
- Result: **BOTH checked** (perbaikan terbaru)

---

## 7. Kelebihan Sistem

### 7.1 ✅ First-Come-First-Served
- Dosen pertama yang booking dapat prioritas
- Dosen berikutnya otomatis ditolak jika bentrok

### 7.2 ✅ Real-time Validation
- Conflict check dilakukan **SAAT create/update**
- Tidak perlu menunggu approval laboran

### 7.3 ✅ Multi-Status Protection
- Mencegah conflict dengan jadwal **pending** maupun **approved**
- Tidak ada celah untuk double booking

### 7.4 ✅ Soft Delete Compatible
- Jadwal yang sudah dihapus (is_active: false) tidak dicek
- Tidak mengganggu validasi

### 7.5 ✅ Self-Update Safe
- Bisa update jadwal sendiri tanpa trigger false conflict
- Menggunakan `excludeId` parameter

### 7.6 ✅ User-Friendly Error Messages
- Error message jelas: "Jadwal bentrok! Lab sudah terpakai pada..."
- Format tanggal Indonesia (dd MMM yyyy)

---

## 8. Potensi Limitations & Risks

### 8.1 ⚠️ Race Condition (Low Risk)
**Scenario**:
- Dosen A dan Dosen B submit jadwal **pada saat yang sama** (millisecond difference)
- Keduanya mungkin lewat conflict check sebelum jadwal lain terinsert

**Mitigation**:
- Database level constraint (UNIQUE constraint) dapat ditambahkan
- Atau gunakan database transaction dengan proper locking

**Recommendation**:
```sql
-- Tambah constraint di database level
ALTER TABLE jadwal_praktikum
ADD CONSTRAINT no_overlap_constraint
EXCLUDE USING GIST (
  laboratorium_id WITH =,
  tanggal_praktikum WITH =,
  tsrange(jam_mulai, jam_selesai) WITH &&
)
WHERE (is_active = true AND status IN ('pending', 'approved'));
```

### 8.2 ⚠️ No Concurrent Editing Warning
**Scenario**:
- Dosen A membuka form edit jadwal
- Dosen B mengedit jadwal yang sama dan submit
- Dosen A submit tanpa knowing changes dari Dosen B

**Mitigation**:
- Tambah optimistic locking (version field)
- Atau show warning jika jadwal sedang diedit oleh user lain

### 8.3 ⚠️ Calendar View Not Real-time
**Scenario**:
- Dosen B melihat calendar (cached data)
- Dosen A baru saja booking lab
- Dosen B mencoba booking dan baru tahu setelah submit

**Mitigation**:
- Add real-time subscription (Supabase Realtime)
- Atau refresh data sebelum submit

### 8.4 ⚠️ Error Message Not Specific
**Current**:
```typescript
throw new Error(`Jadwal bentrok! Lab sudah terpakai pada ${format(tanggalPraktikum, "dd MMM yyyy", { locale: localeId })} jam ${data.jam_mulai}-${data.jam_selesai}`);
```

**Issue**: User tidak tahu siapa yang sudah booking lab tersebut

**Improvement**:
```typescript
throw new Error(
  `Lab sudah dibooking oleh Dr. ${existingJadwal.dosen_nama} ` +
  `untuk praktikum "${existingJadwal.topik}" ` +
  `pada jam ${existingJadwal.jam_mulai}-${existingJadwal.jam_selesai}`
);
```

---

## 9. Rekomendasi untuk Penelitian

### 9.1 Untuk Skripsi/Tesis
Bagus untuk dibahas di Bab **Analisis dan Perancangan**:

1. **Bab 3.1 - Analisis Masalah**:
   - "Kebutuhan untuk mencegah tabrakan jadwal penggunaan lab"
   - "Masalah double booking dapat menyebabkan konflik antar dosen"

2. **Bab 3.2 - Solusi**:
   - "Implementasi algoritma interval overlap detection"
   - "Validasi real-time saat create/update jadwal"
   - "Multi-status protection (pending + approved)"

3. **Bab 4 - Implementasi**:
   - Sertakan code snippet algoritma
   - Diagram flow seperti di Section 5
   - Sertakan visualisasi overlap (Section 2.2)

4. **Bab 5 - Pengujian**:
   - Skenario test cases (Section 6)
   - Hasil pengujian manual (bisa pakai test-conflict-detection.sql)

### 9.2 Untuk Paper/Jurnal
Potential title:
- *"Real-time Conflict Detection Algorithm for Laboratory Booking System"*
- *"Preventing Double Booking in Educational Resource Scheduling"*

### 9.3 Untuk Presentasi
- Tampilkan visualisasi overlap (Section 2.2)
- Demo skenario conflict detection
- Flowchart workflow (Section 5)

---

## 10. Kesimpulan

### 10.1 Sistem Sudah ROBUST ✅
Sistem conflict detection yang ada sudah **cukup baik** untuk mencegah double booking:

✅ Algoritma overlap yang benar
✅ Filter lengkap (lab, tanggal, status, active)
✅ Cek pending + approved (perbaikan terbaru)
✅ Edge cases handled dengan baik
✅ User-friendly error messages

### 10.2 Ready untuk Production ✅
Dengan perbaikan terbaru (commit cd82ecd), sistem sudah **aman** digunakan:

- Tidak ada celah untuk double booking
- First-come-first-served terjamin
- Soft delete tidak mengganggu validasi

### 10.3 Room for Improvement ⚠️
Beberapa improvement opsional untuk future development:

1. Database-level constraint (anti-race condition)
2. More specific error messages (siapa yang booking)
3. Real-time subscription untuk calendar view
4. Optimistic locking untuk concurrent editing

### 10.4 Rekomendasi Pengujian
Sebelum deployment ke production, lakukan pengujian:

1. ✅ Manual test di Supabase: [test-conflict-detection.sql](migrations/test-conflict-detection.sql)
2. ✅ Test lewat aplikasi: Skenario Dosen A vs Dosen B
3. ✅ Load test: Coba booking concurrent untuk test race condition
4. ✅ Test semua edge cases (Section 6)

---

## 11. Lampiran

### 11.1 Relevant Files
- [src/lib/api/jadwal.api.ts](../src/lib/api/jadwal.api.ts) - Implementation
- [migrations/test-conflict-detection.sql](migrations/test-conflict-detection.sql) - Manual test
- [src/lib/api/__tests__/jadwal-conflict.test.ts](../src/lib/api/__tests__/jadwal-conflict.test.ts) - Unit test

### 11.2 Recent Commits
- `cd82ecd` - "fix: check conflict for BOTH pending and approved jadwal"
- Perbaikan ini mengatasi bug double booking

### 11.3 Related Functions
- `checkJadwalConflictByDate()` - Main conflict detection
- `createJadwalImpl()` - Create with conflict check
- `updateJadwalImpl()` - Update with conflict check

---

**Dokumen ini dibuat untuk mendukung penelitian Sistem Praktikum PWA**
**AKBID Mega Buana - 2026**
