# BAB V
# HASIL DAN PEMBAHASAN

## 5.1 Hasil Perancangan Sistem Final

Tahap hasil perancangan sistem pada penelitian ini disajikan sebagai rancangan final yang telah diselaraskan dengan implementasi aktual aplikasi. Dengan demikian, bagian ini tidak lagi diposisikan sebagai rancangan hipotetis, melainkan sebagai representasi struktur proses dan struktur data yang benar-benar menopang aplikasi sistem informasi praktikum berbasis *Progressive Web App* (PWA) yang dikembangkan. Penyajian hasil perancangan pada bab ini menjadi penting karena menunjukkan bahwa artefak penelitian dibangun di atas model proses bisnis dan model data yang jelas, terstruktur, dan dapat dipertanggungjawabkan secara akademik.

Secara umum, hasil perancangan sistem dalam penelitian ini disusun melalui tiga lapisan utama, yaitu perancangan proses menggunakan *Data Flow Diagram* (DFD), perancangan struktur data menggunakan *Entity Relationship Diagram* (ERD), dan implementasi teknis basis data dalam bentuk skema tabel yang digunakan pada aplikasi. Ketiga lapisan ini saling berhubungan. DFD menjelaskan bagaimana data bergerak antaraktor dan antarmodul, ERD menunjukkan bagaimana data tersebut saling berelasi pada tingkat konseptual, sedangkan skema database memperlihatkan bagaimana relasi tersebut diwujudkan ke dalam tabel aktual pada aplikasi.

Penyajian hasil perancangan pada bab ini juga dimaksudkan untuk menegaskan bahwa sistem yang dibangun tidak hanya berfokus pada tampilan antarmuka. Sistem ini dirancang sebagai ekosistem informasi yang mengintegrasikan kebutuhan akademik praktikum, kebutuhan operasional laboratorium, kontrol akses berbasis peran, serta mekanisme sinkronisasi offline untuk menjaga kesinambungan layanan ketika koneksi internet tidak stabil. Oleh karena itu, pembahasan hasil perancangan menjadi landasan penting untuk memahami hasil implementasi pada subbab berikutnya.

### 5.1.1 DFD Level 1

DFD Level 1 merupakan dekomposisi utama dari konteks sistem dan menggambarkan empat proses besar yang membentuk arsitektur fungsional aplikasi. Pada penelitian ini, empat proses utama tersebut adalah manajemen akun dan akses, manajemen akademik praktikum, operasional dan layanan laboratorium, serta layanan PWA dan sinkronisasi offline. Keempat proses ini berinteraksi dengan empat entitas utama pengguna, yaitu mahasiswa, dosen, laboran, dan admin, serta dengan media penyimpanan data dan layanan autentikasi eksternal.

Penggunaan pendekatan Yourdon dan DeMarco dipertahankan pada tahap ini karena pendekatan tersebut memberi kejelasan dalam memisahkan aktor, proses, aliran data, dan penyimpanan data. Dari sisi hasil penelitian, DFD Level 1 menunjukkan bahwa aplikasi tidak dibangun sebagai kumpulan halaman yang berdiri sendiri, melainkan sebagai sistem informasi terintegrasi yang menghubungkan domain akademik, domain operasional laboratorium, dan domain layanan digital berbasis PWA.

[TEMPAT GAMBAR]
Gambar 6. Data Flow Diagram Level 1 Sistem Praktikum PWA

Berdasarkan DFD Level 1, struktur proses utama yang terbentuk dapat diringkas pada Tabel 5.1.

**Tabel 5.1 Ringkasan Proses Utama pada DFD Level 1**

| ID | Nama Proses | Fungsi Utama | Entitas Terlibat |
|---|---|---|---|
| 1.0 | Manajemen Akun dan Akses | autentikasi, role, session, pengelolaan user | admin, dosen, laboran, mahasiswa |
| 2.0 | Manajemen Akademik Praktikum | jadwal, materi, kuis, kelas, kehadiran, penilaian | admin, dosen, mahasiswa, laboran |
| 3.0 | Operasional dan Layanan Laboratorium | logbook, inventaris, peminjaman, pengumuman | admin, dosen, mahasiswa, laboran |
| 4.0 | Layanan PWA dan Sinkronisasi Offline | cache, antrean offline, sinkronisasi, penanganan konflik | seluruh pengguna, sistem, basis data |

Dari sudut pandang pembahasan, proses 1.0 berfungsi sebagai fondasi keamanan dan pengendalian akses. Proses 2.0 menjadi inti domain akademik yang mendukung aktivitas pembelajaran praktikum. Proses 3.0 memperluas sistem ke sisi operasional laboratorium agar kebutuhan fisik dan administratif dapat dikelola dalam platform yang sama. Sementara itu, proses 4.0 merupakan pembeda utama sistem karena menghadirkan mekanisme layanan yang tetap berjalan ketika kondisi jaringan tidak stabil.

### 5.1.2 DFD Level 2

DFD Level 2 pada penelitian ini merupakan hasil dekomposisi lebih rinci dari empat proses utama pada DFD Level 1. Tujuannya adalah untuk memperlihatkan bagaimana aliran data berlangsung pada tingkat proses yang lebih operasional, siapa aktor yang berinteraksi pada setiap subproses, data store apa yang digunakan, serta bagaimana satu proses menghasilkan keluaran yang menjadi masukan bagi proses yang lain.

Pada sistem yang dibangun, DFD Level 2 tidak disajikan dalam satu gambar besar, tetapi dibagi ke dalam sebelas diagram agar keterbacaan tetap terjaga. Pembagian ini bukan berarti tiap proses berdiri sendiri, melainkan merupakan strategi penyajian agar setiap diagram dapat dibahas secara fokus tanpa menghilangkan keterhubungan logis antarproses. Ringkasan dekomposisi tersebut disajikan pada Tabel 5.2.

