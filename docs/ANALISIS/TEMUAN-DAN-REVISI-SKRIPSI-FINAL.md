# Temuan dan Revisi Skripsi Final

> Catatan: nomor **baris** pada dokumen ini mengacu pada hasil ekstraksi [`docs/finis skripsi.docx`](docs/finis%20skripsi.docx). Nomor **halaman asli** dokumen `.docx` tidak dapat dipetakan secara presisi dari hasil ekstraksi teks, sehingga rujukan yang paling akurat untuk verifikasi adalah **nomor baris**.

## Dokumen yang Dianalisis
- File skripsi: `docs/finis skripsi.docx`
- Fokus analisis: kesesuaian isi skripsi dengan implementasi aplikasi penelitian
- Pendekatan analisis: pemeriksaan keselarasan isi skripsi terhadap implementasi aplikasi, konsistensi antarbagian, kekuatan klaim akademik, kualitas editorial, dan kesiapan naskah untuk final/sidang

## Ringkasan Hasil Analisis
Secara umum, isi skripsi sudah sangat selaras dengan aplikasi penelitian yang dibangun. Struktur sistem, pendekatan Progressive Web App (PWA), dukungan multi-peran, fitur offline, serta pengujian fungsional dan usability sudah menunjukkan hubungan yang kuat dengan artefak aplikasi.

Namun, dokumen skripsi belum sepenuhnya aman untuk dianggap final tanpa revisi. Masih terdapat beberapa bagian yang terlalu kuat dalam mengklaim implementasi, beberapa placeholder yang belum dibersihkan, beberapa referensi yang belum lengkap, bagian tabel yang rusak, serta sejumlah kesalahan editorial.

## Estimasi Tingkat Kesesuaian
- Kesesuaian umum skripsi dengan aplikasi: **85–90%**
- Status: **Layak secara substansi, tetapi masih perlu revisi sebelum final/sidang**

---

# Analisis Sangat Detail per Bab

## BAB I – Pendahuluan

### Status umum
Bab ini **cukup aman** dan **tidak perlu dirombak total**, terutama bila memang berasal dari proposal yang sudah disetujui. Akan tetapi, tetap perlu diperiksa pada level kalimat agar tidak ada bagian yang terlalu mutlak dibanding implementasi akhir.

### Pemeriksaan detail komponen BAB I

#### 1. Latar belakang
**Yang sudah baik:**
- arah digitalisasi praktikum sudah relevan,
- kebutuhan sistem terintegrasi sudah sesuai,
- penggunaan PWA masih sangat masuk akal,
- kebutuhan multi-aktor sejalan dengan aplikasi.

**Yang perlu dicermati:**
- jika latar belakang menyatakan sistem akan menyelesaikan seluruh masalah praktikum secara menyeluruh, kalimat itu terlalu besar,
- jika logbook digital disebut seperti fitur inti yang sudah matang, perlu dilunakkan.

**Level risiko:** rendah–sedang.

**Narasi yang lebih aman:**
> Perkembangan teknologi informasi mendorong kebutuhan transformasi digital pada kegiatan akademik dan pengelolaan laboratorium. Dalam pelaksanaan praktikum, proses administrasi, distribusi materi, penugasan, penilaian, peminjaman alat, dan dokumentasi aktivitas sering kali masih berjalan secara terpisah. Kondisi tersebut menyebabkan keterbatasan efisiensi, keterlambatan akses informasi, dan kesulitan integrasi data. Oleh karena itu, penelitian ini berfokus pada pengembangan sistem informasi manajemen praktikum berbasis Progressive Web App untuk mendukung pengelolaan kegiatan akademik dan operasional laboratorium secara lebih terintegrasi.

#### 2. Identifikasi masalah
**Yang sudah baik:**
- biasanya bagian ini masih selaras dengan aplikasi,
- masalah umum seperti keterpisahan data, administrasi manual, akses informasi, dan kendala operasional laboratorium masih valid.

**Yang perlu dicermati:**
- jangan menulis identifikasi masalah yang di luar jangkauan aplikasi final,
- hindari masalah yang menuntut sistem analitik atau otomatisasi penuh jika itu belum benar-benar ada.

**Level risiko:** rendah.

**Narasi aman:**
> Berdasarkan kondisi tersebut, permasalahan utama yang diidentifikasi dalam penelitian ini meliputi belum terintegrasinya proses akademik dan operasional laboratorium, keterbatasan akses informasi praktikum secara efisien, serta perlunya sistem yang dapat mendukung pengelolaan data dan aktivitas praktikum secara lebih terstruktur.

#### 3. Batasan masalah
**Bagian paling sensitif di BAB I.**

**Yang berpotensi bermasalah:**
- jika batasan masalah menuliskan modul logbook digital secara sangat spesifik dan seolah sudah matang,
- jika seluruh ruang lingkup fitur disebut final dan lengkap,
- jika sistem digambarkan mencakup semua skenario operasional laboratorium tanpa pengecualian.

**Level risiko:** sedang–tinggi.

**Narasi aman:**
> Penelitian ini dibatasi pada pengembangan sistem informasi manajemen praktikum berbasis web progresif yang mendukung proses akademik dan operasional laboratorium dalam satu platform. Ruang lingkup implementasi difokuskan pada modul utama yang dikembangkan pada aplikasi, seperti autentikasi, pengelolaan jadwal, materi, kuis, penilaian, inventaris, peminjaman alat, pengumuman, serta dukungan pencatatan aktivitas praktikum secara digital. Beberapa fitur lanjutan masih memiliki peluang untuk disempurnakan pada tahap pengembangan berikutnya.

