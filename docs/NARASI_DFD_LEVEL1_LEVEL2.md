# Narasi Lengkap Data Flow Diagram (DFD)
## Sistem Informasi Praktikum PWA

Dokumen ini berisi narasi lengkap, rinci, dan sistematis untuk menjelaskan seluruh Data Flow Diagram yang disajikan pada [`docs/DFD.md`](docs/DFD.md). Narasi disusun agar dapat langsung digunakan sebagai bahan penjelasan pada bab analisis, hasil, maupun pembahasan skripsi. Seluruh uraian di bawah mengikuti struktur proses, entitas eksternal, aliran data, dan data store yang telah ditetapkan pada dokumen DFD utama.

---

# 1. Narasi Umum DFD Level 1

DFD Level 1 pada sistem informasi praktikum berbasis Progressive Web App menggambarkan aliran data utama yang terjadi antara para aktor eksternal dengan empat proses inti sistem. Aktor yang terlibat terdiri atas mahasiswa, dosen, laboran, dan admin. Keempat aktor tersebut berinteraksi dengan sistem sesuai tugas, kewenangan, dan kebutuhan informasinya masing-masing. Pada level ini, sistem tidak dijelaskan sebagai kumpulan halaman aplikasi, melainkan sebagai kumpulan proses besar yang mewakili fungsi utama pengelolaan layanan praktikum.

Empat proses utama pada DFD Level 1 terdiri atas [`1.0 Manajemen Akun dan Akses`](docs/DFD.md:46), [`2.0 Manajemen Akademik Praktikum`](docs/DFD.md:47), [`3.0 Operasional dan Layanan Laboratorium`](docs/DFD.md:48), dan [`4.0 Layanan PWA dan Sinkronisasi Offline`](docs/DFD.md:49). Keempat proses tersebut saling melengkapi untuk memastikan bahwa aktivitas akademik, administrasi, operasional laboratorium, dan karakteristik aplikasi PWA dapat berjalan secara terpadu.

Selain proses utama, terdapat empat data store penting yang menopang keseluruhan sistem, yaitu [`D1 Database Utama`](docs/DFD.md:52), [`D2 Cache Lokal`](docs/DFD.md:53), [`D3 Offline Queue`](docs/DFD.md:54), dan [`D4 Storage File`](docs/DFD.md:55). Sistem juga terhubung dengan layanan eksternal [`Supabase/Auth Service`](docs/DFD.md:56) yang berfungsi mendukung autentikasi serta sinkronisasi data.

Secara konseptual, alur kerja Level 1 memperlihatkan bahwa setiap data yang dimasukkan oleh pengguna tidak langsung berhenti pada satu proses, melainkan diolah, diverifikasi, disimpan, lalu disajikan kembali dalam bentuk informasi yang relevan. Dengan demikian, DFD Level 1 menunjukkan gambaran menyeluruh mengenai bagaimana sistem menerima input, memproses data, menyimpan hasilnya, dan mendistribusikan informasi kembali kepada pengguna.

---

# 2. Narasi Proses Level 1

## 2.1 Narasi Proses 1.0 — Manajemen Akun dan Akses

Proses [`1.0 Manajemen Akun dan Akses`](docs/DFD.md:46) merupakan gerbang utama yang mengatur siapa yang dapat masuk ke dalam sistem dan hak apa saja yang dimiliki setelah berhasil masuk. Mahasiswa, dosen, laboran, dan admin mengirimkan data login, data akun, atau kebutuhan akses ke proses ini. Sistem kemudian mengolah data tersebut untuk memastikan bahwa pengguna yang mengakses aplikasi benar-benar sah dan memiliki peran yang sesuai.

Pada tahap awal, pengguna memberikan identitas masuk berupa email dan password. Data tersebut diteruskan oleh sistem ke layanan autentikasi eksternal. Jika hasil verifikasi menunjukkan bahwa kredensial valid, maka proses dilanjutkan dengan pengambilan data akun, role, dan session dari [`D1 Database Utama`](docs/DFD.md:52). Data role ini sangat penting karena menjadi dasar penentuan dashboard, menu, dan otorisasi tindakan di dalam aplikasi.

Selanjutnya, sistem membentuk session aktif bagi pengguna. Session ini menandakan bahwa pengguna telah berhasil masuk dan dapat mengakses fitur sesuai perannya. Mahasiswa akan memperoleh akses ke layanan akademik seperti jadwal, materi, kuis, presensi, dan nilai. Dosen akan diarahkan ke area pengelolaan pembelajaran dan penilaian. Laboran memperoleh akses ke operasional laboratorium, sedangkan admin memperoleh kontrol terhadap data master dan manajemen pengguna.

Jika terjadi kegagalan autentikasi, maka proses tidak dilanjutkan dan sistem mengembalikan pesan kegagalan login kepada pengguna. Dengan demikian, proses ini bukan hanya berfungsi sebagai pintu masuk, tetapi juga sebagai mekanisme kontrol keamanan dan pengaturan hak akses.

## 2.2 Narasi Proses 2.0 — Manajemen Akademik Praktikum

Proses [`2.0 Manajemen Akademik Praktikum`](docs/DFD.md:47) mengelola seluruh aktivitas inti pembelajaran praktikum. Dalam proses ini, mahasiswa berinteraksi untuk memperoleh jadwal, materi, kuis, presensi, dan nilai. Dosen menggunakan proses ini untuk mengatur jadwal, materi, kuis, serta penilaian. Laboran berkepentingan terhadap jadwal laboratorium, sedangkan admin menangani data relasi akademik seperti kelas, mata kuliah, dan assignment.

Data akademik yang diolah pada proses ini tersimpan pada [`D1 Database Utama`](docs/DFD.md:52), sementara bagian tertentu disalin ke [`D2 Cache Lokal`](docs/DFD.md:53) agar tetap bisa diakses saat koneksi tidak stabil atau ketika aplikasi berjalan dalam konteks PWA. Untuk materi pembelajaran yang berbentuk berkas, proses ini juga berhubungan dengan [`D4 Storage File`](docs/DFD.md:55).

