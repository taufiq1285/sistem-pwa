# Data Flow Diagram (DFD)
## Sistem Informasi Praktikum PWA - AKBID Mega Buana

---

## 1. NOTASI & SIMBOL

### Simbol DFD yang Digunakan:

```
[ ENTITAS ]  = Entity External (persegi panjang)
( PROSES  )  = Proses/Transformasi (lingkaran)
[= STORE =]  = Data Store (dua garis horizontal)
   ──────→   = Aliran Data (panah)
```

---

## 2. DFD LEVEL 0 — CONTEXT DIAGRAM

### 2.1 Diagram

```mermaid
graph LR
    subgraph "Entitas Eksternal"
        Mahasiswa[Mahasiswa]
        Dosen[Dosen]
        Laboran[Laboran]
        Admin[Admin]
        Supabase[Supabase Server]
    end

    subgraph "Sistem Informasi Praktikum PWA"
        SPWA[Sistem Informasi\nPraktikum PWA]
    end

    Mahasiswa <-->|"Kerjakan Kuis, Akses Materi,\nLihat Jadwal & Presensi,\nIsi Logbook, Lihat Nilai,\nLihat Pengumuman"| SPWA

    Dosen <-->|"Kelola Kuis & Bank Soal,\nUpload Materi, Input Kehadiran,\nInput Penilaian, Review Logbook,\nAjukan Peminjaman, Kelola Jadwal,\nLihat Pengumuman"| SPWA

    Laboran <-->|"Kelola Inventaris,\nApprove/Tolak Peminjaman,\nApprove Jadwal, Lihat Laporan,\nLihat Pengumuman"| SPWA

    Admin <-->|"Kelola User, Kelola Kelas & MK,\nKelola Lab & Peralatan,\nBuat Pengumuman,\nMonitor Peminjaman"| SPWA

    SPWA <-->|"Sync Data Online/Offline"| Supabase
```

### 2.2 Deskripsi Context Diagram

**Sistem**: Sistem Informasi Praktikum PWA — AKBID Mega Buana

**Entitas Eksternal**: 5 entitas
- Mahasiswa
- Dosen
- Laboran
- Admin
- Supabase Server

**Aliran Data Per Entitas**:

| Entitas | Input ke Sistem | Output dari Sistem |
|---------|-----------------|-------------------|
| Mahasiswa | Jawaban kuis, entri logbook, request materi & jadwal | Kuis, materi, jadwal, presensi, nilai, logbook, pengumuman |
| Dosen | Data kuis, bank soal, materi, kehadiran, nilai, logbook review, jadwal, peminjaman | Daftar kuis, rekap kehadiran, hasil penilaian, logbook mahasiswa, status peminjaman |
| Laboran | Data inventaris, keputusan peminjaman, approve jadwal | Daftar inventaris, permohonan peminjaman, jadwal, laporan |
| Admin | Data user, kelas, mata kuliah, lab, peralatan, pengumuman | Statistik sistem, daftar user, rekap peminjaman |
| Supabase | Data tersinkron dari server | Data sinkron ke browser (offline cache) |

---

## 3. DFD LEVEL 1

### 3.1 Diagram Level 1

