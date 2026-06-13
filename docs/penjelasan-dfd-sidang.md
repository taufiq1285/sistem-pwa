# Panduan Penjelasan DFD untuk Sidang Skripsi

Dokumen ini berisi panduan dan ringkasan penjelasan seluruh Data Flow Diagram (DFD) pada skripsi Anda. Gunakan dokumen ini sebagai amunisi persiapan sidang, terutama jika penguji meminta Anda menjelaskan alur logika sistem.

**Kunci Menjawab Pertanyaan DFD:**
Jangan membaca nama simbolnya ("dari kotak admin lalu panah ke lingkaran..."), tetapi ceritakan **alur ceritanya** (data dari mana, diproses menjadi apa, dan disimpan di mana).

---

## 1. DFD Level 0 (Diagram Konteks)
**Fokus:** Batasan sistem secara umum.

**Penjelasan:** 
Ini adalah gambaran sistem secara utuh dari luar. Di tengah terdapat 1 sistem besar (Sistem Informasi Praktikum PWA) yang dikelilingi oleh 4 aktor/entitas (Admin, Dosen, Laboran, Mahasiswa). Diagram ini menunjukkan apa saja data yang masuk dari tiap aktor ke sistem, dan informasi apa yang mereka terima dari sistem.

> 💡 **Cara Menjawab di Sidang:**
> *"Diagram Konteks ini menunjukkan batasan sistem saya, Pak/Bu. Sistem berinteraksi dengan empat aktor: Admin, Dosen, Laboran, dan Mahasiswa. Contohnya, Mahasiswa memberikan input berupa entri logbook dan jawaban kuis, lalu sistem memberikan output berupa jadwal, materi, dan nilai kepada mereka."*

---

## 2. DFD Level 1
**Fokus:** Pemecahan sistem menjadi modul/proses utama.

**Penjelasan:** 
Sistem yang tadinya 1 lingkaran besar, dipecah menjadi **4 proses utama** yang saling terhubung:
1.  **1.0 Manajemen Akun dan Akses:** Mengatur autentikasi dan peran pengguna.
2.  **2.0 Manajemen Akademik Praktikum:** Inti dari kegiatan belajar-mengajar (Materi, Kuis, Jadwal, Nilai).
3.  **3.0 Operasional & Laboratorium:** Urusan fisik/administratif praktikum (Logbook, Peminjaman Alat, Pengumuman).
4.  **4.0 Layanan PWA & Sinkronisasi Offline:** Lapisan *background* (tak kasat mata) yang mengatur mode *offline* dan antrean sinkronisasi data.

> 💡 **Cara Menjawab di Sidang:**
> *"Pada Level 1, sistem saya bagi menjadi empat proses besar. Proses 1 mengurus akun dan login. Proses 2 mengurus kegiatan belajar seperti jadwal, materi, kuis, dan nilai. Proses 3 mengurus operasional laboratorium seperti logbook dan peminjaman alat. Dan yang paling penting, Proses 4 mengatur layanan PWA yang bekerja di latar belakang untuk mengelola data saat koneksi offline."*

---

## 3. DFD Level 2 (Rincian dari setiap proses Level 1)
Ini adalah detail fungsional dari sistem Anda. Total ada 11 diagram di Level 2. Berikut panduan cara menjelaskannya jika penguji menunjuk salah satu diagram:

### A. Turunan Proses 1 (Akun & Akses)
*   **Level 2.1 (Autentikasi):** Menjelaskan alur Login. Sistem mengecek *email/password* ke layanan Supabase (eksternal), lalu mengecek data Peran (Role) di database, membuat Sesi aktif, dan mengarahkan pengguna ke *dashboard* masing-masing (Admin/Dosen/Laboran/Mahasiswa).
*   **Level 2.2 (Kelola Pengguna):** Ini adalah area kerja Admin. Admin membuat akun baru, menetapkan peran, serta bisa mengubah status pengguna (aktif/nonaktif) atau mengarsipkan akun.