Secara umum, proses ini dimulai ketika admin membentuk struktur akademik berupa kelas, mata kuliah, dan relasi dosen maupun mahasiswa. Setelah struktur tersedia, dosen dapat menyusun jadwal praktikum, mengunggah materi, membuat kuis, serta memberikan penilaian. Mahasiswa kemudian menerima hasil pengelolaan tersebut dalam bentuk informasi jadwal, daftar materi, soal kuis, presensi, dan nilai akhir.

Dengan demikian, proses [`2.0`](docs/DFD.md:47) menjadi pusat aliran data pembelajaran praktikum. Semua data yang berhubungan langsung dengan kegiatan belajar mengajar diproses di sini, baik pada saat pembuatan, perubahan, penyimpanan, maupun penyajian kembali kepada pengguna.

## 2.3 Narasi Proses 3.0 — Operasional dan Layanan Laboratorium

Proses [`3.0 Operasional dan Layanan Laboratorium`](docs/DFD.md:48) memfasilitasi layanan yang bersifat operasional, administratif, dan pendukung aktivitas praktikum di luar inti pembelajaran. Mahasiswa memanfaatkan proses ini untuk mengisi logbook dan menerima pengumuman. Dosen berinteraksi untuk meninjau logbook mahasiswa serta mengajukan peminjaman alat. Laboran berperan mengelola inventaris, memproses persetujuan, dan menghasilkan laporan. Admin menggunakan proses ini untuk melakukan monitoring dan mengelola pengumuman.

Seluruh data operasional seperti logbook, inventaris, peminjaman, pengumuman, dan notifikasi disimpan pada [`D1 Database Utama`](docs/DFD.md:52). Sebagian informasi penting juga dapat ditempatkan pada [`D2 Cache Lokal`](docs/DFD.md:53) agar tetap dapat dibaca dengan cepat dan tersedia saat aplikasi bekerja dalam kondisi terbatas.

Alur kerja proses ini menggambarkan bahwa sistem tidak hanya berfungsi untuk pembelajaran, tetapi juga untuk memastikan kegiatan laboratorium berjalan tertib. Melalui proses ini, aktivitas harian mahasiswa dapat direkam, penggunaan alat dapat dipertanggungjawabkan, dan informasi penting dapat didistribusikan secara tepat sasaran.

## 2.4 Narasi Proses 4.0 — Layanan PWA dan Sinkronisasi Offline

Proses [`4.0 Layanan PWA dan Sinkronisasi Offline`](docs/DFD.md:49) merupakan ciri khas dari sistem berbasis Progressive Web App. Proses ini memastikan aplikasi tetap dapat digunakan walaupun koneksi internet tidak selalu tersedia. Mahasiswa, dosen, laboran, dan admin semuanya dapat memanfaatkan kemampuan offline sesuai fitur yang mereka akses.

Pada proses ini, sistem memanfaatkan [`D2 Cache Lokal`](docs/DFD.md:53) untuk menyimpan data yang masih bisa dibaca saat offline, serta [`D3 Offline Queue`](docs/DFD.md:54) untuk menampung operasi-operasi tulis yang belum dapat langsung dikirim ke server. Ketika koneksi tersedia kembali, sistem akan melakukan sinkronisasi dengan [`D1 Database Utama`](docs/DFD.md:52) dan layanan eksternal [`Supabase/Auth Service`](docs/DFD.md:56).

Secara alur, ketika pengguna mengakses data saat offline, sistem pertama-tama akan memeriksa cache lokal. Jika pengguna melakukan perubahan data pada kondisi offline, perubahan tersebut tidak dibuang, melainkan dimasukkan ke dalam antrean sinkronisasi. Setelah jaringan kembali normal, sistem memproses antrean tersebut satu per satu, mengirimkannya ke server, memutakhirkan cache, dan menangani kemungkinan konflik data.

Keberadaan proses ini sangat penting karena sistem praktikum sering kali diakses pada kondisi jaringan yang tidak selalu stabil. Oleh sebab itu, proses sinkronisasi offline membuat sistem lebih andal, responsif, dan mendukung kontinuitas pekerjaan pengguna.

---

# 3. Narasi Data Store Level 1

## 3.1 Narasi [`D1 Database Utama`](docs/DFD.md:52)

[`D1 Database Utama`](docs/DFD.md:52) adalah pusat penyimpanan seluruh data penting sistem. Di dalamnya tersimpan data akun pengguna, role, jadwal praktikum, materi, kuis, hasil pengerjaan, kehadiran, nilai, logbook, inventaris, peminjaman, pengumuman, notifikasi, hingga data konflik sinkronisasi. Semua proses utama pada DFD Level 1 berinteraksi dengan data store ini karena seluruh aktivitas inti dan operasional pada akhirnya membutuhkan penyimpanan terpusat yang konsisten.

## 3.2 Narasi [`D2 Cache Lokal`](docs/DFD.md:53)

[`D2 Cache Lokal`](docs/DFD.md:53) adalah penyimpanan lokal pada sisi browser yang mendukung akses cepat dan kemampuan offline. Data yang sering dibutuhkan seperti jadwal, materi tertentu, pengumuman, atau informasi akademik penting dapat disalin ke cache ini. Peran utamanya adalah menjaga pengalaman pengguna tetap baik ketika jaringan lemah atau terputus.

## 3.3 Narasi [`D3 Offline Queue`](docs/DFD.md:54)

[`D3 Offline Queue`](docs/DFD.md:54) menyimpan antrean operasi yang dilakukan ketika sistem sedang offline. Contohnya adalah jawaban kuis, perubahan data tertentu, atau aksi lain yang seharusnya dikirim ke server namun belum dapat dilakukan. Dengan adanya queue ini, sistem tetap dapat menerima aktivitas pengguna tanpa kehilangan data, lalu menyalurkannya kembali saat jaringan pulih.

## 3.4 Narasi [`D4 Storage File`](docs/DFD.md:55)