```mermaid
graph TB
    subgraph "Entitas Eksternal"
        Mahasiswa
        Dosen
        Laboran
        Admin
        Supabase
    end

    subgraph "Proses Utama"
        P1(P1\nAutentikasi)
        P2(P2\nKelola Jadwal)
        P3(P3\nKelola Kuis\n& Bank Soal)
        P4(P4\nKelola Materi)
        P5(P5\nKelola Kelas\n& Mata Kuliah)
        P6(P6\nKelola User)
        P7(P7\nKehadiran\n& Penilaian)
        P8(P8\nLogbook Digital)
        P9(P9\nPeminjaman Alat\n& Inventaris)
        P10(P10\nPengumuman)
        P11(P11\nSinkronisasi\nOffline PWA)
    end

    subgraph "Data Store"
        D1[(D1\nDatabase\nSupabase)]
        D2[(D2\nIndexedDB\nCache)]
        D3[(D3\nOffline\nQueue)]
    end

    %% P1 - Autentikasi
    Mahasiswa -->|Kredensial login| P1
    Dosen -->|Kredensial login| P1
    Laboran -->|Kredensial login| P1
    Admin -->|Kredensial login| P1
    P1 <-->|Validasi user| D1
    P1 -->|Session token + role| Mahasiswa
    P1 -->|Session token + role| Dosen
    P1 -->|Session token + role| Laboran
    P1 -->|Session token + role| Admin

    %% P2 - Kelola Jadwal
    Dosen -->|Data jadwal| P2
    Laboran -->|Approve jadwal| P2
    Mahasiswa -->|Request jadwal| P2
    P2 <-->|CRUD jadwal| D1
    P2 <-->|Cache jadwal| D2
    P2 -->|Jadwal aktif| Mahasiswa
    P2 -->|Jadwal mengajar| Dosen
    P2 -->|Jadwal lab| Laboran

    %% P3 - Kelola Kuis & Bank Soal
    Dosen -->|Data kuis, soal, bank soal| P3
    Mahasiswa -->|Jawaban kuis| P3
    P3 <-->|CRUD kuis & soal| D1
    P3 <-->|Cache kuis offline| D2
    P3 <-->|Antrian jawaban offline| D3
    P3 -->|Kuis & hasil nilai| Mahasiswa
    P3 -->|Statistik & rekap nilai| Dosen

    %% P4 - Kelola Materi
    Dosen -->|File materi| P4
    Mahasiswa -->|Request materi| P4
    P4 <-->|CRUD materi| D1
    P4 <-->|Cache materi offline| D2
    P4 -->|Daftar & file materi| Mahasiswa

    %% P5 - Kelola Kelas & Mata Kuliah
    Admin -->|Data kelas, MK, enrollment| P5
    P5 <-->|CRUD kelas & MK| D1
    P5 -->|Info kelas| Dosen
    P5 -->|Info kelas & MK| Mahasiswa
    P5 -->|Rekap kelas| Admin

    %% P6 - Kelola User
    Admin -->|Data user baru, edit, nonaktif| P6
    P6 <-->|CRUD user & profil| D1
    P6 -->|Daftar & statistik user| Admin

    %% P7 - Kehadiran & Penilaian
    Dosen -->|Data kehadiran & nilai| P7
    Mahasiswa -->|Request presensi & nilai| P7
    P7 <-->|CRUD kehadiran & nilai| D1
    P7 -->|Rekap kehadiran| Dosen
    P7 -->|Presensi & nilai| Mahasiswa

    %% P8 - Logbook Digital
    Mahasiswa -->|Entri logbook| P8
    Dosen -->|Review & feedback| P8
    P8 <-->|CRUD logbook| D1
    P8 -->|Logbook mahasiswa| Dosen
    P8 -->|Logbook & feedback| Mahasiswa

    %% P9 - Peminjaman & Inventaris
    Dosen -->|Permohonan peminjaman| P9
    Laboran -->|Data inventaris, keputusan| P9
    Admin -->|Keputusan peminjaman| P9
    P9 <-->|CRUD inventaris & peminjaman| D1
    P9 -->|Status peminjaman| Dosen
    P9 -->|Daftar inventaris & laporan| Laboran
    P9 -->|Rekap peminjaman| Admin

    %% P10 - Pengumuman
    Admin -->|Data pengumuman| P10
    P10 <-->|CRUD pengumuman| D1
    P10 <-->|Cache pengumuman| D2
    P10 -->|Pengumuman| Mahasiswa
    P10 -->|Pengumuman| Dosen
    P10 -->|Pengumuman| Laboran

    %% P11 - Sinkronisasi Offline
    P2 -->|Data jadwal| P11
    P3 -->|Jawaban kuis offline| P11
    P4 -->|Cache materi| P11
    P7 -->|Data kehadiran offline| P11
    P8 -->|Entri logbook offline| P11
    P11 <-->|Antrian operasi| D3
    P11 <-->|Kelola cache| D2
    P11 <-->|Sync database| D1
    P11 <-->|Resolve konflik| Supabase
```

### 3.2 Deskripsi Proses Level 1

| ID | Nama Proses | Deskripsi | Entitas Terlibat |
|----|-------------|-----------|-----------------|
| P1 | Autentikasi | Validasi login, generate session, RBAC, logout | Admin, Dosen, Laboran, Mahasiswa |
| P2 | Kelola Jadwal | Buat jadwal (Dosen), approve (Laboran), lihat jadwal | Dosen, Laboran, Mahasiswa |
| P3 | Kelola Kuis & Bank Soal | Buat kuis, bank soal, kerjakan kuis online/offline, auto-grading | Dosen, Mahasiswa |
| P4 | Kelola Materi | Upload, list, download materi, cache offline | Dosen, Mahasiswa |
| P5 | Kelola Kelas & Mata Kuliah | CRUD kelas, MK, assignment, enrollment mahasiswa | Admin |
| P6 | Kelola User | CRUD user 4 role, edit profil | Admin |
| P7 | Kehadiran & Penilaian | Input kehadiran, rekap absensi, input & lihat nilai | Dosen, Mahasiswa |
| P8 | Logbook Digital | Buat entri logbook, review & feedback dosen | Mahasiswa, Dosen |
| P9 | Peminjaman Alat & Inventaris | Kelola inventaris, ajukan & approve peminjaman, laporan | Dosen, Laboran, Admin |
| P10 | Pengumuman | Buat pengumuman (Admin), distribusi & lihat semua role | Admin, Dosen, Laboran, Mahasiswa |
| P11 | Sinkronisasi Offline (PWA) | Deteksi jaringan, cache, antrian offline, background sync, resolusi konflik | Semua, Supabase |

### 3.3 Deskripsi Data Store Level 1

