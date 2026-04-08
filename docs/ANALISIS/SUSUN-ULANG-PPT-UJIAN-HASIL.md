# Susun Ulang PPT Ujian Hasil

Dokumen ini menyusun ulang presentasi dari versi seminar proposal pada [`docs/ppt sempro Teknik Informatika.pptx`](docs/ppt%20sempro%20Teknik%20Informatika.pptx) menjadi struktur presentasi **ujian hasil** yang lebih tepat. Penyusunan ini tetap mempertahankan alur yang sudah familiar, tetapi fokus isi digeser dari **rencana penelitian** menjadi **hasil implementasi, pengujian, pembahasan, kesimpulan, dan saran**.

Dokumen ini juga diselaraskan dengan materi pada [`docs/ANALISIS/ISI-TEKS-PER-SLIDE-PPT-UJIAN-HASIL.md`](docs/ANALISIS/ISI-TEKS-PER-SLIDE-PPT-UJIAN-HASIL.md).

---

## Prinsip Susunan Baru

- Fokus utama presentasi adalah **apa yang berhasil dibangun, diuji, dan dibahas**.
- Bagian proposal seperti jadwal penelitian, hasil yang diharapkan, dan kesimpulan awal **tidak lagi dijadikan isi utama**.
- Bagian metodologi tetap dipertahankan, tetapi dibuat ringkas.
- Bagian hasil implementasi dan pengujian menjadi inti presentasi.
- Durasi ideal: **10–15 menit**.

---

## Struktur PPT Ujian Hasil yang Disarankan

## Slide 1 – Judul Penelitian

**Judul:**
Analisis dan Perancangan Sistem Informasi Praktikum Berbasis Progressive Web Application (PWA) Menggunakan Metode R&D di Akademi Kebidanan Mega Buana

**Subjudul:**
Ujian Hasil Skripsi

**Identitas:**

- Nama: Taufiq
- NIM: IK.22.11.009
- Program Studi: Sarjana Informatika
- Fakultas: Fakultas Ilmu Komputer
- Institusi: Universitas Mega Buana Palopo
- Dosen Pembimbing I: Abdul Malik, S.Kom., M.Cs
- Dosen Pembimbing II: Fahmi Kurniawan, S.Kom., M.M

**Fungsi slide:**
Slide pembuka formal.

---

## Slide 2 – Latar Belakang

**Isi inti:**

- Pengelolaan praktikum di Akademi Kebidanan Mega Buana masih didominasi proses manual seperti kertas, spreadsheet, dan komunikasi yang tidak terintegrasi.
- Ditemukan masalah miskomunikasi jadwal, keterlambatan pelaporan, dan belum adanya media terpusat untuk logbook serta penilaian digital.
- Kondisi tersebut berdampak pada efisiensi kerja dosen, keterlibatan mahasiswa, dan akurasi pengelolaan data praktikum.
- Dibutuhkan sistem informasi praktikum yang terintegrasi, responsif, dan mudah diakses melalui berbagai perangkat.
- Pendekatan Progressive Web Application dipilih karena mendukung akses fleksibel, instalasi aplikasi, dan dukungan penggunaan pada kondisi jaringan yang bervariasi.

**Fungsi slide:**
Menjelaskan alasan kenapa penelitian ini penting.

---

## Slide 3 – Rumusan Masalah

**Isi inti:**

- Bagaimana menganalisis kebutuhan pengguna, baik dosen maupun mahasiswa, terhadap sistem informasi praktikum di Akademi Kebidanan Mega Buana?
- Bagaimana merancang dan mengembangkan sistem informasi praktikum berbasis Progressive Web Application (PWA) menggunakan metode Research and Development (R&D)?
- Bagaimana mengevaluasi kelayakan dan efektivitas sistem dari aspek fungsionalitas, usability, dan manfaat praktisnya?

**Fungsi slide:**
Menunjukkan fokus pertanyaan penelitian.

---

## Slide 4 – Tujuan Penelitian

**Isi inti:**

- Menganalisis kebutuhan pengguna terhadap sistem informasi praktikum di Akademi Kebidanan Mega Buana.
- Merancang dan mengembangkan sistem informasi praktikum berbasis PWA menggunakan metode R&D secara sistematis dan iteratif.
- Mendukung integrasi proses akademik dan operasional laboratorium dalam satu platform.
- Mengevaluasi sistem berdasarkan aspek fungsionalitas, usability, dan manfaat praktisnya.

