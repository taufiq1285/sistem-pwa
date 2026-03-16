# Dokumen Alur Terpadu DFD Level 2
## Sistem Informasi Praktikum PWA

Dokumen ini menyajikan **alur terpadu** untuk seluruh DFD Level 2 (11 diagram), sehingga pembahasan tidak dibaca terpisah per file, tetapi sebagai satu rantai proses sistem dari autentikasi, layanan akademik, operasional laboratorium, hingga sinkronisasi offline.

---

## 1. Ruang Lingkup Diagram Sumber

Alur terpadu ini disusun dari diagram:

1. `docs/DFD-Level2-1.1-Autentikasi-Yourdon.drawio`
2. `docs/DFD-Level2-1.2-Kelola-User-Yourdon.drawio`
3. `docs/DFD-Level2-2.1-Kelola-Jadwal-Yourdon.drawio`
4. `docs/DFD-Level2-2.2-Kelola-Kuis-dan-Bank-Soal-Yourdon.drawio`
5. `docs/DFD-Level2-2.3-Kelola-Materi-Yourdon.drawio`
6. `docs/DFD-Level2-2.4-Kelola-Kelas-Mata-Kuliah-dan-Assignment-Yourdon.drawio`
7. `docs/DFD-Level2-2.5-Kehadiran-dan-Penilaian-Yourdon.drawio`
8. `docs/DFD-Level2-3.1-Logbook-Digital-Yourdon.drawio`
9. `docs/DFD-Level2-3.2-Peminjaman-Alat-dan-Inventaris-Yourdon.drawio`
10. `docs/DFD-Level2-3.3-Pengumuman-dan-Notifikasi-Yourdon.drawio`
11. `docs/DFD-Level2-4.1-Sinkronisasi-Offline-PWA-Yourdon.drawio`

Acuan narasi utama: `docs/NARASI_DFD_LEVEL1_LEVEL2.md` dan `docs/DFD.md`.

---

## 2. Gambaran Besar Alur Terpadu

Secara menyeluruh, sistem berjalan dalam urutan konseptual berikut:

1. **Akses Sistem (1.1, 1.2)**  
   Pengguna masuk melalui autentikasi dan memperoleh hak akses berbasis role.
2. **Aktivitas Akademik (2.1–2.5)**  
   Data struktur akademik dibentuk, lalu jadwal/materi/kuis/presensi/nilai dikelola.
3. **Layanan Operasional (3.1–3.3)**  
   Aktivitas logbook, inventaris/peminjaman, dan pengumuman berjalan paralel.
4. **Ketahanan PWA (4.1)**  
   Saat offline, data dicache/diantrekan; saat online kembali, data disinkronkan.

Dengan demikian, setiap proses Level 2 adalah bagian dari satu siklus: **input → validasi → simpan → distribusi → sinkronisasi**.

---

## 3. Alur Terpadu per Domain

### 3.1 Domain Akses dan Otorisasi

#### A. Proses 1.1 Autentikasi
- Pengguna mengirim email dan password.
- Sistem memverifikasi ke layanan autentikasi eksternal.
- Jika valid, sistem ambil role dari data user/role.
- Sistem membentuk session aktif.
- Sistem redirect pengguna sesuai role.
- Logout mengakhiri session dan mengirim status logout.

#### B. Proses 1.2 Kelola User
- Admin membuat akun.
- Admin menetapkan role.
- Admin mengelola profil role.
- Admin mengubah status aktif/nonaktif.
- Admin menghapus/arsipkan user bila diperlukan.

**Keterkaitan 1.1 ↔ 1.2:**
- `1.2` menjaga kualitas data akun/role.
- `1.1` memakai data akun/role tersebut untuk otentikasi dan otorisasi saat runtime.

---

### 3.2 Domain Akademik Praktikum

#### A. Proses 2.4 sebagai Fondasi Struktur Akademik
- Admin kelola mata kuliah.
- Admin kelola kelas praktikum.
- Admin menetapkan dosen dan mahasiswa ke kelas.
- Dosen kelola assignment pada kelas terkait.
- Mahasiswa mengumpulkan submission tugas.
- Dosen dan mahasiswa mengakses data kelas serta assignment.

#### B. Proses 2.1 Kelola Jadwal
- Dosen ajukan/input jadwal.
- Sistem validasi kelas dan laboratorium.
- Laboran beri persetujuan.
- Jadwal dipublikasikan.
- Mahasiswa, dosen, laboran melihat jadwal.

#### C. Proses 2.3 Kelola Materi
- Dosen upload materi ke storage.
- Sistem simpan metadata ke database.
- Mahasiswa/dosen melihat daftar materi.
- Mahasiswa akses/unduh materi.
- Sistem dapat menyimpan cache offline.

#### D. Proses 2.2 Kelola Kuis dan Bank Soal
- Dosen buat kuis.
- Dosen kelola bank soal.
- Dosen publish kuis.
- Mahasiswa ambil soal dan kerjakan kuis.
- Jika offline: auto-save ke queue.
- Jika online/tersinkron: submit dan penilaian berjalan.
- Dosen melihat hasil/statistik.

#### E. Proses 2.5 Kehadiran dan Penilaian
- Dosen input kehadiran.
- Sistem validasi presensi.
- Dosen input nilai.
- Sistem hitung rekap nilai.
- Mahasiswa melihat hasil presensi dan nilai.

**Keterkaitan domain akademik:**
- `2.4` memasok struktur dasar untuk `2.1`, `2.2`, `2.3`, `2.5`.
- `2.1` (jadwal) menjadi referensi konteks aktivitas materi/kuis/presensi.
- `2.2`, `2.3`, `2.5` menghasilkan keluaran pembelajaran yang dikonsumsi mahasiswa dan dosen.

