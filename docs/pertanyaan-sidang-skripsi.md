# Simulasi Pertanyaan Penguji dan Pembimbing Skripsi

Dokumen ini berisi simulasi pertanyaan yang kemungkinan muncul saat sidang skripsi berdasarkan judul, isi hasil-pembahasan, dan aplikasi Sistem Informasi Praktikum berbasis Progressive Web Application (PWA).

Judul penelitian:

**Analisis dan Perancangan Sistem Informasi Praktikum Berbasis Progressive Web Application (PWA) Menggunakan Metode R&D di Akademi Kebidanan Mega Buana**

## A. Pertanyaan Judul dan Ruang Lingkup

### 1. [Pasti] Judul Anda "analisis dan perancangan", tetapi di hasil ada implementasi aplikasi. Apakah ini tidak keluar dari judul?

**Maksud pertanyaan:**  
Penguji ingin melihat apakah Anda paham batas antara analisis, perancangan, dan implementasi.

**Jawaban aman:**  
"Tidak keluar dari judul, karena penelitian ini menggunakan metode Research and Development. Pada metode R&D, hasil analisis dan perancangan tidak berhenti sebagai dokumen, tetapi diwujudkan menjadi artefak atau produk sistem yang dapat diuji. Jadi implementasi aplikasi saya posisikan sebagai pembuktian bahwa hasil analisis dan perancangan tersebut dapat direalisasikan."

**Catatan penting:**  
Jangan jawab, "Iya, saya sekalian buat aplikasi." Lebih aman menjelaskan bahwa implementasi adalah artefak dari proses R&D.

### 2. [Pasti] Kenapa memilih sistem informasi praktikum sebagai objek penelitian?

**Maksud pertanyaan:**  
Penguji ingin tahu urgensi masalah.

**Jawaban aman:**  
"Karena pengelolaan praktikum di Akademi Kebidanan Mega Buana membutuhkan sistem yang lebih terstruktur. Praktikum melibatkan jadwal, materi, logbook, penilaian, presensi, peminjaman alat, dan komunikasi antarperan. Jika dikelola manual atau terpisah, risiko miskomunikasi, keterlambatan pencatatan, dan kesulitan monitoring menjadi lebih besar."

**Catatan penting:**  
Tekankan masalah praktis, bukan sekadar "karena belum ada aplikasi".

### 3. [Pasti] Mengapa fokusnya Akademi Kebidanan Mega Buana?

**Maksud pertanyaan:**  
Penguji mengecek konteks penelitian.

**Jawaban aman:**  
"Karena penelitian ini diarahkan pada kebutuhan nyata di lingkungan Akademi Kebidanan Mega Buana. Konteks kebidanan memiliki kegiatan praktikum yang membutuhkan pengelolaan ruang, alat, jadwal, logbook, dan evaluasi keterampilan. Jadi sistem dirancang menyesuaikan kebutuhan institusi tersebut."

**Catatan penting:**  
Jangan mengklaim sistem otomatis cocok untuk semua kampus. Lebih aman mengatakan sistem dapat dikembangkan atau diadaptasi.

### 4. [Tinggi] Kenapa fitur admin dan laboran masuk, padahal fokus proposal lebih ke dosen dan mahasiswa?

**Maksud pertanyaan:**  
Penguji ingin tahu apakah fitur melebar dari ruang lingkup.

**Jawaban aman:**  
"Dosen dan mahasiswa tetap menjadi fokus utama pada proses akademik praktikum. Admin dan laboran saya posisikan sebagai peran pendukung. Admin dibutuhkan untuk mengelola data master seperti pengguna, kelas, dan mata kuliah. Laboran dibutuhkan karena praktikum juga melibatkan laboratorium, alat, inventaris, dan peminjaman. Jadi fitur tersebut bukan pelebaran topik, tetapi pendukung agar sistem praktikum berjalan utuh."

