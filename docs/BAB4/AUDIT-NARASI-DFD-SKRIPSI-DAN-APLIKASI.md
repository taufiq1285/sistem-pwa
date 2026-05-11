# Audit Mendalam Narasi DFD Skripsi dan Kesesuaian dengan Aplikasi

Dokumen ini mencatat audit mendalam terhadap narasi DFD pada file skripsi `C:\Users\ACER\Downloads\SKRIPSI TAUFIQ - FIX.docx`. Patokan utama audit adalah isi naskah Word pada Bab IV, kemudian dicocokkan dengan file `.drawio` sumber dan kondisi aplikasi saat ini.

Audit ini tidak mengubah file Word, file `.drawio`, maupun kode aplikasi. Hasilnya dipakai sebagai checklist akademik sebelum gambar atau narasi DFD diperbarui secara manual di Microsoft Word.

## Sumber Audit

| Sumber | Fungsi dalam Audit | Status |
|---|---|---|
| `SKRIPSI TAUFIQ - FIX.docx` | Patokan utama narasi Bab IV, terutama bagian `DFD Level 1` dan `DFD Level 2`. | Terbaca read-only |
| `docs/DFD-Level1-Yourdon.drawio` | Sumber visual DFD Level 1. | Cocok dengan dokumen pendamping |
| `docs/DFD-Level2-*.drawio` | Sumber visual seluruh DFD Level 2. | Cocok dengan dokumen pendamping |
| `docs/BAB4/GAMBAR-05` sampai `GAMBAR-16` | Dokumen pendamping DFD yang sudah disesuaikan dengan Yourdon/DeMarco. | Menjadi pembanding label dan aliran |
| `src/config/routes.config.ts` dan `src/routes/index.tsx` | Bukti route fitur aplikasi aktif. | Sesuai dengan modul DFD |
| `src/pages`, `src/lib/api`, `src/config/offline.config.ts`, provider, dan test | Bukti halaman, API, konfigurasi PWA/offline, serta pengujian. | Sesuai dengan modul DFD |

## Kriteria Audit

| Aspek | Kriteria yang Dicek |
|---|---|
| Narasi Word | Apakah uraian Bab IV menjelaskan proses yang sama dengan gambar DFD. |
| Aktivitas internal Word | Apakah A1, A2, dan seterusnya pada tabel Word selaras dengan label proses pada diagram. |
| Diagram `.drawio` | Apakah simbol, jumlah aliran, arah aliran, dan label data sesuai dokumen pendamping. |
| Aplikasi nyata | Apakah fitur yang disebut pada narasi DFD memiliki bukti route, page, API, config, provider, atau test. |
| Risiko akademik | Apakah ada istilah yang dapat dipertanyakan saat sidang, misalnya campuran `Peran/Role` atau tabel yang lebih ringkas daripada diagram. |

## Ringkasan Hasil

Secara substansi, narasi DFD pada Bab IV skripsi sudah sesuai dengan sistem yang dibangun. Empat proses utama pada DFD Level 1, yaitu manajemen akun, akademik praktikum, operasional laboratorium, dan layanan PWA/offline, terbukti ada pada aplikasi melalui route, halaman, API, konfigurasi, provider, dan test.

Masalah yang ditemukan bukan perubahan alur penelitian, melainkan tiga hal kecil yang perlu dirapikan agar lebih aman dipertanggungjawabkan:

