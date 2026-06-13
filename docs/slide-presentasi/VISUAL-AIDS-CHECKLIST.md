# CHECKLIST VISUAL AIDS PRESENTASI SIDANG

## Screenshot yang Perlu Diambil

### 1. Halaman Auth
- [ ] Login page dengan branding AKBID Mega Buana
- [ ] Register page
- [ ] Forgot password page

**Route:** `/login`, `/register`, `/forgot-password`
**File:** [src/pages/auth/](src/pages/auth/)

---

### 2. Dashboard Admin
**Route:** `/admin/dashboard`
**File:** [src/pages/admin/DashboardPage.tsx](src/pages/admin/DashboardPage.tsx)

Screenshot yang diperlukan:
- [ ] Overview dengan statistik (Total Users, Mahasiswa %, Dosen, Labs, Equipment)
- [ ] Charts (User Growth, Distribution, Lab Usage)
- [ ] Quick actions panel
- [ ] Recent users list
- [ ] Recent announcements

---

### 3. Dashboard Dosen
**Route:** `/dosen/dashboard`
**File:** [src/pages/dosen/DashboardPage.tsx](src/pages/dosen/DashboardPage.tsx)

Screenshot yang diperlukan:
- [ ] Active Classes card
- [ ] Upcoming Practicum card
- [ ] Quick actions
- [ ] Recent materials
- [ ] Logbook review pending

---

### 4. Dashboard Mahasiswa
**Route:** `/mahasiswa/dashboard`
**File:** [src/pages/mahasiswa/DashboardPage.tsx](src/pages/mahasiswa/DashboardPage.tsx)

Screenshot yang diperlukan:
- [ ] Welcome banner
- [ ] Quick stats (Total Classes, Practicum Today, This Week)
- [ ] My Classes list
- [ ] Upcoming schedule

---

### 5. Dashboard Laboran
**Route:** `/laboran/dashboard`
**File:** [src/pages/laboran/DashboardPage.tsx](src/pages/laboran/DashboardPage.tsx)

Screenshot yang diperlukan:
- [ ] Stats (Total Lab, Equipment, Pending Approvals, Low Stock)
- [ ] Pending peminjaman dengan approve/reject
- [ ] Inventory alerts
- [ ] Lab schedule

---

### 6. Fitur Kuis

**Dosen Side:**
- [ ] Kuis List Page ([src/pages/dosen/kuis/KuisListPage.tsx](src/pages/dosen/kuis/KuisListPage.tsx))
- [ ] Kuis Create Page ([src/pages/dosen/kuis/KuisCreatePage.tsx](src/pages/dosen/kuis/KuisCreatePage.tsx))
- [ ] Kuis Edit Page ([src/pages/dosen/kuis/KuisEditPage.tsx](src/pages/dosen/kuis/KuisEditPage.tsx))
- [ ] Kuis Results Page ([src/pages/dosen/kuis/KuisResultsPage.tsx](src/pages/dosen/kuis/KuisResultsPage.tsx))

**Mahasiswa Side:**
- [ ] Kuis List Page ([src/pages/mahasiswa/kuis/KuisListPage.tsx](src/pages/mahasiswa/kuis/KuisListPage.tsx))
- [ ] Kuis Attempt Page ([src/pages/mahasiswa/kuis/KuisAttemptPage.tsx](src/pages/mahasiswa/kuis/KuisAttemptPage.tsx))
- [ ] Kuis Result Page ([src/pages/mahasiswa/kuis/KuisResultPage.tsx](src/pages/mahasiswa/kuis/KuisResultPage.tsx))

---

### 7. Fitur Jadwal Praktikum
- [ ] Jadwal Page Dosen ([src/pages/dosen/JadwalPage.tsx](src/pages/dosen/JadwalPage.tsx))
- [ ] Jadwal Page Mahasiswa ([src/pages/mahasiswa/JadwalPage.tsx](src/pages/mahasiswa/JadwalPage.tsx))
- [ ] Jadwal Page Laboran ([src/pages/laboran/JadwalApprovalPage.tsx](src/pages/laboran/JadwalApprovalPage.tsx))

---

### 8. Fitur Logbook
- [ ] Logbook Page Mahasiswa ([src/pages/mahasiswa/LogbookPage.tsx](src/pages/mahasiswa/LogbookPage.tsx))
- [ ] Logbook Review Page Dosen ([src/pages/dosen/LogbookReviewPage.tsx](src/pages/dosen/LogbookReviewPage.tsx))