**Tabel 5.2 Dekomposisi Proses DFD Level 1 ke DFD Level 2**

| Proses Level 1 | Proses Level 2 |
|---|---|
| 1.0 Manajemen Akun dan Akses | 1.1 Autentikasi, 1.2 Kelola User |
| 2.0 Manajemen Akademik Praktikum | 2.1 Kelola Jadwal, 2.2 Kelola Kuis dan Bank Soal, 2.3 Kelola Materi, 2.4 Kelola Kelas, Mata Kuliah, dan Assignment, 2.5 Kehadiran dan Penilaian |
| 3.0 Operasional dan Layanan Laboratorium | 3.1 Logbook Digital, 3.2 Peminjaman Alat dan Inventaris, 3.3 Pengumuman dan Notifikasi |
| 4.0 Layanan PWA dan Sinkronisasi Offline | 4.1 Sinkronisasi Offline PWA |

Secara analitis, hasil dekomposisi ini menunjukkan bahwa seluruh modul sistem berawal dari validasi identitas pengguna, lalu bergerak ke pengelolaan data master akademik, aktivitas pembelajaran, operasional laboratorium, dan didukung oleh sinkronisasi data saat offline. Oleh karena itu, DFD Level 2 pada penelitian ini bukan hanya menjelaskan rincian teknis proses, tetapi juga merepresentasikan logika integrasi antarmodul dalam sistem yang dibangun.

#### 5.1.2.1 Proses 1.1 Autentikasi

Proses 1.1 menggambarkan alur login, verifikasi kredensial, pengambilan role, pembentukan session, dan pengalihan pengguna ke dashboard sesuai hak akses. Proses ini menunjukkan bahwa autentikasi pada sistem tidak berhenti pada pemeriksaan email dan kata sandi, melainkan berlanjut pada penentuan konteks akses berdasarkan peran pengguna.

[TEMPAT GAMBAR]
Gambar 7. DFD Level 2.1 Proses 1.1 Autentikasi

**Tabel 5.3 Rincian Subproses 1.1 Autentikasi**

| Subproses | Deskripsi |
|---|---|
| 1.1.1 | validasi kredensial pengguna |
| 1.1.2 | pengambilan data role |
| 1.1.3 | pembentukan session login |
| 1.1.4 | pengalihan dashboard berdasarkan role |
| 1.1.5 | logout dan pengakhiran sesi |

#### 5.1.2.2 Proses 1.2 Kelola User

Proses 1.2 menunjukkan bagaimana admin mengelola siklus hidup akun pengguna, mulai dari pembuatan akun, penetapan role, pengelolaan profil per role, perubahan status, hingga pengarsipan akun. Dari sisi pembahasan, proses ini menjadi fondasi kualitas kontrol akses pada seluruh sistem.

[TEMPAT GAMBAR]
Gambar 8. DFD Level 2.2 Proses 1.2 Kelola User

#### 5.1.2.3 Proses 2.1 Kelola Jadwal

Proses 2.1 menjelaskan alur pengajuan jadwal, validasi relasi kelas dan laboratorium, persetujuan, publikasi, dan akses jadwal. Hasil ini menunjukkan bahwa jadwal diperlakukan sebagai simpul proses yang menentukan keberlangsungan aktivitas praktikum lain, seperti kehadiran, logbook, materi, dan peminjaman alat.

[TEMPAT GAMBAR]
Gambar 9. DFD Level 2.3 Proses 2.1 Kelola Jadwal

#### 5.1.2.4 Proses 2.2 Kelola Kuis dan Bank Soal

Proses 2.2 menggambarkan penyusunan kuis, pengelolaan bank soal, pengerjaan kuis oleh mahasiswa, penyimpanan sementara saat offline, hingga sinkronisasi hasil. Diagram ini menegaskan bahwa evaluasi pembelajaran dirancang untuk tetap andal pada kondisi jaringan yang berubah-ubah.

[TEMPAT GAMBAR]
Gambar 10. DFD Level 2.4 Proses 2.2 Kelola Kuis dan Bank Soal

#### 5.1.2.5 Proses 2.3 Kelola Materi

Proses 2.3 menunjukkan unggah materi, penyimpanan metadata, distribusi akses materi, unduh materi, dan dukungan cache untuk akses offline. Dengan demikian, sistem tidak hanya menyediakan repositori file, tetapi juga strategi distribusi materi yang terhubung dengan konteks kelas dan mendukung akses berkelanjutan.

[TEMPAT GAMBAR]
Gambar 11. DFD Level 2.5 Proses 2.3 Kelola Materi

#### 5.1.2.6 Proses 2.4 Kelola Kelas, Mata Kuliah, dan Assignment

Proses 2.4 memperlihatkan pengelolaan data master akademik berupa mata kuliah, kelas, relasi dosen dan mahasiswa, assignment, serta submission. Dari sisi pembahasan, proses ini merupakan tulang punggung domain akademik karena banyak modul lain bergantung pada kebenaran data master ini.

[TEMPAT GAMBAR]
Gambar 12. DFD Level 2.6 Proses 2.4 Kelola Kelas, Mata Kuliah, dan Assignment

#### 5.1.2.7 Proses 2.5 Kehadiran dan Penilaian

Proses 2.5 menunjukkan pencatatan kehadiran, validasi terhadap jadwal dan peserta, input komponen nilai, perhitungan rekap, dan penayangan hasil kepada mahasiswa. Hasil ini memperlihatkan bahwa sistem mampu mengintegrasikan data kegiatan belajar menjadi informasi evaluatif yang formal.

