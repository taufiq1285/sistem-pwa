# Gambar 5. DFD Level 2 Proses 1.1 Autentikasi dengan Notasi Yourdon/DeMarco

Dokumen ini menjadi panduan menggambar ulang DFD Level 2 proses `1.1 Autentikasi` di Microsoft Visio. Fokus gambar adalah notasi DFD Yourdon/DeMarco, bukan flowchart dan bukan swimlane.

## Panduan Menggambar di Microsoft Visio

Gunakan stencil **Data Flow Diagram** di Microsoft Visio, lalu pilih simbol berikut:

| Komponen DFD | Simbol Visio | Elemen pada Diagram |
|---|---|---|
| Entitas eksternal | `External Interactor`, `External Interaction`, atau `Entity` | `Pengguna`, `Supabase Auth` |
| Proses | `Data Process` | `A1` sampai `A5` |
| Data store | `Data Store` | `D1 Data User dan Role` |
| Aliran data | `Dynamic Connector` dengan panah | Semua garis berlabel data |

Jangan gunakan simbol flowchart seperti `Start`, `Stop`, `Decision`, `Document`, atau swimlane, karena diagram ini dipertanggungjawabkan sebagai DFD Yourdon/DeMarco.

## Sketsa Posisi Gambar

Gunakan sketsa berikut sebagai acuan tata letak saat menggambar di Visio. Sketsa ini hanya menunjukkan posisi umum; label lengkap setiap panah ada pada bagian daftar aliran data.

```text
[Pengguna] ---> (A1 Validasi Kredensial) ---> [Supabase Auth]
     ^                |        ^                      ^
     |                v        |                      |
     |          (A2 Ambil Data Role) <----> D1 Data User dan Role
     |                |
     |                v
     |          (A3 Bentuk Session Login)
     |                |
     |                v
     +--------- (A4 Redirect Berdasarkan Role)

[Pengguna] ---> (A5 Logout) ---> [Supabase Auth]
     ^              |
     +--------------+
```

## Layout Visio yang Disarankan

| Posisi | Elemen | Simbol |
|---|---|---|
| Kiri | `Pengguna` | Entitas eksternal |
| Tengah atas | `A1 Validasi Kredensial` | Data Process |
| Tengah | `A2 Ambil Data Role` | Data Process |
| Tengah kanan | `A3 Bentuk Session Login` | Data Process |
| Kanan tengah/bawah | `A4 Redirect Berdasarkan Role` | Data Process |
| Kanan | `Supabase Auth` | Entitas eksternal |
| Bawah tengah dekat A2 | `D1 Data User dan Role` | Data Store |
| Bawah kiri/tengah | `A5 Logout` | Data Process |

Pisahkan jalur login berhasil, login gagal, dan logout. Jalur logout sebaiknya diletakkan di bagian bawah agar tidak menabrak alur login.

## Daftar Aliran Data yang Wajib Digambar

| No | Dari | Ke | Label Aliran Data |
|---|---|---|---|
| 1 | `Pengguna` | `A1 Validasi Kredensial` | `email dan password` |
| 2 | `A1 Validasi Kredensial` | `Supabase Auth` | `data autentikasi` |
| 3 | `Supabase Auth` | `A1 Validasi Kredensial` | `status validasi login` |
| 4 | `A1 Validasi Kredensial` | `A2 Ambil Data Role` | `status login valid` |
| 5 | `A1 Validasi Kredensial` | `Pengguna` | `notifikasi login gagal` |
| 6 | `A2 Ambil Data Role` | `D1 Data User dan Role` | `data user dan role` |
| 7 | `A2 Ambil Data Role` | `A3 Bentuk Session Login` | `role pengguna valid` |
| 8 | `A3 Bentuk Session Login` | `A4 Redirect Berdasarkan Role` | `session login aktif` |
| 9 | `A4 Redirect Berdasarkan Role` | `Pengguna` | `hak akses pengguna` |
| 10 | `Pengguna` | `A5 Logout` | `permintaan logout` |
| 11 | `A5 Logout` | `Supabase Auth` | `permintaan akhir sesi` |
| 12 | `A5 Logout` | `Pengguna` | `status logout berhasil` |

Catatan: pada file draw.io, aliran `A2 Ambil Data Role` dengan `D1 Data User dan Role` ditampilkan sebagai satu konektor data store dengan label `data user dan role`. Saat menggambar di Visio, gunakan satu konektor berlabel tersebut agar jumlah aliran tetap sama dengan DFD sumber.

## Keterangan Simbol untuk Skripsi

Diagram ini menggunakan notasi DFD Yourdon/DeMarco. Kotak menunjukkan entitas eksternal, lingkaran menunjukkan proses, data store menunjukkan tempat penyimpanan data, dan panah berlabel menunjukkan aliran data.

Pada diagram ini, `Pengguna` dan `Supabase Auth` merupakan entitas eksternal. Proses internal autentikasi terdiri dari `A1 Validasi Kredensial`, `A2 Ambil Data Role`, `A3 Bentuk Session Login`, `A4 Redirect Berdasarkan Role`, dan `A5 Logout`. Data store yang digunakan adalah `D1 Data User dan Role`.

## Ringkasan Alur

Alur login dimulai ketika `Pengguna` mengirim `email dan password` ke `A1 Validasi Kredensial`. Proses `A1` meneruskan `data autentikasi` ke `Supabase Auth`, kemudian menerima `status validasi login`. Jika valid, `A1` mengirim `status login valid` ke `A2 Ambil Data Role`. Jika tidak valid, `A1` mengirim `notifikasi login gagal` kepada `Pengguna`.

Setelah login valid, `A2` membaca `data user dan role` dari `D1 Data User dan Role`, lalu mengirim `role pengguna valid` ke `A3 Bentuk Session Login`. Proses `A3` menghasilkan `session login aktif` dan meneruskannya ke `A4 Redirect Berdasarkan Role`. Selanjutnya `A4` mengirim `hak akses pengguna` kepada `Pengguna`.

Untuk logout, `Pengguna` mengirim `permintaan logout` ke `A5 Logout`. Proses `A5` mengirim `permintaan akhir sesi` ke `Supabase Auth`, lalu mengirim `status logout berhasil` kepada `Pengguna`.