**Catatan penting:**  
Kunci jawabannya: admin dan laboran adalah pendukung operasional, bukan fokus utama penelitian.

## B. Pertanyaan Metode Penelitian

### 5. [Pasti] Kenapa menggunakan metode R&D?

**Maksud pertanyaan:**  
Penguji ingin tahu kesesuaian metode dengan tujuan penelitian.

**Jawaban aman:**  
"Saya menggunakan R&D karena penelitian ini menghasilkan produk berupa sistem informasi. R&D cocok karena tahapannya mencakup identifikasi masalah, penentuan tujuan, perancangan, pengembangan produk, pengujian, evaluasi hasil, dan komunikasi hasil."

**Catatan penting:**  
Jangan hanya menjawab "karena membuat aplikasi". Hubungkan dengan tahapan sistematis.

### 6. [Tinggi] Bagaimana tahapan R&D diterapkan dalam penelitian Anda?

**Maksud pertanyaan:**  
Penguji ingin tahu bahwa Anda tidak sekadar menyebut metode.

**Jawaban aman:**  
"Tahap identifikasi masalah dilakukan melalui analisis kebutuhan pengelolaan praktikum. Tahap penentuan tujuan diarahkan pada pembangunan sistem informasi praktikum berbasis PWA. Tahap perancangan diwujudkan melalui DFD, ERD, dan rancangan arsitektur. Tahap pengembangan diwujudkan dalam aplikasi. Tahap pengujian dilakukan melalui black box, white box, dan SUS. Terakhir, hasilnya dibahas dalam kesimpulan dan saran."

**Catatan penting:**  
Jawaban ini kuat karena runtut dan langsung menghubungkan metode dengan isi skripsi.

### 7. [Sedang] Apakah penelitian Anda termasuk user-centered design?

**Maksud pertanyaan:**  
Penguji ingin melihat apakah sistem benar-benar sesuai kebutuhan pengguna.

**Jawaban aman:**  
"Pendekatannya mengarah ke kebutuhan pengguna karena sistem dibagi berdasarkan peran pengguna, yaitu admin, dosen, mahasiswa, dan laboran. Fitur-fitur utama juga disusun berdasarkan aktivitas pengguna dalam praktikum. Namun secara metodologis, kerangka utama penelitian tetap R&D."

**Catatan penting:**  
Jangan mengklaim penuh sebagai user-centered design jika tidak semua tahap UCD formal dilakukan.

## C. Pertanyaan Perancangan Sistem

### 8. [Pasti] Apa fungsi DFD dalam penelitian Anda?

**Maksud pertanyaan:**  
Penguji ingin tahu bahwa DFD bukan hanya pelengkap gambar.

**Jawaban aman:**  
"DFD digunakan untuk menggambarkan aliran data dan proses utama dalam sistem. Melalui DFD, kebutuhan praktikum seperti autentikasi, jadwal, materi, logbook, penilaian, peminjaman, dan sinkronisasi offline dapat dipetakan menjadi proses yang terstruktur."

**Catatan penting:**  
Sebut kata kunci: alur data, proses, aktor, dan data store.

### 9. [Pasti] Apa hubungan DFD dengan aplikasi yang dibuat?

**Maksud pertanyaan:**  
Penguji mengecek konsistensi rancangan dan implementasi.

**Jawaban aman:**  
"DFD menjadi dasar alur implementasi aplikasi. Misalnya proses kelola jadwal diwujudkan dalam modul jadwal, proses kelola kuis diwujudkan dalam fitur tugas praktikum dan bank soal, proses logbook diwujudkan dalam logbook digital, dan proses sinkronisasi offline diwujudkan dalam fitur PWA dan offline sync."

**Catatan penting:**  
Berikan contoh konkret minimal tiga modul.

### 10. [Tinggi] Apa fungsi ERD dalam penelitian Anda?

**Maksud pertanyaan:**  
Penguji ingin tahu rancangan data sistem.

