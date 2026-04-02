# Isi Teks Per Slide PPT Ujian Hasil

## Keterangan
Dokumen ini disusun untuk membantu pengisian isi presentasi pada template PPT yang sudah Anda miliki. Isi pada setiap slide dibuat singkat, formal, dan aman secara akademik agar mudah ditempel langsung ke slide presentasi ujian hasil.

Struktur ini dirancang untuk presentasi sekitar **10–15 menit**.

---

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

---

## Slide 2 – Latar Belakang
**Isi slide:**
- Pengelolaan praktikum di Akademi Kebidanan Mega Buana masih didominasi proses manual seperti kertas, spreadsheet, dan komunikasi yang tidak terintegrasi.
- Ditemukan masalah miskomunikasi jadwal, keterlambatan pelaporan, dan belum adanya media terpusat untuk logbook serta penilaian digital.
- Kondisi tersebut berdampak pada efisiensi kerja dosen, keterlibatan mahasiswa, dan akurasi pengelolaan data praktikum.
- Dibutuhkan sistem informasi praktikum yang terintegrasi, responsif, dan mudah diakses melalui berbagai perangkat.
- Pendekatan Progressive Web Application dipilih karena mendukung akses fleksibel, instalasi aplikasi, dan dukungan penggunaan pada kondisi jaringan yang bervariasi.

---

## Slide 3 – Rumusan Masalah
**Isi slide:**
- Bagaimana menganalisis kebutuhan pengguna, baik dosen maupun mahasiswa, terhadap sistem informasi praktikum di Akademi Kebidanan Mega Buana?
- Bagaimana merancang dan mengembangkan sistem informasi praktikum berbasis Progressive Web Application (PWA) menggunakan metode Research and Development (R&D)?
- Bagaimana mengevaluasi kelayakan dan efektivitas sistem dari aspek fungsionalitas, usability, dan manfaat praktisnya?

---

## Slide 4 – Tujuan Penelitian
**Isi slide:**
- Menganalisis kebutuhan pengguna terhadap sistem informasi praktikum di Akademi Kebidanan Mega Buana.
- Merancang dan mengembangkan sistem informasi praktikum berbasis PWA menggunakan metode R&D secara sistematis dan iteratif.
- Mendukung integrasi proses akademik dan operasional laboratorium dalam satu platform.
- Mengevaluasi sistem berdasarkan aspek fungsionalitas, usability, dan manfaat praktisnya.

---

## Slide 5 – Manfaat Penelitian
**Isi slide:**
**Manfaat Praktis**
- Membantu dosen dan mahasiswa dalam pengelolaan kegiatan praktikum.
- Mendukung pengelolaan laboratorium yang lebih terstruktur.
- Mempermudah akses informasi praktikum secara digital.

**Manfaat Akademik**
- Menjadi referensi pengembangan sistem praktikum berbasis PWA.
- Memberikan kontribusi pada pengembangan sistem informasi akademik terintegrasi.

---

## Slide 6 – Batasan Masalah
**Isi slide:**
1. Penelitian mencakup analisis kebutuhan, perancangan, pengembangan, dan evaluasi awal sistem informasi praktikum berbasis PWA.
2. Fitur utama difokuskan pada jadwal praktikum, peminjaman alat laboratorium, logbook kegiatan mahasiswa, penilaian praktikum, dan pengumuman.
3. Evaluasi dilakukan pada kelompok pengguna terbatas di Akademi Kebidanan Mega Buana.
4. Penelitian tidak membahas pengembangan konten materi praktikum secara mendalam, tetapi berfokus pada platform pengelolaannya.
5. Aspek keamanan dibatasi pada mekanisme standar aplikasi web tanpa uji penetrasi keamanan secara komprehensif.

---

## Slide 7 – Metode Penelitian
**Isi slide:**
- Penelitian menggunakan metode Research and Development (R&D) yang mengadaptasi model Ellis dan Levy.
- Tahapan utama: identifikasi masalah, penetapan tujuan, perancangan dan pengembangan solusi, pengujian, evaluasi hasil, dan komunikasi hasil.
- Pengembangan sistem dilakukan dengan pendekatan prototipe iteratif.
- Evaluasi dilakukan melalui pengujian black box, white box/unit test, dan usability menggunakan SUS.

---

## Slide 8 – Teknologi yang Digunakan
**Isi slide:**
- Frontend: React, TypeScript, Vite, dan Tailwind CSS
- Backend dan basis data: Supabase dan PostgreSQL
- Arsitektur akses: Progressive Web Application (PWA)
- Dukungan offline: service worker, cache lokal, IndexedDB, dan offline queue
- Sinkronisasi data: background sync, conflict handling, dan network status indicator