**Fungsi slide:**
Menjelaskan sasaran penelitian yang sudah diwujudkan.

---

## Slide 5 – Batasan Masalah

**Isi inti:**

1. Penelitian mencakup analisis kebutuhan, perancangan, pengembangan, dan evaluasi awal sistem informasi praktikum berbasis PWA.
2. Fitur utama difokuskan pada jadwal praktikum, peminjaman alat laboratorium, logbook kegiatan mahasiswa, penilaian praktikum, dan pengumuman.
3. Evaluasi dilakukan pada kelompok pengguna terbatas di Akademi Kebidanan Mega Buana.
4. Penelitian tidak membahas pengembangan konten materi praktikum secara mendalam, tetapi berfokus pada platform pengelolaannya.
5. Aspek keamanan dibatasi pada mekanisme standar aplikasi web tanpa uji penetrasi keamanan secara komprehensif.

**Fungsi slide:**
Menjaga ruang lingkup presentasi tetap aman dan jelas.

---

## Slide 6 – Penelitian Terdahulu dan Gap Penelitian

**Isi inti:**

- **Maspaeni et al. (2023):** Menerapkan PWA pada pengajuan alat kesehatan, namun belum untuk manajemen akademik praktikum.
- **Muzakki et al. (2025):** Menggunakan PWA untuk repositori digital, namun tidak memiliki fitur praktikum seperti jadwal dan logbook.
- **Gap Penelitian:** Belum ada penelitian PWA yang difokuskan pada integrasi manajemen praktikum secara komprehensif, khususnya di institusi vokasi kebidanan.

**Fungsi slide:**
Menunjukkan letak kontribusi dan kebaruan skripsi ini.

---

## Slide 7 – Landasan Teori

**Isi inti:**

- **Progressive Web Application (PWA):** Mendukung akses sistem secara fleksibel dan responsif pada berbagai perangkat, termasuk dalam mode offline.
- **Research and Development (R&D):** Digunakan sebagai metode untuk mengembangkan dan mengevaluasi sistem.
- **Role-Based Access Control (RBAC):** Mendukung pembagian hak akses pengguna (admin, dosen, mahasiswa, laboran).
- **User-Centered Design (UCD):** Memastikan sistem dirancang sesuai kebutuhan pengguna akhir.

**Fungsi slide:**
Menyampaikan pijakan teori yang benar-benar digunakan dalam pengembangan sistem.

---

## Slide 8 – Metode Penelitian

**Isi inti:**

- Penelitian menggunakan metode Research and Development (R&D) yang mengadaptasi model Ellis dan Levy.
- Tahapan utama meliputi identifikasi masalah, penetapan tujuan, perancangan dan pengembangan solusi, pengujian, evaluasi hasil, dan komunikasi hasil.
- Pengembangan dilakukan dengan pendekatan prototipe iteratif.
- Evaluasi dilakukan melalui black box, white box/unit test, dan usability menggunakan SUS.

**Fungsi slide:**
Menjelaskan metode tanpa terlalu panjang.

---

## Slide 9 – Teknologi dan Arsitektur Sistem

**Isi inti:**

- Sistem dikembangkan menggunakan React, TypeScript, Vite, Tailwind CSS, Supabase, dan PostgreSQL.
- Arsitektur mencakup frontend, backend, basis data, autentikasi, storage, dan layanan PWA.
- Dukungan PWA diterapkan melalui service worker, cache lokal, IndexedDB, offline queue, dan sinkronisasi.
- Arsitektur ini mendukung integrasi proses akademik, operasional laboratorium, dan akses lintas perangkat.

**Fungsi slide:**
Menjembatani bagian metode ke hasil implementasi.

---

## Slide 10 – Gambaran Umum Sistem

**Isi inti:**

- Sistem melibatkan empat peran utama: admin, dosen, mahasiswa, dan laboran.
- Sistem mendukung pengelolaan kegiatan akademik dan operasional laboratorium dalam satu platform.
- Proses utama mencakup autentikasi, jadwal, materi, kuis, kehadiran, nilai, logbook, inventaris, peminjaman, pengumuman, dan sinkronisasi offline.
- Sistem menjadi media digital yang dirancang untuk mendukung manajemen praktikum secara menyeluruh.