**Jawaban aman:**  
"ERD digunakan untuk menggambarkan struktur dan relasi data. Karena sistem ini melibatkan banyak data seperti pengguna, kelas, mata kuliah, jadwal, kuis, nilai, logbook, inventaris, peminjaman, dan sinkronisasi, ERD membantu memastikan data saling terhubung secara logis."

**Catatan penting:**  
Tekankan bahwa ERD adalah fondasi database.

### 11. [Sedang] Kenapa ERD dibagi menjadi beberapa domain?

**Maksud pertanyaan:**  
Penguji mengecek alasan struktur penjelasan.

**Jawaban aman:**  
"Karena sistem memiliki banyak entitas, pembagian domain membuat penjelasan lebih mudah dipahami. Misalnya domain pengguna dan peran, domain akademik, domain praktikum, domain penilaian, domain laboratorium, komunikasi, dan sinkronisasi offline."

**Catatan penting:**  
Jawaban ini menunjukkan Anda memahami struktur data, bukan hanya menampilkan diagram.

## D. Pertanyaan Implementasi Aplikasi

### 12. [Pasti] Jelaskan secara singkat aplikasi yang Anda buat.

**Maksud pertanyaan:**  
Penguji ingin ringkasan sistem.

**Jawaban aman:**  
"Aplikasi yang saya buat adalah sistem informasi praktikum berbasis Progressive Web Application. Sistem ini mendukung pengelolaan jadwal praktikum, materi, tugas/kuis, logbook, presensi, nilai, peminjaman alat, inventaris, pengumuman, notifikasi, dan sinkronisasi offline. Pengguna dibagi berdasarkan peran, yaitu admin, dosen, mahasiswa, dan laboran."

**Catatan penting:**  
Jawab ringkas sekitar 20 sampai 30 detik.

### 13. [Tinggi] Teknologi apa yang digunakan dan kenapa?

**Maksud pertanyaan:**  
Penguji ingin alasan teknis.

**Jawaban aman:**  
"Sistem dikembangkan menggunakan React dan TypeScript untuk membangun antarmuka yang modular dan lebih terstruktur. Supabase digunakan untuk autentikasi, database, dan penyimpanan data. Untuk PWA digunakan service worker, cache, IndexedDB, dan sinkronisasi offline agar aplikasi lebih adaptif terhadap kondisi koneksi."

**Catatan penting:**  
Jangan terlalu masuk detail kecuali penguji meminta.

### 14. [Pasti] Bagaimana sistem membedakan hak akses pengguna?

**Maksud pertanyaan:**  
Penguji mengecek kontrol akses.

**Jawaban aman:**  
"Setelah pengguna login, sistem membaca data peran pengguna dari basis data. Berdasarkan peran tersebut, pengguna diarahkan ke dashboard yang sesuai, misalnya admin, dosen, mahasiswa, atau laboran. Menu dan halaman yang tersedia juga disesuaikan dengan peran tersebut."

**Catatan penting:**  
Tekankan role-based access.

### 15. [Sedang] Fitur mana yang paling inti dalam sistem ini?

**Maksud pertanyaan:**  
Penguji ingin tahu prioritas sistem.

**Jawaban aman:**  
"Fitur inti adalah fitur yang langsung berhubungan dengan pengelolaan praktikum, yaitu jadwal praktikum, materi, tugas/kuis, logbook, presensi, penilaian, dan dukungan PWA/offline. Fitur admin dan laboran mendukung agar proses tersebut berjalan lengkap."

**Catatan penting:**  
Jangan mengatakan semua fitur sama pentingnya.

## E. Pertanyaan Implementasi PWA

### 16. [Pasti] Bagaimana implementasi PWA pada aplikasi Anda?

**Maksud pertanyaan:**  
Ini pertanyaan yang sangat mungkin muncul.

