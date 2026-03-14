# Narasi Alur DFD Level 2 — 2.3 Kelola Materi

Dokumen ini menjelaskan alur proses pada diagram [`docs/DFD-Level2-2.3-Kelola-Materi-Yourdon.drawio`](docs/DFD-Level2-2.3-Kelola-Materi-Yourdon.drawio).

## 1. Tujuan Proses 2.3

Proses [`2.3 Kelola Materi`](docs/DFD.md:299) bertujuan mengelola bahan ajar praktikum sejak unggah file oleh dosen, penyimpanan metadata, penyajian daftar materi, akses atau unduh file oleh mahasiswa, hingga penyimpanan cache untuk kebutuhan akses offline.

## 2. Komponen Proses

- **Entitas eksternal:** Dosen, Mahasiswa
- **Data store:** [`D1 Metadata Materi`](docs/DFD.md:305), [`D2 IndexedDB Cache`](docs/DFD.md:306), [`D4 Storage File`](docs/DFD.md:307)
- **Aktivitas internal:**
  - `A1` Upload Materi
  - `A2` Simpan Metadata
  - `A3` Lihat Daftar Materi
  - `A4` Akses atau Unduh Materi
  - `A5` Cache Offline

## 3. Narasi Alur Utama

1. Dosen memulai proses dengan mengunggah file materi ke aktivitas `A1 Upload Materi`.
2. Sistem menyimpan file fisik ke [`D4 Storage File`](docs/DFD.md:307) agar materi dapat diakses kembali saat dibutuhkan.
3. Setelah file berhasil tersimpan, sistem meneruskan data ke `A2 Simpan Metadata`.
4. Pada aktivitas ini, sistem mencatat informasi terstruktur seperti judul materi, deskripsi, kelas tujuan, dan referensi file ke [`D1 Metadata Materi`](docs/DFD.md:305).
5. Dosen maupun mahasiswa kemudian dapat meminta daftar materi melalui `A3 Lihat Daftar Materi`.
6. Sistem mengambil metadata materi dari penyimpanan utama dan menampilkan daftar materi yang tersedia sesuai konteks kelas.
7. Jika mahasiswa ingin membuka atau mengunduh isi materi, sistem meneruskan alur ke `A4 Akses atau Unduh Materi`.
8. Pada tahap ini, sistem mengambil file dari storage dan menyajikannya kepada pengguna sesuai hak akses.
9. Setelah materi berhasil diakses, sistem dapat menjalankan `A5 Cache Offline` untuk menyimpan referensi atau salinan materi ke [`D2 IndexedDB Cache`](docs/DFD.md:306).
10. Cache ini membantu agar materi tetap dapat dibaca ketika koneksi internet tidak tersedia atau tidak stabil.

## 4. Output Kunci

- File materi tersimpan aman di storage.
- Metadata materi tercatat rapi dan mudah dicari.
- Daftar materi dapat diakses sesuai kelas dan hak pengguna.
- Mahasiswa dapat membuka atau mengunduh materi dengan lebih fleksibel.
- Dukungan cache meningkatkan ketersediaan materi pada mode offline.

## 5. Ringkasan Siap Pakai Skripsi

Proses [`2.3 Kelola Materi`](docs/DFD.md:299) memperlihatkan bahwa pengelolaan materi terdiri atas dua sisi yang saling mendukung, yaitu penyimpanan file fisik dan pengelolaan metadata. Melalui rangkaian aktivitas upload, pencatatan metadata, penyajian daftar, akses file, dan cache offline, sistem memastikan bahwa materi pembelajaran dapat dikelola, ditemukan, dan diakses secara konsisten oleh dosen maupun mahasiswa.