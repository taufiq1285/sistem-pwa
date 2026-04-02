# 📊 Analisis Alur Mata Kuliah yang Bisa Dilihat Mahasiswa

**Status**: ✅ ANALYSIS COMPLETE  
**Date**: December 8, 2025  
**Focus**: Understanding mata kuliah visibility in student dashboard

---

## 🎯 Kesimpulan Singkat

Mata kuliah yang bisa dilihat mahasiswa adalah **mata kuliah yang berasal dari kelas yang dibuat admin AND memiliki jadwal praktikum yang dibuat dosen**, ditampilkan di:

1. **Dashboard** - Total mata kuliah (statistik = count kelas yang enrolled)
2. **Jadwal Praktikum** - Jadwal untuk setiap mata kuliah (hanya kelas dengan jadwal)
3. **Kuis** - Kuis dari dosen untuk mata kuliah tersebut (hanya yang published)
4. **Materi** - Materi pembelajaran untuk mata kuliah tersebut (via jadwal)

---

## 🔄 ALUR LENGKAP: Bagaimana Data Mengalir

### **TAHAP 1: ADMIN MEMBUAT MATA KULIAH**

```
Admin Dashboard → Admin membuat "Sistem Operasi" → TABLE: mata_kuliah
├─ kode_mk: "SO101"
├─ nama_mk: "Sistem Operasi"
├─ sks: 3
├─ program_studi: "Teknik Informatika"
├─ semester: 3
└─ is_active: true
```

### **TAHAP 2: ADMIN MEMBUAT KELAS DARI MATA KULIAH**

```
Admin Dashboard → Admin buat kelas "Kelas A" → TABLE: kelas
├─ kode_kelas: "SO101-A"
├─ nama_kelas: "Sistem Operasi - A"
├─ mata_kuliah_id: <ID dari "Sistem Operasi">
├─ dosen_id: <ID dosen yang mengajar> ← Assign dosen ke kelas
├─ kuota: 40
├─ tahun_ajaran: "2024/2025"
├─ semester_ajaran: 3
└─ is_active: true

🔑 PENTING: Admin buat kelas, assign ke mata_kuliah + dosen!
```

### **TAHAP 3: ADMIN ASSIGN MAHASISWA KE KELAS**

```
Admin Dashboard → Pilih Kelas A → Assign Mahasiswa → TABLE: kelas_mahasiswa
├─ mahasiswa_id: <ID mahasiswa>
├─ kelas_id: <ID kelas A>
├─ enrolled_at: 2024-12-01
├─ is_active: true
└─ status: 'enrolled'

🔑 PENTING: Di sini mahasiswa terhubung ke kelas!
```

### **TAHAP 4: DOSEN MEMBUAT JADWAL PRAKTIKUM**

```
Dosen Dashboard → Create Jadwal → TABLE: jadwal_praktikum
├─ kelas_id: <ID kelas A>
├─ laboratorium_id: <ID lab>
├─ hari: "Senin"
├─ jam_mulai: "08:00"
├─ jam_selesai: "10:00"
├─ tanggal_praktikum: "2024-12-09"
└─ is_active: true

⚡ Jadwal ini LINKED ke kelas → LINKED ke mata_kuliah!
```

### **TAHAP 5: DOSEN MEMBUAT KUIS**

```
Dosen Dashboard → Create Kuis → TABLE: kuis
├─ kelas_id: <ID kelas A>
├─ dosen_id: <ID dosen>
├─ judul: "Kuis Sistem Operasi"
├─ status: "published"
├─ tanggal_mulai: "2024-12-09 08:00"
├─ tanggal_selesai: "2024-12-09 10:00"
└─ soal: [...soal-soal]

⚡ Kuis ini LINKED ke kelas → LINKED ke mata_kuliah!
```

### **TAHAP 6: DOSEN UPLOAD MATERI**

```
Dosen Dashboard → Upload Materi → TABLE: materi
├─ jadwal_praktikum_id: <ID jadwal>
├─ dosen_id: <ID dosen>
├─ judul: "Materi Sistem Operasi - Pertemuan 1"
├─ deskripsi: "..."
├─ file_url: "..."
└─ is_active: true

⚡ Materi LINKED ke jadwal → LINKED ke kelas → LINKED ke mata_kuliah!
```

---

## 📱 TAHAP 7: MAHASISWA MELIHAT DI DASHBOARD

### **Data yang ditampilkan ke Mahasiswa:**

