# Persiapan Jawaban Sidang Skripsi

## Judul Skripsi
**Analisis dan Perancangan Sistem Informasi Praktikum Berbasis Progressive Web Application (PWA) Menggunakan Metode R&D di Akademi Kebidanan Mega Buana**

## Tujuan Dokumen
Dokumen ini disusun sebagai bahan latihan sidang berdasarkan struktur skripsi asli per sub-bab. Fokusnya adalah:
1. kemungkinan pertanyaan penguji dari Bab I sampai Bab VI,
2. jawaban yang aman, logis, dan bisa dipertahankan,
3. penguatan argumen metodologis,
4. penekanan khusus pada evaluasi usability menggunakan **System Usability Scale (SUS)**,
5. jawaban khusus untuk isu: **mengapa SUS tidak diuji validitas ulang**.

---

# STRATEGI UMUM MENJAWAB SAAT SIDANG

## Pola Jawaban Aman
Gunakan pola berikut saat menjawab:
1. mulai dari konteks masalah,
2. kaitkan dengan tujuan penelitian,
3. jelaskan alasan metode atau desain,
4. tutup dengan hasil penelitian,
5. akui keterbatasan secara ilmiah bila diperlukan.

## Template Jawaban Aman
> “Dalam penelitian ini saya berangkat dari masalah pengelolaan praktikum yang masih manual dan belum terintegrasi. Karena tujuan penelitian saya bukan hanya menganalisis masalah tetapi juga menghasilkan solusi, saya menggunakan metode R&D. Hasil penelitian menunjukkan sistem berfungsi dengan baik berdasarkan pengujian black box, memiliki kestabilan logika internal berdasarkan unit test, dan memperoleh skor usability SUS 75,11 yang termasuk kategori Good dan Acceptable. Namun saya juga menyadari masih ada ruang pengembangan lanjutan, terutama pada pemerataan pengalaman pengguna dan evaluasi lebih luas.”

## Hal Inti yang Wajib Dikuasai
1. masalah utama: pengelolaan praktikum masih manual, tersebar, dan tidak terintegrasi,
2. alasan memilih PWA: ringan, lintas perangkat, bisa diinstal, mendukung offline,
3. alasan memilih R&D: penelitian menghasilkan produk dan mengevaluasi produk,
4. peran UCD: menjaga desain tetap berpusat pada kebutuhan pengguna,
5. peran RBAC: memisahkan hak akses admin, dosen, mahasiswa, dan laboran,
6. hasil utama:
   - black box: **45/45 skenario lulus (100%)**,
   - white box: **5.317 test case lulus (100%)**,
   - SUS: **75,11** dengan kategori **Good**, grade **B**, dan **Acceptable**,
7. keterbatasan utama:
   - responden SUS didominasi mahasiswa,
   - evaluasi usability masih berupa evaluasi awal,
   - belum ada pengujian keamanan komprehensif,
   - belum ada evaluasi implementasi jangka panjang skala institusi.

---

# BAB I PENDAHULUAN

## 1.1 Latar Belakang

### Kemungkinan Pertanyaan
**Mengapa topik ini penting diteliti?**

### Jawaban
Topik ini penting karena praktikum adalah komponen inti dalam pendidikan vokasi kebidanan. Praktikum menuntut pengelolaan jadwal, materi, logbook, penilaian, dan sarana laboratorium yang rapi. Pada kondisi awal, proses tersebut masih dilakukan secara manual dan tersebar, sehingga memunculkan miskomunikasi jadwal, keterlambatan pelaporan, kesulitan dokumentasi, dan rendahnya efisiensi kerja. Oleh karena itu, dibutuhkan sistem informasi yang terintegrasi dan mudah diakses lintas perangkat.

### Versi Singkat
> “Penelitian ini penting karena pengelolaan praktikum masih manual, tidak terintegrasi, dan tidak efisien. Saya menawarkan solusi sistem informasi praktikum berbasis PWA agar pengelolaan lebih terpusat, fleksibel, dan adaptif terhadap kondisi jaringan.”

---

## 1.2 Rumusan Masalah

### Kemungkinan Pertanyaan
**Apa inti rumusan masalah yang paling utama?**

### Jawaban
Inti rumusan masalah penelitian ini adalah bagaimana merancang dan mengembangkan sistem informasi praktikum berbasis PWA yang sesuai kebutuhan pengguna, serta bagaimana membuktikan bahwa sistem tersebut layak dari sisi fungsi, logika internal, dan usability. Jadi rumusan masalah bukan hanya soal membuat aplikasi, tetapi menyelesaikan masalah proses pengelolaan praktikum yang tidak terpadu.

### Jika Ditanya Lebih Tajam
> “Masalah utamanya bukan ketiadaan aplikasi semata, tetapi ketidakterpaduan proses. Karena itu rumusan masalah saya berfokus pada kebutuhan sistem, pengembangan solusi, dan evaluasi hasilnya.”

---

## 1.3 Batasan Masalah

### Kemungkinan Pertanyaan
**Mengapa penelitian Anda dibatasi pada ruang lingkup tertentu?**

### Jawaban
Batasan masalah dibuat agar penelitian tetap fokus, terukur, dan dapat diselesaikan secara ilmiah. Dalam penelitian ini saya membatasi pada pengembangan sistem informasi praktikum berbasis PWA, aktor utama yang terlibat, fitur-fitur inti praktikum, dan evaluasi sistem pada aspek fungsional, teknis, dan usability. Saya tidak memperluas penelitian ke semua aspek institusional seperti integrasi penuh dengan seluruh sistem kampus atau pengujian keamanan tingkat lanjut karena itu akan memperluas ruang lingkup secara berlebihan.

### Versi Singkat
> “Batasan masalah saya buat agar penelitian tetap fokus pada pengembangan artefak utama, yaitu sistem informasi praktikum berbasis PWA, dan tidak melebar ke ruang lingkup di luar tujuan penelitian.”

---

## 1.4 Tujuan Penelitian

### Kemungkinan Pertanyaan
**Apakah tujuan penelitian Anda sudah selaras dengan hasil yang diperoleh?**

### Jawaban
Ya. Tujuan penelitian saya meliputi analisis kebutuhan, perancangan dan pengembangan sistem, serta evaluasi hasil. Ketiga tujuan ini tercapai melalui identifikasi masalah di lapangan, implementasi sistem berbasis PWA, dan pengujian menggunakan black box, white box, serta SUS.

---

## 1.5 Manfaat Penelitian

### Kemungkinan Pertanyaan
**Apa manfaat praktis dan akademik dari penelitian ini?**

### Jawaban
Manfaat praktisnya adalah membantu institusi mengelola kegiatan praktikum secara lebih terintegrasi, efisien, dan terdokumentasi. Manfaat akademiknya adalah memberikan contoh penerapan metode R&D dalam pengembangan sistem informasi pendidikan, sekaligus menunjukkan relevansi PWA, RBAC, dan evaluasi usability dalam konteks pendidikan vokasi.