#### 4. Rumusan masalah
**Yang perlu dipastikan:**
- rumusan masalah harus tetap relevan dengan hasil akhir,
- jangan sampai ada rumusan yang menuntut pembuktian fitur yang ternyata tidak sepenuhnya diwujudkan.

**Level risiko:** sedang.

**Narasi aman:**
> Berdasarkan latar belakang tersebut, rumusan masalah dalam penelitian ini adalah bagaimana merancang dan mengimplementasikan sistem informasi manajemen praktikum berbasis Progressive Web App yang mampu mendukung integrasi kegiatan akademik dan operasional laboratorium secara efektif dan mudah diakses.

#### 5. Tujuan penelitian
**Yang sudah baik:**
- tujuan umum biasanya aman,
- tujuan pengembangan sistem integratif masih relevan.

**Yang perlu dicermati:**
- tujuan jangan terlalu absolut,
- jangan mengklaim semua fitur telah selesai sempurna pada level tujuan.

**Level risiko:** sedang.

**Narasi aman:**
> Penelitian ini bertujuan untuk mengembangkan sistem informasi manajemen praktikum berbasis Progressive Web App yang mendukung integrasi proses akademik dan operasional laboratorium, serta menyediakan fungsi utama yang dibutuhkan pengguna dalam pengelolaan kegiatan praktikum secara digital.

#### 6. Manfaat penelitian
**Yang sudah baik:**
- manfaat praktis dan akademik biasanya aman,
- manfaat untuk mahasiswa, dosen, laboran, dan pengelola sistem masih sesuai.

**Yang perlu dicermati:**
- hindari manfaat yang terdengar seperti hasil pasti seratus persen,
- gunakan kata “mendukung”, “memudahkan”, “meningkatkan efisiensi”, bukan “menjamin”.

**Level risiko:** rendah.

**Narasi aman:**
> Penelitian ini diharapkan dapat memberikan manfaat praktis dalam mendukung pengelolaan praktikum secara lebih terintegrasi, memudahkan akses informasi bagi pengguna, serta menjadi dasar pengembangan sistem laboratorium yang lebih adaptif dan berkelanjutan.

### Putusan revisi BAB I
- **Tidak perlu revisi besar** bila berasal dari proposal yang sudah diuji.
- **Cukup revisi ringan di level kalimat** pada bagian yang terlalu absolut.
- **Prioritas utama** hanya pada frasa logbook digital dan klaim cakupan sistem yang terlalu penuh.

---

## BAB II – Tinjauan Pustaka / Landasan Teori

### Status umum
Bab ini **perlu dibersihkan paling serius secara akademik**, bukan karena arah teorinya salah, tetapi karena kualitas finalisasi naskah harus lebih rapi.

### Pemeriksaan detail komponen BAB II

#### 1. Landasan teori sistem informasi
**Aman** bila definisinya standar dan relevan.

**Yang perlu dicek:**
- konsistensi definisi,
- jangan terlalu banyak teori umum yang tidak dipakai pada pembahasan.

**Narasi penyambung yang bagus:**
> Teori sistem informasi pada penelitian ini menjadi dasar untuk memahami bagaimana data, proses, pengguna, dan teknologi dapat diintegrasikan dalam satu lingkungan kerja yang mendukung pengelolaan praktikum dan operasional laboratorium.

#### 2. Landasan teori PWA
**Bagian ini kuat dan sesuai dengan aplikasi.**

**Yang perlu dipastikan:**
- jelaskan kaitan PWA dengan kebutuhan nyata pengguna,
- jangan terlalu teknis tanpa hubungan ke konteks penelitian.

**Narasi aman:**
> Pendekatan Progressive Web App dipilih karena mampu memberikan fleksibilitas akses melalui browser dengan pengalaman penggunaan yang mendekati aplikasi native. Dukungan service worker, caching, dan penyimpanan lokal menjadikan pendekatan ini relevan untuk sistem yang membutuhkan kontinuitas akses pada kondisi jaringan yang bervariasi.

#### 3. Landasan teori usability / SUS
**Cukup relevan dan penting.**

**Yang perlu dicek:**
- pastikan teori SUS terhubung langsung dengan evaluasi di bab hasil,
- jangan berhenti pada definisi saja.

**Narasi aman:**
> Penggunaan System Usability Scale dalam penelitian ini bertujuan untuk memberikan gambaran kuantitatif mengenai persepsi pengguna terhadap kemudahan penggunaan sistem yang dikembangkan.

#### 4. Penelitian terdahulu
**Ini bagian yang paling riskan di BAB II.**

**Masalah utama:**
- placeholder masih tersisa,
- potensi analisis perbandingan terlalu umum,
- novelty bisa tampak lemah bila tidak dibuat tegas.

**Level risiko:** tinggi.

**Yang harus diperbaiki:**
- hapus placeholder semua,
- setiap penelitian terdahulu harus punya pembeda yang jelas,
- akhiri dengan sintesis, bukan sekadar daftar.

**Narasi kesenjangan penelitian yang bisa dipakai:**
> Berdasarkan hasil kajian terhadap penelitian terdahulu, dapat dilihat bahwa sebagian besar penelitian masih berfokus pada fungsi tertentu secara parsial, seperti pengelolaan akademik, presensi, atau administrasi laboratorium secara terpisah. Penelitian ini menempatkan kontribusinya pada integrasi berbagai proses tersebut dalam satu platform berbasis Progressive Web App yang mendukung akses lintas perangkat dan pengelolaan sistem yang lebih terpadu.