```typescript
// FILE: src/lib/api/mahasiswa.api.ts → getMahasiswaStats()

// 1️⃣ AMBIL KELAS YANG ENROLLED
SELECT kelas_id
FROM kelas_mahasiswa
WHERE mahasiswa_id = ? AND is_active = true

// ⬇️ Hasil: [kelas_A_id, kelas_B_id, ...]

// 2️⃣ HITUNG TOTAL MATA KULIAH
totalMataKuliah = kelas.length  // = 2 (jika 2 kelas)

// 3️⃣ AMBIL JADWAL HARI INI
SELECT id, kelas_id
FROM jadwal_praktikum
WHERE tanggal_praktikum = TODAY AND kelas_id IN (kelas_A_id, kelas_B_id, ...)

// 4️⃣ AMBIL KUIS YANG BERLANGSUNG
SELECT id
FROM kuis
WHERE status = 'published'
AND kelas_id IN (kelas_A_id, kelas_B_id, ...)
AND tanggal_mulai <= NOW AND tanggal_selesai >= NOW

// 5️⃣ HITUNG RATA-RATA NILAI
SELECT total_score
FROM attempt_kuis
WHERE mahasiswa_id = ? AND total_score IS NOT NULL
// Average = SUM(total_score) / COUNT
```

**Hasil Dashboard:**

```
📊 Dashboard Mahasiswa
├─ Total Mata Kuliah: 2 ✅
│  └─ Dari: kelas yang di-assign admin (hanya yang enrolled)
├─ Total Kuis: 1 ✅
│  └─ Dari: kuis yang di-buat dosen untuk kelas tersebut
├─ Rata-rata Nilai: 85.5 ✅
│  └─ Dari: attempt_kuis yang sudah diisi mahasiswa
└─ Jadwal Hari Ini: 1 ✅
   └─ Dari: jadwal praktikum di kelas tersebut (dibuat dosen)
```

├─ Total Kuis: 1 ✅
│ └─ Dari: kuis yang di-buat dosen untuk kelas tersebut
├─ Rata-rata Nilai: 85.5 ✅
│ └─ Dari: attempt_kuis yang sudah diisi mahasiswa
└─ Jadwal Hari Ini: 1 ✅
└─ Dari: jadwal praktikum di kelas tersebut

````

---

## 📖 HALAMAN LAIN: DI MANA MATA KULIAH DITAMPILKAN

### **1. HALAMAN JADWAL (JadwalPage.tsx)**

```typescript
// Ambil kelas yang enrolled
getMyKelas() → Dari kelas_mahasiswa + kelas + mata_kuliah

// Hasil ditampilkan dengan:
├─ Mata Kuliah: "Sistem Operasi"
├─ Kelas: "SO101-A"
├─ Dosen: "Dr. Budi"
├─ Jadwal: "Senin, 08:00-10:00"
├─ Lokasi Lab: "Lab Sistem"
└─ Materi: "Materi 1, Materi 2, ..."
````

### **2. HALAMAN KUIS (KuisPage.tsx)**

```typescript
// Ambil kuis dari kelas yang enrolled
SELECT kuis
FROM kuis
WHERE kelas_id IN (enrolled_kelas) AND status = 'published'

// Hasil ditampilkan dengan:
├─ Judul: "Kuis Sistem Operasi"
├─ Mata Kuliah: "Sistem Operasi"
├─ Kelas: "SO101-A"
├─ Deadline: "2024-12-09 10:00"
└─ Status: "Sudah Dikerjakan / Belum Dikerjakan"
```

### **3. HALAMAN MATERI (MateriPage.tsx)**

```typescript
// Ambil materi dari jadwal praktikum di kelas yang enrolled
SELECT materi
FROM materi
JOIN jadwal_praktikum ON materi.jadwal_praktikum_id = jadwal_praktikum.id
WHERE jadwal_praktikum.kelas_id IN (enrolled_kelas)

// Hasil ditampilkan dengan:
├─ Judul: "Materi Sistem Operasi - Pertemuan 1"
├─ Mata Kuliah: "Sistem Operasi"
├─ Kelas: "SO101-A"
├─ Tanggal: "2024-12-09"
└─ File: "materi-so-1.pdf"
```

### **4. HALAMAN NILAI (NilaiPage.tsx)**

```typescript
// Ambil nilai dari attempt_kuis untuk kelas yang enrolled
SELECT attempt_kuis
FROM attempt_kuis
JOIN kuis ON attempt_kuis.kuis_id = kuis.id
WHERE kuis.kelas_id IN (enrolled_kelas)