| ID | Nama | Teknologi | Isi |
|----|------|-----------|-----|
| D1 | Database Supabase | PostgreSQL | Semua data utama (15 tabel) |
| D2 | IndexedDB Cache | Browser IndexedDB | Cache data untuk akses offline |
| D3 | Offline Queue | Browser IndexedDB | Antrian operasi saat offline |

---

## 4. DFD LEVEL 2

### 4.1 P1 — Autentikasi (Detail)

```mermaid
graph TB
    subgraph "Entitas"
        User[Admin/Dosen/Laboran/Mahasiswa]
        SupabaseAuth[Supabase Auth]
    end

    subgraph "Proses Autentikasi"
        P1_1[1.1\nValidasi Kredensial]
        P1_2[1.2\nGenerate Session Token]
        P1_3[1.3\nDeteksi Role & Redirect]
        P1_4[1.4\nLogout & Clear Session]
    end

    subgraph "Data Store"
        D1_1[(Tabel users\n& profiles)]
        D1_2[(Session\nStorage)]
    end

    User -->|Email & password| P1_1
    P1_1 <-->|Cek kredensial| SupabaseAuth
    P1_1 <-->|Ambil data profil & role| D1_1
    P1_1 -->|Kredensial valid| P1_2
    P1_1 -->|Kredensial tidak valid| User

    P1_2 -->|JWT token| P1_3
    P1_3 -->|Simpan session| D1_2
    P1_3 -->|Redirect ke dashboard sesuai role| User

    User -->|Klik logout| P1_4
    P1_4 -->|Hapus session| D1_2
    P1_4 -->|Redirect ke login| User
```

**Sub-proses:**
| Sub-ID | Nama | Deskripsi |
|--------|------|-----------|
| 1.1 | Validasi Kredensial | Kirim email & password ke Supabase Auth untuk diverifikasi |
| 1.2 | Generate Session Token | Buat JWT token setelah login berhasil |
| 1.3 | Deteksi Role & Redirect | Cek role user, redirect ke dashboard yang sesuai |
| 1.4 | Logout & Clear Session | Hapus session token, redirect ke halaman login |

---

### 4.2 P2 — Kelola Jadwal (Detail)

```mermaid
graph TB
    subgraph "Entitas"
        Dosen
        Laboran
        Mahasiswa
    end

    subgraph "Proses Jadwal"
        P2_1[2.1\nBuat Jadwal]
        P2_2[2.2\nApprove Jadwal]
        P2_3[2.3\nLihat Jadwal]
        P2_4[2.4\nCache Jadwal Offline]
    end

    subgraph "Data Store"
        D2_1[(Tabel jadwal)]
        D2_2[(IndexedDB\nCache)]
    end

    Dosen -->|Data jadwal baru| P2_1
    P2_1 <-->|INSERT jadwal| D2_1
    P2_1 -->|Jadwal menunggu approve| Laboran

    Laboran -->|Keputusan approve/tolak| P2_2
    P2_2 <-->|UPDATE status jadwal| D2_1
    P2_2 -->|Jadwal aktif| Dosen

    Mahasiswa -->|Request jadwal| P2_3
    Dosen -->|Request jadwal mengajar| P2_3
    Laboran -->|Request jadwal lab| P2_3
    P2_3 <-->|Query jadwal| D2_1
    P2_3 <-->|Cache jadwal| D2_2
    P2_3 -->|Tampilkan jadwal| Mahasiswa
    P2_3 -->|Tampilkan jadwal| Dosen
    P2_3 -->|Tampilkan jadwal lab| Laboran

    P2_3 -->|Simpan ke cache| P2_4
    P2_4 <-->|Store IndexedDB| D2_2
```

**Sub-proses:**
| Sub-ID | Nama | Deskripsi |
|--------|------|-----------|
| 2.1 | Buat Jadwal | Dosen buat jadwal praktikum (hari, jam, lab, kelas) |
| 2.2 | Approve Jadwal | Laboran approve atau tolak jadwal yang diajukan |
| 2.3 | Lihat Jadwal | Semua role melihat jadwal sesuai akses masing-masing |
| 2.4 | Cache Jadwal Offline | Simpan jadwal ke IndexedDB untuk akses offline |

---

### 4.3 P3 — Kelola Kuis & Bank Soal (Detail)

