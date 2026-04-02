# Guideline: Penggunaan "Mata Kuliah" vs "Kelas Praktikum"

## 📋 Purpose
Dokumen ini menjelaskan **kapan** menggunakan "Mata Kuliah" dan **kapan** menggunakan "Kelas Praktikum" dalam Sistem Informasi Praktikum PWA.

---

## 🎯 Konsep Dasar

### 1. **Mata Kuliah** = SUBJECT/TOPIK
- **Definisi:** Mata kuliah yang akan dipraktikumkan
- **Contoh:** "Praktikum Pemrograman Web", "Praktikum Basis Data", "Praktikum Jaringan"
- **Fungsi:** Menunjukkan **TOPIK/SUBJECT** dari praktikum
- **Managed by:** Admin (master data)

### 2. **Kelas** = INSTANCE/PELAKSANAAN
- **Definisi:** Instance pelaksanaan praktikum dari suatu mata kuliah
- **Contoh:** PWA-A, PWA-B, BD-A (kelas dari mata kuliah tertentu)
- **Fungsi:** **PELAKSANAAN** praktikum di semester tertentu
- **Managed by:** Admin (create class), Dosen (teach class)

### 3. **Enrollment** = PARTISIPASI
- **Definisi:** Mahasiswa terdaftar/enrolled di kelas tertentu
- **Fungsi:** Mahasiswa **IKUTI** kelas praktikum
- **Managed by:** Admin/Dosen (assign mahasiswa)

---

## 📊 Database Schema (Reference)

```sql
-- Master data: TOPIK praktikum
CREATE TABLE mata_kuliah (
  id UUID PRIMARY KEY,
  kode_mk VARCHAR,        -- "PWA", "BD"
  nama_mk VARCHAR,        -- "Praktikum Pemrograman Web"
  sks INTEGER,
  semester INTEGER
);

-- Instance: PELAKSANAAN praktikum
CREATE TABLE kelas (
  id UUID PRIMARY KEY,
  mata_kuliah_id UUID,    -- FK: praktikum tentang APA
  dosen_id UUID,
  kode_kelas VARCHAR,     -- "PWA-A", "PWA-B"
  nama_kelas VARCHAR,     -- "Kelas A", "Kelas B"
  tahun_ajaran VARCHAR,   -- "2024/2025"
  semester_ajaran INTEGER -- 1 (Ganjil), 2 (Genap)
);

-- Enrollment: PARTISIPASI mahasiswa
CREATE TABLE kelas_mahasiswa (
  id UUID PRIMARY KEY,
  mahasiswa_id UUID,
  kelas_id UUID,          -- Mahasiswa ikut kelas mana
  is_active BOOLEAN
);
```

**Relasi:**
```
Mata Kuliah (1) → Kelas (many) → Kelas_Mahasiswa (many)
   ↓                ↓                    ↓
  TOPIK        INSTANCE            PARTISIPASI
  (Apa)      (Pelaksanaan)      (Siapa ikut)
```

---

## ✅ Guideline Penggunaan

### Rule 1: Gunakan "Mata Kuliah" untuk CONTEXT/INFO

**Kapan:**
- ✅ Table column headers (menunjukkan praktikum tentang APA)
- ✅ Detail views (info field)
- ✅ Search criteria
- ✅ Filter options
- ✅ Reports yang group by subject

**Contoh:**

#### ✅ CORRECT: Table Header
```tsx
<TableHead>Mata Kuliah</TableHead>
<TableCell>{nilai.mata_kuliah_nama}</TableCell>
```

**Reasoning:** Ini adalah **field info** yang menunjukkan "praktikum tentang APA".

---

#### ✅ CORRECT: Search Placeholder
```tsx
<Input placeholder="Cari kuis, mata kuliah, atau kelas..." />
```

**Reasoning:** User bisa search berdasarkan **subject/topik** praktikum.

---

#### ✅ CORRECT: Detail Info
```tsx
<div>
  <label>Mata Kuliah:</label>
  <span>{kelas.mata_kuliah_nama}</span>
</div>
```

**Reasoning:** Menunjukkan context **praktikum tentang apa**.

---

### Rule 2: Gunakan "Kelas Praktikum" untuk METRICS/COUNTING

**Kapan:**
- ✅ Stats cards (counting total)
- ✅ Dashboard metrics
- ✅ Summary counts
- ✅ Enrollment status

**Contoh:**

#### ✅ CORRECT: Stats Card
```tsx
<Card>
  <CardTitle>Kelas Praktikum</CardTitle>
  <div>{stats.totalKelasPraktikum}</div>
  <p>Kelas yang diikuti</p>
</Card>
```

**Reasoning:** Mahasiswa **COUNT kelas yang diikuti**, bukan count mata kuliah.

---

#### ❌ WRONG: Stats Card
```tsx
<Card>
  <CardTitle>Total Mata Kuliah</CardTitle>  {/* ❌ SALAH! */}
  <div>{stats.totalMataKuliah}</div>
  <p>Kelas yang di-assign</p>
</Card>
```

