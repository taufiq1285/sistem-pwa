# Simulasi Detail Sidang Skripsi dari Sudut Pandang Penguji, Pembimbing 1, dan Pembimbing 2

## Tujuan Dokumen
Dokumen ini disusun sebagai simulasi sidang yang lebih detail dengan asumsi bahwa:
- **penguji** fokus pada logika ilmiah, celah metodologi, ketajaman argumentasi, dan kelemahan hasil,
- **pembimbing 1** fokus pada konsistensi akademik, alur penelitian, metodologi, serta kesesuaian isi skripsi dengan tujuan,
- **pembimbing 2** fokus pada sisi teknis sistem, implementasi, pengujian, dan kelayakan produk.

Dokumen ini melengkapi [`docs/JAWABAN/PERSIAPAN-SIDANG-SKRIPSI-TAUFIQ.md`](docs/JAWABAN/PERSIAPAN-SIDANG-SKRIPSI-TAUFIQ.md) dan [`docs/JAWABAN/PERSIAPAN-SIDANG-LENGKAP-CHECKLIST.md`](docs/JAWABAN/PERSIAPAN-SIDANG-LENGKAP-CHECKLIST.md).

---

# 1. Cara Memahami Karakter Pertanyaan Sidang

## 1.1 Karakter Penguji
Biasanya penguji akan mencari:
- apakah Anda benar-benar paham skripsi Anda sendiri,
- apakah ada kelemahan logis,
- apakah metode yang dipilih benar-benar tepat,
- apakah hasil penelitian tidak terlalu dibesar-besarkan,
- apakah Anda bisa bertahan secara ilmiah saat ditekan.

### Gaya pertanyaan penguji biasanya:
- tajam,
- langsung ke kelemahan,
- kadang memotong ke inti,
- menguji spontanitas dan kedalaman pemahaman.

## 1.2 Karakter Pembimbing 1
Biasanya pembimbing 1 lebih fokus pada:
- konsistensi antar-bab,
- kesesuaian latar belakang, rumusan masalah, tujuan, metode, hasil, dan kesimpulan,
- kualitas akademik penulisan,
- alasan mengapa keputusan metodologis diambil.

### Gaya pertanyaan pembimbing 1 biasanya:
- menelusuri alur ilmiah,
- mengingatkan bagian yang pernah direvisi,
- menilai apakah Anda konsisten dengan arahan bimbingan.

## 1.3 Karakter Pembimbing 2
Biasanya pembimbing 2 lebih fokus pada:
- desain sistem,
- implementasi teknis,
- pengujian,
- arsitektur,
- kualitas fitur,
- alasan pemilihan teknologi.

### Gaya pertanyaan pembimbing 2 biasanya:
- teknis,
- detail pada sistem,
- menanyakan bukti implementasi,
- menguji apakah Anda memang membangun sistem tersebut sendiri.

---

# 2. Simulasi Pertanyaan oleh Penguji

## 2.1 Penguji pada BAB I – Masalah dan Novelty

### Pertanyaan Penguji 1
**Mengapa penelitian ini penting? Bukankah sistem informasi praktikum sudah banyak dibuat?**

### Arah pikir penguji
Penguji ingin melihat apakah Anda benar-benar paham letak masalah dan novelty penelitian, bukan hanya membuat aplikasi yang mirip penelitian lain.

### Jawaban yang kuat
> “Penelitian ini penting karena masalah di lapangan bukan hanya belum adanya aplikasi, tetapi ketidakterpaduan pengelolaan praktikum. Jadwal, logbook, penilaian, komunikasi, dan layanan laboratorium masih tersebar dan belum terintegrasi. Memang sistem informasi praktikum sudah pernah diteliti, tetapi pada penelitian saya ada fokus yang lebih spesifik, yaitu konteks pendidikan vokasi kebidanan, pendekatan multi-peran, dan penggunaan PWA dengan dukungan offline-first. Jadi nilai penelitian saya bukan sekadar membuat sistem, tetapi menghadirkan solusi yang lebih sesuai dengan kebutuhan riil pengguna.”

### Jika penguji mengejar
**Lalu novelty Anda sebenarnya apa?**

> “Novelty penelitian saya terletak pada integrasi sistem praktikum berbasis PWA, dukungan offline dan sinkronisasi, penerapan RBAC untuk multi-peran, serta konteks spesifik pendidikan vokasi kebidanan. Kebaruannya terletak pada kombinasi dan penerapannya pada kebutuhan nyata, bukan semata pada satu unsur teknologi yang benar-benar baru sendiri.”

---

## 2.2 Penguji pada Rumusan Masalah dan Tujuan

### Pertanyaan Penguji 2
**Apakah rumusan masalah Anda benar-benar dijawab oleh hasil penelitian?**

### Jawaban yang kuat
> “Ya. Rumusan masalah saya mencakup analisis kebutuhan, pengembangan sistem, dan evaluasi hasil. Ketiganya dijawab melalui identifikasi masalah lapangan, implementasi sistem berbasis PWA, serta evaluasi menggunakan black box, white box, dan SUS. Jadi hasil penelitian saya memang dirancang untuk menjawab rumusan masalah secara langsung.”

