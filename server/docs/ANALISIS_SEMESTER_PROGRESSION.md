# 📊 ANALISIS: Semester Progression vs Angkatan

## 🎯 MASALAH YANG TERJADI

**Scenario Sekarang:**

- Mahasiswa register dengan `angkatan = 2022` dan `semester = 1`
- Admin buat **Kelas A (Angkatan 2022, Semester 1)**
- 6 bulan kemudian → Mahasiswa naik ke **Semester 2**
- ❌ **PROBLEM**: Kelas A masih bertuliskan "Semester 1"!
- ❌ Apakah perlu buat kelas baru? Update kelas? Atau apa?

---

## 🔍 ANALISIS DATABASE

### Tabel Mahasiswa

```sql
id | user_id | nim      | angkatan | semester | program_studi | created_at | updated_at
---|---------|----------|----------|----------|---------------|------------|----------
1  | uuid1   | BD2321001| 2022     | 1        | Kebidanan     | ...        | ...
                                    ↑
                        BERUBAH setiap 6 bulan!
```

### Tabel Kelas

```sql
id | nama_kelas | semester_ajaran | tahun_ajaran | mata_kuliah_id | dosen_id | is_active
---|------------|-----------------|--------------|----------------|----------|----------
1  | Kelas A    | 1               | 2022/2023    | NULL           | NULL     | true
                   ↑
           STATIC (tidak berubah)
```

### Tabel Kelas_Mahasiswa

```sql
id | kelas_id | mahasiswa_id | status   | is_active | enrolled_at
---|----------|--------------|----------|-----------|----------
1  | 1        | 1            | active   | true      | 2022-08-01
                              ↑
                   Apakah berubah?
```

---

## ❓ PERTANYAAN KRITIS

### 1. **Apakah "Semester" di Kelas harus update otomatis?**

**Option A: Tidak perlu update**

```
Kelas A tetap "Semester 1"
(merepresentasikan KETIKA kelas dibuat)

Tapi mahasiswa sudah semester 2
→ Sistem harus cek: apakah mhs semester >= kelas semester?
→ Jika ya: mahasiswa BISA ambil kelas ini
→ Jika tidak: TIDAK boleh ambil
```

**Option B: Update otomatis**

```
Setiap 6 bulan:
  UPDATE kelas SET semester_ajaran = 2 WHERE id = 1

Tapi jadi CONFUSION:
  - Apakah semester berubah atau static?
  - Ketika admin buka kelas lama, berapa semester?
```

### 2. **Apakah perlu buat kelas baru setiap semester?**

**Scenario 1: Kelas Permanen**

```
Tahun 2022-2023:
  Kelas A → Semester 1 → Mahasiswa 2022
  Kelas A → Semester 2 → Mahasiswa 2022 (6 bulan kemudian)

Masalah: Kelas A dipakai 2x untuk semester berbeda
         Tapi di database hanya 1 record!
```

**Scenario 2: Kelas Baru Per Semester**

```
Tahun 2022-2023:
  Kelas A (Semester 1) → Mahasiswa 2022

Tahun 2023-2024:
  Kelas A (Semester 2) → Mahasiswa 2022

Masalah: Banyak record kelas, bingung mana yang aktif
```

---

## 🔄 WORKFLOW YANG BENAR

### **STRUKTUR DATABASE YANG TEPAT:**

Kelas seharusnya **tied to semester_ajaran**, bukan semester semesta:

```sql
-- Tabel kelas
CREATE TABLE kelas (
  id UUID PRIMARY KEY,
  nama_kelas VARCHAR,

  -- Menunjukkan PERIODE kelas ini berlaku
  semester_ajaran INTEGER,  -- 1, 2, 3, ...
  tahun_ajaran VARCHAR,     -- "2022/2023"

  -- Menunjukkan mahasiswa MINIMAL semester berapa
  min_semester INTEGER,     -- Minimum semester untuk bisa ambil kelas ini

  -- Target angkatan (jika ada)
  target_angkatan INTEGER,  -- 2022, 2023, 2024 (optional)

  dosen_id UUID,
  is_active BOOLEAN
);
```

---

## 📋 WORKFLOW YANG DIREKOMENDASIKAN