#### 5. Kerangka pemikiran / kerangka konseptual
**Aman** jika memang sinkron dengan bab desain.

**Yang perlu dicek:**
- apakah semua elemen dalam kerangka benar-benar muncul lagi di analisis, perancangan, dan implementasi,
- jangan ada elemen kerangka yang hilang di bab berikutnya.

### Putusan revisi BAB II
- **Perlu revisi detail dan serius.**
- Fokus utama: placeholder, kualitas sintesis penelitian terdahulu, dan konsistensi istilah.
- Ini salah satu bab yang paling sering dipermasalahkan penguji jika tidak rapi.

---

## BAB III – Metodologi Penelitian

### Status umum
Bab ini **cukup baik** dan secara metodologis masih sesuai dengan arah pengembangan aplikasi. Revisi lebih banyak bersifat penguatan akademik agar metodologi tampak jujur terhadap proses implementasi nyata.

### Pemeriksaan detail komponen BAB III

#### 1. Jenis / pendekatan penelitian
**Aman** bila memakai R&D atau pengembangan sistem.

**Yang perlu dicek:**
- jangan terlalu normatif seolah semua tahapan berjalan lurus tanpa penyesuaian,
- jelaskan bahwa implementasi bersifat iteratif.

**Narasi aman:**
> Penelitian ini menggunakan pendekatan pengembangan sistem yang dilakukan secara bertahap dan iteratif, sehingga setiap tahapan dapat disesuaikan dengan kebutuhan pengguna dan hasil evaluasi selama proses implementasi.

#### 2. Tahapan penelitian
**Yang sudah baik:**
- analisis kebutuhan,
- perancangan,
- implementasi,
- pengujian.

**Yang perlu dicermati:**
- kalau digambarkan terlalu linear, tambahkan penjelasan bahwa ada evaluasi balik.

**Narasi aman:**
> Tahapan penelitian dilaksanakan mulai dari analisis kebutuhan, perancangan sistem, implementasi, hingga pengujian. Meskipun demikian, proses pengembangan dilakukan secara iteratif sehingga hasil evaluasi pada suatu tahap dapat digunakan untuk menyempurnakan tahap sebelumnya maupun tahap berikutnya.

#### 3. Teknik pengumpulan data
**Perlu dicek:**
- apakah teknik seperti observasi, wawancara, studi pustaka, dan kuesioner memang benar-benar digunakan,
- jangan ada metode yang tercantum tetapi tidak punya jejak pada pembahasan.

**Level risiko:** sedang.

#### 4. Instrumen penelitian
**Yang perlu dipastikan:**
- instrumen pengujian dan kuesioner harus sinkron dengan hasil,
- jika ada SUS, jumlah responden harus konsisten dengan tabel hasil.

#### 5. Teknik pengujian
**Bagian ini penting.**

**Yang perlu dicermati:**
- black box dan white box boleh tetap kuat,
- tetapi harus dibatasi dengan frasa “pada modul dan skenario yang diuji”.

**Narasi aman:**
> Pengujian sistem dilakukan untuk menilai kesesuaian fungsi yang telah diimplementasikan dengan kebutuhan pengguna dan rancangan sistem. Pengujian pada penelitian ini difokuskan pada modul dan skenario yang telah tersedia pada versi evaluasi akhir aplikasi.

#### 6. Keterbatasan metodologis
**Kemungkinan belum cukup eksplisit.**

**Yang sebaiknya ditambahkan:**
- cakupan responden SUS,
- ruang lingkup fitur yang diuji,
- beberapa modul masih dapat dikembangkan.

**Narasi aman:**
> Meskipun tahapan pengembangan dan pengujian telah dilakukan secara sistematis, penelitian ini masih memiliki keterbatasan pada cakupan implementasi beberapa fitur, jumlah responden evaluasi usability, serta ruang lingkup pengujian yang difokuskan pada modul utama yang telah tersedia pada aplikasi versi penelitian.

### Putusan revisi BAB III
- **Perlu revisi ringan sampai menengah.**
- Tidak fatal, tapi akan lebih kuat jika metodologi dibuat lebih realistis dan defensible.

---

## BAB IV – Analisis dan Perancangan Sistem

### Status umum
Ini adalah **bab paling kuat sekaligus paling berisiko**. Kuat karena menunjukkan kedalaman desain sistem. Berisiko karena desain yang terlalu lengkap bisa dibaca sebagai implementasi yang sudah selesai total.

### Pemeriksaan detail komponen BAB IV

#### 1. Analisis kebutuhan pengguna
**Yang sudah baik:**
- multi-peran sangat cocok,
- kebutuhan admin, dosen, mahasiswa, laboran masih selaras.

**Yang perlu dicek:**
- setiap kebutuhan pengguna harus punya jejak implementasi minimal,
- jangan ada kebutuhan yang ditulis seolah aktif tetapi tidak pernah muncul lagi.

#### 2. Diagram konteks / DFD Level 0
**Umumnya aman.**

**Karena sifatnya makro**, diagram konteks boleh tetap luas selama masih mewakili sistem secara umum.

**Level risiko:** rendah.

#### 3. DFD Level 1
**Mulai sensitif.**

**Yang harus dicermati:**
- proses besar seperti autentikasi, jadwal, materi, kuis, penilaian, inventaris, peminjaman, pengumuman, dan sinkronisasi cukup aman,
- proses logbook digital harus diperiksa lebih hati-hati.

