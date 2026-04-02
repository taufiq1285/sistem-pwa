# Narasi Alur DFD Level 2 — 4.1 Sinkronisasi Offline PWA

Dokumen ini menjelaskan alur proses pada diagram [`docs/DFD-Level2-4.1-Sinkronisasi-Offline-PWA-Yourdon.drawio`](docs/DFD-Level2-4.1-Sinkronisasi-Offline-PWA-Yourdon.drawio).

## 1. Tujuan Proses 4.1

Proses [`4.1 Sinkronisasi Offline PWA`](docs/DFD.md:637) bertujuan menjaga kontinuitas layanan aplikasi ketika pengguna berada pada kondisi offline, sekaligus memastikan data cache, antrean operasi, dan hasil sinkronisasi dapat dikelola kembali secara aman saat koneksi tersedia.

## 2. Komponen Proses

- **Entitas eksternal:** Admin, Dosen, Mahasiswa, Laboran, Supabase
- **Data store:** D1 Database dan Conflict Log, D2 IndexedDB Cache, D3 Offline Queue
- **Aktivitas internal:**
  - `A1` Deteksi Status Jaringan
  - `A2` Simpan Data ke Cache
  - `A3` Simpan Operasi ke Queue
  - `A4` Proses Sinkronisasi
  - `A5` Tangani Konflik dan Retry

## 3. Narasi Alur Utama

1. Admin, dosen, mahasiswa, atau laboran memicu [`A1 Deteksi Status Jaringan`](docs/DFD.md:650) ketika melakukan aktivitas yang dapat berjalan pada mode online maupun offline.
2. Sistem membaca status jaringan dan meneruskannya ke [`A2 Simpan Data ke Cache`](docs/DFD.md:651) untuk menjaga ketersediaan data lokal yang masih diperlukan pengguna.
3. Pada aktivitas ini, sistem menyimpan atau mengambil data dari [`D2 IndexedDB Cache`](docs/DFD.md:647) agar informasi penting tetap dapat diakses ketika koneksi tidak stabil.
4. Jika selama kondisi offline terjadi operasi tulis atau perubahan data, sistem meneruskannya ke [`A3 Simpan Operasi ke Queue`](docs/DFD.md:652).
5. Aktivitas `A3` menyimpan antrean operasi pada [`D3 Offline Queue`](docs/DFD.md:648) supaya perubahan tidak hilang dan dapat diproses kembali saat koneksi pulih.
6. Ketika pengguna memicu sinkronisasi atau koneksi kembali tersedia, sistem menjalankan [`A4 Proses Sinkronisasi`](docs/DFD.md:653).
7. Pada tahap ini, sistem mengambil antrean dari `D3`, mengirimkan data sinkronisasi ke [`Supabase`](docs/DFD.md:645), dan mencatat interaksi yang relevan ke [`D1 Database dan Conflict Log`](docs/DFD.md:646).
8. Hasil sinkronisasi kemudian diteruskan ke [`A5 Tangani Konflik dan Retry`](docs/DFD.md:654) untuk menentukan apakah data berhasil diproses, perlu percobaan ulang, atau mengalami konflik.
9. Jika terjadi konflik atau kegagalan, `A5` memperbarui cache pada `D2`, menandai atau menjadwalkan retry pada `D3`, dan menyimpan hasil resolusi atau konflik ke `D1`.
10. Setelah proses selesai, sistem mengirimkan status sinkronisasi kepada admin, dosen, mahasiswa, dan laboran agar kondisi data dapat dipantau dengan jelas.

## 4. Output Kunci

- Status jaringan dapat dikenali sebagai dasar penentuan mode layanan.
- Data penting tetap tersedia melalui cache lokal berbasis IndexedDB.
- Operasi tulis saat offline tidak hilang karena dicatat ke antrean sinkronisasi.
- Sinkronisasi ke server dapat dijalankan kembali ketika koneksi tersedia.
- Konflik data dan retry dapat ditangani serta dicatat secara terkontrol.
- Pengguna memperoleh status hasil sinkronisasi setelah proses selesai.

## 5. Ringkasan Siap Pakai Skripsi

Proses [`4.1 Sinkronisasi Offline PWA`](docs/DFD.md:637) menunjukkan bahwa dukungan offline pada aplikasi tidak hanya berarti penyimpanan data sementara, tetapi mencakup deteksi jaringan, pengelolaan cache, pencatatan operasi ke queue, sinkronisasi ulang ke server, penanganan konflik, dan pelaporan status hasil. Dengan mekanisme ini, sistem tetap mampu menjaga kesinambungan layanan bagi berbagai peran pengguna meskipun kondisi internet berubah-ubah.
