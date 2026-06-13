# SLIDE PRESENTASI SIDANG SKRIPSI

## Analisis dan Perancangan Sistem Informasi Praktikum Berbasis Progressive Web Application (PWA) Menggunakan Metode R&D di Akademi Kebidanan Mega Buana

**Presenter:** Taufiq (IK.22.11.009)
**Program Studi:** Sarjana Informatika
**Institusi:** Universitas Mega Buana Palopo

---

## BAGIAN I: PENDAHULUAN

---

### SLIDE 1: HALAMAN JUDUL

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    [LOGO AKBID MEGA BUANA]                  │
│                                                             │
│   ANALISIS DAN PERANCANGAN SISTEM INFORMASI PRaktikum       │
│   BERBASIS PROGRESSIVE WEB APPLICATION (PWA)                 │
│   MENGGUNAKAN METODE R&D                                    │
│   DI AKADEMI KEBIDANAN MEGA BUANA                           │
│                                                             │
│   ─────────────────────────────────────────────────────    │
│                                                             │
│   Presenter:                                                │
│   TAUFIQ                                                     │
│   NIM: IK.22.11.009                                         │
│                                                             │
│   Program Studi Sarjana Informatika                          │
│   Fakultas Ilmu Komputer                                     │
│   Universitas Mega Buana Palopo                              │
│                                                             │
│   [Tahun 2026]                                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Key Points:**
- Sebutkan ini adalah penelitian R&D (Research & Development)
- PWA = solusi untuk akses offline di daerah dengan koneksi terbatas
- Fokus pada manajemen praktikum kebidanan

---

### SLIDE 2: LATAR BELAKANG MASALAH

```
┌─────────────────────────────────────────────────────────────┐
│                     LATAR BELAKANG MASALAH                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PROBLEM:                                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ • Pengelolaan praktikum masih manual (kertas,        │  │
│  │   spreadsheet)                                        │  │
│  │ • Miskomunikasi jadwal antar dosen & mahasiswa       │  │
│  │ • Keterlambatan pelaporan hasil praktikum             │  │
│  │ • Tidak ada media terpusat untuk logbook digital      │  │
│  │ • Akses jadwal & materi terbatas saat offline        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  SOLUSI:                                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ • Implementasi Progressive Web Application (PWA)     │  │
│  │ • Akses offline-first dengan Service Worker          │  │
│  │ • Dashboard multi-role (Admin, Dosen, Mahasiswa,     │  │
│  │   Laboran)                                            │  │
│  │ • Logbook digital terstruktur                        │  │
│  │ • Sistem kuis online/offline dengan auto-save        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**File Referensi:**
- [src/pages/mahasiswa/LogbookPage.tsx](src/pages/mahasiswa/LogbookPage.tsx) - Logbook digital
- [src/pages/mahasiswa/JadwalPage.tsx](src/pages/mahasiswa/JadwalPage.tsx) - Akses jadwal

**Visual yang Dibutuhkan:**
- Screenshot sistem (Dashboard Mahasiswa)
- Diagram problem-solution

---

### SLIDE 3: RUMUSAN MASALAH & TUJUAN PENELITIAN

```
┌─────────────────────────────────────────────────────────────┐
│              RUMUSAN MASALAH & TUJUAN PENELITIAN            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  RUMUSAN MASALAH:                                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 1. Bagaimana menganalisis kebutuhan sistem           │  │
│  │    informasi praktikum di AKBID Mega Buana?          │  │
│  │ 2. Bagaimana merancang sistem berbasis PWA dengan     │  │
│  │    metode Research & Development (R&D)?              │  │
│  │ 3. Bagaimana mengimplementasikan fitur offline-first  │  │
│  │    untuk mendukung akses tanpa koneksi?              │  │
│  │ 4. Seberapa efektif sistem dari aspek fungsionalitas  │  │
│  │    dan usability?                                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  TUJUAN PENELITIAN:                                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ • Menghasilkan sistem informasi praktikum yang        │  │
│  │   mendukung manajemen jadwal, materi, kuis, dan       │  │
│  │   logbook secara terintegrasi                         │  │
│  │ • Implementasi PWA untuk akses offline-first          │  │
│  │ • Menguji sistem dengan black box & white box testing │  │
│  │ • Mengevaluasi usability sistem dengan SUS           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### SLIDE 4: BATASAN & MANFAAT PENELITIAN

