# 📋 Kehadiran & Jadwal Workflow - Clarification

## ✅ Correct Workflow

### **ADMIN** (Setup Data)
```
1. Input Mahasiswa (dengan angkatan pin merah/kuning/hijau)
2. Buat Kelas (Kelas A, B, C, etc.)
3. Enroll Mahasiswa ke Kelas (melalui nilai table)
   → Sekarang setiap kelas punya mahasiswa dengan enrollment berbeda
   → Multi-angkatan support: 1 kelas bisa mix 3 angkatan
```

### **DOSEN** (Create Jadwal Praktikum)
```
4. Buat Jadwal Praktikum di JadwalPage (Dosen yang tahu jadwalnya!)
   ├─ Input/Select Mata Kuliah
   ├─ Input/Select Kelas
   ├─ Set Tanggal Praktikum
   ├─ Set Jam Mulai & Jam Selesai
   ├─ Select Laboratorium
   └─ Save → Jadwal otomatis ter-link dengan kelas

5. Input Kehadiran di KehadiranPage
   ├─ Select Jadwal Praktikum (dropdown, filtered by dosen)
   ├─ Sistem auto-load Mahasiswa dari Enrollment
   │  (Hanya mahasiswa yang enrolled ke kelas itu)
   ├─ Input Status per Mahasiswa (Hadir/Izin/Sakit/Alpha)
   └─ Save → Data tersimpan di database
```

---

## 📊 Data Flow

```
ADMIN INPUT:
┌─────────────┐     ┌─────────┐     ┌──────────────┐
│ Mahasiswa   │ --> │ Kelas   │ --> │ Enrollment   │
│ (NIM)       │     │ (Nama)  │     │ (Nilai table)│
│ (Angkatan)  │     │ (MK)    │     │ (Aktif)      │
└─────────────┘     └─────────┘     └──────────────┘
                           ↓
                    DOSEN CREATES
                    ┌─────────────────┐
                    │ Jadwal Praktikum│
                    │ (Tanggal, Jam)  │
                    │ (Laboratorium)  │
                    └────────┬────────┘
                             ↓
                    DOSEN INPUTS
                    ┌──────────────────┐
                    │ Kehadiran        │
                    │ (Jadwal selected)│
                    │ (Auto-load Mhs)  │
                    │ (Status per Mhs) │
                    └──────────────────┘
```

---

## 🔑 Key Points

### **Why DOSEN Creates Jadwal?**
- ✅ **Dosen** tahu kapan dan jam praktikumnya
- ✅ **Dosen** tahu laboratorium mana yang digunakan
- ✅ **Dosen** tahu topik apa yang diajarkan
- ❌ Admin tidak tahu semua itu, hanya setup data awal

### **Multi-Angkatan Support**
- 1 Kelas bisa mix dari 3 angkatan (merah/kuning/hijau)
- Enrollment di-manage per kelas (bukan per angkatan)
- Saat Dosen select Jadwal → Sistem auto-load mahasiswa dari enrollment
- Hasilnya: Otomatis muncul mahasiswa yang sudah di-enroll ke kelas itu

### **Example: Kelas A Mixed Angkatan**
```
Kelas A: Praktikum Kebidanan
├─ Student A (2022 - Pin Merah) → Enrolled ke Kelas A
├─ Student B (2022 - Pin Merah) → Enrolled ke Kelas A
├─ Student C (2023 - Pin Kuning) → Enrolled ke Kelas A
├─ Student D (2023 - Pin Kuning) → Enrolled ke Kelas A
└─ Student E (2024 - Pin Hijau) → Enrolled ke Kelas A

Dosen create Jadwal for Kelas A on 2024-11-27 09:00
↓
Dosen input Kehadiran select Jadwal (2024-11-27 Praktikum Kebidanan)
↓
System auto-load: 5 Students (Student A, B, C, D, E - sesuai enrollment)
↓
Dosen input status per student → Saved
```

---

## 📱 File Locations

| Component | File | Role |
|-----------|------|------|
| **Admin Setup** | `src/pages/admin/UsersPage.tsx` | Create mahasiswa |
| | `src/pages/admin/KelasPage.tsx` | Create kelas & manage enrollment |
| **Dosen Jadwal** | `src/pages/dosen/JadwalPage.tsx` | Create jadwal praktikum |
| **Dosen Kehadiran** | `src/pages/dosen/KehadiranPage.tsx` | Input kehadiran |
| **API** | `src/lib/api/jadwal.api.ts` | Jadwal CRUD functions |
| | `src/lib/api/kehadiran.api.ts` | Kehadiran CRUD functions |

---

## ✨ Why This Design is Better

| Aspect | Before | After |
|--------|--------|-------|
| **Jadwal Creator** | ❌ Admin (doesn't know schedule) | ✅ Dosen (knows schedule) |
| **Data Freshness** | ❌ Static, admin must update | ✅ Dynamic, dosen updates each semester |
| **Flexibility** | ❌ Changes need admin | ✅ Dosen can modify anytime |
| **Multi-Angkatan** | ❌ Unclear who manages | ✅ Clear: enrollment = admin, jadwal = dosen |

---

## ✅ System Status

- ✅ Admin can input mahasiswa & enroll to kelas
- ✅ Dosen can create jadwal for their classes
- ✅ Dosen can input kehadiran with auto-loaded mahasiswa
- ✅ Multi-angkatan fully supported per kelas
- ✅ All code implemented in respective pages

**No code changes needed!** System is already designed correctly.
