# BAB IV
# HASIL DAN PEMBAHASAN

---

## 4.1 Hasil Perancangan Sistem

### 4.1.1 DFD Level 1

Berdasarkan hasil perancangan yang telah diselaraskan kembali dengan implementasi aplikasi aktif, sistem diuraikan menjadi 11 proses utama yang merepresentasikan fungsi inti aplikasi praktikum. Proses-proses tersebut melibatkan empat jenis pengguna utama, yaitu Admin, Dosen, Laboran, dan Mahasiswa, serta layanan Supabase sebagai pendukung autentikasi, basis data, penyimpanan file, dan sinkronisasi data. Meskipun implementasi aplikasi mencakup empat role aktif, fokus penelitian tetap mengikuti proposal, yaitu pada kebutuhan pengguna dosen dan mahasiswa sebagai aktor utama kegiatan praktikum, sedangkan admin dan laboran diposisikan sebagai role pendukung operasional sistem.

Diagram DFD Level 1 ditunjukkan pada gambar hasil perancangan dari Mermaid.

**[TEMPAT GAMBAR 4.1 — Diagram DFD Level 1 Sistem Praktikum PWA]**

*Gambar 4.1. Data Flow Diagram Level 1 Sistem Praktikum PWA*

Berdasarkan Gambar 4.1, terlihat bahwa sistem berinteraksi dengan beberapa entitas utama, yaitu admin, dosen, mahasiswa, laboran, dan layanan backend. Diagram ini menunjukkan aliran data pada proses-proses utama seperti autentikasi, pengelolaan jadwal, pengelolaan kuis, materi, inventaris, pengumuman, serta sinkronisasi offline. Keberadaan gambar ini penting karena memperlihatkan bahwa sistem dirancang sebagai satu kesatuan proses yang saling terhubung, bukan sekadar kumpulan fitur yang berdiri sendiri.

Adapun rincian proses utama yang terdapat pada DFD Level 1 disajikan pada tabel berikut.

| ID | Nama Proses | Entitas Terlibat |
|---|---|---|
| P1 | Autentikasi | Admin, Dosen, Laboran, Mahasiswa |
| P2 | Kelola Jadwal | Dosen, Laboran, Mahasiswa |
| P3 | Kelola Kuis dan Bank Soal | Dosen, Mahasiswa |
| P4 | Kelola Materi | Dosen, Mahasiswa |
| P5 | Kelola Kelas, Mata Kuliah, dan Assignment | Admin, Dosen, Mahasiswa |
| P6 | Kelola User | Admin |
| P7 | Kehadiran dan Penilaian | Dosen, Mahasiswa |
| P8 | Logbook Digital | Mahasiswa, Dosen |
| P9 | Peminjaman Alat dan Inventaris | Dosen, Laboran, Admin |
| P10 | Pengumuman | Admin, Mahasiswa, Dosen, Laboran |
| P11 | Sinkronisasi Offline (PWA) | Admin, Dosen, Mahasiswa, Supabase |

Data store pada DFD Level 1 terdiri dari:
- D1: Database Supabase
- D2: IndexedDB Cache pada browser
- D3: Offline Queue pada browser
- D4: Storage file untuk materi dan berkas pendukung

Berdasarkan DFD Level 1 tersebut dapat dilihat bahwa sistem tidak hanya melayani proses akademik, tetapi juga mendukung pengelolaan inventaris laboratorium, distribusi pengumuman oleh admin, serta mekanisme sinkronisasi data ketika perangkat berada pada kondisi offline. Penyesuaian ini penting agar DFD yang dimasukkan ke Bab IV tetap konsisten dengan fitur aktif pada aplikasi. Dalam kerangka penelitian, proses-proses tersebut tetap diarahkan untuk menjawab kebutuhan utama pengelolaan praktikum, yaitu penjadwalan, distribusi materi, logbook digital, penilaian, pengumuman, dan dukungan akses lintas kondisi jaringan.

### 4.1.2 DFD Level 2

DFD Level 2 digunakan untuk menjabarkan proses-proses utama yang paling kompleks, yaitu autentikasi, pengelolaan kuis dan bank soal, pengelolaan materi, peminjaman alat dan inventaris, serta sinkronisasi offline pada PWA. Pemilihan proses ini didasarkan pada tingkat kompleksitas aliran data dan keterkaitannya dengan fitur utama yang benar-benar digunakan pada aplikasi.

**[TEMPAT GAMBAR 4.2 — Diagram DFD Level 2 Sistem Praktikum PWA]**

*Gambar 4.2. Data Flow Diagram Level 2 Sistem Praktikum PWA*

Berdasarkan Gambar 4.2, terlihat rincian subproses dari beberapa modul inti sistem, seperti autentikasi, pengelolaan kuis, pengelolaan materi, peminjaman alat, dan sinkronisasi data offline. Diagram ini memperlihatkan aliran data yang lebih detail antara proses, data store, dan entitas eksternal. Gambar ini penting karena membantu menjelaskan bagaimana proses bisnis yang sebelumnya masih umum pada DFD Level 1 diterjemahkan menjadi alur kerja yang lebih spesifik dan operasional.

#### 1. P1 — Autentikasi

| Sub-Proses | Deskripsi |
|---|---|
| 1.1 Validasi Kredensial | Sistem memverifikasi email dan password pengguna melalui layanan autentikasi |
| 1.2 Ambil Data Role | Sistem mengambil data peran pengguna setelah login berhasil |
| 1.3 Bentuk Session Login | Sistem membentuk status login aktif pada aplikasi |
| 1.4 Redirect Berdasarkan Role | Pengguna diarahkan ke dashboard sesuai hak akses |
| 1.5 Logout | Sistem mengakhiri sesi login pengguna |

#### 2. P3 — Kelola Kuis dan Bank Soal

| Sub-Proses | Deskripsi |
|---|---|
| 3.1 Buat Kuis | Dosen menginput judul, durasi, dan relasi kuis dengan kelas |
| 3.2 Kelola Bank Soal | Dosen membuat, mengubah, atau menggunakan kembali soal dari bank soal |
| 3.3 Publish Kuis | Kuis diaktifkan agar mahasiswa dapat mengaksesnya |
| 3.4 Ambil Soal | Sistem mengambil soal dari database atau cache lokal |
| 3.5 Kerjakan Kuis | Mahasiswa menjawab soal secara online maupun offline |
| 3.6 Auto-save Offline | Jawaban disimpan ke queue lokal saat koneksi tidak tersedia |
| 3.7 Submit dan Penilaian | Jawaban dikirim dan hasil dihitung oleh sistem |
| 3.8 Lihat Hasil | Dosen melihat statistik, sedangkan mahasiswa melihat hasil pengerjaan |

Data store pada proses ini meliputi tabel `kuis`, `soal`, `bank_soal`, `attempt_kuis`, `jawaban`, cache IndexedDB, dan offline queue.

#### 3. P4 — Kelola Materi

| Sub-Proses | Deskripsi |
|---|---|
| 4.1 Upload Materi | Dosen mengunggah file materi |
| 4.2 Simpan Metadata | Sistem menyimpan informasi materi seperti judul, kelas, dan referensi file |
| 4.3 Lihat Daftar Materi | Dosen dan mahasiswa mengakses daftar materi |
| 4.4 Akses atau Unduh Materi | Mahasiswa membuka atau mengunduh file materi |
| 4.5 Cache Offline | Sistem menyimpan materi atau referensinya ke cache lokal |

#### 4. P9 — Peminjaman Alat dan Inventaris

| Sub-Proses | Deskripsi |
|---|---|
| 9.1 Kelola Inventaris | Laboran mengelola data alat, stok, dan kondisi |
| 9.2 Ajukan Peminjaman | Dosen mengajukan peminjaman alat |
| 9.3 Verifikasi dan Keputusan | Laboran atau Admin menyetujui atau menolak permohonan |
| 9.4 Monitor Peminjaman Aktif | Laboran dan Admin memantau transaksi yang masih berjalan |
| 9.5 Laporan | Sistem menampilkan rekap inventaris dan peminjaman |

#### 5. P11 — Sinkronisasi Offline / PWA

| Sub-Proses | Deskripsi |
|---|---|
| 11.1 Deteksi Status Jaringan | Sistem memantau kondisi online atau offline |
| 11.2 Simpan Data ke Cache | Data penting disimpan ke IndexedDB saat diperlukan |
| 11.3 Simpan Operasi ke Queue | Operasi tulis saat offline dimasukkan ke antrian |
| 11.4 Proses Sinkronisasi | Queue diproses kembali saat koneksi tersedia |
| 11.5 Tangani Konflik dan Retry | Sistem menangani konflik data dan percobaan ulang sinkronisasi |

Data store P11 mencakup cache IndexedDB, offline queue, conflict log, dan basis data utama.

Berdasarkan DFD Level 2, dapat disimpulkan bahwa proses yang dirancang tidak hanya mendukung operasi standar berbasis web, tetapi juga mengakomodasi kebutuhan khusus sistem praktikum, terutama autentikasi multi-role, pengerjaan kuis offline, distribusi materi, peminjaman alat, dan sinkronisasi data otomatis.

### 4.1.3 Entity Relationship Diagram (ERD)

ERD sistem terdiri dari entitas-entitas utama yang dikelompokkan berdasarkan domain data. Diagram ERD divisualisasikan menggunakan Mermaid dan menunjukkan hubungan antarentitas dalam sistem. Pada versi revisi ini, nama entitas telah disesuaikan dengan implementasi database aktual sehingga lebih konsisten dengan aplikasi yang berjalan.

**[TEMPAT GAMBAR 4.3 — Entity Relationship Diagram (ERD) Sistem Praktikum PWA]**

*Gambar 4.3. Entity Relationship Diagram Sistem Praktikum PWA*

Berdasarkan Gambar 4.3, terlihat hubungan antarentitas utama pada basis data sistem, seperti `users`, `admin`, `dosen`, `mahasiswa`, `laboran`, `kelas`, `jadwal_praktikum`, `kuis`, `soal`, `attempt_kuis`, `jawaban`, `inventaris`, dan `peminjaman`. Relasi antarentitas tersebut menunjukkan bahwa data pada sistem dirancang secara terstruktur untuk mendukung proses akademik, operasional laboratorium, dan kebutuhan sinkronisasi offline. Gambar ini penting karena menjadi dasar logis bagi implementasi database dan integrasi antarfitur pada aplikasi.

| Kategori | Tabel / Entitas Utama |
|---|---|
| Identitas dan Role Pengguna | `users`, `admin`, `dosen`, `mahasiswa`, `laboran` |
| Akademik dan Kelas | `mata_kuliah`, `kelas`, `kelas_mahasiswa`, `dosen_mata_kuliah`, `kelas_dosen_assignment` |
| Praktikum dan Pembelajaran | `jadwal_praktikum`, `kehadiran`, `materi`, `logbook_entries`, `nilai`, `permintaan_perbaikan_nilai` |
| Kuis dan Evaluasi | `kuis`, `soal`, `bank_soal`, `attempt_kuis`, `jawaban` |
| Laboratorium dan Inventaris | `laboratorium`, `inventaris`, `peminjaman` |
| Komunikasi | `pengumuman`, `notifications` |
| Sinkronisasi dan Audit | `offline_queue`, `sync_history`, `conflict_log`, `cache_metadata`, `audit_logs` |

Relasi utama pada ERD adalah sebagai berikut:
- Relasi identitas akun berpusat pada `users`, kemudian diperluas ke tabel role seperti `admin`, `dosen`, `mahasiswa`, dan `laboran`.
- Relasi akademik dibangun dari `mata_kuliah`, `kelas`, `kelas_mahasiswa`, dan assignment dosen.
- Relasi praktikum direpresentasikan oleh `jadwal_praktikum`, kemudian diturunkan ke `kehadiran`, `materi`, `logbook_entries`, dan `nilai`.
- Relasi modul kuis dibangun dari `kuis`, `soal`, `bank_soal`, `attempt_kuis`, dan `jawaban`.
- Relasi inventaris dibangun dari `laboratorium`, `inventaris`, dan `peminjaman`.

Struktur relasi tersebut menunjukkan bahwa sistem dirancang secara terorganisasi dan mendukung integrasi data antarfitur secara konsisten, baik pada sisi akademik maupun pada sisi operasional aplikasi offline-first.

### 4.1.4 Skema Database

Skema database merupakan implementasi teknis dari ERD yang digunakan untuk menyimpan data autentikasi, akademik, inventaris, materi, evaluasi pembelajaran, komunikasi, dan sinkronisasi offline. Pada implementasi aktual, struktur basis data tidak lagi memakai satu tabel `profiles` seperti pada rancangan konseptual sederhana, melainkan dipisahkan ke tabel role yang terhubung dengan `users`.

| Tabel / Kelompok Tabel | Kolom Utama | Keterangan |
|---|---|---|
| `users` | `id`, `email` | identitas akun utama |
| `admin`, `dosen`, `mahasiswa`, `laboran` | `id`, `user_id`, identitas role | data profil per role yang menggantikan konsep `profiles` |
| `mata_kuliah` | `id`, `kode`, `nama` | data master mata kuliah |
| `kelas` | `id`, `nama`, relasi akademik | data kelas praktikum |
| `kelas_mahasiswa` | `id`, `kelas_id`, `mahasiswa_id` | relasi mahasiswa dengan kelas |
| `jadwal_praktikum` | `id`, `kelas_id`, `laboratorium_id`, `jam_mulai`, `jam_selesai` | jadwal kegiatan praktikum |
| `materi` | `id`, `kelas_id`, `file_url` | metadata materi pembelajaran |
| `kuis` | `id`, `kelas_id`, `judul`, `durasi_menit` | data kuis |
| `soal` | `id`, `kuis_id` | soal pada kuis |
| `bank_soal` | `id`, `dosen_id`, `pertanyaan`, `tipe_soal` | bank soal reusable |
| `attempt_kuis` | `id`, `kuis_id`, `mahasiswa_id`, `status` | data attempt pengerjaan kuis |
| `jawaban` | `id`, `attempt_id`, `soal_id` | jawaban detail per soal |
| `kehadiran` | `id`, `jadwal_id`, `mahasiswa_id`, `status` | data presensi |
| `nilai` | `id`, relasi mahasiswa | data nilai akademik |
| `logbook_entries` | `id`, relasi mahasiswa dan kelas | logbook kegiatan praktikum |
| `inventaris` | `id`, `laboratorium_id`, `nama_barang`, `jumlah`, `kondisi` | data alat laboratorium |
| `peminjaman` | `id`, `inventaris_id`, `status` | transaksi peminjaman alat |
| `pengumuman` | `id`, `judul`, `konten` | pengumuman yang dibuat admin |
| `notifications` | `id`, `user_id`, `is_read` | notifikasi pengguna |
| `offline_queue`, `conflict_log`, `cache_metadata`, `sync_history` | identitas sinkronisasi | tabel pendukung offline-first |