[`D4 Storage File`](docs/DFD.md:55) digunakan untuk menyimpan file materi dan dokumen pendukung pembelajaran. Berbeda dari database utama yang lebih menekankan pada metadata dan data terstruktur, storage file menyimpan objek berkas seperti PDF, dokumen, atau bahan ajar lainnya. Keterhubungannya dengan proses akademik membuat distribusi materi menjadi lebih terorganisasi.

---

# 4. Narasi Lengkap DFD Level 2

> **Catatan Konvensi Penamaan Proses (Disclaimer Akademis):**
> Pada diagram DFD Level 2 di laporan ini, penamaan proses menggunakan notasi alias lokal alfanumerik (seperti `A1`, `A2`, `A3`, dst.) untuk membantu keterbacaan visual pada kanvas diagram yang terbatas agar teks label tetap ringkas di dalam gelembung.
>
> Dalam dokumen ini, label tersebut diperlakukan sebagai **kode aktivitas lokal** di dalam satu diagram Level 2, bukan sebagai nomor proses dekomposisi lanjutan. Penggunaan notasi *Local Sequence* ini murni merupakan konvensi penyajian visual grafis pada dokumen ini, sedangkan hubungan proses dengan induknya tetap ditunjukkan melalui judul diagram, nomor proses Level 2, dan narasi pembahasan.

## Tabel Pemetaan Alias Aktivitas Lokal
Tabel di bawah ini memberikan ilustrasi penggunaan alias lokal pada diagram agar pembacaan tetap konsisten, ringkas, dan tidak bergeser menjadi DFD Level 3.

| Alias | Status dalam Diagram | Nama Aktivitas Lokal | Keterkaitan Proses Level 2 |
|-------|----------------------|----------------------|----------------------------|
| **A1** | Aktivitas lokal ke-1 | Validasi Kredensial | 1.1 Autentikasi |
| **A2** | Aktivitas lokal ke-2 | Ambil Data Role | 1.1 Autentikasi |
| **A3** | Aktivitas lokal ke-3 | Bentuk Sesi Login | 1.1 Autentikasi |
| **A1** | Aktivitas lokal ke-1 | Buat Akun | 1.2 Kelola User |
| **A2** | Aktivitas lokal ke-2 | Tetapkan Role | 1.2 Kelola User |
*(Pola berulang yang sama berlaku logis untuk diagram proses turunan Manajemen Praktikum [2.0], Operasional Lab [3.0], hingga Sinkronisasi [4.0])*

---

# 4.1 Narasi Proses 1.1 — Autentikasi

Proses [`1.1 Autentikasi`](docs/DFD.md:162) menjelaskan bagaimana pengguna masuk ke sistem dan memperoleh akses sesuai `role`-nya. Proses ini terdiri atas lima aktivitas internal, yaitu validasi kredensial, pengambilan data `role`, pembentukan sesi login, pengalihan berdasarkan `role`, dan `logout`.

Pada awal alur, pengguna mengirimkan email dan password ke aktivitas [`A1 Validasi Kredensial`](docs/DFD.md:169). Sistem lalu meneruskan data autentikasi tersebut ke layanan [`Supabase Auth`](docs/DFD.md:167) untuk diverifikasi. Jika kredensial tidak valid, sistem mengirimkan informasi kegagalan login kembali kepada pengguna. Namun jika valid, alur dilanjutkan ke aktivitas [`A2 Ambil Data Role`](docs/DFD.md:170).

Pada aktivitas ini, sistem membaca data `role` pengguna dari [`D1 Data User dan Role`](docs/DFD.md:168). `Role` menentukan jenis akses yang akan diberikan, misalnya sebagai admin, dosen, laboran, atau mahasiswa. Setelah `role` diperoleh, sistem masuk ke [`A3 Bentuk Session Login`](docs/DFD.md:171), yaitu tahap pembentukan sesi login aktif agar aplikasi mengenali bahwa pengguna telah terautentikasi.

Sesi login yang terbentuk kemudian diteruskan ke [`A4 Redirect Berdasarkan Role`](docs/DFD.md:172). Pada tahap ini, pengguna diarahkan ke dashboard dan fitur yang sesuai dengan kewenangannya. Dengan kata lain, dosen tidak diarahkan ke menu administrasi penuh milik admin, dan mahasiswa tidak memiliki akses ke pengelolaan inventaris laboratorium.

Selain proses masuk, autentikasi juga mencakup keluarnya pengguna dari sistem melalui [`A5 Logout`](docs/DFD.md:173). Ketika pengguna mengirimkan permintaan `logout`, sistem mengakhiri sesi login aktif sehingga akses ke fitur internal dihentikan. Narasi ini menegaskan bahwa proses autentikasi tidak hanya memeriksa identitas, tetapi juga mengatur awal dan akhir akses pengguna terhadap sistem.

## Alur ringkas proses [`1.1`](docs/DFD.md:162)

1. Pengguna mengirimkan email dan password.
2. Sistem memverifikasi kredensial ke layanan autentikasi.
3. Jika berhasil, sistem mengambil data `role` pengguna.
4. Sistem membentuk sesi login aktif.
5. Sistem mengarahkan pengguna ke dashboard sesuai `role`.
6. Saat pengguna `logout`, sistem mengakhiri sesi login.

---

# 4.2 Narasi Proses 1.2 — Kelola User

Proses [`1.2 Kelola User`](docs/DFD.md:383) menggambarkan bagaimana admin mengelola akun pengguna beserta status dan perannya. Proses ini penting karena seluruh pengguna sistem harus terlebih dahulu terdaftar, memiliki role yang jelas, dan memiliki status akun yang terkontrol.

Alur dimulai ketika admin memasukkan data akun baru ke aktivitas [`A1 Buat Akun`](docs/DFD.md:390). Data akun tersebut dapat berupa identitas dasar pengguna seperti nama, email, atau data administratif lainnya. Sistem menyimpan akun itu ke [`D1 Data User dan Role`](docs/DFD.md:388), lalu meneruskan proses ke tahap penetapan role.