---

## 1.6 Keaslian Penelitian

### Kemungkinan Pertanyaan
**Apa novelty atau keaslian penelitian Anda?**

### Jawaban
Keaslian penelitian ini terletak pada kombinasi beberapa aspek: fokus pada sistem informasi praktikum, konteks pendidikan vokasi kebidanan, penerapan PWA dengan dukungan offline dan sinkronisasi, penggunaan metode R&D, serta penerapan RBAC untuk multi-peran. Jadi kebaruannya bukan berarti semua unsur benar-benar baru sendiri-sendiri, tetapi pada integrasi unsur-unsur tersebut dalam konteks yang spesifik dan nyata.

### Jika Penguji Berkata “Mirip Penelitian Lain”
> “Benar, unsur sistem informasi, PWA, dan usability sudah pernah dipakai di penelitian lain. Namun kebaruan penelitian saya ada pada integrasi teknologi dan pendekatan tersebut untuk sistem praktikum multi-peran pada pendidikan vokasi kebidanan dengan kebutuhan offline-first yang nyata.”

---

# BAB II TINJAUAN PUSTAKA

## 2.1 Kajian Penelitian Terdahulu

### Kemungkinan Pertanyaan
**Mengapa penelitian terdahulu yang Anda pilih relevan?**

### Jawaban
Penelitian terdahulu dipilih berdasarkan relevansi terhadap tiga aspek utama: sistem informasi praktikum atau akademik, penggunaan PWA atau teknologi web modern, serta metode pengembangan dan evaluasi usability. Dengan demikian, kajian pustaka saya bukan sekadar daftar penelitian yang mirip judul, tetapi dasar konseptual untuk menjelaskan masalah, teknologi, dan pendekatan evaluasi yang saya gunakan.

### Kemungkinan Pertanyaan
**Apakah kajian pustaka Anda hanya deskriptif?**

### Jawaban
Secara penulisan memang ada bagian yang deskriptif, tetapi unsur kritisnya saya letakkan pada perbandingan fokus, konteks, fitur, dan keterbatasan penelitian terdahulu. Dari situlah saya menunjukkan posisi penelitian saya.

---

## 2.2 Analisis Kesenjangan Penelitian

### Kemungkinan Pertanyaan
**Apa gap penelitian Anda?**

### Jawaban
Gap penelitian terletak pada fakta bahwa banyak penelitian sebelumnya masih berfokus pada web konvensional, belum menekankan dukungan offline, belum mengintegrasikan kebutuhan akademik dan operasional laboratorium, dan belum spesifik pada konteks pendidikan vokasi kebidanan. Penelitian saya berusaha mengisi gap tersebut melalui sistem praktikum berbasis PWA yang mendukung multi-peran dan offline-first.

### Versi Singkat
> “Gap utama penelitian saya adalah belum banyak sistem praktikum pada konteks vokasi kebidanan yang menggabungkan integrasi proses, multi-peran, dan dukungan PWA offline-first.”

---

# BAB III LANDASAN TEORI

## 3.1 Progressive Web Application (PWA)

### Kemungkinan Pertanyaan
**Mengapa memilih PWA, bukan aplikasi mobile native?**

### Jawaban
PWA dipilih karena lebih efisien untuk pengembangan lintas perangkat, dapat diakses melalui browser, dapat diinstal seperti aplikasi, mendukung offline melalui service worker dan cache, serta tidak membutuhkan distribusi melalui app store. Dalam konteks penelitian ini, PWA lebih sesuai dengan kebutuhan institusi yang membutuhkan solusi cepat diadopsi dan hemat sumber daya.

---

## 3.1.1 Komponen Teknologi PWA

### Kemungkinan Pertanyaan
**Apa komponen utama PWA yang Anda gunakan?**

### Jawaban
Komponen utama PWA yang saya gunakan meliputi web app manifest, service worker, strategi caching, indikator status online/offline, antrean offline, dan sinkronisasi data saat koneksi kembali. Komponen-komponen ini membedakan PWA dari web responsif biasa.

---

## 3.1.2 Relevansi dengan Penelitian

### Kemungkinan Pertanyaan
**Mengapa PWA relevan untuk sistem praktikum?**

### Jawaban
PWA relevan karena praktikum sering dijalankan dalam kondisi mobilitas tinggi dan kualitas jaringan yang tidak selalu stabil. Dengan PWA, pengguna tetap dapat mengakses sistem, menyimpan data sementara, dan melakukan sinkronisasi saat koneksi pulih. Ini membuat sistem lebih adaptif terhadap kondisi lapangan.

---

## 3.2 Sistem Informasi

### Kemungkinan Pertanyaan
**Mengapa konsep sistem informasi penting dalam penelitian ini?**

### Jawaban
Karena penelitian ini tidak sekadar membuat aplikasi tampilan, tetapi membangun sistem yang mengelola input, proses, penyimpanan, dan output informasi praktikum secara terintegrasi. Jadi konsep sistem informasi menjadi dasar ilmiah untuk memahami fungsi sistem yang dikembangkan.

---

## 3.2.1 Sistem

### Kemungkinan Pertanyaan
**Apa makna sistem dalam konteks penelitian Anda?**

### Jawaban
Sistem adalah sekumpulan komponen yang saling berinteraksi untuk mencapai tujuan tertentu. Dalam penelitian saya, komponen tersebut mencakup pengguna, data, proses, aturan akses, dan mekanisme layanan digital yang bersama-sama mendukung pengelolaan praktikum.

---

## 3.2.2 Informasi

### Kemungkinan Pertanyaan
**Apa yang dimaksud informasi pada sistem ini?**

### Jawaban
Informasi adalah data yang telah diolah sehingga bermakna dan dapat digunakan untuk pengambilan keputusan. Dalam sistem saya, contoh informasi adalah jadwal praktikum, status logbook, nilai, pengumuman, dan data inventaris yang telah disajikan secara terstruktur.

---

## 3.2.3 Relevansi dengan Penelitian

### Kemungkinan Pertanyaan
**Mengapa teori sistem dan informasi perlu dipisah?**

### Jawaban
Karena sistem menekankan hubungan antar-komponen dan proses, sedangkan informasi menekankan nilai guna data setelah diolah. Keduanya penting agar sistem yang dibangun tidak hanya berjalan secara teknis, tetapi juga menghasilkan keluaran yang bermakna bagi pengguna.

---

## 3.3 Perancangan Sistem

### Kemungkinan Pertanyaan
**Mengapa perancangan sistem perlu dijelaskan sebelum implementasi?**

### Jawaban
Perancangan sistem diperlukan agar implementasi tidak dilakukan secara trial and error. Dengan perancangan yang baik, aliran data, fungsi, hubungan antar-entitas, dan pembagian peran dapat dipetakan lebih dulu sehingga pengembangan menjadi lebih terarah dan konsisten.

---

## 3.3.1 Relevansi dengan Penelitian