Skema tersebut memperlihatkan bahwa sistem menggunakan basis data yang mampu menangani kebutuhan multi-role, manajemen kelas, distribusi materi, evaluasi pembelajaran, inventaris, notifikasi, hingga sinkronisasi data offline. Struktur ini juga menunjukkan bahwa implementasi basis data akhir lebih kaya dibanding rancangan konseptual awal, karena telah menyesuaikan kebutuhan operasional aplikasi yang sebenarnya.

---

## 4.2 Hasil Implementasi Sistem

Hasil implementasi sistem pada penelitian ini menunjukkan bahwa aplikasi telah direalisasikan ke dalam beberapa modul utama yang mendukung proses praktikum secara digital. Modul tersebut mencakup autentikasi pengguna, dashboard berbasis role, pengelolaan jadwal, materi, kuis, logbook, nilai, peminjaman alat, pengumuman, notifikasi, inventaris, serta sinkronisasi offline. Implementasi ini menunjukkan bahwa sistem tidak hanya berhenti pada rancangan konseptual, tetapi telah diwujudkan menjadi aplikasi yang dapat digunakan pada proses operasional praktikum.

Secara umum, hasil implementasi memperlihatkan bahwa sistem telah berhasil mengintegrasikan kebutuhan akademik dan kebutuhan operasional ke dalam satu aplikasi berbasis web progresif. Dari sisi akademik, sistem mendukung distribusi materi, pelaksanaan kuis, pencatatan logbook, pengelolaan kehadiran, dan penilaian. Dari sisi operasional, sistem juga menyediakan pengelolaan inventaris, peminjaman alat, pengumuman, notifikasi, serta pengendalian akses berbasis role. Dengan adanya integrasi tersebut, proses yang sebelumnya cenderung terpisah dapat dijalankan melalui satu platform yang sama.

Jika ditinjau dari sisi metode penelitian, hasil implementasi ini dapat dipahami sebagai keluaran dari tahapan perancangan dan pengembangan artefak dalam kerangka Research and Development (R&D) yang diadaptasi dari Ellis dan Levy. Dengan demikian, implementasi sistem yang dipaparkan pada bagian ini bukan sekadar daftar halaman atau fitur, melainkan representasi nyata dari artefak penelitian yang dibangun untuk menjawab masalah yang telah diidentifikasi pada tahap awal penelitian. Artefak tersebut dikembangkan untuk mendukung kebutuhan dosen dan mahasiswa dalam pengelolaan praktikum, sambil tetap melibatkan admin dan laboran sebagai role pendukung agar alur operasional sistem dapat berjalan secara utuh.

Jika dibandingkan dengan rancangan awal pada proposal, implementasi akhir aplikasi memang berkembang lebih luas. Pada proposal, fokus fitur dijelaskan pada pengelolaan jadwal praktikum, peminjaman alat laboratorium, logbook kegiatan mahasiswa, penilaian praktikum, pengumuman, distribusi materi, serta dukungan pengelolaan praktikum pada konteks 9 ruang laboratorium dan 1 ruang depo alat. Pada implementasi aktual, sistem juga dilengkapi fitur tambahan seperti bank soal, kuis online dan offline, manajemen user, manajemen kelas dan mata kuliah, notifikasi, inventaris laboratorium, serta offline sync. Penambahan ini merupakan hasil pengembangan bertahap selama proses implementasi dan tetap mendukung tujuan utama sistem informasi praktikum berbasis PWA.

Perluasan fitur tersebut dapat dipahami sebagai konsekuensi logis dari proses pengembangan yang iteratif. Ketika sistem mulai direalisasikan ke dalam bentuk aplikasi, kebutuhan teknis dan kebutuhan penggunaan nyata di lapangan menjadi lebih terlihat. Karena itu, beberapa modul tambahan dikembangkan agar alur praktikum dapat berjalan lebih utuh, mulai dari pengelolaan data master, distribusi informasi, pelaksanaan evaluasi, hingga dukungan penggunaan saat koneksi internet tidak stabil. Dengan kata lain, implementasi akhir bukan menyimpang dari tujuan penelitian, tetapi merupakan penyempurnaan agar sistem lebih siap digunakan.

Dalam perspektif user-centered design, implementasi akhir ini juga menunjukkan bahwa sistem tidak dibangun hanya dari sudut pandang teknis pengembang, melainkan diarahkan untuk menyesuaikan kebutuhan pengguna utama. Hal tersebut terlihat dari adanya pemisahan alur berdasarkan role, penyederhanaan akses menuju fitur inti, penyediaan halaman khusus untuk aktivitas utama dosen dan mahasiswa, serta dukungan fitur PWA agar sistem tetap dapat digunakan pada kondisi koneksi yang berubah-ubah. Dengan demikian, hasil implementasi bukan hanya membuktikan bahwa sistem berhasil dibangun, tetapi juga menunjukkan bahwa artefak yang dihasilkan telah diarahkan untuk usable dalam konteks penggunaan nyata.

Pada subbab ini, pembahasan difokuskan pada hasil implementasi yang benar-benar tersedia pada aplikasi aktif. Uraian disusun berdasarkan modul dan role pengguna agar pembaca dapat melihat dengan jelas hubungan antara fitur yang dibangun dan kebutuhan pengguna yang dilayani. Dengan penyajian seperti ini, bagian hasil implementasi menjadi lebih konkret, deskriptif, dan sesuai dengan karakter penulisan skripsi yang menuntut pemaparan sistem secara nyata. Pada saat yang sama, pembahasan tetap menempatkan dosen dan mahasiswa sebagai fokus utama penelitian sesuai proposal, sedangkan admin dan laboran dijelaskan sebagai role pendukung yang memperkuat kelengkapan operasional sistem.

### 4.2.1 Halaman Autentikasi

Hasil implementasi pada modul autentikasi mencakup halaman login, registrasi, dan lupa password. Seluruh role menggunakan halaman login yang sama, kemudian sistem melakukan redirect otomatis ke dashboard masing-masing setelah autentikasi berhasil. Hal ini terlihat dari keberadaan halaman autentikasi pada [`src/pages/auth/LoginPage.tsx`](src/pages/auth/LoginPage.tsx), [`src/pages/auth/RegisterPage.tsx`](src/pages/auth/RegisterPage.tsx), dan [`src/pages/auth/ForgotPasswordPage.tsx`](src/pages/auth/ForgotPasswordPage.tsx), serta pengaturan rute pada [`src/routes/index.tsx`](src/routes/index.tsx:107).

Implementasi autentikasi ini menjadi fondasi utama aplikasi karena seluruh fitur lain hanya dapat diakses setelah identitas pengguna dikenali oleh sistem. Melalui mekanisme ini, sistem dapat menentukan role pengguna dan menyesuaikan halaman tujuan, menu navigasi, serta hak akses yang diberikan. Dengan demikian, autentikasi tidak hanya berfungsi sebagai pintu masuk aplikasi, tetapi juga sebagai pengendali awal terhadap alur penggunaan sistem secara keseluruhan.

| Halaman | Route | Keterangan |
|---|---|---|
| Login | `/login` | Login semua role, redirect otomatis ke dashboard masing-masing |
| Register | `/register` | Registrasi akun baru |
| Lupa Password | `/forgot-password` | Reset password melalui email |
| Unauthorized | `/403` | Halaman saat pengguna mengakses rute tanpa hak akses |
| Not Found | `/404` | Halaman saat rute tidak ditemukan |

**[TEMPAT GAMBAR 4.4 — Halaman Login]**

*Gambar 4.4. Implementasi Halaman Login*

Berdasarkan Gambar 4.4, halaman login menampilkan komponen utama berupa field email, field password, dan tombol masuk ke sistem. Halaman ini berfungsi sebagai gerbang autentikasi bagi seluruh role pengguna sebelum diarahkan ke dashboard masing-masing. Keberadaan gambar ini penting untuk menunjukkan bahwa proses autentikasi telah diimplementasikan dalam bentuk antarmuka yang nyata dan dapat digunakan langsung oleh pengguna.

**[TEMPAT GAMBAR 4.5 — Halaman Register]**

*Gambar 4.5. Implementasi Halaman Register*

Berdasarkan Gambar 4.5, halaman register menampilkan form pendaftaran akun baru beserta field identitas yang perlu diisi oleh pengguna. Halaman ini mendukung proses pembuatan akun agar pengguna dapat masuk ke dalam ekosistem sistem praktikum. Gambar ini penting karena menunjukkan bahwa sistem tidak hanya melayani proses login, tetapi juga menyediakan mekanisme registrasi pengguna sebagai bagian dari alur penggunaan awal.

**[TEMPAT GAMBAR 4.6 — Halaman Lupa Password]**

*Gambar 4.6. Implementasi Halaman Lupa Password*

Berdasarkan Gambar 4.6, halaman lupa password menampilkan input email dan aksi untuk mengirim permintaan reset password. Fitur ini berfungsi untuk membantu pengguna mendapatkan kembali akses ke akun ketika lupa kata sandi. Gambar ini penting karena memperlihatkan bahwa sistem telah menyediakan dukungan pemulihan akun, yang merupakan bagian penting dari aspek usability dan keandalan layanan autentikasi.

### 4.2.2 Dashboard dan Fitur Admin

Modul Admin berfungsi sebagai pusat kontrol sistem. Admin memiliki hak akses untuk mengelola pengguna, kelas, mata kuliah, laboratorium, peralatan, peminjaman, pengumuman, notifikasi, serta pengelolaan assignment terpadu. Implementasi halaman admin terkonfirmasi dari daftar file pada [`src/pages/admin`](src/pages/admin) dan rute pada [`src/routes/index.tsx`](src/routes/index.tsx:116). Keberadaan modul admin membuat pengelolaan data master dan operasional sistem dapat dilakukan secara terpusat sehingga aktivitas praktikum pada role lain berjalan lebih terstruktur.

Secara fungsional, modul admin berperan menjaga konsistensi data yang menjadi dasar bagi modul lain. Data pengguna, kelas, mata kuliah, laboratorium, dan inventaris yang dikelola admin akan memengaruhi kelancaran proses pada sisi dosen, mahasiswa, dan laboran. Oleh karena itu, walaupun admin bukan pengguna utama kegiatan praktikum harian, implementasi modul ini tetap penting karena berfungsi sebagai pengendali struktur data dan administrasi sistem.

| Halaman | Route | Fitur |
|---|---|---|
| Dashboard | `/admin/dashboard` | Statistik dan ringkasan sistem |
| Manajemen Pengguna | `/admin/users` | CRUD user berbagai role |
| Manajemen Kelas | `/admin/kelas` | Kelola kelas dan anggota kelas |
| Mata Kuliah | `/admin/mata-kuliah` | CRUD mata kuliah |
| Assignment Kelas | `/admin/kelas-mata-kuliah` | Menghubungkan mata kuliah dengan kelas |
| Manajemen Assignment | `/admin/manajemen-assignment` | Kelola assignment dan jadwal terpadu |
| Laboratorium | `/admin/laboratories` | CRUD laboratorium |
| Peralatan | `/admin/equipments` | Manajemen data inventaris dan alat |
| Peminjaman | `/admin/peminjaman` | Persetujuan peminjaman |
| Peminjaman Aktif | `/admin/peminjaman-aktif` | Monitor peminjaman yang sedang berjalan |
| Pengumuman | `/admin/announcements` | Membuat dan mengelola pengumuman |
| Notifikasi | `/admin/notifikasi` | Alias tampilan pengumuman untuk admin |
| Profil | `/admin/profil` | Edit profil admin |
| Offline Sync | `/admin/offline-sync` | Melihat status sinkronisasi offline pada admin |

Pada implementasi saat ini, halaman analytics dan sync management tersedia sebagai file pengembangan, tetapi tidak dijadikan fokus utama dalam ruang lingkup fitur inti penelitian. Oleh karena itu, pembahasan Bab IV difokuskan pada halaman admin yang aktif pada rute utama aplikasi.

**[TEMPAT GAMBAR 4.7 — Dashboard Admin]**

*Gambar 4.7. Implementasi Dashboard Admin*

Berdasarkan Gambar 4.7, dashboard admin menampilkan ringkasan informasi sistem, statistik utama, serta akses cepat ke fitur pengelolaan data. Halaman ini berfungsi sebagai pusat kontrol bagi admin untuk memantau kondisi sistem dan mengelola berbagai modul inti. Gambar ini penting karena menunjukkan bagaimana peran admin direpresentasikan dalam antarmuka yang terpusat dan mendukung pengambilan keputusan operasional.

**[TEMPAT GAMBAR 4.8 — Halaman Manajemen Pengguna Admin]**

*Gambar 4.8. Implementasi Halaman Manajemen Pengguna Admin*

Berdasarkan Gambar 4.8, halaman manajemen pengguna menampilkan tabel data user beserta aksi pengelolaan seperti tambah, edit, pencarian, atau penyaringan data. Halaman ini digunakan admin untuk mengatur akun dan role pengguna dalam sistem. Gambar ini penting karena memperlihatkan implementasi kontrol administratif yang menjadi fondasi pengelolaan akses multi-role pada aplikasi.

### 4.2.3 Dashboard dan Fitur Dosen

Pada sisi Dosen, sistem menyediakan fitur yang mendukung proses pembelajaran dan evaluasi, seperti pengelolaan kuis, bank soal, materi, kehadiran, penilaian, review logbook mahasiswa, peminjaman alat, notifikasi, pengumuman, profil, dan sinkronisasi offline. Hal ini didukung oleh file-file halaman pada [`src/pages/dosen`](src/pages/dosen) dan [`src/pages/dosen/kuis`](src/pages/dosen/kuis), serta konfigurasi rute pada [`src/routes/index.tsx`](src/routes/index.tsx:187). Melalui modul ini, dosen dapat mengelola aktivitas pembelajaran praktikum mulai dari distribusi materi, penyusunan evaluasi, pemantauan aktivitas mahasiswa, hingga pengisian nilai.