---

## Slide 9 – Gambaran Umum Sistem
**Isi slide:**
- Sistem dirancang untuk mengintegrasikan kebutuhan akademik praktikum dan kebutuhan operasional laboratorium.
- Pengguna sistem terdiri dari admin, dosen, mahasiswa, dan laboran.
- Sistem mencakup autentikasi, jadwal, materi, kuis, logbook, kehadiran, nilai, inventaris, peminjaman, pengumuman, dan sinkronisasi offline.
- Sistem dapat diakses melalui browser dan mendukung pengalaman penggunaan lintas perangkat.

---

## Slide 10 – Fitur Utama Sistem
**Isi slide:**
- Pengelolaan jadwal praktikum dan kelas
- Distribusi materi dan pengelolaan tugas/kuis
- Kehadiran, penilaian, dan rekap hasil belajar
- Logbook digital mahasiswa
- Inventaris laboratorium dan peminjaman alat
- Pengumuman, notifikasi, serta dukungan akses berbasis PWA

---

## Slide 11 – Perancangan Sistem
**Isi slide:**
- Perancangan menggunakan pendekatan terstruktur dengan DFD, ERD, use case, dan arsitektur sistem.
- DFD Level 1 memetakan empat proses utama: manajemen akun dan akses, manajemen akademik praktikum, operasional laboratorium, serta layanan PWA dan sinkronisasi offline.
- ERD menunjukkan integrasi domain pengguna, akademik, praktikum, penilaian, inventaris, komunikasi, dan sinkronisasi.
- Perancangan ini menjadi dasar implementasi sistem yang selaras dengan aplikasi aktual.

---

## Slide 12 – Implementasi Sistem
**Isi slide:**
- Sistem telah direalisasikan ke dalam modul autentikasi, dashboard berbasis peran, jadwal, materi, kuis, logbook, nilai, peminjaman, inventaris, pengumuman, dan sinkronisasi offline.
- Implementasi menunjukkan integrasi antarmodul dalam satu platform praktikum digital.
- Sistem tidak berhenti pada rancangan, tetapi telah tersedia sebagai aplikasi aktif yang dapat digunakan.
- Implementasi akhir berkembang lebih lengkap namun tetap mendukung tujuan utama penelitian.

---

## Slide 13 – Implementasi Modul Akademik
**Isi slide:**
- Modul akademik mencakup jadwal, materi, kuis, kehadiran, penilaian, dan assignment.
- Dosen dapat mengelola materi, kuis, kehadiran, nilai, dan telaah logbook mahasiswa.
- Mahasiswa dapat melihat jadwal, mengakses materi, mengerjakan kuis, mengisi logbook, dan memantau nilai.
- Modul akademik membantu mengintegrasikan proses pembelajaran praktikum yang sebelumnya terpisah.

---

## Slide 14 – Implementasi Modul Laboratorium
**Isi slide:**
- Sistem mendukung pengelolaan inventaris, persetujuan peminjaman, dan pemantauan penggunaan alat.
- Laboran dapat mengelola data inventaris, persetujuan jadwal, dan laporan operasional.
- Admin mendukung pengelolaan data master seperti pengguna, kelas, mata kuliah, dan laboratorium.
- Modul ini memperkuat integrasi kebutuhan akademik dan kebutuhan operasional laboratorium.

---

## Slide 15 – Dukungan PWA dan Akses Fleksibel
**Isi slide:**
- Sistem dikembangkan sebagai Progressive Web App yang dapat diakses melalui desktop maupun perangkat seluler.
- Fitur PWA yang diimplementasikan mencakup install prompt, offline indicator, cache strategy, offline queue, background sync, dan conflict resolution.
- Jawaban kuis dan data penting dapat disimpan sementara saat offline lalu disinkronkan kembali ketika koneksi tersedia.
- Pendekatan ini membuat sistem lebih adaptif terhadap kondisi jaringan yang berubah-ubah.

---

## Slide 16 – Hasil Pengujian Fungsional
**Isi slide:**
- Pengujian black box dilakukan pada modul autentikasi, admin, dosen, mahasiswa, laboran, dan fitur PWA.
- Total 45 skenario diuji.
- Seluruh skenario memperoleh status **Pass** dengan tingkat keberhasilan **100%**.
- Hasil ini menunjukkan bahwa fungsi utama sistem berjalan sesuai kebutuhan penelitian.

---