### Kemungkinan Pertanyaan
**Apa manfaat praktis dari perancangan sistem pada penelitian Anda?**

### Jawaban
Perancangan sistem membantu saya memetakan kebutuhan aktor, modul, data, dan integrasi fitur sebelum implementasi. Ini penting karena sistem yang saya bangun melibatkan beberapa peran dan alur proses yang kompleks.

---

## 3.4 Role-Based Access Control (RBAC)

### Kemungkinan Pertanyaan
**Mengapa menggunakan RBAC?**

### Jawaban
RBAC digunakan karena sistem memiliki beberapa jenis pengguna dengan hak akses yang berbeda. Admin, dosen, mahasiswa, dan laboran tidak boleh memiliki akses yang sama. Dengan RBAC, sistem dapat menerapkan prinsip **least privilege**, yaitu setiap pengguna hanya mendapat hak akses sesuai perannya.

### Referensi Kuat
**Ferraiolo, Sandhu, Kuhn, dan Chandramouli (2001)** banyak dirujuk untuk konsep RBAC.

---

## 3.4.1 Prinsip Dasar RBAC

### Kemungkinan Pertanyaan
**Apa prinsip dasar RBAC yang Anda terapkan?**

### Jawaban
Prinsip dasarnya adalah pemisahan hak akses berdasarkan peran, bukan diberikan langsung secara bebas ke setiap individu. Ini memudahkan pengelolaan akses dan mengurangi risiko penyalahgunaan fungsi sistem.

---

## 3.4.2 Komponen Utama RBAC

### Kemungkinan Pertanyaan
**Apa komponen RBAC yang terlihat pada sistem Anda?**

### Jawaban
Komponen utamanya adalah pengguna, peran, hak akses, dan aturan hubungan antar-ketiganya. Dalam sistem saya, setiap pengguna dikaitkan dengan peran tertentu, dan peran itu menentukan fitur apa saja yang boleh diakses.

---

## 3.4.3 Keuntungan RBAC

### Kemungkinan Pertanyaan
**Apa keuntungan RBAC pada sistem ini?**

### Jawaban
Keuntungannya adalah keamanan akses lebih terstruktur, sistem lebih mudah dikelola, pembagian tugas lebih jelas, dan audit penggunaan fitur menjadi lebih mudah dilakukan.

---

## 3.4.4 Relevansi dengan Penelitian

### Kemungkinan Pertanyaan
**Mengapa RBAC sangat relevan pada sistem praktikum?**

### Jawaban
Karena praktikum melibatkan aktor dengan tugas sangat berbeda. Tanpa RBAC, fitur dan data sensitif bisa diakses pihak yang tidak berwenang. Jadi RBAC penting agar rancangan sistem sesuai dengan kondisi kerja nyata.

---

## 3.5 User-Centered Design (UCD)

### Kemungkinan Pertanyaan
**Mengapa Anda memakai UCD padahal metode utama Anda R&D?**

### Jawaban
UCD saya gunakan sebagai pendekatan desain, bukan sebagai metode penelitian utama. R&D memberi kerangka untuk menghasilkan dan mengevaluasi produk, sedangkan UCD memastikan produk tersebut dikembangkan berdasarkan kebutuhan, konteks, dan umpan balik pengguna. Jadi keduanya saling melengkapi, bukan bertentangan.

---

## 3.6 Pengembangan Web

### Kemungkinan Pertanyaan
**Mengapa teori pengembangan web dimasukkan ke landasan teori?**

### Jawaban
Karena sistem yang saya bangun adalah aplikasi web modern berbasis PWA. Maka teori pengembangan web dibutuhkan untuk menjelaskan alasan pemilihan pendekatan teknologi, arsitektur aplikasi, dan praktik implementasi yang saya gunakan.

---

## 3.6.1 Model Pengembangan Sistem Web

### Kemungkinan Pertanyaan
**Mengapa tidak memakai model waterfall murni?**

### Jawaban
Karena kebutuhan pengguna pada sistem praktikum bisa berkembang selama proses desain dan implementasi. Model yang lebih iteratif lebih sesuai agar sistem dapat disempurnakan berdasarkan masukan pengguna. Dalam penelitian ini hal itu diwadahi oleh R&D dan prototipe iteratif.

---

## 3.6.2 Teknologi Pengembangan Aplikasi Web

### Kemungkinan Pertanyaan
**Mengapa memilih React, TypeScript, Vite, Supabase, dan Tailwind?**

### Jawaban
Pemilihan teknologi dilakukan berdasarkan kesesuaian fungsi. React mendukung antarmuka modular, TypeScript membantu konsistensi tipe data, Vite mempercepat pengembangan frontend, Supabase menyediakan backend-as-a-service yang mendukung auth, database, dan storage, sedangkan Tailwind membantu pembuatan UI responsif secara efisien.

---

## 3.6.3 Relevansi Model Pengembangan dengan Penelitian

### Kemungkinan Pertanyaan
**Apa relevansi model pengembangan web terhadap tujuan penelitian?**

### Jawaban
Model pengembangan yang saya gunakan mendukung pembuatan sistem yang iteratif, modular, dan responsif terhadap kebutuhan pengguna. Hal ini sesuai dengan karakter penelitian pengembangan yang tidak berhenti pada analisis, tetapi juga menghasilkan artefak fungsional.

---

## 3.7 Metode Research and Development (R&D)

### Kemungkinan Pertanyaan
**Mengapa memilih metode R&D?**

### Jawaban
R&D dipilih karena tujuan penelitian ini adalah menghasilkan produk dan mengevaluasi produk tersebut. Metode ini tepat karena penelitian saya tidak hanya mendeskripsikan fenomena, tetapi juga menghasilkan artefak berupa sistem informasi praktikum berbasis PWA yang kemudian diuji.

### Referensi Kuat
**Sugiyono (2017)** menjelaskan bahwa R&D digunakan untuk menghasilkan produk tertentu dan menguji keefektifannya.

---

## 3.7.1 Relevansi dengan Penelitian

### Kemungkinan Pertanyaan
**Mengapa R&D paling sesuai untuk skripsi Anda?**

### Jawaban
Karena penelitian saya berangkat dari masalah nyata di lapangan, lalu merancang solusi, mengembangkan sistem, melakukan pengujian, dan mengevaluasi hasilnya. Alur ini sangat sesuai dengan karakteristik penelitian pengembangan.

---

# BAB IV METODOLOGI PENELITIAN

## 4.1 Studi Literatur

### Kemungkinan Pertanyaan
**Apa fungsi studi literatur dalam penelitian Anda?**

### Jawaban
Studi literatur digunakan untuk memperkuat dasar teoritis, memetakan penelitian terdahulu, memilih pendekatan yang relevan, dan menyusun landasan argumentasi ilmiah sebelum sistem dikembangkan.

---

## 4.2 Identifikasi Masalah

### Kemungkinan Pertanyaan
**Bagaimana Anda mengidentifikasi masalah penelitian?**