Implementasi pada sisi dosen menunjukkan bahwa sistem telah mendukung kebutuhan pengajar secara lebih lengkap. Dosen tidak hanya dapat menyampaikan materi, tetapi juga menyusun penilaian, memantau hasil pengerjaan mahasiswa, memeriksa logbook, serta berinteraksi dengan modul peminjaman dan pengumuman. Dengan demikian, sistem memberi ruang bagi dosen untuk menjalankan fungsi akademik dan evaluatif dalam satu lingkungan kerja yang terintegrasi.

| Halaman | Route | Fitur |
|---|---|---|
| Dashboard | `/dosen/dashboard` | Ringkasan aktivitas dosen |
| Jadwal | `/dosen/jadwal` | Lihat dan kelola jadwal terkait dosen |
| Kehadiran | `/dosen/kehadiran` | Input dan rekap absensi |
| Materi | `/dosen/materi` | Upload dan kelola materi |
| Kuis - Daftar | `/dosen/kuis` | Daftar semua kuis |
| Kuis - Buat | `/dosen/kuis/create` | Membuat kuis baru |
| Kuis - Edit | `/dosen/kuis/:kuisId/edit` | Edit kuis atau soal |
| Kuis - Hasil | `/dosen/kuis/:kuisId/results` | Statistik hasil kuis |
| Kuis - Detail Attempt | `/dosen/kuis/:kuisId/attempt/:attemptId` | Melihat jawaban tiap mahasiswa |
| Bank Soal | `/dosen/bank-soal` | Kelola koleksi soal reusable |
| Penilaian | `/dosen/penilaian` | Input nilai mahasiswa |
| Review Logbook | `/dosen/logbook-review` | Meninjau logbook mahasiswa |
| Peminjaman Alat | `/dosen/peminjaman` | Ajukan peminjaman alat |
| Notifikasi | `/dosen/notifikasi` | Melihat pengumuman dalam bentuk notifikasi |
| Pengumuman | `/dosen/pengumuman` | Melihat pengumuman yang didistribusikan admin |
| Profil | `/dosen/profil` | Edit profil dosen |
| Offline Sync | `/dosen/offline-sync` | Melihat status sinkronisasi offline dosen |

**[TEMPAT GAMBAR 4.9 — Dashboard Dosen]**

*Gambar 4.9. Implementasi Dashboard Dosen*

Berdasarkan Gambar 4.9, dashboard dosen menampilkan ringkasan aktivitas pembelajaran, informasi terkait kelas, serta akses menuju fitur utama seperti kuis, materi, penilaian, dan logbook review. Halaman ini berfungsi sebagai pusat aktivitas dosen dalam mengelola proses pembelajaran praktikum. Gambar ini penting karena menunjukkan bahwa kebutuhan dosen telah diakomodasi dalam antarmuka yang terarah dan sesuai dengan alur kerja akademik.

**[TEMPAT GAMBAR 4.10 — Halaman Kuis Dosen]**

*Gambar 4.10. Implementasi Fitur Kuis Dosen*

Berdasarkan Gambar 4.10, halaman fitur kuis dosen menampilkan daftar kuis atau builder kuis beserta aksi pembuatan, pengeditan, dan pengelolaan soal. Fitur ini mendukung dosen dalam menyusun evaluasi pembelajaran secara terstruktur. Gambar ini penting karena memperlihatkan implementasi salah satu fitur inti sistem yang berkaitan langsung dengan proses penilaian dan aktivitas praktikum mahasiswa.

### 4.2.4 Dashboard dan Fitur Mahasiswa

Modul Mahasiswa difokuskan pada akses kegiatan praktikum, materi pembelajaran, pengerjaan kuis, logbook, nilai, presensi, peminjaman, notifikasi, pengumuman, profil, dan sinkronisasi offline. Keberadaan fitur ini sesuai dengan file halaman pada [`src/pages/mahasiswa`](src/pages/mahasiswa) dan [`src/pages/mahasiswa/kuis`](src/pages/mahasiswa/kuis), serta konfigurasi rute pada [`src/routes/index.tsx`](src/routes/index.tsx:264). Melalui modul ini, mahasiswa dapat mengikuti alur praktikum secara lebih terintegrasi, mulai dari melihat jadwal, mengakses materi, mengerjakan kuis, mencatat logbook, memantau nilai, hingga melakukan sinkronisasi data ketika koneksi kembali tersedia.

Implementasi pada sisi mahasiswa memperlihatkan bahwa aplikasi dirancang untuk mendukung aktivitas praktikum dari awal hingga akhir. Mahasiswa dapat memperoleh informasi, mengikuti evaluasi, mengirim catatan kegiatan, melihat hasil belajar, dan tetap mengakses data penting ketika jaringan tidak stabil. Keberadaan modul ini sangat penting karena mahasiswa merupakan pengguna yang paling sering berinteraksi dengan sistem dalam kegiatan praktikum sehari-hari.

| Halaman | Route | Fitur |
|---|---|---|
| Dashboard | `/mahasiswa/dashboard` | Ringkasan aktivitas mahasiswa |
| Jadwal | `/mahasiswa/jadwal` | Jadwal praktikum |
| Presensi | `/mahasiswa/presensi` | Rekap kehadiran |
| Materi | `/mahasiswa/materi` | Akses dan unduh materi |
| Kuis - Daftar | `/mahasiswa/kuis` | Daftar kuis tersedia |
| Kuis - Kerjakan | `/mahasiswa/kuis/:id/attempt` | Kerjakan kuis online maupun offline |
| Kuis - Hasil | `/mahasiswa/kuis/:id/result` | Melihat nilai dan jawaban |
| Nilai | `/mahasiswa/nilai` | Rekap nilai |
| Logbook | `/mahasiswa/logbook` | Catat logbook praktikum |
| Peminjaman | `/mahasiswa/peminjaman` | Ajukan peminjaman alat laboratorium |
| Peminjaman Saya | `/mahasiswa/peminjaman-saya` | Memantau status peminjaman pribadi |
| Notifikasi | `/mahasiswa/notifikasi` | Menerima notifikasi dan ringkasan informasi |
| Pengumuman | `/mahasiswa/pengumuman` | Lihat pengumuman yang dipublikasikan admin |
| Profil | `/mahasiswa/profil` | Edit profil mahasiswa |
| Offline Sync | `/mahasiswa/offline-sync` | Melihat dan mengelola sinkronisasi offline |

**[TEMPAT GAMBAR 4.11 — Dashboard Mahasiswa]**

*Gambar 4.11. Implementasi Dashboard Mahasiswa*

Berdasarkan Gambar 4.11, dashboard mahasiswa menampilkan ringkasan kegiatan praktikum seperti jadwal, materi, kuis, notifikasi, atau informasi akademik lain yang relevan. Halaman ini berfungsi sebagai titik awal interaksi mahasiswa dengan sistem. Gambar ini penting karena menunjukkan bahwa sistem telah dirancang untuk menyajikan informasi yang paling dibutuhkan pengguna utama secara ringkas dan mudah diakses.

**[TEMPAT GAMBAR 4.12 — Halaman Kuis Mahasiswa]**

*Gambar 4.12. Implementasi Fitur Kuis Mahasiswa*

Berdasarkan Gambar 4.12, halaman kuis mahasiswa menampilkan daftar kuis yang tersedia atau tampilan pengerjaan kuis secara langsung. Halaman ini mendukung mahasiswa dalam mengikuti evaluasi pembelajaran melalui sistem digital. Gambar ini penting karena memperlihatkan bahwa proses pengerjaan kuis telah diimplementasikan secara nyata dan menjadi bagian integral dari fungsi akademik sistem.

**[TEMPAT GAMBAR 4.13 — Halaman Offline Sync Mahasiswa]**

*Gambar 4.13. Implementasi Halaman Offline Sync Mahasiswa*

Berdasarkan Gambar 4.13, halaman offline sync mahasiswa menampilkan daftar antrian sinkronisasi, status data lokal, serta aksi seperti sinkronisasi ulang atau percobaan ulang. Halaman ini berfungsi untuk membantu pengguna memantau proses pertukaran data antara penyimpanan lokal dan server. Gambar ini penting karena menunjukkan implementasi langsung dari pendekatan `offline-first` yang menjadi keunggulan utama aplikasi.

### 4.2.5 Dashboard dan Fitur Laboran

Modul Laboran difokuskan pada pengelolaan inventaris, persetujuan peminjaman, operasional laboratorium, persetujuan jadwal, pengumuman, profil, pelaporan, dan sinkronisasi offline. Implementasinya terlihat pada file-file di [`src/pages/laboran`](src/pages/laboran) serta rute aktif pada [`src/routes/index.tsx`](src/routes/index.tsx:335). Melalui modul ini, laboran dapat mengelola sarana laboratorium dan memantau proses peminjaman alat sehingga pelaksanaan praktikum menjadi lebih tertib dan terdokumentasi.

Dari sisi implementasi, modul laboran memperkuat aspek kesiapan fasilitas praktikum. Data inventaris, status alat, persetujuan peminjaman, dan laporan operasional menjadi bagian penting agar kegiatan praktikum tidak hanya berjalan dari sisi akademik, tetapi juga dari sisi ketersediaan sarana. Dengan demikian, sistem mendukung keterhubungan antara aktivitas pembelajaran dan pengelolaan laboratorium.

| Halaman | Route | Fitur |
|---|---|---|
| Dashboard | `/laboran/dashboard` | Ringkasan inventaris dan aktivitas laboran |
| Inventaris | `/laboran/inventaris` | CRUD alat laboratorium |
| Persetujuan | `/laboran/persetujuan` | Approve atau tolak peminjaman |
| Peminjaman Aktif | `/laboran/peminjaman-aktif` | Monitor peminjaman berjalan |
| Laboratorium | `/laboran/laboratorium` | Kelola data laboratorium |
| Jadwal | `/laboran/jadwal` | Meninjau dan memantau jadwal praktikum |
| Laporan | `/laboran/laporan` | Laporan inventaris dan peminjaman |
| Pengumuman | `/laboran/pengumuman` | Lihat pengumuman yang dipublikasikan admin |
| Notifikasi | `/laboran/notifikasi` | Menerima notifikasi terkait aktivitas laboratorium |
| Profil | `/laboran/profil` | Edit profil laboran |
| Offline Sync | `/laboran/offline-sync` | Memantau sinkronisasi data lokal laboran |

**[TEMPAT GAMBAR 4.14 — Dashboard Laboran]**

*Gambar 4.14. Implementasi Dashboard Laboran*

Berdasarkan Gambar 4.14, dashboard laboran menampilkan ringkasan kondisi inventaris, aktivitas peminjaman, serta informasi operasional laboratorium. Halaman ini berfungsi sebagai pusat informasi bagi laboran dalam memantau pekerjaan hariannya. Gambar ini penting karena menunjukkan bahwa sistem tidak hanya berorientasi pada pembelajaran, tetapi juga mendukung kebutuhan operasional laboratorium secara nyata.

**[TEMPAT GAMBAR 4.15 — Halaman Inventaris Laboran]**

*Gambar 4.15. Implementasi Halaman Inventaris Laboran*

Berdasarkan Gambar 4.15, halaman inventaris laboran menampilkan tabel data barang, stok, kondisi alat, dan aksi pengelolaan inventaris. Halaman ini digunakan untuk mencatat, memantau, dan memperbarui data peralatan laboratorium. Gambar ini penting karena memperlihatkan implementasi modul operasional yang mendukung ketertiban administrasi dan pengelolaan aset laboratorium.

### 4.2.6 Fitur PWA (Progressive Web App)

Implementasi PWA menjadi salah satu fitur unggulan aplikasi karena memungkinkan sistem tetap berjalan meskipun koneksi internet tidak stabil. Dari sisi dependensi, dukungan PWA menggunakan [`vite-plugin-pwa`](package.json:93), sedangkan sisi pengujian dan implementasi offline diperkuat oleh banyak modul pada [`src/lib/offline`](src/lib/offline) dan [`src/lib/pwa`](src/lib/pwa). Fitur ini penting karena kebutuhan akses praktikum tidak selalu berada pada kondisi jaringan yang ideal, sehingga aplikasi perlu tetap dapat digunakan secara andal pada berbagai kondisi konektivitas.

Keunggulan implementasi PWA pada sistem ini tidak hanya terletak pada kemampuan instalasi aplikasi, tetapi juga pada dukungan cache, offline queue, background sync, conflict resolution, dan indikator status jaringan. Kombinasi fitur tersebut membuat aplikasi lebih adaptif terhadap kondisi penggunaan nyata. Dalam konteks praktikum, kemampuan ini sangat relevan karena pengguna tetap dapat melanjutkan aktivitas penting seperti membaca materi, mengerjakan kuis, atau menyimpan data sementara tanpa harus sepenuhnya bergantung pada koneksi internet yang stabil.

| Fitur | Implementasi | Keterangan |
|---|---|---|
| Installable | Web App Manifest dan aset ikon | Aplikasi dapat dipasang di perangkat |
| Offline Indicator | Komponen indikator jaringan | Menampilkan status online atau offline |
| Prompt Install | Komponen prompt PWA | Pengguna diberi opsi memasang aplikasi |
| Kuis Offline | IndexedDB dan auto-save | Jawaban tersimpan saat koneksi terputus |
| Background Sync | Service Worker | Data disinkronkan kembali saat online |
| Cache Strategy | Service Worker dan cache strategy | Mendukung cache-first, network-first, dan stale-while-revalidate |
| Offline Queue | IndexedDB queue | Operasi tulis disimpan sementara saat offline |
| Conflict Resolution | Resolver dan conflict rules | Menangani konflik data ketika sinkronisasi |

**[TEMPAT GAMBAR 4.16 — Indikator Offline / Online]**

*Gambar 4.16. Implementasi Indikator Status Jaringan*

Berdasarkan Gambar 4.16, sistem menampilkan indikator status jaringan yang menunjukkan apakah aplikasi sedang berada dalam kondisi online atau offline. Komponen ini membantu pengguna memahami kondisi konektivitas saat menggunakan sistem. Gambar ini penting karena memperlihatkan bahwa aplikasi memberikan umpan balik visual yang jelas terhadap status jaringan, yang sangat relevan pada sistem berbasis PWA dan sinkronisasi offline.