```
┌─────────────────────────────────────────────────────────────┐
│                  BATASAN & MANFAAT PENELITIAN              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────┐  ┌─────────────────────────┐  │
│  │     BATASAN PENELITIAN   │  │    MANFAAT PENELITIAN   │  │
│  ├─────────────────────────┤  ├─────────────────────────┤  │
│  │ • Lokasi: AKBID Mega    │  │ • Praktis:              │  │
│  │   Buana                 │  │   - Efisiensi admin     │  │
│  │ • Pengguna: Admin,      │  │   - Monitoring data     │  │
│  │   Dosen, Mahasiswa,     │  │                         │  │
│  │   Laboran (4 role)      │  │ • Akademis:             │  │
│  │ • Fitur:                │  │   - Referensi PWA di    │  │
│  │   - Jadwal praktikum    │  │     pendidikan         │  │
│  │   - Peminjaman alat    │  │   - Studi kasus        │  │
│  │   - Logbook digital    │  │     kesehatan          │  │
│  │   - Penilaian          │  │                         │  │
│  │   - Pengumuman         │  │ • Teknis:               │  │
│  │ • Framework: React 18,  │  │   - Arsitektur offline  │  │
│  │   TypeScript, Supabase  │  │   - Dokumentasi PWA    │  │
│  └─────────────────────────┘  └─────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## BAGIAN II: TINJAUAN PUSTAKA & KEASLIAN

---

### SLIDE 5: KAJIAN PUSTAKA (TABEL 1)

```
┌─────────────────────────────────────────────────────────────┐
│                        KAJIAN PUSTAKA                      │
│                     (Literatur 1 - 3)                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Tabel 1. Penelitian Terkait PWA                           │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ No │ Peneliti      │ Judul Penelitian         │ Tahun │ │
│  ├────┼───────────────┼──────────────────────────┼────────┤ │
│  │ 1  │ Nurwanto      │ PWA pada Sistem         │ 2019  │ │
│  │    │               │ E-Commerce              │        │ │
│  │    │               │                        │        │ │
│  │    │               │ Temuan: PWA meningkatkan│        │ │
│  │    │               │ pengalaman pengguna dan │        │ │
│  │    │               │ akses produk           │        │ │
│  ├────┼───────────────┼──────────────────────────┼────────┤ │
│  │ 2  │ Aripin &      │ PWA pada Repository     │ 2021  │ │
│  │    │ Somantri      │ E-Portofolio           │        │ │
│  │    │               │                        │        │ │
│  │    │               │ Temuan: Memudahkan      │        │ │
│  │    │               │ mahasiswa mengelola     │        │ │
│  │    │               │ portofolio akademik     │        │ │
│  ├────┼───────────────┼──────────────────────────┼────────┤ │
│  │ 3  │ Sukma et al.  │ PWA pada Sistem         │ 2022  │ │
│  │    │               │ Penjualan Satelit       │        │ │
│  │    │               │                        │        │ │
│  │    │               │ Temuan: PWA meningkatkan│        │ │
│  │    │               │ aksesibilitas di wilayah│        │ │
│  │    │               │ koneksi terbatas        │        │ │
│  └────┴───────────────┴──────────────────────────┴────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### SLIDE 6: KAJIAN PUSTAKA (TABEL 2)

```
┌─────────────────────────────────────────────────────────────┐
│                        KAJIAN PUSTAKA                      │
│                     (Literatur 4 - 6)                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Tabel 2. Penelitian Terkait PWA (Lanjutan)                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ No │ Peneliti      │ Judul Penelitian         │ Tahun │ │
│  ├────┼───────────────┼──────────────────────────┼────────┤ │
│  │ 4  │ Santoso       │ PWA pada Sistem         │ 2022  │ │
│  │    │ et al.        │ Monitoring Skripsi      │        │ │
│  │    │               │                        │        │ │
│  │    │               │ Temuan: Menyederhanakan │        │ │
│  │    │               │ proses bimbingan dan    │        │ │
│  │    │               │ pendaftaran ujian       │        │ │
│  ├────┼───────────────┼──────────────────────────┼────────┤ │
│  │ 5  │ Muddin        │ PWA pada SI SMA         │ 2023  │ │
│  │    │ et al.        │ Negeri 7 Buru           │        │ │
│  │    │               │                        │        │ │
│  │    │               │ Temuan: Meningkatkan    │        │ │
│  │    │               │ akses informasi         │        │ │
│  │    │               │ akademik bagi guru      │        │ │
│  │    │               │ dan siswa               │        │ │
│  ├────┼───────────────┼──────────────────────────┼────────┤ │
│  │ 6  │ Muzakki       │ PWA pada Repositori     │ 2025  │ │
│  │    │ et al.        │ Tugas Akhir             │        │ │
│  │    │               │                        │        │ │
│  │    │               │ Temuan: Meningkatkan    │        │ │
│  │    │               │ efisiensi publikasi dan  │        │ │
│  │    │               │ orisinalitas karya      │        │ │
│  └────┴───────────────┴──────────────────────────┴────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### SLIDE 7: KEASLIAN PENELITIAN

```
┌─────────────────────────────────────────────────────────────┐
│                      KEASLIAN PENELITIAN                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PERSAMAAN DENGAN PENELITIAN TERDAHULU:                    │
│  • Menggunakan teknologi PWA untuk offline capability      │
│  • Implementasi RBAC multi-role                            │
│  • Studi kasus di institusi pendidikan                     │
│                                                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                             │
│  ╔═══════════════════════════════════════════════════════╗ │
│  ║                    KEBAARUAN                           ║ │
│  ╠═══════════════════════════════════════════════════════╣ │
│  ║ 1. Integrasi teknologi PWA dengan metode R&D yang      ║ │
│  ║    difokuskan khusus pada kebutuhan manajemen          ║ │
│  ║    praktikum pendidikan vokasi kebidanan               ║ │
│  ║                                                       ║ │
│  ║ 2. Sistem kuis hybrid (online/offline) dengan         ║ │
│  ║    conflict resolution untuk sinkronisasi data         ║ │
│  ║                                                       ║ │
│  ║ 3. Logbook digital terstruktur dengan background        ║ │
│  ║    sync untuk laboratorium kebidanan                   ║ │
│  ║                                                       ║ │
│  ║ 4. Evaluasi usability menggunakan System Usability      ║ │
│  ║    Scale (SUS) dengan 46 responden                     ║ │
│  ╚═══════════════════════════════════════════════════════╝ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### SLIDE 8: LANDASAN TEORI I - PWA

