# Narasi Alur DFD Level 2 — Proses 1.1 Autentikasi

Dokumen ini berisi narasi/tulisan alur khusus untuk diagram [`docs/DFD-Level2-1.1-Autentikasi-Yourdon.drawio`](docs/DFD-Level2-1.1-Autentikasi-Yourdon.drawio), sehingga bisa langsung dipakai di naskah skripsi pada bagian pembahasan DFD Level 2.

---

## 1. Tujuan Proses 1.1

Proses `1.1 Autentikasi` bertujuan memastikan bahwa hanya pengguna yang memiliki kredensial valid yang dapat masuk ke sistem, memperoleh hak akses sesuai peran (role), dan menutup sesi akses secara benar melalui mekanisme logout.

Proses ini melibatkan:
- **Entitas eksternal**: Pengguna, Supabase Auth
- **Data store**: D1 Data User dan Role
- **Aktivitas internal**: `A1` sampai `A5`

Acuan konsistensi proses mengacu pada [`docs/DFD.md`](docs/DFD.md) dan [`docs/NARASI_DFD_LEVEL1_LEVEL2.md`](docs/NARASI_DFD_LEVEL1_LEVEL2.md).

---

## 2. Komponen pada Diagram

### 2.1 Entitas Eksternal
1. **Pengguna**  
   Aktor yang mengirimkan data login, menerima hasil autentikasi, menerima hak akses, dan mengirim permintaan logout.
2. **Supabase Auth**  
   Layanan autentikasi eksternal untuk memverifikasi kredensial dan mengonfirmasi status login/logout.

### 2.2 Data Store
- **D1 Data User dan Role**  
  Menyimpan data akun pengguna dan data role yang dibutuhkan setelah login berhasil.

### 2.3 Aktivitas Internal
1. `A1 Validasi Kredensial`
2. `A2 Ambil Data Role`
3. `A3 Bentuk Session Login`
4. `A4 Redirect Berdasarkan Role`
5. `A5 Logout`

---

## 3. Narasi Alur Utama (Login Berhasil)

Alur login berhasil pada diagram berjalan sebagai berikut:

1. Pengguna mengirim **email dan password** ke aktivitas `A1 Validasi Kredensial`.
2. Aktivitas `A1` meneruskan **data autentikasi** ke entitas eksternal Supabase Auth.
3. Supabase Auth mengirim balik **status validasi login** ke `A1`.
4. Jika valid, `A1` mengirim **status login valid** ke `A2 Ambil Data Role`.
5. `A2` membaca **data user dan role** dari data store D1.
6. Setelah role valid diperoleh, `A2` meneruskan **role pengguna valid** ke `A3 Bentuk Session Login`.
7. `A3` membentuk sesi aktif lalu mengirim **session login aktif** ke `A4 Redirect Berdasarkan Role`.
8. `A4` mengirim **hak akses pengguna** kembali ke entitas Pengguna sesuai role (admin/dosen/laboran/mahasiswa).

Inti alur ini menunjukkan bahwa akses tidak diberikan hanya karena password benar, tetapi juga setelah pembacaan role dari D1 dan pembentukan session.

---

## 4. Narasi Alur Gagal Login

Jika kredensial tidak valid:

1. Pengguna tetap mengirim **email dan password** ke `A1`.
2. `A1` tetap meminta validasi ke Supabase Auth.
3. Saat status dari Supabase menyatakan gagal, `A1` mengirim **notifikasi login gagal** ke Pengguna.
4. Alur tidak diteruskan ke `A2`, `A3`, dan `A4`.

Makna proses ini adalah kontrol keamanan: sistem menghentikan alur sebelum role/session dibentuk.

---

## 5. Narasi Alur Logout

Mekanisme logout pada diagram berjalan sebagai berikut:

1. Pengguna mengirim **permintaan logout** ke `A5 Logout`.
2. `A5` mengirim **permintaan akhir sesi** ke Supabase Auth agar sesi pada layanan autentikasi dinonaktifkan.
3. Setelah proses akhir sesi diproses, `A5` mengirim **status logout berhasil** ke Pengguna.

Dengan demikian, logout diperlakukan sebagai akhir alur autentikasi yang eksplisit, bukan sekadar menutup halaman aplikasi.

---

## 6. Penjelasan Setiap Aliran Data pada Diagram

1. **f1 — email dan password**: input kredensial dari Pengguna ke `A1`.
2. **f2 — data autentikasi**: data validasi dari `A1` ke Supabase Auth.
3. **f3 — status validasi login**: hasil verifikasi dari Supabase Auth ke `A1`.
4. **f4 — status login valid**: sinyal lanjut dari `A1` ke `A2`.
5. **f5 — notifikasi login gagal**: pesan gagal dari `A1` ke Pengguna.
6. **f6 — data user dan role**: pertukaran data antara `A2` dan D1.
7. **f7 — role pengguna valid**: role terverifikasi dari `A2` ke `A3`.
8. **f8 — session login aktif**: hasil pembentukan session dari `A3` ke `A4`.
9. **f9 — hak akses pengguna**: hasil redirect dan otorisasi dari `A4` ke Pengguna.
10. **f10 — permintaan logout**: trigger keluar dari Pengguna ke `A5`.
11. **f11 — permintaan akhir sesi**: perintah terminasi sesi dari `A5` ke Supabase Auth.
12. **f12 — status logout berhasil**: konfirmasi akhir dari `A5` ke Pengguna.

---

## 7. Ringkasan Alur Siap Pakai di Skripsi

Proses `1.1 Autentikasi` dimulai saat pengguna mengirimkan email dan password ke sistem. Sistem memverifikasi kredensial ke layanan autentikasi eksternal. Jika valid, sistem mengambil role pengguna dari data store, membentuk session login aktif, lalu mengarahkan pengguna ke hak akses sesuai perannya. Jika tidak valid, sistem mengirim notifikasi login gagal dan menghentikan alur. Ketika pengguna melakukan logout, sistem mengakhiri sesi melalui layanan autentikasi dan mengirim status logout berhasil. Alur ini menunjukkan bahwa autentikasi pada sistem tidak hanya memeriksa identitas, tetapi juga mengelola pembentukan dan pengakhiran akses secara terkontrol.

---

## 8. Catatan Penulisan Bab Skripsi

Urutan penyajian yang disarankan:
1. Tampilkan gambar dari [`docs/DFD-Level2-1.1-Autentikasi-Yourdon.drawio`](docs/DFD-Level2-1.1-Autentikasi-Yourdon.drawio).
2. Jelaskan komponen (entitas, proses, data store).
3. Tulis alur login berhasil, login gagal, dan logout.
4. Tutup dengan ringkasan fungsi keamanan dan kontrol akses.

Dengan format ini, pembahasan menjadi runtut, teknis, dan mudah dipahami penguji.