### B. Turunan Proses 2 (Akademik Praktikum)
*   **Level 2.3 (Kelola Jadwal):** Dosen mengajukan rancangan jadwal $\rightarrow$ sistem memvalidasi kelas dan ruang lab agar tidak bentrok $\rightarrow$ Laboran menyetujui jadwal $\rightarrow$ Jadwal resmi dipublikasi ke mahasiswa.
*   **Level 2.4 (Kuis & Bank Soal):** Dosen menyusun kuis dan bank soal $\rightarrow$ Mahasiswa mengambil paket soal dan mengerjakan. **Catatan Penting:** Di diagram ini terdapat aktivitas "Simpan Sementara saat Offline", di mana jawaban mahasiswa disimpan di *cache/queue* lokal jika koneksi tiba-tiba putus, lalu direkap saat *online* kembali.
*   **Level 2.5 (Kelola Materi):** Dosen mengunggah *file* $\rightarrow$ Sistem memisahkan penyimpanan berkas (*storage file*) dan informasi datanya (*metadata*) $\rightarrow$ Mahasiswa dapat mengunduh materi (sistem me-*cache* materi agar bisa dibaca saat *offline*).
*   **Level 2.6 (Kelola Kelas & Assignment):** Admin menyusun data master (siapa mahasiswa & dosen yang masuk di kelas mana). Kemudian dosen membuat tugas (*assignment*), dan mahasiswa mengumpulkan tugas (*submission*).
*   **Level 2.7 (Kehadiran & Penilaian):** Dosen menginput presensi (sistem memvalidasi kebenaran jadwal/kelas) $\rightarrow$ Dosen menginput nilai (dari kuis, tugas, atau penilaian manual) $\rightarrow$ Sistem merekap nilai akhir sebagai *output* untuk mahasiswa.

### C. Turunan Proses 3 (Operasional Lab)
*   **Level 2.8 (Logbook Digital):** Mahasiswa menginput catatan kegiatan & bukti foto $\rightarrow$ Disimpan oleh sistem $\rightarrow$ Dosen menelaah (*review*) dan memberikan umpan balik (catatan revisi/acc) $\rightarrow$ Menjadi riwayat logbook digital.
*   **Level 2.9 (Peminjaman Alat & Inventaris):** Laboran mengelola data barang (*inventaris*) $\rightarrow$ Dosen mengajukan permohonan peminjaman alat untuk praktikum $\rightarrow$ Laboran verifikasi & acc $\rightarrow$ Laporan penggunaan.
*   **Level 2.10 (Pengumuman & Notifikasi):** Admin membuat informasi $\rightarrow$ Sistem menyaring target perannya (misal: pengumuman spesifik hanya untuk mahasiswa atau dosen) $\rightarrow$ Ditampilkan di *dashboard* pengguna sebagai notifikasi.

### D. Turunan Proses 4 (PWA & Offline) - *Sangat Krusial!*
*   **Level 2.11 (Sinkronisasi Offline PWA):** Ini inti dari implementasi PWA di skripsi Anda. Alurnya:
    1. Sistem mendeteksi status jaringan perangkat (*online/offline*).
    2. Data yang pengguna lihat diambil dari **Cache Lokal (D2)**.
    3. Jika pengguna menyimpan data (misal jawab kuis/logbook) saat mati lampu/jaringan putus, datanya ditahan di **Offline Queue / Antrean Lokal (D3)**.
    4. Begitu internet menyala kembali, sistem memproses antrean tersebut (**Sinkronisasi** ke D1/Server).
    5. Jika gagal atau ada bentrok, sistem menangani konflik versi dan melakukan *retry* (percobaan ulang).

> 💡 **Cara Menjawab di Sidang (Jika ditanya DFD PWA):**
> *"Diagram Level 2.11 ini adalah jantung teknologi PWA di skripsi saya, Pak/Bu. Saat jaringan putus, sistem tidak langsung blank, tetapi membaca data dari Cache Lokal (D2). Jika mahasiswa menginput data, datanya akan ditahan sementara di Antrean Offline (D3). Begitu koneksi kembali tersedia, operasi di antrean tersebut akan otomatis disinkronkan ke Database Utama (D1). Mekanisme inilah yang memastikan praktikum tidak terhambat oleh masalah jaringan."*

---

## Tips Pamungkas Menghadapi Pertanyaan DFD

1.  **Hafalkan 4 Media Penyimpanan (Data Store) Utama Anda:**
    *   **D1 (Database Utama / Supabase):** Tempat penyimpanan data yang asli dan permanen (*Single Source of Truth*).
    *   **D2 (Cache Lokal / IndexedDB):** Penyimpanan lokal di dalam *browser* pengguna untuk mempercepat loading dan akses *offline*.
    *   **D3 (Offline Queue):** Kotak penampungan antrean "tugas tertunda" saat perangkat *offline* (data yang belum sempat terkirim ke server).
    *   **D4 (Storage File):** Tempat penyimpanan berkas-berkas berukuran besar (seperti PDF materi praktikum atau unggahan foto logbook).