[TEMPAT GAMBAR]
Gambar 13. DFD Level 2.7 Proses 2.5 Kehadiran dan Penilaian

#### 5.1.2.8 Proses 3.1 Logbook Digital

Proses 3.1 menjelaskan entri logbook mahasiswa, penyimpanan lampiran, review dosen, umpan balik, dan riwayat logbook. Modul ini merepresentasikan transformasi logbook manual menjadi dokumentasi digital yang lebih mudah ditelusuri dan diaudit.

[TEMPAT GAMBAR]
Gambar 14. DFD Level 2.8 Proses 3.1 Logbook Digital

#### 5.1.2.9 Proses 3.2 Peminjaman Alat dan Inventaris

Proses 3.2 memperlihatkan pengelolaan inventaris, pengajuan peminjaman, verifikasi, keputusan, pemantauan status, dan laporan. Hasil ini penting karena menunjukkan bahwa sistem praktikum juga mengintegrasikan kebutuhan operasional laboratorium, bukan hanya aktivitas akademik.

[TEMPAT GAMBAR]
Gambar 15. DFD Level 2.9 Proses 3.2 Peminjaman Alat dan Inventaris

#### 5.1.2.10 Proses 3.3 Pengumuman dan Notifikasi

Proses 3.3 menggambarkan pembuatan pengumuman, publikasi, distribusi berdasarkan role, penayangan, dan pengarsipan. Modul ini menunjukkan bahwa komunikasi sistem diperlakukan sebagai bagian penting dari aliran informasi antarpengguna dan antarmodul.

[TEMPAT GAMBAR]
Gambar 16. DFD Level 2.10 Proses 3.3 Pengumuman dan Notifikasi

#### 5.1.2.11 Proses 4.1 Sinkronisasi Offline PWA

Proses 4.1 menggambarkan deteksi jaringan, penyimpanan cache, antrean operasi offline, sinkronisasi ulang, penanganan konflik, dan *retry*. Dari sisi pembahasan, inilah lapisan yang membedakan sistem dengan aplikasi web biasa, karena sistem tetap dapat mempertahankan kesinambungan layanan ketika koneksi internet tidak stabil.

[TEMPAT GAMBAR]
Gambar 17. DFD Level 2.11 Proses 4.1 Sinkronisasi Offline PWA

**Tabel 5.4 Rincian Subproses 4.1 Sinkronisasi Offline PWA**

| Subproses | Deskripsi |
|---|---|
| 4.1.1 | deteksi status online atau offline |
| 4.1.2 | penyimpanan data ke cache lokal |
| 4.1.3 | penyimpanan operasi tulis ke antrean |
| 4.1.4 | sinkronisasi ulang ke server |
| 4.1.5 | penanganan konflik dan *retry* |

Berdasarkan keseluruhan DFD Level 2, dapat disimpulkan bahwa sistem yang dibangun memiliki hubungan proses yang berlapis dan saling bergantung. Modul autentikasi dan manajemen user menjadi fondasi akses, modul akademik membentuk alur inti pembelajaran, modul operasional memperluas sistem ke kebutuhan laboratorium, dan modul sinkronisasi menjadi penopang layanan berkelanjutan pada konteks PWA.

### 5.1.3 Entity Relationship Diagram (ERD)

ERD pada penelitian ini digunakan untuk merangkum struktur relasi data hasil perancangan dan implementasi basis data secara terorganisasi. Karena jumlah entitas yang digunakan cukup banyak dan saling berhubungan lintas modul, visualisasi ERD tidak dipaksakan ke dalam satu diagram besar, melainkan dipecah menjadi beberapa domain. Pendekatan ini dipilih agar keterbacaan visual tetap terjaga dan pembahasan tiap domain dapat dilakukan secara lebih fokus.

Pemecahan ERD per domain juga sesuai dengan kebutuhan akademik pada Bab Hasil dan Pembahasan. Pembaca dapat memahami struktur data secara bertahap, mulai dari identitas pengguna, domain akademik, aktivitas praktikum, evaluasi pembelajaran, operasional laboratorium, komunikasi, hingga sinkronisasi offline. Dengan cara tersebut, ERD berfungsi bukan sekadar sebagai gambar relasi tabel, tetapi sebagai alat bantu analisis untuk menunjukkan bahwa setiap fitur pada aplikasi memiliki landasan data yang jelas.

**Tabel 5.5 Kelompok Entitas Utama pada ERD Sistem**

| Kategori | Entitas Utama |
|---|---|
| Identitas dan Role Pengguna | users, admin, dosen, mahasiswa, laboran |
| Akademik dan Kelas | mata_kuliah, kelas, kelas_mahasiswa, dosen_mata_kuliah, assignment |
| Praktikum | jadwal_praktikum, kehadiran, logbook_entries, materi |
| Evaluasi | kuis, soal, bank_soal, attempt_kuis, jawaban, nilai |
| Laboratorium dan Inventaris | laboratorium, inventaris, peminjaman |
| Komunikasi | pengumuman, notifications |
| Sinkronisasi dan Audit | offline_queue, sync_history, cache_metadata, conflict_log, audit_logs |

#### 5.1.3.1 ERD Domain Pengguna dan Peran

Domain pengguna dan peran memperlihatkan struktur identitas dasar sistem. Entitas `users` menjadi pusat akun utama, sedangkan tabel `admin`, `dosen`, `mahasiswa`, dan `laboran` menyimpan informasi profil spesifik tiap role. Pola ini menunjukkan bahwa autentikasi pada sistem tidak berhenti pada verifikasi login, tetapi diteruskan ke otorisasi berbasis peran.

[TEMPAT GAMBAR]
Gambar 24. ERD Domain Pengguna dan Peran