**[TEMPAT GAMBAR 4.17 — Prompt Install PWA]**

*Gambar 4.17. Implementasi Prompt Install PWA*

Berdasarkan Gambar 4.17, aplikasi menampilkan prompt atau ajakan untuk memasang sistem sebagai aplikasi pada perangkat pengguna. Fitur ini mendukung karakteristik Progressive Web App yang dapat dipasang layaknya aplikasi native. Gambar ini penting karena menunjukkan bahwa sistem tidak hanya berjalan melalui browser, tetapi juga mendukung pengalaman penggunaan yang lebih praktis dan dekat dengan aplikasi mobile.

**[TEMPAT GAMBAR 4.18 — Kuis Saat Offline / Offline Sync]**

*Gambar 4.18. Implementasi Kuis Offline dan Sinkronisasi Data*

Berdasarkan Gambar 4.18, terlihat kondisi ketika sistem tetap dapat digunakan saat koneksi terganggu, termasuk penyimpanan jawaban secara lokal dan proses sinkronisasi kembali saat jaringan tersedia. Tampilan ini memperlihatkan respons sistem terhadap skenario penggunaan nyata di lapangan. Gambar ini penting karena menegaskan keunggulan utama aplikasi, yaitu kemampuan menjaga kontinuitas aktivitas pengguna walaupun koneksi internet tidak stabil.

---

## 4.3 Hasil Pengujian Black Box

Pengujian black box dilakukan untuk memastikan seluruh fungsi sistem berjalan sesuai kebutuhan pengguna tanpa meninjau struktur kode program. Pengujian dilakukan terhadap modul autentikasi, fitur admin, fitur dosen, fitur mahasiswa, fitur laboran, dan fitur PWA. Walaupun pengujian mencakup seluruh role yang tersedia pada aplikasi aktual, pembahasan hasilnya tetap difokuskan pada kontribusinya terhadap tujuan penelitian, terutama pada kemudahan pengelolaan praktikum oleh dosen dan mahasiswa.

### 4.3.1 Autentikasi

| No | Skenario | Input | Diharapkan | Aktual | Status |
|---|---|---|---|---|---|
| 1 | Login Admin valid | Email dan password Admin benar | Masuk `/admin/dashboard` | Masuk `/admin/dashboard` | Pass |
| 2 | Login Dosen valid | Email dan password Dosen benar | Masuk `/dosen/dashboard` | Masuk `/dosen/dashboard` | Pass |
| 3 | Login Mahasiswa valid | Email dan password Mahasiswa benar | Masuk `/mahasiswa/dashboard` | Masuk `/mahasiswa/dashboard` | Pass |
| 4 | Login Laboran valid | Email dan password Laboran benar | Masuk `/laboran/dashboard` | Masuk `/laboran/dashboard` | Pass |
| 5 | Login password salah | Password tidak cocok | Pesan error muncul | Pesan error muncul | Pass |
| 6 | Login email tidak terdaftar | Email belum ada | Pesan error muncul | Pesan error muncul | Pass |
| 7 | Akses halaman tanpa login | Akses dashboard langsung | Redirect ke `/login` | Redirect ke `/login` | Pass |
| 8 | Akses halaman role lain | Dosen akses route admin | Redirect ke `/403` | Redirect ke `/403` | Pass |
| 9 | Lupa password | Input email terdaftar | Email reset terkirim | Email reset terkirim | Pass |

### 4.3.2 Fitur Admin

| No | Skenario | Input | Diharapkan | Aktual | Status |
|---|---|---|---|---|---|
| 10 | Tambah user baru | Data lengkap | User tersimpan dan muncul di list | User tersimpan | Pass |
| 11 | Tambah user tanpa email | Email kosong | Validasi error | Validasi error | Pass |
| 12 | Edit data user | Ubah nama | Data terupdate | Data terupdate | Pass |
| 13 | Buat mata kuliah | Nama dan kode | Mata kuliah tersimpan | Tersimpan | Pass |
| 14 | Buat kelas baru | Nama, dosen, mata kuliah | Kelas tersimpan | Tersimpan | Pass |
| 15 | Tambah laboratorium | Nama, kapasitas, lokasi | Laboratorium tersimpan | Tersimpan | Pass |
| 16 | Buat pengumuman | Judul dan isi | Tampil pada role terkait | Tampil | Pass |
| 17 | Approve peminjaman | Klik setujui | Status menjadi disetujui | Status berubah | Pass |

### 4.3.3 Fitur Dosen

| No | Skenario | Input | Diharapkan | Aktual | Status |
|---|---|---|---|---|---|
| 18 | Buat kuis | Judul dan durasi | Kuis tersimpan sebagai draft | Tersimpan | Pass |
| 19 | Tambah soal ke kuis | Teks soal dan pilihan | Soal tersimpan | Tersimpan | Pass |
| 20 | Tambah soal dari bank soal | Pilih soal dari bank | Soal masuk ke kuis | Tersimpan | Pass |
| 21 | Publish kuis | Toggle publish | Kuis tampil di mahasiswa | Tampil | Pass |
| 22 | Lihat hasil kuis | Buka halaman results | Statistik dan skor tampil | Tampil | Pass |
| 23 | Input kehadiran | Centang mahasiswa hadir | Status kehadiran tersimpan | Tersimpan | Pass |
| 24 | Upload materi | File PDF dan judul | Materi tersedia di mahasiswa | Tersedia | Pass |
| 25 | Input penilaian | Nilai per mahasiswa | Nilai tersimpan | Tersimpan | Pass |
| 26 | Review logbook mahasiswa | Buka halaman logbook | Logbook tampil | Tampil | Pass |
| 27 | Ajukan peminjaman alat | Pilih alat dan tanggal | Permohonan terkirim | Terkirim | Pass |

### 4.3.4 Fitur Mahasiswa

| No | Skenario | Input | Diharapkan | Aktual | Status |
|---|---|---|---|---|---|
| 28 | Kerjakan kuis online | Pilih jawaban semua soal | Nilai muncul setelah submit | Nilai muncul | Pass |
| 29 | Kerjakan kuis offline | Matikan internet, isi jawaban | Jawaban auto-save ke IndexedDB | Tersimpan | Pass |
| 30 | Sync jawaban offline | Hidupkan internet kembali | Jawaban tersinkron ke server | Tersinkron | Pass |
| 31 | Akses materi offline | Materi pernah dibuka | Materi terbuka dari cache | Terbuka | Pass |
| 32 | Lihat nilai | Buka halaman nilai | Rekap nilai tampil | Tampil | Pass |
| 33 | Isi logbook | Tambah entri logbook | Entri tersimpan | Tersimpan | Pass |
| 34 | Lihat presensi | Buka halaman presensi | Rekap kehadiran tampil | Tampil | Pass |

### 4.3.5 Fitur Laboran

| No | Skenario | Input | Diharapkan | Aktual | Status |
|---|---|---|---|---|---|
| 35 | Tambah inventaris | Nama alat, jumlah, kondisi | Alat tersimpan | Tersimpan | Pass |
| 36 | Edit inventaris | Ubah jumlah stok | Data terupdate | Terupdate | Pass |
| 37 | Approve peminjaman | Klik setujui | Status menjadi disetujui | Berubah | Pass |
| 38 | Tolak peminjaman | Klik tolak | Status menjadi ditolak | Berubah | Pass |
| 39 | Approve jadwal | Klik approve jadwal dosen | Jadwal aktif | Aktif | Pass |
| 40 | Lihat laporan | Buka halaman laporan | Data peminjaman dan inventaris tampil | Tampil | Pass |

### 4.3.6 Fitur PWA

| No | Skenario | Input | Diharapkan | Aktual | Status |
|---|---|---|---|---|---|
| 41 | Install aplikasi | Klik prompt install | App terinstal di perangkat | Terinstal | Pass |
| 42 | Buka app saat offline | Matikan internet lalu buka app | App terbuka dari cache | Terbuka | Pass |
| 43 | Indikator offline | Matikan internet | Badge offline muncul | Muncul | Pass |
| 44 | Indikator online kembali | Hidupkan internet | Badge kembali normal | Berubah | Pass |
| 45 | Auto-save kuis offline | Isi jawaban saat offline | Notifikasi tersimpan offline muncul | Muncul | Pass |

### Rekapitulasi Black Box

| Kelompok | Jumlah Skenario | Pass | Fail |
|---|---:|---:|---:|
| Autentikasi | 9 | 9 | 0 |
| Fitur Admin | 8 | 8 | 0 |
| Fitur Dosen | 10 | 10 | 0 |
| Fitur Mahasiswa | 7 | 7 | 0 |
| Fitur Laboran | 6 | 6 | 0 |
| Fitur PWA | 5 | 5 | 0 |
| **Total** | **45** | **45** | **0** |

Persentase keberhasilan pengujian black box adalah:

**45/45 × 100% = 100%**

Hasil tersebut menunjukkan bahwa seluruh fungsi utama sistem telah berjalan sesuai keluaran yang diharapkan.

---

## 4.4 Hasil Pengujian White Box (Unit Test)

### 4.4.1 Framework dan Infrastruktur Pengujian

Pengujian white box pada sistem ini dilaksanakan menggunakan pendekatan unit test dan integration test yang bersifat otomatis dan dapat dieksekusi ulang kapan saja. Seluruh pengujian dijalankan sekaligus melalui perintah `npm run test` tanpa memerlukan intervensi manual pada setiap skenario. Penyajian hasil white box pada bab ini tetap mempertahankan ruang lingkup proposal penelitian, yaitu membuktikan bahwa logika internal sistem yang mendukung pengelolaan praktikum telah diverifikasi secara teknis, sambil tetap menampilkan data real terbaru dari keseluruhan aplikasi aktif.

| Komponen | Keterangan |
|---|---|
| Framework | Vitest v3.2.4 |
| Testing Library | React Testing Library |
| Assertion Library | `@testing-library/jest-dom` |
| DOM Environment | `happy-dom` |
| Runner Mode | Concurrent dengan `pool: forks` |
| Perintah Eksekusi | `npm run test` |

Konfigurasi [`pool: 'forks'`](vitest.config.ts:20) memastikan setiap file test dijalankan dalam proses terpisah sehingga tidak terjadi kebocoran state antar file. Seluruh pengujian menggunakan environment [`happy-dom`](vitest.config.ts:15), sedangkan dependensi eksternal dimock menggunakan pendekatan mocking agar logika internal aplikasi dapat diuji secara terisolasi.

### 4.4.2 Struktur dan Distribusi File Test

Pengujian mencakup seluruh lapisan arsitektur sistem sesuai pola Clean Architecture yang diterapkan, mulai dari lapisan core logic seperti API, hooks, offline/PWA, utilitas, validasi, wrapper Supabase, konfigurasi, dan context, hingga lapisan presentation seperti halaman, komponen fitur, komponen bersama, provider, layout, dan services. Selain itu, tersedia pula integration test dan legacy test yang masih dipertahankan sebagai pengaman regresi. Total terdapat **238 file test aktif** dengan **5.317 test case** pada eksekusi penuh terbaru.

| No | Kelompok Modul | Lapisan | Jumlah File | Jumlah Test Case |
|---|---|---|---:|---:|
| 1 | API Layer | Core Logic | 34 | 1.471 |
| 2 | Hooks | Core Logic | 21 | 561 |
| 3 | Offline & PWA | Core Logic | 15 | 738 |
| 4 | Utils & Helpers | Core Logic | 21 | 776 |
| 5 | Validasi (Schema) | Core Logic | 8 | 533 |
| 6 | Supabase | Core Logic | 5 | 103 |
| 7 | Config & Context | Core Logic | 11 | 170 |
| 8 | Halaman (Pages) | Presentation | 33 | 169 |
| 9 | Komponen Fitur | Presentation | 32 | 227 |
| 10 | Komponen Bersama | Presentation | 24 | 294 |
| 11 | Provider | Presentation | 6 | 84 |
| 12 | Layout | Presentation | 9 | 30 |
| 13 | Services & Lainnya | Presentation | 4 | 60 |
| 14 | Integration Test | Cross-layer | 8 | 90 |
| 15 | Legacy | — | 7 | 11 |
|   | **Total** |   | **238** | **5.317** |

Pada konteks penelitian ini, legacy test adalah file pengujian generasi sebelumnya yang masih dipertahankan dan tetap dijalankan bersama suite utama sebagai pengaman regresi, meskipun telah dipisahkan dari struktur utama unit test dan integration test.

### 4.4.3 Rincian Modul yang Diuji

#### A. API Layer — 34 File, 1.471 Test Case

Seluruh fungsi pemanggilan API ke Supabase diuji pada lapisan ini. Setiap fungsi diuji terhadap: skenario sukses dengan data valid, penanganan error dari Supabase, kondisi batas seperti data kosong atau parameter `null`, serta logika offline-first seperti fallback ke cache ketika API tidak dapat dijangkau.

Contoh file test pada kelompok ini meliputi [`admin.api.test.ts`](src/__tests__/unit/core-logic/api/admin.api.test.ts), [`announcements.api.test.ts`](src/__tests__/unit/core-logic/api/announcements.api.test.ts), [`auth.api.test.ts`](src/__tests__/unit/core-logic/api/auth.api.test.ts), [`bank-soal.api.test.ts`](src/__tests__/unit/core-logic/api/bank-soal.api.test.ts), [`jadwal.api.test.ts`](src/__tests__/unit/core-logic/api/jadwal.api.test.ts), [`kuis.api.test.ts`](src/__tests__/unit/core-logic/api/kuis.api.test.ts), [`kuis-secure.api.test.ts`](src/__tests__/unit/core-logic/api/kuis-secure.api.test.ts), [`sync.api.test.ts`](src/__tests__/unit/core-logic/api/sync.api.test.ts), dan [`users.api.test.ts`](src/__tests__/unit/core-logic/api/users.api.test.ts).

Beberapa contoh skenario pengujian spesifik dari [`kuis.api.test.ts`](src/__tests__/unit/core-logic/api/kuis.api.test.ts) adalah sebagai berikut:
- menerapkan filter default `status != archived` dan search;
- mematikan cache saat `forceRefresh = true`;
- `cacheQuizOffline` melakukan create saat belum ada cache;
- `syncOfflineAnswers` menghapus jawaban lokal setelah sinkronisasi sukses;
- `getKuisByIdOffline` melakukan fallback ke cache saat API gagal.