2.  **Jika Lupa Simbol:** 
    *   **Kotak:** Orang/Aktor/Entitas Luar.
    *   **Lingkaran/Bubble:** Proses (Biasanya diawali Kata Kerja seperti "Kelola", "Buat", "Validasi").
    *   **Dua Garis Paralel (D1, D2):** Database / Tempat simpan data.
    *   **Tanda Panah:** Aliran data yang bergerak (apa yang dikirim dan apa yang diterima).
3.  **Perhatikan Penggunaan Kalimat:**
    Jangan menjelaskan DFD seolah-olah itu antarmuka aplikasi, seperti *"mahasiswa klik menu jadwal lalu klik simpan"*. DFD adalah **aliran data**. 
    Gunakan kalimat seperti: *"Sistem menerima data presensi dari dosen, memvalidasinya dengan data kelas, lalu menyimpannya ke database..."*

---

## 4. Penjelasan Ekstra: Implementasi PWA
Jika penguji bertanya: *"Bagaimana implementasi PWA mu dalam penelitian ini?"* 

Pertanyaan ini sangat krusial karena PWA adalah inti (nilai jual utama) dari skripsi Anda. Jangan sekadar menyebutkan kepanjangannya. Jelaskan bahwa Anda mengimplementasikannya melalui 4 komponen teknis utama.

> 💡 **Cara Menjawab di Sidang:**
> *"Terima kasih, Pak/Bu. Implementasi PWA dalam penelitian ini saya terapkan melalui 4 komponen utama agar aplikasi bisa berfungsi layaknya aplikasi native mobile meskipun jaringan tidak stabil, yaitu:*
> 
> *   **Pertama, Web App Manifest.** Saya menggunakan file `manifest.json` agar aplikasi praktikum ini dikenali browser sebagai aplikasi yang **dapat diinstal (Installable)** langsung ke *home screen* HP atau laptop mahasiswa tanpa harus lewat Play Store.*
> *   **Kedua, Service Worker.** Ini adalah nyawa dari PWA. Saya mengimplementasikan skrip *service worker* yang berjalan di latar belakang (background) untuk mencegat (intercept) jaringan. Fungsinya mengatur kapan aplikasi mengambil data dari internet, dan kapan mengambil data dari cache lokal.*
> *   **Ketiga, Mekanisme Caching dan IndexedDB.** Untuk fitur **Offline**, saya memisahkan dua penyimpanan lokal. File aset (desain, ikon) disimpan di **Cache API**. Sedangkan data dinamis praktikum (jadwal, soal kuis, absensi) saya simpan di database lokal browser bernama **IndexedDB**.*
> *   **Keempat, Offline Queue & Sinkronisasi (Background Sync).** Ini fitur terpenting. Jika mahasiswa mengisi logbook lalu internet putus, datanya tidak hilang tapi masuk ke **Offline Queue (Antrean Lokal)**. Begitu internet menyala kembali, sistem akan otomatis melakukan sinkronisasi antrean tersebut ke database utama (Supabase).*"

### Kemungkinan Pertanyaan Turunan (Follow-Up) Terkait PWA:
1.  **Penguji:** *"Apa bedanya aplikasi kamu ini sama website biasa yang responsif?"*
    **Jawaban Anda:** *"Website biasa kalau internet mati akan langsung menampilkan 'No Internet' (putus total). PWA saya, berkat Service Worker dan IndexedDB, aplikasinya tetap bisa dibuka, navigasi menu jalan, dan mahasiswa tetap bisa melanjutkan mengisi data walau offline total."*
2.  **Penguji:** *"Kalau datanya berbenturan gimana? Misal pas offline mahasiswa submit tugas, tapi pas online waktunya udah habis?"*
    **Jawaban Anda:** *"Sistem saya menangani konflik pada level sinkronisasi. Data dari offline queue memiliki *timestamp* waktu lokal. Saat online, Supabase memvalidasi timestamp tersebut untuk menentukan status datanya."*
3.  **Penguji:** *"Bisa tunjukkan buktinya di aplikasinya?"*
    **Aksi Anda:** Saat demo, matikan koneksi internet laptop (atau mode *Offline* dari Inspect Element browser). Tunjukkan bahwa halaman tetap bisa di-refresh, menu masih bisa diakses, dan **Indikator Jaringan** menampilkan status offline.

---

## 5. Penjelasan Ekstra: Metodologi & Kuesioner SUS (Jebakan Penguji)

Ini adalah pertanyaan jebakan metodologi yang sangat mematikan jika Anda tidak siap. Penguji metodologi penelitian biasanya sangat teliti soal instrumen kuesioner dan uji validitas.