// Hasil ditampilkan dengan:
├─ Kuis: "Kuis Sistem Operasi"
├─ Mata Kuliah: "Sistem Operasi"
├─ Kelas: "SO101-A"
├─ Skor: 85/100
└─ Tanggal: "2024-12-09 09:30"
```

---

## 🔐 KEAMANAN: RLS POLICIES MEMASTIKAN

### **Mahasiswa HANYA bisa lihat:**

```sql
-- 1. Kelas yang sudah di-assign admin
kelas_mahasiswa.mahasiswa_id = CURRENT_USER
AND kelas_mahasiswa.is_active = true

-- 2. Jadwal dari kelas tersebut
jadwal_praktikum.kelas_id IN (SELECT enrolled_kelas)

-- 3. Kuis yang published dari kelas tersebut
kuis.status = 'published'
AND kuis.kelas_id IN (SELECT enrolled_kelas)

-- 4. Materi dari jadwal di kelas tersebut
materi.jadwal_praktikum_id IN (
  SELECT jadwal_praktikum.id
  WHERE kelas_id IN (SELECT enrolled_kelas)
)

-- 5. Nilai mereka sendiri
attempt_kuis.mahasiswa_id = CURRENT_USER
```

---

## 📊 TABEL-TABEL YANG TERLIBAT

| Tabel              | Tujuan                          | Created By   | Visible To Mahasiswa       |
| ------------------ | ------------------------------- | ------------ | -------------------------- |
| `mata_kuliah`      | Master list mata kuliah         | Admin        | ✅ Ya (via kelas)          |
| `kelas`            | Instance kelas dari mata kuliah | Admin        | ✅ Ya (jika enrolled)      |
| `kelas_mahasiswa`  | Assignment mahasiswa ke kelas   | Admin        | ✅ Ya (own records)        |
| `jadwal_praktikum` | Jadwal untuk kelas              | Dosen        | ✅ Ya (for enrolled kelas) |
| `kuis`             | Kuis dari dosen                 | Dosen        | ✅ Ya (published only)     |
| `materi`           | File/materi pembelajaran        | Dosen        | ✅ Ya (for enrolled kelas) |
| `attempt_kuis`     | Hasil pengerjaan kuis           | Mahasiswa    | ✅ Ya (own attempts)       |
| `nilai`            | Nilai akhir                     | Dosen/Sistem | ✅ Ya (own grades)         |

---

## 🔀 FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────┐
│ ADMIN DASHBOARD - TAHAP 1                               │
│ - Buat Mata Kuliah (SO101 - Sistem Operasi)            │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ ADMIN DASHBOARD - TAHAP 2                               │
│ - Buat Kelas (SO101-A) → Link ke mata_kuliah + dosen   │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ ADMIN DASHBOARD - TAHAP 3                               │
│ - Assign Mahasiswa ke Kelas (SO101-A)                  │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ DOSEN DASHBOARD - TAHAP 4-6                             │
│ - Buat Jadwal Praktikum → Linked ke kelas              │
│ - Buat Kuis → Linked ke kelas (published/draft)        │
│ - Upload Materi → Linked ke jadwal praktikum           │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
         ╔════════════════════════════╗
         ║ MAHASISWA SEKARANG BISA    ║
         ║ LIHAT (hanya enrolled):    ║
         ║ ✅ Mata Kuliah (count)      ║
         ║ ✅ Jadwal Praktikum         ║
         ║ ✅ Kuis (published)         ║
         ║ ✅ Materi                   ║
         ║ ✅ Nilai (own scores)       ║
         ╚════════════════════════════╝
```

         ║ ✅ Kuis             ║
         ║ ✅ Materi           ║
         ║ ✅ Nilai            ║
         ╚═════════════════════╝

````

---

## 🎯 POIN KUNCI

### **Siapa yang membuat apa?**

| Item | Created By | Notes |
|------|-----------|-------|
| Mata Kuliah | ADMIN | Master data, tidak bisa dilihat langsung mahasiswa |
| Kelas | ADMIN | Instance dari mata_kuliah, link ke dosen pengajar |
| Assignment Mahasiswa | ADMIN | Via `kelas_mahasiswa` table |
| Jadwal Praktikum | DOSEN | Untuk kelas yang di-assign |
| Kuis | DOSEN | Untuk kelas yang diampu |
| Materi | DOSEN | Via jadwal praktikum |

### **Mahasiswa lihat mata kuliah JIKA DAN HANYA JIKA:**

1. ✅ **Admin sudah assign mahasiswa ke kelas** (via `kelas_mahasiswa`)
2. ✅ **Kelas tersebut link ke mata_kuliah** (via `kelas.mata_kuliah_id`)
3. ✅ **Kelas tersebut active** (`kelas.is_active = true`)
4. ✅ **Dosen sudah buat jadwal praktikum** untuk kelas tersebut