Dari hasil tersebut dapat dipahami bahwa semua alur akses sistem bergantung pada struktur identitas yang tertata. Hal ini penting karena dashboard, menu, dan hak akses setiap pengguna ditentukan oleh domain ini.

#### 5.1.3.2 ERD Domain Akademik: Kelas dan Materi

Domain akademik memperlihatkan relasi antara mata kuliah, kelas, peserta kelas, dan materi. Struktur ini menegaskan bahwa distribusi materi tidak berdiri sendiri, melainkan melekat pada kelas yang sah. Dengan demikian, pengelolaan materi, akses peserta, dan aktivitas belajar berada pada konteks akademik yang terkontrol.

[TEMPAT GAMBAR]
Gambar 25. ERD Domain Akademik: Kelas dan Materi

#### 5.1.3.3 ERD Domain Praktikum: Jadwal, Kehadiran, dan Logbook

Domain praktikum menunjukkan bahwa `jadwal_praktikum` menjadi entitas pengikat aktivitas inti. Dari jadwal tersebut diturunkan kehadiran dan logbook. Pola ini memperlihatkan bahwa pencatatan aktivitas praktikum memiliki konteks waktu, kelas, dan pelaksanaan yang jelas.

[TEMPAT GAMBAR]
Gambar 26. ERD Domain Praktikum: Jadwal, Kehadiran, dan Logbook

#### 5.1.3.4 ERD Domain Penilaian: Kuis dan Nilai

Domain penilaian memodelkan alur evaluasi dari kuis, soal, attempt, jawaban, hingga nilai. Hasil ini menunjukkan bahwa evaluasi pembelajaran pada sistem bukan hanya fitur antarmuka, tetapi benar-benar ditopang oleh struktur data yang mampu merekam proses pengerjaan dan hasil akhir secara sistematis.

[TEMPAT GAMBAR]
Gambar 27. ERD Domain Penilaian: Kuis dan Nilai

#### 5.1.3.5 ERD Domain Laboratorium dan Inventaris

Domain laboratorium dan inventaris memperlihatkan keterhubungan antara laboratorium, inventaris, dan peminjaman. Hasil ini menegaskan bahwa sistem praktikum yang dibangun tidak hanya menangani domain akademik, tetapi juga mengintegrasikan sarana dan sumber daya fisik laboratorium ke dalam basis data yang sama.

[TEMPAT GAMBAR]
Gambar 28. ERD Domain Laboratorium dan Inventaris

#### 5.1.3.6 ERD Domain Komunikasi

Domain komunikasi menggambarkan bahwa pengumuman dan notifikasi diperlakukan sebagai data sistem yang terstruktur. Hasil ini penting karena mendukung koordinasi antarpengguna dan memastikan penyebaran informasi dapat dilakukan secara konsisten sesuai role atau kebutuhan kelas.

[TEMPAT GAMBAR]
Gambar 29. ERD Domain Komunikasi

#### 5.1.3.7 Diagram Relasi Sinkronisasi Offline

Selain domain-domain utama di atas, penelitian ini juga menampilkan diagram relasi data sinkronisasi offline. Diagram ini menunjukkan hubungan antara `offline_queue`, `sync_history`, `cache_metadata`, `conflict_log`, dan `users`. Kehadiran domain ini penting karena sinkronisasi offline merupakan karakteristik utama aplikasi berbasis PWA yang dikembangkan.

[TEMPAT GAMBAR]
Gambar 30. Diagram Relasi Data Sinkronisasi Offline

Secara keseluruhan, ERD per domain menunjukkan bahwa sistem dirancang secara terstruktur dan mendukung integrasi data antarfungsi. Dengan demikian, backend sistem bukan sekadar pendukung teknis, tetapi bagian utama dari hasil penelitian yang menopang seluruh proses bisnis aplikasi.

### 5.1.4 Skema Database

Skema database merupakan implementasi teknis dari ERD pada tingkat tabel, kolom utama, dan relasi aktual. Jika ERD menjelaskan struktur data pada tingkat konseptual, maka skema database memperlihatkan bagaimana struktur tersebut diwujudkan dalam basis data yang benar-benar digunakan pada aplikasi.

Pada implementasi aktual, sistem menggunakan pemisahan tabel berdasarkan domain dan role. Identitas pengguna dipusatkan pada tabel `users`, sedangkan data profil diletakkan pada tabel `admin`, `dosen`, `mahasiswa`, dan `laboran`. Selain itu, domain akademik, evaluasi, laboratorium, komunikasi, dan sinkronisasi masing-masing diwujudkan dalam tabel spesifik yang saling terhubung.

**Tabel 5.6 Ringkasan Tabel dan Kolom Utama pada Basis Data**

| Tabel | Kolom Utama | Fungsi |
|---|---|---|
| users | id, email | identitas akun utama |
| admin, dosen, mahasiswa, laboran | id, user_id | profil per role |
| mata_kuliah | id, kode, nama | master mata kuliah |
| kelas | id, nama | data kelas praktikum |
| kelas_mahasiswa | id, kelas_id, mahasiswa_id | relasi peserta kelas |
| jadwal_praktikum | id, kelas_id, laboratorium_id | jadwal praktikum |
| materi | id, kelas_id, file_url | materi pembelajaran |
| kuis | id, kelas_id, judul | data kuis |
| soal | id, kuis_id | soal kuis |
| bank_soal | id, dosen_id | bank soal |
| attempt_kuis | id, kuis_id, mahasiswa_id | attempt pengerjaan |
| jawaban | id, attempt_id, soal_id | jawaban per soal |
| kehadiran | id, jadwal_id, mahasiswa_id | presensi |
| nilai | id, kelas_id, mahasiswa_id | nilai akademik |
| logbook_entries | id, jadwal_id, mahasiswa_id | logbook kegiatan |
| inventaris | id, laboratorium_id | data inventaris |
| peminjaman | id, inventaris_id, dosen_id | transaksi peminjaman |
| pengumuman | id, user_id, kelas_id | pengumuman |
| notifications | id, user_id, is_read | notifikasi |
| offline_queue | id, user_id, operation_type | antrean mutasi offline |
| sync_history | id, user_id, synced_at | riwayat sinkronisasi |
| cache_metadata | id, user_id, cache_key | metadata cache |
| conflict_log | id, queue_id, resolved_by | catatan konflik |
| audit_logs | id, user_id, aktivitas | jejak audit |