### Risiko kesalahan saat menjawab
Jangan menjawab terlalu umum seperti **‘sudah terjawab semua’** tanpa menyebut hubungan langsung antara rumusan masalah dengan hasil.

---

## 2.3 Penguji pada Metodologi

### Pertanyaan Penguji 3
**Mengapa Anda memilih metode R&D, bukan metode lain?**

### Jawaban yang kuat
> “Karena penelitian saya tidak hanya mendeskripsikan masalah, tetapi menghasilkan artefak berupa sistem informasi praktikum dan mengevaluasi kelayakannya. Itu sesuai dengan karakter penelitian pengembangan atau R&D. Jika saya hanya ingin menggambarkan kondisi, maka metode deskriptif mungkin cukup. Tetapi karena saya membangun produk dan mengujinya, R&D lebih tepat.”

### Jika penguji membandingkan
**Kenapa tidak pakai waterfall saja?**

> “Waterfall lebih cocok sebagai model pengembangan perangkat lunak yang linear. Sedangkan penelitian saya membutuhkan kerangka penelitian yang mencakup identifikasi masalah, pengembangan produk, pengujian, dan evaluasi. Karena itu saya memakai R&D sebagai metode penelitian, lalu prototipe iteratif sebagai strategi pengembangan sistem.”

---

## 2.4 Penguji pada Pengujian Sistem

### Pertanyaan Penguji 4
**Hasil black box 100% dan white box 100% terdengar terlalu sempurna. Apakah realistis?**

### Jawaban yang kuat
> “Angka 100% harus dibaca sesuai ruang lingkup pengujian yang saya tetapkan. Artinya seluruh skenario black box dan seluruh test case white box yang disusun dalam penelitian ini lulus. Itu tidak berarti sistem sempurna dalam semua kemungkinan kondisi dunia nyata, tetapi menunjukkan bahwa pada cakupan uji yang dirancang, sistem berjalan sesuai harapan.”

### Tambahan jawaban aman
> “Saya justru berhati-hati untuk tidak mengklaim sistem sempurna. Hasil ini menunjukkan keberhasilan pada skenario uji penelitian, bukan jaminan bahwa seluruh kondisi di luar penelitian sudah habis diuji.”

---

## 2.5 Penguji pada SUS

### Pertanyaan Penguji 5
**Mengapa Anda memilih SUS sebagai alat ukur usability?**

### Jawaban yang kuat
> “Saya memilih SUS karena SUS adalah instrumen usability standar yang sederhana, efisien, dan luas digunakan. SUS juga cocok untuk evaluasi usability awal pada sistem yang baru dikembangkan karena memberi skor global yang mudah diinterpretasikan.”

### Jika penguji bertanya lagi
**Kenapa tidak pakai metode usability lain yang lebih detail?**

> “Karena fokus penelitian saya adalah evaluasi usability awal dalam penelitian pengembangan, sehingga saya memilih instrumen yang praktis tetapi tetap kuat secara akademik. Saya menyadari bahwa ada metode lain yang lebih rinci, tetapi untuk ruang lingkup skripsi ini SUS sudah memadai sebagai ukuran usability global.”

---

## 2.6 Penguji pada Validitas SUS

### Pertanyaan Penguji 6
**Mengapa tidak dilakukan uji validitas pada SUS?**

### Jawaban utama yang paling aman
> “Saya tidak melakukan uji validitas ulang karena SUS merupakan instrumen baku atau standardized questionnaire yang telah digunakan dan divalidasi secara luas dalam penelitian usability. Dalam penelitian ini saya tidak menyusun item baru dan tidak mengubah konstruk dasarnya. Karena itu fokus saya adalah menggunakan SUS sesuai prosedur standar untuk mengevaluasi usability sistem, bukan melakukan validasi psikometrik instrumen.”

### Jika penguji menekan
**Tetap saja, bukankah kalau dipakai pada populasi lokal sebaiknya diuji validitas?**

> “Itu benar jika penelitian diarahkan pada adaptasi instrumen, uji psikometrik lokal, atau modifikasi konstruk. Namun pada penelitian saya, SUS dipakai sebagai alat ukur baku untuk evaluasi usability praktis. Jadi saya berpegang pada validitas instrumen yang sudah established dalam literatur, sambil mengakui bahwa validitas atau reliabilitas lokal dapat menjadi penguatan tambahan pada penelitian lanjutan.”

### Jika penguji menekan lebih keras
**Berarti hasil SUS Anda lemah dong?**

> “Tidak otomatis lemah, karena kekuatan SUS justru berasal dari statusnya sebagai instrumen standar yang sudah lama digunakan secara luas. Selain itu, hasil usability pada penelitian saya tidak berdiri sendiri, tetapi didukung oleh hasil black box dan white box. Jadi penilaian terhadap sistem tidak hanya berdasarkan satu indikator.”

---

## 2.7 Penguji pada SPSS

### Pertanyaan Penguji 7
**Mengapa Anda tidak menggunakan SPSS?**

### Jawaban utama yang aman
> “Saya tidak menggunakan SPSS karena analisis data usability pada penelitian saya bersifat deskriptif, bukan inferensial. SUS memiliki rumus perhitungan standar yang dapat dihitung langsung secara akurat. Jadi yang paling penting adalah ketepatan mengikuti prosedur analisis SUS, bukan nama software yang digunakan.”

