# Narasi Alur DFD Level 2 — 4.1 Sinkronisasi Offline PWA

Dokumen ini menjelaskan alur proses pada diagram [`docs/DFD-Level2-4.1-Sinkronisasi-Offline-PWA-Yourdon.drawio`](docs/DFD-Level2-4.1-Sinkronisasi-Offline-PWA-Yourdon.drawio).

## 1. Tujuan Proses 4.1

Proses [`4.1 Sinkronisasi Offline PWA`](docs/DFD.md:591) bertujuan menjaga kontinuitas layanan aplikasi ketika perangkat berada pada kondisi offline, sekaligus memastikan data lokal dapat disinkronkan kembali secara aman saat koneksi internet tersedia.

## 2. Komponen Proses

- **Entitas eksternal:** Mahasiswa, Service Worker, Supabase / Server API
- **Data store:** D1 Cache Offline, D2 Queue Sinkronisasi
- **Aktivitas internal:**
  - `A1` Deteksi Status Koneksi
  - `A2` Kelola Cache Offline
  - `A3` Catat Perubahan ke Queue
  - `A4` Sinkronkan Data ke Server
  - `A5` Tangani Konflik dan Retry

## 3. Narasi Alur Utama

1. Mahasiswa atau aplikasi memicu `A1 Deteksi Status Koneksi` ketika ada permintaan akses data atau perubahan data.
2. Service Worker juga mengirimkan status jaringan dan event offline ke `A1`, sehingga sistem dapat menentukan apakah proses berjalan pada mode online atau offline.
3. Jika data perlu tetap tersedia saat koneksi terbatas, sistem meneruskan status koneksi ke `A2 Kelola Cache Offline`.
4. Pada aktivitas ini, sistem menyimpan atau mengambil data dari D1 Cache Offline agar data tetap dapat dipakai ketika perangkat tidak terhubung ke jaringan.
5. Jika terjadi perubahan lokal saat offline, `A2` meneruskan data perubahan ke `A3 Catat Perubahan ke Queue`.
6. Aktivitas `A3` menyimpan atau membaca antrean perubahan pada D2 Queue Sinkronisasi supaya operasi tulis tidak hilang.
7. Saat koneksi kembali tersedia, antrean sinkronisasi diteruskan ke `A4 Sinkronkan Data ke Server`.
8. `A4` mengambil queue sinkronisasi dan mengirim payload sinkronisasi ke entitas Supabase / Server API.
9. Server mengirim respons sinkronisasi kembali ke `A4` sebagai dasar status berhasil, gagal, atau konflik.
10. Hasil sinkronisasi lalu diteruskan ke `A5 Tangani Konflik dan Retry`.
11. Jika terjadi konflik atau kegagalan, `A5` memperbarui D2 Queue Sinkronisasi untuk retry dan mengirim status sinkronisasi/konflik ke Service Worker.
12. Setelah itu, sistem mengirim notifikasi hasil sinkronisasi kepada mahasiswa agar kondisi data lokal dan server diketahui dengan jelas.

## 4. Output Kunci

- Status koneksi dapat dikenali melalui interaksi aplikasi dan Service Worker.
- Data offline tetap tersedia melalui cache lokal.
- Perubahan lokal saat offline tidak hilang karena dicatat di antrean sinkronisasi.
- Sinkronisasi ke Supabase / Server API dapat dijalankan saat koneksi kembali tersedia.
- Konflik atau kegagalan sinkronisasi dapat ditangani melalui mekanisme retry.
- Mahasiswa menerima notifikasi hasil sinkronisasi secara jelas.

## 5. Ringkasan Siap Pakai Skripsi

Proses [`4.1 Sinkronisasi Offline PWA`](docs/DFD.md:591) menunjukkan bahwa dukungan offline pada aplikasi tidak hanya berarti menyimpan data sementara, tetapi mencakup deteksi jaringan, penyimpanan cache, antrean operasi, sinkronisasi ulang, penanganan konflik, dan pelaporan status. Dengan mekanisme ini, sistem tetap mampu menjaga kesinambungan layanan meskipun kondisi internet pengguna tidak stabil.