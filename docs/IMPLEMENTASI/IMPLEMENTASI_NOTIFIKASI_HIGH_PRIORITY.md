# Implementasi Notifikasi HIGH PRIORITY - Panduan Aman

## 🎯 Tujuan
Menambahkan notifikasi HIGH PRIORITY ke aplikasi TANPA merusak kode yang sudah ada.

## ✅ Yang Sudah Ditambahkan

### Helper Functions Baru di `notification.api.ts`:

#### 1. Peminjaman Alat (4 fungsi)
- `notifyLaboranPeminjamanBaru()` - Saat dosen ajukan peminjaman
- `notifyDosenPeminjamanDisetujui()` - Saat laboran approve
- `notifyDosenPeminjamanDitolak()` - Saat laboran reject
- `notifyLaboranPeminjamanTerlambat()` - Saat terlambat kembali

#### 2. Jadwal (3 fungsi)
- `notifyDosenJadwalBaru()` - Saat admin buat jadwal
- `notifyDosenJadwalDiupdate()` - Saat admin update jadwal
- `notifyMahasiswaJadwalChange()` - Saat jadwal berubah

#### 3. Kuis Published (1 fungsi)
- `notifyMahasiswaKuisPublished()` - Saat dosen publish kuis

#### 4. Logbook (4 fungsi)
- `notifyDosenLogbookSubmitted()` - Saat mahasiswa submit logbook
- `notifyMahasiswaLogbookApproved()` - Saat dosen approve
- `notifyMahasiswaLogbookRejected()` - Saat dosen reject
- `notifyMahasiswaLogbookRevision()` - Saat dosen minta perbaikan

---

## 📋 Cara Implementasi yang Aman

### RULES WAJIB:
1. ✅ Notifikasi bersifat **BEST-EFFORT** - Tidak boleh gagalkan proses utama
2. ✅ Gunakan **try-catch** di sekitar setiap pemanggilan notifikasi
3. ✅ Tidak ubah logika bisnis yang sudah ada
4. ✅ Tambahkan notifikasi **SETELAH** proses utama berhasil
5. ✅ Jangan await notifikasi (biarkan berjalan di background)

### PATTERN YANG AMAN:

```typescript
// ❌ SALAH - Notifikasi memblokir proses
await createNotification(...);
return result;

// ✅ BENAR - Notifikasi best-effort, tidak memblokir
try {
  // Proses utama dulu
  const result = await mainProcess();

  // Notifikasi di background, tidak ditunggu
  createNotification(...).catch((err) => {
    console.error("Notification failed (non-blocking):", err);
  });

  return result;
} catch (error) {
  throw error;
}
```

---

## 🔧 Implementasi per Fitur

### 1️⃣ PEMINJAMAN ALAT (Dosen → Laboran)

**File:** `src/pages/dosen/PeminjamanPage.tsx`
**Line:** ~329 (setelah `await createBorrowingRequest(...)`)

```typescript
// SETELAH line 337 (toast.success)
await createBorrowingRequest({...});

toast.success("Pengajuan peminjaman berhasil dibuat!");
setDialogOpen(false);
form.reset();

// ✅ TAMBAHKAN INI (setelah toast.success)
// Notify laboran - best effort, non-blocking
import { notifyLaboranPeminjamanBaru } from "@/lib/api/notification.api";

// ... di dalam handleSubmit
try {
  const result = await createBorrowingRequest({...});

  toast.success("Pengajuan peminjaman berhasil dibuat!");

  // Notify semua laboran (background, tidak await)
  notifyLaboranPeminjamanBaru(
    laboranUserIds, // array of laboran user IDs
    user!.full_name,
    selectedEquipment.nama_barang,
    data.jumlah_pinjam,
    data.tanggal_pinjam,
    data.keperluan
  ).catch((err) => {
    console.error("Failed to notify laboran:", err);
  });

  setDialogOpen(false);
  form.reset();
} catch (error) {
  // ... error handling
}
```

**Catatan:**
- Perlu fetch `laboranUserIds` dulu
- Notifikasi tidak boleh await (biarkan background)
- Wajib pakai catch untuk handle error

---

### 2️⃣ PEMINJAMAN APPROVAL (Laboran → Dosen)

**File:** `src/pages/laboran/PersetujuanPage.tsx` atau `PeminjamanApprovalPage.tsx`