Dari skema database tersebut terlihat bahwa sistem dirancang untuk mendukung kebutuhan multi-role, aktivitas akademik, inventaris laboratorium, komunikasi, serta sinkronisasi offline. Hal ini menegaskan bahwa hasil penelitian tidak hanya berupa antarmuka aplikasi, tetapi juga mencakup lapisan data dan logika layanan yang menopang keseluruhan sistem.

## 5.2 Hasil Implementasi Sistem

Hasil implementasi sistem pada penelitian ini menunjukkan bahwa aplikasi telah direalisasikan menjadi artefak digital yang dapat digunakan untuk mendukung proses praktikum secara terintegrasi. Implementasi yang dihasilkan tidak hanya terdiri atas halaman antarmuka, tetapi juga meliputi autentikasi, kontrol akses berbasis role, pengelolaan data akademik, pengelolaan operasional laboratorium, distribusi informasi, serta mekanisme sinkronisasi offline.

Jika ditinjau dari perspektif penelitian pengembangan, implementasi ini merupakan bentuk konkret dari artefak yang dibangun untuk menjawab masalah pada proses praktikum. Artefak tersebut disusun agar mampu memfasilitasi kebutuhan dosen dan mahasiswa sebagai fokus utama penelitian, dengan dukungan admin dan laboran sebagai role pengelola sistem dan operasional laboratorium.

### 5.2.1 Implementasi Autentikasi dan Kontrol Akses

Implementasi autentikasi menjadi pintu masuk seluruh layanan aplikasi. Pengguna melakukan login menggunakan kredensial akun, lalu sistem memverifikasi identitas melalui layanan autentikasi dan mengambil data role untuk menentukan hak akses. Setelah berhasil login, pengguna diarahkan ke dashboard sesuai role masing-masing.

[TEMPAT GAMBAR]
Gambar 31. Halaman Login Sistem

Dari sisi pembahasan, hasil implementasi autentikasi menunjukkan bahwa sistem telah menerapkan pemisahan yang jelas antara verifikasi identitas dan kontrol akses. Hal ini penting karena aplikasi memiliki empat role utama dengan menu, data, dan kewenangan yang berbeda. Dengan demikian, autentikasi pada sistem ini berfungsi bukan hanya sebagai gerbang keamanan, tetapi juga sebagai pengendali konteks interaksi pengguna terhadap seluruh modul aplikasi.

Selain autentikasi daring, implementasi sistem juga memperlihatkan dukungan login dan penggunaan terbatas pada kondisi offline sesuai mekanisme cache dan sinkronisasi yang tersedia. Kehadiran fitur ini memperkuat karakter PWA dan menjadi salah satu pembeda utama dibandingkan aplikasi web konvensional.

### 5.2.2 Implementasi Dashboard Berbasis Role

Setelah login, sistem menampilkan dashboard yang berbeda sesuai role pengguna. Dashboard admin berfokus pada pengelolaan data master dan kontrol sistem, dashboard dosen berfokus pada aktivitas pengajaran dan evaluasi, dashboard mahasiswa berfokus pada akses pembelajaran dan tugas praktikum, sedangkan dashboard laboran berfokus pada inventaris dan operasional laboratorium.

[TEMPAT GAMBAR]
Gambar 32. Dashboard Admin

[TEMPAT GAMBAR]
Gambar 33. Dashboard Dosen

[TEMPAT GAMBAR]
Gambar 34. Dashboard Mahasiswa

[TEMPAT GAMBAR]
Gambar 35. Dashboard Laboran

Pembagian dashboard ini menunjukkan bahwa sistem dirancang dengan pendekatan yang menyesuaikan kebutuhan pengguna. Dari sisi pembahasan, hasil ini memperlihatkan implementasi *role-based access control* yang nyata pada antarmuka sekaligus pada lapisan data. Dengan demikian, dashboard bukan hanya tampilan berbeda, tetapi representasi dari struktur akses dan logika layanan yang dibangun pada sistem.

### 5.2.3 Implementasi Modul Admin

Modul admin berfungsi sebagai pusat pengelolaan data master dan pengendalian operasional sistem. Pada modul ini, admin dapat mengelola pengguna, role, mata kuliah, kelas, pengumuman, dan data pendukung lain yang dibutuhkan modul lain.

[TEMPAT GAMBAR]
Gambar 36. Implementasi Kelola User oleh Admin

[TEMPAT GAMBAR]
Gambar 37. Implementasi Kelola Mata Kuliah dan Kelas oleh Admin

Secara analitis, modul admin menunjukkan bahwa aplikasi memiliki fondasi tata kelola data yang memadai. Kualitas data yang dikelola admin akan memengaruhi konsistensi akses, validitas kelas, dan kelancaran proses pada modul dosen, mahasiswa, maupun laboran. Oleh karena itu, implementasi modul admin berperan penting sebagai penopang stabilitas sistem secara keseluruhan.

### 5.2.4 Implementasi Modul Dosen