---

### 9. Fitur Peminjaman
- [ ] Peminjaman Approval Admin ([src/pages/admin/PeminjamanApprovalPage.tsx](src/pages/admin/PeminjamanApprovalPage.tsx))
- [ ] Persetujuan Page Laboran ([src/pages/laboran/PersetujuanPage.tsx](src/pages/laboran/PersetujuanPage.tsx))
- [ ] Peminjaman Aktif Laboran ([src/pages/laboran/PeminjamanAktifPage.tsx](src/pages/laboran/PeminjamanAktifPage.tsx))

---

### 10. Fitur PWA

Screenshot yang diperlukan:
- [ ] Offline banner/indicator (saat WiFi dimatikan)
- [ ] Install prompt PWA
- [ ] Manifest.json di browser DevTools
- [ ] Service Worker registration status

**File:** [src/sw.ts](src/sw.ts), [src/lib/offline/](src/lib/offline/)

---

## Diagram yang Perlu Disiapkan

### 1. DFD Level 1
**File:** [docs/DFD/DFD.md](docs/DFD/DFD.md)
**Source:** [docs/BAB4/GAMBAR-16-DFD-LEVEL1-YOURDON-VISIO.md](docs/BAB4/GAMBAR-16-DFD-LEVEL1-YOURDON-VISIO.md)

Elemen yang perlu ada:
- External entities (Admin, Dosen, Mahasiswa, Laboran)
- Proses (1.0 - 4.0)
- Data store (D1)
- Flow lines

---

### 2. ERD Overview
**File:** [docs/ERD/ERD.md](docs/ERD/ERD.md)

Domain yang perlu ada:
- Pengguna (users, admin, dosen, mahasiswa, laboran)
- Akademik (mata_kuliah, kelas, kelas_mahasiswa, jadwal_praktikum)
- Evaluasi (kuis, soal, attempt_kuis, jawaban, nilai)
- Laboratorium (laboratorium, inventaris, peminjaman)
- Operasional (logbook_entries, kehadiran, pengumuman)

---

### 3. Arsitektur PWA

Komponen yang perlu ada:
```
┌─────────────────────────────────────────────────────┐
│                    CLIENT                           │
├─────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌────────────┐│
│  │   React UI   │  │  IndexedDB  │  │   App      ││
│  │  Components  │  │  (14 stores)│  │  Manifest  ││
│  └──────┬───────┘  └──────┬───────┘  └────────────┘│
│         │                 │                        │
│         └────────┬────────┘                        │
│                  │                                 │
│         ┌────────▼────────┐                        │
│         │  Service Worker │                        │
│         │  - Cache First  │                        │
│         │  - Network First│                        │
│         │  - Stale-While   │                        │
│         └────────┬────────┘                        │
└──────────────────┼──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│                   SUPABASE                          │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │   Auth   │  │ Database │  │  Storage │            │
│  └─────────┘  └─────────┘  └─────────┘            │
└─────────────────────────────────────────────────────┘
```

---

### 4. Alur Penelitian R&D

```
[1] Study & Background Research
    ↓ Dokumentasi pustaka
[2] Understand the Problem
    ↓ Wawancara, observasi
[3] Determine Solution Requirements
    ↓ User requirements
[4] Design and Develop Solution
    ↓ System design, coding
[5] Demonstrate Solution
    ↓ Demo aplikasi
[6] Evaluate Solution
    ↓ SUS, testing
```

---

### 5. Permission Matrix RBAC

```
┌──────────────┬───────┬───────┬────────┬────────┐
│ Fitur        │ Admin │ Dosen │ Mhs    │ Laboran │
├──────────────┼───────┼───────┼────────┼────────┤
│ Kelola User  │   ✓   │   -   │   -    │    -   │
│ Buat Kuis    │   -   │   ✓   │   -    │    -   │
│ Ambil Kuis   │   -   │   -   │   ✓    │    -   │
│ Kelola Jadwal│   ✓   │   ✓   │   -    │    ✓   │
│ Review Log   │   -   │   ✓   │   -    │    -   │
│ Entry Logbook│   -   │   -   │   ✓    │    -   │
│ Kelola Invent│   -   │   -   │   -    │    ✓   │
│ Approval Pinj│   -   │   -   │   -    │    ✓   │
└──────────────┴───────┴───────┴────────┴────────┘
```

---

## Chart untuk Hasil Pengujian

