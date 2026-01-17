# 📋 Workflow: Admin → Dosen → Mahasiswa

**Status**: ✅ VERIFIED  
**Date**: December 8, 2025  
**Purpose**: Clear workflow of who creates what and when

---

## 🎯 RINGKAS SEKALI

### **Admin membuat: Mata Kuliah + Kelas**

### **Dosen membuat: Jadwal + Kuis + Materi**

### **Mahasiswa lihat: Berdasarkan kelas yang di-assign admin + jadwal dari dosen**

---

## 📊 WORKFLOW LENGKAP

### **TAHAP 1: ADMIN → BUAT MATA KULIAH**

```
Admin login → Mata Kuliah Management
│
├─ Buat "Sistem Operasi"
│  ├─ Kode: SO101
│  ├─ SKS: 3
│  ├─ Semester: 3
│  └─ Program Studi: Teknik Informatika
│
└─ Database: INSERT INTO mata_kuliah (...)
```

**Result**: Master data tersimpan, belum bisa dilihat mahasiswa

---

### **TAHAP 2: ADMIN → BUAT KELAS**

```
Admin login → Kelas Management
│
├─ Buat "Sistem Operasi - A" dari Mata Kuliah SO101
│  ├─ Kode Kelas: SO101-A
│  ├─ Mata Kuliah: SO101
│  ├─ Dosen Pengajar: Dr. Budi (assign dosen)
│  ├─ Kuota: 40 mahasiswa
│  └─ Tahun Ajaran: 2024/2025
│
└─ Database: INSERT INTO kelas (mata_kuliah_id, dosen_id, ...)

🔑 Kelas = Instance dari mata_kuliah + Assign dosen
```

**Result**: Kelas siap, tapi belum ada mahasiswa

---

### **TAHAP 3: ADMIN → ASSIGN MAHASISWA**

```
Admin login → Kelas Management → SO101-A
│
├─ Assign Mahasiswa
│  ├─ Pilih mahasiswa (Budi, Ani, Citra, dll)
│  └─ Click: "Enroll ke Kelas"
│
└─ Database: INSERT INTO kelas_mahasiswa (mahasiswa_id, kelas_id, ...)
   VALUES (mahasiswa_budi, kelas_so101a, ...)

📌 Bisa bulk upload atau manual selection
```

**Result**: Mahasiswa sekarang enrolled ke kelas

**Status Mahasiswa di Dashboard**: ✅ Sekarang muncul di "Total Mata Kuliah"

---

### **TAHAP 4: DOSEN → BUAT JADWAL PRAKTIKUM**

```
Dosen login → Jadwal Management
│
├─ Buat Jadwal untuk Kelas SO101-A (yang diampu)
│  ├─ Hari: Senin
│  ├─ Jam: 08:00 - 10:00
│  ├─ Lab: Lab Sistem - Room A
│  ├─ Tanggal: 2024-12-09
│  └─ Topik: Pertemuan 1 - Konsep OS
│
└─ Database: INSERT INTO jadwal_praktikum (kelas_id, laboratorium_id, ...)

⚡ Jadwal LINKED ke kelas SO101-A
```

**Result**: Jadwal tersimpan

**Status Mahasiswa**: ✅ Sekarang bisa lihat jadwal di halaman Jadwal

---

### **TAHAP 5: DOSEN → BUAT KUIS**

```
Dosen login → Kuis Management
│
├─ Buat Kuis untuk Kelas SO101-A
│  ├─ Judul: "Kuis Sistem Operasi - Pertemuan 1"
│  ├─ Tipe: Multiple Choice
│  ├─ Status: Draft (atau langsung Publish)
│  ├─ Jadwal: 2024-12-09 08:00 - 10:00
│  ├─ Soal: [Soal 1, Soal 2, ... Soal 20]
│  └─ Nilai Total: 100
│
└─ Database: INSERT INTO kuis (kelas_id, dosen_id, status='published', ...)

📌 PENTING: Hanya published kuis yang terlihat mahasiswa
```

**Result**: Kuis siap dikerjakan

**Status Mahasiswa**: ✅ Sekarang bisa lihat kuis di halaman Kuis (jika published)

---

### **TAHAP 6: DOSEN → UPLOAD MATERI**

```
Dosen login → Materi Management
│
├─ Upload Materi untuk Jadwal Praktikum
│  ├─ Jadwal: Senin (SO101-A)
│  ├─ Judul: "Materi - Konsep Sistem Operasi"
│  ├─ File: SO-Chapter1.pdf
│  └─ Deskripsi: "Pengenalan sistem operasi dan komponen utamanya"
│
└─ Database: INSERT INTO materi (jadwal_praktikum_id, dosen_id, file_url, ...)

⚡ Materi LINKED ke jadwal praktikum
```

**Result**: Materi tersimpan

**Status Mahasiswa**: ✅ Sekarang bisa download materi di halaman Materi

---

### **TAHAP 7: MAHASISWA → LIHAT & KERJAKAN**

```
Mahasiswa login → Dashboard
│
├─ Dashboard Stats:
│  ├─ Total Mata Kuliah: 1 ✅ (SO101)
│  ├─ Total Kuis: 1 ✅ (Kuis SO101)
│  ├─ Rata-rata Nilai: - (belum ada)
│  └─ Jadwal Hari Ini: 1 ✅ (Jadwal SO101 - Senin)
│
├─ Halaman Jadwal:
│  └─ SO101 - A
│     ├─ Senin 08:00-10:00
│     ├─ Lab Sistem - Room A
│     └─ Materi tersedia ✅
│
├─ Halaman Kuis:
│  └─ Kuis Sistem Operasi - Pertemuan 1
│     ├─ Status: Available
│     ├─ Deadline: 2024-12-09 10:00
│     └─ Click: Kerjakan Kuis
│
├─ Halaman Materi:
│  └─ Materi - Konsep Sistem Operasi
│     ├─ File: SO-Chapter1.pdf
│     └─ Click: Download
│
└─ Kerjakan Kuis → Lihat Nilai di Halaman Nilai
```