### Jika penguji mengejar
**Kalau pakai SPSS kan lebih ilmiah?**

> “SPSS memang sangat membantu untuk uji statistik seperti validitas, reliabilitas, korelasi, regresi, atau uji hipotesis. Namun penelitian saya tidak membutuhkan analisis tersebut, sehingga penggunaan SPSS tidak menjadi keharusan metodologis. Saya tetap mengikuti prosedur analisis yang sah dan standar untuk SUS.”

---

## 2.8 Penguji pada Kelemahan Penelitian

### Pertanyaan Penguji 8
**Apa kelemahan penelitian Anda?**

### Jawaban yang kuat
> “Kelemahan penelitian saya antara lain distribusi responden SUS belum merata antar-peran, evaluasi usability masih pada tahap awal dan berbasis skor global SUS, belum ada pengujian keamanan yang mendalam, serta belum ada evaluasi implementasi jangka panjang pada skala institusi yang lebih luas. Namun kelemahan ini tidak menghilangkan temuan utama penelitian, melainkan menjadi ruang pengembangan lanjutan.”

### Kesalahan yang harus dihindari
Jangan berkata **‘tidak ada kelemahan’** karena itu justru membuat jawaban Anda tidak ilmiah.

---

# 3. Simulasi Pertanyaan oleh Pembimbing 1

## 3.1 Pembimbing 1 pada Konsistensi Judul, Tujuan, dan Hasil

### Pertanyaan Pembimbing 1
**Judul Anda menyebut analisis dan perancangan, tetapi isi Anda sampai implementasi dan pengujian. Apakah itu konsisten?**

### Jawaban yang kuat
> “Konsisten, karena analisis dan perancangan adalah fondasi utama penelitian saya. Dalam kerangka R&D, tahap tersebut memang dilanjutkan ke implementasi dan pengujian agar artefak yang dirancang dapat dibuktikan kelayakannya. Jadi implementasi dan pengujian bukan keluar dari judul, tetapi kelanjutan logis dari penelitian pengembangan.”

---

## 3.2 Pembimbing 1 pada Hubungan Bab I dan Bab VI

### Pertanyaan Pembimbing 1
**Apakah kesimpulan Anda betul-betul ditarik dari tujuan penelitian?**

### Jawaban yang kuat
> “Ya. Tujuan saya ada pada analisis kebutuhan, pengembangan sistem, dan evaluasi sistem. Kesimpulan saya juga disusun berdasarkan tiga hal itu, sehingga tidak keluar dari tujuan penelitian.”

### Cara menjawab yang lebih rapi
Sebutkan tujuan satu per satu, lalu tunjukkan kesimpulan yang menjawab tiap tujuan.

---

## 3.3 Pembimbing 1 pada Tinjauan Pustaka

### Pertanyaan Pembimbing 1
**Apa yang membedakan penelitian Anda dengan penelitian terdahulu secara jelas?**

### Jawaban yang kuat
> “Perbedaannya ada pada konteks, ruang lingkup fitur, dan teknologi. Penelitian saya secara khusus membahas sistem informasi praktikum pada pendidikan vokasi kebidanan, menggunakan PWA dengan dukungan offline-first, serta menerapkan multi-peran berbasis RBAC. Jadi posisi penelitian saya bukan mengulang penelitian terdahulu, tetapi memperluas dan menyesuaikannya pada kebutuhan yang berbeda.”

---

## 3.4 Pembimbing 1 pada Metode

### Pertanyaan Pembimbing 1
**Mengapa model Ellis dan Levy yang Anda pilih?**

### Jawaban yang kuat
> “Karena model Ellis dan Levy memberi struktur yang jelas untuk penelitian pengembangan artefak di bidang teknologi informasi, mulai dari identifikasi masalah sampai evaluasi hasil. Model ini saya anggap lebih sesuai dengan bentuk penelitian saya yang berorientasi pada pengembangan sistem.”

### Jika ditanya lagi
**Lalu hubungan Sugiyono dengan Ellis dan Levy bagaimana?**

> “Saya menggunakan R&D sebagai kerangka umum sebagaimana dijelaskan Sugiyono, lalu model Ellis dan Levy saya gunakan sebagai operasionalisasi tahapan yang lebih relevan untuk pengembangan artefak sistem informasi.”

---

## 3.5 Pembimbing 1 pada Teknik Analisis Data

### Pertanyaan Pembimbing 1
**Mengapa analisis data Anda deskriptif?**

### Jawaban yang kuat
> “Karena penelitian saya tidak berfokus pada pengujian hubungan antarvariabel atau hipotesis, melainkan pada pengembangan dan evaluasi artefak. Oleh karena itu, analisis yang saya gunakan adalah deskriptif untuk memaparkan kebutuhan pengguna, hasil pengujian fungsi, hasil verifikasi teknis, dan skor usability.”

---

## 3.6 Pembimbing 1 pada Instrumen

### Pertanyaan Pembimbing 1
**Mengapa instrumen penelitian Anda banyak?**