| No | Temuan | Dampak | Rekomendasi |
|---|---|---|---|
| 1 | Beberapa istilah Word berbeda dari label gambar, misalnya `Peran` vs `Role`, `Pengalihan` vs `Redirect`, `Keluar` vs `Logout`. | Tidak mengubah makna, tetapi dapat terlihat tidak konsisten. | Samakan dengan label gambar atau tambahkan padanan dalam kurung. |
| 2 | Tabel 3 DFD Level 1 di Word menjelaskan keluaran logis proses, tetapi tidak semua keluaran mungkin digambar sebagai panah eksplisit pada Level 1. | Penguji dapat bertanya apakah tabel menambah aliran yang tidak ada pada gambar. | Tambahkan kalimat bahwa tabel menjelaskan masukan, keluaran logis, dan relasi penyimpanan; panah rinci ada pada DFD Level 2. |
| 3 | DFD 2.2 di Word merangkum aktivitas menjadi A1-A6, sedangkan gambar pendamping memecahnya lebih rinci menjadi A1-A8 dengan 25 aliran data. | Tidak salah, tetapi perlu penjelasan bahwa tabel adalah ringkasan aktivitas utama. | Tambahkan kalimat penjelas pada bagian DFD 2.2. |

## Matriks Audit per DFD

| DFD dalam Word | Ringkasan Narasi Word | Aktivitas Word | Label Proses pada Diagram | Aliran Diagram | Bukti Aplikasi | Status |
|---|---|---|---|---:|---|---|
| DFD Level 1 Sistem Praktikum PWA | Word menjelaskan dekomposisi dari DFD Level 0 menjadi empat proses utama: akun/akses, akademik, operasional lab, dan PWA/offline. | Proses 1.0, 2.0, 3.0, 4.0. | `1.0 Manajemen Akun dan Akses`, `2.0 Manajemen Akademik Praktikum`, `3.0 Operasional dan Layanan Laboratorium`, `4.0 Layanan PWA dan Sinkronisasi Offline`. | 27 | Route role admin/dosen/mahasiswa/laboran; halaman akademik, operasional, dan offline sync; API domain; `offline.config.ts`. | Sesuai, perlu kalimat penjelas Tabel 3 |
| Level 2.1 Proses 1.1 Autentikasi | Word menjelaskan login, validasi Supabase, pengambilan peran, pembentukan sesi, redirect, dan logout. | `A1 Validasi Kredensial`, `A2 Ambil Data Peran`, `A3 Bentuk Sesi Login`, `A4 Pengalihan Berdasarkan Peran`, `A5 Keluar dari Sistem`. | `A1 Validasi Kredensial`, `A2 Ambil Data Role`, `A3 Bentuk Session Login`, `A4 Redirect Berdasarkan Role`, `A5 Logout`. | 12 | `src/pages/auth`, `auth.api.ts`, `routes.config.ts`, test auth dan role access. | Perlu Penyesuaian Istilah |
| Level 2.2 Proses 1.2 Kelola Pengguna | Word menjelaskan admin membuat akun, menetapkan peran, mengelola profil peran, status, dan arsip/hapus akun. | `A1 Buat Akun`, `A2 Tetapkan Peran`, `A3 Kelola Profil Peran`, `A4 Ubah Status Pengguna`, `A5 Hapus atau Arsipkan Pengguna`. | `A1 Buat Akun`, `A2 Tetapkan Role`, `A3 Kelola Profil Role`, `A4 Ubah Status User`, `A5 Hapus atau Arsipkan User`. | 15 | `UsersPage`, `RolesPage`, `users.api.ts`, `admin.api.ts`, test users/admin API. | Perlu Penyesuaian Istilah |
| Level 2.3 Proses 2.1 Kelola Jadwal | Word menjelaskan usulan jadwal dosen, validasi kelas/lab, persetujuan laboran, publikasi, dan akses jadwal. | `A1 Input atau Ajukan Jadwal`, `A2 Validasi Kelas dan Laboratorium`, `A3 Persetujuan Jadwal`, `A4 Publikasi Jadwal`, `A5 Lihat Jadwal`. | Sama dengan Word. | 17 | Route jadwal dosen/mahasiswa/laboran; `JadwalPage`; `jadwal.api.ts`; test jadwal. | Sesuai |
| Level 2.4 Proses 2.2 Kelola Kuis dan Bank Soal | Word menjelaskan pembuatan kuis, bank soal, publikasi, pengerjaan, simpan offline, sinkronisasi, dan hasil. | Word merangkum A1-A6: `Buat Kuis`, `Kelola Bank Soal`, `Publikasi Kuis`, `Ambil dan Kerjakan Kuis`, `Simpan Sementara saat Offline`, `Sinkronisasi dan Penilaian`. | Diagram lebih rinci A1-A8: `Buat Kuis`, `Kelola Bank Soal`, `Publish Kuis`, `Ambil Soal`, `Kerjakan Kuis`, `Auto-save Offline`, `Submit dan Penilaian`, `Lihat Hasil`. | 25 | Halaman kuis dosen/mahasiswa, bank soal, builder, attempt, results; `kuis.api.ts`, `bank-soal.api.ts`; test offline attempt. | Perlu Koreksi Narasi Ringan |
| Level 2.5 Proses 2.3 Kelola Materi | Word menjelaskan unggah materi, metadata, daftar materi, akses/unduh, dan cache offline. | `A1 Unggah Materi`, `A2 Simpan Metadata`, `A3 Lihat Daftar Materi`, `A4 Akses atau Unduh Materi`, `A5 Cache Offline`. | Sama secara makna dengan diagram. | 15 | Halaman materi dosen/mahasiswa; `materi.api.ts`; komponen upload, viewer, offline materi. | Sesuai |
| Level 2.6 Proses 2.4 Kelola Kelas, Mata Kuliah, dan Assignment | Word menjelaskan data master akademik, kelas, relasi dosen/mahasiswa, assignment, submission, dan akses data. | `A1 Kelola Mata Kuliah`, `A2 Kelola Kelas Praktikum`, `A3 Enrol Mahasiswa dan Dosen`, `A4 Kelola Assignment`, `A5 Kumpulkan Submission`, `A6 Lihat Kelas dan Assignment`. | Sama secara makna dengan diagram. | 16 | Halaman admin kelas/mata kuliah/assignment; `kelas.api.ts`, `mata-kuliah.api.ts`, `assignment.api.ts`. | Sesuai |
| Level 2.7 Proses 2.5 Kehadiran dan Penilaian | Word menjelaskan input kehadiran, validasi presensi, input nilai, rekap nilai, dan hasil ke mahasiswa. | `A1 Input Kehadiran`, `A2 Validasi Presensi`, `A3 Input Nilai`, `A4 Hitung Rekap Nilai`, `A5 Lihat Hasil Presensi dan Nilai`. | Sama secara makna dengan diagram. | 14 | Halaman kehadiran dosen, presensi mahasiswa, penilaian dosen, nilai mahasiswa; `kehadiran.api.ts`, `nilai.api.ts`. | Sesuai |
| Level 2.8 Proses 3.1 Logbook Digital | Word menjelaskan input logbook, simpan catatan/lampiran, review dosen, umpan balik, dan riwayat. | `A1 Input Entri Logbook`, `A2 Simpan Bukti atau Catatan`, `A3 Telaah Logbook`, `A4 Beri Umpan Balik`, `A5 Lihat Riwayat Logbook`. | Diagram/aplikasi memakai istilah `Review Logbook` untuk A3. | 14 | `LogbookPage`, `LogbookReviewPage`, `logbook.api.ts`, test logbook. | Perlu Penyesuaian Istilah Kecil |
| Level 2.9 Proses 3.2 Peminjaman Alat dan Inventaris | Word menjelaskan inventaris, pengajuan peminjaman, verifikasi, pemantauan aktif, dan laporan. | `A1 Kelola Inventaris`, `A2 Ajukan Peminjaman`, `A3 Verifikasi dan Keputusan`, `A4 Pantau Peminjaman Aktif`, `A5 Susun Laporan`. | Diagram pendamping memakai istilah seperti `Monitor Peminjaman Aktif` dan `Laporan`. | 17 | Halaman inventaris, peminjaman dosen, persetujuan, peminjaman aktif, laporan; `laboran.api.ts`, `reports.api.ts`. | Perlu Penyesuaian Istilah Kecil |
| Level 2.10 Proses 3.3 Pengumuman dan Notifikasi | Word menjelaskan pembuatan, simpan/publikasi, distribusi berdasarkan peran, daftar/detail, dan arsip/hapus. | `A1 Buat Pengumuman`, `A2 Simpan dan Publikasikan`, `A3 Distribusi Berdasarkan Peran`, `A4 Tampilkan Daftar dan Detail`, `A5 Arsipkan atau Hapus`. | Sama secara makna dengan diagram. | 20 | Halaman pengumuman dan notifikasi; `announcements.api.ts`, `notification.api.ts`, komponen notification. | Sesuai |
| Level 2.11 Proses 4.1 Sinkronisasi Offline PWA | Word menjelaskan deteksi jaringan, cache, antrean operasi, sinkronisasi, konflik, dan retry. | `A1 Deteksi Status Jaringan`, `A2 Simpan Data ke cache`, `A3 Simpan Operasi ke Antrean`, `A4 Proses Sinkronisasi`, `A5 Tangani Konflik dan Percobaan Ulang`. | Diagram pendamping memakai `Cache`, `Queue`, dan `Retry`. | 23 | `offline.config.ts`, `OfflineProvider`, `SyncProvider`, offline sync pages, queue manager, IndexedDB, background sync, conflict resolver, test offline/sync/PWA. | Perlu Penyesuaian Istilah Kecil |