```
┌─────────────────────────────────────────────────────────────┐
│                   LANDASAN TEORI I: PWA                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PROGRESSIVE WEB APPLICATION (PWA):                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ • Web app yang menggunakan teknologi modern untuk    │  │
│  │   memberikan pengalaman seperti aplikasi native      │  │
│  │ • Karakteristik: Discoverable, Installable,          │  │
│  │   Network Independent, Secure (HTTPS)                │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  KOMPONEN UTAMA YANG DIIMPLEMENTASIKAN:                    │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────┐ │
│  │  SERVICE WORKER  │  │      MANIFEST   │  │  INDEXEDDB │ │
│  ├─────────────────┤  ├─────────────────┤  ├────────────┤ │
│  │ • Caching       │  │ • App metadata  │  │ • 14 stores│ │
│  │   strategies    │  │ • Install prompt│  │ • Offline  │ │
│  │ • Background    │  │ • App icons     │  │   storage │ │
│  │   sync          │  │   (48-512px)    │  │ • Queue    │ │
│  │ • Push notif    │  │ • Shortcuts     │  │   manager  │ │
│  └─────────────────┘  └─────────────────┘  └────────────┘ │
│                                                             │
│  CACHING STRATEGIES:                                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Cache First    → Static assets (CSS, JS, images)      │  │
│  │ Network First  → API calls (timeout 5 detik)         │  │
│  │ Stale-While-   → Dynamic content (materi, jadwal)     │  │
│  │ Revalidate     →                                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**File Kritis:**
- [src/sw.ts](src/sw.ts) - Service Worker implementation
- [src/lib/offline/indexeddb.ts](src/lib/offline/indexeddb.ts) - IndexedDB 14 stores
- [public/manifest.json](public/manifest.json) - PWA manifest

**Code Snippet untuk Slide:**
```typescript
// Network First dengan fallback cache
async function networkFirstStrategy(request, cacheName) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(request, { signal: controller.signal });
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw error;
  }
}
```

**Visual yang Dibutuhkan:**
- Screenshot manifest.json
- Diagram Service Worker lifecycle
- IndexedDB structure diagram

---

### SLIDE 9: LANDASAN TEORI II - RBAC & R&D

```
┌─────────────────────────────────────────────────────────────┐
│              LANDASAN TEORI II: RBAC & R&D                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────┐  ┌─────────────────────────┐  │
│  │   RBAC (Role-Based       │  │   R&D (Research &        │  │
│  │   Access Control)        │  │   Development)           │  │
│  │                         │  │   Ellis & Levy           │  │
│  ├─────────────────────────┤  ├─────────────────────────┤  │
│  │ 4 Role:                 │  │ 6 Tahapan:               │  │
│  │                         │  │                         │  │
│  │ • Admin  → Kelola user  │  │ ① Study & Background    │  │
│  │ • Dosen  → Kelola kuis  │  │ ② Understand Problem     │  │
│  │ • Mahasis → Ambil kuis  │  │ ③ Determine Requirements │  │
│  │ • Laboran → Kelola alat │  │ ④ Design & Develop      │  │
│  │                         │  │ ⑤ Demonstrate Solution   │  │
│  │ Permission Matrix:      │  │ ⑥ Evaluate Solution      │  │
│  │ ┌─────┬─────┬─────┬──┐ │  │                         │  │
│  │ │Fitur│Adm │Dos│Mhs│Lbr│ │  │                         │  │
│  │ ├─────┼─────┼─────┼──┤ │  │                         │  │
│  │ │User │ ✓  │ -  │ - │ - │ │  │                         │  │
│  │ │Kuis │ -  │ ✓  │ ✓ │ - │ │  │                         │  │
│  │ │Invent│ -  │ -  │ - │✓ │ │  │                         │  │
│  │ └─────┴─────┴─────┴──┘ │  │                         │  │
│  └─────────────────────────┘  └─────────────────────────┘  │
│                                                             │
│  File Kritis:                                              │
│  • src/routes/index.tsx → Route definitions with RBAC      │
│  • src/types/auth.types.ts → UserRole type                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**File Kritis:**
- [src/types/auth.types.ts](src/types/auth.types.ts) - UserRole type
- [src/routes/index.tsx](src/routes/index.tsx) - RBAC routing
- [src/components/common/RoleGuard.tsx](src/components/common/RoleGuard.tsx) - Role guard

---

## BAGIAN III: METODOLOGI PENELITIAN

---

### SLIDE 10: ALUR PENELITIAN (ELLIS & LEVY)