### Q: "Mengapa memilih menggunakan kuesioner SUS (System Usability Scale)?"
> 💡 **Cara Menjawab di Sidang:**
> *"Saya memilih SUS karena SUS adalah **instrumen baku (standardized questionnaire)** berskala internasional yang sudah terbukti valid dan reliabel selama puluhan tahun untuk mengukur Usability. Selain itu, SUS sangat ringkas (hanya 10 pertanyaan) sehingga tidak membebani responden, namun mampu memberikan output berupa skor kuantitatif tunggal (0-100) yang mudah diinterpretasikan menjadi kategori huruf (Grade) dan tingkat penerimaan (Acceptability)."*

### Q: "Mengapa Anda tidak melakukan Uji Validitas (SPSS/Hitung per Item) pada kuesioner SUS Anda? Apakah datanya valid?"
Ini adalah intinya. Jika Anda disuruh menguji validitas SUS per butir soal, Anda harus berani **menolak** (secara halus dengan dasar literatur), karena SUS tidak boleh diutak-atik.

> 💡 **Cara Menjawab di Sidang:**
> *"Izin menjawab Pak/Bu. Penggunaan instrumen SUS dalam penelitian ini sengaja **tidak dilakukan uji validitas ulang** dengan dua alasan literatur yang kuat (seperti yang tertera di Bab 3):*
> 
> *   **Pertama (Sudah Terjemahan Baku):** Kuesioner SUS yang saya gunakan bukan kuesioner buatan saya sendiri, melainkan hasil adaptasi resmi ke Bahasa Indonesia oleh penelitian **Sharfina & Santoso (2016)**. Dalam studi tersebut, kuesioner SUS versi Indonesia ini sudah terbukti sangat reliabel dengan nilai Cronbach’s Alpha 0,841.*
> *   **Kedua (Menjaga Integritas Rumus):** Berdasarkan paper dari ahli Usability internasional, **John R. Lewis (2018)**, uji validitas per butir pertanyaan pada SUS itu **tidak disarankan dan justru dilarang**. Karena jika ada 1 butir soal yang dianggap tidak valid lalu dibuang, maka rumus perhitungan skor akhir SUS akan hancur/rusak, karena rumusnya mutlak mensyaratkan 10 pertanyaan secara utuh."*

**Jika Dosen Tetap Bersikeras:**
*"Baik Bapak/Ibu, memang untuk kuesioner buatan sendiri (self-made) wajib hukumnya dilakukan uji validitas. Namun, instrumen SUS ini masuk dalam kategori **Standardized Psychometric Evaluation** (Evaluasi Psikometri Standar), kedudukannya sama seperti soal tes TOEFL atau tes IQ yang butir pertanyaannya tidak boleh dihilangkan atau dimodifikasi oleh peneliti. Itulah mengapa literatur menyarankan untuk langsung dipakai tanpa uji validitas ulang."*

### Q: "Coba jelaskan, dari mana Anda dapat angka 75,11 ini? Bagaimana cara menghitungnya?"
> 💡 **Cara Menjawab di Sidang:**
> *"Baik Bapak/Ibu. SUS memiliki 10 pertanyaan yang terdiri dari kalimat positif di nomor ganjil dan negatif di nomor genap. Untuk menghitungnya, nilai jawaban ganjil dikurangi satu, sedangkan untuk genap, angka lima dikurangi nilai jawaban. Total dari ke-10 skor tersebut kemudian dikalikan dengan 2,5 agar skalanya menjadi 0 sampai 100. Dari 46 responden yang kami hitung menggunakan rumus tersebut, didapatkan rata-rata akhir sebesar 75,11."*

**(Tips Tambahan):** Jika dosen bertanya, *"Kenapa harus dikali 2,5?"*
Jawablah: *"Karena nilai maksimal dari total 10 pertanyaan adalah 40 (setiap soal maksimal nilainya 4). Agar mudah dibaca menjadi persentase skala 100, maka angka 40 tersebut harus dikali 2,5."*

### Q: "Lalu 75,11 itu maksudnya apa? Apakah aplikasi kamu sempurna?"
> 💡 **Cara Menjawab di Sidang:**
> *"Berdasarkan standar penilaian SUS dari Bangor (2009), batas minimal sebuah sistem dikatakan 'Bisa Diterima' (Acceptable) adalah skor 68. Karena skor sistem saya adalah 75,11, maka sistem ini masuk dalam kategori **Grade B**, tingkat penerimaannya **Acceptable (Dapat Diterima)**, dan predikatnya **Good (Baik)**."*
> 
> *"Artinya, aplikasi ini belum sempurna 100%, masih ada ruang untuk perbaikan. Namun secara keseluruhan, pengguna merasa sistem ini sudah mudah dipelajari dan layak digunakan secara langsung tanpa butuh pelatihan teknis yang rumit."*