### Jawaban
Masalah diidentifikasi melalui observasi, telaah proses yang berjalan, serta pengumpulan informasi dari pihak terkait. Dari tahap ini terlihat adanya kendala integrasi data, pengelolaan jadwal, logbook, penilaian, dan keterbatasan akses sistem secara fleksibel.

---

## 4.3 Penetapan Tujuan

### Kemungkinan Pertanyaan
**Bagaimana tujuan penelitian diturunkan dari masalah?**

### Jawaban
Tujuan ditetapkan langsung dari masalah yang ditemukan. Karena masalah utamanya adalah ketidakterpaduan pengelolaan praktikum, maka tujuan penelitiannya adalah menghasilkan sistem yang mampu mengintegrasikan proses tersebut dan mengevaluasi kelayakannya.

---

## 4.4 Perancangan dan Pengembangan

### Kemungkinan Pertanyaan
**Mengapa tahap perancangan dan pengembangan digabung?**

### Jawaban
Karena dalam penelitian pengembangan, desain dan implementasi saling berkaitan erat. Perancangan menghasilkan model sistem, sedangkan pengembangan merealisasikan model tersebut ke dalam artefak yang dapat diuji.

---

## 4.4.1 Desain Arsitektur Sistem

### Kemungkinan Pertanyaan
**Mengapa arsitektur sistem penting dibahas?**

### Jawaban
Arsitektur sistem penting karena menjelaskan bagaimana komponen frontend, backend, database, autentikasi, dan mekanisme PWA saling berinteraksi. Ini menunjukkan bahwa sistem dibangun secara terstruktur, bukan sekadar kumpulan halaman.

---

## 4.4.2 Pengembangan Prototipe Iteratif

### Kemungkinan Pertanyaan
**Mengapa memakai prototipe iteratif?**

### Jawaban
Prototipe iteratif dipakai agar sistem bisa disempurnakan bertahap berdasarkan temuan selama pengembangan dan masukan pengguna. Ini sesuai dengan karakter sistem praktikum yang memiliki banyak aktor dan alur kerja yang mungkin perlu penyesuaian.

---

## 4.5 Pengujian

### Kemungkinan Pertanyaan
**Mengapa pengujian Anda terdiri dari beberapa jenis?**

### Jawaban
Karena satu jenis pengujian tidak cukup untuk menggambarkan kualitas sistem secara utuh. Saya menggunakan black box untuk fungsi, white box untuk logika internal, dan SUS untuk persepsi usability pengguna. Kombinasi ini memberi gambaran yang lebih lengkap.

---

## 4.5.1 Pengujian Black Box

### Kemungkinan Pertanyaan
**Mengapa black box penting dalam penelitian ini?**

### Jawaban
Black box penting untuk memastikan bahwa fitur sistem berjalan sesuai kebutuhan pengguna. Fokusnya pada input, proses, dan output yang tampak dari sudut pandang penggunaan nyata.

---

## 4.5.2 Pengujian White Box / Unit Test

### Kemungkinan Pertanyaan
**Mengapa Anda menambahkan white box atau unit test?**

### Jawaban
Karena sistem memiliki logika internal yang cukup kompleks, terutama pada validasi, integrasi modul, offline queue, dan sinkronisasi. Unit test diperlukan untuk memperkuat kualitas teknis sistem, bukan hanya tampilan luar.

---

## 4.5.3 Uji Coba Iteratif Pengguna dan Dukungan Offline

### Kemungkinan Pertanyaan
**Mengapa uji coba iteratif dan dukungan offline dibahas khusus?**

### Jawaban
Karena salah satu keunggulan utama sistem ini adalah dukungan PWA dan kondisi penggunaan yang tidak selalu stabil secara jaringan. Maka uji coba terhadap perilaku offline dan penyempurnaan bertahap menjadi bagian penting dari metodologi.

---

## 4.6 Evaluasi Hasil

### Kemungkinan Pertanyaan
**Apa perbedaan pengujian dan evaluasi dalam penelitian Anda?**

### Jawaban
Pengujian lebih berfokus pada verifikasi apakah sistem bekerja sesuai skenario, sedangkan evaluasi berfokus pada penilaian hasil secara lebih luas, termasuk apakah sistem layak digunakan dan diterima oleh pengguna.

---

## 4.6.1 Evaluasi Fungsional Sistem

### Kemungkinan Pertanyaan
**Bagaimana Anda menyatakan sistem layak secara fungsional?**

### Jawaban
Kelayakan fungsional ditunjukkan oleh keberhasilan skenario black box yang mencakup fungsi-fungsi utama sistem. Dengan hasil 45 dari 45 skenario lulus, sistem dapat dinyatakan berjalan sesuai kebutuhan pada ruang lingkup uji yang ditetapkan.

---

## 4.6.2 Evaluasi Usability Menggunakan System Usability Scale (SUS)

### Kemungkinan Pertanyaan
**Mengapa memilih SUS?**

### Jawaban
SUS dipilih karena sederhana, efisien, hanya terdiri dari 10 item, dan telah digunakan secara luas dalam evaluasi usability berbagai sistem. SUS juga memberikan skor kuantitatif global yang mudah diinterpretasikan sehingga cocok untuk evaluasi usability pada penelitian pengembangan sistem.

### Referensi
- **Brooke (1996)** sebagai pengembang SUS,
- **Bangor, Kortum, dan Miller (2008)** untuk interpretasi adjective rating,
- **Sauro dan Lewis (2016)** untuk pembahasan lanjutan penggunaan SUS.

---

## 4.7 Komunikasi Hasil

### Kemungkinan Pertanyaan
**Mengapa komunikasi hasil menjadi tahap penelitian?**

### Jawaban
Karena penelitian tidak berhenti pada pengembangan artefak. Hasil penelitian harus disusun, dijelaskan, dan dikomunikasikan secara ilmiah agar dapat dipahami, ditelaah, dan dimanfaatkan pihak lain.

---

## 4.8 Jadwal Penelitian

### Kemungkinan Pertanyaan
**Mengapa jadwal penelitian penting dicantumkan?**

### Jawaban
Jadwal penelitian menunjukkan bahwa proses penelitian dilakukan secara terencana, bertahap, dan realistis. Ini juga membantu membuktikan bahwa setiap tahapan memiliki alokasi waktu yang logis.

---

## 4.9 Teknik Analisis Data

### Kemungkinan Pertanyaan
**Mengapa Anda menggunakan analisis deskriptif kualitatif dan kuantitatif?**

### Jawaban
Karena data penelitian saya terdiri dari data kualitatif seperti observasi dan wawancara, serta data kuantitatif seperti hasil pengujian dan skor SUS. Keduanya perlu dianalisis dengan pendekatan yang sesuai agar hasil penelitian utuh dan tidak timpang.

---

## 4.10 Instrumen Penelitian

### Kemungkinan Pertanyaan
**Mengapa instrumen penelitian Anda beragam?**