**Narasi pengaman yang bisa dipakai:**
> DFD Level 1 pada penelitian ini menggambarkan alur utama sistem secara terintegrasi sebagai model proses bisnis dan aliran data. Pada implementasinya, setiap proses dikembangkan sesuai prioritas kebutuhan dan tingkat penyelesaian modul pada versi penelitian ini.

#### 4. DFD Level 2
**Bagian paling sensitif di seluruh skripsi.**

Terutama bila ada:
- validasi logbook,
- riwayat logbook,
- bukti aktivitas,
- umpan balik dosen,
- alur sinkronisasi detail,
- proses verifikasi penuh.

**Masalah utamanya:**
- DFD Level 2 cenderung sangat rinci,
- penguji bisa membandingkan: “apakah semua ini benar-benar ada di aplikasi?”

**Solusi terbaik:**
- jangan hapus kalau itu bagian desain sistem,
- tambahkan penjelasan bahwa ini adalah model perancangan terintegrasi,
- beberapa proses telah diimplementasikan secara penuh, sebagian lain direpresentasikan sebagai dukungan sistem yang masih dapat disempurnakan.

**Narasi aman:**
> DFD Level 2 disusun untuk memberikan gambaran yang lebih rinci mengenai alur data pada masing-masing proses sistem. Rincian tersebut merepresentasikan desain sistem terintegrasi yang menjadi acuan pengembangan. Pada implementasi versi penelitian ini, beberapa proses telah direalisasikan secara penuh, sedangkan beberapa proses lainnya masih berada pada tingkat implementasi yang dapat terus dikembangkan lebih lanjut sesuai kebutuhan operasional.

#### 5. ERD / desain basis data
**Umumnya aman dan sesuai**, selama struktur tabel mendukung modul nyata.

**Yang perlu dicermati:**
- bila ada entitas untuk fitur yang implementasinya belum kuat, jangan seolah-olah semua operasionalnya sudah matang,
- cukup jelaskan bahwa basis data dirancang untuk mendukung pengembangan sistem secara terintegrasi.

**Narasi aman:**
> Perancangan basis data pada penelitian ini disusun untuk mendukung integrasi antarmodul dan kesinambungan pengembangan sistem. Struktur data yang dirancang tidak hanya mendukung kebutuhan implementasi saat ini, tetapi juga memfasilitasi kemungkinan pengembangan lanjutan pada modul tertentu.

#### 6. Perancangan antarmuka
**Aman** bila screenshot dan implementasi benar-benar ada.

**Yang perlu dicek:**
- jangan ada rancangan UI yang tidak pernah muncul di bab implementasi,
- kalau ada mockup yang belum diwujudkan, tandai sebagai rancangan.

### Putusan revisi BAB IV
- **Perlu revisi detail tingkat tinggi.**
- Fokus utama bukan mengubah desain, tetapi **membedakan desain konseptual dan implementasi aktual**.
- Bab ini harus sangat hati-hati pada modul logbook dan alur level 2 yang terlalu lengkap.

---

## BAB V – Implementasi dan Pembahasan

### Status umum
Ini adalah **bab pembuktian utama**. Kalau bab ini kuat dan konsisten, keseluruhan skripsi akan lebih aman. Karena itu, revisi pada bab ini harus sangat detail.

### Pemeriksaan detail komponen BAB V

#### 1. Implementasi autentikasi dan hak akses
**Aman**, karena modul ini biasanya jelas dan kuat.

**Yang perlu dicek:**
- pastikan aktor dan role yang disebut sesuai,
- jangan ada role yang disebut di perancangan tapi tidak hadir di implementasi.

#### 2. Implementasi modul akademik
Meliputi:
- jadwal,
- materi,
- kuis,
- penilaian,
- kelas / mata kuliah bila ada.

**Status:** umumnya kuat dan sesuai.

**Yang perlu dicek:**
- deskripsi jangan berlebihan,
- sebutkan fungsi yang benar-benar tersedia.

**Narasi aman:**
> Implementasi modul akademik pada sistem mencakup penyediaan informasi jadwal, distribusi materi, pelaksanaan kuis, dan pengelolaan penilaian sesuai kebutuhan pengguna pada lingkungan praktikum.

#### 3. Implementasi modul laboratorium
Meliputi:
- inventaris,
- peminjaman alat,
- persetujuan atau pemantauan bila ada.

**Status:** relatif sesuai.

**Yang perlu dicek:**
- pastikan alur persetujuan yang ditulis memang benar terjadi di aplikasi,
- hindari menyebut otomatisasi penuh bila sebenarnya ada intervensi manual.

#### 4. Implementasi logbook / pencatatan aktivitas
**Ini titik paling sensitif di bab implementasi.**

**Yang perlu dilakukan:**
- kalau bukti implementasinya tidak sekuat modul lain, jangan menulisnya seolah modul lengkap,
- gunakan istilah “dukungan pencatatan aktivitas praktikum secara digital”.

**Narasi aman:**
> Pada versi penelitian ini, sistem telah mendukung pencatatan aktivitas praktikum secara digital sebagai bagian dari integrasi proses praktikum. Namun demikian, fitur tersebut masih memiliki peluang pengembangan lebih lanjut agar dapat mendukung alur logbook digital yang lebih lengkap, terstandarisasi, dan komprehensif.

#### 5. Implementasi PWA, offline, cache, queue, sync
**Ini salah satu kekuatan terbesar skripsi.**

