# Logika dan Flow Peminjaman Alat Laboratorium

## 🎯 Skenario Masalah

**Pertanyaan User:**
> "Skema logika peminjaman jika seumpama dosen sudah mengajukan, tetapi ternyata ada alat yang salah atau kurang, bagaimana updatenya?"

---

## 📊 Status Flow Peminjaman

### Status yang Ada:
```
┌─────────┐     ┌──────────┐     ┌─────────┐     ┌──────────┐
│ PENDING │────▶│ APPROVED │────▶│ IN_USE  │────▶│ RETURNED │
└─────────┘     └──────────┘     └─────────┘     └──────────┘
     │
     │
     ▼
┌──────────┐
│ REJECTED │
└──────────┘
```

### Penjelasan Status:
1. **PENDING** - Dosen mengajukan peminjaman, menunggu approval laboran
2. **APPROVED** - Laboran menyetujui peminjaman
3. **REJECTED** - Laboran menolak peminjaman
4. **IN_USE** - Dosen sudah mengambil alat dan sedang dipinjam
5. **RETURNED** - Dosen sudah mengembalikan alat

---

## ❌ Masalah yang Ditemukan

### SEBELUM PERBAIKAN:
Jika dosen sudah mengajukan peminjaman (status: PENDING), tetapi:
- ✗ Salah pilih alat
- ✗ Jumlah kurang/lebih
- ✗ Tanggal salah
- ✗ Keperluan salah tulis

**TIDAK ADA SOLUSI!** Dosen harus:
1. Menunggu laboran reject
2. Atau tidak bisa diupdate sama sekali

---

## ✅ Solusi yang Ditambahkan

### 2 Fungsi Baru di API:

#### 1. **Update Peminjaman** (`updateBorrowingRequest`)
```typescript
updateBorrowingRequest(peminjaman_id, {
  inventaris_id?: string,        // Ganti alat
  jumlah_pinjam?: number,         // Ubah jumlah
  tanggal_pinjam?: string,        // Ubah tanggal pinjam
  tanggal_kembali_rencana?: string, // Ubah tanggal kembali
  keperluan?: string              // Ubah keperluan
})
```

**Syarat:**
- ✅ Status masih **PENDING**
- ✅ Hanya peminjam (dosen yang mengajukan) yang bisa update
- ✅ Validasi stok jika ganti alat atau ubah jumlah
- ✅ Validasi tanggal (tanggal kembali harus > tanggal pinjam)

#### 2. **Cancel Peminjaman** (`cancelBorrowingRequest`)
```typescript
cancelBorrowingRequest(peminjaman_id)
```

**Syarat:**
- ✅ Status masih **PENDING**
- ✅ Hanya peminjam (dosen yang mengajukan) yang bisa cancel
- ✅ Peminjaman akan dihapus (hard delete)

---

## 📝 Flow Lengkap dengan Update/Cancel

```
DOSEN MENGAJUKAN PEMINJAMAN
           │
           ▼
    ┌─────────────┐
    │   PENDING   │◀─────── UPDATE (jika salah/kurang)
    │  (Menunggu) │
    └─────────────┘
           │
           ├──────▶ CANCEL (jika ingin batalkan)
           │
           ▼
    LABORAN REVIEW
           │
           ├───────▶ REJECTED (ditolak)
           │
           ▼
    ┌─────────────┐
    │  APPROVED   │ (tidak bisa update lagi)
    │ (Disetujui) │
    └─────────────┘
           │
           ▼
    DOSEN AMBIL ALAT
           │
           ▼
    ┌─────────────┐
    │   IN_USE    │ (tidak bisa update lagi)
    │  (Dipinjam) │
    └─────────────┘
           │
           ▼
    DOSEN KEMBALIKAN
           │
           ▼
    ┌─────────────┐
    │  RETURNED   │ (selesai)
    │(Dikembalikan)│
    └─────────────┘
```

---

## 🔒 Aturan Keamanan (Security Rules)

### Update Peminjaman:
1. ✅ Hanya bisa update jika status = **PENDING**
2. ✅ Hanya dosen pemilik yang bisa update
3. ✅ Validasi stok alat sebelum update
4. ✅ Validasi tanggal
5. ✅ Memerlukan permission: `update:peminjaman`

### Cancel Peminjaman:
1. ✅ Hanya bisa cancel jika status = **PENDING**
2. ✅ Hanya dosen pemilik yang bisa cancel
3. ✅ Peminjaman dihapus permanen (hard delete)
4. ✅ Memerlukan permission: `update:peminjaman`