### Jawaban
Karena setiap tahap penelitian membutuhkan alat pengumpulan data yang berbeda. Observasi dan wawancara dipakai saat identifikasi masalah, skenario uji dipakai untuk black box, unit test untuk verifikasi logika, dan SUS untuk evaluasi usability.

---

## 4.11 Kriteria Keberhasilan Penelitian

### Kemungkinan Pertanyaan
**Apa indikator keberhasilan penelitian Anda?**

### Jawaban
Penelitian dinyatakan berhasil jika sistem berhasil dikembangkan, fungsi utama berjalan sesuai kebutuhan, logika internal stabil, fitur PWA berjalan sesuai rancangan, dan usability sistem berada pada tingkat yang dapat diterima pengguna.

---

# BAB V HASIL DAN PEMBAHASAN

## 5.1 Hasil Perancangan Sistem

### Kemungkinan Pertanyaan
**Apa hasil utama tahap perancangan sistem?**

### Jawaban
Hasil utamanya adalah model sistem yang menjelaskan proses, aliran data, struktur database, dan relasi antar-entitas. Ini menjadi fondasi implementasi sistem agar tetap konsisten dengan kebutuhan pengguna dan tujuan penelitian.

---

## 5.1.1 DFD Level 1

### Kemungkinan Pertanyaan
**Mengapa memakai DFD Level 1?**

### Jawaban
DFD Level 1 digunakan untuk menunjukkan proses-proses utama sistem dan hubungan aliran data secara lebih rinci daripada diagram konteks. Ini membantu menjelaskan struktur logis sistem dari sudut pandang proses bisnis.

---

## 5.1.2 DFD Level 2

### Kemungkinan Pertanyaan
**Mengapa DFD dibatasi sampai Level 2?**

### Jawaban
Karena pada Level 2 detail proses utama sudah cukup jelas untuk menjelaskan mekanisme kerja sistem. Jika diturunkan lebih jauh, model akan terlalu teknis dan kurang proporsional untuk ruang lingkup skripsi.

---

## 5.1.3 Entity Relationship Diagram (ERD)

### Kemungkinan Pertanyaan
**Mengapa ERD diperlukan?**

### Jawaban
ERD diperlukan untuk memetakan hubungan antar-entitas data seperti pengguna, jadwal, logbook, nilai, dan komponen lain. Ini penting agar implementasi database tidak hanya berjalan, tetapi juga konsisten secara struktur.

---

## 5.1.4 Skema Database

### Kemungkinan Pertanyaan
**Apa fungsi menjelaskan skema database?**

### Jawaban
Skema database menunjukkan bagaimana rancangan data diterjemahkan ke struktur tabel yang konkret. Ini memperkuat keterkaitan antara desain konseptual dan implementasi teknis.

---

## 5.2 Hasil Implementasi Sistem

### Kemungkinan Pertanyaan
**Apa makna hasil implementasi dalam penelitian Anda?**

### Jawaban
Hasil implementasi menunjukkan bahwa rancangan yang telah dibuat dapat direalisasikan menjadi sistem yang benar-benar dapat digunakan. Ini membuktikan bahwa penelitian tidak berhenti pada model, tetapi menghasilkan artefak fungsional.

---

## 5.2.1 Implementasi Modul Autentikasi

### Kemungkinan Pertanyaan
**Mengapa autentikasi penting dibahas?**

### Jawaban
Karena autentikasi adalah gerbang akses seluruh sistem. Jika autentikasi tidak berjalan baik, maka keamanan sistem dan penerapan RBAC juga akan terganggu.

---

## 5.2.2 Implementasi Dashboard dan Fitur Admin

### Kemungkinan Pertanyaan
**Apa peran admin dalam sistem?**

### Jawaban
Admin bertanggung jawab pada pengelolaan data inti, manajemen pengguna, dan pengendalian sistem secara umum. Karena itu fitur admin penting sebagai pusat tata kelola sistem.

---

## 5.2.3 Implementasi Dashboard dan Fitur Dosen

### Kemungkinan Pertanyaan
**Apa fokus implementasi fitur dosen?**

### Jawaban
Fokusnya adalah mendukung aktivitas akademik dosen dalam praktikum, seperti memantau kegiatan, mengelola materi, menilai, dan melihat data yang relevan sesuai hak aksesnya.

---

## 5.2.4 Implementasi Dashboard dan Fitur Mahasiswa

### Kemungkinan Pertanyaan
**Mengapa fitur mahasiswa sangat penting?**

### Jawaban
Karena mahasiswa adalah pengguna dengan frekuensi interaksi tertinggi. Keberhasilan fitur mahasiswa sangat menentukan kebermanfaatan sistem secara nyata.

---

## 5.2.5 Implementasi Dashboard dan Fitur Laboran

### Kemungkinan Pertanyaan
**Mengapa laboran menjadi peran tersendiri?**

### Jawaban
Karena laboran memiliki fungsi operasional laboratorium yang berbeda dari admin dan dosen. Pemisahan ini penting agar sistem sesuai dengan proses kerja nyata dan penerapan RBAC lebih tepat.

---

## 5.2.6 Implementasi Fitur PWA (Progressive Web App)

### Kemungkinan Pertanyaan
**Apa bukti bahwa sistem Anda benar-benar PWA, bukan sekadar web responsif?**

### Jawaban
Buktinya adalah adanya web app manifest, service worker, kemampuan instalasi, cache lokal, indikator online/offline, antrean offline, dan mekanisme sinkronisasi saat koneksi kembali. Jadi sistem ini memenuhi karakteristik utama PWA.

---

## 5.3 Hasil Pengujian Black Box

### Kemungkinan Pertanyaan
**Apa tujuan black box testing dalam penelitian Anda?**

### Jawaban
Black box testing digunakan untuk memastikan fungsi sistem berjalan sesuai kebutuhan pengguna. Fokusnya pada perilaku fitur dari sisi input dan output, tanpa melihat struktur kode.

---

## 5.3.1 Autentikasi

### Kemungkinan Pertanyaan
**Mengapa autentikasi diuji secara khusus?**

### Jawaban
Karena autentikasi adalah titik awal semua akses sistem. Jika tahap ini bermasalah, maka seluruh alur penggunaan dan keamanan sistem ikut terdampak.

---

## 5.3.2 Fitur Admin

### Kemungkinan Pertanyaan
**Mengapa fitur admin diuji terpisah?**

### Jawaban
Karena admin memiliki fungsi yang sensitif terhadap pengelolaan data inti dan kontrol sistem. Pengujian terpisah memastikan tata kelola sistem berjalan sesuai rancangan.

---

## 5.3.3 Fitur Dosen

### Kemungkinan Pertanyaan
**Apa fokus pengujian fitur dosen?**

### Jawaban
Fokusnya adalah memastikan dosen dapat menjalankan fungsi akademik sesuai perannya, termasuk pemantauan, pengelolaan materi, dan penilaian praktikum.