**Yang sudah baik:**
- sangat relevan dengan aplikasi,
- sesuai dengan arah penelitian,
- mendukung nilai kebaruan.

**Yang perlu dicermati:**
- jangan terlalu teknis tanpa mengaitkan manfaat ke pengguna,
- jelaskan manfaat praktis: akses lebih fleksibel, dukungan saat jaringan tidak stabil.

**Narasi aman:**
> Implementasi pendekatan Progressive Web App pada sistem memberikan dukungan akses yang lebih fleksibel bagi pengguna melalui mekanisme cache, penyimpanan lokal, dan sinkronisasi data. Dengan demikian, sistem tetap dapat memberikan pengalaman penggunaan yang adaptif pada kondisi konektivitas yang bervariasi.

#### 6. Pengujian black box
**Boleh tetap kuat**, tetapi jangan absolut tanpa batas.

**Narasi aman:**
> Berdasarkan hasil pengujian black box pada modul dan skenario yang diuji, sistem menunjukkan bahwa fungsi-fungsi utama yang diimplementasikan telah berjalan sesuai dengan rancangan.

#### 7. Pengujian white box
**Juga aman**, asal tetap dibatasi ruang lingkupnya.

**Narasi aman:**
> Pengujian white box menunjukkan bahwa logika internal pada unit-unit yang diuji telah berjalan sesuai dengan perilaku yang diharapkan pada cakupan pengujian penelitian ini.

#### 8. Evaluasi usability dengan SUS
**Secara substansi kuat**, tetapi ada masalah format tabel.

**Yang perlu diperbaiki:**
- tabel kategori SUS yang rusak harus dibangun ulang,
- narasi hasil harus jelas dan tidak berulang.

**Narasi aman:**
> Hasil evaluasi usability menggunakan System Usability Scale menunjukkan bahwa sistem memperoleh tingkat penerimaan yang baik dari pengguna. Temuan ini menunjukkan bahwa sistem tidak hanya memenuhi aspek fungsional, tetapi juga memberikan pengalaman penggunaan yang cukup baik dalam konteks praktikum dan pengelolaan laboratorium.

#### 9. Pembahasan hasil
**Yang sering jadi lemah:**
- hanya mengulang hasil,
- tidak membahas makna hasil.

**Yang perlu ditambahkan:**
- apa arti hasil pengujian terhadap tujuan penelitian,
- apa arti hasil SUS terhadap kelayakan implementasi,
- apa keterbatasan sistem.

**Narasi aman:**
> Secara keseluruhan, hasil implementasi dan pengujian menunjukkan bahwa sistem yang dikembangkan telah mampu memenuhi tujuan utama penelitian, yaitu mendukung integrasi pengelolaan kegiatan akademik dan operasional laboratorium dalam satu platform. Meskipun demikian, beberapa aspek masih memiliki ruang pengembangan untuk meningkatkan kelengkapan fitur dan tingkat kematangan implementasi pada tahap berikutnya.

### Putusan revisi BAB V
- **Perlu revisi detail tinggi.**
- Fokus pada: narasi implementasi logbook, batas klaim pengujian, perbaikan tabel SUS, dan penambahan pembahasan keterbatasan.

### Narasi siap pakai khusus hasil dan pembahasan – BAB V

#### A. Narasi pembuka subbab hasil implementasi
> Hasil implementasi sistem menunjukkan bahwa aplikasi yang dikembangkan telah mampu merealisasikan fungsi-fungsi utama yang dibutuhkan dalam pengelolaan kegiatan akademik dan operasional laboratorium. Implementasi dilakukan pada modul-modul inti yang mendukung proses autentikasi, pengelolaan jadwal, distribusi materi, pelaksanaan kuis, penilaian, inventaris, peminjaman alat, pengumuman, serta dukungan akses berbasis Progressive Web App.

#### B. Narasi pembahasan implementasi modul akademik
> Pada aspek akademik, sistem telah menyediakan dukungan terhadap aktivitas utama praktikum, mulai dari penyampaian informasi jadwal, akses materi pembelajaran, pelaksanaan evaluasi melalui kuis, hingga pengelolaan penilaian. Kehadiran modul-modul tersebut menunjukkan bahwa sistem tidak hanya berfungsi sebagai media informasi, tetapi juga sebagai sarana integrasi proses akademik yang sebelumnya cenderung berjalan secara terpisah.

#### C. Narasi pembahasan implementasi modul laboratorium
> Pada aspek operasional laboratorium, sistem telah mendukung pengelolaan inventaris dan proses peminjaman alat sebagai bagian dari aktivitas praktikum yang memerlukan koordinasi data dan kontrol penggunaan sumber daya. Implementasi ini menunjukkan bahwa sistem mampu menjembatani kebutuhan akademik dan kebutuhan administratif laboratorium dalam satu platform yang saling terhubung.

#### D. Narasi pembahasan logbook / pencatatan aktivitas yang aman
> Hasil implementasi juga menunjukkan bahwa sistem telah mendukung pencatatan aktivitas praktikum secara digital sebagai bagian dari integrasi proses praktikum. Namun demikian, pada versi penelitian ini dukungan tersebut masih berada pada tingkat implementasi yang dapat terus disempurnakan, sehingga pengembangannya di masa mendatang masih diperlukan untuk mencapai bentuk logbook digital yang lebih lengkap, lebih terstandarisasi, dan lebih komprehensif.

