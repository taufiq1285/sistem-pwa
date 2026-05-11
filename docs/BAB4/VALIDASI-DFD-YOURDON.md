# Validasi Kesesuaian DFD dengan Notasi Yourdon/DeMarco

Dokumen ini mencatat hasil audit terhadap dokumen DFD pendamping pada Bab 4, khususnya `GAMBAR-05` sampai `GAMBAR-16`. Validasi dilakukan untuk memastikan diagram aman dipertanggungjawabkan sebagai DFD dengan pendekatan Yourdon/DeMarco, bukan flowchart, activity diagram, atau swimlane.

## Kriteria Validasi

| Unsur | Kriteria Yourdon/DeMarco yang Digunakan |
|---|---|
| Entitas eksternal | Ditampilkan sebagai kotak, misalnya `Admin`, `Dosen`, `Mahasiswa`, `Laboran`, atau layanan eksternal. |
| Proses | Ditampilkan sebagai bubble/lingkaran dan diberi nomor proses, misalnya `A1`, `A2`, atau `1.0`. |
| Data store | Ditampilkan sebagai tempat penyimpanan data, misalnya `D1 Data User dan Role` atau `D2 Cache Lokal`. |
| Aliran data | Ditampilkan sebagai panah berlabel data, bukan instruksi prosedural. |
| Panduan Visio | Menggunakan `External Interactor/Entity`, `Data Process`, `Data Store`, dan `Dynamic Connector`. |
| Larangan simbol | Tidak menggunakan simbol flowchart seperti `Start`, `Stop`, `Decision`, `Document`, atau swimlane sebagai simbol utama DFD. |

## Ringkasan Hasil Validasi

| Dokumen BAB4 | Sumber `.drawio` | Jumlah Aliran di Dokumen | Jumlah Aliran di `.drawio` | Status Yourdon/DeMarco | Catatan |
|---|---|---:|---:|---|---|
| `GAMBAR-05-DFD-LEVEL2-1-1-AUTENTIKASI-TABEL-LANE.md` | `DFD-Level2-1.1-Autentikasi-Yourdon.drawio` | 12 | 12 | Sesuai | Nama file masih mengandung `TABEL-LANE`, tetapi isi dokumen sudah menegaskan notasi Yourdon/DeMarco dan bukan swimlane. |
| `GAMBAR-06-DFD-LEVEL2-1-2-KELOLA-USER-TABEL-LANE.md` | `DFD-Level2-1.2-Kelola-User-Yourdon.drawio` | 15 | 15 | Sesuai | Nama file masih mengandung `TABEL-LANE`, tetapi isi dokumen sudah memakai graph dan panduan Yourdon/DeMarco. |
| `GAMBAR-07-DFD-LEVEL2-2-1-KELOLA-JADWAL-VISIO.md` | `DFD-Level2-2.1-Kelola-Jadwal-Yourdon.drawio` | 17 | 17 | Sesuai | Semua aliran data sesuai sumber. |
| `GAMBAR-08-DFD-LEVEL2-2-2-KELOLA-KUIS-DAN-BANK-SOAL-VISIO.md` | `DFD-Level2-2.2-Kelola-Kuis-dan-Bank-Soal-Yourdon.drawio` | 25 | 25 | Sesuai | Semua aliran data sesuai sumber. |
| `GAMBAR-09-DFD-LEVEL2-2-3-KELOLA-MATERI-VISIO.md` | `DFD-Level2-2.3-Kelola-Materi-Yourdon.drawio` | 15 | 15 | Sesuai | Semua aliran data sesuai sumber. |
| `GAMBAR-10-DFD-LEVEL2-2-4-KELOLA-KELAS-MATA-KULIAH-DAN-ASSIGNMENT-VISIO.md` | `DFD-Level2-2.4-Kelola-Kelas-Mata-Kuliah-dan-Assignment-Yourdon.drawio` | 16 | 16 | Sesuai | Semua aliran data sesuai sumber. |
| `GAMBAR-11-DFD-LEVEL2-2-5-KEHADIRAN-DAN-PENILAIAN-VISIO.md` | `DFD-Level2-2.5-Kehadiran-dan-Penilaian-Yourdon.drawio` | 14 | 14 | Sesuai | Semua aliran data sesuai sumber. |
| `GAMBAR-12-DFD-LEVEL2-3-1-LOGBOOK-DIGITAL-VISIO.md` | `DFD-Level2-3.1-Logbook-Digital-Yourdon.drawio` | 14 | 14 | Sesuai | Semua aliran data sesuai sumber. |
| `GAMBAR-13-DFD-LEVEL2-3-2-PEMINJAMAN-ALAT-DAN-INVENTARIS-VISIO.md` | `DFD-Level2-3.2-Peminjaman-Alat-dan-Inventaris-Yourdon.drawio` | 17 | 17 | Sesuai | Semua aliran data sesuai sumber. |
| `GAMBAR-14-DFD-LEVEL2-3-3-PENGUMUMAN-DAN-NOTIFIKASI-VISIO.md` | `DFD-Level2-3.3-Pengumuman-dan-Notifikasi-Yourdon.drawio` | 20 | 20 | Sesuai | Semua aliran data sesuai sumber. |
| `GAMBAR-15-DFD-LEVEL2-4-1-SINKRONISASI-OFFLINE-PWA-VISIO.md` | `DFD-Level2-4.1-Sinkronisasi-Offline-PWA-Yourdon.drawio` | 23 | 23 | Sesuai | Semua aliran data sesuai sumber. |
| `GAMBAR-16-DFD-LEVEL1-YOURDON-VISIO.md` | `DFD-Level1-Yourdon.drawio` | 27 | 27 | Sesuai | Semua aliran data sesuai sumber. |

## Catatan Audit

- Semua dokumen yang divalidasi menyebut pendekatan **Yourdon/DeMarco** dan memberi keterangan simbol untuk skripsi.
- Semua daftar aliran data pada dokumen BAB4 sudah memiliki jumlah yang sama dengan edge pada file `.drawio` sumber.
- Label aliran data pada dokumen BAB4 sudah cocok dengan label aliran pada file `.drawio` sumber.
- Istilah `flowchart` hanya muncul sebagai bagian dari larangan atau penegasan bahwa diagram bukan flowchart.
- Istilah `swimlane` hanya muncul sebagai bagian dari larangan atau penegasan bahwa diagram bukan swimlane.
- File `GAMBAR-05` dan `GAMBAR-06` masih memiliki nama file lama yang memuat `TABEL-LANE`; hal tersebut hanya nama file, sedangkan isi dokumen sudah diarahkan sebagai DFD Yourdon/DeMarco.

## Kesimpulan Siap Pakai Skripsi

Berdasarkan validasi dokumen dan pencocokan terhadap file `.drawio`, seluruh DFD yang digunakan pada Bab 4 telah mengikuti pendekatan Yourdon/DeMarco. Diagram menampilkan entitas eksternal, proses, data store, dan aliran data berlabel secara konsisten. Perubahan yang dilakukan hanya bersifat perapian visual dan dokumentasi panduan, sehingga tidak mengubah alur penelitian, makna proses, maupun label aliran data yang telah ditetapkan.