```mermaid
graph TB
    subgraph "Entitas"
        Dosen
        Mahasiswa
    end

    subgraph "Proses Kuis"
        P3_1[3.1\nBuat Kuis]
        P3_2[3.2\nKelola Bank Soal]
        P3_3[3.3\nPublish Kuis]
        P3_4[3.4\nKerjakan Kuis\nOnline/Offline]
        P3_5[3.5\nAuto-save Offline]
        P3_6[3.6\nSubmit &\nAuto-grading]
        P3_7[3.7\nLihat Hasil Kuis]
    end

    subgraph "Data Store"
        D3_1[(Tabel kuis\n& soal)]
        D3_2[(Tabel\nbank_soal)]
        D3_3[(Tabel\nkuis_submission)]
        D3_4[(IndexedDB\nCache)]
        D3_5[(Offline\nQueue)]
    end

    Dosen -->|Judul, durasi, tanggal, kelas| P3_1
    P3_1 <-->|INSERT kuis| D3_1
    P3_1 -->|Tambah soal dari bank| P3_2

    Dosen -->|Data soal baru| P3_2
    P3_2 <-->|CRUD bank soal| D3_2
    P3_2 -->|Soal ditambahkan ke kuis| P3_1

    Dosen -->|Toggle publish| P3_3
    P3_3 <-->|UPDATE is_published| D3_1
    P3_3 <-->|Cache kuis ke IndexedDB| D3_4
    P3_3 -->|Kuis tersedia| Mahasiswa

    Mahasiswa -->|Buka & jawab kuis| P3_4
    P3_4 <-->|Ambil soal dari DB/Cache| D3_1
    P3_4 <-->|Ambil soal offline| D3_4
    P3_4 -->|Online: langsung submit| P3_6
    P3_4 -->|Offline: auto-save| P3_5

    P3_5 <-->|Simpan jawaban ke queue| D3_5
    P3_5 -->|Notifikasi tersimpan offline| Mahasiswa

    P3_6 <-->|INSERT submission| D3_3
    P3_6 <-->|Sync dari queue offline| D3_5
    P3_6 -->|Nilai & hasil| Mahasiswa

    Dosen -->|Request hasil| P3_7
    P3_7 <-->|Query submission| D3_3
    P3_7 -->|Statistik & rekap nilai| Dosen
    P3_7 -->|Nilai per mahasiswa| Dosen
```

**Sub-proses:**
| Sub-ID | Nama | Deskripsi |
|--------|------|-----------|
| 3.1 | Buat Kuis | Dosen buat kuis dengan judul, durasi, tanggal, assign ke kelas |
| 3.2 | Kelola Bank Soal | Dosen tambah/edit/hapus soal di bank soal, bisa digunakan ulang |
| 3.3 | Publish Kuis | Kuis diaktifkan, cache ke IndexedDB agar mahasiswa bisa akses offline |
| 3.4 | Kerjakan Kuis | Mahasiswa jawab soal, deteksi online/offline otomatis |
| 3.5 | Auto-save Offline | Jawaban disimpan ke IndexedDB saat offline, sync otomatis saat online |
| 3.6 | Submit & Auto-grading | Jawaban disubmit, nilai dihitung otomatis berdasarkan kunci jawaban |
| 3.7 | Lihat Hasil Kuis | Dosen lihat statistik, rekap nilai, dan jawaban per mahasiswa |

---

### 4.4 P4 — Kelola Materi (Detail)

```mermaid
graph TB
    subgraph "Entitas"
        Dosen
        Mahasiswa
        Storage[Supabase Storage]
    end

    subgraph "Proses Materi"
        P4_1[4.1\nUpload Materi]
        P4_2[4.2\nList Materi]
        P4_3[4.3\nAkses & Download]
        P4_4[4.4\nHapus Materi]
        P4_5[4.5\nCache Offline]
    end

    subgraph "Data Store"
        D4_1[(Tabel materi\nmetadata)]
        D4_2[(Supabase\nStorage Bucket)]
        D4_3[(IndexedDB\nCache)]
    end

    Dosen -->|File + judul + kelas| P4_1
    P4_1 -->|Upload file| Storage
    Storage -->|File URL| P4_1
    P4_1 <-->|Simpan metadata| D4_1
    P4_1 -->|Upload berhasil| Dosen

    Mahasiswa -->|Request daftar materi| P4_2
    Dosen -->|Request daftar materi| P4_2
    P4_2 <-->|Query materi per kelas| D4_1
    P4_2 -->|Daftar materi| Mahasiswa
    P4_2 -->|Daftar materi| Dosen

    Mahasiswa -->|Klik materi| P4_3
    P4_3 <-->|Ambil file URL| D4_2
    P4_3 -->|Simpan ke cache| P4_5
    P4_3 -->|File materi| Mahasiswa

    Dosen -->|Request hapus| P4_4
    P4_4 -->|Hapus file| Storage
    P4_4 <-->|Hapus metadata| D4_1
    P4_4 -->|Hapus berhasil| Dosen

    P4_5 <-->|Store file/URL| D4_3
```

**Sub-proses:**
| Sub-ID | Nama | Deskripsi |
|--------|------|-----------|
| 4.1 | Upload Materi | Dosen upload file (PDF, video, dll) ke Supabase Storage, simpan metadata |
| 4.2 | List Materi | Tampilkan daftar materi berdasarkan kelas yang diikuti |
| 4.3 | Akses & Download | Mahasiswa buka atau download file materi |
| 4.4 | Hapus Materi | Dosen hapus materi dari storage dan database |
| 4.5 | Cache Offline | File/URL materi di-cache ke IndexedDB untuk akses offline |

