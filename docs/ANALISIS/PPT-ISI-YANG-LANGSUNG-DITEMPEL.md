# Isi PPT yang Langsung Ditempel

Dokumen ini adalah versi **paling sederhana**.

Cara pakai:
- buka [`docs/TEMPLATE 106.pptx`](docs/TEMPLATE%20106.pptx)
- buat urutan slide sesuai [`docs/ANALISIS/SUSUN-ULANG-PPT-UJIAN-HASIL.md`](docs/ANALISIS/SUSUN-ULANG-PPT-UJIAN-HASIL.md)
- lalu **copy-paste isi di bawah ini per slide**

---

## Slide 1 — Cover
**Judul:**
Analisis dan Perancangan Sistem Informasi Praktikum Berbasis Progressive Web Application (PWA) Menggunakan Metode R&D di Akademi Kebidanan Mega Buana

**Subjudul:**
Ujian Hasil Skripsi

**Identitas:**
- Taufiq
- IK.22.11.009
- Sarjana Informatika
- Fakultas Ilmu Komputer
- Universitas Mega Buana Palopo
- Pembimbing I: Abdul Malik, S.Kom., M.Cs
- Pembimbing II: Fahmi Kurniawan, S.Kom., M.M

---

## Slide 2 — Latar Belakang
- Pengelolaan praktikum di Akademi Kebidanan Mega Buana masih didominasi proses manual seperti kertas, spreadsheet, dan komunikasi yang tidak terintegrasi.
- Ditemukan masalah miskomunikasi jadwal, keterlambatan pelaporan, serta belum adanya media terpusat untuk logbook dan penilaian digital.
- Kondisi tersebut berdampak pada efisiensi kerja dosen, keterlibatan mahasiswa, dan akurasi pengelolaan data praktikum.
- Dibutuhkan sistem informasi praktikum berbasis Progressive Web Application yang terintegrasi, responsif, dan mudah diakses pada berbagai kondisi jaringan.

---

## Slide 3 — Rumusan Masalah
- Bagaimana menganalisis kebutuhan pengguna terhadap sistem informasi praktikum di Akademi Kebidanan Mega Buana?
- Bagaimana merancang dan mengembangkan sistem informasi praktikum berbasis Progressive Web Application menggunakan metode Research and Development?
- Bagaimana mengevaluasi kelayakan dan efektivitas sistem dari aspek fungsionalitas, usability, dan manfaat praktisnya?

---

## Slide 4 — Tujuan Penelitian
- Menganalisis kebutuhan pengguna terhadap sistem informasi praktikum.
- Merancang dan mengembangkan sistem informasi praktikum berbasis PWA menggunakan metode R&D.
- Mendukung integrasi proses akademik dan operasional laboratorium dalam satu platform.
- Mengevaluasi sistem berdasarkan aspek fungsionalitas, usability, dan manfaat praktisnya.

---

## Tambahan Jika Template Anda Memiliki 2 Kotak Manfaat Penelitian

### Manfaat Teoritis
- Menambah referensi akademik tentang pengembangan sistem informasi pendidikan berbasis PWA pada konteks pendidikan vokasi kebidanan.
- Memperkaya kajian penerapan metode R&D, user-centered design, serta implementasi fitur PWA untuk pembelajaran praktis.

### Manfaat Praktis
- Memberikan solusi sistem informasi praktikum yang lebih efisien, terintegrasi, dan mudah diakses bagi dosen dan mahasiswa.
- Mendukung pencatatan, pelaporan, penjadwalan, evaluasi praktikum, serta berpotensi diadaptasi pada institusi vokasi kesehatan lain.

**Catatan:**
Jika di template hanya ada 2 bagian manfaat, maka cukup pakai **Manfaat Teoritis** dan **Manfaat Praktis** ini. Jadi isi skripsi yang banyak diringkas menjadi 2 kelompok besar tanpa mengubah makna.

---