**Fungsi slide:**
Memberi gambaran singkat sebelum masuk ke fitur dan hasil.

---

## Slide 11 – Fitur Utama Sistem

**Isi inti:**

- Pengelolaan jadwal praktikum dan kelas
- Distribusi materi serta pengelolaan kuis/assignment
- Kehadiran, penilaian, dan rekap hasil belajar
- Logbook digital mahasiswa
- Inventaris laboratorium dan peminjaman alat
- Pengumuman, notifikasi, serta dukungan akses berbasis PWA

**Fungsi slide:**
Menjelaskan ruang implementasi yang benar-benar dibangun.

---

## Slide 12 – Hasil Implementasi Sistem

**Isi inti:**

- Sistem telah direalisasikan ke dalam modul autentikasi, dashboard berbasis peran, jadwal, materi, kuis, logbook, nilai, peminjaman, inventaris, pengumuman, dan sinkronisasi offline.
- Fungsi utama telah direalisasikan sesuai kebutuhan yang dianalisis.
- Implementasi menunjukkan integrasi proses akademik dan operasional laboratorium dalam satu platform.
- Sistem dapat digunakan sebagai media pengelolaan praktikum secara digital.

**Fungsi slide:**
Menjadi pintu masuk bagian hasil.

---

## Slide 13 – Hasil Implementasi Modul Akademik

**Isi inti:**

- Modul akademik mencakup jadwal, materi, kuis, assignment, kehadiran, penilaian, dan logbook.
- Dosen dapat mengelola materi, kuis, kehadiran, nilai, dan telaah logbook mahasiswa.
- Mahasiswa dapat melihat jadwal, mengakses materi, mengerjakan kuis, mengisi logbook, dan memantau nilai.
- Integrasi informasi akademik menjadi lebih baik dibanding proses yang sebelumnya terpisah.

**Fungsi slide:**
Menunjukkan hasil pada sisi akademik.

---

## Slide 14 – Hasil Implementasi Modul Laboratorium

**Isi inti:**

- Sistem mendukung pengelolaan inventaris, persetujuan peminjaman, dan pemantauan penggunaan alat.
- Data penggunaan alat menjadi lebih terstruktur dan terdokumentasi.
- Proses operasional laboratorium menjadi lebih mudah dipantau melalui peran laboran dan admin.
- Sistem membantu integrasi kebutuhan akademik dan administratif laboratorium.

**Fungsi slide:**
Menunjukkan hasil pada sisi operasional laboratorium.

---

## Slide 15 – Dukungan PWA dan Akses Fleksibel

**Isi inti:**

- Sistem dikembangkan sebagai Progressive Web App yang dapat diakses melalui desktop maupun perangkat seluler.
- Fitur PWA yang diimplementasikan mencakup install prompt, offline indicator, cache strategy, offline queue, background sync, dan conflict resolution.
- Data penting dapat disimpan sementara saat offline lalu disinkronkan kembali ketika koneksi tersedia.
- Sistem dirancang adaptif pada kondisi konektivitas yang bervariasi.

**Fungsi slide:**
Menunjukkan nilai tambah pendekatan PWA.

---

## Slide 16 – Hasil Pengujian Fungsional

**Isi inti:**

- Pengujian black box dilakukan pada modul autentikasi, admin, dosen, mahasiswa, laboran, dan fitur PWA.
- Total 45 skenario diuji.
- Seluruh skenario memperoleh status Pass dengan tingkat keberhasilan 100%.
- Sistem dinilai layak secara fungsional pada cakupan pengujian yang dilakukan.

**Fungsi slide:**
Menyampaikan bukti bahwa sistem berjalan.

---

## Slide 17 – Hasil Pengujian Teknis dan Usability

**Isi inti:**

- Pengujian white box dilakukan melalui unit test dan integration test.
- Hasil eksekusi menunjukkan 238 file test dan 5.317 test case lulus 100%.
- Evaluasi usability menggunakan SUS melibatkan 46 responden dan menghasilkan skor rata-rata 75,11.
- Skor SUS tersebut berada pada kategori B (Good) dan Acceptable.

