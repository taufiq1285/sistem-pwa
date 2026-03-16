# Narasi Alur DFD Level 2 — 2.4 Kelola Kelas, Mata Kuliah, dan Assignment

Dokumen ini menjelaskan alur proses pada diagram [`docs/DFD-Level2-2.4-Kelola-Kelas-Mata-Kuliah-dan-Assignment-Yourdon.drawio`](docs/DFD-Level2-2.4-Kelola-Kelas-Mata-Kuliah-dan-Assignment-Yourdon.drawio).

## 1. Tujuan Proses 2.4

Proses [`2.4 Kelola Kelas, Mata Kuliah, dan Assignment`](docs/DFD.md:341) bertujuan membentuk dan memanfaatkan struktur akademik inti yang menjadi dasar bagi proses lain, meliputi pengelolaan mata kuliah, pembentukan kelas praktikum, penetapan relasi dosen dan mahasiswa ke dalam kelas, pengelolaan assignment, pengumpulan submission, serta akses data kelas dan assignment oleh pengguna terkait.

## 2. Komponen Proses

- **Entitas eksternal:** Admin, Dosen, Mahasiswa
- **Data store:** [`D1 Data Mata Kuliah`](docs/DFD.md:428), [`D2 Data Kelas Praktikum`](docs/DFD.md:429), [`D3 Data Assignment dan Submission`](docs/DFD.md:430)
- **Aktivitas internal:**
  - `A1` Kelola Mata Kuliah
  - `A2` Kelola Kelas Praktikum
  - `A3` Enrol Mahasiswa dan Dosen
  - `A4` Kelola Assignment
  - `A5` Kumpulkan Submission
  - `A6` Lihat Kelas dan Assignment

## 3. Narasi Alur Utama

1. Admin memulai proses dengan mengelola data mata kuliah melalui `A1 Kelola Mata Kuliah`.
2. Sistem menyimpan dan memperbarui data master mata kuliah pada [`D1 Data Mata Kuliah`](docs/DFD.md:428) agar struktur akademik memiliki dasar klasifikasi yang jelas.
3. Setelah itu, admin membentuk kelas praktikum melalui `A2 Kelola Kelas Praktikum`.
4. Informasi kelas aktif disimpan pada [`D2 Data Kelas Praktikum`](docs/DFD.md:429) sebagai wadah relasi peserta dan aktivitas pembelajaran.
5. Admin kemudian menjalankan `A3 Enrol Mahasiswa dan Dosen` untuk menetapkan dosen pengampu serta mahasiswa peserta ke dalam kelas yang sesuai.
6. Pembaruan relasi anggota kelas disimpan pada [`D2 Data Kelas Praktikum`](docs/DFD.md:429) agar struktur peserta tetap konsisten.
7. Setelah struktur kelas terbentuk, dosen mengelola tugas melalui `A4 Kelola Assignment`.
8. Sistem menyimpan assignment pada [`D3 Data Assignment dan Submission`](docs/DFD.md:430) agar tugas terhubung dengan kelas yang relevan.
9. Mahasiswa kemudian mengirim jawaban atau berkas tugas pada `A5 Kumpulkan Submission`.
10. Submission tersebut dicatat pada [`D3 Data Assignment dan Submission`](docs/DFD.md:430) sehingga hubungan antara tugas, kelas, dan mahasiswa tetap terdokumentasi.
11. Dosen dan mahasiswa selanjutnya mengakses struktur kelas serta daftar assignment melalui `A6 Lihat Kelas dan Assignment`.
12. Pada tahap ini, sistem mengambil data kelas dari [`D2 Data Kelas Praktikum`](docs/DFD.md:429) dan data assignment dari [`D3 Data Assignment dan Submission`](docs/DFD.md:430), lalu menampilkan informasi yang relevan kepada pengguna terkait.

## 4. Output Kunci

- Data mata kuliah tersimpan sebagai dasar struktur akademik.
- Kelas praktikum aktif terbentuk dan memiliki relasi peserta yang jelas.
- Enrol dosen dan mahasiswa ke kelas tercatat secara konsisten.
- Assignment dan submission tersimpan secara terstruktur.
- Dosen dan mahasiswa dapat mengakses informasi kelas dan assignment sesuai kebutuhannya.

## 5. Ringkasan Siap Pakai Skripsi

Proses [`2.4 Kelola Kelas, Mata Kuliah, dan Assignment`](docs/DFD.md:341) menunjukkan bahwa struktur akademik pada sistem tidak berhenti pada data master, tetapi juga mengalir ke pengelolaan assignment dan submission. Melalui aktivitas pengelolaan mata kuliah, pembentukan kelas, enrol peserta, pengaturan assignment, pengumpulan submission, dan akses data kelas, sistem membentuk fondasi relasional yang dibutuhkan oleh jadwal, materi, kuis, kehadiran, dan penilaian.
