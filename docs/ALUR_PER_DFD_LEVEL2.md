# Dokumen Alur Per Masing-Masing DFD Level 2
## Sistem Informasi Praktikum PWA

Dokumen ini menyajikan narasi alur **per diagram DFD Level 2** secara terpisah agar mudah dipakai untuk penulisan skripsi pada subbab pembahasan tiap gambar.

Acuan utama: `docs/DFD.md` dan `docs/NARASI_DFD_LEVEL1_LEVEL2.md`.

---

## 1) DFD Level 2 — 1.1 Autentikasi
**File diagram:** `docs/DFD-Level2-1.1-Autentikasi-Yourdon.drawio`

### Tujuan
Memvalidasi login, mengambil role, membentuk session, mengarahkan akses berdasarkan role, dan menutup sesi (logout).

### Alur utama
1. Pengguna mengirim email dan password ke proses validasi kredensial.
2. Sistem memverifikasi ke layanan autentikasi eksternal.
3. Jika valid, sistem mengambil data role dari data store user-role.
4. Sistem membentuk session login aktif.
5. Sistem mengarahkan pengguna ke hak akses sesuai role.
6. Jika pengguna logout, sistem mengakhiri sesi dan mengirim status logout.

### Output kunci
Status login/logout dan hak akses pengguna sesuai role.

---

## 2) DFD Level 2 — 1.2 Kelola User
**File diagram:** `docs/DFD-Level2-1.2-Kelola-User-Yourdon.drawio`

### Tujuan
Mengelola akun pengguna oleh admin, meliputi pembuatan akun, penetapan role, pembaruan status, dan pengarsipan/penghapusan.

### Alur utama
1. Admin memasukkan data akun baru.
2. Sistem membuat akun dan menyimpan data user.
3. Admin menetapkan role pengguna.
4. Sistem menyimpan role dan membentuk hak akses.
5. Admin dapat memperbarui profil role.
6. Admin dapat mengubah status aktif/nonaktif user.
7. Admin dapat menghapus atau mengarsipkan user.

### Output kunci
Data user-role yang valid dan mutakhir untuk kebutuhan otorisasi.

---

## 3) DFD Level 2 — 2.1 Kelola Jadwal
**File diagram:** `docs/DFD-Level2-2.1-Kelola-Jadwal-Yourdon.drawio`

### Tujuan
Mengelola siklus jadwal praktikum dari usulan hingga publikasi.

### Alur utama
1. Dosen mengajukan data jadwal praktikum.
2. Sistem memvalidasi kesesuaian kelas/lab/waktu.
3. Laboran meninjau dan memberi persetujuan/penolakan.
4. Sistem menyimpan jadwal terverifikasi.
5. Jadwal dipublikasikan ke pengguna terkait.
6. Mahasiswa dan dosen melihat jadwal final.

### Output kunci
Jadwal praktikum terpublikasi dan konsisten.

---

## 4) DFD Level 2 — 2.2 Kelola Kuis dan Bank Soal
**File diagram:** `docs/DFD-Level2-2.2-Kelola-Kuis-dan-Bank-Soal-Yourdon.drawio`

### Tujuan
Mengelola kuis dari penyusunan soal, publikasi, pengerjaan, sampai hasil.

### Alur utama
1. Dosen membuat kuis dan menyusun bank soal.
2. Sistem menyimpan kuis, soal, dan pengaturan pengerjaan.
3. Dosen mempublikasikan kuis ke kelas target.
4. Mahasiswa mengambil soal dan mengerjakan kuis.
5. Jika offline, jawaban tersimpan ke antrean lokal.
6. Saat online, jawaban disinkronkan lalu dinilai.
7. Dosen melihat hasil, rekap, dan statistik kuis.

### Output kunci
Hasil kuis mahasiswa dan rekap evaluasi pembelajaran.

---

## 5) DFD Level 2 — 2.3 Kelola Materi
**File diagram:** `docs/DFD-Level2-2.3-Kelola-Materi-Yourdon.drawio`

### Tujuan
Mengelola unggah, penyimpanan metadata, distribusi, dan akses materi.

### Alur utama
1. Dosen mengunggah file materi.
2. Sistem menyimpan file pada storage dan metadata pada database.
3. Sistem mempublikasikan daftar materi ke kelas terkait.
4. Mahasiswa melihat daftar materi.
5. Mahasiswa mengakses/unduh materi yang dibutuhkan.
6. Untuk mode offline, data penting dapat dicache.

### Output kunci
Materi pembelajaran tersedia dan dapat diakses sesuai hak akses.

---

## 6) DFD Level 2 — 2.4 Kelola Kelas, Mata Kuliah, dan Assignment
**File diagram:** `docs/DFD-Level2-2.4-Kelola-Kelas-Mata-Kuliah-dan-Assignment-Yourdon.drawio`

### Tujuan
Membentuk struktur akademik inti: kelas, mata kuliah, assignment dosen, dan keanggotaan mahasiswa.

