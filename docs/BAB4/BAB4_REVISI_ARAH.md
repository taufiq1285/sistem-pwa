# Arah Revisi dan Penguatan Alur [`docs/BAB4.md`](docs/BAB4.md)

Dokumen ini disusun sebagai dokumen pendamping untuk meninjau alur penulisan pada [`docs/BAB4.md`](docs/BAB4.md) tanpa menghapus isi yang sudah ada. Fokus dokumen ini adalah menunjukkan bagian yang sudah kuat, bagian yang masih perlu diperbaiki, serta urutan pembahasan yang paling aman untuk Bab Hasil dan Pembahasan skripsi.

## 1. Tujuan dokumen pendamping

Dokumen ini dibuat untuk tiga tujuan utama:

1. Menilai apakah urutan pembahasan pada [`docs/BAB4.md`](docs/BAB4.md) sudah sesuai dengan karakter Bab Hasil dan Pembahasan.
2. Menunjukkan bagian mana yang perlu diperkuat tanpa harus langsung mengubah naskah utama.
3. Menyediakan acuan revisi naratif agar penyajian hasil tidak berhenti pada dokumentasi diagram dan screenshot, tetapi sampai pada analisis yang relevan dengan tujuan penelitian.

## 2. Ringkasan penilaian terhadap alur [`docs/BAB4.md`](docs/BAB4.md)

Secara umum, alur pada [`docs/BAB4.md`](docs/BAB4.md) sudah berada di jalur yang benar karena bergerak dari:

1. hasil perancangan sistem,
2. hasil rancangan data,
3. hasil implementasi sistem,
4. implementasi fitur per modul dan per role.

Pola ini secara dasar sudah dapat diterima untuk skripsi pengembangan sistem informasi. Namun, setelah dianalisis lebih rinci, ada beberapa titik yang perlu diperkuat agar bab ini lebih konsisten sebagai Bab Hasil dan Pembahasan.

## 3. Bagian yang sudah kuat

### 3.1. Urutan DFD → ERD → Skema Database

Urutan ini sudah tepat karena:
- DFD menjelaskan alur proses bisnis,
- ERD menjelaskan relasi data,
- skema database menjelaskan implementasi teknis penyimpanan data.

Dengan urutan tersebut, pembaca dibawa memahami sistem dari sisi proses, lalu struktur data, lalu basis implementasinya. Ini merupakan kekuatan utama bagian awal [`docs/BAB4.md`](docs/BAB4.md).

### 3.2. Penguatan sisi backend sudah mulai terlihat

Pada bagian autentikasi, admin, ERD, skema database, dan sinkronisasi offline, [`docs/BAB4.md`](docs/BAB4.md) sudah mulai memperlihatkan bahwa sistem tidak hanya dibangun dari antarmuka, tetapi juga dari kontrol akses, basis data, dan mekanisme offline-first.

### 3.3. ERD per domain adalah keputusan yang tepat

Pendekatan per domain yang dirangkum pada [`docs/ERD_BACKEND_MERMAID.md`](docs/ERD_BACKEND_MERMAID.md) merupakan solusi yang benar. Hal ini karena jumlah entitas cukup besar dan jika dipaksakan ke dalam satu ERD tunggal, keterbacaan akan turun drastis. Pembagian domain justru membuat pembahasan lebih akademik dan lebih mudah dipetakan ke modul sistem.

## 4. Bagian yang masih perlu diperbaiki secara konseptual

### 4.1. Porsi “hasil perancangan” masih sangat dominan

Pada [`docs/BAB4.md`](docs/BAB4.md), bagian hasil perancangan sangat panjang dan kaya. Ini tidak salah, tetapi berisiko membuat pembaca merasa bahwa bab lebih dekat ke dokumentasi desain daripada pembahasan hasil penelitian.

Agar aman secara akademik, bagian perancangan harus terus diposisikan sebagai:
- hasil rancangan final yang telah diselaraskan dengan implementasi aktual,
- bukan rancangan hipotetis atau teoritis semata.

### 4.2. Irama pembahasan berubah tajam saat masuk implementasi

Setelah bagian ERD dan skema database, gaya penulisan pada [`docs/BAB4.md`](docs/BAB4.md) cenderung bergeser cepat dari analitis ke deskriptif. Hal ini terlihat ketika narasi mulai banyak membahas halaman, route, dashboard, dan tampilan.

Perubahan gaya ini tidak salah, tetapi perlu dikendalikan agar bab tidak terkesan berubah dari “hasil penelitian” menjadi “katalog tampilan aplikasi”.