### Jawaban yang kuat
> “Karena setiap tahap penelitian membutuhkan instrumen yang berbeda. Observasi dan wawancara digunakan pada tahap identifikasi masalah, skenario uji dipakai untuk black box, unit test untuk verifikasi logika, dan SUS untuk evaluasi usability. Jadi banyaknya instrumen justru menunjukkan kesesuaian dengan tahapan penelitian pengembangan.”

---

# 4. Simulasi Pertanyaan oleh Pembimbing 2

## 4.1 Pembimbing 2 pada Pemilihan Teknologi

### Pertanyaan Pembimbing 2
**Mengapa Anda memilih React, TypeScript, Vite, Supabase, dan Tailwind?**

### Jawaban yang kuat
> “Saya memilih stack tersebut karena masing-masing mendukung kebutuhan sistem. React memudahkan pengembangan antarmuka modular, TypeScript membantu menjaga konsistensi tipe data, Vite mempercepat proses pengembangan frontend, Supabase menyediakan backend-as-a-service yang mendukung autentikasi dan database, sedangkan Tailwind mempermudah pembuatan UI responsif. Kombinasi ini mendukung implementasi sistem yang cepat tetapi tetap terstruktur.”

---

## 4.2 Pembimbing 2 pada PWA

### Pertanyaan Pembimbing 2
**Apa bukti sistem Anda benar-benar PWA?**

### Jawaban yang kuat
> “Bukti utamanya adalah adanya web app manifest, service worker, kemampuan instalasi ke perangkat, cache lokal, indikator online/offline, antrean offline, dan sinkronisasi saat koneksi pulih. Jadi sistem ini tidak hanya responsif, tetapi memenuhi karakteristik inti PWA.”

### Jika diminta contoh teknis
> “Saat pengguna dalam kondisi offline, sistem tetap dapat menyimpan aksi tertentu ke antrean lokal, lalu menyinkronkannya ketika koneksi kembali normal.”

---

## 4.3 Pembimbing 2 pada RBAC

### Pertanyaan Pembimbing 2
**Mengapa ada empat peran pengguna? Kenapa tidak disederhanakan?**

### Jawaban yang kuat
> “Karena alur praktikum memang melibatkan empat aktor dengan tugas berbeda, yaitu admin, dosen, mahasiswa, dan laboran. Jika disederhanakan terlalu jauh, sistem justru tidak merepresentasikan kondisi kerja nyata dan hak akses menjadi tidak presisi.”

---

## 4.4 Pembimbing 2 pada Desain Sistem

### Pertanyaan Pembimbing 2
**Mengapa Anda memakai DFD dan ERD?**

### Jawaban yang kuat
> “Karena saya ingin menggambarkan sistem dari dua sisi utama, yaitu proses dan data. DFD menjelaskan aliran data dan proses bisnis, sedangkan ERD menjelaskan struktur dan relasi data. Keduanya saling melengkapi dalam mendukung desain sistem.”

---

## 4.5 Pembimbing 2 pada Pengujian Teknis

### Pertanyaan Pembimbing 2
**Mengapa white box perlu dimasukkan? Bukankah black box sudah cukup?**

### Jawaban yang kuat
> “Black box hanya menunjukkan bahwa fitur bekerja dari sudut pandang pengguna. White box diperlukan untuk menunjukkan bahwa logika internal modul juga diverifikasi secara sistematis. Ini penting karena sistem saya memiliki banyak logika pada validasi data, akses peran, integrasi modul, dan fitur offline.”

---

## 4.6 Pembimbing 2 pada Demo Sistem

### Pertanyaan Pembimbing 2
**Kalau saya minta demo, fitur apa yang paling penting Anda tunjukkan?**

### Jawaban yang kuat
> “Fitur yang paling penting saya tunjukkan adalah autentikasi, dashboard berdasarkan peran, pengelolaan fitur inti praktikum, dan bukti karakteristik PWA seperti instalasi atau perilaku offline. Empat bagian itu paling mewakili nilai utama sistem saya.”

---

# 5. Simulasi Pertanyaan Gabungan yang Sangat Mungkin Muncul

## 5.1 Pertanyaan Gabungan
**Kalau sistem Anda sudah baik, mengapa skor SUS Anda hanya 75,11 dan bukan sangat tinggi?**

### Jawaban yang kuat
> “Skor 75,11 justru menunjukkan hasil yang realistis. Sistem dinilai baik dan dapat diterima, tetapi belum sempurna. Itu menunjukkan masih ada ruang perbaikan pada pengalaman pengguna. Saya melihat ini sebagai hasil yang jujur dan ilmiah, bukan kelemahan fatal.”

---

## 5.2 Pertanyaan Gabungan
**Mengapa responden SUS lebih banyak mahasiswa? Apakah itu tidak bias?**

### Jawaban yang kuat
> “Mahasiswa memang menjadi pengguna utama dengan frekuensi interaksi tertinggi terhadap fitur sistem, sehingga dominasi mahasiswa masih relevan secara substantif. Namun saya mengakui bahwa pemerataan responden antar-peran masih bisa ditingkatkan dan itu saya tempatkan sebagai keterbatasan penelitian.”

---

## 5.3 Pertanyaan Gabungan
**Kalau Anda diberi waktu pengembangan lebih lanjut, apa yang pertama akan diperbaiki?**