### **Scenario: Mahasiswa 2022 Semester Progression**

```
┌─────────────────────────────────────────────────────┐
│ Agustus 2022 - Semester 1                          │
├─────────────────────────────────────────────────────┤
│ Mahasiswa Registrasi: angkatan=2022, semester=1    │
│ Admin buat: Kelas A (s1, 2022/2023)               │
│ Mahasiswa enroll → Kelas A S1 2022/2023           │
└─────────────────────────────────────────────────────┘
                     ↓ (6 bulan)
┌─────────────────────────────────────────────────────┐
│ Februari 2023 - Semester 2                         │
├─────────────────────────────────────────────────────┤
│ Admin UPDATE mahasiswa: semester=2                 │
│ OPTION 1: Keep Kelas A, tapi add as "S2 2022/2023"│
│ OPTION 2: Create Kelas A S2, mahasiswa pindah     │
│                                                    │
│ Sistem HARUS smart:                               │
│ - Kelas mana yang applicable untuk semester 2?    │
│ - Kelas mana dari angkatan 2022?                  │
└─────────────────────────────────────────────────────┘
                     ↓ (6 bulan)
┌─────────────────────────────────────────────────────┐
│ Agustus 2023 - Semester 3                          │
├─────────────────────────────────────────────────────┤
│ Admin UPDATE mahasiswa: semester=3                 │
│ Continue pattern...                                │
└─────────────────────────────────────────────────────┘
```

---

## 🧪 PERTANYAAN UNTUK ANDA

Sebelum saya rekomendasikan solusi, tolong jawab:

### Q1: **Kelas apakah yang HARUS DIIKUTI mahasiswa?**

```
A) Mahasiswa harus ikut semua kelas sesuai semesternya
   Contoh: S1 → Kelas A S1
           S2 → Kelas A S2
           S3 → Kelas A S3

B) Mahasiswa ikut kelas SEKALI saja (permanen)
   Contoh: Kelas A S1 untuk semua angkatan 2022
           (tidak peduli mereka sudah S2 atau S3)

C) Kelas berbeda PER TAHUN AJARAN
   Contoh: 2022/2023 → Kelas A (S1-S8 semuanya)
           2023/2024 → Kelas B (S1-S8 semuanya)
```

### Q2: **Kapan Admin update semester mahasiswa?**

```
A) Manual: Admin dashboard ada tombol "update semester"
B) Otomatis: Sistem hitung: Jika (now - registration_date) >= 6 bulan
C) Tidak perlu: Biarkan mahasiswa update sendiri
```

### Q3: **Kapakah perlu buat kelas baru?**

```
A) Per semester (S1, S2, S3 punya kelas sendiri)
B) Per tahun ajaran (semua semester dalam 1 tahun ada di 1 kelas)
C) Tetap 1 kelas, tapi track semester dengan kelas_mahasiswa
```

---

## 💡 REKOMENDASI SEMENTARA

Hingga Anda jawab pertanyaan di atas, saya rekomendasikan:

### **APPROACH: Kelas Permanen, Tracker Semester**

```sql
-- Update: Kelas_mahasiswa track semester saat enroll
ALTER TABLE kelas_mahasiswa ADD COLUMN (
  semester_saat_enroll INTEGER,  -- Semester berapa saat mahasiswa enroll
  semester_terakhir INTEGER      -- Semester terakhir yang update
);

-- Admin UPDATE mahasiswa semester
UPDATE mahasiswa SET semester = 2 WHERE id = 'mhs-1';

-- Sistem automatically:
-- 1. Cek: Kelas mana yang cocok untuk semester 2 angkatan 2022?
-- 2. Suggest: "Mahasiswa naik ke S2, rekomendasikan Kelas..."
-- 3. Biarkan admin approve/revoke
```

---

## ✅ ACTION PLAN

1. **Clarify requirements** → Jawab 3 pertanyaan di atas
2. **Update schema** → Tambah field tracking semester
3. **Create migration** → Handle semester progression
4. **Update UI** → Admin ada fitur "Update Student Semester"
5. **Add logic** → System suggest kelas berdasarkan semester baru

**TUNGGU JAWABAN ANDA SEBELUM IMPLEMENT!** 🚀
