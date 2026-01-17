# 📚 PANDUAN FITUR PERMINTAAN PERBAIKAN NILAI

## ✅ Cara Mengakses Fitur

### STEP 1: Run Migration Database
```bash
# Jalankan migration untuk membuat tabel permintaan_perbaikan_nilai
npx supabase migration up
# Atau jika menggunakan supabase CLI:
supabase db push
```

### STEP 2: Update Route (Gunakan NilaiPageEnhanced)

**File**: `src/routes/index.tsx` atau file routing Anda

Ganti import NilaiPage dengan NilaiPageEnhanced:
```tsx
// ❌ BEFORE
import NilaiPage from "@/pages/mahasiswa/NilaiPage";

// ✅ AFTER
import NilaiPageEnhanced from "@/pages/mahasiswa/NilaiPageEnhanced";
```

**ATAU** rename file:
```bash
# Backup file lama
mv src/pages/mahasiswa/NilaiPage.tsx src/pages/mahasiswa/NilaiPage.old.tsx

# Gunakan versi Enhanced sebagai NilaiPage.tsx
mv src/pages/mahasiswa/NilaiPageEnhanced.tsx src/pages/mahasiswa/NilaiPage.tsx
```

### STEP 3: Restart Dev Server
```bash
# Stop dev server (Ctrl+C)
# Lalu jalankan lagi:
npm run dev
```

---

## 🎯 Fitur yang Tersedia

### 1. View Nilai Per Kelas (Existing)
- Lihat semua nilai dari kelas praktikum yang diikuti
- Breakdown per komponen: Kuis, Tugas, UTS, UAS, Praktikum, Kehadiran
- Nilai akhir dan grade huruf (A, B, C, D, E)

### 2. View Nilai Per Mata Kuliah (Kumulatif) ⭐ NEW
**Skenario**: Mahasiswa mengambil beberapa kelas untuk mata kuliah yang sama

Contoh:
- **Praktikum Python - Kelas A** (Semester 1) → Nilai: 85
- **Praktikum Python - Kelas B** (Semester 2) → Nilai: 90
- **Nilai Kumulatif Praktikum Python** → **Rata-rata: 87.5** (Grade: A)

**Keuntungan**:
- Mahasiswa bisa lihat performa keseluruhan per mata kuliah
- Tracking progress improvement across semesters
- Identifikasi mata kuliah yang perlu ditingkatkan

### 3. Ajukan Permintaan Perbaikan Nilai ⭐ NEW
**Flow**:
1. Mahasiswa klik **"Ajukan Perbaikan"** di row nilai yang ingin diperbaiki
2. Dialog form muncul:
   - **Pilih Komponen** (Kuis/Tugas/UTS/UAS/Praktikum/Kehadiran)
   - **Nilai Usulan** (opsional - nilai yang diharapkan)
   - **Alasan Permintaan** (wajib - jelaskan mengapa)
3. Klik **"Kirim Permintaan"**
4. Sistem otomatis kirim notifikasi ke dosen pengampu

**Komponen yang bisa diajukan**:
- ✅ Nilai Kuis
- ✅ Nilai Tugas
- ✅ Nilai UTS
- ✅ Nilai UAS
- ✅ Nilai Praktikum
- ✅ Nilai Kehadiran

### 4. Track Riwayat Permintaan ⭐ NEW
Tab **"Riwayat Permintaan"** menampilkan:
- **Semua permintaan** yang pernah diajukan
- **Status**:
  - 🟡 Menunggu Review (Pending)
  - 🟢 Disetujui (Approved) - Nilai otomatis terupdate
  - 🔴 Ditolak (Rejected) - dengan alasan dari dosen
  - ⚪ Dibatalkan (Cancelled)
- **Response Dosen** (jika sudah di-review)
- **Nilai Lama vs Nilai Baru** (jika approved)

---

## 🔄 Workflow Lengkap

```
MAHASISWA                          SISTEM                         DOSEN
   |                                 |                              |
   | 1. Lihat Nilai                  |                              |
   | (Tab "Per Kelas" atau           |                              |
   |  "Per Mata Kuliah")             |                              |
   |                                 |                              |
   | 2. Klik "Ajukan Perbaikan"      |                              |
   | di row nilai tertentu           |                              |
   |                                 |                              |
   | 3. Isi Form:                    |                              |
   |    - Komponen: Praktikum        |                              |
   |    - Nilai Usulan: 85           |                              |
   |    - Alasan: "Saya sudah..."    |                              |
   |-------------------------------->|                              |
   |                                 | 4. Simpan ke Database       |
   |                                 | 5. Kirim Notifikasi (🔄)    |
   |                                 |---------------------------->|
   |                                 |                              | 6. Terima Notifikasi
   |                                 |                              | "Mahasiswa X mengajukan
   |                                 |                              |  perbaikan nilai Praktikum"
   |                                 |                              |
   |                                 |                              | 7. Review di Tab
   |                                 |                              | "Permintaan Perbaikan"
   |                                 |                              |
   |                                 |                              | 8. APPROVE atau REJECT
   |                                 | 9. Update Status & Nilai    |
   |                                 |<----------------------------|
   |                                 | (Jika APPROVE: nilai auto   |
   |                                 |  update di tabel nilai)     |
   |                                 |                              |
   | 10. Terima Notifikasi (✍️)      |                              |
   |<--------------------------------|                              |
   | "Permintaan perbaikan nilai     |                              |
   |  Praktikum disetujui.           |                              |
   |  Nilai baru: 85"                |                              |
   |                                 |                              |
   | 11. Check Tab "Riwayat"         |                              |
   | Status: ✅ Disetujui            |                              |
   | Nilai Lama: 75 → Nilai Baru: 85 |                              |
```