```
┌─────────────────────────────────────────────────────────────┐
│                 ALUR PENELITIAN (ELLIS & LEVY)              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌──────────────┐                                         │
│   │ 1. Study &   │ → Dokumentasi pustaka, studi kasus    │
│   │ Background    │   Penelitian terdahulu tentang PWA    │
│   │ Research      │   (Nurwanto, Aripin, Sukma, dll)      │
│   └──────┬───────┘                                         │
│          ↓                                                 │
│   ┌──────────────┐                                         │
│   │ 2. Understand │ → Wawancara dengan admin, dosen,      │
│   │ the Problem   │   laboran, mahasiswa AKBID             │
│   │               │   Observasi sistem manual             │
│   └──────┬───────┘                                         │
│          ↓                                                 │
│   ┌──────────────┐                                         │
│   │ 3. Determine  │ → Kebutuhan fungsional (jadwal, kuis, │
│   │ Solution      │   logbook, peminjaman)                │
│   │ Requirements   │   Kebutuhan non-fungsional (offline)  │
│   └──────┬───────┘                                         │
│          ↓                                                 │
│   ┌──────────────┐                                         │
│   │ 4. Design &  │ → Perancangan DFD, ERD                 │
│   │ Develop       │   Implementasi kode (React, PWA)      │
│   │ Solution      │   Pengujian unit & integrasi           │
│   └──────┬───────┘                                         │
│          ↓                                                 │
│   ┌──────────────┐                                         │
│   │ 5. Demonstrate│ → Demo aplikasi ke pengguna            │
│   │ Solution      │   User acceptance testing             │
│   │               │   Pengujian black box                   │
│   └──────┬───────┘                                         │
│          ↓                                                 │
│   ┌──────────────┐                                         │
│   │ 6. Evaluate   │ → Evaluasi usability (SUS)            │
│   │ Solution      │   Analisis hasil pengujian            │
│   │               │   Penyusunan kesimpulan & saran        │
│   └──────────────┘                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### SLIDE 11: OBJEK, LOKASI, DAN SAMPEL

```
┌─────────────────────────────────────────────────────────────┐
│                 OBJEK, LOKASI, DAN SAMPEL                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  OBJEK PENELITIAN:                                          │
│  Sistem Informasi Praktikum Berbasis PWA                    │
│  di Akademi Kebidanan Mega Buana                           │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  SAMPEL PENELITIAN:                                         │
│  Teknik Total Sampling - 46 Responden                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Kategori       │ Jumlah │ Metode Sampling          │   │
│  ├────────────────┼────────┼───────────────────────────┤   │
│  │ Admin          │   2    │ Purposive Sampling        │   │
│  │ Dosen          │   8    │ Purposive Sampling        │   │
│  │ Mahasiswa      │  30    │ Random Sampling           │   │
│  │ Laboran        │   6    │ Purposive Sampling        │   │
│  ├────────────────┼────────┼───────────────────────────┤   │
│  │ TOTAL          │  46    │                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌────────────────────────────────────────┐                │
│  │ TEKNIK PENGUMPULAN DATA:               │                │
│  │ • Kuesioner SUS (System Usability     │                │
│  │   Scale) untuk usability              │                │
│  │ • Wawancara semi-struktur            │                │
│  │ • Observasi partisipatif             │                │
│  │ • Dokumentasi sistem                │                │
│  └────────────────────────────────────────┘                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Visual yang Dibutuhkan:**
- Pie chart distribusi responden (Admin 4%, Dosen 17%, Mahasiswa 65%, Laboran 13%)

---

### SLIDE 12: PERANCANGAN PROSES (DFD LEVEL 1)