### Jawaban yang kuat
> “Prioritas pertama saya adalah penyederhanaan alur pada fitur yang lebih kompleks, pemerataan evaluasi usability antar-peran, penguatan pengujian keamanan, dan optimalisasi sinkronisasi offline pada lebih banyak perangkat.”

---

# 6. Checklist Khusus Jika Anda Berhadapan dengan Tiga Tipe Penanya Sekaligus

## 6.1 Jika yang bertanya Penguji
Fokus jawaban Anda harus pada:
- dasar ilmiah,
- alasan metodologis,
- posisi penelitian,
- kelemahan dan pembelaan akademik.

## 6.2 Jika yang bertanya Pembimbing 1
Fokus jawaban Anda harus pada:
- konsistensi isi skripsi,
- hubungan antar-bab,
- kesesuaian tujuan, metode, hasil, dan kesimpulan,
- alasan Anda menulis seperti itu.

## 6.3 Jika yang bertanya Pembimbing 2
Fokus jawaban Anda harus pada:
- detail sistem,
- alasan teknis,
- bukti implementasi,
- pengujian,
- fitur inti,
- arsitektur dan teknologi.

---

# 7. Strategi Menjawab Berdasarkan Siapa yang Bertanya

## 7.1 Rumus Aman
Gunakan rumus berikut:
1. jawab inti dulu satu kalimat,
2. jelaskan alasannya,
3. hubungkan dengan hasil penelitian,
4. akui keterbatasan jika perlu.

## 7.2 Contoh Penggunaan Rumus
### Pertanyaan
**Mengapa tidak memakai SPSS?**

### Jawaban model 4 langkah
1. **inti jawaban**: saya tidak memakai SPSS karena analisis yang saya lakukan bersifat deskriptif,
2. **alasan**: SUS memiliki rumus baku yang bisa dihitung langsung,
3. **hubungan dengan hasil**: yang penting adalah ketepatan prosedur analisis dan interpretasi skor 75,11,
4. **pengakuan ilmiah**: jika penelitian dikembangkan ke uji statistik lanjutan, SPSS dapat dipakai sebagai penguatan.

---

# 8. Kesalahan Fatal yang Harus Dihindari Saat Sidang

Jangan lakukan hal-hal berikut:
- mengatakan **“pokoknya”** tanpa alasan ilmiah,
- membantah penguji secara emosional,
- berkata **“karena mengikuti contoh skripsi lain”**,
- mengklaim sistem **sempurna**,
- mengatakan **“tidak ada kelemahan”**,
- lupa angka hasil utama,
- tidak bisa menjelaskan hubungan tujuan dengan hasil,
- tidak bisa menjelaskan mengapa memilih metode tertentu.

---

# 9. Jawaban Super Singkat yang Harus Siap di Kepala

## 9.1 Mengapa topik ini penting?
> “Karena pengelolaan praktikum masih manual dan tidak terintegrasi.”

## 9.2 Apa novelty Anda?
> “Integrasi sistem praktikum berbasis PWA, offline-first, multi-peran, pada konteks vokasi kebidanan.”

## 9.3 Mengapa R&D?
> “Karena penelitian saya menghasilkan produk dan mengevaluasi produk.”

## 9.4 Mengapa PWA?
> “Karena ringan, lintas perangkat, installable, dan mendukung offline.”

## 9.5 Mengapa tidak uji validitas SUS?
> “Karena SUS adalah instrumen baku yang saya gunakan sesuai prosedur standar, bukan instrumen baru yang saya kembangkan.”

## 9.6 Mengapa tidak pakai SPSS?
> “Karena analisis SUS saya bersifat deskriptif dan rumusnya sudah baku.”

## 9.7 Apa hasil utama penelitian?
> “Black box 100%, white box 100%, dan SUS 75,11 kategori Good.”

---

# 10. Simulasi yang Lebih Detail per Peran dan Per Sub-Bab

## 10.1 Simulasi Penguji pada Latar Belakang

### Pertanyaan
**Anda mengatakan proses praktikum masih manual. Data konkretnya apa?**

### Tujuan pertanyaan
Penguji ingin mengetahui apakah latar belakang Anda benar-benar berbasis masalah riil, bukan hanya asumsi umum.

### Jawaban yang kuat
> “Dasar saya menyatakan proses masih manual berasal dari identifikasi kebutuhan di lapangan, yaitu pengelolaan jadwal, logbook, penyampaian informasi, dan dokumentasi aktivitas praktikum yang masih tersebar pada media yang berbeda. Kondisi itu menimbulkan risiko miskomunikasi, keterlambatan pelaporan, dan kesulitan pengendalian data. Jadi latar belakang saya tidak dibangun dari asumsi, tetapi dari masalah operasional yang teridentifikasi pada konteks penelitian.”

### Jika ditekan lagi
**Kenapa tidak Anda tampilkan data kuantitatif masalah awal?**

> “Karena pada penelitian ini fokus tahap awal saya adalah identifikasi kebutuhan sistem untuk pengembangan artefak, bukan survei kuantitatif kondisi awal. Namun masalah yang saya gunakan tetap berbasis temuan lapangan yang relevan dan menjadi dasar pengembangan sistem.”

---

## 10.2 Simulasi Penguji pada Rumusan Masalah