#### E. Narasi pembahasan PWA dan fitur offline
> Penerapan konsep Progressive Web App dalam sistem memberikan nilai tambah yang signifikan karena mendukung akses yang lebih fleksibel bagi pengguna. Melalui pemanfaatan cache, penyimpanan lokal, dan mekanisme sinkronisasi data, sistem mampu mempertahankan pengalaman penggunaan yang tetap adaptif meskipun konektivitas jaringan tidak selalu stabil. Temuan ini menunjukkan bahwa pendekatan PWA sesuai dengan kebutuhan lingkungan praktikum yang membutuhkan akses cepat dan andal.

#### F. Narasi pembahasan hasil pengujian black box
> Berdasarkan hasil pengujian black box, fungsi-fungsi utama yang diuji menunjukkan kesesuaian antara masukan, proses, dan keluaran sistem sesuai dengan rancangan yang telah ditetapkan. Hasil tersebut mengindikasikan bahwa pada modul dan skenario yang diuji, sistem telah mampu menjalankan kebutuhan fungsional secara baik.

#### G. Narasi pembahasan hasil pengujian white box
> Hasil pengujian white box menunjukkan bahwa logika internal pada unit-unit yang diuji telah berjalan sesuai dengan alur yang diharapkan. Temuan ini memperkuat bahwa implementasi sistem tidak hanya berfungsi pada tingkat antarmuka, tetapi juga memiliki konsistensi perilaku pada sisi logika program dalam cakupan pengujian penelitian ini.

#### H. Narasi pembahasan hasil usability / SUS
> Hasil evaluasi usability menggunakan System Usability Scale menunjukkan bahwa sistem memperoleh tingkat penerimaan yang baik dari pengguna. Hal ini menandakan bahwa sistem tidak hanya berhasil diimplementasikan dari sisi teknis, tetapi juga cukup mudah dipahami, digunakan, dan diterima dalam konteks aktivitas akademik dan laboratorium. Dengan demikian, hasil usability memperkuat temuan bahwa sistem memiliki kelayakan penggunaan yang baik pada lingkungan implementasinya.

#### I. Narasi analisis makna hasil terhadap tujuan penelitian
> Jika dikaitkan dengan tujuan penelitian, hasil implementasi dan pengujian menunjukkan bahwa sistem yang dikembangkan telah mampu memenuhi sasaran utama penelitian, yaitu menyediakan platform yang mendukung integrasi pengelolaan kegiatan akademik dan operasional laboratorium. Keberhasilan ini terlihat dari tersedianya modul-modul utama, dukungan akses berbasis PWA, serta hasil pengujian yang menunjukkan performa fungsional dan usability yang baik.

#### J. Narasi pembahasan keterbatasan hasil
> Meskipun hasil implementasi menunjukkan capaian yang baik, penelitian ini masih memiliki beberapa keterbatasan. Keterbatasan tersebut mencakup tingkat kematangan pada beberapa fitur tertentu, ruang lingkup pengujian yang difokuskan pada modul dan skenario tertentu, serta peluang pengembangan lanjutan agar integrasi sistem menjadi lebih lengkap. Oleh karena itu, hasil penelitian ini perlu dipahami sebagai capaian implementasi pada versi pengembangan yang telah diuji, sekaligus sebagai dasar untuk penyempurnaan sistem pada tahap berikutnya.

#### K. Narasi penutup subbab pembahasan
> Secara keseluruhan, hasil dan pembahasan menunjukkan bahwa sistem informasi manajemen praktikum yang dikembangkan telah memberikan kontribusi nyata terhadap digitalisasi pengelolaan praktikum dan laboratorium. Sistem telah berhasil mengintegrasikan berbagai fungsi utama dalam satu platform, menunjukkan performa fungsional yang baik, serta memperoleh penerimaan pengguna yang positif. Dengan demikian, penelitian ini tidak hanya menghasilkan produk sistem yang dapat digunakan, tetapi juga memberikan dasar yang kuat untuk pengembangan lanjutan yang lebih komprehensif.

---

## BAB VI – Kesimpulan dan Saran

### Status umum
Bab ini harus disusun sangat hati-hati karena merupakan wajah akhir skripsi. Kesimpulan tidak boleh lebih besar dari bukti.

### Pemeriksaan detail komponen BAB VI

#### 1. Judul bab
**Harus diperbaiki** bila masih typo.

#### 2. Kesimpulan utama
**Yang sudah aman:**
- sistem berhasil mendukung integrasi,
- PWA relevan,
- hasil pengujian baik,
- usability baik.

**Yang perlu dicek:**
- jangan menyimpulkan semua modul matang sempurna,
- jangan menyebut logbook digital final bila bukti implementasinya belum sekuat modul lain.

**Narasi aman:**
> Berdasarkan hasil analisis, perancangan, implementasi, dan pengujian, penelitian ini berhasil mengembangkan sistem informasi manajemen praktikum berbasis Progressive Web App yang mendukung integrasi proses akademik dan operasional laboratorium dalam satu platform. Sistem telah menyediakan fungsi-fungsi utama yang dibutuhkan pengguna serta menunjukkan kinerja fungsional yang sangat baik pada modul dan skenario yang diuji.

#### 3. Kesimpulan tentang usability
**Aman**, tetapi tetap jangan terlalu absolut.

**Narasi aman:**
> Hasil evaluasi usability menunjukkan bahwa sistem dapat diterima dengan baik oleh pengguna, sehingga mendukung pemanfaatannya dalam lingkungan akademik dan laboratorium.

#### 4. Saran
**Harus dibuat strategis.**

**Yang sebaiknya masuk:**
- penyempurnaan fitur logbook,
- pengembangan validasi data,
- perluasan pengujian,
- penguatan integrasi dan analitik.