**Jawaban aman:**  
"Implementasi PWA dilakukan melalui beberapa bagian. Pertama, aplikasi menggunakan service worker untuk mengatur cache dan akses offline. Kedua, aset penting seperti halaman utama, manifest, icon, dan file statis disiapkan agar aplikasi dapat dimuat lebih cepat. Ketiga, data tertentu disimpan di IndexedDB agar tetap bisa diakses saat offline. Keempat, operasi yang dilakukan saat offline dapat masuk ke antrean sinkronisasi, lalu diproses kembali saat koneksi tersedia."

**Catatan penting:**  
Ini jawaban utama untuk pertanyaan PWA. Hafalkan alurnya: service worker, cache, IndexedDB, queue, sinkronisasi.

### 17. [Pasti] Apa fungsi service worker di sistem Anda?

**Maksud pertanyaan:**  
Penguji ingin tahu inti PWA.

**Jawaban aman:**  
"Service worker berfungsi sebagai lapisan perantara antara aplikasi, browser, cache, dan jaringan. Pada sistem saya, service worker membantu caching aset, menangani permintaan tertentu, menyediakan fallback saat offline, membersihkan cache versi lama, dan mendukung mekanisme update aplikasi."

**Catatan penting:**  
Jangan hanya menjawab service worker "untuk membuat aplikasi offline". Itu terlalu umum.

### 18. [Tinggi] Apa bedanya cache dan IndexedDB?

**Maksud pertanyaan:**  
Penguji teknis sering menanyakan ini.

**Jawaban aman:**  
"Cache digunakan untuk menyimpan aset atau response agar aplikasi bisa dimuat lebih cepat, misalnya file statis, icon, dan halaman tertentu. IndexedDB digunakan untuk menyimpan data terstruktur, misalnya data kuis, jawaban offline, jadwal, kehadiran, materi, dan antrean sinkronisasi. Jadi cache lebih untuk resource aplikasi, sedangkan IndexedDB untuk data aplikasi."

**Catatan penting:**  
Jangan menyamakan cache dan database.

### 19. [Tinggi] Data apa saja yang bisa disimpan untuk kebutuhan offline?

**Maksud pertanyaan:**  
Penguji ingin tahu fitur offline yang nyata.

**Jawaban aman:**  
"Data yang disiapkan untuk offline meliputi data kuis, soal, jawaban offline, attempt kuis, materi, kelas, nilai, jadwal, kehadiran, data pengguna tertentu, metadata, dan sync queue. Data tersebut disimpan secara lokal menggunakan IndexedDB."

**Catatan penting:**  
Sebut "data tertentu", jangan mengklaim semua data selalu tersedia offline.

### 20. [Pasti] Bagaimana alur saat pengguna offline?

**Maksud pertanyaan:**  
Penguji ingin alur proses.

**Jawaban aman:**  
"Saat pengguna offline, aplikasi tetap dapat menampilkan data yang sudah tersimpan di cache atau IndexedDB. Jika pengguna melakukan operasi yang membutuhkan koneksi, data tidak langsung hilang, tetapi disimpan sebagai antrean offline. Setelah koneksi kembali, sistem melakukan sinkronisasi ke server."

**Catatan penting:**  
Alur mudah: baca lokal, tulis antrean, sinkron saat online.

### 21. [Pasti] Bagaimana sinkronisasi dilakukan setelah online?

**Maksud pertanyaan:**  
Penguji ingin detail mekanisme.

**Jawaban aman:**  
"Data yang dibuat saat offline dimasukkan ke sync queue. Ketika koneksi kembali tersedia, sync manager memproses antrean tersebut secara bertahap. Jika berhasil, status data diperbarui menjadi selesai. Jika gagal, sistem dapat melakukan retry sesuai batas percobaan."

**Catatan penting:**  
Sebut queue, status, dan retry.

### 22. [Sedang] Bagaimana jika terjadi konflik data saat sinkronisasi?

**Maksud pertanyaan:**  
Penguji menguji kelemahan PWA.