---

## 💡 Contoh Kasus Penggunaan

### Kasus 1: Dosen Salah Pilih Alat
```
1. Dosen mengajukan: Alat A, jumlah 5
2. STATUS: PENDING
3. Dosen sadar salah, harusnya Alat B
4. Dosen klik "Edit" → ganti ke Alat B
5. System validasi stok Alat B
6. Jika stok cukup → update berhasil
7. STATUS: masih PENDING (menunggu approval)
```

### Kasus 2: Dosen Salah Jumlah
```
1. Dosen mengajukan: Alat A, jumlah 10
2. STATUS: PENDING
3. Dosen sadar jumlah terlalu banyak
4. Dosen klik "Edit" → ubah jadi 5
5. System validasi stok Alat A
6. Update berhasil
7. STATUS: masih PENDING
```

### Kasus 3: Dosen Ingin Batalkan
```
1. Dosen mengajukan peminjaman
2. STATUS: PENDING
3. Dosen berubah pikiran, tidak jadi pinjam
4. Dosen klik "Batalkan"
5. Konfirmasi: "Yakin ingin membatalkan?"
6. Peminjaman dihapus
7. Hilang dari list
```

### Kasus 4: Sudah Disetujui (TIDAK BISA UPDATE)
```
1. Dosen mengajukan peminjaman
2. STATUS: PENDING
3. Laboran approve
4. STATUS: APPROVED
5. Tombol "Edit" dan "Batalkan" HILANG
6. Dosen tidak bisa update lagi
7. Harus hubungi laboran jika ada masalah
```

---

## 🎨 UI Changes Yang Perlu Ditambahkan

### Di Tabel Riwayat Peminjaman:

#### Kolom Actions (untuk status PENDING):
```tsx
{b.status === 'menunggu' && (
  <div className="flex gap-2">
    <Button
      size="sm"
      variant="outline"
      onClick={() => handleEdit(b.id)}
    >
      Edit
    </Button>
    <Button
      size="sm"
      variant="destructive"
      onClick={() => handleCancel(b.id)}
    >
      Batalkan
    </Button>
  </div>
)}
```

#### Dialog Edit Peminjaman:
- Form sama seperti create
- Pre-fill dengan data existing
- Hanya field yang bisa diubah yang enabled
- Validasi real-time

#### Dialog Cancel Peminjaman:
- Konfirmasi: "Yakin ingin membatalkan peminjaman ini?"
- Informasi alat yang akan dibatalkan
- Button: "Ya, Batalkan" dan "Tidak"

---

## 📦 Files Yang Perlu Dimodifikasi

### 1. API:
✅ `src/lib/api/dosen.api.ts`
   - Add `updateBorrowingRequest`
   - Add `cancelBorrowingRequest`
   - Export ke `dosenApi` object

### 2. UI:
⏳ `src/pages/dosen/PeminjamanPage.tsx`
   - Add Edit button untuk status pending
   - Add Cancel button untuk status pending
   - Add Edit Dialog
   - Add Cancel Dialog
   - Add handlers: `handleEdit`, `handleCancel`

### 3. Types (jika perlu):
⏳ `src/lib/api/dosen.api.ts`
   - Interface untuk UpdateBorrowingRequest

---

## 🚀 Implementation Status

- [x] Analisa masalah
- [x] Design solusi
- [x] Create API functions (updateBorrowingRequest, cancelBorrowingRequest)
- [x] Add security validations
- [ ] Add UI Edit button
- [ ] Add UI Cancel button
- [ ] Add Edit Dialog
- [ ] Add Cancel Dialog
- [ ] Add handlers
- [ ] Testing

---

## 🎯 Summary

### Masalah:
Dosen tidak bisa update atau cancel peminjaman yang sudah diajukan jika ada kesalahan.

### Solusi:
Tambahkan 2 fungsi baru:
1. **Update** - untuk edit alat/jumlah/tanggal (hanya jika PENDING)
2. **Cancel** - untuk batalkan peminjaman (hanya jika PENDING)

### Benefit:
- ✅ Dosen bisa koreksi kesalahan sendiri
- ✅ Tidak perlu tunggu reject dari laboran
- ✅ Lebih fleksibel dan user-friendly
- ✅ Mengurangi data sampah (peminjaman yang salah)
- ✅ Meningkatkan efisiensi proses peminjaman