### **Mahasiswa TIDAK bisa lihat:**

- ❌ Mata kuliah yang tidak ada kelasnya
- ❌ Kelas yang belum di-assign admin
- ❌ Kelas tanpa jadwal praktikum dari dosen
- ❌ Kuis yang belum di-publish dosen
- ❌ Jadwal dari kelas lain (bukan enrolled)
- ❌ Nilai mahasiswa lain

---

## 💡 IMPLEMENTASI API

### **Mahasiswa mendapat data dari:**

```typescript
// 1. getMahasiswaStats() - Dashboard
// ├─ totalMataKuliah: COUNT dari kelas_mahasiswa
// ├─ totalKuis: COUNT dari kuis (published, enrolled kelas)
// ├─ rataRataNilai: AVG dari attempt_kuis
// └─ jadwalHariIni: COUNT dari jadwal_praktikum (today, enrolled kelas)

// 2. getMyKelas() - Jadwal/Kuis/Materi pages
// └─ Ambil dari kelas_mahasiswa + kelas + mata_kuliah

// 3. getMyJadwal() - Jadwal page
// └─ Ambil dari kelas_mahasiswa + jadwal_praktikum

// 4. getMyKuis() / getPublishedKuis() - Kuis page
// └─ Ambil dari kuis (status=published, enrolled kelas)

// 5. getMyMateri() - Materi page
// └─ Ambil dari materi (jadwal di enrolled kelas)

// 6. getMyNilai() - Nilai page
// └─ Ambil dari attempt_kuis (mahasiswa_id = current user)
````

---

## ✅ KESIMPULAN AKHIR

### **SIAPA MEMBUAT APA:**

**ADMIN:**

- ✅ Mata Kuliah (SO101, PBO101, dll)
- ✅ Kelas (SO101-A, PBO101-B, dll) - Link ke mata_kuliah
- ✅ Assign Mahasiswa ke Kelas

**DOSEN:**

- ✅ Jadwal Praktikum (untuk kelas yang diajar)
- ✅ Kuis (untuk kelas yang diajar)
- ✅ Materi (via jadwal praktikum)

### **MAHASISWA BISA LIHAT:**

**Mata Kuliah**: Hanya melalui kelas yang sudah di-assign admin DAN memiliki jadwal praktikum dari dosen

- Count di Dashboard = `kelas_mahasiswa.count()` yang active
- Detail = Dari `kelas.mata_kuliah_id`

**Jadwal Praktikum**: Hanya untuk kelas yang enrolled (created by dosen)

**Kuis**: Hanya yang published (created by dosen)

**Materi**: Hanya dari jadwal praktikum di kelas enrolled (created by dosen)

**Nilai**: Hanya nilai mahasiswa sendiri (dari attempt_kuis)

### **Database RLS Protection:**

```sql
-- Mahasiswa HANYA bisa lihat:
- Kelas: kelas_mahasiswa.mahasiswa_id = CURRENT_USER
- Jadwal: jadwal_praktikum.kelas_id IN (enrolled_kelas)
- Kuis: kuis.status = 'published' AND kelas_id IN (enrolled_kelas)
- Materi: materi via jadwal di enrolled_kelas
- Nilai: attempt_kuis.mahasiswa_id = CURRENT_USER
```

---

## 📋 Data Flow Summary

| Source               | Path                  | Link Chain                                                               |
| -------------------- | --------------------- | ------------------------------------------------------------------------ |
| **Dashboard Stats**  | `getMahasiswaStats()` | `kelas_mahasiswa` → `kelas` → `mata_kuliah`                              |
| **Jadwal Praktikum** | `getMyJadwal()`       | `kelas_mahasiswa` → `kelas` → `mata_kuliah` + `jadwal_praktikum` (dosen) |
| **Kuis**             | `getPublishedKuis()`  | `kelas_mahasiswa` → `kelas` → `mata_kuliah` + `kuis` (dosen, published)  |
| **Materi**           | `getMyMateri()`       | `kelas_mahasiswa` → `kelas` → `jadwal_praktikum` → `materi` (dosen)      |
| **Nilai**            | `getMyNilai()`        | `attempt_kuis` (self) → `kuis` → `kelas` → `mata_kuliah`                 |

---

## 🔗 Related Documentation

- `TOTAL_MATA_KULIAH_DASHBOARD_SOURCE.md` - Detail dashboard stats
- `21_enhanced_rls_policies.sql` - Database security policies
- `FITUR_PILIH_KELAS_IMPLEMENTATION.md` - Class enrollment feature

---

**Last Updated**: December 8, 2025  
**Status**: ✅ Analysis Complete