#### B. Hooks — 21 File, 561 Test Case

Seluruh custom React hooks diuji menggunakan `renderHook` dari React Testing Library. Setiap hook diuji terhadap state awal, perubahan state akibat aksi pengguna, side effect seperti pemanggilan API atau pembaruan `localStorage`, serta pembersihan saat komponen di-unmount.

Contoh file pada kelompok ini meliputi [`useAuth.test.ts`](src/__tests__/unit/core-logic/hooks/useAuth.test.ts), [`useAutoSave.test.ts`](src/__tests__/unit/core-logic/hooks/useAutoSave.test.ts), [`useConflicts.test.ts`](src/__tests__/unit/core-logic/hooks/useConflicts.test.ts), [`useDebounce.test.ts`](src/__tests__/unit/core-logic/hooks/useDebounce.test.ts), [`useNetworkStatus.test.ts`](src/__tests__/unit/core-logic/hooks/useNetworkStatus.test.ts), [`useOffline.test.ts`](src/__tests__/unit/core-logic/hooks/useOffline.test.ts), [`useRole.test.ts`](src/__tests__/unit/core-logic/hooks/useRole.test.ts), [`useSync.test.ts`](src/__tests__/unit/core-logic/hooks/useSync.test.ts), dan [`useSessionTimeout.test.ts`](src/__tests__/unit/core-logic/hooks/useSessionTimeout.test.ts).

#### C. Offline dan PWA — 15 File, 738 Test Case

Kelompok ini menguji mekanisme kerja aplikasi saat tidak ada koneksi internet serta infrastruktur Progressive Web App. Pengujian dibagi menjadi dua subkelompok, yaitu Offline Core dan PWA Library.

Offline Core mencakup pengujian terhadap `ApiCache`, `ConflictRulesConfig`, `OfflineApiHelper`, `OfflineAuth`, `QueueManagerIdempotent`, `SmartConflictResolver`, dan `StorageManager`. PWA Library mencakup `ConflictResolver`, `IndexedDB`, `NetworkDetector`, `QueueManager`, `SyncManager`, `BackgroundSync`, `CacheStrategies`, dan `RegisterServiceWorker`.

Contoh skenario yang diuji pada kelompok ini meliputi `cacheFirst`, `networkFirst`, `staleWhileRevalidate`, enqueue item, FIFO processing, retry hingga batas tertentu, dan penandaan item selesai setelah sinkronisasi berhasil.

#### D. Utils dan Helpers — 21 File, 776 Test Case

Seluruh fungsi utilitas pendukung sistem diuji secara unit terhadap berbagai input, termasuk nilai batas, tipe data yang salah, dan string kosong. File yang diuji antara lain [`quiz-scoring.test.ts`](src/__tests__/unit/core-logic/utils/quiz-scoring.test.ts), [`format.test.ts`](src/__tests__/unit/core-logic/utils/format.test.ts), [`permissions.test.ts`](src/__tests__/unit/core-logic/utils/permissions.test.ts), [`normalize.test.ts`](src/__tests__/unit/core-logic/utils/normalize.test.ts), [`retry.test.ts`](src/__tests__/unit/core-logic/utils/retry.test.ts), [`error-logger.test.ts`](src/__tests__/unit/core-logic/utils/error-logger.test.ts), [`cache-manager.test.ts`](src/__tests__/unit/core-logic/utils/cache-manager.test.ts), dan [`idempotency.test.ts`](src/__tests__/unit/core-logic/utils/idempotency.test.ts).

#### E. Validasi / Schema — 8 File, 533 Test Case

Seluruh skema validasi input menggunakan Zod diuji dengan data valid dan berbagai variasi data tidak valid untuk memastikan aturan validasi diterapkan secara konsisten di seluruh formulir sistem. File yang diuji meliputi [`auth.schema.test.ts`](src/__tests__/unit/core-logic/validations/auth.schema.test.ts), [`kuis.schema.test.ts`](src/__tests__/unit/core-logic/validations/kuis.schema.test.ts), [`jadwal.schema.test.ts`](src/__tests__/unit/core-logic/validations/jadwal.schema.test.ts), [`nilai.schema.test.ts`](src/__tests__/unit/core-logic/validations/nilai.schema.test.ts), [`user.schema.test.ts`](src/__tests__/unit/core-logic/validations/user.schema.test.ts), [`offline-data.schema.test.ts`](src/__tests__/unit/core-logic/validations/offline-data.schema.test.ts), [`mata-kuliah.schema.test.ts`](src/__tests__/unit/core-logic/validations/mata-kuliah.schema.test.ts), dan [`validations.test.ts`](src/__tests__/unit/core-logic/validations/validations.test.ts).

#### F. Supabase — 5 File, 103 Test Case

Lapisan wrapper Supabase diuji untuk memastikan fungsi autentikasi, query database, dan penyimpanan file bekerja sesuai kontrak. File test pada kelompok ini adalah [`auth.test.ts`](src/__tests__/unit/core-logic/supabase/auth.test.ts), [`client.test.ts`](src/__tests__/unit/core-logic/supabase/client.test.ts), [`database.test.ts`](src/__tests__/unit/core-logic/supabase/database.test.ts), [`storage.test.ts`](src/__tests__/unit/core-logic/supabase/storage.test.ts), dan [`warmup.test.ts`](src/__tests__/unit/core-logic/supabase/warmup.test.ts).

#### G. Config dan Context — 11 File, 170 Test Case

Konfigurasi rute aplikasi, konfigurasi cache, konfigurasi offline, konfigurasi navigasi, dan React Context diuji untuk memastikan nilai default dan logika kondisional berjalan dengan benar. Kelompok ini mencakup file seperti [`app.config.test.ts`](src/__tests__/unit/core-logic/config/app.config.test.ts), [`cache.config.test.ts`](src/__tests__/unit/core-logic/config/cache.config.test.ts), [`navigation.config.test.ts`](src/__tests__/unit/core-logic/config/navigation.config.test.ts), [`offline.config.test.ts`](src/__tests__/unit/core-logic/config/offline.config.test.ts), [`routes.config.test.ts`](src/__tests__/unit/core-logic/config/routes.config.test.ts), [`AuthContext.test.ts`](src/__tests__/unit/core-logic/context/AuthContext.test.ts), [`NotificationContext.test.ts`](src/__tests__/unit/core-logic/context/NotificationContext.test.ts), dan [`ThemeContext.test.ts`](src/__tests__/unit/core-logic/context/ThemeContext.test.ts).

#### H. Halaman (Pages) — 33 File, 169 Test Case

Pengujian halaman mencakup kelompok halaman utama yang aktif pada router aplikasi sesuai peran pengguna. Setiap halaman diuji terhadap tampilan loading, rendering judul utama, tampilan data hasil mock API, dan penanganan kondisi error atau data kosong.

#### I. Komponen Fitur — 32 File, 227 Test Case

Komponen React yang mengimplementasikan logika bisnis utama diuji secara unit. Komponen ini mencakup fitur kuis, penilaian, kehadiran, logbook, bank soal, peminjaman, sinkronisasi, dan konflik data.

#### J. Komponen Bersama — 24 File, 294 Test Case

Komponen yang digunakan bersama di seluruh halaman aplikasi diuji secara unit, seperti komponen tabel, kalender, modal CRUD, komponen notifikasi, indikator jaringan, dan komponen penanganan error.

#### K. Provider — 6 File, 84 Test Case

Provider React yang membungkus seluruh aplikasi diuji untuk memastikan nilai context tersedia dan berubah dengan benar saat terjadi aksi.

#### L. Layout — 9 File, 30 Test Case

Komponen layout utama aplikasi diuji untuk memastikan struktur navigasi, sidebar, header, dan wrapper antarmuka berfungsi sesuai role dan kondisi aplikasi.

#### M. Services dan Lainnya — 4 File, 60 Test Case

Kelompok ini mencakup layanan pada layer presentasi dan helper yang dekat dengan antarmuka pengguna, seperti autentikasi berbasis Supabase dan helper penyimpanan file.

#### N. Integration Test — 8 File, 90 Test Case

Integration test menguji skenario lintas modul yang mencerminkan alur nyata penggunaan sistem oleh pengguna. File yang termasuk di dalamnya adalah [`auth-flow.test.tsx`](src/__tests__/integration/auth-flow.test.tsx), [`kuis-attempt-offline.test.tsx`](src/__tests__/integration/kuis-attempt-offline.test.tsx), [`kuis-builder-autosave.test.tsx`](src/__tests__/integration/kuis-builder-autosave.test.tsx), [`offline-sync-flow.test.tsx`](src/__tests__/integration/offline-sync-flow.test.tsx), [`conflict-resolution.test.tsx`](src/__tests__/integration/conflict-resolution.test.tsx), [`middleware-rbac.test.ts`](src/__tests__/integration/middleware-rbac.test.ts), [`role-access.test.tsx`](src/__tests__/integration/role-access.test.tsx), dan [`network-reconnect.test.tsx`](src/__tests__/integration/network-reconnect.test.tsx).

#### O. Legacy — 7 File, 11 Test Case

Selain test aktif utama, sistem masih mempertahankan sejumlah legacy test sebagai lapisan keamanan regresi tambahan. File-file tersebut dipisahkan dari struktur utama karena berasal dari fase pengembangan sebelumnya, tetapi tetap dijalankan bersama keseluruhan suite pengujian.

### 4.4.4 Hasil Eksekusi Pengujian

Pengujian dieksekusi secara keseluruhan menggunakan perintah [`npm run test`](package.json:16). Hasil eksekusi final adalah sebagai berikut.

| Metrik | Hasil |
|---|---|
| Total File Test | 238 |
| Total Test Case | 5.317 |
| Test Case Lulus (Pass) | 5.317 |
| Test Case Gagal (Fail) | 0 |
| Persentase Kelulusan | 100% |
| Durasi Eksekusi | 313,75 detik |

Seluruh **5.317 test case** pada **238 file test** berhasil dieksekusi dan memberikan hasil lulus tanpa ada satu pun kegagalan.

### 4.4.5 Pembahasan

Hasil pengujian white box menunjukkan bahwa logika inti sistem telah diverifikasi secara komprehensif. Dalam kaitannya dengan proposal penelitian, hasil ini penting karena mendukung tujuan pengembangan sistem informasi praktikum berbasis PWA yang efektif, fungsional, dan andal untuk digunakan pada proses praktikum.

Pertama, dari sisi **kelengkapan cakupan lapisan sistem**, pengujian mencakup 15 kelompok modul yang menjangkau core logic maupun presentation layer. Hal ini menunjukkan bahwa pengujian tidak dilakukan secara parsial, tetapi dirancang untuk memverifikasi perilaku sistem pada berbagai tingkat abstraksi.

Kedua, dari sisi **fitur offline sebagai keunggulan utama sistem**, pengujian pada kelompok Offline dan PWA serta integration test membuktikan bahwa aplikasi memang dirancang untuk tetap andal saat koneksi tidak stabil. Skenario seperti kehilangan koneksi saat mahasiswa mengerjakan kuis, penyimpanan jawaban ke IndexedDB, pembentukan antrian sinkronisasi, dan pemulihan data saat koneksi kembali tersedia telah diuji secara eksplisit.

Ketiga, dari sisi **kontrol akses berbasis peran**, integration test pada [`middleware-rbac.test.ts`](src/__tests__/integration/middleware-rbac.test.ts) dan [`role-access.test.tsx`](src/__tests__/integration/role-access.test.tsx) memperlihatkan bahwa pembatasan akses antar role telah diverifikasi. Hal ini penting karena aplikasi melibatkan beberapa jenis pengguna dengan hak akses berbeda.

Keempat, dari sisi **validasi input yang konsisten**, kelompok validasi memastikan bahwa data tidak valid dapat ditolak sebelum diproses lebih lanjut. Dengan demikian, integritas data tetap terjaga pada berbagai modul aplikasi.

Kelima, dari sisi **keandalan hasil akhir**, seluruh **5.317 test case** lulus tanpa satu pun kegagalan. Kondisi ini menunjukkan bahwa pada saat evaluasi akhir dilakukan, implementasi sistem berada dalam kondisi stabil pada ruang lingkup modul yang telah diuji secara otomatis.

Namun demikian, hasil pengujian white box tetap harus dipahami dalam ruang lingkup file dan modul yang memang telah dibuatkan test otomatis. Oleh karena itu, kesimpulan white box pada penelitian ini bersifat kuat untuk modul yang diuji, tetapi tetap terbuka untuk pengembangan lanjutan apabila cakupan pengujian ingin diperluas lebih jauh.

---

## 4.5 Hasil Pengujian Usability (SUS)

### 4.5.1 Metode SUS

Pengujian usability dilakukan menggunakan metode System Usability Scale (SUS). Metode ini dipilih karena sederhana, umum digunakan, dan mampu memberikan gambaran kuantitatif mengenai kemudahan penggunaan sistem.

Karakteristik metode SUS adalah sebagai berikut:
- Dikembangkan oleh John Brooke (1996).
- Terdiri dari 10 pernyataan dengan skala Likert 1–5.
- Pernyataan ganjil (1, 3, 5, 7, 9): skor = nilai − 1.
- Pernyataan genap (2, 4, 6, 8, 10): skor = 5 − nilai.
- Skor akhir = jumlah skor × 2,5 dengan rentang 0–100.

### 4.5.2 Data Responden

Pengujian usability melibatkan **46 responden** yang terdiri dari mahasiswa, dosen, laboran, dan admin. Komposisi responden ini menunjukkan bahwa evaluasi dilakukan pada seluruh kelompok pengguna utama yang benar-benar berinteraksi dengan sistem. Dominasi responden mahasiswa juga relevan dengan konteks aplikasi, karena mahasiswa merupakan pengguna terbanyak dalam aktivitas praktikum sehari-hari. Meskipun proposal penelitian menekankan dosen dan mahasiswa sebagai subjek utama evaluasi awal, keterlibatan laboran dan admin pada implementasi akhir memberikan gambaran tambahan mengenai penerimaan sistem pada role pendukung.