---

## 📊 Database Schema

### Tabel: `permintaan_perbaikan_nilai`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `mahasiswa_id` | UUID | FK ke mahasiswa |
| `nilai_id` | UUID | FK ke nilai |
| `kelas_id` | UUID | FK ke kelas |
| `komponen_nilai` | VARCHAR | 'kuis', 'tugas', 'uts', 'uas', 'praktikum', 'kehadiran' |
| `nilai_lama` | DECIMAL | Nilai sebelum perbaikan |
| `nilai_usulan` | DECIMAL | Nilai yang diusulkan mahasiswa (nullable) |
| `alasan_permintaan` | TEXT | Alasan mengajukan permintaan |
| `bukti_pendukung` | TEXT[] | Array URL bukti (nullable) |
| `status` | VARCHAR | 'pending', 'approved', 'rejected', 'cancelled' |
| `response_dosen` | TEXT | Response dari dosen (nullable) |
| `nilai_baru` | DECIMAL | Nilai setelah perbaikan (nullable) |
| `reviewed_by` | UUID | FK ke dosen yang review (nullable) |
| `reviewed_at` | TIMESTAMP | Waktu review (nullable) |
| `created_at` | TIMESTAMP | Waktu dibuat |
| `updated_at` | TIMESTAMP | Waktu diupdate |

**Trigger**: Auto-update `nilai` table saat status = 'approved'

**RLS Policies**:
- ✅ Mahasiswa: read own, create own, cancel own pending
- ✅ Dosen: read for their classes, approve/reject for their classes
- ✅ Admin: read all

---

## 🔍 Troubleshooting

### Masalah: "Migration gagal dijalankan"

**Solusi**:
```bash
# Check migration status
npx supabase migration list

# Reset jika ada konflik
npx supabase db reset

# Run migration lagi
npx supabase migration up
```

### Masalah: "Tab tidak muncul / Error saat load"

**Solusi 1**: Clear cache & restart
```bash
rm -rf node_modules/.vite
npm run dev
```

**Solusi 2**: Hard refresh browser
- Windows/Linux: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

### Masalah: "Permintaan tidak bisa disubmit"

**Check**:
1. Alasan permintaan harus diisi (wajib)
2. User harus login sebagai mahasiswa
3. Check console browser (F12) untuk error

---

## 📝 File Terkait

| File | Lokasi | Keterangan |
|------|--------|------------|
| **Migration** | `supabase/migrations/21_permintaan_perbaikan_nilai.sql` | Database schema |
| **Types** | `src/types/permintaan-perbaikan.types.ts` | TypeScript types |
| **API** | `src/lib/api/permintaan-perbaikan.api.ts` | CRUD operations |
| **UI Mahasiswa** | `src/pages/mahasiswa/NilaiPageEnhanced.tsx` | Enhanced nilai page |
| **Notification** | `src/components/common/NotificationDropdown.tsx` | Handle notif |

---

## 🚀 Quick Start

```bash
# 1. Run migration
npx supabase migration up

# 2. Restart dev server
npm run dev

# 3. Login sebagai Mahasiswa

# 4. Akses menu "Nilai"
http://localhost:5173/mahasiswa/nilai

# 5. Test fitur:
#    - Tab "Per Mata Kuliah" → Lihat nilai kumulatif
#    - Button "Ajukan Perbaikan" → Submit request
#    - Tab "Riwayat Permintaan" → Track status
```

---

## 📋 Test Checklist

### ✅ Test Mahasiswa
- [ ] Lihat nilai per kelas
- [ ] Lihat nilai kumulatif per mata kuliah (jika ada multiple kelas)
- [ ] Klik "Ajukan Perbaikan" → Dialog muncul
- [ ] Submit permintaan → Toast success muncul
- [ ] Check tab "Riwayat Permintaan" → Request muncul dengan status "Pending"
- [ ] Check notifikasi di bell icon → Tidak ada (mahasiswa tidak dapat notif saat submit)

### ✅ Test Dosen
- [ ] Login sebagai dosen
- [ ] Check notifikasi → Ada notif "Permintaan Perbaikan Nilai"
- [ ] Akses halaman Penilaian → Tab "Permintaan Perbaikan" (akan dibuat di Phase 3)
- [ ] Approve request → Mahasiswa dapat notif + nilai otomatis update
- [ ] Reject request → Mahasiswa dapat notif dengan alasan

### ✅ Test Auto-Update Nilai
- [ ] Dosen approve permintaan
- [ ] Check tabel `nilai` → Nilai komponen terupdate sesuai `nilai_baru`
- [ ] Nilai akhir & grade huruf otomatis recalculate
- [ ] Mahasiswa lihat nilai → Sudah berubah

---

## ❓ FAQ

**Q: Apakah mahasiswa bisa ajukan permintaan untuk komponen yang sama lebih dari 1x?**
A: Ya, bisa. Tidak ada limit. Tapi dosen bisa reject jika dianggap tidak wajar.

**Q: Apakah nilai langsung berubah saat mahasiswa submit request?**
A: Tidak. Nilai hanya berubah **setelah dosen APPROVE**. Jika reject, nilai tetap sama.

**Q: Apakah mahasiswa bisa cancel request yang sudah disubmit?**
A: Ya, tapi hanya jika statusnya masih **Pending**. Jika sudah di-review (Approved/Rejected), tidak bisa cancel.

**Q: Bagaimana jika dosen salah approve?**
A: Dosen bisa manual update nilai kembali di halaman Penilaian, atau mahasiswa ajukan request lagi.

**Q: Apakah ada notifikasi saat mahasiswa submit request?**
A: Ya, dosen langsung dapat notifikasi real-time dengan icon 🔄.

---

Semoga membantu! 🎉