```typescript
// Saat approve peminjaman
import { notifyDosenPeminjamanDisetujui } from "@/lib/api/notification.api";

const handleApprove = async (peminjaman: Peminjaman) => {
  try {
    // Proses approve dulu
    await approvePeminjaman({...});
    toast.success("Peminjaman disetujui");

    // Notify dosen (background)
    notifyDosenPeminjamanDisetujui(
      peminjaman.dosen_id, // perlu fetch dosen.user_id
      peminjaman.inventaris.nama_barang,
      peminjaman.jumlah_pinjam,
      peminjaman.tanggal_pinjam,
      peminjaman.tanggal_kembali_rencana
    ).catch((err) => console.error("Notification failed:", err));

    fetchPeminjaman();
  } catch (error) {
    // ... error handling
  }
};

const handleReject = async (peminjaman: Peminjaman, alasan: string) => {
  try {
    // Proses reject dulu
    await rejectPeminjaman({...});
    toast.success("Peminjaman ditolak");

    // Notify dosen (background)
    notifyDosenPeminjamanDitolak(
      peminjaman.dosen_id,
      peminjaman.inventaris.nama_barang,
      alasan
    ).catch((err) => console.error("Notification failed:", err));

    fetchPeminjaman();
  } catch (error) {
    // ... error handling
  }
};
```

---

### 3️⃣ JADWAL (Admin/Laboran → Dosen/Mahasiswa)

**File:** Cari file yang create/update jadwal

```typescript
import { notifyDosenJadwalBaru, notifyMahasiswaJadwalChange } from "@/lib/api/notification.api";

const handleCreateJadwal = async (jadwalData) => {
  try {
    // Create jadwal dulu
    const result = await createJadwal({...});
    toast.success("Jadwal berhasil dibuat");

    // Notify dosen (background)
    if (result.dosen_id) {
      notifyDosenJadwalBaru(
        result.dosen.user_id,
        result.mata_kuliah.nama_mk,
        result.kelas.nama_kelas,
        result.tanggal_praktikum,
        result.laboratorium.nama_lab
      ).catch((err) => console.error("Notification failed:", err));
    }

    // Notify semua mahasiswa di kelas (background)
    const mahasiswaUserIds = await getMahasiswaIds(result.kelas_id);
    notifyMahasiswaJadwalChange(
      mahasiswaUserIds,
      result.mata_kuliah.nama_mk,
      result.kelas.nama_kelas,
      result.tanggal_praktikum,
      "baru"
    ).catch((err) => console.error("Notification failed:", err));

    fetchJadwal();
  } catch (error) {
    // ... error handling
  }
};
```

---

### 4️⃣ KUIS PUBLISHED (Dosen → Mahasiswa)

**File:** `src/pages/dosen/kuis/KuisListPage.tsx` atau `KuisBuilderPage.tsx`

```typescript
import { notifyMahasiswaKuisPublished } from "@/lib/api/notification.api";

const handlePublishKuis = async (kuis: Kuis) => {
  try {
    // Publish kuis dulu
    await publishKuis({...});
    toast.success("Kuis dipublish");

    // Notify semua mahasiswa di kelas (background)
    const mahasiswaUserIds = await getMahasiswaIds(kuis.kelas_id);
    notifyMahasiswaKuisPublished(
      mahasiswaUserIds,
      user!.full_name,
      kuis.judul,
      kuis.kelas.nama_kelas,
      kuis.deadline,
      kuis.id
    ).catch((err) => console.error("Notification failed:", err));

    fetchKuis();
  } catch (error) {
    // ... error handling
  }
};
```

---

### 5️⃣ LOGBOOK (Mahasiswa → Dosen)

**File:** `src/pages/mahasiswa/LogbookPage.tsx`

```typescript
import { notifyDosenLogbookSubmitted } from "@/lib/api/notification.api";

const handleSubmitLogbook = async (logbookData) => {
  try {
    // Submit logbook dulu
    const result = await submitLogbook({...});
    toast.success("Logbook berhasil dikirim");

    // Notify dosen (background)
    if (result.kelas?.dosen_id) {
      notifyDosenLogbookSubmitted(
        result.kelas.dosen.user_id,
        user!.full_name,
        result.kelas.nama_kelas,
        result.kelas.mata_kuliah.nama_mk,
        result.tanggal_praktikum,
        result.id
      ).catch((err) => console.error("Notification failed:", err));
    }

    fetchLogbook();
  } catch (error) {
    // ... error handling
  }
};
```