## Bukti Implementasi Aplikasi

| Area | Bukti Route/Page | Bukti API/Config/Test | Kesimpulan |
|---|---|---|---|
| Autentikasi dan role | `src/pages/auth`, route login/register/reset password, protected route per role. | `auth.api.ts`, Supabase auth tests, role access tests. | Mendukung DFD 1.1 dan 1.2. |
| User dan role | `src/pages/admin/UsersPage.tsx`, `src/pages/admin/RolesPage.tsx`. | `users.api.ts`, `admin.api.ts`, test user/admin. | Mendukung DFD 1.2. |
| Jadwal | Route jadwal dosen, mahasiswa, laboran. | `jadwal.api.ts`, test jadwal. | Mendukung DFD 2.1. |
| Kuis dan bank soal | Halaman kuis dosen/mahasiswa, bank soal, create/edit/results/attempt. | `kuis.api.ts`, `bank-soal.api.ts`, test kuis dan offline attempt. | Mendukung DFD 2.2. |
| Materi | Halaman materi dosen dan mahasiswa. | `materi.api.ts`, komponen upload/viewer/offline materi. | Mendukung DFD 2.3. |
| Kelas, mata kuliah, assignment | Halaman admin kelas, mata kuliah, assignment. | `kelas.api.ts`, `mata-kuliah.api.ts`, `assignment.api.ts`. | Mendukung DFD 2.4. |
| Kehadiran dan nilai | Halaman kehadiran dosen, presensi mahasiswa, penilaian, nilai. | `kehadiran.api.ts`, `nilai.api.ts`. | Mendukung DFD 2.5. |
| Logbook | Halaman logbook mahasiswa dan review logbook dosen. | `logbook.api.ts`, test logbook. | Mendukung DFD 3.1. |
| Inventaris dan peminjaman | Halaman inventaris, peminjaman, persetujuan, peminjaman aktif, laporan. | `laboran.api.ts`, `reports.api.ts`, test laboran/reports. | Mendukung DFD 3.2. |
| Pengumuman dan notifikasi | Halaman pengumuman, notifikasi, notification center. | `announcements.api.ts`, `notification.api.ts`, notification tests. | Mendukung DFD 3.3. |
| Offline PWA | Offline sync page, offline bar/status, provider PWA. | `offline.config.ts`, `OfflineProvider`, `SyncProvider`, IndexedDB, queue, background sync, conflict resolver tests. | Mendukung DFD 4.1. |

