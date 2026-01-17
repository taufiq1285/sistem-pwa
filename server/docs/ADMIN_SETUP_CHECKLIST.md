# ✅ Admin Setup Checklist - Kehadiran System

## 📋 Sistem Workflow

```
Admin Setup:                         Dosen Setup:              Result:
├─ Input Mahasiswa          ├─ Buat Jadwal Praktikum    ├─ Input Kehadiran
├─ Buat Kelas              │  (Tanggal, Jam, Kelas)    └─ Generate Laporan
└─ Enroll Mahasiswa ke Kelas   └─ Auto-load Mahasiswa dari Enrollment
                                  (Sesuai kelas)
```

---

## 🎯 STEP-BY-STEP ADMIN SETUP

### STEP 1: INPUT MAHASISWA DATA
**File:** Admin → Users Management
**Location:** https://app/admin → Users

**Yang Harus Di-input:**
- [ ] Full Name (nama lengkap)
- [ ] Email
- [ ] NIM (nomor induk mahasiswa)
- [ ] Role: **Mahasiswa**
- [ ] Angkatan/PIN (untuk multi-angkatan differentiation)
  - 🔴 Pin Merah = Angkatan 2022
  - 🟡 Pin Kuning = Angkatan 2023
  - 🟢 Pin Hijau = Angkatan 2024

**Database table:** `mahasiswa`

**Current Implementation:** ✅ COMPLETE
- UsersPage.tsx LINE 472+ : mahasiswa input form
- Field validation
- Auto create user account
- Set mahasiswa role

### STEP 2: BUAT KELAS
**File:** Admin → Kelas Management
**Location:** https://app/admin → Kelas

**Yang Harus Di-input:**
- [ ] Nama Kelas (e.g., "Kelas A", "Kelas B")
- [ ] Kode Kelas
- [ ] Mata Kuliah (dropdown)
- [ ] Tahun Ajaran
- [ ] Semester

**Database table:** `kelas`

**Current Implementation:** ✅ COMPLETE
- KelasPage.tsx LINE 1-50 : kelas management
- Create, edit, delete kelas
- Show jadwal praktikum per kelas

### STEP 3: ENROLL MAHASISWA KE KELAS
**File:** Admin → Kelas → Select Kelas → Add Students
**Location:** https://app/admin → Kelas → (select kelas) → "Tambah Mahasiswa"

**Yang Harus Di-lakukan:**
- [ ] Pilih Kelas
- [ ] Klik "Tambah Mahasiswa"
- [ ] Pilih mahasiswa dari dropdown list
- [ ] Klik "Enroll"
- [ ] Repeat untuk semua mahasiswa di kelas

**Database table:** `nilai` or `kelas_mahasiswa`

**Current Implementation:** ✅ COMPLETE
- KelasPage.tsx LINE 200-260 : enrollment logic
- `enrollStudent()` function
- Dropdown list of available students
- Show enrolled students count

**Multi-Angkatan Support:**
✅ Kelas bisa mix dari 3 angkatan (pin merah/kuning/hijau)
✅ Auto-synced ke kehadiran system

### STEP 4: BUAT JADWAL PRAKTIKUM
**File:** Dosen → Jadwal Management
**Location:** https://app/dosen → Jadwal (Dosen buat jadwal karena yang tahu jadwal praktikumnya adalah Dosen)

**Yang Harus Di-input (oleh Dosen):**
- [ ] Pilih atau Buat Mata Kuliah
- [ ] Pilih atau Buat Kelas
- [ ] Tanggal Praktikum
- [ ] Jam Mulai
- [ ] Jam Selesai
- [ ] Laboratorium (if applicable)
- [ ] Topik (optional)
- [ ] Catatan (optional)

**Database table:** `jadwal_praktikum`

**Current Implementation:** ✅ COMPLETE (in JadwalPage.tsx - Dosen Page)
- LINE 368-399: Create jadwal handler
- Dosen bisa input/select mata_kuliah dan kelas
- Set tanggal, jam, laboratorium
- Jadwal otomatis ter-link dengan kelas yang dipilih

### STEP 5: DOSEN INPUT KEHADIRAN
**File:** Dosen → Kehadiran
**Location:** https://app/dosen → Kehadiran

**Flow:**
1. [ ] Pilih Jadwal Praktikum
2. [ ] System auto-load mahasiswa dari kelas enrollment
3. [ ] Input status per mahasiswa (hadir/izin/sakit/alpha)
4. [ ] Input keterangan (optional)
5. [ ] Klik "Simpan"

**Database table:** `kehadiran`

**Current Implementation:** ✅ COMPLETE
- KehadiranPage.tsx LINE 205-250
- Auto-load mahasiswa dari enrollment
- Status input per student
- Bulk save

---

## 📊 Data Flow Diagram