Pada [`A2 Tetapkan Role`](docs/DFD.md:391), admin menentukan apakah pengguna tersebut berperan sebagai mahasiswa, dosen, laboran, atau admin. Role disimpan ke database agar seluruh modul lain dapat membaca hak akses secara konsisten. Setelah itu, admin dapat melakukan pengelolaan detail identitas per role melalui [`A3 Kelola Profil Role`](docs/DFD.md:392). Pada tahap ini, sistem memperbarui informasi yang relevan dengan jenis pengguna, misalnya data akademik atau atribut kerja tertentu.

Jika ada perubahan kondisi akun, admin dapat menggunakan [`A4 Ubah Status User`](docs/DFD.md:393). Aktivitas ini memungkinkan akun diaktifkan atau dinonaktifkan sesuai kebutuhan. Langkah ini penting untuk menjaga keamanan dan memastikan hanya pengguna aktif yang dapat mengakses sistem. Jika akun sudah tidak diperlukan, admin dapat memakai [`A5 Hapus atau Arsipkan User`](docs/DFD.md:394). Pada tahap ini, sistem dapat menghapus akun atau menandainya sebagai arsip agar tidak lagi digunakan dalam operasi aktif.

Narasi proses ini menunjukkan bahwa pengelolaan pengguna merupakan fondasi administrasi sistem. Tanpa data user yang tertata, proses autentikasi, distribusi hak akses, dan pelacakan aktivitas tidak akan berjalan dengan baik.

## Alur ringkas proses [`1.2`](docs/DFD.md:383)

1. Admin membuat akun baru.
2. Sistem menyimpan data akun.
3. Admin menetapkan role pengguna.
4. Sistem menyimpan dan memperbarui profil sesuai role.
5. Admin dapat mengaktifkan atau menonaktifkan akun.
6. Admin dapat menghapus atau mengarsipkan akun jika sudah tidak digunakan.

---

# 4.3 Narasi Proses 2.1 — Kelola Jadwal

Proses [`2.1 Kelola Jadwal`](docs/DFD.md:197) menjelaskan aliran data ketika jadwal praktikum direncanakan, diperiksa, disetujui, dipublikasikan, lalu diakses oleh pengguna terkait. Proses ini melibatkan dosen, laboran, mahasiswa, [`D1 Data Jadwal Praktikum`](docs/DFD.md:204), dan [`D2 IndexedDB Cache`](docs/DFD.md:205).

Alur dimulai ketika dosen mengirimkan rancangan jadwal ke aktivitas [`A1 Input atau Ajukan Jadwal`](docs/DFD.md:207). Rancangan ini dapat berisi informasi waktu, kelas, mata kuliah, serta kebutuhan laboratorium. Setelah data masuk, sistem melanjutkan ke [`A2 Validasi Kelas dan Laboratorium`](docs/DFD.md:208). Di tahap ini, sistem memeriksa kesesuaian relasi kelas, mata kuliah, waktu pelaksanaan, serta ketersediaan laboratorium berdasarkan data yang tersimpan pada [`D1`](docs/DFD.md:204).

Jika hasil validasi menunjukkan bahwa jadwal layak, alur dilanjutkan ke [`A3 Persetujuan Jadwal`](docs/DFD.md:209). Pada tahap ini laboran melakukan peninjauan dan memberikan keputusan setuju atau tolak. Keputusan tersebut disimpan sebagai pembaruan status pada data jadwal. Jika disetujui, sistem meneruskan jadwal ke [`A4 Publikasi Jadwal`](docs/DFD.md:210). Pada aktivitas ini, jadwal aktif disimpan ke database utama dan juga dapat ditempatkan di cache lokal agar dapat diakses lebih cepat atau saat offline.

Setelah jadwal dipublikasikan, mahasiswa, dosen, dan laboran dapat mengaksesnya melalui [`A5 Lihat Jadwal`](docs/DFD.md:211). Sistem akan mengambil data dari database utama, dan apabila diperlukan atau saat koneksi bermasalah, sistem dapat menggunakan cache lokal sebagai fallback. Hasil akhirnya adalah mahasiswa menerima jadwal praktikum, dosen menerima jadwal mengajar, dan laboran menerima jadwal penggunaan laboratorium.

Narasi ini memperlihatkan bahwa jadwal tidak langsung muncul begitu saja, melainkan melalui tahapan input, validasi, persetujuan, publikasi, dan distribusi. Hal tersebut penting untuk menunjukkan kontrol dan keteraturan pengelolaan praktikum.

## Alur ringkas proses [`2.1`](docs/DFD.md:197)

1. Dosen mengajukan rancangan jadwal.
2. Sistem memvalidasi relasi kelas, mata kuliah, waktu, dan laboratorium.
3. Laboran meninjau serta menyetujui atau menolak jadwal.
4. Jadwal yang disetujui dipublikasikan.
5. Sistem menyimpan jadwal ke database dan cache.
6. Mahasiswa, dosen, dan laboran melihat jadwal sesuai kebutuhannya.

---

# 4.4 Narasi Proses 2.2 — Kelola Kuis dan Bank Soal

Proses [`2.2 Kelola Kuis dan Bank Soal`](docs/DFD.md:242) menggambarkan bagaimana dosen menyusun kuis, mengelola bank soal, mempublikasikan kuis, lalu mahasiswa mengerjakan kuis baik dalam kondisi online maupun offline. Proses ini juga mencakup penyimpanan hasil dan peninjauan statistik oleh dosen.

Tahap pertama terjadi pada [`A1 Buat Kuis`](docs/DFD.md:252), ketika dosen memasukkan judul kuis, durasi, serta kelas sasaran. Data kuis disimpan di [`D1 Data Kuis, Soal, Hasil`](docs/DFD.md:248). Selanjutnya, dosen dapat mengelola bank soal pada [`A2 Kelola Bank Soal`](docs/DFD.md:253). Di sini dosen dapat membuat, mengubah, atau memilih soal yang reusable. Soal-soal tersebut disimpan dalam database dan dapat dihubungkan kembali ke kuis yang sedang disusun.