## Masalah Potensial dan Cara Menjawab

### 1. DFD Level 1: Tabel 3 Memuat Keluaran Logis

Narasi Word pada Tabel 3 menjelaskan arah `Masuk`, `Keluar`, dan `2 Arah`. Ini aman secara konseptual karena tabel menjelaskan fungsi proses. Namun, jika gambar DFD Level 1 tidak menampilkan semua panah keluaran secara eksplisit, tambahkan kalimat penjelas agar pembaca tidak menganggap tabel menambah aliran baru.

Kalimat yang disarankan:

> Tabel alur data Level 1 menjelaskan masukan, keluaran logis, dan relasi penyimpanan data dari setiap proses. Rincian arah panah yang lebih spesifik ditampilkan pada diagram DFD Level 2 masing-masing proses.

### 2. DFD 2.2: Word Lebih Ringkas daripada Diagram

Pada Word, aktivitas DFD 2.2 diringkas menjadi A1-A6. Pada diagram pendamping, proses diperinci menjadi A1-A8 dengan 25 aliran data. Ini tidak mengubah substansi, karena Word merangkum aktivitas utama. Agar aman, tambahkan kalimat berikut pada bagian DFD 2.2:

> Tabel aktivitas internal pada proses 2.2 merangkum aktivitas utama pengelolaan kuis dan bank soal. Gambar DFD menampilkan rincian aliran data yang lebih detail, termasuk pemisahan proses ambil soal, pengerjaan kuis, auto-save offline, submit, penilaian, dan akses hasil.

