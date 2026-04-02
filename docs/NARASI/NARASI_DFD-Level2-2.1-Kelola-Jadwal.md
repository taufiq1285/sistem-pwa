# Narasi Alur DFD Level 2 — 2.1 Kelola Jadwal

Dokumen ini menjelaskan alur proses pada diagram [`docs/DFD-Level2-2.1-Kelola-Jadwal-Yourdon.drawio`](docs/DFD-Level2-2.1-Kelola-Jadwal-Yourdon.drawio).

## 1. Tujuan Proses 2.1

Proses [`2.1 Kelola Jadwal`](docs/DFD.md:197) bertujuan mengelola jadwal praktikum sejak pengajuan awal oleh dosen, validasi kelas dan laboratorium, persetujuan oleh laboran, publikasi jadwal, hingga akses jadwal oleh pihak yang berkepentingan.

## 2. Komponen Proses

- **Entitas eksternal:** Dosen, Laboran, Mahasiswa
- **Data store:** [`D1 Data Jadwal Praktikum`](docs/DFD.md:204), [`D2 IndexedDB Cache`](docs/DFD.md:205)
- **Aktivitas internal:**
  - `A1` Input atau Ajukan Jadwal
  - `A2` Validasi Kelas dan Laboratorium
  - `A3` Persetujuan Jadwal
  - `A4` Publikasi Jadwal
  - `A5` Lihat Jadwal

## 3. Narasi Alur Utama

1. Dosen mengirimkan rancangan jadwal praktikum ke aktivitas `A1 Input atau Ajukan Jadwal`.
2. Sistem menerima data waktu, kelas, mata kuliah, dan kebutuhan laboratorium, lalu meneruskannya ke `A2 Validasi Kelas dan Laboratorium`.
3. Pada `A2`, sistem memeriksa kesesuaian data kelas, ketersediaan laboratorium, dan benturan waktu berdasarkan data pada [`D1 Data Jadwal Praktikum`](docs/DFD.md:204).
4. Jika data valid, alur diteruskan ke `A3 Persetujuan Jadwal` untuk ditinjau oleh laboran.
5. Laboran memberikan keputusan setuju atau tolak, lalu sistem memperbarui status jadwal pada penyimpanan utama.
6. Jadwal yang disetujui diteruskan ke `A4 Publikasi Jadwal` untuk dipublikasikan kepada pengguna terkait.
7. Sistem menyimpan jadwal aktif ke database utama dan, bila diperlukan, ke [`D2 IndexedDB Cache`](docs/DFD.md:205) agar tetap dapat diakses lebih cepat atau saat koneksi terbatas.
8. Mahasiswa, dosen, dan laboran mengakses hasil akhir melalui `A5 Lihat Jadwal` sesuai kebutuhan masing-masing.

## 4. Output Kunci

- Jadwal praktikum tervalidasi dan tersimpan.
- Status persetujuan jadwal tercatat dengan jelas.
- Jadwal final dapat diakses oleh dosen, mahasiswa, dan laboran.
- Dukungan cache lokal membantu akses jadwal saat kondisi jaringan tidak stabil.

## 5. Ringkasan Siap Pakai Skripsi

Proses [`2.1 Kelola Jadwal`](docs/DFD.md:197) menunjukkan bahwa jadwal praktikum tidak langsung dipublikasikan setelah diinput, melainkan melalui rangkaian aktivitas internal berupa pengajuan, validasi, persetujuan, publikasi, dan akses jadwal. Dengan alur ini, sistem memastikan bahwa jadwal yang diterima pengguna sudah sesuai dengan relasi kelas, laboratorium, dan waktu pelaksanaan sehingga mendukung keteraturan proses praktikum.