Ketika kuis siap digunakan, dosen melakukan [`A3 Publish Kuis`](docs/DFD.md:254). Sistem mengubah status kuis menjadi aktif, menyimpannya di database, dan dapat pula menyalin informasi penting ke [`D2 IndexedDB Cache`](docs/DFD.md:249) agar soal masih dapat diambil dalam skenario tertentu. Setelah dipublikasikan, mahasiswa mengirimkan permintaan soal ke [`A4 Ambil Soal`](docs/DFD.md:255). Sistem akan berusaha mengambil soal dari database utama, dan jika diperlukan, memakai cache lokal sebagai sumber cadangan.

Mahasiswa kemudian mengerjakan kuis melalui [`A5 Kerjakan Kuis`](docs/DFD.md:256). Pada tahap ini terdapat dua kemungkinan alur. Jika koneksi tersedia, jawaban langsung diteruskan ke [`A7 Submit dan Penilaian`](docs/DFD.md:258). Namun jika perangkat sedang offline, jawaban masuk ke [`A6 Auto-save Offline`](docs/DFD.md:257) dan disimpan ke [`D3 Offline Queue`](docs/DFD.md:250). Mahasiswa menerima informasi bahwa jawaban telah tersimpan secara lokal.

Saat sinkronisasi memungkinkan, jawaban pada queue dikirim ke aktivitas submit. Sistem menyimpan hasil dan jawaban ke database, lalu mengolah nilai sesuai aturan penilaian. Nilai dan hasil dapat langsung dikembalikan kepada mahasiswa. Selanjutnya, dosen dapat mengakses [`A8 Lihat Hasil`](docs/DFD.md:259) untuk memperoleh rekap, statistik, dan capaian mahasiswa.

Narasi ini menegaskan bahwa proses kuis tidak berhenti pada pembuatan soal, tetapi juga memperhatikan distribusi, pengerjaan, penyimpanan sementara saat offline, penilaian, dan evaluasi hasil.

## Alur ringkas proses [`2.2`](docs/DFD.md:242)

1. Dosen membuat kuis baru.
2. Dosen mengelola bank soal dan menghubungkannya ke kuis.
3. Dosen mempublikasikan kuis.
4. Mahasiswa meminta dan menerima soal kuis.
5. Mahasiswa mengerjakan kuis.
6. Jika online, jawaban langsung disubmit dan dinilai.
7. Jika offline, jawaban disimpan ke queue lalu disinkronkan.
8. Dosen melihat hasil dan statistik kuis.

---

# 4.5 Narasi Proses 2.3 — Kelola Materi

Proses [`2.3 Kelola Materi`](docs/DFD.md:299) menggambarkan pengelolaan bahan ajar praktikum sejak diunggah oleh dosen sampai diakses oleh mahasiswa. Proses ini melibatkan [`D1 Metadata Materi`](docs/DFD.md:305), [`D2 IndexedDB Cache`](docs/DFD.md:306), dan [`D4 Storage File`](docs/DFD.md:307).

Alur dimulai ketika dosen mengirimkan file materi beserta data pendukung ke [`A1 Upload Materi`](docs/DFD.md:309). Sistem kemudian mengunggah file fisik ke storage file. Setelah berkas tersimpan, sistem masuk ke [`A2 Simpan Metadata`](docs/DFD.md:310), yaitu tahap penyimpanan informasi terstruktur seperti judul materi, kelas terkait, deskripsi, dan referensi lokasi file. Metadata ini disimpan ke database agar file dapat diidentifikasi dan ditampilkan dengan benar.

Baik mahasiswa maupun dosen dapat meminta daftar materi melalui [`A3 Lihat Daftar Materi`](docs/DFD.md:311). Sistem mengambil metadata dari database dan menampilkan daftar materi yang tersedia. Mahasiswa yang ingin membuka materi kemudian masuk ke [`A4 Akses atau Unduh Materi`](docs/DFD.md:312). Pada aktivitas ini, sistem mengambil file dari storage dan menyajikannya kepada pengguna.

Setelah materi diakses, sistem dapat melanjutkan ke [`A5 Cache Offline`](docs/DFD.md:313), yaitu penyimpanan materi atau referensinya ke cache lokal. Tujuannya adalah agar materi tetap bisa diakses saat jaringan tidak tersedia. Fitur ini sangat relevan untuk sistem PWA karena materi pembelajaran merupakan salah satu kebutuhan utama yang sering dibuka berulang kali.

Narasi proses ini memperlihatkan bahwa pengelolaan materi terdiri atas dua komponen besar, yaitu pengelolaan file fisik dan pengelolaan metadata. Keduanya harus berjalan bersama agar materi mudah dicari, aman disimpan, dan nyaman diakses.

## Alur ringkas proses [`2.3`](docs/DFD.md:299)

1. Dosen mengunggah file materi.
2. Sistem menyimpan file ke storage.
3. Sistem menyimpan metadata materi ke database.
4. Dosen dan mahasiswa melihat daftar materi.
5. Mahasiswa membuka atau mengunduh materi.
6. Sistem menyimpan cache agar materi dapat diakses lebih fleksibel.

---

# 4.6 Narasi Proses 2.4 — Kelola Kelas, Mata Kuliah, dan Assignment

Proses [`2.4 Kelola Kelas, Mata Kuliah, dan Assignment`](docs/DFD.md:341) merupakan dasar struktur akademik yang menopang proses lain seperti jadwal, materi, kuis, kehadiran, dan nilai. Proses ini tidak hanya membentuk data master akademik, tetapi juga memastikan assignment dan submission berada pada relasi kelas yang benar. Admin berperan utama pada pembentukan struktur, sedangkan dosen dan mahasiswa memanfaatkan struktur tersebut untuk aktivitas pembelajaran.

