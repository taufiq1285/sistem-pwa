# ✅ Kehadiran System - Verification Checklist

## 📋 Current Status

Kehadiran system sudah dikonfigurasi dengan **role-based approach**:
- ✅ Dosen bisa input kehadiran per jadwal praktikum
- ✅ Mahasiswa list di-load otomatis dari kelas (via jadwal)
- ✅ Admin harus input semua nama mahasiswa dulu (via nilai/enrollment)
- ✅ Sistem support multi-angkatan (3 angkatan di AKBID Mega Buana)

---

## 🔍 How It Works

### Flow: Admin Input → Dosen Input Kehadiran

```
1. ADMIN SETUP
   ├─ Input semua mahasiswa di tabel mahasiswa
   ├─ Enroll mahasiswa ke kelas (di tabel nilai/kelas_mahasiswa)
   └─ Buat jadwal praktikum per kelas dengan tanggal/jam

2. DOSEN INPUT KEHADIRAN
   ├─ Pilih jadwal praktikum
   ├─ Sistem load mahasiswa dari kelas (via nilai table)
   ├─ Dosen input status per mahasiswa (hadir/izin/sakit/alpha)
   └─ Save ke database

3. SYSTEM GENERATES
   ├─ Mahasiswa list based on: kelas → jadwal → enrollment
   ├─ Multi-angkatan support (pin merah/kuning/hijau)
   └─ Otomatis beda mahasiswa per kelas karena enrollment beda
```

---

## 🎯 Verification Checklist

### ✅ CODE VERIFICATION (SELESAI)

File: `src/pages/dosen/KehadiranPage.tsx`

**LINE 222-226: Load Mahasiswa dari Kelas**
```typescript
const { data: mahasiswaData, error: mahasiswaError } = await supabase
  .from('nilai')
  .select('mahasiswa_id, mahasiswa!inner(id, nim, user!inner(full_name))')
  .eq("kelas_id", jadwalData.kelas_id!)
  .limit(100);
```

✅ **Status:** CORRECT
- Load dari tabel `nilai` (enrollment)
- Filter by `kelas_id` dari jadwal
- Menampilkan nama dari user table
- Auto handle multi-angkatan (karena enrollment per kelas)

---

### 🔗 Data Sinkronisasi: Jadwal Praktikum ↔ Mahasiswa List

**Kalimat:** *"tiapmkelas beda2 praktikum dan juga otomati beda mahasiswa karena admin input semua nama mahasiswa"*

**Sudah di-implement?** ✅ YA

**Cara Kerjanya:**

```
1. Admin buat JADWAL PRAKTIKUM per KELAS
   jadwal_praktikum
   ├─ id: xxxx
   ├─ kelas_id: kelas-A (pin merah)
   ├─ tanggal_praktikum: 2024-11-27
   ├─ jam_mulai: 09:00
   └─ mata_kuliah_id: praktikum-biologi

2. Admin ENROLL MAHASISWA ke KELAS
   nilai / kelas_mahasiswa
   ├─ mahasiswa_id: student-1 (pin merah angkatan)
   ├─ kelas_id: kelas-A
   ├─ is_active: true
   └─ enrolled_at: 2024-10-01

3. Dosen pilih JADWAL PRAKTIKUM
   → Sistem otomatis ambil mahasiswa dari kelas
   → Hanya mahasiswa yg enrolled ke kelas itu
   → Auto beda per kelas & angkatan

4. Result:
   Kelas-A (pin merah) → 25 mahasiswa
   Kelas-B (pin kuning) → 28 mahasiswa
   Kelas-C (pin hijau) → 22 mahasiswa
```

---

## 📊 Multi-Angkatan Support

**Kondisi:** AKBID Mega Buana punya 3 angkatan
- 🔴 Pin Merah (Angkatan 2022)
- 🟡 Pin Kuning (Angkatan 2023)
- 🟢 Pin Hijau (Angkatan 2024)

**Sudah di-support?** ✅ YA

**Cara:**
- Setiap kelas punya mahasiswa dari angkatan yg berbeda
- Enrollment = per kelas (not per angkatan)
- Saat kehadiran, otomatis yang muncul = mahasiswa yg terdaftar di kelas

---

## 📋 TODO: Verification Points

### 1. **Admin Dashboard - Input Mahasiswa**
- [ ] Admin bisa input/edit nama mahasiswa
- [ ] Admin bisa set angkatan (untuk pin merah/kuning/hijau)
- [ ] Mahasiswa data ter-sync dengan kehadiran system

**File to Check:**
- `src/pages/admin/*` (cari mahasiswa management)