**Result**: Mahasiswa mendapat nilai dari kuis

---

## 🔐 KONTROL AKSES (RLS DATABASE)

### **Admin bisa:**

- ✅ CRUD semua mata kuliah
- ✅ CRUD semua kelas
- ✅ CRUD semua kelas_mahasiswa (assign mahasiswa)
- ✅ Lihat semua jadwal/kuis/materi (read-only biasanya)

### **Dosen bisa:**

- ✅ CRUD kelas yang diajarnya saja
- ✅ CRUD jadwal untuk kelas yang diajarnya
- ✅ CRUD kuis untuk kelas yang diajarnya
- ✅ CRUD materi untuk jadwal di kelas yang diajarnya
- ✅ Lihat mahasiswa di kelas yang diajarnya
- ❌ Lihat jadwal/kuis/materi milik dosen lain

### **Mahasiswa bisa:**

- ✅ Lihat mata kuliah (via kelas yang enrolled)
- ✅ Lihat jadwal untuk kelas yang enrolled
- ✅ Lihat kuis published untuk kelas yang enrolled
- ✅ Lihat materi dari jadwal kelas yang enrolled
- ✅ Kerjakan kuis dan lihat nilai sendiri
- ❌ Lihat data mahasiswa lain
- ❌ Lihat kuis belum di-publish
- ❌ Lihat jadwal kelas lain

---

## 🚨 POIN PENTING

### **Jika admin TIDAK assign mahasiswa ke kelas:**

- ❌ Mahasiswa tidak lihat mata kuliah
- ❌ Mahasiswa tidak lihat jadwal
- ❌ Mahasiswa tidak lihat kuis
- ❌ Mahasiswa tidak lihat materi
- ℹ️ "Total Mata Kuliah" = 0

### **Jika dosen TIDAK buat jadwal:**

- ⚠️ Kelas tetap terlihat di enrollment
- ⚠️ Tapi "Jadwal Praktikum" kosong
- ℹ️ Mahasiswa tahu dia enroll ke kelas tapi tidak ada jadwal

### **Jika dosen TIDAK publish kuis:**

- ⚠️ Kuis tidak terlihat di halaman Kuis mahasiswa
- ⚠️ Tapi draft masih bisa dilihat dosen
- ℹ️ Dosen bisa prepare kuis sebelum publish

---

## 📌 SKENARIO EXAMPLE: LENGKAP

### **HARI 1 - ADMIN SETUP**

```
1. Admin buat mata kuliah "Sistem Operasi" (SO101)
2. Admin buat kelas "SO101-A" dari mata kuliah SO101
3. Admin assign dosen "Dr. Budi" ke kelas SO101-A
4. Admin assign mahasiswa: Budi, Ani, Citra, Doni ke kelas SO101-A
   → Total 4 mahasiswa enrolled
```

### **HARI 2 - DOSEN PERSIAPAN**

```
1. Dosen login melihat kelas SO101-A dengan 4 mahasiswa
2. Dosen buat jadwal:
   - Senin 08:00-10:00 (Lab Sistem - Room A)
3. Dosen upload materi:
   - Chapter 1: Konsep OS
   - Chapter 2: Process Management
4. Dosen buat kuis (status: Draft dulu)
```

### **HARI 3 - DOSEN PUBLISH**

```
1. Dosen publish kuis (status: Published)
   → Sekarang terlihat ke mahasiswa
```

### **HARI 3-4 - MAHASISWA LIHAT**

```
Dashboard Budi:
- Total Mata Kuliah: 1 (Sistem Operasi)
- Total Kuis: 1 (Kuis SO - Pertemuan 1)
- Jadwal Hari Ini: 1 (Senin - SO101-A)

Halaman Jadwal:
- SO101-A Senin 08:00-10:00 ✅

Halaman Materi:
- Chapter 1: Konsep OS ✅
- Chapter 2: Process Management ✅

Halaman Kuis:
- Kuis SO - Pertemuan 1 (Available) ✅
  → Click: Kerjakan Kuis

Setelah Kerjakan:
- Halaman Nilai:
  - Kuis SO - Pertemuan 1: 85/100 ✅
```

---

## ✅ VERIFICATION CHECKLIST

Untuk memverifikasi sistem sudah benar:

- [ ] Admin bisa buat mata kuliah
- [ ] Admin bisa buat kelas dari mata kuliah
- [ ] Admin bisa assign mahasiswa ke kelas
- [ ] Dosen bisa buat jadwal untuk kelas yang diampu
- [ ] Dosen bisa buat kuis untuk kelas yang diampu
- [ ] Dosen bisa upload materi untuk jadwal
- [ ] Mahasiswa lihat mata kuliah hanya dari kelas yang di-assign
- [ ] Mahasiswa lihat jadwal hanya dari kelas yang enrolled
- [ ] Mahasiswa lihat kuis only yang published
- [ ] Mahasiswa lihat materi dari jadwal kelas yang enrolled
- [ ] RLS policies melindungi data dengan benar

---

## 🔗 Related Documentation

- `ANALISIS_ALUR_MATA_KULIAH_MAHASISWA.md` - Detailed analysis
- `21_enhanced_rls_policies.sql` - Database security
- `TOTAL_MATA_KULIAH_DASHBOARD_SOURCE.md` - Dashboard stats
- `FITUR_PILIH_KELAS_IMPLEMENTATION.md` - Class selection feature

---

**Last Updated**: December 8, 2025  
**Status**: ✅ Workflow Documented and Verified