| No | Kategori (Role) | Jumlah Responden | Persentase |
|---|---|---:|---:|
| 1 | Mahasiswa | 38 | 82,6% |
| 2 | Dosen | 6 | 13,0% |
| 3 | Laboran | 1 | 2,2% |
| 4 | Admin | 1 | 2,2% |
|  | **Total** | **46** | **100%** |

Distribusi tersebut menunjukkan bahwa hasil evaluasi usability terutama merepresentasikan pengalaman pengguna mahasiswa, namun tetap mencakup pandangan dari role lain yang terlibat langsung dalam pengelolaan dan operasional sistem.

**[TEMPAT DIAGRAM 4.19 — Diagram Distribusi Responden SUS per Role]**

*Gambar 4.19. Diagram Distribusi Responden SUS per Role*

Berdasarkan Gambar 4.19, terlihat distribusi responden pengujian usability berdasarkan role pengguna, yaitu mahasiswa, dosen, laboran, dan admin. Diagram ini menunjukkan bahwa responden didominasi oleh mahasiswa sebagai pengguna utama sistem, namun tetap melibatkan role lain agar evaluasi bersifat lebih representatif. Gambar ini penting karena membantu pembaca memahami komposisi sampel yang menjadi dasar analisis usability pada penelitian ini.

### 4.5.3 Ringkasan Hasil Perhitungan Skor SUS

Perhitungan skor SUS dilakukan dengan mentransformasi jawaban asli responden menggunakan aturan standar, yaitu skor item ganjil diperoleh dari `nilai asli - 1`, sedangkan skor item genap diperoleh dari `5 - nilai asli`. Selanjutnya, seluruh skor per responden dijumlahkan dan dikalikan 2,5 untuk memperoleh skor SUS akhir dalam rentang 0–100.

Agar pembahasan pada Bab IV tetap ringkas, terstruktur, dan sesuai kaidah penulisan ilmiah, data mentah lengkap seluruh responden sebaiknya ditempatkan pada lampiran. Pada bagian hasil dan pembahasan, yang ditampilkan adalah tabel ringkasan hasil olahan, distribusi kategori skor, serta diagram interpretatif. Dengan pendekatan ini, Bab IV tetap fokus pada analisis, sedangkan lampiran menjadi tempat untuk menyajikan rekap data rinci per responden.

| Metrik | Nilai |
|---|---:|
| Jumlah responden | 46 |
| Total skor kumulatif | 1382 |
| Rata-rata skor SUS | 75,11 |
| Grade rata-rata | B |
| Adjective rating | Good |
| Acceptability | Acceptable |
| Skor tertinggi | 92,5 |
| Skor terendah | 55,0 |
| Rentang skor | 37,5 |

Berdasarkan hasil olahan tersebut, total skor kumulatif seluruh responden adalah **1382**, sehingga diperoleh **rata-rata skor SUS sebesar 75,11**. Nilai ini menjadi dasar untuk menilai tingkat usability sistem secara keseluruhan.

Untuk memperkuat pembahasan, distribusi hasil responden juga dapat dikelompokkan berdasarkan kategori skor akhir seperti pada tabel berikut.

| Kategori Hasil | Rentang Skor | Jumlah Responden | Persentase |
|---|---|---:|---:|
| Excellent | 80–100 | 9 | 19,6% |
| Good | 70–79 | 23 | 50,0% |
| OK | 60–69 | 9 | 19,6% |
| Poor | < 60 | 5 | 10,9% |
|  | **Total** | **46** | **100%** |

Tabel tersebut menunjukkan bahwa **32 dari 46 responden** atau sekitar **69,6%** memberikan penilaian pada kategori **Good** sampai **Excellent**. Sementara itu, **9 responden** atau **19,6%** berada pada kategori **OK**, dan **5 responden** atau **10,9%** berada pada kategori **Poor**. Distribusi ini menunjukkan bahwa mayoritas pengguna menilai aplikasi memiliki usability yang baik, meskipun masih terdapat sebagian kecil responden yang merasakan kendala pada penggunaan sistem.

**[TEMPAT DIAGRAM 4.20 — Diagram Distribusi Kategori Skor SUS]**

*Gambar 4.20. Diagram Distribusi Kategori Skor SUS*

Berdasarkan Gambar 4.20, terlihat persebaran hasil SUS ke dalam kategori Excellent, Good, OK, dan Poor. Diagram ini memperlihatkan bahwa mayoritas responden berada pada kategori Good, disusul oleh sebagian responden pada kategori Excellent. Gambar ini penting karena memberikan visualisasi yang lebih mudah dipahami mengenai kualitas usability sistem berdasarkan hasil penilaian responden.

Sebagai pelengkap pembahasan, tabel data olahan lengkap per responden sebaiknya dipindahkan ke lampiran dengan judul **Lampiran Rekapitulasi Perhitungan Skor SUS**. Dengan demikian, Bab IV menampilkan hasil analisis yang padat, sedangkan lampiran memuat detail skor masing-masing responden secara utuh.

### 4.5.4 Interpretasi Skor

Interpretasi skor SUS mengacu pada kategori berikut.

| Skor | Grade | Adjective |
|---|---|---|
| ≥ 90 | A+ | Best Imaginable |
| 80–89 | A | Excellent |
| 70–79 | B | Good |
| 60–69 | C | OK |
| < 60 | D/F | Poor |

Berdasarkan hasil perhitungan, skor SUS rata-rata sistem adalah **75,11**, sehingga termasuk dalam kategori **B (Good)**. Dari sisi **adjective rating**, sistem dinilai **Good**, sedangkan dari sisi **acceptability**, sistem berada pada kategori **Acceptable**. Dengan demikian, dapat disimpulkan bahwa aplikasi Sistem Praktikum PWA telah dapat diterima dengan baik oleh pengguna dari berbagai role, baik mahasiswa, dosen, laboran, maupun admin.

Interpretasi tersebut menunjukkan bahwa sistem telah memenuhi ekspektasi dasar pengguna dalam hal kemudahan belajar, kemudahan digunakan, dan konsistensi interaksi. Skor **75,11** berada di atas ambang umum penerimaan usability, sehingga hasil ini mendukung bahwa aplikasi tidak hanya berfungsi secara teknis, tetapi juga cukup nyaman digunakan dalam konteks operasional nyata.

Jika dilihat dari sebaran nilainya, terdapat responden dengan skor sangat tinggi hingga **92,5**, yang menunjukkan bahwa pada sebagian pengguna aplikasi sudah dirasakan sangat baik. Namun, adanya skor terendah **55,0** juga menandakan bahwa pengalaman penggunaan belum sepenuhnya seragam. Kondisi ini wajar pada aplikasi yang memiliki banyak fitur, banyak role, dan alur interaksi yang berbeda-beda. Oleh karena itu, hasil SUS pada penelitian ini tidak hanya menunjukkan tingkat penerimaan sistem, tetapi juga memberi arah perbaikan pada aspek-aspek pengalaman pengguna yang masih dapat disederhanakan.

**[TEMPAT DIAGRAM 4.21 — Diagram Posisi Skor Rata-rata SUS terhadap Kategori Interpretasi]**

*Gambar 4.21. Diagram Posisi Skor Rata-rata SUS terhadap Kategori Interpretasi*

Berdasarkan Gambar 4.21, posisi skor rata-rata SUS sebesar 75,11 berada pada kategori Good dalam rentang interpretasi SUS. Diagram ini membantu menunjukkan secara visual bahwa hasil usability sistem telah berada pada tingkat yang baik dan acceptable. Gambar ini penting karena memperkuat interpretasi hasil SUS secara kuantitatif sekaligus memudahkan pembaca dalam memahami posisi nilai akhir sistem.

---

## 4.6 Pembahasan

### 4.6.1 Pembahasan Perancangan Sistem

Berdasarkan hasil perancangan, sistem berhasil dimodelkan ke dalam 11 proses utama yang saling terintegrasi. DFD Level 1 menunjukkan bahwa aplikasi tidak hanya mendukung aktivitas akademik, tetapi juga kebutuhan operasional laboratorium dan sinkronisasi offline. Selain itu, ERD menunjukkan relasi data yang terstruktur dan mendukung konsistensi antarfitur. Arsitektur offline-first menjadi salah satu keunggulan rancangan karena disiapkan untuk menghadapi kondisi jaringan yang tidak selalu stabil. Jika dikaitkan dengan proposal, hasil perancangan ini telah menjawab kebutuhan analisis dan desain sistem informasi praktikum berbasis PWA yang berorientasi pada dosen dan mahasiswa, sambil tetap menyediakan dukungan operasional melalui role admin dan laboran.

Dari sisi metodologis, bagian perancangan ini dapat ditempatkan sebagai hasil dari tahap design and develop solution/artifact dalam model R&D Ellis dan Levy. Artinya, DFD, ERD, arsitektur sistem, pemetaan role, dan struktur modul bukan sekadar lampiran teknis, melainkan wujud konkret dari proses menerjemahkan masalah lapangan menjadi rancangan solusi yang dapat dibangun. Dengan framing seperti ini, keterkaitan antara proposal dan hasil penelitian menjadi lebih kuat karena tahap perancangan pada metode benar-benar terlihat jejaknya pada artefak yang dihasilkan.

Dari sisi konseptual, hasil perancangan menunjukkan bahwa kebutuhan sistem telah dipetakan secara cukup lengkap mulai dari proses autentikasi, pengelolaan data akademik, aktivitas pembelajaran, pengelolaan inventaris, hingga mekanisme sinkronisasi offline. Hal ini penting karena aplikasi yang dibangun tidak hanya melayani satu jenis aktivitas, melainkan menghubungkan proses akademik dan operasional laboratorium dalam satu platform. Dengan demikian, perancangan yang baik menjadi fondasi utama agar implementasi tidak berkembang secara parsial atau terputus antarfitur.

Keberadaan DFD dan ERD pada penelitian ini juga memperlihatkan bahwa proses perancangan tidak berhenti pada gambaran antarmuka, tetapi telah menyentuh alur data dan struktur relasi antarentitas. DFD membantu memperjelas bagaimana aktor seperti admin, dosen, mahasiswa, dan laboran berinteraksi dengan sistem, sedangkan ERD memperlihatkan bagaimana data seperti pengguna, kelas, jadwal praktikum, kuis, materi, logbook, inventaris, dan sinkronisasi saling berhubungan. Kesesuaian antara model konseptual dan implementasi aktual inilah yang membuat sistem lebih mudah dikembangkan, diuji, dan dipelihara.

Jika dikaitkan dengan proposal, perancangan ini juga tetap relevan dengan konteks pengelolaan praktikum pada 9 ruang laboratorium dan 1 ruang depo alat. Walaupun implementasi akhir aplikasi berkembang ke banyak modul tambahan, struktur rancangan utamanya masih bertumpu pada kebutuhan inti yang telah disebutkan sejak awal, yaitu pengelolaan jadwal, peminjaman alat, distribusi materi, logbook, penilaian, dan pengumuman. Dengan demikian, perluasan modul pada implementasi tidak menghilangkan fokus dasar rancangan, tetapi justru memperkuat integrasi antarproses yang dibutuhkan dalam operasional praktikum.

Arsitektur offline-first yang dirancang sejak awal juga merupakan keputusan yang sangat relevan dengan konteks praktikum. Dalam kondisi nyata, konektivitas internet tidak selalu stabil, terutama ketika pengguna mengakses sistem dari perangkat bergerak atau lokasi dengan kualitas jaringan yang berubah-ubah. Dengan adanya komponen seperti cache lokal, offline queue, serta mekanisme sinkronisasi ulang, sistem dirancang untuk tetap usable walaupun koneksi tidak selalu tersedia. Ini menunjukkan bahwa perancangan sistem tidak hanya berorientasi pada fungsi ideal saat online, tetapi juga mempertimbangkan kondisi penggunaan riil.

Secara akademik, hasil perancangan ini dapat dinilai kuat karena telah menunjukkan keterkaitan yang jelas antara kebutuhan masalah, model sistem, dan solusi teknis yang dipilih. Perancangan tidak hanya menggambarkan apa yang dibangun, tetapi juga mengapa struktur sistem dibangun dengan pendekatan tersebut. Oleh karena itu, bagian perancangan pada penelitian ini tidak sekadar menjadi formalitas dokumentasi, tetapi benar-benar berperan sebagai dasar logis bagi tahap implementasi dan evaluasi sistem.

### 4.6.2 Pembahasan Implementasi

Hasil implementasi menunjukkan bahwa proses utama dalam perancangan telah direalisasikan ke dalam fitur sistem. Aplikasi memiliki banyak halaman aktif yang tersebar ke dalam empat role pengguna, yaitu Admin, Dosen, Mahasiswa, dan Laboran. Fitur unggulan PWA seperti kuis offline, auto-save, background sync, offline queue, conflict resolution, dan indikator koneksi juga telah diimplementasikan sesuai kebutuhan sistem praktikum modern. Dari sudut pandang penelitian, implementasi yang paling relevan tetap berada pada alur dosen dan mahasiswa, karena kedua role tersebut secara langsung berkaitan dengan distribusi materi, pengelolaan praktikum, pelaksanaan tugas, logbook, penilaian, dan akses informasi praktikum.

Jika dibandingkan dengan proposal, implementasi akhir memang menunjukkan perluasan fitur. Namun, perluasan tersebut masih logis dalam kerangka Research and Development, karena proses pengembangan produk secara iteratif memang memungkinkan terjadinya penyempurnaan artefak berdasarkan kebutuhan lapangan. Dengan demikian, fitur-fitur yang belum tertulis eksplisit pada proposal dapat dijelaskan sebagai hasil pengembangan lanjutan yang tetap mendukung inti sistem informasi praktikum, bukan sebagai penyimpangan dari arah penelitian.

Apabila ditinjau dari sudut metode prototype iteratif, hasil implementasi ini juga dapat dibaca sebagai keluaran dari proses penyempurnaan artefak secara bertahap. Pada awalnya, kebutuhan inti sistem berpusat pada jadwal, peminjaman alat, materi, logbook, penilaian, dan pengumuman. Akan tetapi, ketika prototipe dikembangkan lebih jauh, kebutuhan integrasi antarfitur menjadi semakin jelas, sehingga muncul modul pendukung seperti notifikasi, bank soal, manajemen kelas, offline sync, dan pengelolaan inventaris yang lebih rinci. Dalam kerangka metodologis penelitian, perkembangan tersebut masih konsisten karena tidak mengubah tujuan utama, melainkan menyempurnakan artefak agar lebih sesuai dengan kondisi penggunaan riil.