### 2. **Admin Dashboard - Enrollment/Kelas**
- [ ] Admin bisa enroll mahasiswa ke kelas
- [ ] Admin bisa unroll mahasiswa dari kelas
- [ ] Status enrollment ter-sync dengan kehadiran

**File to Check:**
- `src/pages/admin/*` (cari enrollment management)

### 3. **Dosen Input Kehadiran - Jadwal Selection**
- [ ] Jadwal list menampilkan kelas, mata kuliah, tanggal
- [ ] Jadwal ter-filter per dosen (only his classes)
- [ ] Jadwal menampilkan angkatan info (optional)

**File to Check:**
- `src/pages/dosen/KehadiranPage.tsx` LINE 160-195

### 4. **Dosen Input Kehadiran - Mahasiswa List**
- [ ] Mahasiswa auto-load saat jadwal dipilih
- [ ] Mahasiswa list sesuai enrollment di kelas
- [ ] Nama, NIM, dll terpilih dengan benar

**File to Check:**
- `src/pages/dosen/KehadiranPage.tsx` LINE 205-250

### 5. **Multi-Angkatan Differentiation**
- [ ] Mahasiswa list menunjukkan angkatan (pin warna)
- [ ] Kelas A = mix dari pin merah/kuning/hijau (sesuai enrollment)
- [ ] UI jelas menunjukkan angkatan per mahasiswa

**File to Check:**
- `src/pages/dosen/KehadiranPage.tsx` (rendering section)

---

## 🔧 If Admin UI Not Complete

Jika Admin UI untuk input mahasiswa belum selesai, bisa pakai:

### Option 1: Manual via Supabase Dashboard
```
1. Buka https://app.supabase.com
2. Pilih project "sistem-praktikum-pwa"
3. Table Editor → mahasiswa table
4. Insert row, isi: nim, full_name, angkatan, program_studi
5. Table Editor → kelas_mahasiswa atau nilai table
6. Insert enrollment untuk sinkronisasi ke kelas
```

### Option 2: Create Admin Bulk Upload
- CSV upload untuk mahasiswa
- CSV upload untuk enrollment
- Batch processing

### Option 3: API-based
- Create endpoint di admin.api.ts
- Expose di admin page

---

## 📲 UI Elements to Verify

### Dosen Kehadiran Input Page:
- [ ] Jadwal dropdown shows: "Kelas-A | Praktikum Biologi | 27-Nov-2024 09:00"
- [ ] After select jadwal: mahasiswa list populated
- [ ] Each mahasiswa shows: NIM | Nama | Status dropdown | Keterangan
- [ ] Status option: Hadir (green) | Izin (blue) | Sakit (yellow) | Alpha (red)
- [ ] Save button to store all kehadiran

### Admin Mahasiswa Page:
- [ ] List of all mahasiswa with filters
- [ ] Show angkatan/pin (merah/kuning/hijau)
- [ ] Search by NIM/Nama
- [ ] Bulk upload option
- [ ] Enroll/Unenroll to kelas buttons

---

## ⚙️ Database Tables Involved

### `mahasiswa` table
```
- id (uuid)
- user_id (uuid) → users
- nim (string)
- angkatan (int) ← PIN COLOR determined here
- program_studi (string)
```

### `jadwal_praktikum` table
```
- id (uuid)
- kelas_id (uuid) → kelas
- tanggal_praktikum (date)
- jam_mulai (time)
- dosen_id (uuid) ← auto filter for current dosen
```

### `nilai` or `kelas_mahasiswa` table (enrollment)
```
- mahasiswa_id (uuid) → mahasiswa
- kelas_id (uuid) → kelas
- is_active (boolean)
- enrolled_at (timestamp)
```

### `kehadiran` table
```
- id (uuid)
- jadwal_id (uuid) → jadwal_praktikum
- mahasiswa_id (uuid) → mahasiswa
- status (enum: hadir/izin/sakit/alpha)
- keterangan (text)
```

---

## ✅ Conclusion

**Current Implementation:**
✅ Kehadiran system properly synced with jadwal praktikum
✅ Mahasiswa list auto-loaded from enrollment (kelas)
✅ Multi-angkatan support ready (via angkatan field)
✅ Each kelas has different mahasiswa (per enrollment)

**What Might Be Missing:**
❓ Admin UI untuk input mahasiswa
❓ Admin UI untuk manage enrollment
❓ Angkatan/pin color visualization di kehadiran page

**Next Steps:**
1. Verify admin UI for mahasiswa input
2. Verify admin UI for enrollment management
3. Check if angkatan/pin visualization needed in kehadiran page
4. Test with actual 3 angkatan data