---

## Slide 18 – Pembahasan Hasil

**Isi inti:**

- Sistem berhasil mengintegrasikan kegiatan akademik praktikum dan operasional laboratorium dalam satu platform.
- Implementasi PWA memberi nilai tambah pada fleksibilitas akses dan keberlanjutan layanan saat koneksi tidak stabil.
- Hasil black box, white box, dan SUS saling menguatkan bahwa sistem layak secara fungsi, logika teknis, dan penerimaan pengguna.
- Implementasi akhir menunjukkan artefak penelitian tidak hanya selesai dibangun, tetapi juga siap digunakan dalam konteks nyata.

**Fungsi slide:**
Menjelaskan makna hasil, bukan sekadar daftar fitur.

---

## Slide 19 – Keterbatasan Penelitian

**Isi inti:**

- Evaluasi pengguna masih dilakukan pada kelompok terbatas, meskipun telah melibatkan beberapa peran.
- Pengujian white box kuat pada modul yang diuji, tetapi tetap terbuka untuk perluasan cakupan di masa depan.
- Penelitian belum mencakup pengujian keamanan secara komprehensif.
- Beberapa penyempurnaan pengalaman pengguna dan stabilitas sinkronisasi masih dapat dikembangkan lebih lanjut.

**Fungsi slide:**
Menjaga pembahasan tetap jujur dan aman secara akademik.

---

## Slide 20 – Kesimpulan

**Isi inti:**

- Penelitian berhasil menghasilkan sistem informasi praktikum berbasis PWA yang mendukung kebutuhan akademik dan operasional laboratorium.
- Sistem telah diimplementasikan pada modul multi-peran: admin, dosen, mahasiswa, dan laboran.
- Hasil pengujian menunjukkan fungsi utama berjalan baik, logika internal stabil, dan sistem diterima pengguna.
- Sistem layak dipandang sebagai solusi digital yang relevan untuk pengelolaan praktikum.

**Fungsi slide:**
Menjawab tujuan penelitian secara ringkas.

---

## Slide 21 – Saran

**Isi inti:**

- Mengoptimalkan background sync agar lebih konsisten pada lebih banyak browser dan perangkat.
- Mengembangkan fitur analitik dan pelaporan untuk mendukung evaluasi dan pengambilan keputusan.
- Memperluas cakupan pengujian otomatis dan evaluasi pengguna.
- Menambahkan integrasi real-time dan monitoring aktivitas praktikum yang lebih detail.
- Mengarahkan pengembangan berikutnya ke integrasi dengan sistem akademik institusi yang lebih luas.

**Fungsi slide:**
Menunjukkan arah pengembangan lanjutan.

---

## Slide 22 – Penutup

**Isi inti:**
Terima kasih.

**Subteks:**
Saya siap menerima saran dan masukan dari dewan penguji.

**Fungsi slide:**
Menutup presentasi secara formal.

---

## Rekomendasi Penyajian

- Jika waktu sempit, gunakan **18 slide** dengan menggabungkan [`Slide 7`](docs/ANALISIS/SUSUN-ULANG-PPT-UJIAN-HASIL.md), [`Slide 8`](docs/ANALISIS/SUSUN-ULANG-PPT-UJIAN-HASIL.md), dan [`Slide 9`](docs/ANALISIS/SUSUN-ULANG-PPT-UJIAN-HASIL.md).
- Jika penguji fokus pada implementasi, beri penekanan lebih pada [`Slide 10`](docs/ANALISIS/SUSUN-ULANG-PPT-UJIAN-HASIL.md) sampai [`Slide 16`](docs/ANALISIS/SUSUN-ULANG-PPT-UJIAN-HASIL.md).
- Jika penguji meminta penjelasan keterkaitan dengan proposal, tunjukkan bahwa alur lama tetap dipakai, tetapi isi sudah berubah dari **rencana** menjadi **hasil nyata**.

---

## Kesimpulan Penyusunan

Susunan ini adalah bentuk paling aman untuk ujian hasil karena:

- tetap konsisten dengan proposal,
- tidak terlalu panjang,
- menonjolkan implementasi dan pengujian,
- serta sesuai dengan karakter penelitian sistem informasi berbasis PWA.