**Jawaban aman:**  
"Pada sistem, konflik data diantisipasi melalui mekanisme conflict resolver dan versioning pada bagian tertentu. Namun saya tetap membatasi klaim bahwa sistem menangani konflik pada cakupan yang sudah diimplementasikan dan diuji. Untuk kasus yang lebih kompleks, mekanisme resolusi konflik masih bisa dikembangkan lebih lanjut."

**Catatan penting:**  
Jangan mengklaim semua konflik pasti selesai otomatis.

### 23. [Sedang] Apakah aplikasi bisa di-install seperti aplikasi mobile?

**Maksud pertanyaan:**  
Penguji mengecek karakteristik PWA.

**Jawaban aman:**  
"Ya, aplikasi memiliki manifest dan prompt install PWA, sehingga pada perangkat yang mendukung, aplikasi dapat dipasang dari browser dan dibuka seperti aplikasi. Namun secara teknis tetap berbasis web, bukan aplikasi native."

**Catatan penting:**  
Bedakan PWA dari native app.

### 24. [Tinggi] Kenapa memilih PWA dibanding Android native?

**Maksud pertanyaan:**  
Penguji ingin alasan keputusan teknologi.

**Jawaban aman:**  
"PWA dipilih karena lebih fleksibel untuk lintas perangkat, dapat diakses melalui browser, tidak harus melalui instalasi dari Play Store, dan tetap mendukung fitur seperti cache, offline access, serta install prompt. Untuk lingkungan kampus, PWA lebih praktis karena pengguna bisa memakai laptop maupun smartphone."

**Catatan penting:**  
Jangan menjelekkan native. Katakan PWA paling sesuai kebutuhan penelitian.

### 25. [Sedang] Apa bukti PWA benar-benar diterapkan?

**Maksud pertanyaan:**  
Penguji ingin bukti, bukan klaim.

**Jawaban aman:**  
"Buktinya terlihat dari adanya konfigurasi PWA, service worker, manifest aplikasi, ikon PWA, indikator status jaringan, fitur offline sync, IndexedDB untuk penyimpanan lokal, dan pengujian pada modul offline/PWA. Selain itu, pada aplikasi terdapat prompt install dan halaman offline sync."

**Catatan penting:**  
Sebut bukti fitur dan bukti pengujian.

## F. Pertanyaan Pengujian

### 26. [Pasti] Mengapa menggunakan black box testing?

**Maksud pertanyaan:**  
Penguji ingin alasan metode uji.

**Jawaban aman:**  
"Black box digunakan untuk memastikan fungsi sistem berjalan sesuai kebutuhan pengguna tanpa melihat kode program. Karena sistem ini memiliki banyak fitur berdasarkan peran, black box cocok untuk memeriksa apakah input dan output tiap fitur sudah sesuai."

**Catatan penting:**  
Black box berarti menguji fungsi dari sisi pengguna.

### 27. [Pasti] Apa arti hasil black box 45 skenario lulus 100%?

**Maksud pertanyaan:**  
Penguji mengecek batas klaim Anda.

**Jawaban aman:**  
"Artinya seluruh skenario yang diuji berhasil menghasilkan keluaran sesuai harapan. Namun, hasil 100% ini berlaku pada skenario yang telah ditentukan, bukan berarti sistem pasti bebas dari semua kemungkinan kesalahan."

**Catatan penting:**  
Jawaban ini aman agar tidak overclaim.

### 28. [Tinggi] Mengapa ada white box testing, padahal proposal mungkin lebih menekankan fungsionalitas dan usability?

**Maksud pertanyaan:**  
Penguji mempertanyakan tambahan pengujian.

**Jawaban aman:**  
"White box saya gunakan sebagai penguatan kualitas teknis. Black box membuktikan fungsi dari sisi pengguna, sedangkan white box membuktikan logika internal pada modul yang diuji. Jadi white box melengkapi pengujian, bukan menggantikan evaluasi utama."