---

## 5.3.4 Fitur Mahasiswa

### Kemungkinan Pertanyaan
**Mengapa fitur mahasiswa penting diuji secara khusus?**

### Jawaban
Karena mahasiswa merupakan pengguna utama sistem. Jika fitur mahasiswa tidak berjalan baik, maka manfaat sistem di lapangan akan sangat berkurang.

---

## 5.3.5 Fitur Laboran

### Kemungkinan Pertanyaan
**Mengapa fitur laboran tidak digabung dengan admin?**

### Jawaban
Karena laboran memiliki kebutuhan operasional laboratorium yang lebih spesifik. Pemisahan ini menjaga kesesuaian peran kerja dan kejelasan hak akses.

---

## 5.3.6 Fitur PWA

### Kemungkinan Pertanyaan
**Bagaimana fitur PWA diuji?**

### Jawaban
Pengujian dilakukan dengan memeriksa instalasi aplikasi, perilaku saat offline, cache, indikator koneksi, serta sinkronisasi saat koneksi kembali normal.

---

## 5.3.7 Rekapitulasi Pengujian Black Box

### Kemungkinan Pertanyaan
**Mengapa hasil black box bisa 100%? Apakah realistis?**

### Jawaban
Hasil 100% berarti seluruh skenario uji yang saya rancang dalam penelitian ini berhasil dijalankan sesuai hasil yang diharapkan. Ini tidak berarti sistem sempurna dalam segala kondisi, tetapi menunjukkan bahwa pada cakupan skenario uji yang telah ditetapkan, semua fungsi lolos.

### Jawaban Aman
> “Angka 100% harus dibaca dalam konteks skenario yang diuji, bukan berarti seluruh kemungkinan kondisi di luar penelitian sudah habis diuji.”

---

## 5.4 Hasil Pengujian White Box (Unit Test)

### Kemungkinan Pertanyaan
**Mengapa white box atau unit test dimasukkan ke skripsi?**

### Jawaban
Karena sistem yang dikembangkan memiliki banyak logika internal. Unit test diperlukan untuk membuktikan bahwa sistem tidak hanya tampak berjalan dari luar, tetapi juga diverifikasi secara teknis pada bagian internalnya.

---

## 5.4.1 Framework dan Infrastruktur Pengujian

### Kemungkinan Pertanyaan
**Mengapa framework pengujian perlu dijelaskan?**

### Jawaban
Karena hal itu menunjukkan bahwa pengujian dilakukan secara sistematis dan terdokumentasi, bukan hanya pengujian manual yang bersifat acak.

---

## 5.4.2 Struktur dan Distribusi File Test

### Kemungkinan Pertanyaan
**Mengapa struktur file test penting?**

### Jawaban
Karena struktur file test menunjukkan cakupan pengujian tersebar pada modul-modul yang relevan, sehingga verifikasi teknis lebih komprehensif.

---

## 5.4.3 Rincian Modul yang Diuji

### Kemungkinan Pertanyaan
**Modul apa yang paling penting diuji?**

### Jawaban
Modul yang paling penting adalah autentikasi, validasi data, pengelolaan peran, integrasi API, serta mekanisme offline dan sinkronisasi. Modul-modul ini berpengaruh besar terhadap kestabilan sistem secara keseluruhan.

---

## 5.4.4 Hasil Eksekusi Pengujian

### Kemungkinan Pertanyaan
**Apa arti 5.317 test case lulus 100%?**

### Jawaban
Artinya seluruh test case yang dirancang dan dieksekusi pada penelitian ini berhasil lulus. Ini menunjukkan kestabilan logika internal sistem pada cakupan pengujian yang dilakukan. Namun ini tetap tidak berarti sistem mutlak sempurna di semua kondisi dunia nyata.

---

## 5.5 Hasil Pengujian Usability (SUS)

### Kemungkinan Pertanyaan
**Mengapa SUS dipakai sebagai metode evaluasi usability?**

### Jawaban
Karena SUS adalah instrumen evaluasi usability yang sederhana, cepat, luas digunakan, dan mampu memberikan gambaran kuantitatif global tentang persepsi pengguna terhadap kemudahan penggunaan sistem.

---

## 5.5.1 Metode SUS

### Kemungkinan Pertanyaan
**Bagaimana cara menghitung SUS?**

### Jawaban
Perhitungannya mengikuti aturan standar SUS. Item ganjil dihitung dengan rumus **skor jawaban - 1**, item genap dihitung dengan rumus **5 - skor jawaban**, lalu seluruh skor dijumlahkan dan dikalikan **2,5** untuk memperoleh nilai akhir dalam skala 0 sampai 100.

### Versi Singkat
> “Saya menghitung SUS sesuai prosedur standar Brooke: item ganjil dikurangi 1, item genap adalah 5 dikurangi nilai jawaban, kemudian total dikalikan 2,5.”

---

## 5.5.2 Data Responden

### Kemungkinan Pertanyaan
**Mengapa responden SUS berjumlah 46 orang, dan apakah itu cukup?**

### Jawaban
Untuk evaluasi usability pada penelitian pengembangan sistem, jumlah 46 responden dapat dikatakan memadai untuk memberikan gambaran awal yang cukup kuat, apalagi responden berasal dari pengguna nyata sistem. Dalam banyak studi usability, yang lebih penting adalah keterkaitan responden dengan konteks penggunaan daripada sekadar jumlah yang sangat besar.

### Kemungkinan Pertanyaan
**Mengapa responden didominasi mahasiswa?**

### Jawaban
Karena mahasiswa adalah pengguna dengan intensitas interaksi tertinggi terhadap fitur inti sistem seperti jadwal, materi, kuis, logbook, nilai, dan penggunaan mobile. Dominasi mahasiswa masih relevan secara substantif, walaupun saya mengakui pemerataan responden antar-peran masih bisa ditingkatkan pada penelitian lanjutan.

---

## 5.5.3 Ringkasan Hasil Perhitungan Skor SUS

### Kemungkinan Pertanyaan
**Apa hasil utama SUS pada penelitian Anda?**

### Jawaban
Dari 46 responden diperoleh total skor kumulatif **1382** dan rata-rata skor SUS **75,11**. Nilai ini menunjukkan bahwa sistem secara umum dinilai cukup mudah digunakan dan diterima oleh pengguna.

---

## 5.5.4 Interpretasi Skor

### Kemungkinan Pertanyaan
**Apa arti skor SUS 75,11?**

### Jawaban
Skor **75,11** berada pada kategori **Good**, grade **B**, dan termasuk **Acceptable**. Artinya, usability sistem berada di atas rata-rata umum SUS yang sering dirujuk sekitar **68**, sehingga sistem dapat dinilai memiliki penerimaan pengguna yang baik.

### Jika Ditanya Lebih Kritis
> “Nilai ini belum berarti sistem sempurna, tetapi menunjukkan bahwa sistem sudah cukup matang dan dapat diterima pengguna. Ruang perbaikan tetap ada agar kualitas pengalaman pengguna meningkat lebih lanjut.”