---

### 4.5 P5 — Kelola Kelas & Mata Kuliah (Detail)

```mermaid
graph TB
    subgraph "Entitas"
        Admin
        Dosen
        Mahasiswa
    end

    subgraph "Proses Kelas & MK"
        P5_1[5.1\nBuat Mata Kuliah]
        P5_2[5.2\nBuat Kelas &\nAssign Dosen]
        P5_3[5.3\nAssign MK\nke Kelas]
        P5_4[5.4\nEnrollment\nMahasiswa]
        P5_5[5.5\nLihat Kelas]
    end

    subgraph "Data Store"
        D5_1[(Tabel\nmata_kuliah)]
        D5_2[(Tabel kelas)]
        D5_3[(Tabel\nmahasiswa_kelas)]
    end

    Admin -->|Nama & kode MK| P5_1
    P5_1 <-->|INSERT mata_kuliah| D5_1
    P5_1 -->|MK tersimpan| Admin

    Admin -->|Nama kelas, assign dosen| P5_2
    P5_2 <-->|INSERT kelas| D5_2
    P5_2 -->|Kelas tersimpan| Admin

    Admin -->|Pilih MK untuk kelas| P5_3
    P5_3 <-->|UPDATE kelas.mata_kuliah_id| D5_2
    P5_3 -->|Assignment tersimpan| Admin

    Admin -->|Pilih mahasiswa ke kelas| P5_4
    P5_4 <-->|INSERT mahasiswa_kelas| D5_3
    P5_4 -->|Enrollment berhasil| Admin

    Dosen -->|Request kelas saya| P5_5
    Mahasiswa -->|Request kelas saya| P5_5
    P5_5 <-->|Query kelas & anggota| D5_2
    P5_5 <-->|Query enrollment| D5_3
    P5_5 -->|Info kelas & mahasiswa| Dosen
    P5_5 -->|Info kelas yang diikuti| Mahasiswa
```

**Sub-proses:**
| Sub-ID | Nama | Deskripsi |
|--------|------|-----------|
| 5.1 | Buat Mata Kuliah | Admin tambah mata kuliah dengan nama, kode, SKS |
| 5.2 | Buat Kelas & Assign Dosen | Admin buat kelas dan assign dosen pengampu |
| 5.3 | Assign MK ke Kelas | Admin assign mata kuliah ke kelas |
| 5.4 | Enrollment Mahasiswa | Admin daftarkan mahasiswa ke kelas tertentu |
| 5.5 | Lihat Kelas | Dosen & mahasiswa lihat kelas yang terlibat |

---

### 4.6 P6 — Kelola User (Detail)

```mermaid
graph TB
    subgraph "Entitas"
        Admin
        SupabaseAuth[Supabase Auth]
        SemuaRole[Semua Role]
    end

    subgraph "Proses User"
        P6_1[6.1\nTambah User]
        P6_2[6.2\nEdit User]
        P6_3[6.3\nNonaktifkan User]
        P6_4[6.4\nFilter & Cari User]
        P6_5[6.5\nEdit Profil Sendiri]
    end

    subgraph "Data Store"
        D6_1[(Supabase\nAuth Users)]
        D6_2[(Tabel users\n& profiles)]
    end

    Admin -->|Data user baru| P6_1
    P6_1 -->|Buat akun auth| SupabaseAuth
    SupabaseAuth -->|User ID| P6_1
    P6_1 <-->|INSERT profil| D6_2
    P6_1 -->|User berhasil dibuat| Admin

    Admin -->|Data yang diubah| P6_2
    P6_2 <-->|UPDATE profil| D6_2
    P6_2 -->|Profil terupdate| Admin

    Admin -->|Pilih user nonaktif| P6_3
    P6_3 <-->|UPDATE is_active = false| D6_2
    P6_3 -->|User dinonaktifkan| Admin

    Admin -->|Filter berdasarkan role| P6_4
    P6_4 <-->|Query dengan filter| D6_2
    P6_4 -->|Daftar user terfilter| Admin

    SemuaRole -->|Data profil sendiri| P6_5
    P6_5 <-->|UPDATE profil sendiri| D6_2
    P6_5 -->|Profil terupdate| SemuaRole
```

**Sub-proses:**
| Sub-ID | Nama | Deskripsi |
|--------|------|-----------|
| 6.1 | Tambah User | Admin buat akun baru (auth + profil) untuk semua role |
| 6.2 | Edit User | Admin ubah data profil user |
| 6.3 | Nonaktifkan User | Admin nonaktifkan akun (is_active = false) |
| 6.4 | Filter & Cari User | Admin filter user berdasarkan role, nama, atau email |
| 6.5 | Edit Profil Sendiri | Semua role dapat edit profil masing-masing |

---

### 4.7 P7 — Kehadiran & Penilaian (Detail)