### 4.3. Urutan domain ERD sudah layak, tetapi belum sepenuhnya mengikuti logika proses operasional

Urutan domain pada [`docs/BAB4.md`](docs/BAB4.md) saat ini adalah:
- pengguna dan peran,
- akademik: kelas dan materi,
- penilaian: kuis dan nilai,
- praktikum: jadwal, kehadiran, dan logbook,
- laboratorium dan inventaris,
- komunikasi,
- sinkronisasi offline.

Urutan ini masih dapat diterima karena disusun berdasarkan domain data. Namun, jika dilihat dari alur proses operasional, domain praktikum yang berisi jadwal sebetulnya sangat mendasar dan secara logika bisa diletakkan sebelum domain penilaian. Artinya, urutan sekarang tidak salah, tetapi bukan satu-satunya urutan terbaik.

### 4.4. Potensi kekurangan pada bab hasil dan pembahasan secara keseluruhan

Bab hasil dan pembahasan yang baik tidak berhenti pada:
- diagram,
- tabel,
- screenshot halaman,
- daftar fitur.

Bab ini harus berakhir pada:
- hasil pengujian,
- analisis ketercapaian tujuan penelitian,
- pembahasan kelebihan dan keterbatasan sistem.

Karena itu, jika bagian akhir [`docs/BAB4.md`](docs/BAB4.md) nantinya hanya berisi tampilan fitur, maka secara akademik bab ini masih akan terasa kurang lengkap.

## 5. Urutan pembahasan yang paling aman untuk Bab Hasil dan Pembahasan

Berikut alur yang paling aman dan kuat untuk dipakai sebagai acuan revisi naratif lanjutan.

### 5.1. Hasil Perancangan Sistem Final

Bagian ini tetap dipertahankan untuk memuat:
- DFD Level 1,
- DFD Level 2,
- interpretasi hubungan antarmodul.

Fungsinya adalah menunjukkan bahwa sistem dirancang berdasarkan kebutuhan dan logika proses yang jelas.

### 5.2. Hasil Perancangan Data Final

Bagian ini memuat:
- ERD per domain,
- skema database,
- diagram sinkronisasi offline.

Fungsinya adalah menunjukkan bahwa proses yang telah dijelaskan sebelumnya benar-benar didukung oleh struktur data yang relevan.

### 5.3. Hasil Implementasi Sistem

Bagian ini membahas:
- autentikasi,
- dashboard berbasis role,
- modul admin,
- modul dosen,
- modul mahasiswa,
- modul laboran,
- fitur pendukung seperti notifikasi, inventaris, peminjaman, dan sinkronisasi.

Pada bagian ini, setiap modul tidak hanya dijelaskan dari sisi tampilan, tetapi juga dari sisi fungsi sistemik dan keterkaitannya dengan backend.

### 5.4. Hasil Pengujian Sistem

Bagian ini idealnya memuat:
- pengujian fungsional,
- pengujian role dan hak akses,
- pengujian fitur PWA/offline,
- pengujian alur akademik utama,
- bila ada, pengujian usability atau evaluasi pengguna.

Bagian ini sangat penting agar Bab Hasil dan Pembahasan tidak berhenti pada implementasi visual saja.

### 5.5. Pembahasan

Pada bagian ini, hasil-hasil sebelumnya dianalisis dalam kaitannya dengan:
- tujuan penelitian,
- permasalahan awal yang ingin diselesaikan,
- kontribusi sistem,
- kekuatan dan batasan implementasi.

Inilah bagian yang akan membuat Bab V benar-benar memenuhi unsur “pembahasan”, bukan sekadar “hasil implementasi”.

## 6. Analisis alur yang lebih rinci untuk tiap blok isi

### 6.1. Blok DFD

Bagian DFD pada [`docs/BAB4.md`](docs/BAB4.md) sudah kuat karena:
- menunjukkan proses inti sistem,
- menghubungkan aktor, data store, dan layanan eksternal,
- menjelaskan makna proses dalam konteks sistem praktikum PWA.

Yang harus dijaga adalah konsistensi narasi agar tetap selalu dikaitkan dengan implementasi aktual.

### 6.2. Blok ERD

Bagian ERD sekarang sudah lebih baik karena didorong ke arah domain. Ini memperkuat dua hal:
- keterbacaan visual,
- kedalaman pembahasan per modul data.

Yang masih perlu dijaga adalah agar setiap domain tidak hanya diuraikan sebagai “daftar relasi tabel”, tetapi juga sebagai dasar logika fitur pada aplikasi.

### 6.3. Blok skema database

