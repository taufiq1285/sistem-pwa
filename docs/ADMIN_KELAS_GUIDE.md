# 📚 PANDUAN FITUR ADMIN - MANAJEMEN KELAS

## ✅ Cara Mengakses Fitur

### STEP 1: Restart Dev Server
```bash
# Stop dev server jika sedang running (Ctrl+C)
# Lalu jalankan lagi:
npm run dev
```

### STEP 2: Login sebagai Admin
1. Buka browser: `http://localhost:5173`
2. Login dengan akun **Admin**
3. Pastikan role Anda adalah **admin**

### STEP 3: Akses Halaman Manajemen Kelas
Ada 2 cara:
- **Cara 1:** Klik menu **"Kelas"** di sidebar
- **Cara 2:** Akses langsung ke URL: `http://localhost:5173/admin/kelas`

---

## 🎯 Fitur yang Tersedia

### 1. View Semua Kelas
Tabel menampilkan:
- Nama Kelas
- **Mata Kuliah** (dengan kode)
- **Dosen** (nama lengkap)
- Semester/Tahun Ajaran
- Ruangan
- Kuota
- Tombol Aksi (Edit, Delete)

### 2. Buat Kelas Baru
- Klik tombol **"Buat Kelas Baru"**
- Isi form:
  - Nama Kelas (wajib)
  - **Mata Kuliah** (dropdown)
  - **Dosen Pengampu** (dropdown)
  - Semester & Tahun Ajaran
  - Ruangan & Kuota

### 3. Edit Kelas & Ganti Dosen ⭐ NEW
- Klik tombol **Edit** pada kelas yang ingin diubah
- Dialog form terbuka dengan data lengkap
- **Ganti Dosen:**
  1. Pilih dosen baru dari dropdown
  2. Muncul warning orange: "⚠️ Dosen akan diganti. Mahasiswa akan dinotifikasi."
  3. Klik **"Simpan"**
  4. Muncul **Konfirmasi Dialog** dengan detail:
     - Nama kelas dan mata kuliah
     - Dosen lama vs Dosen baru
     - Dampak pergantian
  5. Klik **"Ya, Ganti Dosen"**
  6. Sistem akan:
     - Update data kelas
     - Kirim notifikasi ke semua mahasiswa di kelas
     - Kirim notifikasi ke dosen baru
     - Kirim notifikasi ke dosen lama

### 4. Hapus Kelas
- Klik tombol **Delete**
- Konfirmasi untuk menghapus kelas

---

## 🔍 Troubleshooting

### Masalah: "Fitur tidak muncul / Halaman kosong"

**Solusi 1: Clear Cache & Restart**
```bash
# 1. Stop dev server (Ctrl+C)
# 2. Clear cache
rm -rf node_modules/.vite
# 3. Restart
npm run dev
```

**Solusi 2: Hard Refresh Browser**
- Windows/Linux: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

**Solusi 3: Clear Browser Cache**
- Chrome: `Ctrl + Shift + Delete` → Clear cache
- Atau buka **Incognito/Private Mode**

### Masalah: "Dropdown Dosen/Mata Kuliah Kosong"

**Penyebab:** Data dosen atau mata kuliah belum ada di database

**Solusi:**
1. Pastikan ada data di tabel `dosen`
2. Pastikan ada data di tabel `mata_kuliah`
3. Check console browser (F12) untuk error

### Masalah: "Permission Denied"

**Solusi:**
1. Pastikan login sebagai **admin**
2. Check tabel `admin` di database
3. Pastikan user memiliki permission `manage:kelas`

---

## 📊 Test Skenario

### Test 1: Lihat Daftar Kelas
✅ Akses `/admin/kelas`
✅ Tabel muncul dengan data kelas
✅ Kolom Dosen dan Mata Kuliah terisi

### Test 2: Edit Kelas (Tanpa Ganti Dosen)
✅ Klik Edit pada kelas
✅ Form muncul dengan data lengkap
✅ Ubah nama kelas atau ruangan
✅ Klik Simpan
✅ Data berhasil diupdate

### Test 3: Ganti Dosen ⭐
✅ Klik Edit pada kelas
✅ Ganti dropdown Dosen ke dosen lain
✅ Muncul warning orange
✅ Klik Simpan
✅ Muncul konfirmasi dialog dengan detail lengkap
✅ Klik "Ya, Ganti Dosen"
✅ Toast success muncul dengan info jumlah mahasiswa yang dinotifikasi
✅ Tabel kelas terupdate dengan dosen baru

### Test 4: Check Notifikasi
✅ Login sebagai mahasiswa dari kelas yang diganti dosennya
✅ Lihat badge notifikasi (ada angka)
✅ Klik bell icon
✅ Ada notifikasi dengan icon 👨‍🏫
✅ Isi notifikasi: "Kelas ... sekarang diampu oleh [Dosen Baru] (menggantikan [Dosen Lama])"

---

## 📝 File Terkait

| File | Lokasi |
|------|--------|
| **Admin Kelas Page** | `src/pages/admin/KelasPageEnhanced.tsx` |
| **Routing** | `src/routes/index.tsx` |
| **Navigation** | `src/config/navigation.config.ts` |
| **API Notification** | `src/lib/api/notification.api.ts` |
| **Types** | `src/types/notification.types.ts` |

---

## 🚀 Quick Start

```bash
# 1. Stop dev server (jika running)
Ctrl+C

# 2. Restart
npm run dev

# 3. Buka browser
http://localhost:5173

# 4. Login sebagai Admin

# 5. Akses menu "Kelas"
http://localhost:5173/admin/kelas

# 6. Test fitur Edit & Ganti Dosen!
```

---

## ❓ FAQ

**Q: Apakah data tugas & nilai hilang saat ganti dosen?**
A: Tidak! Semua data tetap aman. Hanya dosen_id di tabel kelas yang berubah.

**Q: Apakah mahasiswa otomatis pindah ke dosen baru?**
A: Ya, karena mahasiswa terhubung ke kelas, bukan ke dosen langsung.

**Q: Berapa lama notifikasi terkirim?**
A: Instant! Begitu admin konfirmasi, sistem langsung kirim notifikasi.

**Q: Bisakah rollback jika salah ganti dosen?**
A: Bisa! Admin tinggal edit lagi dan ganti kembali ke dosen lama.

---

Semoga membantu! 🎉
