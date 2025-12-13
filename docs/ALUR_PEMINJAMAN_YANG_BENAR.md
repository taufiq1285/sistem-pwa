# Alur Peminjaman yang Benar

## Ringkasan Perubahan

**SEBELUM (Salah - Duplikasi):**
- ❌ Dosen: `/dosen/peminjaman` - Submit peminjaman
- ❌ Laboran: `/laboran/peminjaman` - Kelola peminjaman (DUPLIKASI!)
- ❌ Laboran: `/laboran/persetujuan` - Persetujuan peminjaman (DUPLIKASI!)

**SESUDAH (Benar - Clear Separation):**
- ✅ Dosen: `/dosen/peminjaman` - Submit peminjaman alat lab
- ✅ Laboran: `/laboran/persetujuan` - Approve/Reject peminjaman

---

## Alur Bisnis yang Benar

### 1. DOSEN - Mengajukan Peminjaman
**Route:** `/dosen/peminjaman`
**Halaman:** `src/pages/dosen/PeminjamanPage.tsx`
**Fungsi:**
- Dosen mengisi form peminjaman alat laboratorium
- Memilih alat yang ingin dipinjam
- Menentukan jumlah dan tanggal peminjaman
- Menyebutkan keperluan/tujuan peminjaman
- Submit request ke sistem
- Status awal: **PENDING**

**Form Input:**
- Nama alat
- Kode alat
- Jumlah
- Keperluan (untuk praktikum apa)
- Tanggal pinjam
- Tanggal kembali (rencana)

### 2. LABORAN - Menyetujui/Menolak Peminjaman
**Route:** `/laboran/persetujuan`
**Halaman:** `src/pages/laboran/PersetujuanPage.tsx`
**Fungsi:**
- Laboran melihat semua pending requests
- Review detail peminjaman
- **APPROVE** jika alat tersedia dan request valid
- **REJECT** jika alat tidak tersedia atau request tidak valid (dengan alasan)
- Status berubah: **PENDING** → **APPROVED** atau **REJECTED**

**Approval Dashboard:**
- Daftar pending equipment borrowing
- Daftar pending room booking
- Quick approve/reject dengan dialog konfirmasi
- Input rejection reason (wajib jika reject)

---

## Status Peminjaman

| Status | Deskripsi | Flow |
|--------|-----------|------|
| **PENDING** | Menunggu persetujuan laboran | Dosen submit → Pending |
| **APPROVED** | Disetujui, alat dapat diambil | Laboran approve → Approved |
| **REJECTED** | Ditolak dengan alasan | Laboran reject → Rejected |
| **RETURNED** | Alat sudah dikembalikan | Dosen/Laboran mark return → Returned |
| **OVERDUE** | Melewati batas waktu kembali | System auto → Overdue |

---

## File yang Diubah

### 1. Routes
**File:** `src/routes/index.tsx`
- ❌ Dihapus: Route `/laboran/peminjaman`
- ✅ Pertahankan: Route `/laboran/persetujuan`
- ✅ Pertahankan: Route `/dosen/peminjaman`

### 2. Navigation Menu
**File:** `src/config/navigation.config.ts`
- ❌ Dihapus: Menu "Peminjaman" dari laboran navigation
- ✅ Pertahankan: Menu "Persetujuan" untuk laboran
- ✅ Pertahankan: Menu "Peminjaman" untuk dosen

### 3. Routes Config
**File:** `src/config/routes.config.ts`
- ❌ Dihapus: `LABORAN.PEMINJAMAN`
- ✅ Pertahankan: `LABORAN.PERSETUJUAN`
- ✅ Pertahankan: `DOSEN.PEMINJAMAN`

### 4. Page Files
- ❌ Dibackup: `src/pages/laboran/PeminjamanPage.tsx` → `PeminjamanPage.tsx.backup`
- ✅ Tetap aktif: `src/pages/laboran/PersetujuanPage.tsx`
- ✅ Tetap aktif: `src/pages/dosen/PeminjamanPage.tsx`

---

## Menu Laboran Setelah Cleanup

Laboran sekarang memiliki **5 menu** yang jelas:

1. 📊 **Dashboard** - Ringkasan aktivitas laboratorium
2. 📦 **Inventaris** - Kelola inventaris alat lab (CRUD manual)
3. ✅ **Persetujuan** - Approve/Reject peminjaman (APPROVAL ONLY)
4. 🏢 **Laboratorium** - Kelola data laboratorium
5. 📈 **Laporan** - Laporan inventaris dan aktivitas

---

## API yang Digunakan

### Dosen - Submit Peminjaman
```typescript
// File: src/lib/api/peminjaman-extensions.ts
createBorrowingRequest(data: {
  inventaris_id: string;
  jumlah: number;
  keperluan: string;
  tanggal_pinjam: string;
  tanggal_kembali_rencana: string;
})
```

### Laboran - Approve/Reject
```typescript
// File: src/lib/api/laboran.api.ts
approvePeminjaman(peminjamanId: string)
rejectPeminjaman(peminjamanId: string, alasan: string)

// File: src/lib/api/peminjaman-extensions.ts
approveRoomBooking(bookingId: string)
rejectRoomBooking(bookingId: string, alasan: string)
```

---

## Keuntungan Setelah Cleanup

### ✅ Clarity (Kejelasan)
- Setiap role punya fungsi yang jelas
- Tidak ada duplikasi menu
- Alur bisnis mudah dipahami

### ✅ Simplicity (Kesederhanaan)
- Laboran fokus pada approval
- Dosen fokus pada submit request
- Mengurangi confusion

### ✅ Maintainability (Kemudahan Maintenance)
- Kode lebih mudah di-maintain
- Tidak ada code yang redundant
- Clear separation of concerns

---

## Testing Checklist

- [ ] Dosen dapat mengakses `/dosen/peminjaman`
- [ ] Dosen dapat submit peminjaman baru
- [ ] Laboran dapat mengakses `/laboran/persetujuan`
- [ ] Laboran dapat approve peminjaman
- [ ] Laboran dapat reject peminjaman dengan alasan
- [ ] Laboran TIDAK dapat mengakses `/laboran/peminjaman` (404)
- [ ] Menu "Peminjaman" TIDAK muncul di sidebar laboran
- [ ] Menu "Persetujuan" muncul di sidebar laboran
- [ ] Build berhasil tanpa error

---

## Catatan Penting

1. **Jangan restore** file `PeminjamanPage.tsx.backup` di folder laboran
2. **Jika butuh** full management di masa depan, buat page baru dengan nama berbeda
3. **Persetujuan page** adalah single source of truth untuk approval

---

**Dibuat:** 2025-11-25
**Alasan:** Menghilangkan duplikasi dan memperjelas alur bisnis peminjaman
**Status:** ✅ Selesai dan sudah build successfully
