# Teks Siap Tempel Narasi DFD Bab IV

Dokumen ini berisi teks final yang dapat ditempel ke Bab IV skripsi untuk memperkuat bagian Data Flow Diagram (DFD). Isi dokumen disusun berdasarkan naskah Word final, hasil audit kesesuaian DFD, serta gambar DFD yang telah disesuaikan dengan notasi Yourdon/DeMarco.

## 1. Penegas Setelah Tabel Alur Data DFD Level 1

Letakkan paragraf berikut setelah Tabel Alur Data DFD Level 1.

```text
Tabel alur data Level 1 menjelaskan masukan, keluaran logis, dan relasi penyimpanan data dari setiap proses utama. Pada tingkat ini, keluaran proses dijelaskan secara konseptual untuk menunjukkan hasil data yang dihasilkan oleh sistem. Rincian arah panah yang lebih spesifik, termasuk hubungan antarproses, entitas eksternal, dan data store, ditampilkan pada diagram DFD Level 2 masing-masing proses.
```

## 2. Penegas Notasi Yourdon/DeMarco

Letakkan paragraf berikut pada awal pembahasan DFD Level 2.

```text
Seluruh DFD pada penelitian ini menggunakan pendekatan Yourdon/DeMarco dengan pemisahan antara entitas eksternal, proses, data store, dan aliran data. Entitas eksternal ditunjukkan dengan kotak, proses ditunjukkan dengan lingkaran atau bubble, data store menunjukkan tempat penyimpanan data, sedangkan panah berlabel menunjukkan data yang mengalir. Dengan demikian, diagram yang digunakan bukan flowchart, melainkan pemodelan aliran data sistem.
```

## 3. Tabel Aktivitas Internal 1.1 Autentikasi

| Kode Aktivitas | Deskripsi |
|---|---|
| A1 Validasi Kredensial | Sistem memverifikasi email dan password pengguna melalui layanan autentikasi. |
| A2 Ambil Data Role (Peran) | Sistem mengambil data role pengguna dari data user dan role. |
| A3 Bentuk Session Login (Sesi Login) | Sistem membentuk session login aktif pada aplikasi. |
| A4 Redirect Berdasarkan Role (Pengalihan Berdasarkan Peran) | Sistem mengarahkan pengguna ke dashboard sesuai hak akses. |
| A5 Logout (Keluar dari Sistem) | Sistem mengakhiri session login pengguna. |

## 4. Tabel Aktivitas Internal 1.2 Kelola User

| Kode Aktivitas | Deskripsi |
|---|---|
| A1 Buat Akun | Admin membuat akun user baru. |
| A2 Tetapkan Role (Peran) | Sistem menetapkan role user sesuai kewenangan. |
| A3 Kelola Profil Role (Profil Peran) | Data identitas sesuai role disimpan dan diperbarui. |
| A4 Ubah Status User (Pengguna) | Admin mengaktifkan atau menonaktifkan status user. |
| A5 Hapus atau Arsipkan User (Pengguna) | Admin menghapus atau mengarsipkan akun yang tidak digunakan. |

## 5. Penjelas untuk DFD 2.2 Kelola Kuis dan Bank Soal

Letakkan paragraf berikut sebelum atau setelah tabel aktivitas internal proses 2.2.

```text
Tabel aktivitas internal pada proses 2.2 merangkum aktivitas utama pengelolaan kuis dan bank soal. Gambar DFD menampilkan rincian aliran data yang lebih detail, termasuk pemisahan proses ambil soal, pengerjaan kuis, auto-save offline, submit, penilaian, dan akses hasil. Perbedaan tingkat rincian tersebut tidak mengubah makna proses, melainkan membantu agar narasi tetap ringkas sementara gambar tetap menunjukkan aliran data secara lengkap.
```

## 6. Tabel Aktivitas Internal 2.2 Kelola Kuis dan Bank Soal

| Kode Aktivitas | Deskripsi |
|---|---|
| A1 Buat Kuis | Dosen menyusun kuis beserta judul, durasi, kelas, dan parameter utama. |
| A2 Kelola Bank Soal | Dosen membuat, mengedit, memilih, atau memperbarui soal pada bank soal. |
| A3 Publish Kuis | Sistem memublikasikan kuis ke kelas sasaran dan memperbarui status kuis. |
| A4 Ambil Soal | Mahasiswa meminta dan mengambil soal kuis dari database atau cache. |
| A5 Kerjakan Kuis | Mahasiswa mengisi jawaban kuis pada aplikasi. |
| A6 Auto-save Offline | Sistem menyimpan jawaban sementara ke penyimpanan lokal atau offline queue ketika koneksi tidak stabil. |
| A7 Submit dan Penilaian | Sistem mengirim jawaban, menyimpan hasil, dan memproses penilaian. |
| A8 Lihat Hasil | Dosen melihat rekap hasil, statistik, dan nilai kuis. |

