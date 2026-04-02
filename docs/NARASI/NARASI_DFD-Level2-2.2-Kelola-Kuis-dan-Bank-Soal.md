# Narasi Alur DFD Level 2 — 2.2 Kelola Kuis dan Bank Soal

Dokumen ini menjelaskan alur proses pada diagram [`docs/DFD-Level2-2.2-Kelola-Kuis-dan-Bank-Soal-Yourdon.drawio`](docs/DFD-Level2-2.2-Kelola-Kuis-dan-Bank-Soal-Yourdon.drawio).

## 1. Tujuan Proses 2.2

Proses [`2.2 Kelola Kuis dan Bank Soal`](docs/DFD.md:242) bertujuan mengelola seluruh siklus evaluasi berbasis kuis, mulai dari pembuatan kuis, pengelolaan bank soal, publikasi ke kelas target, pengerjaan oleh mahasiswa, penyimpanan jawaban saat offline, sampai penilaian dan peninjauan hasil oleh dosen.

## 2. Komponen Proses

- **Entitas eksternal:** Dosen, Mahasiswa
- **Data store:** [`D1 Data Kuis, Soal, Hasil`](docs/DFD.md:248), [`D2 IndexedDB Cache`](docs/DFD.md:249), [`D3 Offline Queue`](docs/DFD.md:250)
- **Aktivitas internal:**
  - `A1` Buat Kuis
  - `A2` Kelola Bank Soal
  - `A3` Publish Kuis
  - `A4` Ambil Soal
  - `A5` Kerjakan Kuis
  - `A6` Auto-save Offline
  - `A7` Submit dan Penilaian
  - `A8` Lihat Hasil

## 3. Narasi Alur Utama

1. Dosen memulai proses dengan membuat kuis pada aktivitas `A1 Buat Kuis`.
2. Sistem menyimpan informasi dasar kuis seperti judul, durasi, kelas target, dan aturan pengerjaan ke [`D1 Data Kuis, Soal, Hasil`](docs/DFD.md:248).
3. Setelah itu, dosen mengelola kumpulan soal pada `A2 Kelola Bank Soal`, baik dengan menambah soal baru, mengubah soal lama, maupun memilih soal yang sudah tersedia.
4. Ketika kuis siap digunakan, dosen mengaktifkannya melalui `A3 Publish Kuis`.
5. Sistem memperbarui status kuis menjadi aktif dan dapat menyalin data penting ke [`D2 IndexedDB Cache`](docs/DFD.md:249) untuk mendukung pengambilan soal secara lebih fleksibel.
6. Mahasiswa kemudian meminta soal melalui `A4 Ambil Soal`, dan sistem mengambil soal dari database utama atau dari cache lokal jika diperlukan.
7. Mahasiswa mengerjakan kuis pada `A5 Kerjakan Kuis`.
8. Jika koneksi tersedia, jawaban mahasiswa langsung diteruskan ke `A7 Submit dan Penilaian` untuk disimpan dan dinilai.
9. Jika koneksi tidak tersedia, jawaban diarahkan ke `A6 Auto-save Offline` dan disimpan ke [`D3 Offline Queue`](docs/DFD.md:250) agar tidak hilang.
10. Saat koneksi kembali tersedia, jawaban yang tersimpan di antrean lokal dikirimkan ke `A7 Submit dan Penilaian`.
11. Sistem menghitung hasil, menyimpan nilai, dan menyiapkan rekap evaluasi.
12. Dosen melihat hasil, statistik, dan capaian mahasiswa melalui `A8 Lihat Hasil`.

## 4. Output Kunci

- Kuis dan bank soal tersimpan secara terstruktur.
- Mahasiswa dapat mengerjakan kuis pada kondisi online maupun offline.
- Jawaban mahasiswa tidak hilang karena didukung antrean lokal.
- Nilai dan hasil kuis tersedia untuk mahasiswa dan dosen.
- Dosen memperoleh rekap evaluasi untuk analisis pembelajaran.

## 5. Ringkasan Siap Pakai Skripsi

Proses [`2.2 Kelola Kuis dan Bank Soal`](docs/DFD.md:242) memperlihatkan bahwa sistem evaluasi tidak hanya berhenti pada pembuatan soal, tetapi mencakup pengelolaan kuis secara menyeluruh mulai dari penyusunan, publikasi, pengerjaan, penyimpanan jawaban saat offline, penilaian, hingga penyajian hasil. Dengan dukungan cache lokal dan antrean offline, proses ini tetap andal ketika kondisi jaringan berubah-ubah.