```mermaid
graph TB
    subgraph "Entitas"
        Dosen
        Mahasiswa
    end

    subgraph "Proses Kehadiran & Nilai"
        P7_1[7.1\nInput Kehadiran]
        P7_2[7.2\nRekap Kehadiran]
        P7_3[7.3\nLihat Presensi]
        P7_4[7.4\nInput Penilaian]
        P7_5[7.5\nLihat Nilai]
    end

    subgraph "Data Store"
        D7_1[(Tabel\nkehadiran)]
        D7_2[(Tabel nilai)]
    end

    Dosen -->|Tandai hadir/absen| P7_1
    P7_1 <-->|INSERT kehadiran| D7_1
    P7_1 -->|Kehadiran tersimpan| Dosen

    Dosen -->|Request rekap| P7_2
    P7_2 <-->|Query kehadiran per kelas| D7_1
    P7_2 -->|Rekap & statistik kehadiran| Dosen

    Mahasiswa -->|Request presensi| P7_3
    P7_3 <-->|Query kehadiran mahasiswa| D7_1
    P7_3 -->|Rekap presensi pribadi| Mahasiswa

    Dosen -->|Input nilai per mahasiswa| P7_4
    P7_4 <-->|INSERT/UPDATE nilai| D7_2
    P7_4 -->|Nilai tersimpan| Dosen

    Mahasiswa -->|Request nilai| P7_5
    P7_5 <-->|Query nilai mahasiswa| D7_2
    P7_5 -->|Rekap nilai per mata kuliah| Mahasiswa
```

**Sub-proses:**
| Sub-ID | Nama | Deskripsi |
|--------|------|-----------|
| 7.1 | Input Kehadiran | Dosen tandai hadir/tidak hadir per mahasiswa per pertemuan |
| 7.2 | Rekap Kehadiran | Dosen lihat rekap & statistik kehadiran per kelas |
| 7.3 | Lihat Presensi | Mahasiswa lihat rekap kehadiran pribadi |
| 7.4 | Input Penilaian | Dosen input nilai per mahasiswa per mata kuliah |
| 7.5 | Lihat Nilai | Mahasiswa lihat rekap nilai per mata kuliah |

---

### 4.8 P8 — Logbook Digital (Detail)

```mermaid
graph TB
    subgraph "Entitas"
        Mahasiswa
        Dosen
    end

    subgraph "Proses Logbook"
        P8_1[8.1\nBuat Entri Logbook]
        P8_2[8.2\nLihat Logbook]
        P8_3[8.3\nReview &\nBeri Feedback]
    end

    subgraph "Data Store"
        D8_1[(Tabel logbook)]
    end

    Mahasiswa -->|Judul & isi kegiatan| P8_1
    P8_1 <-->|INSERT entri logbook| D8_1
    P8_1 -->|Entri tersimpan| Mahasiswa

    Mahasiswa -->|Request logbook saya| P8_2
    Dosen -->|Request logbook mahasiswa| P8_2
    P8_2 <-->|Query logbook| D8_1
    P8_2 -->|Daftar entri logbook| Mahasiswa
    P8_2 -->|Logbook semua mahasiswa| Dosen

    Dosen -->|Feedback & catatan| P8_3
    P8_3 <-->|UPDATE logbook dengan feedback| D8_1
    P8_3 -->|Feedback tersimpan| Dosen
    P8_3 -->|Notifikasi feedback| Mahasiswa
```

**Sub-proses:**
| Sub-ID | Nama | Deskripsi |
|--------|------|-----------|
| 8.1 | Buat Entri Logbook | Mahasiswa catat kegiatan praktikum harian |
| 8.2 | Lihat Logbook | Mahasiswa lihat logbook sendiri, Dosen lihat logbook semua mahasiswa |
| 8.3 | Review & Beri Feedback | Dosen beri catatan/feedback pada entri logbook mahasiswa |

---

### 4.9 P9 — Peminjaman Alat & Inventaris (Detail)

```mermaid
graph TB
    subgraph "Entitas"
        Dosen
        Laboran
        Admin
    end

    subgraph "Proses Peminjaman"
        P9_1[9.1\nKelola Inventaris]
        P9_2[9.2\nAjukan Peminjaman]
        P9_3[9.3\nApprove/Tolak\nPeminjaman]
        P9_4[9.4\nMonitor Peminjaman\nAktif]
        P9_5[9.5\nProses Pengembalian]
        P9_6[9.6\nLihat Laporan]
    end

    subgraph "Data Store"
        D9_1[(Tabel\ninventaris)]
        D9_2[(Tabel\npeminjaman)]
    end

    Laboran -->|Data alat, stok, kondisi| P9_1
    P9_1 <-->|CRUD inventaris| D9_1
    P9_1 -->|Stok terupdate| Laboran

    Dosen -->|Pilih alat, jumlah, tanggal| P9_2
    P9_2 <-->|INSERT peminjaman| D9_2
    P9_2 -->|Status: pending| Laboran

    Laboran -->|Keputusan approve/tolak| P9_3
    Admin -->|Keputusan approve/tolak| P9_3
    P9_3 <-->|UPDATE status peminjaman| D9_2
    P9_3 <-->|UPDATE stok inventaris| D9_1
    P9_3 -->|Status peminjaman| Dosen

    Laboran -->|Request monitor| P9_4
    Admin -->|Request monitor| P9_4
    P9_4 <-->|Query peminjaman aktif| D9_2
    P9_4 -->|Daftar peminjaman aktif| Laboran
    P9_4 -->|Daftar peminjaman aktif| Admin

    Laboran -->|Konfirmasi pengembalian| P9_5
    P9_5 <-->|UPDATE status jadi returned| D9_2
    P9_5 <-->|UPDATE stok inventaris| D9_1
    P9_5 -->|Pengembalian tercatat| Laboran

    Laboran -->|Request laporan| P9_6
    P9_6 <-->|Query riwayat peminjaman| D9_2
    P9_6 <-->|Query statistik inventaris| D9_1
    P9_6 -->|Laporan peminjaman & inventaris| Laboran
```