---

### 3.3 Domain Operasional Laboratorium

#### A. Proses 3.1 Logbook Digital
- Mahasiswa input entri logbook.
- Sistem simpan isi/lampiran.
- Dosen review logbook.
- Dosen beri feedback.
- Mahasiswa dan dosen melihat riwayat.

#### B. Proses 3.2 Peminjaman Alat dan Inventaris
- Laboran kelola inventaris.
- Dosen ajukan peminjaman.
- Laboran/admin verifikasi dan ambil keputusan.
- Sistem memantau peminjaman aktif.
- Laboran/admin menghasilkan laporan.

#### C. Proses 3.3 Pengumuman dan Notifikasi
- Admin buat pengumuman.
- Sistem simpan/publikasikan.
- Sistem distribusi berdasarkan role.
- Pengguna melihat daftar/detail.
- Admin arsipkan/hapus bila perlu.

**Keterkaitan domain operasional:**
- `3.1`, `3.2`, `3.3` berjalan sejajar dengan domain akademik.
- Data operasional tetap konsisten karena terhubung ke penyimpanan utama.

---

### 3.4 Domain PWA dan Sinkronisasi Offline

#### Proses 4.1 Sinkronisasi Offline PWA
- Sistem deteksi status jaringan online/offline.
- Data penting disimpan ke cache lokal.
- Operasi tulis saat offline disimpan ke queue.
- Ketika koneksi tersedia, queue diproses sinkron ke server.
- Sistem tangani konflik dan retry.
- Pengguna menerima status sinkronisasi.

**Keterkaitan 4.1 dengan proses lain:**
- `4.1` bukan proses terpisah dari fitur; `4.1` adalah lapisan ketahanan untuk seluruh proses 2.x dan 3.x (serta sebagian 1.x terkait session/token).

---

## 4. Rantai Aliran Data End-to-End (Narasi Tunggal)

Berikut rangkaian alur dari sudut pandang pengguna sistem:

1. Admin menyiapkan akun dan role (`1.2`).
2. Pengguna login dan memperoleh session sesuai role (`1.1`).
3. Admin menyiapkan struktur akademik kelas-mata kuliah-assignment (`2.4`).
4. Dosen/laboran mengelola jadwal hingga publikasi (`2.1`).
5. Dosen mengelola materi (`2.3`) dan kuis (`2.2`).
6. Dosen mencatat presensi/nilai dan sistem menyusun rekap (`2.5`).
7. Mahasiswa menjalankan aktivitas pendukung logbook (`3.1`).
8. Dosen/laboran/admin menangani inventaris dan peminjaman (`3.2`).
9. Admin mendistribusikan pengumuman/notifikasi (`3.3`).
10. Jika koneksi terganggu, operasi dicache/di-queue; saat online kembali, sinkronisasi memastikan konsistensi data (`4.1`).

Hasil akhirnya adalah sistem tetap konsisten, dapat dilacak, dan tetap operasional walau jaringan tidak stabil.

---

## 5. Matriks Singkat Keterkaitan Proses Level 2

| Proses | Input Kunci | Output Kunci | Ketergantungan Utama |
|---|---|---|---|
| 1.1 Autentikasi | email/password, data auth | session aktif, status login/logout | data role user, layanan auth |
| 1.2 Kelola User | data akun/role/status | akun valid siap pakai | admin, data user-role |
| 2.1 Kelola Jadwal | usulan jadwal | jadwal terpublikasi | struktur kelas & laboratorium |
| 2.2 Kuis dan Bank Soal | data kuis/soal/jawaban | hasil kuis & penilaian | jadwal/kelas, queue offline |
| 2.3 Kelola Materi | file + metadata | daftar/akses materi | storage file + metadata |
| 2.4 Kelas-MK-Assignment | data master relasi | relasi akademik aktif | admin sebagai pengelola |
| 2.5 Kehadiran-Penilaian | presensi + komponen nilai | rekap nilai/presensi | jadwal & peserta valid |
| 3.1 Logbook | entri + feedback | riwayat logbook | mahasiswa-dosen |
| 3.2 Peminjaman-Inventaris | data alat + permohonan | status pinjam + laporan | laboran/admin/dosen |
| 3.3 Pengumuman-Notifikasi | konten + target role | distribusi informasi | role pengguna |
| 4.1 Sinkronisasi Offline | status jaringan + queue | data tersinkron + status konflik | cache + queue + server |

---

## 6. Naskah Ringkas Siap Pakai (untuk Bab Skripsi)

DFD Level 2 pada sistem ini dibaca sebagai alur terpadu yang dimulai dari pengelolaan akun dan autentikasi, dilanjutkan ke pengelolaan akademik praktikum, kemudian ke layanan operasional laboratorium, dan ditopang mekanisme sinkronisasi offline berbasis PWA. Setiap proses mengolah data melalui tahapan input, validasi, penyimpanan, distribusi hasil, serta sinkronisasi. Dengan pendekatan ini, pembahasan DFD tidak terfragmentasi per gambar, melainkan menunjukkan kesinambungan proses end-to-end yang selaras dengan implementasi sistem aktif.

---

## 7. Catatan Penggunaan Dokumen

- Gunakan dokumen ini sebagai **pengantar alur besar** sebelum membahas tiap diagram detail.
- Gunakan dokumen `docs/NARASI_DFD_LEVEL1_LEVEL2.md` untuk pendalaman per proses.
- Saat menulis skripsi, tampilkan urutan: **alur terpadu → diagram detail per proses → narasi detail per proses**.

Dokumen ini ditujukan agar pembahasan DFD Level 2 menjadi konsisten, runtut, dan mudah dipahami penguji.