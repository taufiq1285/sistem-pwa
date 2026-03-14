# Narasi Alur DFD Level 2 — 2.4 Kelola Kelas, Mata Kuliah, dan Assignment

Dokumen ini menjelaskan alur proses pada diagram [`docs/DFD-Level2-2.4-Kelola-Kelas-Mata-Kuliah-dan-Assignment-Yourdon.drawio`](docs/DFD-Level2-2.4-Kelola-Kelas-Mata-Kuliah-dan-Assignment-Yourdon.drawio).

## 1. Tujuan Proses 2.4

Proses [`2.4 Kelola Kelas, Mata Kuliah, dan Assignment`](docs/DFD.md:341) bertujuan membentuk struktur akademik inti yang menjadi dasar bagi proses lain, meliputi pengelolaan data kelas, mata kuliah, penugasan dosen, pengelolaan anggota kelas, dan distribusi relasi akademik ke modul terkait.

## 2. Komponen Proses

- **Entitas eksternal:** Admin, Dosen, Mahasiswa
- **Data store:** [`D1 Data Kelas, Mata Kuliah, dan Assignment`](docs/DFD.md:348)
- **Aktivitas internal:**
  - `A1` Kelola Data Kelas
  - `A2` Kelola Mata Kuliah
  - `A3` Assignment Dosen
  - `A4` Kelola Anggota Kelas
  - `A5` Distribusi Relasi Akademik

## 3. Narasi Alur Utama

1. Admin memulai proses dengan mengelola data kelas melalui `A1 Kelola Data Kelas`.
2. Sistem menyimpan informasi kelas ke [`D1 Data Kelas, Mata Kuliah, dan Assignment`](docs/DFD.md:348) sebagai dasar struktur akademik.
3. Admin kemudian mengelola data mata kuliah pada `A2 Kelola Mata Kuliah`.
4. Setiap perubahan data mata kuliah juga disimpan pada penyimpanan yang sama agar relasi akademik tetap terintegrasi.
5. Setelah data kelas dan mata kuliah terbentuk, admin menjalankan `A3 Assignment Dosen` untuk menghubungkan dosen dengan kelas atau mata kuliah tertentu.
6. Sistem mencatat relasi pengajaran ini agar dosen memperoleh ruang lingkup kelas yang sesuai.
7. Selanjutnya, admin mengelola data anggota kelas pada `A4 Kelola Anggota Kelas` dengan menempatkan mahasiswa ke kelas yang relevan.
8. Informasi keanggotaan ini menjadi dasar bagi modul jadwal, materi, kehadiran, penilaian, dan aktivitas akademik lain.
9. Setelah seluruh relasi inti lengkap, sistem meneruskan hasilnya ke `A5 Distribusi Relasi Akademik`.
10. Pada aktivitas ini, sistem menyalurkan informasi kelas yang diajar kepada dosen, informasi kelas yang diikuti kepada mahasiswa, serta rekap relasi akademik kepada admin.

## 4. Output Kunci

- Data kelas dan mata kuliah tersimpan secara konsisten.
- Assignment dosen terhadap kelas atau mata kuliah tercatat dengan jelas.
- Keanggotaan mahasiswa dalam kelas tervalidasi.
- Relasi akademik dapat dipakai oleh modul lain secara terintegrasi.
- Admin memperoleh dasar monitoring struktur akademik sistem.

## 5. Ringkasan Siap Pakai Skripsi

Proses [`2.4 Kelola Kelas, Mata Kuliah, dan Assignment`](docs/DFD.md:341) menunjukkan bahwa data master akademik merupakan tulang punggung integrasi antarmodul. Melalui aktivitas pengelolaan kelas, mata kuliah, assignment dosen, keanggotaan mahasiswa, dan distribusi relasi akademik, sistem membentuk keterhubungan data yang dibutuhkan oleh jadwal, materi, kuis, kehadiran, dan penilaian.