Alur dimulai pada [`A1 Kelola Mata Kuliah`](docs/DFD.md:350) ketika admin membuat atau memperbarui data mata kuliah. Data ini disimpan pada [`D1 Data Mata Kuliah`](docs/DFD.md:347). Setelah itu admin melanjutkan ke [`A2 Kelola Kelas Praktikum`](docs/DFD.md:351) untuk membentuk atau memperbarui kelas yang akan digunakan pada kegiatan praktikum. Informasi kelas disimpan pada [`D2 Data Kelas Praktikum`](docs/DFD.md:348).

Setelah struktur dasar tersedia, admin menjalankan [`A3 Enrol Mahasiswa dan Dosen`](docs/DFD.md:352). Pada tahap ini sistem menghubungkan dosen dan mahasiswa ke kelas yang sesuai sehingga relasi akademik menjadi jelas dan siap dipakai oleh modul lain. Berikutnya, dosen mengelola tugas melalui [`A4 Kelola Assignment`](docs/DFD.md:353). Assignment yang dibuat disimpan pada [`D3 Data Assignment dan Submission`](docs/DFD.md:349) sebagai bagian dari aktivitas pembelajaran pada kelas terkait.

Mahasiswa kemudian mengirimkan hasil tugas melalui [`A5 Kumpulkan Submission`](docs/DFD.md:354). Submission yang masuk dicatat pada data store yang sama agar keterkaitan antara assignment dan respons mahasiswa tetap terjaga. Setelah itu, dosen dan mahasiswa dapat menggunakan [`A6 Lihat Kelas dan Assignment`](docs/DFD.md:355) untuk melihat struktur kelas, daftar assignment, serta informasi akademik yang relevan.

Narasi proses ini menegaskan bahwa data mata kuliah, kelas, enrollment, assignment, dan submission membentuk satu rantai akademik yang saling terhubung. Karena itu, proses [`2.4`](docs/DFD.md:341) bukan sekadar administrasi data dasar, melainkan fondasi operasional bagi proses akademik lain di dalam sistem.

## Alur ringkas proses [`2.4`](docs/DFD.md:341)

1. Admin mengelola data mata kuliah.
2. Admin mengelola data kelas praktikum.
3. Admin menetapkan dosen dan mahasiswa ke kelas.
4. Dosen mengelola assignment.
5. Mahasiswa mengumpulkan submission.
6. Dosen dan mahasiswa melihat data kelas serta assignment.

---

# 4.7 Narasi Proses 2.5 — Kehadiran dan Penilaian

Proses [`2.5 Kehadiran dan Penilaian`](docs/DFD.md:422) menjelaskan bagaimana dosen mencatat presensi, memasukkan nilai, lalu sistem menyusun rekap yang dapat dilihat kembali oleh mahasiswa. Seluruh data proses ini tersimpan dalam [`D1 Data Kehadiran dan Nilai`](docs/DFD.md:428).

Alur dimulai pada [`A1 Input Kehadiran`](docs/DFD.md:430), saat dosen mencatat status hadir mahasiswa. Data tersebut lalu diteruskan ke [`A2 Validasi Presensi`](docs/DFD.md:431). Pada tahap ini, sistem memeriksa kesesuaian kehadiran terhadap jadwal yang berlaku dan daftar peserta yang sah. Jika valid, data kehadiran disimpan ke database.

Selanjutnya, dosen memasukkan komponen penilaian pada [`A3 Input Nilai`](docs/DFD.md:432). Komponen ini dapat mencakup nilai tugas, kuis, praktik, atau bentuk penilaian lain sesuai skema yang digunakan. Setelah tersimpan, sistem menjalankan [`A4 Hitung Rekap Nilai`](docs/DFD.md:433) dengan mengambil komponen nilai dari database dan menyusunnya menjadi rekap nilai atau nilai akhir. Rekap tersebut dapat dikirimkan kembali kepada dosen sebagai bahan evaluasi.

Mahasiswa yang ingin mengetahui perkembangan akademiknya mengakses [`A5 Lihat Hasil Nilai`](docs/DFD.md:434). Sistem mengambil data presensi dan nilai dari database, lalu menampilkannya kepada mahasiswa. Dengan cara ini, mahasiswa tidak hanya mengetahui skor akhir, tetapi juga dapat melihat hubungan antara kehadiran dan performa penilaiannya.

Narasi ini menunjukkan bahwa kehadiran dan penilaian merupakan dua aliran data yang saling berkaitan. Presensi yang tervalidasi memperkuat akuntabilitas, sedangkan penilaian yang direkap membuat hasil belajar lebih mudah dipahami dan ditindaklanjuti.

## Alur ringkas proses [`2.5`](docs/DFD.md:422)

1. Dosen menginput kehadiran mahasiswa.
2. Sistem memvalidasi presensi berdasarkan jadwal dan peserta.
3. Dosen menginput komponen nilai.
4. Sistem menghitung rekap nilai.
5. Mahasiswa melihat hasil presensi dan nilai.

---

# 4.8 Narasi Proses 3.1 — Logbook Digital

Proses [`3.1 Logbook Digital`](docs/DFD.md:460) digunakan untuk mencatat kegiatan praktikum mahasiswa secara sistematis serta memungkinkan dosen melakukan pemantauan dan umpan balik. Data logbook disimpan pada [`D1 Data Logbook`](docs/DFD.md:466).

Alur pertama terjadi saat mahasiswa menuliskan aktivitas praktikum pada [`A1 Input Entri Logbook`](docs/DFD.md:468). Entri ini berisi catatan kegiatan, progres, hasil praktik, atau kendala yang dialami. Setelah entri dibuat, sistem meneruskannya ke [`A2 Simpan Bukti atau Catatan`](docs/DFD.md:469), yaitu tahap penyimpanan isi logbook beserta lampiran atau bukti pendukung jika ada.

Dosen kemudian dapat melakukan peninjauan melalui [`A3 Review Logbook`](docs/DFD.md:470). Sistem mengambil logbook mahasiswa dari database dan menyajikannya untuk diperiksa. Berdasarkan hasil peninjauan tersebut, dosen melanjutkan ke [`A4 Beri Umpan Balik`](docs/DFD.md:471). Pada tahap ini dosen dapat memberi komentar, koreksi, atau status review yang kemudian disimpan kembali ke database.