## 7. Tabel Aktivitas Internal 3.1 Logbook Digital

| Kode Aktivitas | Deskripsi |
|---|---|
| A1 Input Entri Logbook | Mahasiswa menulis entri kegiatan praktikum. |
| A2 Simpan Bukti atau Catatan | Sistem menyimpan isi logbook dan lampiran pendukung. |
| A3 Review Logbook (Telaah Logbook) | Dosen memeriksa logbook mahasiswa. |
| A4 Beri Umpan Balik | Dosen memberi catatan atau status review. |
| A5 Lihat Riwayat Logbook | Pengguna melihat riwayat logbook yang tersimpan. |

## 8. Tabel Aktivitas Internal 3.2 Peminjaman Alat dan Inventaris

| Kode Aktivitas | Deskripsi |
|---|---|
| A1 Kelola Inventaris | Laboran mengelola data inventaris alat. |
| A2 Ajukan Peminjaman | Dosen mengajukan permohonan peminjaman alat. |
| A3 Verifikasi dan Keputusan | Laboran atau admin memverifikasi serta menetapkan status peminjaman. |
| A4 Monitor Peminjaman Aktif (Pantau Peminjaman Aktif) | Sistem menampilkan status peminjaman yang sedang berjalan. |
| A5 Laporan | Sistem menyusun laporan terkait inventaris dan peminjaman. |

## 9. Tabel Aktivitas Internal 4.1 Sinkronisasi Offline PWA

| Kode Aktivitas | Deskripsi |
|---|---|
| A1 Deteksi Status Jaringan | Sistem mendeteksi kondisi online atau offline sebagai dasar penentuan mode layanan. |
| A2 Simpan Data ke Cache | Data penting disimpan secara lokal untuk mendukung akses offline. |
| A3 Simpan Operasi ke Queue (Antrean) | Operasi tulis ditahan sementara pada offline queue saat perangkat offline. |
| A4 Proses Sinkronisasi | Antrean operasi dikirim kembali ke sistem pusat ketika koneksi tersedia. |
| A5 Tangani Konflik dan Retry (Percobaan Ulang) | Sistem mengelola konflik data, retry, dan status hasil sinkronisasi. |

## 10. Checklist Gambar DFD Sebelum Masuk Word

Gunakan checklist berikut sebelum gambar DFD dimasukkan ke naskah skripsi.

| No | Hal yang Dicek | Status |
|---|---|---|
| 1 | Entitas eksternal menggunakan bentuk kotak. |  |
| 2 | Proses menggunakan bentuk lingkaran atau bubble. |  |
| 3 | Data store menggunakan simbol penyimpanan data. |  |
| 4 | Setiap panah memiliki label data. |  |
| 5 | Tidak ada panah yang berhenti tanpa tujuan. |  |
| 6 | Setiap panah tersambung ke entitas, proses, atau data store. |  |
| 7 | Tidak menggunakan simbol flowchart seperti Start, Stop, Decision, atau Document. |  |
| 8 | Tidak menggunakan swimlane sebagai simbol utama DFD. |  |
| 9 | Label proses pada gambar sama dengan tabel aktivitas. |  |
| 10 | Gambar final sudah mengikuti bentuk notasi DFD Yourdon/DeMarco. |  |

## 11. Kesimpulan Siap Tempel untuk Akhir Pembahasan DFD

Letakkan paragraf berikut pada akhir pembahasan DFD Level 2.

```text
Berdasarkan uraian DFD Level 1 dan DFD Level 2, dapat disimpulkan bahwa rancangan aliran data pada sistem telah selaras dengan implementasi aplikasi yang dibangun. Setiap proses utama memiliki keterkaitan dengan modul aplikasi, mulai dari autentikasi, manajemen user dan role, pengelolaan jadwal, kuis, bank soal, materi, kelas, assignment, kehadiran, penilaian, logbook, peminjaman alat, inventaris, pengumuman, notifikasi, hingga sinkronisasi offline PWA. Dengan menggunakan pendekatan Yourdon/DeMarco, DFD pada penelitian ini tidak hanya berfungsi sebagai gambar alur, tetapi juga sebagai bukti bahwa kebutuhan sistem telah diterjemahkan ke dalam struktur proses, data store, dan aliran data yang dapat dipertanggungjawabkan.
```

## 12. Catatan Penerapan

Teks dan tabel pada dokumen ini dapat ditempel ke Word sesuai kebutuhan. File Word final tetap menjadi naskah utama, sedangkan dokumen ini berfungsi sebagai bahan bantu untuk menyelaraskan istilah, tabel aktivitas, dan keterangan gambar DFD.