### Alur utama
1. Admin membuat/memperbarui data kelas.
2. Admin membuat/memperbarui data mata kuliah.
3. Admin menetapkan assignment dosen ke kelas/mata kuliah.
4. Admin mengelola enrollment mahasiswa pada kelas.
5. Sistem menyimpan relasi akademik final.
6. Sistem mendistribusikan struktur ini ke modul akademik lain.

### Output kunci
Relasi kelas–mata kuliah–dosen–mahasiswa yang valid sebagai fondasi proses 2.x.

---

## 7) DFD Level 2 — 2.5 Kehadiran dan Penilaian
**File diagram:** `docs/DFD-Level2-2.5-Kehadiran-dan-Penilaian-Yourdon.drawio`

### Tujuan
Mengelola presensi, input nilai, dan rekap hasil belajar mahasiswa.

### Alur utama
1. Dosen membuka sesi presensi sesuai jadwal.
2. Sistem memvalidasi data peserta dan jadwal.
3. Dosen menginput/memutakhirkan kehadiran.
4. Dosen menginput komponen nilai.
5. Sistem menghitung/rekap nilai akhir sesuai aturan.
6. Mahasiswa melihat hasil presensi dan nilai.

### Output kunci
Rekap kehadiran dan nilai yang terstruktur untuk monitoring akademik.

---

## 8) DFD Level 2 — 3.1 Logbook Digital
**File diagram:** `docs/DFD-Level2-3.1-Logbook-Digital-Yourdon.drawio`

### Tujuan
Mendokumentasikan aktivitas praktikum mahasiswa dan umpan balik dosen secara berkelanjutan.

### Alur utama
1. Mahasiswa membuat entri logbook (isi/lampiran).
2. Sistem menyimpan entri logbook.
3. Dosen meninjau entri logbook mahasiswa.
4. Dosen memberikan feedback/perbaikan.
5. Sistem menyimpan riwayat review dan feedback.
6. Mahasiswa melihat hasil review logbook.

### Output kunci
Riwayat logbook dan umpan balik yang dapat ditelusuri.

---

## 9) DFD Level 2 — 3.2 Peminjaman Alat dan Inventaris
**File diagram:** `docs/DFD-Level2-3.2-Peminjaman-Alat-dan-Inventaris-Yourdon.drawio`

### Tujuan
Mengelola data inventaris dan siklus peminjaman alat laboratorium.

### Alur utama
1. Laboran mengelola data inventaris (stok/kondisi/ketersediaan).
2. Dosen mengajukan permohonan peminjaman alat.
3. Sistem memvalidasi ketersediaan dan data permohonan.
4. Laboran/Admin menyetujui atau menolak permohonan.
5. Sistem memperbarui status peminjaman aktif.
6. Sistem menyimpan histori transaksi dan laporan.

### Output kunci
Status peminjaman alat dan laporan inventaris/peminjaman.

---

## 10) DFD Level 2 — 3.3 Pengumuman dan Notifikasi
**File diagram:** `docs/DFD-Level2-3.3-Pengumuman-dan-Notifikasi-Yourdon.drawio`

### Tujuan
Mendistribusikan informasi penting berdasarkan target role pengguna.

### Alur utama
1. Admin membuat pengumuman.
2. Sistem menyimpan dan mempublikasikan pengumuman.
3. Sistem mengirim notifikasi ke role/target yang ditentukan.
4. Pengguna menerima dan membuka informasi pengumuman.
5. Admin dapat mengarsipkan atau menghapus pengumuman.

### Output kunci
Pengumuman terdistribusi tepat sasaran dan terdokumentasi.

---

## 11) DFD Level 2 — 4.1 Sinkronisasi Offline PWA
**File diagram:** `docs/DFD-Level2-4.1-Sinkronisasi-Offline-PWA-Yourdon.drawio`

### Tujuan
Menjaga keberlanjutan layanan saat offline dan memastikan konsistensi data setelah online kembali.

### Alur utama
1. Sistem mendeteksi status jaringan online/offline.
2. Data penting disimpan ke cache lokal.
3. Operasi tulis saat offline dimasukkan ke offline queue.
4. Saat koneksi kembali, sistem memproses sinkronisasi antrean.
5. Sistem menangani konflik data dan retry bila diperlukan.
6. Sistem mengirim status sinkronisasi ke pengguna.

### Output kunci
Data tersinkron kembali dengan status konflik/berhasil yang jelas.

---

## Ringkasan Keterpaduan Antar Diagram
- Proses **1.2** menopang **1.1** melalui kualitas data akun dan role.
- Proses **2.4** menjadi fondasi struktur untuk **2.1, 2.2, 2.3, 2.5**.
- Proses **3.1, 3.2, 3.3** berjalan paralel sebagai layanan operasional.
- Proses **4.1** menjadi lapisan ketahanan (offline-first) untuk proses akademik dan operasional.

Dokumen ini dapat digunakan sebagai narasi per gambar pada Bab Hasil dan Pembahasan agar pembahasan DFD lebih runtut dan konsisten.