Modul dosen merupakan salah satu inti implementasi karena berhubungan langsung dengan proses pembelajaran praktikum. Pada modul ini, dosen dapat mengelola jadwal, materi, assignment, kuis, bank soal, logbook, kehadiran, dan penilaian.

[TEMPAT GAMBAR]
Gambar 38. Implementasi Kelola Jadwal oleh Dosen

[TEMPAT GAMBAR]
Gambar 39. Implementasi Kelola Materi oleh Dosen

[TEMPAT GAMBAR]
Gambar 40. Implementasi Kelola Kuis dan Bank Soal oleh Dosen

[TEMPAT GAMBAR]
Gambar 41. Implementasi Kehadiran dan Penilaian oleh Dosen

Hasil implementasi modul dosen menunjukkan bahwa sistem mampu mengintegrasikan seluruh alur pembelajaran praktikum dalam satu aplikasi. Dari sisi pembahasan, hal ini penting karena aktivitas yang sebelumnya tersebar pada banyak media kini dipusatkan ke satu sistem yang terhubung dengan data kelas, jadwal, peserta, dan hasil evaluasi. Dengan demikian, implementasi modul dosen menjadi bukti utama bahwa sistem telah menjawab kebutuhan pengelolaan pembelajaran praktikum secara digital.

### 5.2.5 Implementasi Modul Mahasiswa

Modul mahasiswa dirancang untuk memfasilitasi akses pengguna terhadap jadwal, materi, kuis, assignment, logbook, kehadiran, nilai, pengumuman, dan notifikasi. Mahasiswa juga menjadi aktor utama yang merasakan manfaat penggunaan aplikasi saat koneksi tidak stabil, karena banyak data dapat tetap diakses melalui mekanisme cache dan sinkronisasi.

[TEMPAT GAMBAR]
Gambar 42. Implementasi Akses Materi oleh Mahasiswa

[TEMPAT GAMBAR]
Gambar 43. Implementasi Pengerjaan Kuis oleh Mahasiswa

[TEMPAT GAMBAR]
Gambar 44. Implementasi Logbook Mahasiswa

[TEMPAT GAMBAR]
Gambar 45. Implementasi Akses Nilai dan Kehadiran oleh Mahasiswa

Dari sudut pandang pembahasan, modul mahasiswa menunjukkan bahwa sistem dirancang tidak hanya untuk memudahkan pengelola, tetapi juga untuk memperbaiki pengalaman belajar mahasiswa. Integrasi informasi akademik, tugas, evaluasi, dan catatan praktikum dalam satu platform membuat proses belajar menjadi lebih terstruktur, terdokumentasi, dan mudah dipantau.

### 5.2.6 Implementasi Modul Laboran

Modul laboran difokuskan pada pengelolaan laboratorium, inventaris, persetujuan jadwal, dan pengawasan peminjaman alat. Kehadiran modul ini penting karena praktikum tidak hanya membutuhkan aktivitas belajar, tetapi juga kesiapan sarana dan koordinasi operasional laboratorium.

[TEMPAT GAMBAR]
Gambar 46. Implementasi Kelola Inventaris oleh Laboran

[TEMPAT GAMBAR]
Gambar 47. Implementasi Persetujuan Jadwal dan Peminjaman Alat

Pembahasan hasil pada modul laboran menunjukkan bahwa sistem berhasil memperluas fungsi aplikasi dari sekadar pembelajaran digital ke manajemen operasional laboratorium. Dengan demikian, sistem yang dibangun benar-benar mengintegrasikan domain akademik dan domain operasional dalam satu platform yang sama.

### 5.2.7 Implementasi Komunikasi Sistem

Sistem juga mengimplementasikan modul komunikasi berupa pengumuman dan notifikasi. Modul ini memungkinkan admin atau pihak terkait menyampaikan informasi penting kepada role tertentu atau kelas tertentu, sehingga koordinasi antarpengguna dapat berjalan lebih efektif.

[TEMPAT GAMBAR]
Gambar 48. Implementasi Pengumuman dan Notifikasi

Hasil ini penting karena komunikasi yang terstruktur akan memperkuat keterhubungan antaraktor, mempercepat penyampaian informasi, dan mengurangi ketergantungan pada media komunikasi eksternal yang terpisah dari sistem utama.

### 5.2.8 Implementasi Sinkronisasi Offline dan Fitur PWA

Salah satu hasil implementasi paling penting dalam penelitian ini adalah fitur PWA dan sinkronisasi offline. Sistem mampu mendeteksi perubahan status jaringan, menyimpan data penting ke cache lokal, menahan operasi tulis pada antrean offline, dan melakukan sinkronisasi ulang ketika koneksi tersedia kembali.

[TEMPAT GAMBAR]
Gambar 49. Implementasi Indikator Status Jaringan dan Sinkronisasi

[TEMPAT GAMBAR]
Gambar 50. Implementasi Riwayat Sinkronisasi atau Data Offline

Dari sisi pembahasan, hasil ini menunjukkan bahwa karakter PWA pada aplikasi bukan sekadar penambahan teknis, tetapi benar-benar menjadi bagian inti dari layanan. Dukungan sinkronisasi offline memungkinkan aktivitas pengguna tetap berlanjut saat jaringan tidak stabil, khususnya pada konteks praktikum yang membutuhkan akses cepat terhadap data, materi, atau input aktivitas lapangan.

## 5.3 Hasil Pengujian Sistem

Agar hasil implementasi tidak berhenti pada tampilan antarmuka dan daftar fitur, penelitian ini perlu menempatkan pengujian sistem sebagai bagian penting dari Bab Hasil dan Pembahasan. Pengujian berfungsi untuk menunjukkan bahwa artefak yang dibangun tidak hanya selesai dibuat, tetapi juga mampu menjalankan fungsi yang direncanakan sesuai kebutuhan pengguna.