```
ADMIN SIDE (Setup Data):
┌─────────────────────┐
│ 1. Create User      │
│ (Users page)        │
│ Role: Mahasiswa     │
│ NIM, Angkatan       │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ 2. Create Kelas     │
│ (Kelas page)        │
│ Nama, Mata Kuliah   │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ 3. Enroll Student   │
│ (Kelas > Students)  │
│ Select Mhs → Add    │
└──────────┬──────────┘
           ↓
    DOSEN SIDE (Create Schedule):
    ┌──────────────────────┐
    │ 4. Create Jadwal     │
    │ (JadwalPage - Dosen) │
    │ Kelas + Tanggal +    │
    │ Jam + Laboratorium   │
    └──────────┬───────────┘
               ↓
    ┌──────────────────────┐
    │ 5. Input Kehadiran   │
    │ (KehadiranPage)      │
    │ Select Jadwal        │
    │ Auto-load Mahasiswa  │
    │ Input Status (Hadir) │
    └──────────┬───────────┘
               ↓
    ┌──────────────────────┐
    │ 6. View Report       │
    │ (Kehadiran report)   │
    │ Per jadwal/tanggal   │
    └──────────────────────┘
```

---

## ✅ VERIFICATION CHECKLIST

### Admin Portal (Setup Data)
- [ ] Users page exists and can add mahasiswa
- [ ] Kelas page exists and can create kelas
- [ ] Can enroll mahasiswa to kelas
- [ ] Multi-angkatan differentiation visible

### Dosen Portal (Create & Input)
- [ ] Jadwal page shows create form
- [ ] Dosen can select/create mata kuliah
- [ ] Dosen can select/create kelas
- [ ] Dosen can set tanggal, jam, laboratorium
- [ ] Kehadiran page shows jadwal dropdown (filtered by dosen)
- [ ] Mahasiswa list auto-loads from enrollment
- [ ] Status input works (hadir/izin/sakit/alpha)
- [ ] Save button stores data correctly

### Database
- [ ] Mahasiswa table has: id, nim, angkatan, user_id
- [ ] Kelas table has: id, nama_kelas, mata_kuliah_id
- [ ] Enrollment table (nilai/kelas_mahasiswa): mahasiswa_id, kelas_id, is_active
- [ ] Jadwal table has: id, kelas_id, tanggal_praktikum, dosen_id
- [ ] Kehadiran table has: id, jadwal_id, mahasiswa_id, status

---

## 🔍 Testing Guide

### Test Scenario 1: Single Angkatan
1. Admin create 5 mahasiswa (all angkatan 2024)
2. Admin create 1 kelas
3. Admin enroll 5 mahasiswa ke kelas
4. **Dosen** create jadwal untuk kelas (tanggal & jam praktikum)
5. Dosen select jadwal di Kehadiran page
6. Verify: 5 mahasiswa appear in list (auto-loaded from enrollment)
7. Dosen input status untuk semua (hadir/izin/sakit/alpha)
8. Save dan verify data terstore di database

### Test Scenario 2: Multi-Angkatan (3 pin)
1. Admin create 15 mahasiswa:
   - 5x Angkatan 2022 (Pin Merah)
   - 5x Angkatan 2023 (Pin Kuning)
   - 5x Angkatan 2024 (Pin Hijau)
2. Admin create 3 kelas
3. Admin create enrollment:
   - Kelas A: 3 merah + 2 kuning
   - Kelas B: 3 kuning + 2 hijau
   - Kelas C: 2 merah + 3 hijau
4. **Dosen** create jadwal for each kelas
5. Dosen input kehadiran for each jadwal
6. Verify:
   - Kelas A shows correct 5 students (mix: 3 merah + 2 kuning)
   - Kelas B shows correct 5 students (mix: 3 kuning + 2 hijau)
   - Kelas C shows correct 5 students (mix: 2 merah + 3 hijau)
7. Check report menunjukkan angkatan differentiation (if UI supports)

### Test Scenario 3: Multi-Dosen, Multi-Kelas
1. Admin create 2 dosen
2. Admin create 3 kelas
3. Assign kelas to dosen:
   - Dosen 1: Kelas A, B
   - Dosen 2: Kelas C
4. Admin create jadwal for each kelas
5. Test:
   - Dosen 1 sees only Kelas A, B jadwal
   - Dosen 2 sees only Kelas C jadwal
   - Each dosen inputs kehadiran untuk their classes only

---

## 📝 Notes

### Angkatan/PIN System
The PIN colors (merah/kuning/hijau) adalah visual indicator untuk angkatan:
- Not hardcoded as enum
- Bisa custom set saat create mahasiswa
- Or auto-generated based on enrollment logic
- UI bisa menambahkan color badge next to nama

### Enrollment vs Kelas
- Mahasiswa harus di-enroll ke kelas untuk muncul di kehadiran
- Un-enrolling mahasiswa dari kelas = remove dari kehadiran untuk jadwal kelas itu
- Multiple enrollment supported (mahasiswa bisa di multiple kelas)

### Missing Features (Optional Enhancements)
- Bulk upload mahasiswa (CSV)
- Bulk enroll students to class (CSV)
- Angkatan/PIN color visualization
- Export kehadiran to Excel/PDF
- Automatic absen marking after jadwal time

---

## 🚀 Ready to Go!

Semua infrastructure sudah siap untuk:
✅ Multi-angkatan support
✅ Per-kelas differentiation
✅ Dosen input kehadiran
✅ Auto mahasiswa list from enrollment
✅ Role-based access control

Admin hanya perlu:
1. Input mahasiswa data
2. Create kelas
3. Enroll students
4. Create jadwal praktikum
5. Let dosen input kehadiran!