**Narasi aman:**
> Untuk pengembangan selanjutnya, sistem dapat disempurnakan melalui peningkatan tingkat kematangan pada beberapa fitur tertentu, perluasan cakupan pengujian, penguatan validasi data, serta pengembangan dukungan dokumentasi aktivitas praktikum yang lebih komprehensif.

### Putusan revisi BAB VI
- **Perlu revisi menengah–tinggi.**
- Fokus utamanya adalah menjaga agar kesimpulan tetap jujur, kuat, dan tidak overclaim.

---

## Daftar Pustaka

### Status umum
Bagian ini **harus dirapikan serius** karena sangat memengaruhi kualitas akademik akhir.

### Pemeriksaan detail

#### 1. Kelengkapan metadata
Pastikan semua entri memiliki:
- penulis,
- tahun,
- judul,
- nama jurnal / konferensi / penerbit,
- volume / nomor bila ada,
- halaman bila ada,
- URL / DOI bila sumber web.

#### 2. Konsistensi gaya sitasi
- semua harus seragam,
- jangan campur format.

#### 3. Kesesuaian sitasi isi dengan daftar pustaka
- semua yang disitasi harus muncul di daftar pustaka,
- semua yang ada di daftar pustaka harus pernah disitasi.

#### 4. Kebersihan format
- hapus karakter rusak,
- rapikan copy-paste,
- cek tautan.

### Putusan revisi Daftar Pustaka
- **Prioritas sangat tinggi**.
- Ini bagian yang mudah dinilai salah bila tidak rapi.

---

# Putusan Final per Bab

## BAB I
- Status: **aman dengan revisi ringan**
- Fokus: perhalus kalimat yang terlalu absolut

## BAB II
- Status: **perlu revisi serius**
- Fokus: placeholder, sintesis penelitian terdahulu, konsistensi istilah

## BAB III
- Status: **cukup baik, perlu penguatan**
- Fokus: metodologi iteratif, keterbatasan penelitian

## BAB IV
- Status: **sangat penting direvisi detail**
- Fokus: bedakan desain konseptual dan implementasi aktual, terutama logbook

## BAB V
- Status: **sangat penting direvisi detail**
- Fokus: narasi implementasi, batas klaim pengujian, tabel SUS, keterbatasan implementasi

## BAB VI
- Status: **perlu revisi hati-hati**
- Fokus: kesimpulan jangan melebihi bukti, saran dibuat strategis

## Daftar Pustaka
- Status: **harus dirapikan**
- Fokus: kelengkapan dan konsistensi format

---

# Rujukan Letak Temuan pada Dokumen Skripsi

## Temuan 1 – Klaim logbook digital terlalu kuat
Rujukan baris pada [`docs/finis skripsi.docx`](docs/finis%20skripsi.docx):
- [`docs/finis skripsi.docx`](docs/finis%20skripsi.docx):565-577
- [`docs/finis skripsi.docx`](docs/finis%20skripsi.docx):579-587
- [`docs/finis skripsi.docx`](docs/finis%20skripsi.docx):1665-1699
- [`docs/finis skripsi.docx`](docs/finis%20skripsi.docx):1785-1917
- [`docs/finis skripsi.docx`](docs/finis%20skripsi.docx):2333-2399
- [`docs/finis skripsi.docx`](docs/finis%20skripsi.docx):2987-3004
- [`docs/finis skripsi.docx`](docs/finis%20skripsi.docx):3273-3409
- [`docs/finis skripsi.docx`](docs/finis%20skripsi.docx):3659-3721
- [`docs/finis skripsi.docx`](docs/finis%20skripsi.docx):7159-7194

## Temuan 2 – Placeholder pada kajian pustaka
Rujukan baris pada [`docs/finis skripsi.docx`](docs/finis%20skripsi.docx):
- [`docs/finis skripsi.docx`](docs/finis%20skripsi.docx):765-767

## Temuan 3 – Bagian hasil pengujian perlu dibatasi oleh ruang lingkup
Rujukan baris pada [`docs/finis skripsi.docx`](docs/finis%20skripsi.docx):
- Ringkasan [`black box`](docs/ANALISIS/TEMUAN-DAN-REVISI-SKRIPSI-FINAL.md): [`docs/finis skripsi.docx`](docs/finis%20skripsi.docx):4411-4479
- Ringkasan [`white box`](docs/ANALISIS/TEMUAN-DAN-REVISI-SKRIPSI-FINAL.md): [`docs/finis skripsi.docx`](docs/finis%20skripsi.docx):4481-5322
- Pernyataan penutup hasil uji: [`docs/finis skripsi.docx`](docs/finis%20skripsi.docx):5321-5322

## Temuan 4 – Bagian SUS dan tabel kategori rusak
Rujukan baris pada [`docs/finis skripsi.docx`](docs/finis%20skripsi.docx):
- Ringkasan SUS: [`docs/finis skripsi.docx`](docs/finis%20skripsi.docx):5419-5461
- Bagian distribusi / kategori SUS: [`docs/finis skripsi.docx`](docs/finis%20skripsi.docx):6915-6965
- Lanjutan hasil SUS: [`docs/finis skripsi.docx`](docs/finis%20skripsi.docx):7003-7049

## Temuan 5 – Kesimpulan perlu diperhalus
Rujukan baris pada [`docs/finis skripsi.docx`](docs/finis%20skripsi.docx):
- [`docs/finis skripsi.docx`](docs/finis%20skripsi.docx):7159-7194