### 5.3.1 Pengujian Fungsional

Pengujian fungsional dilakukan untuk memastikan bahwa setiap modul utama dapat berjalan sesuai kebutuhan. Modul yang diuji mencakup autentikasi, kelola user, kelola kelas, jadwal, materi, kuis, kehadiran, penilaian, logbook, inventaris, peminjaman, pengumuman, dan sinkronisasi offline.

**Tabel 5.7 Ringkasan Pengujian Fungsional**

| Modul | Skenario Uji | Hasil yang Diharapkan | Status |
|---|---|---|---|
| Autentikasi | login dengan data valid | pengguna masuk sesuai role | berhasil |
| Kelola User | tambah dan ubah user | data user tersimpan dan diperbarui | berhasil |
| Kelas dan Mata Kuliah | tambah kelas dan relasi | data master akademik tersimpan | berhasil |
| Jadwal | input dan publikasi jadwal | jadwal tampil sesuai relasi | berhasil |
| Materi | unggah dan akses materi | materi tersimpan dan dapat diakses | berhasil |
| Kuis | buat kuis dan kerjakan | kuis dapat dikerjakan dan direkap | berhasil |
| Kehadiran dan Nilai | input presensi dan nilai | rekap tampil sesuai peserta | berhasil |
| Logbook | input, review, umpan balik | logbook tersimpan dan dapat ditinjau | berhasil |
| Inventaris dan Peminjaman | ajukan dan verifikasi peminjaman | status peminjaman tercatat | berhasil |
| Pengumuman dan Notifikasi | publikasi informasi | informasi diterima pengguna terkait | berhasil |
| Sinkronisasi Offline | simpan saat offline lalu sinkronisasi | data berhasil direkonsiliasi | berhasil |

Hasil pengujian fungsional menunjukkan bahwa sistem telah mampu menjalankan fungsi utama sesuai rancangan. Hal ini menegaskan bahwa implementasi tidak berhenti pada prototipe visual, tetapi telah sampai pada fungsi operasional yang dapat digunakan.

### 5.3.2 Pengujian Role dan Hak Akses

Pengujian role dilakukan untuk memastikan bahwa setiap pengguna hanya dapat mengakses fitur yang sesuai dengan kewenangannya. Admin memiliki akses penuh terhadap pengelolaan data master, dosen dapat mengelola pembelajaran dan evaluasi, mahasiswa dapat mengakses materi dan mengerjakan aktivitas belajar, sedangkan laboran dapat mengelola inventaris dan dukungan operasional laboratorium.

**Tabel 5.8 Ringkasan Pengujian Role dan Hak Akses**

| Role | Fitur Utama | Hasil Pengujian |
|---|---|---|
| Admin | kelola user, kelas, mata kuliah, pengumuman | akses sesuai hak admin |
| Dosen | kelola jadwal, materi, kuis, nilai, logbook | akses sesuai hak dosen |
| Mahasiswa | akses materi, kuis, logbook, nilai | akses sesuai hak mahasiswa |
| Laboran | inventaris, peminjaman, dukungan jadwal | akses sesuai hak laboran |

Hasil pengujian ini memperlihatkan bahwa implementasi *role-based access control* telah berjalan sesuai rancangan. Dari sisi pembahasan, hal ini penting karena akurasi hak akses akan menentukan keamanan data dan ketepatan interaksi antarmodul.

### 5.3.3 Pengujian Fitur PWA dan Offline

Pengujian fitur PWA dilakukan untuk memastikan bahwa sistem tetap dapat memberikan layanan dasar ketika koneksi tidak stabil. Beberapa skenario yang relevan meliputi pembukaan aplikasi saat koneksi lemah, akses data yang telah dicache, penyimpanan operasi ke antrean saat offline, dan sinkronisasi ulang saat koneksi pulih.

**Tabel 5.9 Ringkasan Pengujian Fitur PWA dan Offline**

| Skenario | Hasil yang Diharapkan | Hasil |
|---|---|---|
| membuka aplikasi setelah data pernah diakses | halaman tetap terbuka dari cache | sesuai |
| mengakses materi yang telah dicache | materi tetap dapat ditampilkan | sesuai |
| melakukan input saat offline | data masuk ke antrean lokal | sesuai |
| koneksi kembali tersedia | antrean tersinkronisasi ke sistem pusat | sesuai |
| terjadi konflik data | konflik tercatat dan dapat ditangani | sesuai |

Hasil pengujian ini menunjukkan bahwa aspek PWA pada sistem benar-benar berfungsi sebagai mekanisme keberlanjutan layanan, bukan hanya label teknologi tambahan.

### 5.3.4 Pengujian Alur Akademik Utama

Selain pengujian per modul, sistem juga perlu dilihat dari alur akademik secara menyeluruh. Alur yang diuji misalnya dimulai dari admin menyiapkan data master, dosen membuat kelas dan jadwal, dosen mengunggah materi serta membuat kuis, mahasiswa mengakses materi dan mengerjakan kuis, dosen menilai hasil, dan mahasiswa melihat nilai akhir.

Pengujian alur end-to-end ini menunjukkan bahwa integrasi antarmodul telah berjalan dengan baik. Dari sisi pembahasan, hasil ini sangat penting karena membuktikan bahwa sistem tidak hanya berhasil pada level fitur tunggal, tetapi juga pada level proses bisnis praktikum secara utuh.

## 5.4 Pembahasan

### 5.4.1 Ketercapaian Tujuan Penelitian