### Pertanyaan
**Rumusan masalah Anda terlihat umum. Apa masalah inti yang sebenarnya ingin Anda jawab?**

### Jawaban yang kuat
> “Masalah intinya adalah bagaimana mengembangkan sistem informasi praktikum yang mampu mengintegrasikan proses yang sebelumnya terpisah-pisah, sekaligus memastikan sistem tersebut layak secara fungsi, teknis, dan usability. Jadi inti rumusan masalah saya bukan sekadar membuat aplikasi, tetapi menyelesaikan persoalan keterpaduan proses.”

---

## 10.3 Simulasi Penguji pada Batasan Masalah

### Pertanyaan
**Mengapa Anda tidak meneliti sampai dampak terhadap hasil belajar mahasiswa?**

### Jawaban yang kuat
> “Karena ruang lingkup penelitian saya adalah pengembangan dan evaluasi awal artefak sistem informasi praktikum. Jika saya menambahkan pengukuran dampak terhadap hasil belajar, maka desain penelitian akan bergeser ke evaluasi pendidikan atau eksperimen pembelajaran. Itu berada di luar batas yang saya tetapkan dalam skripsi ini.”

### Catatan strategi
Ini pertanyaan jebakan. Jangan mengatakan **‘belum sempat’**. Lebih aman mengatakan **‘berada di luar ruang lingkup penelitian’**.

---

## 10.4 Simulasi Pembimbing 1 pada Konsistensi Tujuan dan Manfaat

### Pertanyaan
**Manfaat penelitian Anda apakah benar-benar muncul dari tujuan penelitian?**

### Jawaban yang kuat
> “Ya. Tujuan penelitian saya adalah menganalisis kebutuhan, mengembangkan sistem, dan mengevaluasi kelayakannya. Dari situ manfaat praktisnya adalah tersedianya sistem yang lebih terintegrasi untuk pengelolaan praktikum. Manfaat akademiknya adalah memberi contoh penerapan R&D dan PWA dalam konteks sistem informasi pendidikan vokasi.”

---

## 10.5 Simulasi Pembimbing 1 pada Kajian Pustaka

### Pertanyaan
**Apa kelemahan kajian pustaka Anda sendiri?**

### Jawaban yang kuat
> “Kelemahannya adalah sebagian uraian masih bersifat deskriptif, sehingga ruang penguatan analisis kritis sebenarnya masih ada. Namun saya tetap berusaha menutup kelemahan itu dengan menegaskan gap penelitian, perbedaan konteks, dan alasan pentingnya penelitian saya dilakukan.”

### Catatan
Jawaban seperti ini aman karena menunjukkan refleksi akademik tanpa meruntuhkan posisi skripsi Anda.

---

## 10.6 Simulasi Pembimbing 2 pada Desain dan Arsitektur Sistem

### Pertanyaan
**Kalau sistem Anda berbasis PWA, bagaimana alur data saat offline lalu kembali online?**

### Jawaban yang kuat
> “Saat offline, sistem tetap memberikan akses pada data atau fitur tertentu yang sudah tersedia melalui mekanisme cache. Untuk aksi yang membutuhkan penyimpanan sementara, data ditahan terlebih dahulu pada antrean lokal. Setelah koneksi kembali, antrean itu diproses untuk sinkronisasi ke server. Jadi alur datanya dirancang agar pengalaman penggunaan tidak langsung terputus ketika jaringan bermasalah.”

### Jika diminta lebih teknis
> “Secara konsep, arsitekturnya memanfaatkan service worker untuk caching dan mekanisme queue/sync untuk menunda pengiriman data ketika offline.”

---

## 10.7 Simulasi Pembimbing 2 pada RBAC

### Pertanyaan
**Apa risiko jika RBAC tidak diterapkan pada sistem Anda?**

### Jawaban yang kuat
> “Risikonya adalah kekacauan hak akses. Pengguna bisa melihat atau mengubah data yang seharusnya tidak menjadi kewenangannya. Pada sistem praktikum, ini berbahaya karena ada data nilai, logbook, jadwal, dan fungsi operasional laboratorium yang tidak boleh diakses sembarang peran. Karena itu RBAC penting untuk menjaga ketepatan fungsi dan keamanan akses.”

---

## 10.8 Simulasi Penguji pada DFD dan ERD

### Pertanyaan
**Mengapa Anda memilih DFD, bukan UML secara penuh?**

### Jawaban yang kuat
> “Karena saya ingin menekankan aliran data dan proses bisnis sistem secara terstruktur. DFD lebih tepat untuk menjelaskan bagaimana data bergerak antar proses, aktor, dan penyimpanan. Saya tetap melengkapi dengan diagram lain sesuai kebutuhan, tetapi untuk fokus perancangan proses, DFD saya anggap lebih representatif.”

### Pertanyaan lanjutan
**Apa hubungan DFD dengan ERD?**

> “DFD menjelaskan aliran proses dan data, sedangkan ERD menjelaskan struktur relasi data. Jadi DFD menjawab bagaimana data diproses, sementara ERD menjawab bagaimana data disusun dan dihubungkan dalam basis data.”

---

## 10.9 Simulasi Penguji pada Implementasi