**File:** `src/pages/dosen/LogbookReviewPage.tsx`

```typescript
import {
  notifyMahasiswaLogbookApproved,
  notifyMahasiswaLogbookRejected,
  notifyMahasiswaLogbookRevision
} from "@/lib/api/notification.api";

const handleApproveLogbook = async (logbook: Logbook) => {
  try {
    // Approve dulu
    await approveLogbook({...});
    toast.success("Logbook disetujui");

    // Notify mahasiswa (background)
    notifyMahasiswaLogbookApproved(
      logbook.mahasiswa_id,
      logbook.kelas.nama_kelas,
      logbook.kelas.mata_kuliah.nama_mk,
      logbook.tanggal_praktikum
    ).catch((err) => console.error("Notification failed:", err));

    fetchLogbook();
  } catch (error) {
    // ... error handling
  }
};

const handleRejectLogbook = async (logbook: Logbook, catatan: string) => {
  try {
    // Reject dulu
    await rejectLogbook({...});
    toast.success("Logbook ditolak/perlu perbaikan");

    // Notify mahasiswa (background)
    if (requiresRevision) {
      notifyMahasiswaLogbookRevision(
        logbook.mahasiswa_id,
        logbook.kelas.nama_kelas,
        logbook.kelas.mata_kuliah.nama_mk,
        logbook.tanggal_praktikum,
        catatan
      ).catch((err) => console.error("Notification failed:", err));
    } else {
      notifyMahasiswaLogbookRejected(
        logbook.mahasiswa_id,
        logbook.kelas.nama_kelas,
        logbook.kelas.mata_kuliah.nama_mk,
        logbook.tanggal_praktikum,
        catatan
      ).catch((err) => console.error("Notification failed:", err));
    }

    fetchLogbook();
  } catch (error) {
    // ... error handling
  }
};
```

---

## ⚠️ PENTING: Fetch User IDs

Beberapa fungsi notifikasi butuh `userIds` array. Pastikan fetch dengan aman:

```typescript
// ✅ CARA AMAN fetch laboran user IDs
const getLaboranUserIds = async (): Promise<string[]> => {
  try {
    const { data } = await supabase
      .from("users")
      .select("id")
      .eq("role", "laboran");

    return data?.map(u => u.id) || [];
  } catch (error) {
    console.error("Failed to fetch laboran IDs:", error);
    return []; // Return empty array instead of throwing
  }
};

// ✅ CARA AMAN fetch mahasiswa user IDs by kelas
const getMahasiswaIds = async (kelasId: string): Promise<string[]> => {
  try {
    const { data } = await supabase
      .from("kelas_mahasiswa")
      .select("mahasiswa_id")
      .eq("kelas_id", kelasId);

    return data?.map(km => km.mahasiswa_id) || [];
  } catch (error) {
    console.error("Failed to fetch mahasiswa IDs:", error);
    return [];
  }
};
```

---

## 📝 Checklist Implementasi

- [ ] Import fungsi notifikasi yang relevan
- [ ] Fetch user IDs yang diperlukan (dengan error handling)
- [ ] Panggil fungsi notifikasi SETELAH proses utama berhasil
- [ ] JANGAN await notifikasi (biarkan background)
- [ ] Wrap dengan try-catch untuk handle error
- [ ] Test dengan console.log untuk memastikan terpanggil
- [ ] Test di browser untuk memastikan notifikasi muncul

---

## 🧪 Cara Test

1. **Fix RLS dulu:**
   ```sql
   -- Jalankan di Supabase SQL Editor
   migrations/fix-app-notifications.sql
   ```

2. **Implement 1 fitur dulu:**
   - Mulai dari Peminjaman (paling simpel)
   - Tambahkan notifikasi
   - Test di browser
   - Kalau berhasil, lanjut ke fitur lain

3. **Verifikasi:**
   - Buka Console browser (F12)
   - Cari log "Notification failed" (harusnya tidak ada)
   - Login sebagai penerima notifikasi
   - Cek lonceng 🔔 di header

---

## 🚀 Next Steps

Setelah helper functions ditambahkan:
1. Implementasi Peminjaman (prioritas 1)
2. Implementasi Jadwal (prioritas 2)
3. Implementasi Kuis Published (prioritas 3)
4. Implementasi Logbook (prioritas 4)

Implement SATU per SATU, test dulu, baru lanjut ke berikutnya.