**Sub-proses:**
| Sub-ID | Nama | Deskripsi |
|--------|------|-----------|
| 9.1 | Kelola Inventaris | Laboran CRUD alat: nama, stok, kondisi, kategori, foto |
| 9.2 | Ajukan Peminjaman | Dosen ajukan permohonan peminjaman alat dengan tanggal |
| 9.3 | Approve/Tolak | Laboran/Admin approve atau tolak permohonan peminjaman |
| 9.4 | Monitor Aktif | Laboran & Admin pantau semua peminjaman yang sedang berjalan |
| 9.5 | Proses Pengembalian | Laboran konfirmasi alat dikembalikan, stok terupdate |
| 9.6 | Lihat Laporan | Laporan statistik peminjaman dan penggunaan inventaris |

---

### 4.10 P10 — Pengumuman (Detail)

```mermaid
graph TB
    subgraph "Entitas"
        Admin
        Dosen
        Laboran
        Mahasiswa
    end

    subgraph "Proses Pengumuman"
        P10_1[10.1\nBuat Pengumuman]
        P10_2[10.2\nDistribusi\nke Role]
        P10_3[10.3\nLihat Pengumuman]
    end

    subgraph "Data Store"
        D10_1[(Tabel\npengumuman)]
        D10_2[(IndexedDB\nCache)]
    end

    Admin -->|Judul, isi, target role| P10_1
    P10_1 <-->|INSERT pengumuman| D10_1
    P10_1 -->|Pengumuman tersimpan| P10_2

    P10_2 <-->|Cache pengumuman| D10_2
    P10_2 -->|Pengumuman tersedia| Mahasiswa
    P10_2 -->|Pengumuman tersedia| Dosen
    P10_2 -->|Pengumuman tersedia| Laboran

    Mahasiswa -->|Request pengumuman| P10_3
    Dosen -->|Request pengumuman| P10_3
    Laboran -->|Request pengumuman| P10_3
    P10_3 <-->|Query pengumuman| D10_1
    P10_3 <-->|Ambil dari cache| D10_2
    P10_3 -->|Daftar pengumuman| Mahasiswa
    P10_3 -->|Daftar pengumuman| Dosen
    P10_3 -->|Daftar pengumuman| Laboran
```

**Sub-proses:**
| Sub-ID | Nama | Deskripsi |
|--------|------|-----------|
| 10.1 | Buat Pengumuman | Admin buat pengumuman dengan judul, isi, target role |
| 10.2 | Distribusi ke Role | Pengumuman otomatis tersedia untuk role yang dituju |
| 10.3 | Lihat Pengumuman | Semua role dapat melihat pengumuman yang ditujukan untuk mereka |

---

### 4.11 P11 — Sinkronisasi Offline / PWA (Detail)

```mermaid
graph TB
    subgraph "Entitas"
        SemuaUser[Semua Pengguna]
        Supabase
    end

    subgraph "Proses Offline Sync"
        P11_1[11.1\nDeteksi Status\nJaringan]
        P11_2[11.2\nCache Data\nRead Offline]
        P11_3[11.3\nAntrian Operasi\nWrite Offline]
        P11_4[11.4\nBackground Sync]
        P11_5[11.5\nDeteksi & Resolusi\nKonflik]
    end

    subgraph "Data Store"
        D11_1[(IndexedDB\nCache)]
        D11_2[(Offline\nQueue)]
        D11_3[(Conflict\nLog)]
        D11_4[(Database\nSupabase)]
    end

    SemuaUser -->|Buka halaman| P11_1
    P11_1 -->|Status: Online| P11_2
    P11_1 -->|Status: Offline| P11_3
    P11_1 -->|Status: Online kembali| P11_4

    P11_2 <-->|Simpan data ke cache| D11_1
    P11_2 -->|Data dari cache| SemuaUser

    SemuaUser -->|Operasi write saat offline| P11_3
    P11_3 <-->|Masukkan ke antrian| D11_2
    P11_3 -->|Notifikasi tersimpan offline| SemuaUser

    P11_4 <-->|Ambil antrian| D11_2
    P11_4 <-->|Kirim ke server| D11_4
    P11_4 <-->|Sync dengan Supabase| Supabase
    P11_4 -->|Cek konflik| P11_5
    P11_4 -->|Sync berhasil| SemuaUser

    P11_5 <-->|Bandingkan data lokal vs server| D11_4
    P11_5 <-->|Catat konflik| D11_3
    P11_5 -->|Tampilkan konflik ke user| SemuaUser
    SemuaUser -->|Pilih versi lokal/server| P11_5
    P11_5 <-->|Terapkan resolusi| D11_4
```