Bagian skema database penting untuk menjembatani ERD dan implementasi. Pada titik ini, Anda sudah benar menegaskan bahwa penelitian menghasilkan bukan hanya antarmuka, tetapi juga lapisan data dan layanan.

Yang perlu dipastikan adalah bahwa bagian ini tetap ringkas dan tidak tenggelam dalam detail teknis yang terlalu granular.

### 6.4. Blok implementasi autentikasi

Ini sudah berada pada urutan yang tepat. Autentikasi sebaiknya memang menjadi subbagian pertama implementasi karena semua modul lain bergantung padanya.

Kekuatan narasi pada bagian ini adalah bahwa autentikasi sudah dijelaskan tidak hanya sebagai form login, tetapi juga sebagai pintu masuk ke mekanisme role, session, dan proteksi akses.

### 6.5. Blok implementasi admin dan role lain

Urutan admin sebelum dosen/mahasiswa/laboran dapat diterima karena admin berfungsi sebagai pengelola data master. Namun, agar lebih kuat secara pembahasan, setiap role perlu selalu ditautkan dengan:
- data apa yang dikelola,
- proses mana yang didukung,
- hasil apa yang dibuktikan dari implementasinya.

## 7. Rekomendasi perbaikan yang paling penting

Berikut rekomendasi yang paling penting untuk revisi lanjutan naskah utama.

### 7.1. Pertahankan struktur besar yang ada

Struktur besar pada [`docs/BAB4.md`](docs/BAB4.md) tidak perlu dirombak total karena fondasinya sudah benar.

### 7.2. Gunakan dokumen ERD per domain sebagai acuan visual tetap

Dokumen [`docs/ERD_BACKEND_MERMAID.md`](docs/ERD_BACKEND_MERMAID.md) sudah layak dijadikan sumber tetap untuk gambar backend pada Bab V.

### 7.3. Tambahkan pengujian dan pembahasan sintesis jika belum ada

Ini adalah kebutuhan paling penting secara akademik. Tanpa bagian ini, bab hasil dan pembahasan akan terasa belum tuntas.

### 7.4. Jaga agar pembahasan implementasi tidak berubah menjadi katalog halaman

Saat menulis subbab implementasi, prioritaskan kalimat yang menjawab:
- fungsi apa yang dibuktikan,
- proses apa yang didukung,
- mengapa implementasi itu penting terhadap tujuan penelitian.

### 7.5. Sinkronisasi offline harus diposisikan sebagai poin pembeda utama

Karena karakter PWA dan fitur offline-first adalah kekuatan sistem Anda, diagram dan narasinya sebaiknya diperlakukan sebagai bagian hasil penting, bukan sekadar pelengkap teknis.

## 8. Urutan ideal yang disarankan bila nanti disusun ulang secara halus

Jika suatu saat ingin menyusun ulang tanpa merombak total, urutan ideal halus yang bisa dipakai adalah:

1. DFD Level 1 dan Level 2
2. ERD per domain: pengguna dan peran
3. ERD per domain: akademik dasar
4. ERD per domain: praktikum
5. ERD per domain: penilaian
6. ERD per domain: laboratorium dan inventaris
7. ERD per domain: komunikasi
8. diagram sinkronisasi offline
9. skema database ringkas
10. hasil implementasi autentikasi
11. hasil implementasi per role
12. hasil pengujian
13. pembahasan akhir terhadap tujuan penelitian

Urutan ini mengikuti pola:
- proses,
- data,
- implementasi,
- verifikasi,
- analisis.

## 9. Kesimpulan akhir dokumen pendamping

Setelah dianalisis secara rinci, [`docs/BAB4.md`](docs/BAB4.md) **sudah memiliki fondasi alur yang baik** dan tidak perlu dianggap salah secara struktur. Kekuatan utamanya terletak pada hubungan yang sudah jelas antara proses sistem, rancangan data, dan implementasi modul.

Namun, ada beberapa hal yang perlu terus diperkuat pada revisi lanjutan:
- menjaga agar bagian hasil perancangan tetap terasa sebagai hasil rancangan final yang terverifikasi,
- menjaga agar bagian implementasi tetap analitis dan tidak hanya menjadi daftar halaman,
- memastikan ada pengujian dan pembahasan sintesis,
- serta menempatkan sinkronisasi offline sebagai kekuatan backend yang khas.

Dengan demikian, dokumen utama [`docs/BAB4.md`](docs/BAB4.md) dapat dipertahankan sebagai naskah dasar, sedangkan dokumen ini berfungsi sebagai panduan untuk memastikan revisi berikutnya tetap konsisten dengan kaidah penulisan Bab Hasil dan Pembahasan skripsi.