Berdasarkan hasil perancangan, implementasi, dan pengujian, dapat dipahami bahwa sistem yang dibangun telah mengarah pada ketercapaian tujuan penelitian. Sistem berhasil menyediakan platform terintegrasi untuk mendukung pengelolaan praktikum, distribusi materi, evaluasi pembelajaran, logbook, inventaris, peminjaman alat, pengumuman, dan sinkronisasi offline.

Dari sisi tujuan akademik, sistem telah mendukung aktivitas dosen dan mahasiswa dalam proses praktikum. Dari sisi tujuan operasional, sistem juga telah mendukung admin dan laboran dalam pengelolaan data dan sarana. Sementara itu, dari sisi teknologi, implementasi PWA dan sinkronisasi offline menunjukkan bahwa sistem dirancang untuk lebih tangguh pada kondisi penggunaan nyata.

### 5.4.2 Kontribusi Sistem terhadap Permasalahan Awal

Permasalahan awal dalam pengelolaan praktikum umumnya berkaitan dengan tersebarnya data pada banyak media, sulitnya koordinasi antarpihak, lemahnya dokumentasi aktivitas, dan ketergantungan pada koneksi internet yang stabil. Hasil penelitian ini menunjukkan bahwa sistem yang dibangun mampu memberikan kontribusi pada keempat permasalahan tersebut.

Pertama, sistem memusatkan data akademik dan operasional ke dalam satu platform. Kedua, sistem memperkuat koordinasi melalui pengumuman, notifikasi, dan role-based workflow. Ketiga, sistem meningkatkan dokumentasi aktivitas melalui logbook digital, riwayat evaluasi, dan audit data. Keempat, sistem mengurangi ketergantungan absolut pada internet melalui cache, antrean offline, dan sinkronisasi ulang.

### 5.4.3 Kekuatan Sistem yang Dikembangkan

Terdapat beberapa kekuatan utama dari sistem yang dikembangkan pada penelitian ini.

1. Sistem mengintegrasikan domain akademik dan operasional laboratorium dalam satu aplikasi.
2. Sistem menerapkan kontrol akses berbasis role secara jelas.
3. Sistem memiliki struktur data backend yang mendukung integrasi antarmodul.
4. Sistem mendukung layanan berbasis PWA dan penggunaan saat koneksi tidak stabil.
5. Sistem menyediakan dokumentasi aktivitas yang lebih baik melalui logbook, riwayat penilaian, dan notifikasi.

Kekuatan-kekuatan tersebut memperlihatkan bahwa hasil penelitian tidak hanya relevan secara teknis, tetapi juga memiliki nilai praktis dalam konteks pengelolaan praktikum di lingkungan perguruan tinggi.

### 5.4.4 Keterbatasan Sistem

Di samping kekuatan yang dimiliki, sistem ini tetap memiliki beberapa keterbatasan. Pertama, kompleksitas data dan relasi antarentitas cukup tinggi sehingga memerlukan pengelolaan backend yang disiplin. Kedua, efektivitas sinkronisasi offline sangat dipengaruhi oleh rancangan penanganan konflik data. Ketiga, perlu adanya penguatan evaluasi penggunaan jangka panjang untuk menilai stabilitas sistem pada skenario operasional yang lebih luas.

Keterbatasan ini tidak mengurangi hasil utama penelitian, tetapi justru menjadi dasar penting untuk pengembangan lanjutan pada penelitian berikutnya.

### 5.4.5 Implikasi Akademik dan Praktis

Secara akademik, hasil penelitian ini menunjukkan bahwa pengembangan sistem informasi praktikum tidak cukup dibahas dari sisi antarmuka saja. Lapisan backend, kontrol akses, struktur data, dan sinkronisasi offline merupakan bagian penting yang perlu masuk ke dalam Bab Hasil dan Pembahasan karena semuanya secara langsung memengaruhi kualitas artefak yang dibangun.

Secara praktis, sistem ini berpotensi membantu perguruan tinggi dalam menata proses praktikum agar lebih terintegrasi, terdokumentasi, dan tangguh terhadap kondisi jaringan. Integrasi antara aktivitas belajar dan operasional laboratorium juga menjadi nilai tambah yang membedakan sistem ini dari aplikasi pembelajaran yang hanya berfokus pada distribusi materi dan tugas.

## 5.5 Kesimpulan Bab

Berdasarkan keseluruhan uraian pada bab ini, dapat disimpulkan bahwa penelitian telah menghasilkan sistem informasi praktikum berbasis PWA yang dibangun melalui perancangan proses, perancangan data, implementasi fitur, dan pengujian sistem secara terintegrasi. Hasil perancangan menunjukkan bahwa sistem memiliki struktur proses dan struktur data yang jelas. Hasil implementasi menunjukkan bahwa sistem telah diwujudkan ke dalam modul-modul yang mendukung kebutuhan akademik, operasional laboratorium, komunikasi, dan sinkronisasi offline. Hasil pengujian memperlihatkan bahwa fungsi utama sistem dapat berjalan sesuai rancangan.

Dari sisi pembahasan, sistem ini menunjukkan kontribusi nyata terhadap kebutuhan digitalisasi praktikum. Sistem tidak hanya memfasilitasi aktivitas dosen dan mahasiswa, tetapi juga mengintegrasikan peran admin dan laboran dalam satu platform yang sama. Selain itu, dukungan PWA dan sinkronisasi offline menjadi keunggulan penting yang memperkuat kebermanfaatan sistem pada konteks penggunaan nyata. Dengan demikian, bab ini menegaskan bahwa hasil penelitian tidak berhenti pada implementasi antarmuka, melainkan mencakup keseluruhan artefak sistem, termasuk backend, struktur data, logika layanan, dan evaluasi ketercapaiannya terhadap tujuan penelitian.