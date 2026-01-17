# 🏥 Audit Business Logic - Sistem Praktikum Kebidanan
## Akademi Kebidanan Mega Buana

**Metode**: Research and Development (RnD)
**Platform**: Progressive Web Application (PWA)
**Domain**: Praktikum Kebidanan & Kesehatan

---

## 📋 Table of Contents

1. [Domain Context](#domain-context)
2. [User Roles & Responsibilities](#user-roles--responsibilities)
3. [Core Business Flows](#core-business-flows)
4. [Permission Matrix](#permission-matrix)
5. [Critical Business Rules](#critical-business-rules)
6. [Data Integrity Checks](#data-integrity-checks)
7. [Issues & Recommendations](#issues--recommendations)

---

## 🏥 Domain Context

### Akademi Kebidanan - Karakteristik Khusus:

**Praktikum Kebidanan** berbeda dengan praktikum IT/teknik karena:

1. **Medical/Health Domain**
   - Praktik langsung dengan pasien simulasi/manikin
   - Standar keamanan dan hygiene tinggi
   - Protokol medis yang ketat
   - Inventaris alat medis (bukan alat elektronik)

2. **Kompetensi Yang Dinilai**
   - Keterampilan teknis (skill practice)
   - Keterampilan komunikasi (patient care)
   - Kecepatan dan ketepatan (emergency response)
   - Etika profesi

3. **Alat Praktikum Khusus**
   - Phantom/Manikin bayi dan ibu
   - Alat kebersihan steril
   - Peralatan persalinan
   - Alat pemeriksaan kehamilan
   - Instrumen medis

4. **Mata Kuliah Praktikum Kebidanan**
   - Asuhan Kebidanan Kehamilan
   - Asuhan Kebidanan Persalinan
   - Asuhan Kebidanan Nifas
   - Asuhan Bayi Baru Lahir
   - Keluarga Berencana
   - Patologi Kebidanan
   - dll.

---

## 👥 User Roles & Responsibilities

### 1. **Mahasiswa Kebidanan** 🎓
**Primary Users** - Calon Bidan

**Responsibilities**:
- Mengikuti jadwal praktikum
- Mencatat kehadiran
- Mengerjakan kuis/ujian praktikum
- Melihat nilai praktikum
- Mengakses materi pembelajaran

**Permissions**:
- ✅ View jadwal praktikum mereka
- ✅ View materi praktikum
- ✅ Submit kuis praktikum
- ✅ View nilai mereka sendiri
- ✅ Submit kehadiran (check-in)
- ❌ Edit nilai
- ❌ Edit jadwal
- ❌ Manage inventaris

---

### 2. **Dosen Kebidanan** 👨‍⚕️👩‍⚕️
**Pengajar & Pembimbing Praktikum**

**Responsibilities**:
- Mengajar praktikum
- Menilai keterampilan mahasiswa
- Upload materi praktikum
- Manage jadwal praktikum
- Verifikasi kehadiran
- Meminjam alat praktikum untuk kelas

**Permissions**:
- ✅ Create/Edit jadwal praktikum
- ✅ Upload materi
- ✅ Input nilai mahasiswa
- ✅ View kehadiran mahasiswa
- ✅ Create kuis praktikum
- ✅ Request peminjaman alat
- ✅ View inventaris alat
- ❌ Approve peminjaman (tugas laboran)
- ❌ Manage inventaris (tugas laboran)

---

### 3. **Laboran** 🔬
**Pengelola Laboratorium Praktikum**

**Responsibilities**:
- Manage inventaris alat praktikum
- Approve/reject peminjaman alat
- Maintain kondisi alat
- Monitoring stok alat
- Generate laporan inventaris
- Ensure ketersediaan alat untuk praktikum

**Permissions**:
- ✅ Full CRUD inventaris
- ✅ Approve/reject peminjaman
- ✅ View semua peminjaman
- ✅ Create laporan inventaris
- ✅ Monitor stok alat
- ❌ Input nilai mahasiswa
- ❌ Manage jadwal praktikum

---

### 4. **Admin** 👨‍💼
**System Administrator**

**Responsibilities**:
- Manage users (mahasiswa, dosen, laboran)
- System configuration
- Generate analytics
- System monitoring
- Backup & maintenance

**Permissions**:
- ✅ Full access to all features
- ✅ User management
- ✅ System settings
- ✅ View all analytics
- ✅ System maintenance

---

## 🔄 Core Business Flows

### Flow 1: Praktikum Lifecycle

```
[PLANNING PHASE]
1. Admin creates Mata Kuliah Praktikum
2. Dosen creates Kelas for semester
3. Mahasiswa enrolls to Kelas
4. Dosen creates Jadwal Praktikum

[PREPARATION PHASE]
5. Dosen uploads Materi Praktikum
6. Dosen requests alat praktikum (Peminjaman)
7. Laboran approves peminjaman
8. Laboran prepares alat

[EXECUTION PHASE]
9. Mahasiswa attends praktikum (Kehadiran)
10. Dosen verifies kehadiran
11. Mahasiswa practices skills
12. Dosen observes & assesses

[ASSESSMENT PHASE]
13. Mahasiswa completes Kuis Praktikum (if any)
14. Dosen inputs Nilai Praktikum
15. Mahasiswa views nilai

[CLOSING PHASE]
16. Alat dikembalikan
17. Laboran checks kondisi alat
18. Laboran updates inventaris
```

---

### Flow 2: Peminjaman Alat Praktikum

```
[REQUEST]
Dosen → Request Peminjaman
   ↓
   Fields:
   - Inventaris (alat apa)
   - Jumlah
   - Tanggal pinjam
   - Tanggal rencana kembali
   - Keperluan (untuk praktikum apa)
   - Status: PENDING

[APPROVAL]
Laboran → View Pending Requests
   ↓
   Check:
   - Ketersediaan alat
   - Kondisi alat
   - Jadwal konflik
   ↓
   Decision:
   - APPROVE: Status → DISETUJUI
   - REJECT: Status → DITOLAK (+ alasan)

[USAGE]
Alat DISETUJUI → Status → DIPINJAM
   ↓
   Dosen uses alat untuk praktikum

[RETURN]
Dosen returns alat
   ↓
   Laboran verifies kondisi
   ↓
   Status → DIKEMBALIKAN
   ↓
   Update tanggal_kembali_aktual
   ↓
   Update inventaris (jumlah_tersedia)
```

---

### Flow 3: Penilaian Praktikum

```
[COMPONENTS OF NILAI PRAKTIKUM]

1. Nilai Kehadiran (20%)
   - Hadir tepat waktu
   - Partisipasi aktif

2. Nilai Keterampilan (40%)
   - Teknik yang benar
   - Kecepatan
   - Ketepatan
   - Profesionalisme

3. Nilai Kuis/Ujian (40%)
   - Teori praktikum
   - Case study
   - Multiple choice / Essay

[CALCULATION]
Nilai Akhir = (Kehadiran × 0.2) + (Keterampilan × 0.4) + (Kuis × 0.4)

[GRADING]
A: 85-100
B: 70-84
C: 60-69
D: 50-59
E: <50
```

---

## 🔐 Permission Matrix

### Create (C)
| Entity | Mahasiswa | Dosen | Laboran | Admin |
|--------|-----------|-------|---------|-------|
| Mata Kuliah | ❌ | ❌ | ❌ | ✅ |
| Kelas | ❌ | ✅ | ❌ | ✅ |
| Jadwal Praktikum | ❌ | ✅ | ❌ | ✅ |
| Materi | ❌ | ✅ | ❌ | ✅ |
| Kuis | ❌ | ✅ | ❌ | ✅ |
| Nilai | ❌ | ✅ | ❌ | ✅ |
| Kehadiran | ✅ (self) | ✅ | ❌ | ✅ |
| Inventaris | ❌ | ❌ | ✅ | ✅ |
| Peminjaman | ❌ | ✅ | ❌ | ✅ |
| Users | ❌ | ❌ | ❌ | ✅ |

### Read (R)
| Entity | Mahasiswa | Dosen | Laboran | Admin |
|--------|-----------|-------|---------|-------|
| Mata Kuliah | ✅ (enrolled) | ✅ (teaching) | ✅ | ✅ |
| Kelas | ✅ (enrolled) | ✅ (teaching) | ✅ | ✅ |
| Jadwal | ✅ (own) | ✅ (teaching) | ✅ | ✅ |
| Materi | ✅ (enrolled) | ✅ (teaching) | ❌ | ✅ |
| Kuis | ✅ (enrolled) | ✅ (created) | ❌ | ✅ |
| Nilai | ✅ (own) | ✅ (teaching) | ❌ | ✅ |
| Kehadiran | ✅ (own) | ✅ (teaching) | ❌ | ✅ |
| Inventaris | ❌ | ✅ (view) | ✅ | ✅ |
| Peminjaman | ❌ | ✅ (own) | ✅ | ✅ |
| Users | ❌ | ❌ | ❌ | ✅ |

### Update (U)
| Entity | Mahasiswa | Dosen | Laboran | Admin |
|--------|-----------|-------|---------|-------|
| Mata Kuliah | ❌ | ❌ | ❌ | ✅ |
| Kelas | ❌ | ✅ (own) | ❌ | ✅ |
| Jadwal | ❌ | ✅ (own) | ❌ | ✅ |
| Materi | ❌ | ✅ (own) | ❌ | ✅ |
| Kuis | ❌ | ✅ (own) | ❌ | ✅ |
| Nilai | ❌ | ✅ (teaching) | ❌ | ✅ |
| Kehadiran | ❌ | ✅ (verify) | ❌ | ✅ |
| Inventaris | ❌ | ❌ | ✅ | ✅ |
| Peminjaman | ❌ | ✅ (own) | ✅ (approve) | ✅ |
| Users | ❌ | ❌ | ❌ | ✅ |

### Delete (D)
| Entity | Mahasiswa | Dosen | Laboran | Admin |
|--------|-----------|-------|---------|-------|
| Mata Kuliah | ❌ | ❌ | ❌ | ✅ |
| Kelas | ❌ | ⚠️ (soft) | ❌ | ✅ |
| Jadwal | ❌ | ⚠️ (before) | ❌ | ✅ |
| Materi | ❌ | ✅ (own) | ❌ | ✅ |
| Kuis | ❌ | ⚠️ (no attempts) | ❌ | ✅ |
| Nilai | ❌ | ❌ | ❌ | ✅ |
| Kehadiran | ❌ | ❌ | ❌ | ✅ |
| Inventaris | ❌ | ❌ | ⚠️ (soft) | ✅ |
| Peminjaman | ❌ | ⚠️ (pending) | ❌ | ✅ |
| Users | ❌ | ❌ | ❌ | ✅ |

**Legend**:
- ✅ Allowed
- ❌ Denied
- ⚠️ Conditional (dengan syarat tertentu)

---

## ⚠️ Critical Business Rules

### 1. Enrollment Rules
```
✅ Mahasiswa hanya bisa enroll ke kelas yang:
   - Sesuai dengan semester mereka
   - Mata kuliah belum diambil (atau mengulang)
   - Kapasitas kelas belum penuh
   - Jadwal tidak bentrok

❌ Mahasiswa tidak boleh:
   - Enroll ke kelas yang sudah dimulai (lewat dari minggu 2)
   - Enroll ke kelas yang sudah penuh
   - Enroll duplikat
```

### 2. Jadwal Praktikum Rules
```
✅ Jadwal praktikum harus:
   - Tanggal >= hari ini (tidak boleh masa lalu)
   - Jam mulai < jam selesai
   - Durasi minimal 1 jam, maksimal 8 jam
   - Lab tersedia (tidak double booking)
   - Alat tersedia

❌ Tidak boleh:
   - Jadwal overlap di lab yang sama
   - Jadwal di hari libur (optional validation)
   - Jadwal tanpa dosen pengampu
```

### 3. Kehadiran Rules
```
✅ Mahasiswa bisa hadir jika:
   - Enrolled di kelas tersebut
   - Jadwal praktikum hari ini
   - Dalam rentang waktu toleransi (30 menit sebelum - 30 menit setelah)
   - Belum submit kehadiran sebelumnya

❌ Mahasiswa tidak bisa:
   - Submit kehadiran untuk orang lain
   - Submit multiple times untuk sesi yang sama
   - Submit jika terlambat > toleransi
```

### 4. Penilaian Rules
```
✅ Dosen bisa input nilai jika:
   - Mahasiswa enrolled di kelas yang diajar
   - Praktikum sudah dilaksanakan
   - Dosen adalah pengampu kelas

❌ Nilai tidak boleh:
   - < 0 atau > 100
   - Diubah setelah finalized (kecuali admin)
   - Diedit oleh mahasiswa
```

### 5. Peminjaman Alat Rules
```
✅ Peminjaman valid jika:
   - Jumlah <= jumlah tersedia
   - Tanggal pinjam >= hari ini
   - Tanggal kembali > tanggal pinjam
   - Alat tidak rusak/maintenance

❌ Peminjaman ditolak jika:
   - Stok tidak cukup
   - Dosen punya peminjaman overdue
   - Alat sedang maintenance
```

### 6. Kuis Praktikum Rules
```
✅ Mahasiswa bisa mengerjakan jika:
   - Enrolled di kelas
   - Dalam rentang waktu kuis (tanggal_mulai - tanggal_selesai)
   - Belum exceed max attempts
   - Status kuis: published

❌ Mahasiswa tidak bisa:
   - Mengerjakan jika waktu habis
   - Mengerjakan kuis draft
   - Melihat jawaban kuis
   - Edit attempt yang sudah submitted
```

---

## 🔍 Data Integrity Checks

### 1. Referential Integrity

**Foreign Keys Must Exist**:
```sql
-- Kelas must have valid mata_kuliah_id
CHECK: mata_kuliah_id EXISTS IN mata_kuliah

-- Jadwal must have valid kelas_id, lab_id
CHECK: kelas_id EXISTS IN kelas
CHECK: lab_id EXISTS IN laboratorium

-- Nilai must have valid mahasiswa_id, mata_kuliah_id
CHECK: mahasiswa_id EXISTS IN mahasiswa
CHECK: mata_kuliah_id EXISTS IN mata_kuliah

-- Peminjaman must have valid inventaris_id, dosen_id
CHECK: inventaris_id EXISTS IN inventaris
CHECK: dosen_id EXISTS IN dosen
```

### 2. Business Logic Constraints

**Kapasitas**:
```sql
-- Jumlah mahasiswa di kelas <= kapasitas_maksimal
CHECK: (SELECT COUNT(*) FROM kelas_mahasiswa WHERE kelas_id = X)
       <=
       (SELECT kapasitas_maksimal FROM kelas WHERE id = X)
```

**Stok Inventaris**:
```sql
-- Jumlah peminjaman tidak boleh > jumlah tersedia
CHECK: jumlah_pinjam <= (SELECT jumlah_tersedia FROM inventaris WHERE id = X)

-- Jumlah tersedia tidak boleh negatif
CHECK: jumlah_tersedia >= 0
```

**Jadwal Overlap**:
```sql
-- Tidak boleh ada jadwal yang overlap di lab yang sama
CHECK: NOT EXISTS (
  SELECT 1 FROM jadwal_praktikum
  WHERE lab_id = X
  AND tanggal_praktikum = Y
  AND (
    (jam_mulai, jam_selesai) OVERLAPS (new_jam_mulai, new_jam_selesai)
  )
)
```

### 3. Status Transitions

**Peminjaman Status Flow**:
```
PENDING → DISETUJUI (laboran approve)
PENDING → DITOLAK (laboran reject)
DISETUJUI → DIPINJAM (alat diambil)
DIPINJAM → DIKEMBALIKAN (alat dikembalikan)

❌ Invalid transitions:
- DITOLAK → DISETUJUI
- DIKEMBALIKAN → DIPINJAM
- PENDING → DIKEMBALIKAN
```

**Kuis Status Flow**:
```
DRAFT → PUBLISHED (dosen publish)
PUBLISHED → CLOSED (waktu habis atau dosen close)

❌ Invalid transitions:
- PUBLISHED → DRAFT
- CLOSED → PUBLISHED
```

---

## ⚠️ Issues & Recommendations

### 🔴 CRITICAL ISSUES

#### 1. **Missing Validation: Kapasitas Kelas**
**Current**: Tidak ada check kapasitas saat enrollment
**Risk**: Kelas overload, lab terlalu penuh
**Fix Required**:
```typescript
// Before enrollment
const currentEnrollment = await getKelasEnrollmentCount(kelasId);
const kelasCapacity = await getKelasCapacity(kelasId);

if (currentEnrollment >= kelasCapacity) {
  throw new Error('Kelas sudah penuh');
}
```

#### 2. **Missing: Jadwal Conflict Detection**
**Current**: Bisa create jadwal overlap di lab yang sama
**Risk**: Double booking lab
**Fix Required**:
```typescript
// Before creating jadwal
const overlaps = await checkJadwalOverlap({
  lab_id,
  tanggal,
  jam_mulai,
  jam_selesai
});

if (overlaps) {
  throw new Error('Lab sudah digunakan di waktu tersebut');
}
```

#### 3. **Missing: Stok Validation saat Peminjaman**
**Current**: Bisa request > stok tersedia
**Risk**: Stok negatif, data inconsistent
**Fix Required**:
```typescript
// Before approve peminjaman
const available = await getAvailableStock(inventaris_id);

if (jumlah_pinjam > available) {
  throw new Error('Stok tidak cukup');
}
```

---

### 🟡 MEDIUM PRIORITY

#### 4. **Incomplete: Nilai Calculation Logic**
**Current**: Manual input nilai akhir
**Better**: Auto-calculate dari komponen
**Recommendation**:
```typescript
interface NilaiComponents {
  nilai_kehadiran: number;  // 20%
  nilai_keterampilan: number; // 40%
  nilai_kuis: number; // 40%
}

function calculateNilaiAkhir(components: NilaiComponents): number {
  return (
    components.nilai_kehadiran * 0.2 +
    components.nilai_keterampilan * 0.4 +
    components.nilai_kuis * 0.4
  );
}
```

#### 5. **Missing: Attendance Time Window**
**Current**: Bisa submit kehadiran kapan saja
**Better**: Enforce time window
**Recommendation**:
```typescript
const TOLERANCE_BEFORE = 30; // minutes
const TOLERANCE_AFTER = 30; // minutes

function canSubmitAttendance(jadwalTime: Date): boolean {
  const now = new Date();
  const startWindow = new Date(jadwalTime.getTime() - TOLERANCE_BEFORE * 60000);
  const endWindow = new Date(jadwalTime.getTime() + TOLERANCE_AFTER * 60000);

  return now >= startWindow && now <= endWindow;
}
```

#### 6. **Missing: Peminjaman Overdue Tracking**
**Current**: Tidak ada tracking alat yang terlambat dikembalikan
**Better**: Track dan notifikasi overdue
**Recommendation**:
```sql
-- Query overdue peminjaman
SELECT * FROM peminjaman
WHERE status = 'DIPINJAM'
AND tanggal_kembali_rencana < CURRENT_DATE;
```

---

### 🟢 LOW PRIORITY (Nice to Have)

#### 7. **Enhancement: Semester Auto-Detection**
Calculate current semester based on date

#### 8. **Enhancement: Email Notifications**
- Peminjaman approved/rejected
- Kuis deadline reminder
- Nilai published

#### 9. **Enhancement: Reporting**
- Attendance report
- Grade report
- Inventory usage report

---

## ✅ Validation Checklist

Before going to testing, ensure:

### Core Functionality:
- [ ] Mahasiswa can enroll to kelas
- [ ] Mahasiswa can view jadwal praktikum
- [ ] Mahasiswa can submit kehadiran
- [ ] Mahasiswa can take kuis
- [ ] Mahasiswa can view nilai

### Dosen Functionality:
- [ ] Dosen can create jadwal
- [ ] Dosen can upload materi
- [ ] Dosen can input nilai
- [ ] Dosen can request peminjaman alat
- [ ] Dosen can create kuis

### Laboran Functionality:
- [ ] Laboran can manage inventaris
- [ ] Laboran can approve/reject peminjaman
- [ ] Laboran can view reports

### Admin Functionality:
- [ ] Admin can manage users
- [ ] Admin can view analytics
- [ ] Admin can manage all data

### Business Rules:
- [ ] Kapasitas kelas enforced
- [ ] Jadwal conflict detection
- [ ] Stok validation
- [ ] Time window for kehadiran
- [ ] Proper status transitions

### Data Integrity:
- [ ] Foreign keys validated
- [ ] No negative stocks
- [ ] No nilai > 100 or < 0
- [ ] Proper cascading deletes

---

## 📊 Next Steps

1. **Review This Audit** dengan tim
2. **Fix Critical Issues** (Red items)
3. **Implement Missing Validations**
4. **Create Test Cases** based on business rules
5. **Run Black Box Testing**
6. **Run White Box Testing**
7. **Document Final Logic**

---

**Document Version**: 1.0
**Last Updated**: 2025-01-01
**Status**: Ready for Review & Testing