## Temuan 6 – Daftar pustaka belum rapi / belum lengkap
Rujukan baris pada [`docs/finis skripsi.docx`](docs/finis%20skripsi.docx):
- [`docs/finis skripsi.docx`](docs/finis%20skripsi.docx):7235-7303

## Temuan 7 – Salah ketik / masalah editorial
Rujukan baris pada [`docs/finis skripsi.docx`](docs/finis%20skripsi.docx):
- “Keaslian Penelitan”: [`docs/finis skripsi.docx`](docs/finis%20skripsi.docx):117
- “Keaslian Penelitan”: [`docs/finis skripsi.docx`](docs/finis%20skripsi.docx):613
- Judul bab “KESIMPULA DAN SARAN”: [`docs/finis skripsi.docx`](docs/finis%20skripsi.docx):7161
- Contoh typo isi: [`docs/finis skripsi.docx`](docs/finis%20skripsi.docx):3525

# Prioritas Perbaikan Paling Mendesak

## Prioritas 1
1. Perhalus semua klaim tentang logbook digital
2. Hapus placeholder di kajian pustaka
3. Perbaiki tabel SUS yang rusak
4. Lengkapi dan rapikan daftar pustaka

## Prioritas 2
5. Tambahkan paragraf keterbatasan implementasi
6. Batasi klaim hasil pengujian dengan ruang lingkup yang diuji
7. Samakan semua istilah teknis

## Prioritas 3
8. Proofreading typo dan judul bab
9. Rapikan transisi antar subbab
10. Perkuat sintesis pembahasan hasil

---

# Template Narasi Sangat Aman Siap Tempel

## Narasi aman untuk logbook digital
> Sistem yang dikembangkan telah mendukung pencatatan aktivitas praktikum mahasiswa secara digital sebagai bagian dari integrasi proses praktikum dalam satu platform. Namun, implementasi pada versi penelitian ini masih memiliki peluang pengembangan lebih lanjut agar mendukung alur logbook digital yang lebih lengkap dan terstandarisasi.

## Narasi aman untuk hasil pengujian
> Berdasarkan hasil pengujian pada modul dan skenario yang diuji, sistem menunjukkan tingkat keberhasilan fungsional yang sangat baik dan telah berjalan sesuai dengan tujuan pengembangan pada penelitian ini.

## Narasi aman untuk PWA
> Penerapan pendekatan Progressive Web App pada sistem ini memberikan dukungan akses yang lebih fleksibel, termasuk kemampuan penggunaan yang tetap adaptif pada kondisi konektivitas yang tidak selalu stabil.

## Narasi aman untuk keterbatasan penelitian
> Meskipun sistem telah berhasil mengimplementasikan fungsi-fungsi utama yang dibutuhkan, penelitian ini masih memiliki keterbatasan pada tingkat kematangan beberapa fitur tertentu, ruang lingkup pengujian, dan cakupan evaluasi pengguna, sehingga masih terbuka peluang pengembangan lebih lanjut pada tahap berikutnya.

## Narasi aman untuk kesimpulan umum
> Secara keseluruhan, sistem yang dikembangkan telah berhasil mendukung digitalisasi pengelolaan kegiatan akademik dan operasional laboratorium dalam satu platform terintegrasi, serta memberikan dasar yang kuat untuk pengembangan lanjutan di masa mendatang.

---

# Checklist Revisi Praktis

## A. Isi/Substansi
- [ ] Revisi semua klaim logbook digital agar tidak overclaim
- [ ] Pastikan seluruh klaim fitur sesuai dengan implementasi aktual
- [ ] Tambahkan paragraf keterbatasan implementasi
- [ ] Tambahkan penegasan batas pengujian

## B. Tinjauan Pustaka
- [ ] Hapus placeholder yang tersisa
- [ ] Rapikan tabel kajian pustaka
- [ ] Pastikan semua penelitian terdahulu punya detail lengkap

## C. Hasil dan Pembahasan
- [ ] Revisi narasi fitur yang terlalu absolut
- [ ] Cek kembali kesesuaian hasil implementasi dengan aplikasi aktif
- [ ] Bangun ulang tabel distribusi SUS

## D. Daftar Pustaka
- [ ] Lengkapi referensi yang belum lengkap
- [ ] Perbaiki URL/sumber yang rusak
- [ ] Samakan gaya sitasi
- [ ] Validasi kembali semua sumber web

## E. Editorial
- [ ] Perbaiki judul bab yang typo
- [ ] Perbaiki salah ketik umum
- [ ] Samakan istilah teknis di semua bab
- [ ] Lakukan proofreading final seluruh dokumen

---

# Kesimpulan Akhir
Skripsi ini **sudah layak secara substansi** dan **secara umum sesuai dengan aplikasi penelitian**. Kekuatan utama dokumen terletak pada keselarasan antara konsep PWA, multi-peran, offline-first, dan hasil pengujian sistem.

Meski demikian, naskah masih memerlukan revisi penting agar lebih aman secara akademik dan lebih kuat saat sidang. Revisi paling krusial adalah menurunkan kekuatan klaim pada fitur logbook digital, membersihkan placeholder yang tersisa, melengkapi daftar pustaka, memperbaiki tabel SUS yang rusak, dan merapikan kesalahan editorial.

Apabila seluruh poin pada dokumen ini diperbaiki, maka skripsi akan menjadi jauh lebih konsisten, lebih defensible saat diuji, dan lebih selaras dengan artefak aplikasi yang benar-benar dibangun.