```
┌─────────────────────────────────────────────────────────────┐
│              PERANCANGAN PROSES (DFD LEVEL 1)               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│        ┌─────────┐                                          │
│        │ Admin   │                                          │
│        └────┬────┘                                          │
│        ┌────┴────┐                                          │
│        │ Dosen   │                                          │
│        └────┬────┘                                          │
│        ┌────┴────┐  External    ┌──────────────────────────┐│
│        │Mahasiswa│  Entities    │      1.0               ││
│        └────┬────┘─────────────▶│ Manajemen Akun & Akses  ││
│        ┌────┴────┐               │ • Authentikasi           ││
│        │ Laboran │               │ • Role-based access     ││
│        └────┬────┘               │ • Session management     ││
│             │                    └───────────┬──────────────┘│
│             │                                │               │
│             │                    ┌───────────┴──────────────┐│
│             │                    │      2.0               ││
│             │        ┌──────────▶│ Manajemen Akademik     ││
│             │        │           │ • Jadwal praktikum      ││
│             │        │           │ • Kuis & soal           ││
│             │        │           │ • Materi pembelajaran   ││
│             │        │           └───────────┬──────────────┘│
│             │        │                       │               │
│             │        │           ┌───────────┴──────────────┐│
│             │        └──────────▶│      3.0               ││
│             │                    │ Operasional Laboratorium ││
│             │                    │ • Logbook digital        ││
│             │                    │ • Peminjaman alat        ││
│             │                    │ • Kehadiran             ││
│             │                    └───────────┬──────────────┘│
│             │                                │               │
│             │                    ┌───────────┴──────────────┐│
│             │                    │      4.0               ││
│             └───────────────────▶│ Layanan PWA & Sinkron    ││
│                                  │ • Service Worker        ││
│                                  │ • IndexedDB cache       ││
│                                  │ • Background sync       ││
│                                  └──────────────────────────┘│
│                                                             │
│  DATASTORE:                                                 │
│  D1 = Database (users, akademik, laboratorium, sync)         │
│                                                             │
│  File Referensi:                                            │
│  • docs/DFD/DFD.md                                          │
│  • docs/BAB4/GAMBAR-16-DFD-LEVEL1-YOURDON-VISIO.md         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Visual yang Dibutuhkan:**
- DFD diagram lengkap (dari docs/DFD/)

---

### SLIDE 13: PERANCANGAN DATA (ERD)

```
┌─────────────────────────────────────────────────────────────┐
│                 PERANCANGAN DATA (ERD)                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  DOMAIN ENTITY GROUPS:                                      │
│                                                             │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐ │
│  │   PENGGUNA    │  │   AKADEMIK    │  │   EVALUASI     │ │
│  ├───────────────┤  ├───────────────┤  ├───────────────┤ │
│  │ • users       │  │ • mata_kuliah │  │ • kuis         │ │
│  │ • admin       │  │ • kelas       │  │ • soal         │ │
│  │ • dosen       │  │ • kelas_mhs   │  │ • bank_soal    │ │
│  │ • mahasiswa   │  │ • jadwal_prak │  │ • attempt_kuis│ │
│  │ • laboran     │  │ • kehadiran   │  │ • jawaban      │ │
│  │               │  │ • materi      │  │ • nilai        │ │
│  └───────┬───────┘  └───────────────┘  └───────────────┘ │
│          │                                                  │
│          │ 1:1                                              │
│          ▼                                                  │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐ │
│  │ LABORATORIUM  │  │ OPERASIONAL   │  │   OFFLINE     │ │
│  ├───────────────┤  ├───────────────┤  ├───────────────┤ │
│  │ • laboratorium│  │ • logbook      │  │ • sync_queue  │ │
│  │ • inventaris │  │ • pengumuman   │  │ • offline_data│ │
│  │ • peminjaman  │  │ • notifikasi   │  │ • conflict    │ │
│  └───────────────┘  └───────────────┘  └───────────────┘ │
│                                                             │
│  KEY RELATIONSHIPS:                                         │
│  users (1) ── (1) admin/dosen/mahasiswa/laboran            │
│  users (1) ── (N) kelas_mahasiswa (N) ── kelas              │
│  kelas (1) ── (N) jadwal_praktikum (1) ── laboratorium     │
│  kuis (1) ── (N) soal (1) ── (N) attempt_kuis (N) ──       │
│              jawaban                                        │
│                                                             │
│  File Kritis:                                               │
│  • src/lib/supabase/database.types.ts (61KB - full schema) │
│  • supabase/database-complete.sql                          │
│  • docs/ERD/ERD.md                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Visual yang Dibutuhkan:**
- ERD overview diagram (dari docs/ERD/)

---

## BAGIAN IV: IMPLEMENTASI & HASIL

---

### SLIDE 14: IMPLEMENTASI ANTARMUKA (DASHBOARD)