---

## 5.6 Pembahasan

### Kemungkinan Pertanyaan
**Apa makna keseluruhan hasil penelitian Anda?**

### Jawaban
Makna utamanya adalah bahwa proses pengelolaan praktikum yang sebelumnya tidak terintegrasi dapat ditransformasikan menjadi sistem yang lebih terstruktur, terdokumentasi, dan adaptif. Penelitian ini menunjukkan bahwa kombinasi PWA, R&D, UCD, RBAC, dan evaluasi usability dapat menghasilkan solusi yang relevan untuk pendidikan vokasi.

---

## 5.6.1 Pembahasan Perancangan Sistem

### Kemungkinan Pertanyaan
**Apa nilai utama dari perancangan sistem Anda?**

### Jawaban
Nilai utamanya adalah adanya pemetaan proses, data, dan peran secara sistematis sejak awal. Ini membuat implementasi lebih terarah dan mengurangi risiko ketidaksesuaian antara kebutuhan dan sistem yang dibangun.

---

## 5.6.2 Pembahasan Implementasi

### Kemungkinan Pertanyaan
**Mengapa implementasi akhir tampak lebih luas dari proposal awal?**

### Jawaban
Perluasan implementasi terjadi karena proses pengembangan bersifat iteratif. Saat sistem dikembangkan, kebutuhan teknis dan operasional menjadi lebih jelas sehingga beberapa fitur tambahan dibutuhkan agar alur kerja sistem tetap utuh. Ini bukan penyimpangan, tetapi penyempurnaan artefak.

---

## 5.6.3 Pembahasan Black Box

### Kemungkinan Pertanyaan
**Apa makna hasil black box 100% bagi kualitas sistem?**

### Jawaban
Hasil ini menunjukkan bahwa dari sudut pandang fungsional, semua skenario yang diuji berjalan sesuai harapan. Jadi sistem layak secara fungsi pada ruang lingkup pengujian yang telah dirancang.

---

## 5.6.4 Pembahasan White Box

### Kemungkinan Pertanyaan
**Apa nilai akademik dari hasil white box?**

### Jawaban
Nilai akademiknya adalah memperkuat bukti bahwa sistem tidak hanya berhasil secara tampilan dan fungsi luar, tetapi juga memiliki kestabilan logika internal yang telah diverifikasi secara sistematis.

---

## 5.6.5 Pembahasan SUS

### Kemungkinan Pertanyaan
**Mengapa tidak dilakukan uji validitas pada instrumen SUS?**

### Jawaban Utama yang Paling Aman
Instrumen SUS tidak saya uji validitas ulang karena SUS merupakan **instrumen baku atau standardized questionnaire** yang telah dikembangkan dan digunakan secara luas dalam penelitian usability. Dalam penelitian ini saya tidak membuat item baru, tidak mengubah konstruk dasarnya, dan tidak menjadikan pengembangan instrumen sebagai tujuan penelitian. Fokus penelitian saya adalah mengevaluasi usability sistem yang dikembangkan, bukan memvalidasi ulang instrumen psikometrik.

### Penjelasan Metodologis
Uji validitas biasanya sangat diperlukan bila:
1. peneliti menyusun butir pertanyaan sendiri,
2. memodifikasi item secara substantif,
3. menggabungkan beberapa konstruk baru,
4. atau mengembangkan instrumen baru.

Sedangkan pada penelitian saya:
1. SUS tetap menggunakan **10 item standar**,
2. struktur penskoran tetap mengikuti prosedur asli,
3. penggunaan SUS ditujukan untuk evaluasi usability praktis,
4. penelitian tidak berfokus pada studi psikometrik instrumen.

Karena itu, secara metodologis saya menempatkan SUS sebagai instrumen standar yang digunakan sesuai prosedur aslinya.

### Jawaban Singkat Saat Sidang
> “Saya tidak melakukan uji validitas ulang pada SUS karena SUS adalah instrumen baku yang sudah tervalidasi luas dan saya menggunakannya sesuai struktur standar, bukan mengembangkan instrumen baru.”

### Jika Penguji Menekan Lagi
> “Saya memahami bahwa validasi lokal bisa dipandang sebagai penguatan tambahan, terutama bila fokus penelitian bergeser ke adaptasi budaya atau studi psikometrik. Namun dalam penelitian saya, SUS digunakan sebagai instrumen usability standar untuk evaluasi produk, bukan objek pengembangan instrumen. Karena itu saya berpegang pada validitas yang sudah established dalam literatur.”

### Jika Ditanya “Apakah Tanpa Uji Validitas Hasil SUS Menjadi Lemah?”
Tidak otomatis lemah, karena kekuatan SUS terletak pada statusnya sebagai instrumen standar yang telah banyak digunakan. Selain itu, hasil SUS pada penelitian saya tidak berdiri sendiri, tetapi didukung oleh hasil black box dan white box. Jadi penilaian sistem bersifat triangulatif: dari fungsi, logika internal, dan persepsi pengguna.

### Jika Ditanya “Mengapa Tidak Uji Reliabilitas Juga?”
Dalam penelitian ini saya memfokuskan SUS sebagai alat ukur usability standar, bukan sebagai objek evaluasi psikometrik. Namun saya sepakat bahwa uji reliabilitas lokal seperti **Cronbach’s Alpha** dapat menjadi penguatan tambahan untuk penelitian lanjutan.

### Jika Ditanya “Mengapa Tidak Menggunakan SPSS?”
Saya tidak menggunakan **SPSS** karena analisis yang saya lakukan pada bagian usability bersifat **deskriptif**, bukan **inferensial**. Pada penelitian ini saya menggunakan **SUS** sebagai instrumen baku yang memiliki prosedur perhitungan standar, yaitu:
1. skor item ganjil = jawaban dikurangi 1,
2. skor item genap = 5 dikurangi jawaban,
3. seluruh skor dijumlahkan,
4. hasilnya dikalikan 2,5.

Karena rumus SUS sudah baku dan tujuan saya hanya memperoleh skor usability akhir lalu menafsirkannya berdasarkan kategori yang established di literatur, maka pengolahan dapat dilakukan secara langsung tanpa SPSS. Jadi yang paling penting bukan nama perangkat lunaknya, tetapi **ketepatan mengikuti prosedur analisis SUS**.

### Jika Penguji Menekan Lagi
> “SPSS sangat berguna jika penelitian membutuhkan uji validitas, uji reliabilitas, uji hipotesis, korelasi, regresi, atau perbandingan kelompok. Sedangkan penelitian saya tidak berfokus ke sana. Saya hanya melakukan analisis deskriptif menggunakan skor SUS standar, sehingga penggunaan SPSS tidak menjadi keharusan metodologis.”

