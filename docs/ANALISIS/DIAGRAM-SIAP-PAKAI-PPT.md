# Diagram Siap Pakai untuk PPT Ujian Hasil

Dokumen ini berisi diagram yang **sudah disesuaikan dengan aplikasi aktual**, bukan proposal awal. Gunakan diagram ini sebagai acuan untuk menggambar ulang di PowerPoint atau draw.io.

---

## 1. Use Case Diagram Final

Gunakan **4 aktor utama**:

- Admin
- Dosen
- Mahasiswa
- Laboran

### Daftar use case per aktor

**Admin**

- Login
- Kelola Pengguna
- Kelola Mata Kuliah
- Kelola Kelas
- Kelola Laboratorium
- Kelola Peralatan
- Approval Peminjaman
- Kelola Pengumuman
- Monitor Offline Sync

**Dosen**

- Login
- Kelola Jadwal Praktikum
- Kelola Kuis
- Kelola Bank Soal
- Kelola Materi
- Input Kehadiran
- Input Penilaian
- Review Logbook Mahasiswa
- Kelola Pengumuman

**Mahasiswa**

- Login
- Lihat Jadwal
- Akses Materi
- Kerjakan Kuis
- Isi Logbook
- Lihat Nilai
- Lihat Presensi
- Lihat Pengumuman
- Sinkronisasi Offline

**Laboran**

- Login
- Kelola Inventaris
- Persetujuan Jadwal Lab
- Persetujuan Peminjaman Alat
- Monitor Peminjaman Aktif
- Kelola Laboratorium
- Lihat Laporan
- Kelola Pengumuman

### Bentuk diagram teks

```text
                    +------------------------------------------------+
                    |  Sistem Informasi Praktikum Berbasis PWA       |
                    +------------------------------------------------+

Admin ---------> (Login)
Admin ---------> (Kelola Pengguna)
Admin ---------> (Kelola Mata Kuliah)
Admin ---------> (Kelola Kelas)
Admin ---------> (Kelola Laboratorium)
Admin ---------> (Kelola Peralatan)
Admin ---------> (Approval Peminjaman)
Admin ---------> (Kelola Pengumuman)
Admin ---------> (Monitor Offline Sync)

Dosen ---------> (Login)
Dosen ---------> (Kelola Jadwal Praktikum)
Dosen ---------> (Kelola Kuis)
Dosen ---------> (Kelola Bank Soal)
Dosen ---------> (Kelola Materi)
Dosen ---------> (Input Kehadiran)
Dosen ---------> (Input Penilaian)
Dosen ---------> (Review Logbook Mahasiswa)
Dosen ---------> (Kelola Pengumuman)

Mahasiswa -----> (Login)
Mahasiswa -----> (Lihat Jadwal)
Mahasiswa -----> (Akses Materi)
Mahasiswa -----> (Kerjakan Kuis)
Mahasiswa -----> (Isi Logbook)
Mahasiswa -----> (Lihat Nilai)
Mahasiswa -----> (Lihat Presensi)
Mahasiswa -----> (Lihat Pengumuman)
Mahasiswa -----> (Sinkronisasi Offline)

Laboran -------> (Login)
Laboran -------> (Kelola Inventaris)
Laboran -------> (Persetujuan Jadwal Lab)
Laboran -------> (Persetujuan Peminjaman Alat)
Laboran -------> (Monitor Peminjaman Aktif)
Laboran -------> (Kelola Laboratorium)
Laboran -------> (Lihat Laporan)
Laboran -------> (Kelola Pengumuman)
```

### Versi ringkas untuk PPT

Kalau slide sempit, cukup tampilkan ini:

```text
Admin     -> Kelola sistem inti, pengguna, kelas, laboratorium, peminjaman
Dosen     -> Kelola jadwal, materi, kuis, nilai, kehadiran, review logbook
Mahasiswa -> Akses jadwal, materi, kuis, logbook, nilai, presensi, pengumuman
Laboran   -> Kelola inventaris, jadwal lab, peminjaman, laporan
```

---

## 2. Diagram Arsitektur Sistem PWA Final

Diagram ini harus menunjukkan bahwa aplikasi Anda adalah:

- multi-role,
- berbasis PWA,
- memiliki dukungan offline,
- dan terhubung ke Supabase.

### Komponen utama arsitektur

**Lapisan Pengguna**

- Admin
- Dosen
- Mahasiswa
- Laboran

**Lapisan Frontend**

- React
- TypeScript
- Vite
- Tailwind CSS
- App Layout
- ProtectedRoute
- RoleGuard

**Lapisan Offline/PWA**

- Service Worker
- Cache Storage
- IndexedDB
- Offline Queue
- Background Sync
- Network Status Detector

**Lapisan Backend**

- Supabase Auth
- Supabase Database (PostgreSQL)
- Supabase Storage

**Lapisan Data**

- users
- mata_kuliah
- kelas
- jadwal
- materi
- kuis
- soal
- jawaban
- kehadiran
- nilai
- logbook
- inventaris
- peminjaman
- pengumuman

### Bentuk diagram teks

```text
 [Admin]   [Dosen]   [Mahasiswa]   [Laboran]
      \        |         |           /
       \       |         |          /
        +----------------------------------+
        |        Frontend PWA App          |
        | React + TypeScript + Vite        |
        | Tailwind + RoleGuard + Layout    |
        +----------------------------------+
                      |
                      v
        +----------------------------------+
        |       Offline / PWA Layer        |
        | Service Worker                   |
        | Cache Storage                    |
        | IndexedDB                        |
        | Offline Queue                    |
        | Background Sync                  |
        | Network Status Detector          |
        +----------------------------------+
               |                    |
               | online             | offline sementara
               v                    v
        +----------------------------------+
        |         Supabase Backend         |
        | Auth | PostgreSQL | Storage      |
        +----------------------------------+
                      |
                      v
        +----------------------------------+
        |             Data Utama           |
        | users, kelas, jadwal, materi,    |
        | kuis, nilai, logbook, inventaris,|
        | peminjaman, pengumuman           |
        +----------------------------------+
```

### Alur penjelasan saat sidang

Jelaskan begini:

- pengguna mengakses aplikasi melalui browser/mobile sebagai PWA,
- frontend menangani tampilan dan pembatasan akses berbasis role,
- saat online data dikirim ke Supabase,
- saat offline data penting disimpan di cache, IndexedDB, dan offline queue,
- ketika koneksi kembali, background sync menyinkronkan data ke backend.

---

## 3. Diagram yang Paling Cocok untuk PPT

Untuk PPT ujian hasil, yang paling aman dimasukkan:

1. **Use Case Diagram**
2. **Diagram Arsitektur Sistem PWA**
3. **ERD ringkas** (opsional, sebagai cadangan)

---

## 4. Penempatan di Slide PPT

**Use Case Diagram**

- letakkan di slide `GAMBARAN & FITUR SISTEM`

**Arsitektur Sistem PWA**

- letakkan di slide `TEKNOLOGI & ARSITEKTUR`

**ERD ringkas**

- letakkan di lampiran/cadangan, tidak wajib di slide utama

---

## 5. Saran Visual Supaya Mudah Dibaca

- Gunakan maksimal 4 aktor pada use case
- Jangan tampilkan semua use case detail jika slide sempit
- Gunakan 4 lapis kotak pada arsitektur: pengguna -> frontend -> offline layer -> backend
- Gunakan panah lurus ke bawah agar mudah dijelaskan
- Hindari teks terlalu kecil

---

## 6. Versi Super Ringkas untuk Langsung Digambar di PowerPoint

### Use Case Ringkas

```text
Admin     -> kelola pengguna, kelas, laboratorium, peminjaman, pengumuman
Dosen     -> kelola jadwal, materi, kuis, nilai, kehadiran, review logbook
Mahasiswa -> akses jadwal, materi, kuis, logbook, nilai, presensi
Laboran   -> kelola inventaris, jadwal lab, peminjaman, laporan
```

### Arsitektur Ringkas

```text
Pengguna
   -> Frontend PWA (React + TS + Vite)
   -> Offline Layer (SW + Cache + IndexedDB + Queue + Sync)
   -> Supabase (Auth + DB + Storage)
   -> Data Praktikum
```