### Pertanyaan
**Bagaimana Anda memastikan bahwa sistem yang Anda buat benar-benar sesuai kebutuhan pengguna?**

### Jawaban yang kuat
> “Saya berangkat dari identifikasi masalah dan kebutuhan pengguna, lalu menerapkan pengembangan iteratif agar desain sistem dapat disesuaikan selama proses pembangunan. Selain itu, evaluasi usability melalui SUS membantu memberikan gambaran apakah sistem diterima oleh pengguna. Jadi kesesuaian kebutuhan saya jaga sejak awal analisis sampai tahap evaluasi.”

---

## 10.10 Simulasi Penguji pada Hasil SUS

### Pertanyaan
**Skor 75,11 itu bagus, tetapi apakah cukup kuat untuk mengatakan sistem berhasil?**

### Jawaban yang kuat
> “Saya tidak mendasarkan keberhasilan sistem hanya pada satu skor SUS. Keberhasilan penelitian saya dilihat dari tiga sisi, yaitu kelulusan black box untuk fungsi, kelulusan white box untuk logika internal, dan SUS untuk usability. Skor 75,11 memperkuat bahwa sistem dapat diterima pengguna, tetapi tetap saya tempatkan sebagai salah satu indikator, bukan satu-satunya indikator.”

---

## 10.11 Simulasi Penguji pada Responden SUS

### Pertanyaan
**Mengapa distribusi responden tidak seimbang? Apakah hasilnya tetap bisa dipercaya?**

### Jawaban yang kuat
> “Distribusi responden memang didominasi mahasiswa karena mahasiswa adalah pengguna utama dengan intensitas interaksi tertinggi pada fitur inti sistem. Jadi secara substantif itu masih relevan. Namun saya juga mengakui bahwa ketidakseimbangan responden menjadi keterbatasan penelitian dan bisa diperbaiki pada penelitian lanjutan dengan proporsi peran yang lebih merata.”

### Kesalahan yang harus dihindari
Jangan menjawab **‘karena yang mudah didapat cuma mahasiswa’**. Itu membuat penelitian terkesan lemah secara akademik.

---

## 10.12 Simulasi Penguji pada Validitas dan Reliabilitas SUS

### Pertanyaan
**Kalau Anda tidak uji validitas dan reliabilitas, apa dasar Anda yakin instrumennya sah?**

### Jawaban yang kuat
> “Dasarnya adalah karena saya menggunakan SUS sebagai instrumen baku yang sudah established dalam literatur usability. Item-itemnya tidak saya modifikasi secara konseptual dan prosedur penskorannya juga tetap mengikuti aturan standar. Karena itu saya menggunakan validitas dan reliabilitas yang sudah melekat pada instrumen standar tersebut, sambil tetap menyadari bahwa pengujian lokal dapat menjadi penguatan tambahan bila fokus penelitian diperluas.”

---

## 10.13 Simulasi Penguji pada SPSS

### Pertanyaan
**Kalau tidak pakai SPSS, bagaimana Anda memastikan hasil hitung Anda akurat?**

### Jawaban yang kuat
> “Akurasi hasil saya pastikan dengan mengikuti formula SUS yang baku secara konsisten, yaitu penyesuaian skor item ganjil dan genap, penjumlahan skor, lalu pengalian 2,5. Karena analisis yang saya lakukan bersifat deskriptif, ketepatan prosedur perhitungan menjadi hal yang utama. Jadi akurasi tidak ditentukan oleh nama software, tetapi oleh ketepatan metode perhitungannya.”

### Jika ditekan lagi
**Tetapi bukankah software statistik lebih meyakinkan?**

> “Software statistik memang bisa membantu, terutama untuk analisis inferensial. Namun dalam konteks penelitian saya, kebutuhan analisisnya tidak sampai ke sana. Jadi penggunaan SPSS bisa menjadi alat bantu tambahan, tetapi bukan keharusan metodologis.”

---

## 10.14 Simulasi Pembimbing 1 pada Kesimpulan

### Pertanyaan
**Adakah bagian kesimpulan Anda yang terlalu luas dibanding hasil penelitian?**

### Jawaban yang kuat
> “Saya berusaha menjaga agar kesimpulan tetap berada dalam ruang lingkup temuan penelitian, yaitu bahwa sistem berhasil dikembangkan, berfungsi sesuai skenario uji, memiliki kestabilan logika internal pada cakupan test case yang diuji, dan memperoleh usability yang baik. Saya menghindari klaim yang terlalu luas seperti dampak langsung terhadap hasil belajar karena itu memang tidak diuji.”

---

## 10.15 Simulasi Pembimbing 2 pada Kelemahan Teknis

### Pertanyaan
**Apa kelemahan teknis sistem Anda saat ini?**

### Jawaban yang kuat
> “Kelemahan teknis yang masih terbuka untuk penguatan adalah optimalisasi sinkronisasi offline pada lebih banyak variasi perangkat, pengujian keamanan yang lebih mendalam, dan kemungkinan integrasi yang lebih luas dengan sistem institusi lain. Jadi dari sisi teknis, sistem sudah layak sebagai hasil penelitian, tetapi masih memiliki ruang pengembangan.”

---

# 11. Simulasi Serangan Pertanyaan Berantai

## 11.1 Serangan tentang SUS

