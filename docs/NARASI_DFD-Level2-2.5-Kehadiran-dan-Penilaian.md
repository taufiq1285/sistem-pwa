# Narasi Alur DFD Level 2 — 2.5 Kehadiran dan Penilaian

Dokumen ini menjelaskan alur proses pada diagram [`docs/DFD-Level2-2.5-Kehadiran-dan-Penilaian-Yourdon.drawio`](docs/DFD-Level2-2.5-Kehadiran-dan-Penilaian-Yourdon.drawio).

## 1. Tujuan Proses 2.5

Proses [`2.5 Kehadiran dan Penilaian`](docs/DFD.md:422) bertujuan mengelola pencatatan presensi mahasiswa, input komponen nilai oleh dosen, perhitungan rekap hasil belajar, dan penyajian hasil tersebut kepada mahasiswa secara terstruktur.

## 2. Komponen Proses

- **Entitas eksternal:** Dosen, Mahasiswa
- **Data store:** [`D1 Data Kehadiran dan Nilai`](docs/DFD.md:428)
- **Aktivitas internal:**
  - `A1` Input Kehadiran
  - `A2` Validasi Presensi
  - `A3` Input Nilai
  - `A4` Hitung Rekap Nilai
  - `A5` Lihat Hasil Nilai

## 3. Narasi Alur Utama

1. Dosen memulai proses dengan mencatat kehadiran mahasiswa pada `A1 Input Kehadiran`.
2. Data presensi kemudian diteruskan ke `A2 Validasi Presensi` untuk diperiksa kesesuaiannya dengan jadwal dan daftar peserta yang sah.
3. Jika valid, sistem menyimpan data kehadiran ke [`D1 Data Kehadiran dan Nilai`](docs/DFD.md:428).
4. Setelah itu, dosen memasukkan komponen penilaian melalui `A3 Input Nilai`.
5. Komponen ini dapat mencakup nilai tugas, kuis, praktik, atau komponen evaluasi lain sesuai skema perkuliahan praktikum.
6. Sistem lalu menjalankan `A4 Hitung Rekap Nilai` dengan memanfaatkan dua masukan utama, yaitu nilai yang telah disimpan dari `A3` dan presensi tervalidasi dari `A2`.
7. Dengan demikian, rekap akhir tidak hanya merepresentasikan skor evaluasi, tetapi juga mempertimbangkan status kehadiran yang sudah diverifikasi.
8. Rekap hasil tersebut kemudian diteruskan ke `A5 Lihat Hasil Nilai` agar mahasiswa dapat melihat hasil presensi dan nilai secara terpadu.
9. Dengan alur ini, mahasiswa tidak hanya menerima skor akhir, tetapi juga dapat memahami hubungan antara kehadiran dan hasil evaluasi akademiknya.

## 4. Output Kunci

- Data kehadiran mahasiswa tervalidasi dan tersimpan.
- Komponen nilai tercatat secara sistematis.
- Rekap nilai akhir dapat dihitung dan ditampilkan secara konsisten.
- Mahasiswa memperoleh akses ke hasil kehadiran dan penilaian.
- Dosen memiliki dasar evaluasi belajar yang lebih terstruktur.

## 5. Ringkasan Siap Pakai Skripsi

Proses [`2.5 Kehadiran dan Penilaian`](docs/DFD.md:422) menunjukkan bahwa kehadiran dan penilaian merupakan dua aliran data yang saling terkait. Melalui aktivitas pencatatan presensi, validasi, input nilai, perhitungan rekap, dan penyajian hasil, sistem membentuk mekanisme evaluasi akademik yang terdokumentasi, akuntabel, dan mudah dipahami oleh dosen maupun mahasiswa.