Dari hasil implementasi yang telah dipaparkan pada subbab sebelumnya, terlihat bahwa sistem tidak berhenti pada fungsi dasar seperti login dan manajemen data, tetapi telah berkembang menjadi aplikasi operasional yang mendukung alur kerja setiap role secara spesifik. Admin berperan sebagai pengelola sistem, dosen berfokus pada pembelajaran dan evaluasi, mahasiswa berperan sebagai pelaksana kegiatan praktikum, dan laboran menangani operasional inventaris serta laboratorium. Pemisahan tanggung jawab ini menunjukkan bahwa implementasi sistem telah mengikuti prinsip role-based access control secara nyata, bukan hanya pada tingkat konsep.

Implementasi juga memperlihatkan bahwa aplikasi berhasil mengintegrasikan banyak modul ke dalam satu ekosistem yang saling terhubung. Sebagai contoh, data kelas dan mata kuliah terhubung dengan jadwal praktikum, jadwal terhubung dengan materi, kehadiran, dan penilaian, sementara proses pembelajaran terhubung dengan kuis, bank soal, dan hasil evaluasi. Pada saat yang sama, modul inventaris dan peminjaman tetap dapat berjalan berdampingan dengan modul akademik. Integrasi ini menjadi nilai lebih karena pengguna tidak perlu berpindah ke banyak sistem yang berbeda untuk menyelesaikan aktivitas yang saling berkaitan.

Jika dikaitkan dengan pendekatan user-centered design, implementasi ini juga menunjukkan bahwa sistem berusaha menyesuaikan rancangan dengan kebutuhan tiap kelompok pengguna. Dosen memperoleh akses yang kuat pada pengelolaan materi, evaluasi, dan monitoring mahasiswa. Mahasiswa memperoleh akses pada jadwal, materi, kuis, logbook, nilai, dan sinkronisasi offline sebagai fitur yang sangat dekat dengan pengalaman penggunaan harian. Sementara itu, admin dan laboran hadir untuk memastikan bahwa dukungan administratif dan operasional dapat berjalan sehingga kebutuhan pengguna utama tidak terhambat oleh masalah pengelolaan data atau sarana.

Dari sisi teknis, implementasi fitur PWA memberikan pembeda yang cukup kuat dibanding aplikasi web konvensional. Kemampuan untuk menyimpan data sementara secara lokal, menampilkan status jaringan, dan melakukan sinkronisasi ulang saat koneksi kembali tersedia membuat aplikasi lebih adaptif terhadap situasi lapangan. Hal ini sangat relevan dalam konteks sistem praktikum, di mana aktivitas pengguna dapat tetap berlangsung walaupun jaringan sedang tidak stabil.

Dalam kaitannya dengan proposal, bagian implementasi ini pada dasarnya telah memenuhi tujuan pengembangan sistem berbasis PWA yang usable dan fungsional. Meskipun versi final aplikasi lebih luas daripada gambaran awal proposal, fokus penelitian masih tetap dapat dipertahankan pada bagaimana sistem mendukung aktivitas dosen dan mahasiswa dalam proses praktikum. Dengan demikian, keberadaan role admin dan laboran pada implementasi akhir lebih tepat dipahami sebagai penguat ekosistem sistem, bukan sebagai pergeseran fokus penelitian.

Jika dilihat dari perspektif kualitas implementasi, hasil ini menunjukkan bahwa sistem telah berhasil menerjemahkan rancangan menjadi aplikasi yang benar-benar dapat digunakan. Implementasi tidak hanya lengkap secara jumlah fitur, tetapi juga mempertimbangkan pengalaman penggunaan lintas role dan lintas kondisi jaringan. Oleh karena itu, pembahasan implementasi dapat menegaskan bahwa penelitian ini menghasilkan produk perangkat lunak yang tidak hanya berjalan secara teknis, tetapi juga relevan secara fungsional terhadap kebutuhan pengguna.

### 4.6.3 Pembahasan Black Box

Hasil pengujian black box menunjukkan bahwa seluruh 45 skenario uji memperoleh status Pass dengan tingkat keberhasilan 100%. Hasil ini membuktikan bahwa fungsi-fungsi utama sistem telah berjalan sesuai spesifikasi fungsional. Kontrol akses berbasis role juga berjalan dengan baik, sehingga setiap pengguna hanya dapat mengakses halaman dan fitur yang sesuai dengan hak aksesnya. Selain itu, validasi input pada berbagai form mampu mencegah data yang tidak valid masuk ke dalam sistem. Dalam konteks proposal, hasil ini memperkuat bahwa sistem yang dikembangkan telah layak secara fungsional untuk mendukung kebutuhan dosen dan mahasiswa dalam kegiatan praktikum.

Dari sudut pandang evaluasi fungsional, hasil ini memperlihatkan bahwa perilaku sistem telah sesuai dengan yang diharapkan dari perspektif pengguna. Pengujian black box menekankan hasil keluaran tanpa mempersoalkan struktur kode di dalamnya, sehingga sangat tepat digunakan untuk membuktikan bahwa fitur-fitur utama memang bekerja ketika dioperasikan secara langsung. Keberhasilan seluruh skenario uji menunjukkan bahwa proses penting seperti autentikasi, navigasi berdasarkan role, pengelolaan data, dan validasi input telah berfungsi secara konsisten.

Hasil 100% pass juga penting karena sistem yang diuji memiliki kompleksitas role yang cukup tinggi. Setiap role memiliki halaman, hak akses, dan tujuan penggunaan yang berbeda. Dalam kondisi seperti ini, potensi kesalahan biasanya muncul pada perpindahan halaman, pembatasan akses, maupun penanganan data input yang berbeda-beda. Karena seluruh skenario utama lulus, maka dapat dikatakan bahwa implementasi sistem telah mampu menjaga konsistensi perilaku fungsional pada berbagai konteks penggunaan.

Selain membuktikan fungsi berjalan benar, pengujian black box juga mendukung argumentasi bahwa sistem layak digunakan dari sisi operasional. Bagi penelitian pengembangan sistem, ini penting karena produk yang dinilai berhasil bukan hanya produk yang selesai dibangun, tetapi juga produk yang dapat menjalankan kebutuhan pengguna sebagaimana yang dirancang. Dengan demikian, hasil black box pada penelitian ini memberi dasar kuat bahwa spesifikasi kebutuhan fungsional telah terealisasi dengan baik.

### 4.6.4 Pembahasan White Box

Pengujian white box menunjukkan hasil yang sangat baik dari sisi kestabilan fungsi. Eksekusi akhir yang dijalankan melalui [`npm run test`](package.json:16) menghasilkan **238 file test** dan **5.317 test case** dengan seluruh status **passed**. Hasil ini mengindikasikan bahwa logika inti pada modul-modul penting, termasuk autentikasi, pengelolaan data, kontrol akses, pengujian komponen, serta sinkronisasi offline, telah bekerja dengan benar pada ruang lingkup modul yang diuji.

Dibanding angka lama yang pernah digunakan pada draft sebelumnya, data pengujian terbaru menunjukkan peningkatan yang signifikan baik pada jumlah file test maupun jumlah test case. Peningkatan ini memperkuat tingkat kepercayaan terhadap implementasi sistem karena semakin banyak unit program dan alur integrasi yang telah diverifikasi secara otomatis.

Jika ditinjau lebih jauh, kekuatan hasil white box pada penelitian ini tidak hanya terletak pada jumlah test yang besar, tetapi juga pada persebaran pengujiannya yang mencakup banyak lapisan sistem. Pengujian tidak hanya dilakukan pada fungsi utilitas sederhana, melainkan juga pada API layer, hooks, validasi schema, komponen antarmuka, provider, modul offline, hingga skenario integration test. Dengan cakupan seperti ini, hasil white box memberikan keyakinan yang lebih kuat bahwa kestabilan sistem tidak bergantung pada satu bagian tertentu saja, tetapi didukung oleh verifikasi pada berbagai lapisan arsitektur.

Keberadaan pengujian pada fitur offline dan PWA juga menjadi poin yang sangat penting. Pada banyak aplikasi, fitur offline sering kali menjadi bagian yang sulit diverifikasi karena melibatkan cache, penyimpanan lokal, queue, konflik data, dan sinkronisasi ulang. Dalam penelitian ini, justru aspek tersebut memperoleh perhatian pengujian yang besar. Artinya, keunggulan sistem sebagai aplikasi praktikum berbasis PWA tidak hanya diklaim pada tataran implementasi, tetapi juga didukung oleh verifikasi logika yang sistematis.

Dalam kaitannya dengan proposal, posisi white box perlu dipahami sebagai penguatan kualitas implementasi, bukan sebagai satu-satunya dasar evaluasi penelitian. Proposal lebih menekankan evaluasi fungsionalitas dan usability, sedangkan pengujian white box pada hasil akhir ini menambah kedalaman verifikasi dari sisi logika internal program. Oleh karena itu, keberadaan white box pada penelitian ini justru memperkaya kualitas pembahasan karena menunjukkan bahwa sistem tidak hanya diuji dari sudut pandang pengguna, tetapi juga dari sudut pandang kestabilan struktur internal perangkat lunak.

Meskipun demikian, pembahasan white box dalam penelitian ini tetap harus dipahami berdasarkan cakupan pengujian yang tersedia. Artinya, kekuatan kesimpulan white box terletak pada banyaknya modul penting yang telah diuji dan tingkat kelulusan 100%, bukan semata-mata pada klaim bahwa seluruh kemungkinan jalur kode telah terverifikasi. Dengan demikian, hasil white box pada penelitian ini dapat dinilai kuat untuk mendukung kualitas implementasi sistem, sekaligus tetap memberi ruang bagi perluasan pengujian pada penelitian atau pengembangan berikutnya.

Secara metodologis, hasil white box ini melengkapi black box dengan sudut pandang yang berbeda. Jika black box membuktikan bahwa fitur bekerja benar dari sisi keluaran, maka white box membuktikan bahwa struktur logika internal pada modul yang diuji juga berjalan stabil. Kombinasi keduanya menjadikan evaluasi sistem lebih komprehensif, karena kualitas aplikasi dinilai baik dari sisi perilaku eksternal maupun dari sisi ketahanan logika internalnya.

### 4.6.5 Pembahasan SUS

Hasil pengujian usability menggunakan metode SUS menunjukkan bahwa sistem memperoleh **skor rata-rata 75,11**. Nilai ini menempatkan aplikasi pada kategori **B (Good)** dan menunjukkan bahwa secara umum pengguna menilai sistem mudah dipahami, cukup konsisten, dan dapat digunakan dengan baik dalam aktivitas praktikum. Dalam konteks penelitian sistem informasi, nilai ini dapat dipandang sebagai indikasi bahwa aplikasi telah mampu memenuhi harapan pengguna pada aspek kemudahan penggunaan, meskipun masih terdapat ruang peningkatan untuk mencapai tingkat pengalaman pengguna yang lebih tinggi. Jika dihubungkan dengan proposal, hasil ini mendukung tujuan evaluasi efektivitas sistem dari aspek usability.

Dari sisi metodologis, hasil SUS juga menjadi bagian yang penting karena proposal tidak hanya menekankan pengembangan produk, tetapi juga evaluasi awal terhadap kemudahan penggunaan pada kelompok pengguna terbatas. Oleh sebab itu, skor SUS pada penelitian ini tidak hanya berfungsi sebagai data tambahan, melainkan sebagai salah satu bukti bahwa pendekatan yang berorientasi pada pengguna benar-benar diikuti hingga tahap evaluasi hasil. Dengan adanya pengukuran ini, penelitian tidak berhenti pada klaim bahwa sistem telah selesai dibangun, tetapi juga memperlihatkan bagaimana sistem tersebut diterima oleh pengguna nyata.

Jika dikaitkan dengan karakteristik aplikasi, nilai tersebut cukup relevan karena sistem tidak hanya menyediakan fungsi dasar informasi, tetapi juga memfasilitasi proses yang relatif kompleks, seperti autentikasi multi-role, pengelolaan jadwal, akses materi, pengerjaan kuis, logbook digital, peminjaman alat, notifikasi, serta sinkronisasi offline. Meskipun kompleksitas fitur cukup tinggi, pengguna tetap memberikan penilaian usability yang berada pada tingkat baik, sehingga dapat dikatakan bahwa antarmuka dan alur interaksi sistem telah cukup berhasil mendukung kebutuhan pengguna.

Berdasarkan distribusi kategori hasil, sebanyak **9 responden (19,6%)** berada pada kategori **Excellent**, **23 responden (50,0%)** berada pada kategori **Good**, **9 responden (19,6%)** berada pada kategori **OK**, dan **5 responden (10,9%)** berada pada kategori **Poor**. Data ini penting karena menunjukkan bahwa kelompok penilaian terbesar berada pada kategori **Good**, dan jika kategori **Good** digabung dengan **Excellent**, maka terdapat **32 responden (69,6%)** yang memberikan penilaian positif terhadap usability sistem. Temuan ini memperkuat bahwa mayoritas pengguna sudah merasa sistem dapat digunakan dengan baik.

Dominasi kategori **Good** menunjukkan bahwa aplikasi telah berhasil mencapai tingkat kenyamanan penggunaan yang stabil pada mayoritas responden. Artinya, sebagian besar pengguna tidak mengalami kesulitan besar dalam memahami struktur menu, mengenali fungsi utama, maupun menyelesaikan aktivitas inti di dalam aplikasi. Kondisi ini penting karena usability yang baik tidak hanya dilihat dari tidak adanya error, tetapi juga dari seberapa mudah pengguna dapat mencapai tujuan mereka dengan usaha mental yang wajar.

Komposisi responden yang didominasi mahasiswa juga memperkuat interpretasi bahwa hasil SUS terutama merepresentasikan pengalaman pengguna utama sistem. Hal ini masuk akal karena mahasiswa merupakan aktor yang paling sering berinteraksi dengan fitur inti, seperti melihat jadwal, mengakses materi, mengerjakan kuis, mencatat logbook, memantau nilai, dan menggunakan mekanisme sinkronisasi offline. Di sisi lain, keterlibatan dosen, laboran, dan admin tetap penting karena menunjukkan bahwa usability sistem juga diterima oleh role yang memiliki kebutuhan operasional berbeda. Dengan demikian, hasil SUS tidak hanya menunjukkan penerimaan pada satu jenis pengguna, tetapi juga menggambarkan penerimaan lintas role.