## Slide 17 – Hasil Pengujian Teknis dan Usability
**Isi slide:**
- Pengujian white box dilakukan menggunakan unit test dan integration test.
- Hasil eksekusi menunjukkan **238 file test** dan **5.317 test case** lulus **100%**.
- Evaluasi usability menggunakan SUS melibatkan **46 responden** dan menghasilkan skor rata-rata **75,11**.
- Skor SUS tersebut berada pada kategori **B (Good)** dan **Acceptable**.

---

## Slide 18 – Pembahasan Hasil
**Isi slide:**
- Sistem berhasil mengintegrasikan kegiatan akademik praktikum dan operasional laboratorium dalam satu platform.
- Implementasi PWA memberi nilai tambah pada fleksibilitas akses dan keberlanjutan layanan saat koneksi tidak stabil.
- Hasil black box, white box, dan SUS saling menguatkan bahwa sistem layak secara fungsi, logika teknis, dan penerimaan pengguna.
- Implementasi akhir menunjukkan artefak penelitian tidak hanya selesai dibangun, tetapi juga siap digunakan dalam konteks nyata.

---

## Slide 19 – Keterbatasan Penelitian
**Isi slide:**
- Evaluasi pengguna masih dilakukan pada kelompok terbatas, meskipun sudah melibatkan beberapa peran.
- Pengujian white box kuat pada modul yang diuji, tetapi tetap terbuka untuk perluasan cakupan di masa depan.
- Penelitian belum mencakup pengujian penetrasi keamanan secara komprehensif.
- Beberapa penyempurnaan pengalaman pengguna dan stabilitas sinkronisasi masih dapat dikembangkan lebih lanjut.

---

## Slide 20 – Kesimpulan
**Isi slide:**
- Penelitian berhasil menghasilkan sistem informasi praktikum berbasis PWA yang mendukung kebutuhan akademik dan operasional laboratorium.
- Sistem telah diimplementasikan pada modul multi-peran: admin, dosen, mahasiswa, dan laboran.
- Hasil pengujian menunjukkan fungsi utama berjalan baik, logika internal stabil, dan sistem diterima pengguna.
- Dengan demikian, sistem layak dipandang sebagai solusi digital yang relevan untuk pengelolaan praktikum.

---

## Slide 21 – Saran
**Isi slide:**
- Mengoptimalkan background sync agar lebih konsisten pada lebih banyak browser dan perangkat.
- Mengembangkan fitur analitik dan pelaporan untuk mendukung evaluasi dan pengambilan keputusan.
- Memperluas cakupan pengujian otomatis dan evaluasi pengguna.
- Menambahkan integrasi real-time dan monitoring aktivitas praktikum yang lebih detail.
- Mengarahkan pengembangan berikutnya ke integrasi dengan sistem akademik institusi yang lebih luas.

---

## Slide 22 – Penutup
**Isi slide:**
Terima kasih

**Subteks:**
Saya siap menerima saran dan masukan dari dewan penguji.

---

## Catatan Akhir
Jika template PPT Anda memiliki jumlah slide yang lebih sedikit, isi dari beberapa slide dapat digabung, misalnya:
- [`Slide 3`](docs/ANALISIS/ISI-TEKS-PER-SLIDE-PPT-UJIAN-HASIL.md:28) + [`Slide 4`](docs/ANALISIS/ISI-TEKS-PER-SLIDE-PPT-UJIAN-HASIL.md:35)
- [`Slide 12`](docs/ANALISIS/ISI-TEKS-PER-SLIDE-PPT-UJIAN-HASIL.md:85) + [`Slide 13`](docs/ANALISIS/ISI-TEKS-PER-SLIDE-PPT-UJIAN-HASIL.md:92) + [`Slide 14`](docs/ANALISIS/ISI-TEKS-PER-SLIDE-PPT-UJIAN-HASIL.md:99)
- [`Slide 16`](docs/ANALISIS/ISI-TEKS-PER-SLIDE-PPT-UJIAN-HASIL.md:113) + [`Slide 17`](docs/ANALISIS/ISI-TEKS-PER-SLIDE-PPT-UJIAN-HASIL.md:120)
- [`Slide 20`](docs/ANALISIS/ISI-TEKS-PER-SLIDE-PPT-UJIAN-HASIL.md:142) + [`Slide 21`](docs/ANALISIS/ISI-TEKS-PER-SLIDE-PPT-UJIAN-HASIL.md:149)

Dokumen ini sudah siap dipakai sebagai sumber isi teks untuk ditempel ke template PPT ujian hasil.