### Pertanyaan berantai
1. **Mengapa pakai SUS?**
2. **Mengapa tidak uji validitas?**
3. **Mengapa tidak pakai SPSS?**
4. **Kalau begitu, apa yang membuat hasil SUS Anda bisa dipercaya?**

### Cara menjawab berantai yang aman
> “Saya menggunakan SUS karena SUS adalah instrumen usability standar yang sederhana, efisien, dan luas digunakan. Saya tidak melakukan uji validitas ulang karena instrumen ini sudah baku dan saya tidak memodifikasi itemnya. Saya juga tidak menggunakan SPSS karena analisis saya bersifat deskriptif dan rumus SUS sudah baku. Hasil SUS saya tetap dapat dipercaya karena pengukurannya mengikuti prosedur standar, respondennya adalah pengguna nyata sistem, dan hasilnya tidak berdiri sendiri, tetapi didukung oleh hasil black box dan white box.”

### Kunci jawaban
Jangan menjawab setiap pertanyaan secara terpisah dan patah-patah. Jawab sebagai satu alur logis.

---

## 11.2 Serangan tentang Hasil 100%

### Pertanyaan berantai
1. **Mengapa black box 100%?**
2. **Mengapa white box 100%?**
3. **Apakah itu tidak terlalu ideal?**
4. **Apakah sistem Anda berarti sempurna?**

### Jawaban berantai yang aman
> “Hasil 100% pada black box dan white box menunjukkan bahwa seluruh skenario dan test case yang saya tetapkan pada penelitian ini lulus. Itu berarti sistem bekerja dengan baik pada cakupan uji yang dirancang. Namun saya tidak menyimpulkan bahwa sistem sempurna dalam seluruh kondisi dunia nyata. Jadi hasil ini menunjukkan keberhasilan dalam ruang lingkup pengujian penelitian, bukan kesempurnaan absolut.”

---

# 12. Prediksi Pertanyaan Paling Sulit Menurut Peran

## 12.1 Dari Penguji
Pertanyaan paling sulit biasanya:
- **Apa novelty Anda kalau teknologi yang dipakai bukan hal baru?**
- **Mengapa tidak uji validitas SUS?**
- **Mengapa tidak menggunakan SPSS?**
- **Apakah hasil 100% tidak terlalu ideal?**
- **Apa kelemahan penelitian Anda?**

## 12.2 Dari Pembimbing 1
Pertanyaan paling sulit biasanya:
- **Apakah tujuan, metode, hasil, dan kesimpulan Anda sudah konsisten?**
- **Apakah kajian pustaka Anda cukup kritis?**
- **Apakah kesimpulan Anda tidak melampaui hasil?**

## 12.3 Dari Pembimbing 2
Pertanyaan paling sulit biasanya:
- **Apa bukti sistem Anda benar-benar PWA?**
- **Bagaimana mekanisme offline dan sinkronisasi?**
- **Kenapa teknologi ini yang dipilih?**
- **Apa kelemahan teknis sistem Anda?**

---

# 13. Jawaban Paling Aman Jika Anda Benar-Benar Gugup

Kalau Anda gugup dan butuh jawaban aman, gunakan struktur ini:

## 13.1 Formula singkat
> “Dalam penelitian saya, fokus utamanya adalah ... Karena itu saya memilih ... Hasil yang saya peroleh adalah ... Namun saya juga menyadari bahwa penelitian ini masih memiliki keterbatasan pada ...”

## 13.2 Contoh untuk pertanyaan validitas SUS
> “Dalam penelitian saya, fokus utamanya adalah evaluasi usability sistem, bukan pengembangan instrumen. Karena itu saya menggunakan SUS sebagai instrumen baku yang sudah established. Hasil yang saya peroleh menunjukkan skor 75,11 dengan kategori Good. Namun saya juga menyadari bahwa pengujian validitas atau reliabilitas lokal dapat menjadi penguatan tambahan pada penelitian lanjutan.”

## 13.3 Contoh untuk pertanyaan SPSS
> “Dalam penelitian saya, analisis usability yang saya lakukan bersifat deskriptif. Karena itu saya menggunakan perhitungan standar SUS secara langsung. Hasil yang saya peroleh adalah skor 75,11. Namun jika penelitian ini dikembangkan ke analisis statistik lanjutan, penggunaan SPSS tentu dapat menjadi penguatan tambahan.”

---

# 14. Penutup

Kalau Anda ingin lolos sidang dengan kuat, maka Anda harus siap menghadapi tiga sudut pandang sekaligus:
- **penguji** akan menguji kelemahan dan logika ilmiah,
- **pembimbing 1** akan menguji konsistensi akademik,
- **pembimbing 2** akan menguji detail teknis sistem.

Artinya, Anda tidak cukup hanya hafal isi skripsi. Anda harus tahu:
1. **mengapa penelitian ini dilakukan**,
2. **mengapa metode ini dipilih**,
3. **mengapa hasilnya bisa dipertahankan**,
4. **apa kelemahannya**,
5. **bagaimana menjawab kritik tanpa defensif berlebihan**.

Dokumen ini dapat dipakai sebagai bahan simulasi lisan sebelum sidang bersama teman atau saat latihan mandiri di depan dosen.