Dari perspektif penelitian, dominasi responden mahasiswa juga memberi makna metodologis yang kuat. Karena mahasiswa adalah pengguna dengan intensitas interaksi tertinggi, maka penilaian dari kelompok ini sangat relevan untuk menilai usability aktual aplikasi dalam situasi penggunaan sehari-hari. Dengan kata lain, skor SUS yang diperoleh tidak sekadar mencerminkan penilaian pengguna sesekali, tetapi lebih dekat pada pengalaman penggunaan nyata pada kelompok pengguna utama. Hal ini sekaligus membuat hasil evaluasi tetap selaras dengan proposal yang menempatkan dosen dan mahasiswa sebagai fokus utama pengguna sistem.

Nilai rata-rata **75,11** juga perlu dibaca bersama dengan rentang skor yang muncul pada data aktual. Adanya skor tertinggi sebesar **92,5** menunjukkan bahwa pada sebagian responden sistem telah mampu memberikan pengalaman penggunaan yang sangat baik. Sebaliknya, skor terendah sebesar **55,0** menunjukkan bahwa masih ada pengguna yang merasakan hambatan tertentu saat menggunakan sistem. Variasi ini mengindikasikan bahwa usability belum sepenuhnya seragam untuk seluruh pengguna, yang kemungkinan dipengaruhi oleh perbedaan tingkat familiaritas teknologi, frekuensi penggunaan fitur, dan kompleksitas alur pada beberapa modul.

Sebaran skor tersebut menunjukkan bahwa meskipun sistem telah diterima dengan baik secara umum, pengalaman pengguna masih bersifat heterogen. Sebagian pengguna dapat beradaptasi dengan cepat terhadap struktur aplikasi, sedangkan sebagian lainnya mungkin memerlukan waktu belajar lebih lama, khususnya pada fitur yang melibatkan beberapa langkah atau istilah teknis tertentu. Dengan demikian, pembahasan SUS tidak cukup hanya berhenti pada rata-rata, tetapi juga harus memperhatikan variasi skor agar interpretasi hasil menjadi lebih realistis dan akademis.

Dari sudut pandang hasil penelitian, temuan ini bersifat realistis. Sistem yang diuji bukan aplikasi sederhana satu fungsi, melainkan aplikasi praktikum berbasis PWA dengan banyak role, banyak halaman, dan banyak skenario penggunaan. Oleh karena itu, perolehan skor pada kategori **Good** dapat dipandang sebagai hasil yang kuat, karena sistem tetap memperoleh tingkat penerimaan yang baik walaupun mempunyai beban fungsi yang relatif kompleks.

Selain itu, hasil SUS juga konsisten dengan karakter sistem yang menuntut pengguna untuk berinteraksi dengan data akademik dan operasional secara bersamaan. Pada satu sisi, pengguna harus memahami fungsi umum seperti login, navigasi, dan profil. Pada sisi lain, pengguna juga harus berinteraksi dengan fitur yang lebih spesifik seperti pengerjaan kuis, sinkronisasi offline, logbook digital, hingga peminjaman alat. Jika sistem dengan kompleksitas seperti ini tetap memperoleh skor pada kategori **Good**, maka hal tersebut menunjukkan bahwa rancangan antarmuka yang diterapkan sudah cukup efektif dalam menjaga kemudahan penggunaan.

Walaupun skor 75,11 sudah termasuk baik dan acceptable, hasil ini juga menunjukkan bahwa masih terdapat ruang perbaikan untuk mendorong sistem menuju kategori excellent. Perbaikan tersebut dapat diarahkan pada penyederhanaan alur pada fitur yang kompleks, peningkatan konsistensi istilah antarmuka, optimalisasi tampilan mobile, penajaman umpan balik visual saat proses sinkronisasi berlangsung, serta pengurangan beban interaksi pada proses-proses yang membutuhkan banyak langkah.

Secara lebih rinci, area penguatan usability dapat diarahkan pada beberapa aspek. Pertama, konsistensi penamaan menu dan istilah perlu dijaga agar pengguna tidak perlu menafsirkan ulang fungsi halaman yang berbeda tetapi memiliki tujuan serupa. Kedua, alur tugas yang panjang dapat dipersingkat dengan memperjelas hierarki navigasi dan menyediakan umpan balik yang lebih tegas setelah aksi penting dilakukan. Ketiga, pada fitur offline dan sinkronisasi, sistem dapat memberikan indikator status yang lebih komunikatif agar pengguna memahami apakah data telah tersimpan lokal, sedang menunggu sinkronisasi, atau sudah berhasil dikirim ke server.

Dari sisi akademik, hasil SUS ini melengkapi dua bentuk pengujian sebelumnya. Pengujian black box menunjukkan bahwa fungsi sistem berjalan sesuai kebutuhan, sedangkan pengujian white box menunjukkan bahwa logika internal sistem telah diverifikasi secara otomatis melalui cakupan test yang luas. Hasil SUS kemudian memperlihatkan bahwa keberhasilan teknis tersebut juga diikuti oleh penerimaan pengguna terhadap antarmuka dan pengalaman penggunaan sistem. Dengan demikian, ketiga hasil pengujian tersebut saling menguatkan dan membentuk dasar evaluasi yang komprehensif.

Secara keseluruhan, hasil SUS menguatkan temuan dari pengujian black box dan white box. Jika black box menunjukkan bahwa fungsi sistem berjalan sesuai kebutuhan, dan white box menunjukkan bahwa logika internal sistem telah teruji dengan baik, maka SUS membuktikan bahwa sistem tersebut juga dapat diterima dengan baik dari sisi pengalaman pengguna. Kombinasi ketiga hasil ini memberikan dasar yang kuat bahwa Sistem Praktikum PWA tidak hanya benar secara fungsional dan teknis, tetapi juga layak digunakan dalam konteks nyata.

### 4.6.6 Kelebihan Sistem

Beberapa kelebihan sistem yang berhasil diidentifikasi adalah sebagai berikut:
- offline-first, sehingga aplikasi tetap dapat digunakan saat koneksi internet terbatas;
- mendukung multi-role dengan hak akses berbeda melalui RBAC;
- logbook digital menggantikan pencatatan manual;
- auto-save mencegah kehilangan data kuis saat koneksi terputus;
- mendukung akses dari laptop maupun perangkat mobile;
- bank soal memungkinkan soal digunakan ulang secara efisien;
- memiliki mekanisme sinkronisasi dan resolusi konflik data untuk penggunaan lintas kondisi jaringan.

### 4.6.7 Keterbatasan Sistem

Di samping kelebihannya, sistem masih memiliki beberapa keterbatasan, yaitu:
- background sync penuh hanya berjalan optimal pada browser tertentu, sedangkan browser lain menggunakan fallback;
- beberapa fitur lanjutan seperti analytics tidak menjadi fokus utama dalam ruang lingkup penelitian ini;
- terdapat sejumlah fitur implementatif pada aplikasi akhir yang belum dirumuskan secara eksplisit pada proposal awal, sehingga pada penulisan skripsi perlu dijelaskan sebagai hasil pengembangan lanjutan agar tidak menimbulkan kesan ketidakkonsistenan ruang lingkup;
- evaluasi pengguna pada proposal awal lebih menekankan dosen dan mahasiswa, sehingga pembacaan hasil untuk role admin dan laboran perlu diposisikan sebagai pelengkap, bukan pusat evaluasi;
- pengujian white box yang sangat baik tetap merepresentasikan modul yang telah dibuatkan test otomatis, sehingga pengembangan berikutnya masih dapat memperluas cakupan pengujian.

---

## 4.7 Panduan Detail Penempatan Gambar pada Bab IV

Bagian ini disediakan agar penempatan gambar pada naskah skripsi lebih sistematis, konsisten, dan mudah dipetakan terhadap isi pembahasan. Setiap gambar sebaiknya diberi nomor urut sesuai urutan kemunculannya pada naskah, dilengkapi caption di bawah gambar, serta dirujuk kembali pada paragraf pembahasan yang relevan. Pada saat finalisasi naskah, bagian ini dapat dipertahankan sebagai panduan kerja internal atau dihapus dari versi akhir skripsi apabila kampus menghendaki Bab IV hanya berisi hasil dan pembahasan inti.

### 4.7.1 Aturan Umum Penempatan Gambar

Agar tampilan Bab IV rapi dan sesuai kaidah penulisan ilmiah, penempatan gambar sebaiknya mengikuti ketentuan berikut.
- Setiap gambar diletakkan **setelah paragraf yang pertama kali membahas gambar tersebut**.
- Caption sebaiknya menggunakan format: **Gambar 4.x. Judul Gambar**.
- Setelah gambar, tambahkan 1 paragraf singkat yang menjelaskan **apa yang terlihat pada gambar** dan **mengapa gambar tersebut penting**.
- Untuk screenshot halaman, usahakan menampilkan **bagian header halaman, judul halaman, komponen utama, dan data contoh** agar tampak jelas bahwa fitur benar-benar terimplementasi.
- Untuk diagram, gunakan resolusi yang cukup tinggi agar teks pada entitas, proses, atribut, dan relasi tetap terbaca saat dicetak.
- Jika 1 fitur memiliki tampilan desktop dan mobile, cukup pilih tampilan yang paling representatif, kecuali kampus Anda memang meminta keduanya.
- Bila satu halaman memiliki terlalu banyak elemen, Anda dapat melakukan crop secukupnya, tetapi jangan sampai menghilangkan identitas halaman seperti judul, menu, atau komponen inti.

### 4.7.2 Daftar Detail Gambar yang Perlu Dimasukkan

| Nomor Gambar | Diletakkan pada Bagian | Isi Gambar yang Disarankan | Elemen yang Harus Tampak | Contoh Caption |
|---|---|---|---|---|
| Gambar 4.1 | Subbab 4.1.1 | Diagram DFD Level 1 sistem | entitas eksternal, proses utama, data store, dan aliran data | Gambar 4.1. Data Flow Diagram Level 1 Sistem Praktikum PWA |
| Gambar 4.2 | Subbab 4.1.2 | Diagram DFD Level 2 | rincian subproses, data store, dan alur data internal | Gambar 4.2. Data Flow Diagram Level 2 Sistem Praktikum PWA |
| Gambar 4.3 | Subbab 4.1.3 | ERD sistem | nama tabel, atribut penting, primary key, foreign key, dan relasi | Gambar 4.3. Entity Relationship Diagram Sistem Praktikum PWA |
| Gambar 4.4 | Subbab 4.2.1 | Screenshot halaman login | form email, password, tombol login, identitas aplikasi | Gambar 4.4. Implementasi Halaman Login |
| Gambar 4.5 | Subbab 4.2.1 | Screenshot halaman register | field registrasi utama dan tombol daftar | Gambar 4.5. Implementasi Halaman Register |
| Gambar 4.6 | Subbab 4.2.1 | Screenshot halaman lupa password | field email dan tombol reset password | Gambar 4.6. Implementasi Halaman Lupa Password |
| Gambar 4.7 | Subbab 4.2.2 | Screenshot dashboard admin | ringkasan sistem, kartu statistik, menu utama admin | Gambar 4.7. Implementasi Dashboard Admin |
| Gambar 4.8 | Subbab 4.2.2 | Screenshot halaman manajemen pengguna admin | tabel user, tombol tambah, edit, atau filter | Gambar 4.8. Implementasi Halaman Manajemen Pengguna Admin |
| Gambar 4.9 | Subbab 4.2.3 | Screenshot dashboard dosen | ringkasan aktivitas dosen, shortcut menu, informasi kelas atau kuis | Gambar 4.9. Implementasi Dashboard Dosen |
| Gambar 4.10 | Subbab 4.2.3 | Screenshot halaman kuis dosen | daftar kuis, tombol buat kuis, status kuis, atau builder kuis | Gambar 4.10. Implementasi Fitur Kuis Dosen |
| Gambar 4.11 | Subbab 4.2.4 | Screenshot dashboard mahasiswa | ringkasan jadwal, kuis, materi, atau notifikasi mahasiswa | Gambar 4.11. Implementasi Dashboard Mahasiswa |
| Gambar 4.12 | Subbab 4.2.4 | Screenshot halaman kuis mahasiswa | daftar kuis atau halaman pengerjaan kuis | Gambar 4.12. Implementasi Fitur Kuis Mahasiswa |
| Gambar 4.13 | Subbab 4.2.4 | Screenshot halaman offline sync mahasiswa | daftar antrian sync, status sinkronisasi, tombol retry/sync | Gambar 4.13. Implementasi Halaman Offline Sync Mahasiswa |
| Gambar 4.14 | Subbab 4.2.5 | Screenshot dashboard laboran | ringkasan inventaris, peminjaman, dan status laboratorium | Gambar 4.14. Implementasi Dashboard Laboran |
| Gambar 4.15 | Subbab 4.2.5 | Screenshot halaman inventaris laboran | tabel inventaris, stok, kondisi barang, tombol aksi | Gambar 4.15. Implementasi Halaman Inventaris Laboran |
| Gambar 4.16 | Subbab 4.2.6 | Screenshot indikator online/offline | badge status jaringan atau notifikasi koneksi | Gambar 4.16. Implementasi Indikator Status Jaringan |
| Gambar 4.17 | Subbab 4.2.6 | Screenshot prompt instalasi PWA | pop-up atau tombol install aplikasi | Gambar 4.17. Implementasi Prompt Install PWA |
| Gambar 4.18 | Subbab 4.2.6 | Screenshot kuis offline atau offline sync | indikator offline, jawaban tersimpan lokal, atau proses sinkronisasi | Gambar 4.18. Implementasi Kuis Offline dan Sinkronisasi Data |


## Catatan Revisi Bab IV

Bab IV ini telah disesuaikan dengan kondisi aplikasi saat ini berdasarkan struktur halaman pada [`src/pages`](src/pages), konfigurasi rute pada [`src/routes/index.tsx`](src/routes/index.tsx:101) dan [`src/routes/routes.config.ts`](src/routes/routes.config.ts:6), serta data pengujian white box terbaru pada [`docs/TEST-REPORT.md`](docs/TEST-REPORT.md).