## Slide 5 — Batasan Masalah
1. Penelitian difokuskan pada analisis kebutuhan, perancangan, pengembangan, dan evaluasi awal sistem informasi praktikum berbasis PWA.
2. Fitur yang dibahas meliputi jadwal praktikum, peminjaman alat laboratorium, logbook kegiatan mahasiswa, penilaian praktikum, pengumuman, serta pengelolaan platform praktikum.
3. Evaluasi dilakukan pada kelompok pengguna terbatas di Akademi Kebidanan Mega Buana, dengan aspek keamanan dibatasi pada mekanisme standar aplikasi web tanpa uji penetrasi komprehensif.

---

## Slide 6 — Metode Penelitian
- Penelitian menggunakan metode Research and Development yang mengadaptasi model Ellis dan Levy.
- Tahapan utama meliputi identifikasi masalah, penetapan tujuan, perancangan dan pengembangan solusi, pengujian, evaluasi hasil, dan komunikasi hasil.
- Pengembangan dilakukan dengan pendekatan prototipe iteratif.
- Evaluasi dilakukan melalui black box, white box/unit test, dan usability menggunakan SUS.

---

## Slide 7 — Teknologi dan Arsitektur Sistem
- Frontend: React, TypeScript, Vite, dan Tailwind CSS.
- Backend dan basis data: Supabase dan PostgreSQL.
- Arsitektur akses: Progressive Web Application.
- Dukungan offline: service worker, cache lokal, IndexedDB, dan offline queue.
- Sinkronisasi data: background sync, conflict handling, dan network status indicator.

---

## Slide 8 — Gambaran Umum Sistem
- Sistem melibatkan empat peran utama: admin, dosen, mahasiswa, dan laboran.
- Sistem mendukung pengelolaan kegiatan akademik dan operasional laboratorium dalam satu platform.
- Proses utama mencakup autentikasi, jadwal, materi, kuis, kehadiran, nilai, logbook, inventaris, peminjaman, pengumuman, dan sinkronisasi offline.
- Sistem menjadi media digital untuk mendukung manajemen praktikum secara menyeluruh.

---

## Slide 9 — Fitur Utama Sistem
- Pengelolaan jadwal praktikum dan kelas.
- Distribusi materi serta pengelolaan kuis/assignment.
- Kehadiran, penilaian, dan rekap hasil belajar.
- Logbook digital mahasiswa.
- Inventaris laboratorium dan peminjaman alat.
- Pengumuman, notifikasi, serta dukungan akses berbasis PWA.

---

## Slide 10 — Hasil Implementasi Sistem
- Sistem telah direalisasikan ke dalam modul autentikasi, dashboard berbasis peran, jadwal, materi, kuis, logbook, nilai, peminjaman, inventaris, pengumuman, dan sinkronisasi offline.
- Fungsi utama telah direalisasikan sesuai kebutuhan yang dianalisis.
- Implementasi menunjukkan integrasi proses akademik dan operasional laboratorium dalam satu platform.
- Sistem dapat digunakan sebagai media pengelolaan praktikum secara digital.

---

## Slide 11 — Hasil Implementasi Modul Akademik
- Modul akademik mencakup jadwal, materi, kuis, assignment, kehadiran, penilaian, dan logbook.
- Dosen dapat mengelola materi, kuis, kehadiran, nilai, dan telaah logbook mahasiswa.
- Mahasiswa dapat melihat jadwal, mengakses materi, mengerjakan kuis, mengisi logbook, dan memantau nilai.
- Integrasi informasi akademik menjadi lebih baik dibanding proses yang sebelumnya terpisah.

---

## Slide 12 — Hasil Implementasi Modul Laboratorium
- Sistem mendukung pengelolaan inventaris, persetujuan peminjaman, dan pemantauan penggunaan alat.
- Data penggunaan alat menjadi lebih terstruktur dan terdokumentasi.
- Proses operasional laboratorium menjadi lebih mudah dipantau melalui peran laboran dan admin.
- Sistem membantu integrasi kebutuhan akademik dan administratif laboratorium.