### 1. Black Box Testing Results (45 Skenario)

```
┌────────────────────────────────────────────────────┐
│ Black Box Test Results                              │
│                                                    │
│ Authentication      ████████████████████  4/4  100% │
│ Offline Mode       ████████████████████  3/3  100% │
│ Jadwal Praktikum   ████████████████████  3/3  100% │
│ Kuis (Dosen)       ████████████████████  4/4  100% │
│ Bank Soal (Dosen)  ████████████████████  4/4  100% │
│ Logbook (Mahasiswa)████████████████████  4/4  100% │
│ Peminjaman         ████████████████████  4/4  100% │
│ Role-Based Access  ████████████████████  3/3  100% │
│                                                    │
│ ████████████████████████████ 45/45  100% PASS       │
└────────────────────────────────────────────────────┘
```

---

### 2. White Box Testing Coverage

```
┌────────────────────────────────────────────────────┐
│ White Box Test Coverage                             │
│                                                    │
│ Test Files:  241                                   │
│ Test Cases: 5.231                                  │
│                                                    │
│ Coverage:                                           │
│ Branches:   ████████████████░░░░░░░░░░  ~82%     │
│ Functions:  ████████████████░░░░░░░░░░░  ~89%     │
│ Statements: ████████████████░░░░░░░░░░░  ~87%     │
│                                                    │
│ [████████████████████] 100% PASS (5.231/5.231)    │
└────────────────────────────────────────────────────┘
```

---

### 3. SUS Score Visualization

```
┌────────────────────────────────────────────────────┐
│                                                    │
│              SKOR SUS: 75,11                       │
│                                                    │
│    0     25     50     75     100                  │
│    ├─────┼─────┼─────┼─────┤                      │
│          │           │   ↑                        │
│    Poor   OK   Acceptable Good Excellent            │
│                  (50-70) (70-80) (80-90)           │
│                                 │                  │
│                                 └─ Grade B         │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

### 4. Respondent Distribution (46 Responden)

```
┌────────────────────────────────────────────────────┐
│ Respondent Distribution                             │
│                                                    │
│  Admin: ██ 2 (4%)                                  │
│  Dosen: ████████ 8 (17%)                           │
│  Mhs:   ███████████████████████████████ 30 (65%)   │
│  Laboran: ██████ 6 (13%)                           │
│                                                    │
│              ○                                     │
│           ○    ○                                    │
│         ○   ┌────┐                                 │
│        ○    │ 65%│                                 │
│         ○   │ Mhs│                                 │
│           ○ └────┘                                 │
│              ○                                     │
└────────────────────────────────────────────────────┘
```

---

## Langkah Pengambilan Screenshot

### Sebelum Sidang:
1. Jalankan aplikasi (`npm run dev`)
2. Login dengan setiap role untuk screenshot dashboard
3. Screenshot fitur utama (kuis, logbook, jadwal, peminjaman)
4. Demo offline mode dengan matikan WiFi
5. Screenshot install prompt PWA
6. Export semua screenshot dengan nama yang jelas

### Tool yang Bisa Digunakan:
- Snipping Tool (Windows)
- Lightshot
- Greenshot
- Windows + Print Screen

### Format Screenshot:
- Format: PNG atau JPG
- Resolution: Minimal 1920x1080
- Naming: `{feature}-{role}-{action}.png`
  - Contoh: `dashboard-admin-overview.png`
  - Contoh: `kuis-mahasiswa-attempt.png`

---

## Checklist Akhir

### Screenshot:
- [ ] 4 Dashboard (Admin, Dosen, Mahasiswa, Laboran)
- [ ] Login/Auth pages
- [ ] Fitur Kuis (create, attempt, result)
- [ ] Fitur Jadwal
- [ ] Fitur Logbook
- [ ] Fitur Peminjaman
- [ ] Offline indicator
- [ ] Install prompt

### Diagram:
- [ ] DFD Level 1
- [ ] ERD Overview
- [ ] Arsitektur PWA
- [ ] Alur R&D
- [ ] Permission Matrix

### Chart:
- [ ] Black Box Results
- [ ] White Box Coverage
- [ ] SUS Score
- [ ] Respondent Distribution

### Persiapan Demo:
- [ ] Laptop sudah ter-install semua browser
- [ ] VS Code sudah terbuka di project
- [ ] Git Bash/PowerShell sudah siap
- [ ] Hotspot mobile sebagai backup internet