### 3. Istilah Campuran Indonesia-Inggris

Istilah campuran tidak salah jika konsisten. Namun, karena gambar yang sudah diperbaiki memakai label seperti `Role`, `Redirect`, `Logout`, `Queue`, dan `Retry`, tabel Word sebaiknya memakai istilah yang sama atau memakai format padanan.

Format aman:

| Pola | Contoh |
|---|---|
| Label diagram utama | `A2 Ambil Data Role` |
| Padanan dalam kurung | `A2 Ambil Data Role (Peran)` |
| Hindari dua istilah terpisah di tempat berbeda | Jangan memakai `Peran` di tabel tetapi `Role` di gambar tanpa penjelasan. |

## Rekomendasi Revisi Word yang Operasional

| Lokasi Word | Teks Saat Ini | Teks Pengganti yang Disarankan | Alasan |
|---|---|---|---|
| Tabel 3 Alur Data DFD Level 1 | Belum ada penegasan keluaran logis | Tambahkan kalimat: `Tabel alur data Level 1 menjelaskan masukan, keluaran logis, dan relasi penyimpanan data dari setiap proses. Rincian arah panah yang lebih spesifik ditampilkan pada diagram DFD Level 2 masing-masing proses.` | Mencegah tafsir bahwa tabel menambah panah yang tidak digambar. |
| Tabel 6 Aktivitas 1.1 | `A2 Ambil Data Peran` | `A2 Ambil Data Role (Peran)` | Selaras dengan label gambar `A2 Ambil Data Role`. |
| Tabel 6 Aktivitas 1.1 | `A3 Bentuk Sesi Login` | `A3 Bentuk Session Login (Sesi Login)` | Selaras dengan label gambar dan tetap mudah dipahami. |
| Tabel 6 Aktivitas 1.1 | `A4 Pengalihan Berdasarkan Peran` | `A4 Redirect Berdasarkan Role (Pengalihan Berdasarkan Peran)` | Selaras dengan label gambar `Redirect Berdasarkan Role`. |
| Tabel 6 Aktivitas 1.1 | `A5 Keluar dari Sistem` | `A5 Logout (Keluar dari Sistem)` | Selaras dengan label gambar `Logout`. |
| Tabel 7 Aktivitas 1.2 | `Tetapkan Peran`, `Kelola Profil Peran`, `Ubah Status Pengguna`, `Hapus atau Arsipkan Pengguna` | Gunakan `Role` dan `User` sesuai gambar, atau tambahkan padanan dalam kurung. | Menghindari perbedaan istilah antara tabel dan gambar. |
| Tabel 9 Aktivitas 2.2 | A1-A6 ringkas | Tambahkan kalimat ringkasan DFD 2.2 seperti pada bagian masalah potensial. | Menjelaskan mengapa tabel Word lebih ringkas daripada diagram A1-A8. |
| Tabel 13 Aktivitas 3.1 | `A3 Telaah Logbook` | `A3 Review Logbook (Telaah Logbook)` | Selaras dengan menu aplikasi `Review Logbook`. |
| Tabel 14 Aktivitas 3.2 | `A4 Pantau Peminjaman Aktif` | `A4 Monitor Peminjaman Aktif (Pantau Peminjaman Aktif)` | Selaras dengan label diagram dan istilah aplikasi. |
| Tabel 14 Aktivitas 3.2 | `A5 Susun Laporan` | `A5 Laporan` atau `A5 Susun Laporan (Laporan)` | Selaras dengan label diagram dan route laporan. |
| Tabel 16 Aktivitas 4.1 | `A2 Simpan Data ke cache` | `A2 Simpan Data ke Cache` | Konsistensi kapital dan istilah data store. |
| Tabel 16 Aktivitas 4.1 | `A3 Simpan Operasi ke Antrean` | `A3 Simpan Operasi ke Queue (Antrean)` | Selaras dengan label diagram `Offline Queue`. |
| Tabel 16 Aktivitas 4.1 | `A5 Tangani Konflik dan Percobaan Ulang` | `A5 Tangani Konflik dan Retry (Percobaan Ulang)` | Selaras dengan label diagram dan konfigurasi retry. |