### Jawaban Singkat 20 Detik
> “Saya tidak menggunakan SPSS karena analisis SUS pada penelitian saya bersifat deskriptif dan rumusnya sudah baku. SPSS lebih relevan jika saya melakukan uji statistik lanjutan seperti validitas, reliabilitas, atau hipotesis.”

### Jika Ditanya “Apa Kelemahan SUS pada Penelitian Anda?”
Kelemahannya adalah SUS hanya memberi skor global, tidak merinci semua dimensi usability secara mendalam, distribusi responden antar-peran belum merata, dan belum dipadukan dengan wawancara usability mendalam atau observasi task-based.

### Referensi yang Bisa Disebut Saat Sidang
1. **Brooke, J. (1996).** *SUS: A quick and dirty usability scale.*
2. **Bangor, A., Kortum, P. T., & Miller, J. T. (2008).** *An empirical evaluation of the System Usability Scale.*
3. **Sauro, J., & Lewis, J. R. (2016).** *Quantifying the User Experience.*
4. **Lewis, J. R., & Sauro, J. (2009).** pembahasan lanjutan tentang item dan struktur SUS.

---

# BAB VI KESIMPULAN, SARAN, DAN PENUTUP

## 6.1 Kesimpulan

### Kemungkinan Pertanyaan
**Apakah kesimpulan Anda sudah menjawab tujuan penelitian?**

### Jawaban
Ya. Kesimpulan penelitian saya menjawab tiga tujuan utama, yaitu analisis kebutuhan, pengembangan sistem, dan evaluasi sistem. Semua kesimpulan ditarik langsung dari data hasil penelitian, bukan dari klaim di luar temuan.

---

## 6.2 Saran

### Kemungkinan Pertanyaan
**Apa saran paling penting untuk penelitian lanjutan?**

### Jawaban
Saran paling penting adalah memperluas evaluasi usability dengan responden yang lebih seimbang antar-peran, menambah evaluasi keamanan, memperkuat pengujian sinkronisasi offline di lebih banyak perangkat, dan meningkatkan integrasi dengan sistem institusi lain.

---

## 6.3 Penutup

### Kemungkinan Pertanyaan
**Jika penelitian ini dilanjutkan, apa yang pertama kali akan Anda perbaiki?**

### Jawaban
Prioritas pertama adalah penyederhanaan alur fitur yang kompleks, peningkatan pengalaman penggunaan di perangkat mobile, penguatan sinkronisasi offline, dan evaluasi usability yang lebih mendalam dengan metode tambahan seperti wawancara atau observasi tugas.

---

# DAFTAR PERTANYAAN CEPAT YANG SANGAT MUNGKIN MUNCUL

## Pertanyaan Cepat 1
**Apa inti penelitian Anda dalam satu kalimat?**

> “Inti penelitian saya adalah mengembangkan dan mengevaluasi sistem informasi praktikum berbasis PWA yang terintegrasi, multi-peran, dan mendukung penggunaan saat koneksi tidak stabil.”

## Pertanyaan Cepat 2
**Apa novelty penelitian Anda?**

> “Novelty penelitian saya terletak pada integrasi sistem praktikum berbasis PWA, dukungan offline-first, multi-peran, dan konteks pendidikan vokasi kebidanan dalam satu artefak yang diuji.”

## Pertanyaan Cepat 3
**Mengapa bukan metode waterfall?**

> “Karena penelitian saya membutuhkan pengembangan produk yang iteratif dan berbasis umpan balik pengguna, sehingga lebih sesuai dengan R&D yang dipadukan dengan prototipe iteratif.”

## Pertanyaan Cepat 4
**Mengapa PWA?**

> “Karena PWA lebih efisien untuk lintas perangkat, dapat diinstal, mendukung offline, dan sesuai dengan kondisi koneksi yang tidak selalu stabil.”

## Pertanyaan Cepat 5
**Apa hasil utama penelitian?**

> “Sistem berhasil dikembangkan, seluruh skenario black box lulus, seluruh unit test yang dieksekusi lulus, dan usability sistem memperoleh skor SUS 75,11 dengan kategori Good.”

## Pertanyaan Cepat 6
**Mengapa SUS?**

> “Karena SUS adalah instrumen usability standar yang sederhana, efisien, dan luas digunakan untuk memperoleh gambaran kuantitatif penerimaan pengguna terhadap sistem.”

## Pertanyaan Cepat 7
**Mengapa tidak uji validitas SUS?**

> “Karena SUS adalah instrumen baku yang sudah tervalidasi secara luas, dan dalam penelitian saya SUS digunakan sebagai alat ukur standar, bukan instrumen baru yang saya kembangkan.”

## Pertanyaan Cepat 8
**Apa kelemahan penelitian Anda?**

> “Kelemahan penelitian saya ada pada pemerataan responden usability, belum adanya evaluasi keamanan mendalam, dan belum adanya evaluasi implementasi jangka panjang dalam skala yang lebih luas.”

---

# REFERENSI AKADEMIK YANG KUAT UNTUK DIBAWA SAAT SIDANG

1. Brooke, J. (1996). *SUS: A quick and dirty usability scale.* In P. W. Jordan, B. Thomas, B. A. Weerdmeester, & A. L. McClelland (Eds.), *Usability Evaluation in Industry*. London: Taylor & Francis.
2. Bangor, A., Kortum, P. T., & Miller, J. T. (2008). An empirical evaluation of the System Usability Scale. *International Journal of Human-Computer Interaction*, 24(6), 574–594.
3. Sauro, J., & Lewis, J. R. (2016). *Quantifying the User Experience: Practical Statistics for User Research* (2nd ed.). Morgan Kaufmann.
4. Lewis, J. R., & Sauro, J. (2009). The factor structure of the System Usability Scale. *Human Centered Design*, 94–103.
5. Ferraiolo, D. F., Sandhu, R., Kuhn, D. R., & Chandramouli, R. (2001). Proposed NIST standard for role-based access control. *ACM Transactions on Information and System Security*, 4(3), 224–274.
6. Sugiyono. (2017). *Metode Penelitian dan Pengembangan (Research and Development / R&D).* Bandung: Alfabeta.
7. Garrett, J. J. (2011). *The Elements of User Experience.* New Riders.
8. Pressman, R. S., & Maxim, B. R. (2019). *Software Engineering: A Practitioner’s Approach.* McGraw-Hill.

---

# PENUTUP LATIHAN SIDANG

Kunci mempertahankan skripsi ini adalah konsisten pada tiga hal:
1. masalah awal memang nyata dan relevan,
2. metode yang dipilih sesuai dengan tujuan menghasilkan produk,
3. hasil penelitian menunjukkan sistem layak dari sisi fungsi, teknis, dan usability.

Jika penguji mengkritik detail tertentu, posisi jawaban yang paling aman adalah **tidak defensif berlebihan**, tetapi menunjukkan bahwa keputusan metodologis Anda punya dasar, dan bagian yang belum dilakukan dapat diakui sebagai ruang pengembangan ilmiah lanjutan.