**Catatan penting:**  
White box adalah pelengkap atau penguatan kualitas teknis.

### 29. [Tinggi] Apa arti 5.231 test case lulus?

**Maksud pertanyaan:**  
Penguji menguji pemahaman hasil.

**Jawaban aman:**  
"Artinya berdasarkan snapshot pengujian, modul-modul yang masuk cakupan test berhasil dijalankan tanpa kegagalan. Ini menunjukkan stabilitas logika internal sistem pada cakupan pengujian tersebut. Tetapi saya tidak mengklaim bahwa semua kemungkinan jalur program sudah pasti diuji."

**Catatan penting:**  
Hafalkan frasa "pada cakupan pengujian tersebut".

### 30. [Pasti] Mengapa menggunakan SUS?

**Maksud pertanyaan:**  
Penguji ingin alasan usability.

**Jawaban aman:**  
"SUS digunakan karena sederhana, umum digunakan, dan dapat memberikan nilai kuantitatif mengenai kemudahan penggunaan sistem. Karena penelitian ini tidak hanya ingin membuktikan fungsi berjalan, tetapi juga apakah sistem dapat diterima pengguna, SUS menjadi metode yang sesuai."

**Catatan penting:**  
SUS menjelaskan kemudahan penggunaan dan penerimaan pengguna.

### 31. [Pasti] Apa makna skor SUS 75,11?

**Maksud pertanyaan:**  
Penguji ingin interpretasi hasil.

**Jawaban aman:**  
"Skor 75,11 berada pada kategori Good, Grade B, dan acceptable. Artinya secara umum sistem dinilai mudah digunakan dan dapat diterima oleh pengguna. Namun, skor tersebut tidak berarti sistem sempurna, karena masih ada variasi pengalaman pengguna."

**Catatan penting:**  
Sebut Good, acceptable, dan tidak sempurna.

### 32. [Sedang] Mengapa responden tidak hanya mahasiswa dan dosen?

**Maksud pertanyaan:**  
Penguji mengecek konsistensi proposal.

**Jawaban aman:**  
"Dosen dan mahasiswa tetap menjadi fokus utama. Namun karena implementasi akhir sistem juga melibatkan admin dan laboran sebagai peran pendukung, maka mereka ikut dilibatkan agar evaluasi usability mencerminkan penggunaan aplikasi secara lebih lengkap."

**Catatan penting:**  
Jangan mengatakan proposal berubah. Katakan evaluasi diperluas sesuai implementasi.

## G. Pertanyaan Kritik, Kelemahan, dan Pengembangan

### 33. [Pasti] Apa kelemahan sistem Anda?

**Maksud pertanyaan:**  
Penguji ingin melihat kejujuran akademik.

**Jawaban aman:**  
"Kelemahannya, sistem masih dapat dikembangkan dari sisi penyempurnaan pengalaman pengguna, perluasan cakupan pengujian, optimasi sinkronisasi offline untuk kasus konflik yang lebih kompleks, serta penguatan analitik atau monitoring penggunaan sistem."

**Catatan penting:**  
Jawab kelemahan sebagai ruang pengembangan, bukan kegagalan.

### 34. [Tinggi] Apakah sistem ini siap digunakan secara penuh?

**Maksud pertanyaan:**  
Penguji menguji batas klaim.

**Jawaban aman:**  
"Sistem sudah dapat digunakan pada cakupan fitur yang dikembangkan dan diuji. Namun untuk penggunaan penuh di lingkungan institusi, tetap diperlukan tahap implementasi bertahap, monitoring, pelatihan pengguna, dan evaluasi lanjutan."

**Catatan penting:**  
Jangan mengklaim langsung siap 100% untuk produksi institusi.

### 35. [Sedang] Bagaimana keamanan data pengguna?

**Maksud pertanyaan:**  
Penguji teknis atau penguji yang serius terhadap data mungkin menanyakan ini.