Baik mahasiswa maupun dosen dapat melihat riwayat logbook melalui [`A5 Lihat Riwayat Logbook`](docs/DFD.md:472). Sistem mengambil histori logbook dan menampilkannya sesuai kebutuhan pengguna. Mahasiswa dapat melihat perkembangan catatan kegiatannya sendiri, sedangkan dosen dapat memantau konsistensi aktivitas mahasiswa dari waktu ke waktu.

Narasi logbook ini menegaskan bahwa sistem tidak sekadar menyimpan catatan harian, melainkan juga membentuk mekanisme dokumentasi, monitoring, dan evaluasi proses praktikum.

## Alur ringkas proses [`3.1`](docs/DFD.md:460)

1. Mahasiswa menulis entri logbook.
2. Sistem menyimpan isi dan lampiran logbook.
3. Dosen meminta dan meninjau logbook mahasiswa.
4. Dosen memberi umpan balik atau status review.
5. Mahasiswa dan dosen melihat riwayat logbook.

---

# 4.9 Narasi Proses 3.2 — Peminjaman Alat dan Inventaris

Proses [`3.2 Peminjaman Alat dan Inventaris`](docs/DFD.md:499) menjelaskan bagaimana data inventaris laboratorium dikelola serta bagaimana permohonan peminjaman alat diproses hingga menjadi laporan. Proses ini melibatkan dosen, laboran, admin, dan [`D1 Inventaris dan Peminjaman`](docs/DFD.md:506).

Alur dimulai ketika laboran mengelola data alat pada [`A1 Kelola Inventaris`](docs/DFD.md:508). Kegiatan ini dapat berupa penambahan data alat, pembaruan kondisi, jumlah stok, atau perubahan informasi inventaris lainnya. Semua data tersebut disimpan ke database sebagai dasar layanan peminjaman.

Ketika dosen memerlukan alat, dosen mengajukan permohonan melalui [`A2 Ajukan Peminjaman`](docs/DFD.md:509). Sistem menyimpan permohonan tersebut ke database dengan informasi status awal. Setelah itu, laboran dan admin dapat memproses permohonan pada [`A3 Verifikasi dan Keputusan`](docs/DFD.md:510). Pada tahap ini dilakukan pemeriksaan kelayakan, ketersediaan alat, dan pengambilan keputusan apakah permohonan disetujui atau ditolak. Hasil keputusan disimpan sebagai pembaruan status dan dikirimkan kepada dosen.

Untuk peminjaman yang sedang berjalan, laboran dan admin dapat mengakses [`A4 Monitor Peminjaman Aktif`](docs/DFD.md:511). Sistem mengambil data transaksi aktif dari database dan menampilkannya sebagai daftar peminjaman yang masih berlangsung. Melalui data ini, pihak pengelola dapat memantau alat yang sedang dipinjam, siapa peminjamnya, dan status pengembaliannya.

Pada akhirnya, laboran dapat meminta [`A5 Laporan`](docs/DFD.md:512). Sistem mengambil rekap inventaris dan transaksi peminjaman dari database, lalu menghasilkan laporan yang dapat digunakan untuk evaluasi operasional laboratorium. Narasi ini menekankan bahwa peminjaman alat bukan proses sederhana, melainkan alur administratif yang membutuhkan pencatatan, verifikasi, monitoring, dan pelaporan.

## Alur ringkas proses [`3.2`](docs/DFD.md:499)

1. Laboran mengelola data inventaris alat.
2. Dosen mengajukan peminjaman alat.
3. Laboran dan/atau admin memverifikasi serta memberi keputusan.
4. Sistem memperbarui status peminjaman dan memberi informasi ke dosen.
5. Laboran dan admin memonitor peminjaman aktif.
6. Sistem menghasilkan laporan inventaris dan peminjaman.

---

# 4.10 Narasi Proses 3.3 — Pengumuman dan Notifikasi

Proses [`3.3 Pengumuman dan Notifikasi`](docs/DFD.md:542) mengatur pembuatan, penyimpanan, distribusi, penayangan, dan pengarsipan informasi resmi dalam sistem. Proses ini sangat penting karena pengumuman menjadi media penyebaran informasi akademik maupun operasional kepada mahasiswa, dosen, dan laboran.

Alur dimulai saat admin menyusun judul, konten, prioritas, dan target role pada [`A1 Buat Pengumuman`](docs/DFD.md:553). Data pengumuman yang telah disusun kemudian diteruskan ke [`A2 Simpan dan Publikasikan`](docs/DFD.md:554). Pada tahap ini, sistem menyimpan pengumuman ke [`D1 Pengumuman dan Notifications`](docs/DFD.md:550) serta dapat menyalinnya ke [`D2 IndexedDB Cache`](docs/DFD.md:551) untuk mendukung akses cepat dan offline.

Setelah tersimpan, sistem menjalankan [`A3 Distribusi Berdasarkan Role`](docs/DFD.md:555). Sistem mengambil target distribusi dari database, lalu menyampaikan notifikasi atau pengumuman kepada role yang sesuai, yaitu mahasiswa, dosen, dan/atau laboran. Dengan mekanisme ini, setiap informasi dapat diarahkan hanya kepada pihak yang relevan.

Pengguna kemudian dapat membuka daftar dan detail pengumuman melalui [`A4 Tampilkan Daftar dan Detail`](docs/DFD.md:556). Sistem mengambil pengumuman aktif dari database dan, bila diperlukan, dari cache lokal sebagai fallback. Hasilnya adalah pengguna dapat melihat daftar pengumuman atau membuka detail isi informasi tersebut.

Jika pengumuman perlu diperbarui, dinonaktifkan, atau dihapus, admin menggunakan [`A5 Arsipkan atau Hapus`](docs/DFD.md:557). Sistem kemudian memperbarui status atau menghapus data di database, lalu memberikan status pengelolaan kembali kepada admin.