## Pernyataan Aman untuk Skripsi

Kalimat berikut dapat digunakan jika perlu menegaskan bahwa gambar DFD sudah sesuai Yourdon/DeMarco dan aplikasi:

> DFD pada penelitian ini menggunakan pendekatan Yourdon/DeMarco dengan pemisahan antara entitas eksternal, proses, data store, dan aliran data. Narasi pada Bab IV menjelaskan makna proses dan keluaran logis, sedangkan gambar DFD menampilkan aliran data yang divisualisasikan. Setiap proses yang dimodelkan telah diselaraskan dengan modul aplikasi aktif, seperti autentikasi, manajemen pengguna, jadwal, kuis, materi, kehadiran, logbook, peminjaman, pengumuman, notifikasi, dan sinkronisasi offline PWA.

## Kesimpulan Audit Mendalam

Berdasarkan file Word skripsi, file `.drawio`, dokumen pendamping DFD, dan kondisi aplikasi saat ini, narasi DFD pada Bab IV sudah sesuai secara substansi dengan sistem yang dibangun. Tidak ditemukan kebutuhan untuk mengubah alur penelitian, proses utama, entitas, data store, atau makna DFD.

Perbaikan yang disarankan bersifat penyelarasan istilah dan penambahan kalimat penjelas. Prioritas utama revisi manual pada Word adalah:

1. Tambahkan penegasan pada Tabel 3 DFD Level 1 tentang keluaran logis.
2. Selaraskan istilah DFD 1.1 dan 1.2 dengan label gambar.
3. Tambahkan kalimat bahwa Tabel DFD 2.2 adalah ringkasan aktivitas utama, sedangkan gambar menampilkan rincian aliran data.
4. Selaraskan istilah kecil pada DFD 3.1, 3.2, dan 4.1.

Setelah empat poin tersebut dilakukan, bagian DFD pada Bab IV lebih aman dipertanggungjawabkan karena konsisten dengan notasi Yourdon/DeMarco, sesuai dengan gambar, dan terbukti relevan dengan aplikasi aktif.