```
┌─────────────────────────────────────────────────────────────┐
│              IMPLEMENTASI ANTARMUKA (DASHBOARD)             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────────┐  ┌────────────────────┐            │
│  │   ADMIN DASHBOARD  │  │   DOSEN DASHBOARD   │            │
│  │                    │  │                    │            │
│  │ • Statistik:       │  │ • Active Classes   │            │
│  │   - Total Users    │  │ • Upcoming Practicum│            │
│  │   - Mahasiswa %    │  │ • Quick Actions    │            │
│  │   - Dosen, Labs    │  │ • Recent Materials │            │
│  │ • Charts:          │  │ • Logbook Review    │            │
│  │   - User Growth    │  │   Pending          │            │
│  │   - Distribution   │  │                    │            │
│  │   - Lab Usage      │  │                    │            │
│  │                    │  │                    │            │
│  │ /admin/dashboard   │  │ /dosen/dashboard    │            │
│  └────────────────────┘  └────────────────────┘            │
│                                                             │
│  ┌────────────────────┐  ┌────────────────────┐            │
│  │  MAHASISWA DASHBOARD│  │  LABORAN DASHBOARD │            │
│  │                    │  │                    │            │
│  │ • Total Classes    │  │ • Total Lab        │            │
│  │ • Practicum:       │  │ • Total Equipment  │            │
│  │   - Today: 2       │  │ • Pending Approvals│            │
│  │   - This Week: 5   │  │ • Low Stock Alerts │            │
│  │ • Progress %       │  │ • Active Loans     │            │
│  │ • My Classes list  │  │ • Lab Schedule     │            │
│  │                    │  │                    │            │
│  │ /mahasiswa/dashboard│  │ /laboran/dashboard │            │
│  └────────────────────┘  └────────────────────┘            │
│                                                             │
│  File Kritis:                                               │
│  • src/pages/admin/DashboardPage.tsx                       │
│  • src/pages/dosen/DashboardPage.tsx                        │
│  • src/pages/mahasiswa/DashboardPage.tsx                   │
│  • src/pages/laboran/DashboardPage.tsx                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Visual yang Dibutuhkan:**
- 4 screenshot dashboard (Admin, Dosen, Mahasiswa, Laboran)

---

### SLIDE 15: FITUR PWA & OFFLINE ACCESS

```
┌─────────────────────────────────────────────────────────────┐
│                   FITUR PWA & OFFLINE ACCESS                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                 SERVICE WORKER                       │  │
│  │  Caching Strategies:                                │  │
│  │  ┌──────────────┬────────────────────────────────┐  │  │
│  │  │ Cache First  │ Static assets (CSS, JS, images)│  │  │
│  │  ├──────────────┼────────────────────────────────┤  │  │
│  │  │ Network      │ API calls (timeout 5 detik,    │  │  │
│  │  │ First        │ fallback ke cache)             │  │  │
│  │  ├──────────────┼────────────────────────────────┤  │  │
│  │  │ Stale-While  │ Dynamic content (materi,        │  │  │
│  │  │ Revalidate   │ jadwal, pengumuman)            │  │  │
│  │  └──────────────┴────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    INDEXEDDB                         │  │
│  │  14 Object Stores:                                  │  │
│  │  ┌──────────────┬────────────────────────────────┐  │  │
│  │  │ kuis        │ Quiz data cache                 │  │  │
│  │  │ soal        │ Questions storage               │  │  │
│  │  │ jawaban     │ Student answers                 │  │  │
│  │  │ nilai       │ Grades cache                    │  │  │
│  │  │ materi      │ Learning materials              │  │  │
│  │  │ kelas       │ Class data                      │  │  │
│  │  │ jadwal      │ Schedule cache                  │  │  │
│  │  │ ...         │ More stores for offline         │  │  │
│  │  └──────────────┴────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                 FEATURES                             │  │
│  │  • Prompt Install → Install app ke perangkat         │  │
│  │  • Network Status → Indikator Online/Offline          │  │
│  │  • Auto-save Kuis → Simpan jawaban ke IndexedDB       │  │
│  │  • Background Sync → Sinkronisasi saat koneksi aktif │  │
│  │  • Conflict Resolution → Handle data conflict         │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  File Kritis:                                               │
│  • src/sw.ts (Service Worker)                               │
│  • src/lib/offline/indexeddb.ts (14 stores)               │
│  • src/lib/offline/queue-manager.ts                       │
│  • src/lib/offline/sync-manager.ts                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Visual yang Dibutuhkan:**
- Screenshot offline banner
- Screenshot install prompt
- Diagram PWA architecture

**Code Snippet untuk Slide:**
```typescript
// Background Sync Handler
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-quiz-answers") {
    event.waitUntil(syncQuizAnswers(event.tag));
  }
  if (event.tag === "sync-logbook") {
    event.waitUntil(syncLogbookEntries(event.tag));
  }
});
```

---

### SLIDE 16: HASIL PENGUJIAN BLACK BOX

