# Narasi Alur DFD Level 2 — 3.3 Pengumuman dan Notifikasi

Dokumen ini menjelaskan alur proses pada diagram [`docs/DFD-Level2-3.3-Pengumuman-dan-Notifikasi-Yourdon.drawio`](docs/DFD-Level2-3.3-Pengumuman-dan-Notifikasi-Yourdon.drawio).

## 1. Tujuan Proses 3.3

Proses [`3.3 Pengumuman dan Notifikasi`](docs/DFD.md:542) bertujuan mengelola siklus informasi resmi dalam sistem, mulai dari pembuatan pengumuman, penyimpanan dan publikasi, distribusi berdasarkan role, penayangan kepada pengguna, hingga pengarsipan atau penghapusan ketika informasi sudah tidak aktif.

## 2. Komponen Proses

- **Entitas eksternal:** Admin, Mahasiswa, Dosen, Laboran
- **Data store:** [`D1 Pengumuman dan Notifications`](docs/DFD.md:550), [`D2 IndexedDB Cache`](docs/DFD.md:551)
- **Aktivitas internal:**
  - `A1` Buat Pengumuman
  - `A2` Simpan dan Publikasikan
  - `A3` Distribusi Berdasarkan Role
  - `A4` Tampilkan Daftar dan Detail
  - `A5` Arsipkan atau Hapus

## 3. Narasi Alur Utama

1. Admin menyusun judul, isi, prioritas, dan target penerima pada `A1 Buat Pengumuman`.
2. Data pengumuman tersebut diteruskan ke `A2 Simpan dan Publikasikan`.
3. Sistem menyimpan pengumuman ke [`D1 Pengumuman dan Notifications`](docs/DFD.md:550) sebagai sumber utama informasi.
4. Bila diperlukan untuk akses yang lebih cepat atau dukungan offline, sistem juga dapat menyalin data penting ke [`D2 IndexedDB Cache`](docs/DFD.md:551).
5. Setelah pengumuman aktif, sistem menjalankan `A3 Distribusi Berdasarkan Role`.
6. Pada aktivitas ini, sistem menentukan penerima yang relevan, misalnya mahasiswa, dosen, atau laboran, sesuai target yang dipilih admin.
7. Pengguna kemudian membuka informasi melalui `A4 Tampilkan Daftar dan Detail`.
8. Sistem menampilkan daftar pengumuman aktif dan memungkinkan pengguna melihat isi detail setiap pengumuman.
9. Jika pengumuman sudah tidak relevan, admin dapat menjalankan `A5 Arsipkan atau Hapus`.
10. Sistem memperbarui status pengumuman atau menghapus data sesuai kebijakan pengelolaan informasi.

## 4. Output Kunci

- Pengumuman resmi tersimpan dan terdokumentasi.
- Distribusi informasi dapat diarahkan sesuai role pengguna.
- Pengguna dapat membaca daftar maupun detail pengumuman.
- Data pengumuman dapat diarsipkan atau dihapus secara terkontrol.
- Komunikasi antarmodul sistem menjadi lebih tertata.

## 5. Ringkasan Siap Pakai Skripsi

Proses [`3.3 Pengumuman dan Notifikasi`](docs/DFD.md:542) menunjukkan bahwa komunikasi sistem tidak diperlakukan sebagai informasi pasif, melainkan sebagai alur data yang memiliki tahapan pembuatan, publikasi, distribusi, konsumsi informasi, dan pengarsipan. Dengan mekanisme ini, sistem dapat menyampaikan informasi akademik dan operasional secara tepat sasaran, terstruktur, dan terdokumentasi.