**Jawaban aman:**  
"Keamanan data didukung melalui autentikasi, pembagian peran pengguna, dan pembatasan akses sesuai kewenangan. Karena backend menggunakan Supabase, pengelolaan akses data juga dapat diperkuat melalui kebijakan database. Namun keamanan tetap perlu dievaluasi terus, terutama jika sistem digunakan lebih luas."

**Catatan penting:**  
Jangan mengklaim "sangat aman". Katakan "didukung" dan "perlu evaluasi lanjutan".

### 36. [Sedang] Apa risiko dari fitur offline?

**Maksud pertanyaan:**  
Penguji ingin tahu Anda paham konsekuensi PWA.

**Jawaban aman:**  
"Risiko fitur offline adalah kemungkinan data lokal belum tersinkron, konflik data ketika ada perubahan dari lebih dari satu sumber, dan keterbatasan data yang tersedia saat offline. Karena itu sistem menggunakan queue, status sinkronisasi, retry, dan mekanisme conflict handling pada cakupan tertentu."

**Catatan penting:**  
Jawaban ini menunjukkan kedewasaan teknis.

### 37. [Sedang] Jika koneksi putus saat mahasiswa mengerjakan kuis, apa yang terjadi?

**Maksud pertanyaan:**  
Penguji memberi skenario konkret.

**Jawaban aman:**  
"Jika data kuis sudah tersedia secara lokal, mahasiswa tetap dapat melanjutkan pengerjaan pada cakupan data yang tersimpan. Jawaban dapat disimpan secara lokal terlebih dahulu, lalu disinkronkan ketika koneksi kembali tersedia. Namun ini tetap bergantung pada data kuis yang sudah pernah dicache atau disiapkan sebelumnya."

**Catatan penting:**  
Kuncinya: tergantung data sudah tersedia lokal.

### 38. [Lanjutan] Bagaimana jika data offline gagal sinkron?

**Maksud pertanyaan:**  
Penguji teknis menggali reliabilitas.

**Jawaban aman:**  
"Jika sinkronisasi gagal, item tidak langsung dihapus. Statusnya dapat ditandai gagal dan sistem dapat melakukan percobaan ulang sesuai batas retry. Dengan begitu data offline tetap terlacak dan tidak langsung hilang."

**Catatan penting:**  
Sebut retry dan status.

### 39. [Tinggi] Apa kontribusi ilmiah penelitian Anda?

**Maksud pertanyaan:**  
Penguji ingin nilai akademik, bukan hanya aplikasi.

**Jawaban aman:**  
"Kontribusi ilmiahnya adalah menghasilkan model analisis, rancangan, implementasi, dan evaluasi sistem informasi praktikum berbasis PWA pada konteks pendidikan vokasi kebidanan. Penelitian ini menunjukkan bagaimana kebutuhan praktikum dapat diterjemahkan menjadi sistem berbasis peran, didukung offline access, dan dievaluasi melalui fungsionalitas, logika internal, serta usability."

**Catatan penting:**  
Jangan menjawab hanya "membuat aplikasi".

### 40. [Pasti] Apa kesimpulan utama penelitian Anda?

**Maksud pertanyaan:**  
Penguji biasanya meminta ringkasan akhir.

**Jawaban aman:**  
"Kesimpulan utama penelitian ini adalah sistem informasi praktikum berbasis PWA berhasil dianalisis, dirancang, diimplementasikan, dan diuji. Sistem mendukung pengelolaan praktikum melalui fitur berbasis peran, memiliki dukungan PWA/offline, hasil black box menunjukkan fungsi utama berjalan sesuai skenario, white box menunjukkan logika internal stabil pada cakupan pengujian, dan SUS menunjukkan sistem berada pada kategori Good serta dapat diterima pengguna."

**Catatan penting:**  
Ini bisa menjadi jawaban penutup paling kuat.