```
┌─────────────────────────────────────────────────────────────┐
│               HASIL PENGUJIAN BLACK BOX                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  45 SKENARIO PENGUJIAN - 100% PASS                          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Modul              │ Jumlah TC │ Pass │ Fail        │   │
│  ├────────────────────┼───────────┼──────┼─────────────┤   │
│  │ Authentication     │     4     │  4   │     0       │   │
│  │ Offline Mode (PWA) │     3     │  3   │     0       │   │
│  │ Jadwal Praktikum   │     3     │  3   │     0       │   │
│  │ Kuis (Dosen)       │     4     │  4   │     0       │   │
│  │ Bank Soal (Dosen)  │     4     │  4   │     0       │   │
│  │ Logbook (Mahasiswa)│     4     │  4   │     0       │   │
│  │ Peminjaman         │     4     │  4   │     0       │   │
│  │ Role-Based Access  │     3     │  3   │     0       │   │
│  ├────────────────────┼───────────┼──────┼─────────────┤   │
│  │ TOTAL              │    45     │ 45   │     0       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  SAMPLE TEST CASES:                                         │
│  ┌────────────────────────────────────────────────────┐   │
│  │ TC-AUTH-001: Login dengan kredensial valid →        │   │
│  │              Redirect ke dashboard sesuai role      │   │
│  │ TC-OFF-001:  Akses jadwal saat offline →           │   │
│  │              Data tampil dari cache                 │   │
│  │ TC-KUIS-001: Buat kuis baru → Notifikasi sukses     │   │
│  │ TC-LOG-001:  Submit logbook → Ter simpan di DB      │   │
│  │ TC-RBAC-001: User mahasiswa akses /dosen/* →       │   │
│  │              Redirect ke /mahasiswa/dashboard      │   │
│  └────────────────────────────────────────────────────┘   │
│                                                             │
│  File Referensi:                                            │
│  • docs/BLACKBOX/BLACKBOX-TEST-PLAN.md                     │
│                                                             │
│  [████████████████████] 100% PASS (45/45)                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Visual yang Dibutuhkan:**
- Bar chart hasil pengujian
- Tabel test cases
- Green badge "100% Pass"

---

### SLIDE 17: HASIL PENGUJIAN WHITE BOX

```
┌─────────────────────────────────────────────────────────────┐
│              HASIL PENGUJIAN WHITE BOX                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │          241 FILE TEST • 5.231 TEST CASES           │   │
│  │                   100% PASS                          │   │
│  │                                                     │   │
│  │   ████████████████████████████████████████████     │   │
│  │   5.231 test cases lulus tanpa kegagalan            │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  COVERAGE METRICS:                                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Metric       │ Target    │ Actual                     │   │
│  ├──────────────┼───────────┼───────────────────────────┤   │
│  │ Test Files   │     -     │ 241                       │   │
│  │ Test Cases   │     -     │ 5.231                     │   │
│  │ Branches     │   80%     │ ~82%                      │   │
│  │ Functions    │   85%     │ ~89%                      │   │
│  │ Statements   │   85%     │ ~87%                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  TEST CATEGORIES:                                           │
│  ┌────────────────────────────────────────────────────┐   │
│  │ Unit Tests:                                         │   │
│  │ • lib/api/* (Auth, Jadwal, Kuis, dll)             │   │
│  │ • lib/hooks/* (useAuth, useSync, dll)            │   │
│  │ • lib/offline/* (indexeddb, queue, sync)          │   │
│  │ • lib/utils/* (cache-manager, permissions)        │   │
│  │                                                   │   │
│  │ Integration Tests:                                  │   │
│  │ • auth-flow.test.tsx                              │   │
│  │ • role-access.test.tsx                            │   │
│  │ • conflict-resolution.test.tsx                    │   │
│  │ • offline-sync-flow.test.tsx                      │   │
│  └────────────────────────────────────────────────────┘   │
│                                                             │
│  File Kritis:                                               │
│  • vitest.config.ts (Coverage config)                       │
│  • src/__tests__/setup.ts (Test setup)                      │
│  • src/__tests__/ (241 test files)                          │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │ 💡 TIPS PRESENTASI:                                │   │
│  │ "Jumlah test case 5.231 sangat tinggi untuk        │   │
│  │  skripsi informatika, menunjukkan ketelitian       │   │
│  │  dalam membangun sistem yang stabil."              │   │
│  └────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Visual yang Dibutuhkan:**
- Coverage report screenshot
- Test distribution pie chart
- Highlight "5.231 test cases"

---

## BAGIAN V: EVALUASI & PENUTUP

---

### SLIDE 18: EVALUASI USABILITY (SKOR SUS)

```
┌─────────────────────────────────────────────────────────────┐
│                  EVALUASI USABILITY (SUS)                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │              SKOR SUS: 75,11                        │   │
│  │                                                     │   │
│  │              ┌─────────────────┐                    │   │
│  │              │                 │                    │   │
│  │              │      75,11      │                    │   │
│  │              │                 │                    │   │
│  │              └─────────────────┘                    │   │
│  │                                                     │   │
│  │           GRADE: B  │  GOOD  │  ACCEPTABLE          │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  INTERPRETASI SKOR SUS:                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 0-50    │  Poor          │  Not acceptable           │   │
│  │ 50-70   │  OK           │  Marginal                 │   │
│  │ 70-80   │  GOOD ←       │  Acceptable ★            │   │
│  │ 80-90   │  Excellent    │  Recommended              │   │
│  │ 90-100  │  Best         │  Outstanding             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  METODOLOGI SUS:                                            │
│  • 10 pertanyaan (5-point Likert scale)                     │
│  • 46 responden (Admin, Dosen, Mahasiswa, Laboran)         │
│  • Interpretasi: Grade B, sistem layak digunakan           │
│                                                             │
│  File Referensi:                                            │
│  • docs/BAB4/GAMBAR-40-DIAGRAM-DISTRIBUSI-RESPONDEN-SUS.md │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Visual yang Dibutuhkan:**
- SUS score gauge/meter
- Comparison chart

---

### SLIDE 19: KESIMPULAN

```
┌─────────────────────────────────────────────────────────────┐
│                       KESIMPULAN                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 1. SISTEM PWA BERHASIL DIBANGUN                     │   │
│  │    ✓ Implementasi Service Worker dengan 3 caching  │   │
│  │      strategies (Cache First, Network First,         │   │
│  │      Stale-While-Revalidate)                        │   │
│  │    ✓ IndexedDB dengan 14 object stores untuk        │   │
│  │      offline storage                               │   │
│  │    ✓ Background sync dan conflict resolution        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 2. RBAC MULTI-ROLE BERFUNGSI DENGAN BAIK            │   │
│  │    ✓ 4 role (Admin, Dosen, Mahasiswa, Laboran)     │   │
│  │    ✓ Permission matrix yang jelas                   │   │
│  │    ✓ Protected routes dan role guards 100% pass     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 3. MEKANISME OFFLINE-FIRST BERHASIL                 │   │
│  │    ✓ Background sync untuk quiz answers             │   │
│  │    ✓ Conflict resolution untuk sinkronisasi data     │   │
│  │    ✓ 100% pass pada skenario offline                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 4. KUALITAS TERJAMIN                                │   │
│  │    ✓ 45 Black Box test scenarios: 100% pass         │   │
│  │    ✓ 5.231 White Box test cases: 100% pass          │   │
│  │    ✓ Skor SUS: 75,11 (Grade B - Good)               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### SLIDE 20: SARAN & PENUTUP

```
┌─────────────────────────────────────────────────────────────┐
│                      SARAN & PENUTUP                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   SARAN PENGEMBANGAN                │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │                                                     │   │
│  │ 1. OPTIMASI PERFORMA                                │   │
│  │    • Implementasi code splitting per route           │   │
│  │    • Lazy loading untuk gambar                      │   │
│  │    • Target: < 1MB bundle size                      │   │
│  │                                                     │   │
│  │ 2. FITUR BARU                                       │   │
│  │    • Logbook dengan export PDF                      │   │
│  │    • Rubrik penilaian praktikum                     │   │
│  │    • Push notifications real-time                  │   │
│  │                                                     │   │
│  │ 3. INTEGRASI                                         │   │
│  │    • Integrasi dengan SIAKAD institusi              │   │
│  │    • Ekosistem data yang lebih luas                 │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │              TERIMA KASIH                           │   │
│  │                                                     │   │
│  │        Atas perhatian dan waktu Bapak/Ibu          │   │
│  │        moderator serta penguji.                     │   │
│  │                                                     │   │
│  │        Saya siap menerima pertanyaan                │   │
│  │        dan kritik yang membangun.                  │   │
│  │                                                     │   │
│  │              [TAUFIQ - IK.22.11.009]               │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## WAKTU PRESENTASI

| Bagian | Slides | Waktu |
|--------|--------|-------|
| Pendahuluan | 1-4 | 7-9 menit |
| Tinjauan Pustaka | 5-9 | 11-14 menit |
| Metodologi | 10-13 | 10-13 menit |
| Implementasi & Hasil | 14-17 | 13-17 menit |
| Evaluasi & Penutup | 18-20 | 7-9 menit |
| **TOTAL** | **20** | **48-62 menit** |

---

## FILE KRITIS YANG PERLU DISIAPKAN

| Slide | File | Purpose |
|-------|------|---------|
| 1 | [package.json](package.json) | Info versi project |
| 1 | [public/manifest.json](public/manifest.json) | PWA identity |
| 2, 14 | [src/pages/mahasiswa/](src/pages/mahasiswa/) | Screenshot sistem |
| 8, 15 | [src/sw.ts](src/sw.ts) | Service Worker code |
| 8, 15 | [src/lib/offline/indexeddb.ts](src/lib/offline/indexeddb.ts) | IndexedDB |
| 9, 14 | [src/routes/index.tsx](src/routes/index.tsx) | RBAC routing |
| 12 | [docs/DFD/DFD.md](docs/DFD/DFD.md) | DFD documentation |
| 12 | [docs/BAB4/GAMBAR-16-DFD-LEVEL1-YOURDON-VISIO.md](docs/BAB4/GAMBAR-16-DFD-LEVEL1-YOURDON-VISIO.md) | DFD diagram |
| 13 | [docs/ERD/ERD.md](docs/ERD/ERD.md) | ERD documentation |
| 13 | [supabase/database-complete.sql](supabase/database-complete.sql) | Schema SQL |
| 16 | [docs/BLACKBOX/BLACKBOX-TEST-PLAN.md](docs/BLACKBOX/BLACKBOX-TEST-PLAN.md) | Test plan |
| 17 | [vitest.config.ts](vitest.config.ts) | Coverage config |
| 17 | [src/__tests__/setup.ts](src/__tests__/setup.ts) | Test setup |
| 18 | [docs/BAB4/GAMBAR-40-DIAGRAM-DISTRIBUSI-RESPONDEN-SUS.md](docs/BAB4/GAMBAR-40-DIAGRAM-DISTRIBUSI-RESPONDEN-SUS.md) | SUS evaluation |

---

## CHECKLIST PERSIAPAN PRESENTASI

### Dokumen yang Perlu Dibuat:
- [ ] Slide presentasi (PowerPoint/Google Slides/Canva)
- [ ] Naskah presentasi (speaker notes)
- [ ] Referensi kode untuk demo
- [ ] Screenshot sistem (dashboard setiap role)
- [ ] Diagram DFD dan ERD
- [ ] Hasil pengujian (coverage report)

### Screenshot yang Perlu Diambil:
- [ ] Login page
- [ ] Dashboard Admin
- [ ] Dashboard Dosen
- [ ] Dashboard Mahasiswa
- [ ] Dashboard Laboran
- [ ] Halaman Kuis (create & attempt)
- [ ] Halaman Logbook
- [ ] Offline indicator
- [ ] Install prompt PWA

### Hal yang Perlu Dihafal:
- [ ] Cara demo offline mode (matikan WiFi)
- [ ] Cara demo install PWA
- [ ] Angka-angka penting (5.231 test cases, 75,11 SUS)
- [ ] File kritikal dan cara membuka dengan cepat
