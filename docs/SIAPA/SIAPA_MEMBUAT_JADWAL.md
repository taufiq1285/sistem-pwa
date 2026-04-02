# 🎯 Siapa yang Membuat Jadwal Praktikum?

## ✅ JAWABANNYA: **DOSEN**

---

## 📍 Lokasi Fitur

```
DOSEN → Dashboard → Menu → JADWAL
                          ↓
                   File: JadwalPage.tsx
                          ↓
                   Tombol "Tambah Jadwal"
                          ↓
                   Form:
                   ├─ Mata Kuliah (pilih/buat)
                   ├─ Kelas (pilih/buat)
                   ├─ Tanggal Praktikum
                   ├─ Jam Mulai
                   ├─ Jam Selesai
                   ├─ Laboratorium
                   ├─ Topik (optional)
                   └─ Catatan (optional)
                          ↓
                   Klik SIMPAN
                          ↓
                   Jadwal tersimpan di database
```

---

## 🔄 Flow Setelah Jadwal Dibuat

```
1. Dosen Buat Jadwal Praktikum
   └─ Save di jadwal_praktikum table

2. Dosen Buka Kehadiran Page
   └─ Dropdown "Pilih Jadwal Praktikum"
      └─ Menampilkan semua jadwal untuk kelas dosen

3. Dosen Select Jadwal yang dibuat
   └─ Sistem auto-load Mahasiswa
      └─ Dari enrollment (nilai table)
         └─ Hanya mahasiswa yang enrolled ke kelas itu

4. Dosen Input Kehadiran per Mahasiswa
   └─ Status: Hadir/Izin/Sakit/Alpha
   └─ Keterangan (optional)

5. Dosen Klik Simpan
   └─ Data tersimpan di kehadiran table
```

---

## 📊 Perbandingan: Admin vs Dosen Role

### **ADMIN** ❌ TIDAK buat jadwal
- ✅ Input data awal (mahasiswa, kelas, mata kuliah)
- ✅ Manage enrollment (assign mahasiswa ke kelas)
- ❌ TIDAK tahu jadwal praktikum (bukan pengajar)
- ❌ TIDAK tahu laboratorium mana yang dipakai
- ❌ TIDAK tahu topik apa yang diajarkan

### **DOSEN** ✅ BUAT jadwal
- ✅ Tahu jadwal praktikumnya (pengajar)
- ✅ Tahu laboratorium mana (sesuai rencana)
- ✅ Tahu topik & materi (pakar bidang)
- ✅ Bisa ubah jadwal kapan saja (fleksibel)
- ✅ Bisa buat jadwal per semester (dinamis)

---

## 🛠️ Implementasi

### **Code Location: JadwalPage.tsx**
```typescript
// LINE 368-399: handleCreate function
const handleCreate = async (data: JadwalFormData) => {
  // 1. Get or create mata kuliah
  // 2. Get or create kelas
  // 3. Create jadwal dengan:
  //    - kelas_id (linked ke kelas)
  //    - laboratorium_id
  //    - tanggal_praktikum
  //    - jam_mulai, jam_selesai
  //    - topik, catatan
  // 4. Save ke database jadwal_praktikum table
}
```

### **API Location: jadwal.api.ts**
```typescript
export async function createJadwal(data: CreateJadwalData): Promise<Jadwal>
```

---

## ✅ Verification

### **Untuk Verify Dosen Bisa Membuat Jadwal:**

1. Login sebagai **Dosen**
2. Klik menu **"Jadwal"** (di sidebar Dosen)
3. Klik tombol **"Tambah Jadwal"**
4. Fill form:
   - Mata Kuliah: pilih atau ketik baru
   - Kelas: pilih atau ketik baru
   - Tanggal: pilih tanggal praktikum
   - Jam: set jam mulai & selesai
   - Lab: pilih laboratorium
5. Klik **"SIMPAN"**
6. Jadwal muncul di list

### **Untuk Verify Jadwal Ke-Kehadiran:**

1. Masih login sebagai **Dosen**
2. Klik menu **"Kehadiran"**
3. Lihat dropdown **"Pilih Jadwal Praktikum"**
4. Jadwal yang dibuat di step 6 harus muncul di dropdown
5. Select jadwal itu
6. Mahasiswa auto-load dari enrollment
7. Input kehadiran & simpan

---

## 🎓 Kesimpulan

```
ADMIN's Job:
┌─ Input Mahasiswa
├─ Buat Kelas
└─ Enroll Mahasiswa ke Kelas
   ↓
   (Admin done, serahkan ke Dosen)
   ↓
DOSEN's Job:
┌─ Buat Jadwal Praktikum ← DOSEN YANG BUAT INI!
├─ Input Kehadiran (select jadwal yang dibuat)
└─ View Report Kehadiran

✅ Simple, Clear, Role-based!
```