**Sub-proses:**
| Sub-ID | Nama | Deskripsi |
|--------|------|-----------|
| 11.1 | Deteksi Status Jaringan | Monitor status online/offline/unstable secara real-time |
| 11.2 | Cache Data Read Offline | Simpan data ke IndexedDB saat online agar bisa dibaca offline |
| 11.3 | Antrian Write Offline | Operasi insert/update saat offline masuk ke antrian IndexedDB |
| 11.4 | Background Sync | Proses antrian secara otomatis saat koneksi kembali online |
| 11.5 | Deteksi & Resolusi Konflik | Deteksi data konflik antara lokal dan server, user pilih versi yang benar |

---

## 5. DATA DICTIONARY

### 5.1 Aliran Data Utama

| ID | Nama Aliran | Dari | Ke | Deskripsi |
|----|-------------|------|----|-----------|
| DF1 | Kredensial Login | User | P1 | Email & password untuk autentikasi |
| DF2 | Session Token | P1 | User | JWT token + role setelah login berhasil |
| DF3 | Data Jadwal | Dosen | P2 | Hari, jam, lab, kelas praktikum |
| DF4 | Jadwal Aktif | P2 | Mahasiswa/Dosen | Jadwal yang sudah diapprove |
| DF5 | Data Kuis | Dosen | P3 | Judul, durasi, soal, kunci jawaban |
| DF6 | Jawaban Kuis | Mahasiswa | P3 | Pilihan jawaban per soal |
| DF7 | Nilai Kuis | P3 | Mahasiswa | Skor hasil pengerjaan kuis |
| DF8 | File Materi | Dosen | P4 | File PDF/video materi pembelajaran |
| DF9 | Data Kehadiran | Dosen | P7 | Status hadir/tidak per mahasiswa |
| DF10 | Rekap Presensi | P7 | Mahasiswa | Persentase kehadiran |
| DF11 | Entri Logbook | Mahasiswa | P8 | Catatan kegiatan praktikum harian |
| DF12 | Feedback Logbook | Dosen | P8 | Catatan/penilaian dari dosen |
| DF13 | Permohonan Peminjaman | Dosen | P9 | Nama alat, jumlah, tanggal |
| DF14 | Status Peminjaman | P9 | Dosen | Approved/rejected/returned |
| DF15 | Data Pengumuman | Admin | P10 | Judul, isi, target role |
| DF16 | Data Offline | P11 | Supabase | Data tersinkron saat online kembali |

### 5.2 Elemen Data

| Elemen | Tipe | Contoh |
|--------|------|--------|
| user_id | UUID | "550e8400-..." |
| role | enum | admin / dosen / laboran / mahasiswa |
| kelas_id | UUID | "..." |
| kuis_id | UUID | "..." |
| durasi_menit | integer | 60 |
| status_peminjaman | enum | pending / approved / rejected / returned |
| status_kehadiran | enum | hadir / absen / izin / sakit |
| nilai | integer | 0–100 |
| is_published | boolean | true / false |
| cache_ttl | integer | 300000 (5 menit) |

---

## 6. RINGKASAN DFD

| Level | Jumlah Proses | Jumlah Entitas | Jumlah Data Store |
|-------|--------------|----------------|-------------------|
| Level 0 | 1 (sistem) | 5 | 1 |
| Level 1 | 11 | 5 | 3 |
| Level 2 | 47 sub-proses | 5 | 15+ |

**Level 2 Breakdown:**
- P1 Autentikasi: 4 sub-proses
- P2 Kelola Jadwal: 4 sub-proses
- P3 Kelola Kuis & Bank Soal: 7 sub-proses
- P4 Kelola Materi: 5 sub-proses
- P5 Kelola Kelas & MK: 5 sub-proses
- P6 Kelola User: 5 sub-proses
- P7 Kehadiran & Penilaian: 5 sub-proses
- P8 Logbook Digital: 3 sub-proses
- P9 Peminjaman & Inventaris: 6 sub-proses
- P10 Pengumuman: 3 sub-proses
- P11 Sinkronisasi Offline: 5 sub-proses

---

**Dibuat**: Februari 2026
**Versi**: 2.0 (Disesuaikan dengan fitur aktual aplikasi)
**Status**: ✅ Lengkap & Sesuai Aplikasi
