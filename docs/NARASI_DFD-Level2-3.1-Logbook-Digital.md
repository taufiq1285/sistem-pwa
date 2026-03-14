# Narasi Alur DFD Level 2 — 3.1 Logbook Digital

Dokumen ini menjelaskan alur proses pada diagram [`docs/DFD-Level2-3.1-Logbook-Digital-Yourdon.drawio`](docs/DFD-Level2-3.1-Logbook-Digital-Yourdon.drawio).

## 1. Tujuan Proses 3.1

Proses [`3.1 Logbook Digital`](docs/DFD.md:460) bertujuan mendokumentasikan aktivitas praktikum mahasiswa secara sistematis, menyediakan ruang review bagi dosen, dan menjaga riwayat kegiatan serta umpan balik agar mudah ditelusuri kembali.

## 2. Komponen Proses

- **Entitas eksternal:** Mahasiswa, Dosen
- **Data store:** [`D1 Data Logbook`](docs/DFD.md:466)
- **Aktivitas internal:**
  - `A1` Input Entri Logbook
  - `A2` Simpan Bukti atau Catatan
  - `A3` Review Logbook
  - `A4` Beri Umpan Balik
  - `A5` Lihat Riwayat Logbook

## 3. Narasi Alur Utama

1. Mahasiswa menuliskan aktivitas praktikum pada `A1 Input Entri Logbook`.
2. Entri yang dibuat dapat berisi catatan kegiatan, progres, hasil praktik, maupun kendala yang dialami.
3. Sistem kemudian meneruskan data ke `A2 Simpan Bukti atau Catatan` untuk menyimpan isi logbook beserta lampiran atau bukti pendukung.
4. Seluruh catatan tersebut disimpan ke [`D1 Data Logbook`](docs/DFD.md:466) agar dapat diakses kembali.
5. Dosen meninjau catatan mahasiswa melalui `A3 Review Logbook`.
6. Berdasarkan hasil review, dosen memberikan komentar, perbaikan, atau status penilaian pada `A4 Beri Umpan Balik`.
7. Umpan balik tersebut disimpan kembali ke data logbook agar menjadi bagian dari histori pembinaan praktikum.
8. Mahasiswa dan dosen kemudian dapat melihat riwayat aktivitas dan review melalui `A5 Lihat Riwayat Logbook`.
9. Dengan alur ini, logbook tidak hanya berfungsi sebagai catatan harian, tetapi juga sebagai media monitoring dan evaluasi proses belajar praktikum.

## 4. Output Kunci

- Entri logbook mahasiswa terdokumentasi dengan baik.
- Lampiran atau bukti kegiatan tersimpan bersama catatan logbook.
- Dosen dapat memberi review dan umpan balik secara terstruktur.
- Riwayat logbook dapat ditelusuri kembali oleh mahasiswa dan dosen.
- Proses monitoring kegiatan praktikum menjadi lebih akuntabel.

## 5. Ringkasan Siap Pakai Skripsi

Proses [`3.1 Logbook Digital`](docs/DFD.md:460) menunjukkan transformasi logbook manual menjadi dokumentasi digital yang lebih terstruktur. Melalui aktivitas pencatatan, penyimpanan bukti, review dosen, pemberian umpan balik, dan penelusuran riwayat, sistem mendukung dokumentasi kegiatan praktikum yang konsisten dan mudah diaudit.