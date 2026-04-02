# Narasi Alur DFD Level 2 — 3.2 Peminjaman Alat dan Inventaris

Dokumen ini menjelaskan alur proses pada diagram [`docs/DFD-Level2-3.2-Peminjaman-Alat-dan-Inventaris-Yourdon.drawio`](docs/DFD-Level2-3.2-Peminjaman-Alat-dan-Inventaris-Yourdon.drawio).

## 1. Tujuan Proses 3.2

Proses [`3.2 Peminjaman Alat dan Inventaris`](docs/DFD.md:499) bertujuan mengelola data inventaris laboratorium serta menangani alur peminjaman alat mulai dari pengajuan, verifikasi, keputusan, monitoring peminjaman aktif, hingga penyusunan laporan operasional.

## 2. Komponen Proses

- **Entitas eksternal:** Laboran, Dosen, Admin
- **Data store:** [`D1 Inventaris dan Peminjaman`](docs/DFD.md:506)
- **Aktivitas internal:**
  - `A1` Kelola Inventaris
  - `A2` Ajukan Peminjaman
  - `A3` Verifikasi dan Keputusan
  - `A4` Monitor Peminjaman Aktif
  - `A5` Laporan

## 3. Narasi Alur Utama

1. Laboran memulai proses dengan memperbarui data inventaris pada `A1 Kelola Inventaris`.
2. Data yang dikelola dapat mencakup nama alat, jumlah stok, kondisi alat, dan informasi operasional lain.
3. Sistem menyimpan seluruh data inventaris ke [`D1 Inventaris dan Peminjaman`](docs/DFD.md:506) sebagai dasar layanan peminjaman.
4. Ketika dosen membutuhkan alat, dosen mengirimkan permohonan melalui `A2 Ajukan Peminjaman`.
5. Sistem mencatat permohonan dengan status awal agar dapat diproses lebih lanjut.
6. Laboran dan/atau admin kemudian meninjau permohonan pada `A3 Verifikasi dan Keputusan`.
7. Pada aktivitas ini, sistem membantu pemeriksaan ketersediaan alat, kelayakan peminjaman, dan hasil keputusan setuju atau tolak.
8. Jika peminjaman disetujui, status transaksi diperbarui dan alat masuk ke daftar peminjaman aktif.
9. Data transaksi yang sedang berjalan dapat dipantau melalui `A4 Monitor Peminjaman Aktif`.
10. Sistem menyediakan daftar alat yang sedang dipinjam, identitas peminjam, serta status pengembaliannya.
11. Pada tahap akhir, laboran atau admin dapat meminta rekap operasional melalui `A5 Laporan`.
12. Sistem menyusun laporan inventaris dan histori peminjaman untuk kebutuhan monitoring dan evaluasi laboratorium.

## 4. Output Kunci

- Data inventaris laboratorium selalu terbarui.
- Permohonan peminjaman tercatat dan dapat diverifikasi.
- Status peminjaman aktif dapat dipantau secara sistematis.
- Riwayat peminjaman tersimpan untuk audit operasional.
- Laporan inventaris dan peminjaman tersedia sebagai bahan evaluasi.

## 5. Ringkasan Siap Pakai Skripsi

Proses [`3.2 Peminjaman Alat dan Inventaris`](docs/DFD.md:499) menunjukkan bahwa layanan peminjaman alat laboratorium memerlukan pengelolaan inventaris, pencatatan permohonan, verifikasi keputusan, monitoring transaksi aktif, dan penyusunan laporan. Dengan alur ini, sistem mampu mendukung kebutuhan operasional laboratorium secara lebih tertib, terdokumentasi, dan mudah diawasi.