---

## Slide 13 — Dukungan PWA dan Akses Fleksibel
- Sistem dikembangkan sebagai Progressive Web App yang dapat diakses melalui desktop maupun perangkat seluler.
- Fitur PWA yang diimplementasikan mencakup install prompt, offline indicator, cache strategy, offline queue, background sync, dan conflict resolution.
- Data penting dapat disimpan sementara saat offline lalu disinkronkan kembali ketika koneksi tersedia.
- Sistem dirancang adaptif pada kondisi konektivitas yang bervariasi.

---

## Slide 14 — Hasil Pengujian Fungsional
- Pengujian black box dilakukan pada modul autentikasi, admin, dosen, mahasiswa, laboran, dan fitur PWA.
- Total 45 skenario diuji.
- Seluruh skenario memperoleh status Pass dengan tingkat keberhasilan 100%.
- Sistem dinilai layak secara fungsional pada cakupan pengujian yang dilakukan.

---

## Slide 15 — Hasil Pengujian Teknis dan Usability
- Pengujian white box dilakukan melalui unit test dan integration test.
- Hasil eksekusi menunjukkan 238 file test dan 5.317 test case lulus 100%.
- Evaluasi usability menggunakan SUS melibatkan 46 responden dan menghasilkan skor rata-rata 75,11.
- Skor SUS tersebut berada pada kategori B (Good) dan Acceptable.

---

## Slide 16 — Pembahasan Hasil
- Sistem berhasil mengintegrasikan kegiatan akademik praktikum dan operasional laboratorium dalam satu platform.
- Implementasi PWA memberi nilai tambah pada fleksibilitas akses dan keberlanjutan layanan saat koneksi tidak stabil.
- Hasil black box, white box, dan SUS saling menguatkan bahwa sistem layak secara fungsi, logika teknis, dan penerimaan pengguna.
- Implementasi akhir menunjukkan artefak penelitian tidak hanya selesai dibangun, tetapi juga siap digunakan dalam konteks nyata.

---

## Slide 17 — Keterbatasan Penelitian
- Evaluasi pengguna masih dilakukan pada kelompok terbatas, meskipun telah melibatkan beberapa peran.
- Pengujian white box kuat pada modul yang diuji, tetapi tetap terbuka untuk perluasan cakupan di masa depan.
- Penelitian belum mencakup pengujian keamanan secara komprehensif.
- Beberapa penyempurnaan pengalaman pengguna dan stabilitas sinkronisasi masih dapat dikembangkan lebih lanjut.

---

## Slide 18 — Kesimpulan
- Penelitian berhasil menghasilkan sistem informasi praktikum berbasis PWA yang mendukung kebutuhan akademik dan operasional laboratorium.
- Sistem telah diimplementasikan pada modul multi-peran: admin, dosen, mahasiswa, dan laboran.
- Hasil pengujian menunjukkan fungsi utama berjalan baik, logika internal stabil, dan sistem diterima pengguna.
- Sistem layak dipandang sebagai solusi digital yang relevan untuk pengelolaan praktikum.

---

## Slide 19 — Saran
- Mengoptimalkan background sync agar lebih konsisten pada lebih banyak browser dan perangkat.
- Mengembangkan fitur analitik dan pelaporan untuk mendukung evaluasi dan pengambilan keputusan.
- Memperluas cakupan pengujian otomatis dan evaluasi pengguna.
- Menambahkan integrasi real-time dan monitoring aktivitas praktikum yang lebih detail.
- Mengarahkan pengembangan berikutnya ke integrasi dengan sistem akademik institusi yang lebih luas.

---

## Slide 20 — Penutup
**Terima kasih**

**Saya siap memasuki sesi tanya jawab dan demonstrasi sistem.**