Narasi ini menunjukkan bahwa pengumuman dalam sistem bukan sekadar konten statis, tetapi data yang melalui siklus hidup penuh: dibuat, dipublikasikan, didistribusikan, dibaca, dan akhirnya diarsipkan atau dihapus.

## Alur ringkas proses [`3.3`](docs/DFD.md:542)

1. Admin membuat pengumuman.
2. Sistem menyimpan dan mempublikasikannya.
3. Sistem mendistribusikan pengumuman sesuai target role.
4. Pengguna melihat daftar dan detail pengumuman.
5. Admin dapat mengubah, mengarsipkan, atau menghapus pengumuman.

---

# 4.11 Narasi Proses 4.1 — Sinkronisasi Offline PWA

Proses [`4.1 Sinkronisasi Offline PWA`](docs/DFD.md:637) menjelaskan detail bagaimana sistem menangani kondisi offline dan mengembalikan konsistensi data saat koneksi tersedia kembali. Proses ini melibatkan semua aktor pengguna, layanan [`Supabase`](docs/DFD.md:645), [`D1 Database dan Conflict Log`](docs/DFD.md:646), [`D2 IndexedDB Cache`](docs/DFD.md:647), dan [`D3 Offline Queue`](docs/DFD.md:648).

Tahap pertama adalah [`A1 Deteksi Status Jaringan`](docs/DFD.md:650). Ketika admin, dosen, mahasiswa, atau laboran melakukan aktivitas, sistem terlebih dahulu mengenali apakah perangkat sedang online atau offline. Informasi status jaringan ini sangat penting karena menentukan ke mana data berikutnya akan diarahkan.

Jika ada data yang perlu tetap tersedia untuk dibaca, sistem menjalankan [`A2 Simpan Data ke Cache`](docs/DFD.md:651). Pada aktivitas ini, data penting dicadangkan ke cache lokal. Sementara itu, jika ada operasi tulis yang tidak dapat langsung dikirim ke server karena offline, sistem memanfaatkan [`A3 Simpan Operasi ke Queue`](docs/DFD.md:652). Operasi tersebut ditulis ke offline queue agar tidak hilang.

Ketika pengguna memilih sinkronkan sekarang atau ketika sistem mendeteksi koneksi telah kembali, alur masuk ke [`A4 Proses Sinkronisasi`](docs/DFD.md:653). Sistem mengambil antrean dari queue, lalu mengirimkan perubahan ke database utama dan layanan sinkronisasi eksternal. Pada tahap ini, sistem berusaha menyamakan data lokal dengan data server.

Namun, sinkronisasi tidak selalu berhasil sempurna. Oleh sebab itu, sistem melanjutkan ke [`A5 Tangani Konflik dan Retry`](docs/DFD.md:654). Di sinilah sistem memperbarui cache, menandai antrean yang berhasil, mengulangi pengiriman untuk item yang gagal, dan menyimpan konflik atau hasil resolusi ke database. Setelah proses selesai, sistem mengirimkan status sinkronisasi kepada pengguna.

Narasi ini sangat penting dalam konteks PWA karena memperlihatkan bahwa dukungan offline bukan sekadar menyimpan data sementara, melainkan mencakup deteksi koneksi, penyimpanan lokal, antrean operasi, sinkronisasi kembali, penanganan konflik, dan pelaporan hasil.

## Alur ringkas proses [`4.1`](docs/DFD.md:637)

1. Sistem mendeteksi status online atau offline.
2. Data penting disimpan ke cache lokal.
3. Operasi tulis saat offline disimpan ke queue.
4. Saat koneksi tersedia, sistem memproses sinkronisasi.
5. Sistem menangani konflik, retry, dan pembaruan status sinkronisasi.
6. Pengguna menerima informasi hasil sinkronisasi.

---

# 5. Kesimpulan Naratif

Berdasarkan seluruh penjabaran DFD pada [`docs/DFD.md`](docs/DFD.md), dapat disimpulkan bahwa Sistem Informasi Praktikum PWA dirancang sebagai sistem yang terintegrasi antara pengelolaan akun, layanan akademik, operasional laboratorium, dan dukungan offline. Pada DFD Level 1, sistem dipetakan ke dalam empat proses besar agar ruang lingkup aplikasi mudah dipahami secara konseptual. Selanjutnya pada DFD Level 2, tiap proses utama diuraikan menjadi aktivitas internal yang menunjukkan transformasi data secara lebih rinci.

Secara akademik, narasi ini menegaskan bahwa setiap input dari aktor eksternal selalu melalui tahapan logis berupa penerimaan data, validasi, penyimpanan, pengolahan, dan distribusi hasil. Dengan demikian, sistem tidak dipandang sekadar sebagai kumpulan halaman antarmuka, melainkan sebagai mekanisme pengelolaan aliran data yang memiliki aturan, tujuan, dan keluaran yang jelas.

Dokumen naratif ini dapat digunakan untuk memperkuat pembahasan skripsi karena menjelaskan hubungan antaraktor, antarproses, dan antarpenyimpanan data secara runtut. Selain itu, keberadaan fitur PWA dan sinkronisasi offline memperlihatkan nilai tambah sistem dibanding aplikasi web biasa, terutama dalam menjaga keberlangsungan aktivitas pengguna saat koneksi internet tidak stabil.

---

# 6. Saran Penggunaan dalam Skripsi

Narasi pada dokumen ini dapat dimanfaatkan untuk beberapa kebutuhan penulisan ilmiah, yaitu:

1. sebagai penjelasan setelah gambar DFD Level 1;
2. sebagai uraian subbab pembahasan untuk setiap proses DFD Level 2 beserta aktivitas internalnya;
3. sebagai dasar analisis aliran data pada bab hasil dan pembahasan;
4. sebagai penghubung antara model analisis sistem dengan implementasi aplikasi yang aktif.

Dengan demikian, isi dokumen ini telah disusun agar siap dipakai sebagai naskah pendukung penjelasan DFD yang formal, rinci, dan konsisten dengan struktur sistem yang ada.