**Why wrong:**
- Variable count **kelas** (from `kelas_mahasiswa`), not unique subjects
- Mahasiswa ikut **kelas**, bukan "ambil mata kuliah" (ini bukan KRS)

---

### Rule 3: Gunakan "Kelas Praktikum" untuk USER ACTIONS

**Kapan:**
- ✅ Descriptions tentang apa yang user lakukan
- ✅ Action buttons
- ✅ Status messages

**Contoh:**

#### ✅ CORRECT: Description
```tsx
<CardDescription>
  Nilai untuk semua kelas praktikum yang Anda ikuti
</CardDescription>
```

**Reasoning:** Mahasiswa **IKUTI kelas**, bukan "ambil mata kuliah".

---

#### ❌ WRONG: Description
```tsx
<CardDescription>
  Nilai untuk semua mata kuliah yang Anda ambil  {/* ❌ SALAH! */}
</CardDescription>
```

**Why wrong:**
- Ini bukan sistem KRS (Kartu Rencana Studi)
- Mahasiswa tidak "ambil mata kuliah", tapi **ikuti kelas praktikum**

---

## 📋 Checklist Quick Reference

### When to use "Mata Kuliah" ✅

- [ ] Table column header untuk subject info
- [ ] Detail view field (info praktikum tentang apa)
- [ ] Search/filter criteria
- [ ] Report grouping by subject
- [ ] Admin pages (master data management)

### When to use "Kelas Praktikum" ✅

- [ ] Stats cards (counting enrolled classes)
- [ ] Dashboard metrics
- [ ] User action descriptions ("yang diikuti")
- [ ] Enrollment status
- [ ] Navigation menu items

---

## 🎨 Examples by Page

### Dashboard Mahasiswa

```tsx
// ✅ CORRECT
<Card>
  <CardTitle>Kelas Praktikum</CardTitle>          {/* Metric */}
  <div>{stats.totalKelasPraktikum}</div>
  <p>Kelas yang diikuti</p>
</Card>
```

### Nilai Page

```tsx
// ✅ CORRECT: Stats Card (Metric)
<CardTitle>Kelas Praktikum</CardTitle>

// ✅ CORRECT: Description (User Action)
<CardDescription>
  Nilai untuk semua kelas praktikum yang Anda ikuti
</CardDescription>

// ✅ CORRECT: Table Header (Field Info)
<TableHead>Mata Kuliah</TableHead>
<TableCell>{nilai.mata_kuliah_nama}</TableCell>
```

### Presensi Page

```tsx
// ✅ CORRECT: Table Header (Field Info)
<TableHead>Mata Kuliah</TableHead>
<TableCell>{presensi.mata_kuliah_nama}</TableCell>
```

### Kuis List Page

```tsx
// ✅ CORRECT: Search (Include subject as criteria)
<Input placeholder="Cari kuis, mata kuliah, atau kelas..." />
```

---

## 🚫 Common Mistakes

### ❌ Mistake 1: Counting as "Mata Kuliah"

```tsx
// ❌ WRONG
const totalMataKuliah = kelasData?.length;  // Counting kelas, not subjects!

// ✅ CORRECT
const totalKelasPraktikum = kelasData?.length;
```

---

### ❌ Mistake 2: User Action Description

```tsx
// ❌ WRONG
"Mata kuliah yang Anda ambil"  // Bukan KRS!

// ✅ CORRECT
"Kelas praktikum yang Anda ikuti"
```

---

### ❌ Mistake 3: Stats Card Title

```tsx
// ❌ WRONG
<CardTitle>Total Mata Kuliah</CardTitle>

// ✅ CORRECT
<CardTitle>Kelas Praktikum</CardTitle>
```

---

## 📝 Summary

| Context | Use | Example |
|---------|-----|---------|
| **Field Info** | "Mata Kuliah" | Table header, Detail view |
| **Search/Filter** | "Mata Kuliah" | Search placeholder, Filter options |
| **Metrics/Count** | "Kelas Praktikum" | Stats cards, Dashboard metrics |
| **User Actions** | "Kelas Praktikum" | "yang diikuti", "yang Anda ikuti" |
| **Admin Pages** | "Mata Kuliah" | Master data management |

---

## ✅ Verification Checklist

Saat review code, check:

- [ ] Stats cards menggunakan "Kelas Praktikum" (not "Mata Kuliah")
- [ ] Counting variables bernama `totalKelasPraktikum` (not `totalMataKuliah`)
- [ ] User action descriptions menggunakan "kelas praktikum yang diikuti"
- [ ] Table headers "Mata Kuliah" untuk field info ✅ OK
- [ ] Search placeholders boleh include "mata kuliah" ✅ OK

---

**Last Updated:** 2025-12-09
**Status:** ✅ Final & Approved
**Maintainer:** Development Team
