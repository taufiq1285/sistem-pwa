# Struktur Slide Sidang Skripsi dengan Visual

Dokumen ini adalah panduan final untuk menyusun presentasi sidang skripsi 25 slide. Struktur terdiri dari 20 slide isi dan 5 slide pembatas BAB agar alur presentasi lebih rapi, selaras dengan PPT final, dan memberi jeda visual antarbagian.

## Aturan Umum Visual

- Gunakan visual dari project/repo agar presentasi konsisten dengan skripsi dan aplikasi aktual.
- Satu slide cukup memiliki satu visual utama, kecuali slide implementasi dashboard yang boleh memakai tiga screenshot kecil.
- Diagram yang terlalu padat perlu dibuat ulang versi ringkas untuk PPT.
- Slide pembatas BAB memakai judul besar, warna marun/emas, minim teks, dan berfungsi sebagai jeda antarbagian.
- Angka pengujian wajib konsisten:
  - Black box: 45 skenario, 100% Pass.
  - White box: 241 file test, 5.231 test case, 100% Passed.
  - SUS: 75,11, Grade B, Good, Acceptable.
  - Responden SUS: 46 responden.

## Ringkasan Struktur 25 Slide

| Slide | Bagian | Judul |
|---:|---|---|
| 1 | Pembuka | Halaman Judul |
| 2 | BAB I | Pendahuluan |
| 3 | BAB I | Latar Belakang Masalah |
| 4 | BAB I | Rumusan Masalah dan Tujuan |
| 5 | BAB I | Batasan dan Manfaat Penelitian |
| 6 | BAB II | Tinjauan Pustaka & Keaslian |
| 7 | BAB II | Kajian Pustaka I |
| 8 | BAB II | Kajian Pustaka II |
| 9 | BAB II | Keaslian Penelitian |
| 10 | BAB II | Landasan Teori PWA |
| 11 | BAB II | RBAC dan Metode R&D |
| 12 | BAB III | Metodologi Penelitian |
| 13 | BAB III | Alur Penelitian |
| 14 | BAB III | Objek, Lokasi, dan Sampel |
| 15 | BAB III | Perancangan Proses: DFD Level 1 |
| 16 | BAB IV | Implementasi & Hasil |
| 17 | BAB IV | Perancangan Data: ERD |
| 18 | BAB IV | Implementasi Antarmuka Dashboard |
| 19 | BAB IV | Fitur PWA dan Offline Access |
| 20 | BAB IV | Hasil Pengujian Black Box |
| 21 | BAB V | Evaluasi & Penutup |
| 22 | BAB V | Hasil Pengujian White Box |
| 23 | BAB V | Evaluasi Usability SUS |
| 24 | BAB V | Kesimpulan Penelitian |
| 25 | BAB V | Saran dan Penutup |

## Slide 1 - Halaman Judul

**Judul slide:**  
Analisis dan Perancangan Sistem Informasi Praktikum Berbasis Progressive Web Application (PWA) Menggunakan Metode R&D di Akademi Kebidanan Mega Buana

**Isi utama:**
- Taufiq - IK.22.11.009
- Program Studi Sarjana Informatika
- Fakultas Ilmu Komputer
- Universitas Mega Buana Palopo

**Visual utama:**  
Logo kampus dan mockup kecil aplikasi/dashboard PWA.

**Sumber visual:**
- Ikon aplikasi: `public/icons/icon-512x512.png`
- Logo aplikasi: `public/logo.svg`
- Jika ada screenshot dashboard terbaru, gunakan screenshot aplikasi aktual.

**Catatan tampilan:**  
Letakkan identitas di bagian bawah. Visual cukup sebagai aksen, jangan lebih dominan dari judul.

## Slide 2 - BAB I: Pendahuluan

**Isi utama:**
- BAB I
- Pendahuluan
- Latar belakang, rumusan masalah, tujuan, batasan, dan manfaat penelitian.

**Visual utama:**  
Divider BAB dengan judul besar.

**Catatan tampilan:**  
Gunakan warna marun/emas, minim teks, dan ruang kosong yang cukup. Slide ini berfungsi sebagai jeda sebelum masuk ke konteks masalah.

## Slide 3 - Latar Belakang Masalah

**Isi utama:**
- Pengelolaan praktikum masih banyak bergantung pada dokumen manual, spreadsheet, dan komunikasi terpisah.
- Kendala utama: miskomunikasi jadwal, pelaporan lambat, dan belum adanya logbook digital terpusat.
- Sistem berbasis PWA dipilih untuk mendukung akses lintas perangkat dan akses pada kondisi jaringan tidak stabil.

**Visual utama:**  
Ilustrasi alur perbandingan:

```text
Manual: Kertas -> Spreadsheet -> Chat Terpisah
Sistem: Jadwal -> Materi/Kuis -> Logbook/Nilai -> Sinkronisasi
```

**Sumber visual:**  
Buat diagram ringkas langsung di PPT menggunakan ikon dokumen, tabel, chat, database, dan cloud sync.

**Catatan tampilan:**  
Gunakan model "sebelum vs sesudah" agar penguji langsung melihat masalah dan arah solusi.

## Slide 4 - Rumusan Masalah dan Tujuan

**Isi utama rumusan masalah:**
- Bagaimana menganalisis kebutuhan sistem informasi praktikum di AKBID Mega Buana?
- Bagaimana merancang dan mengembangkan sistem menggunakan pendekatan R&D?
- Bagaimana mengevaluasi sistem dari aspek fungsionalitas, logika internal, dan usability?

**Isi utama tujuan:**
- Menghasilkan sistem informasi praktikum terintegrasi.
- Mendukung jadwal, materi, kuis, logbook, penilaian, inventaris, peminjaman, dan pengumuman.
- Menguji kelayakan sistem melalui black box, white box, dan SUS.

**Visual utama:**  
Diagram 3 blok:

```text
Analisis Kebutuhan -> Perancangan Sistem -> Evaluasi Sistem
```

**Sumber visual:**  
Buat ulang langsung di PPT agar ringkas.

## Slide 5 - Batasan dan Manfaat Penelitian

**Isi utama batasan:**
- Fokus pada pengelolaan praktikum di Akademi Kebidanan Mega Buana.
- Modul utama: jadwal, materi, kuis, logbook, penilaian, inventaris, peminjaman, pengumuman, dan PWA/offline.
- Pengguna sistem: admin, dosen, mahasiswa, dan laboran.

**Isi utama manfaat:**
- Membantu efisiensi administrasi praktikum.
- Memudahkan mahasiswa mengakses informasi dan aktivitas praktikum.
- Menyediakan data praktikum yang lebih terpusat dan mudah ditelusuri.

**Visual utama:**  
Dua kolom: Batasan dan Manfaat, dengan ikon modul jadwal, logbook, nilai, inventaris.

**Sumber visual:**  
Gunakan ikon bawaan PPT/lucide-style yang sederhana.

## Slide 6 - BAB II: Tinjauan Pustaka & Keaslian

**Isi utama:**
- BAB II
- Tinjauan Pustaka & Keaslian
- Penelitian terdahulu, gap penelitian, landasan teori PWA, RBAC, dan R&D.

**Visual utama:**  
Divider BAB dengan judul besar.

**Catatan tampilan:**  
Gunakan warna marun/emas, minim teks, dan komposisi yang tenang. Slide ini menjadi transisi dari masalah menuju dasar teori dan kebaruan penelitian.

## Slide 7 - Kajian Pustaka I

**Isi utama:**

| No | Peneliti | Fokus | Temuan Utama |
|---:|---|---|---|
| 1 | Nurwanto (2019) | PWA pada e-commerce | PWA meningkatkan pengalaman pengguna dan akses produk. |
| 2 | Aripin & Somantri (2021) | Repository e-portofolio | Memudahkan mahasiswa mengelola portofolio akademik. |
| 3 | Sukma et al. (2022) | Sistem penjualan berbasis PWA | PWA membantu akses pada wilayah dengan koneksi terbatas. |

**Visual utama:**  
Tabel ringkas 3 baris.

**Catatan tampilan:**  
Jangan menampilkan narasi panjang. Cukup peneliti, fokus, dan temuan.

## Slide 8 - Kajian Pustaka II

**Isi utama:**

| No | Peneliti | Fokus | Temuan Utama |
|---:|---|---|---|
| 4 | Santoso et al. (2022) | Monitoring skripsi berbasis PWA | Menyederhanakan bimbingan dan pendaftaran ujian. |
| 5 | Muddin et al. (2023) | Sistem informasi sekolah berbasis PWA | Meningkatkan akses informasi akademik. |
| 6 | Muzakki et al. (2025) | Repositori tugas akhir berbasis PWA | Meningkatkan efisiensi publikasi dan orisinalitas karya. |

**Visual utama:**  
Tabel lanjutan 3 baris.

**Catatan tampilan:**  
Akhiri slide dengan satu kalimat kecil: "Gap penelitian: belum berfokus pada manajemen praktikum vokasi kebidanan yang terintegrasi dengan fitur PWA/offline."

## Slide 9 - Keaslian Penelitian

**Isi utama:**
- Penelitian terdahulu banyak menggunakan PWA, tetapi konteksnya e-commerce, portofolio, monitoring skripsi, sekolah, atau repositori.
- Penelitian ini berfokus pada manajemen praktikum kebidanan.
- Kebaruan penelitian terletak pada integrasi multi-role, modul akademik-laboratorium, dan dukungan offline PWA.

**Visual utama:**  
Matriks gap:

| Aspek | Penelitian Terdahulu | Penelitian Ini |
|---|---|---|
| Platform | Web/PWA terbatas | PWA dengan offline support |
| Konteks | Umum/non-praktikum | Praktikum vokasi kebidanan |
| Fitur | Parsial | Akademik + laboratorium + sinkronisasi |

**Sumber visual:**  
Tabel/matriks dibuat langsung di PPT.

## Slide 10 - Landasan Teori PWA

**Isi utama:**
- PWA memungkinkan aplikasi web dapat dipasang pada perangkat pengguna.
- Service worker mendukung caching, akses offline, dan sinkronisasi.
- IndexedDB/offline queue digunakan untuk menjaga aktivitas tertentu saat koneksi tidak stabil.

**Visual utama:**  
Arsitektur PWA ringkas:

```text
Browser/App -> Service Worker -> Cache/IndexedDB -> Supabase
```

**Sumber visual:**
- `docs/BAB4/GAMBAR-04-DIAGRAM-ARSITEKTUR-SISTEM-PWA.md`
- `docs/ANALISIS/ARSITEKTUR-SISTEM-AKTUAL.drawio`

**Catatan tampilan:**  
Pakai versi ringkas untuk PPT. Diagram lengkap boleh disimpan sebagai cadangan.

## Slide 11 - RBAC dan Metode R&D

**Isi utama RBAC:**
- Hak akses sistem dibedakan berdasarkan peran: Admin, Dosen, Mahasiswa, Laboran.
- RBAC menjaga agar pengguna hanya mengakses fitur dan data sesuai kewenangan.

**Isi utama R&D:**
- R&D digunakan untuk menghasilkan dan menguji artefak sistem.
- Tahapan mengacu pada Ellis dan Levy.

**Visual utama:**  
Gabungkan dua visual kecil:

```text
Role: Admin | Dosen | Mahasiswa | Laboran
R&D: Problem -> Objective -> Design -> Test -> Evaluate -> Communicate
```

**Sumber visual:**
- Alur R&D: `docs/BAB4/GAMBAR-01-DIAGRAM-ALIR-METODE-RD-ELLIS-LEVY.md`
- Hak akses: `docs/ACTUAL/ACTUAL_PERMISSIONS_REFERENCE.md`

## Slide 12 - BAB III: Metodologi Penelitian

**Isi utama:**
- BAB III
- Metodologi Penelitian
- Alur R&D, objek penelitian, sampel, dan perancangan proses.

**Visual utama:**  
Divider BAB dengan judul besar.

**Catatan tampilan:**  
Gunakan warna marun/emas, minim teks, dan jadikan slide ini sebagai jeda sebelum pembahasan metode.

## Slide 13 - Alur Penelitian

**Isi utama:**
- Identifikasi masalah.
- Penetapan tujuan.
- Perancangan dan pengembangan solusi.
- Pengujian.
- Evaluasi hasil.
- Komunikasi hasil.

**Visual utama:**  
Flow 6 tahap Ellis dan Levy.

**Sumber visual:**  
`docs/BAB4/GAMBAR-01-DIAGRAM-ALIR-METODE-RD-ELLIS-LEVY.md`

**Catatan tampilan:**  
Gunakan panah horizontal atau siklus sederhana. Tambahkan panah revisi dari pengujian/evaluasi kembali ke pengembangan.

## Slide 14 - Objek, Lokasi, dan Sampel

**Isi utama:**
- Lokasi penelitian: Akademi Kebidanan Mega Buana.
- Sampel menggunakan total sampling.
- Jumlah responden evaluasi SUS: 46 responden.

**Visual utama:**  
Kartu angka besar dan diagram distribusi:

```text
46 Responden
Mahasiswa 38 | Dosen 6 | Laboran 1 | Admin 1
```

**Sumber visual:**  
`docs/BAB4/GAMBAR-40-DIAGRAM-DISTRIBUSI-RESPONDEN-SUS.md`

**Catatan tampilan:**  
Jika ruang slide sempit, pakai kartu angka besar plus mini bar chart, bukan pie chart penuh.

## Slide 15 - Perancangan Proses: DFD Level 1

**Isi utama:**
- Sistem dibagi menjadi empat proses utama:
  - Manajemen Akun dan Akses.
  - Manajemen Akademik Praktikum.
  - Operasional dan Layanan Laboratorium.
  - Layanan PWA dan Sinkronisasi Offline.

**Visual utama:**  
DFD Level 1 versi ringkas.

**Sumber visual:**  
`docs/BAB4/GAMBAR-16-DFD-LEVEL1-YOURDON-VISIO.md`

**Catatan tampilan:**  
Untuk PPT, tampilkan empat proses utama dan empat aktor saja. Detail data store dapat diperkecil agar tidak padat.

## Slide 16 - BAB IV: Implementasi & Hasil

**Isi utama:**
- BAB IV
- Implementasi & Hasil
- ERD, antarmuka sistem, fitur PWA/offline, dan hasil pengujian black box.

**Visual utama:**  
Divider BAB dengan judul besar.

**Catatan tampilan:**  
Gunakan warna marun/emas, minim teks, dan jadikan slide ini sebagai transisi ke bukti implementasi aplikasi.

## Slide 17 - Perancangan Data: ERD

**Isi utama:**
- ERD mengintegrasikan data pengguna, akademik, praktikum, inventaris, dan sinkronisasi.
- Struktur data disusun per domain agar lebih mudah dibaca.
- Relasi data mendukung modul jadwal, materi, kuis, logbook, nilai, peminjaman, dan inventaris.

**Visual utama:**  
ERD ringkas/domain.

**Sumber visual:**
- Narasi ERD di `docs/BAB4/BAB4.md`
- Gunakan versi domain jika tersedia pada file gambar/diagram pendukung.

**Catatan tampilan:**  
Jangan menampilkan ERD penuh jika terlalu padat. Gunakan lima kelompok: Pengguna, Akademik, Praktikum, Inventaris, PWA Sync.

## Slide 18 - Implementasi Antarmuka Dashboard

**Isi utama:**
- Sistem diimplementasikan dengan dashboard sesuai peran.
- Admin memantau data dan konfigurasi sistem.
- Dosen mengelola materi, jadwal, kuis, dan penilaian.
- Mahasiswa mengakses jadwal, materi, kuis, logbook, dan nilai.

**Visual utama:**  
Tiga panel screenshot:

```text
Login | Dashboard Admin | Dashboard Dosen
```

**Sumber visual:**  
Gunakan screenshot aplikasi aktual. Jika belum ada, ambil dari browser saat aplikasi berjalan.

**Catatan tampilan:**  
Panel screenshot diberi label singkat di bawah gambar. Jangan memasukkan terlalu banyak screenshot kecil.

## Slide 19 - Fitur PWA dan Offline Access

**Isi utama:**
- Aplikasi dapat dipasang pada perangkat melalui dukungan web app manifest.
- Status online/offline ditampilkan kepada pengguna.
- Aktivitas tertentu seperti pengerjaan kuis dapat disimpan sementara saat koneksi tidak stabil.
- Service worker, IndexedDB, dan offline queue mendukung kesinambungan akses.

**Visual utama:**  
Alur offline:

```text
User Action -> IndexedDB/Offline Queue -> Sync saat Online -> Supabase
```

**Sumber visual:**
- `docs/ANALISIS/ALUR-PENELITIAN-DAN-OFFLINE.drawio`
- `docs/ANALISIS/ANALISIS_MASALAH_PWA_OFFLINE.md`
- Ikon aplikasi: `public/icons/icon-192x192.png`

**Catatan tampilan:**  
Jika ada screenshot prompt install dan indikator offline, tempatkan sebagai thumbnail kecil di sisi kanan.

## Slide 20 - Hasil Pengujian Black Box

**Isi utama:**
- Pengujian black box dilakukan pada modul autentikasi, fitur peran, modul akademik, modul laboratorium, dan fitur PWA.
- Total 45 skenario diuji.
- Semua skenario lulus dengan tingkat keberhasilan 100%.

**Visual utama:**  
Badge angka besar:

```text
45 Skenario
100% Pass
```

**Tabel kecil kategori modul:**

| Kategori | Status |
|---|---|
| Autentikasi dan role | Pass |
| Modul akademik | Pass |
| Modul laboratorium | Pass |
| PWA/offline | Pass |

**Sumber visual:**  
`docs/BLACKBOX/BLACKBOX-TEST-PLAN.md`

## Slide 21 - BAB V: Evaluasi & Penutup

**Isi utama:**
- BAB V
- Evaluasi & Penutup
- White box, SUS, kesimpulan, saran, dan penutup sidang.

**Visual utama:**  
Divider BAB dengan judul besar.

**Catatan tampilan:**  
Gunakan warna marun/emas, minim teks, dan jadikan slide ini sebagai jeda sebelum menyampaikan validasi akhir dan kesimpulan.

## Slide 22 - Hasil Pengujian White Box

**Isi utama:**
- Pengujian white box dilakukan melalui unit test dan integration test.
- Cakupan pengujian meliputi API, hooks, sinkronisasi, dan logika modul.
- Hasil: 241 file test dan 5.231 test case lulus.

**Visual utama:**  
Tiga badge angka:

```text
241 File Test
5.231 Test Case
100% Passed
```

**Sumber visual:**  
Dokumen pengujian internal dan hasil Vitest pada repo.

**Catatan tampilan:**  
Slide ini boleh menjadi "poin kuat" saat presentasi. Tekankan bahwa jumlah test case menunjukkan perhatian pada stabilitas sistem.

## Slide 23 - Evaluasi Usability SUS

**Isi utama:**
- Evaluasi usability menggunakan System Usability Scale (SUS).
- Melibatkan 46 responden.
- Skor rata-rata SUS: 75,11.
- Interpretasi: Grade B, Good, Acceptable.

**Visual utama:**  
Gauge/bar:

```text
0 ---- 50 ---- 68 ---- 75,11 ---- 100
                  Acceptable | Good | Grade B
```

**Sumber visual:**  
`docs/BAB4/GAMBAR-40-DIAGRAM-DISTRIBUSI-RESPONDEN-SUS.md`

**Catatan tampilan:**  
Gunakan angka `75,11` sebagai elemen paling besar pada slide.

## Slide 24 - Kesimpulan Penelitian

**Isi utama:**
- Sistem informasi praktikum berbasis PWA berhasil dikembangkan sebagai platform terintegrasi.
- Sistem mendukung kebutuhan akademik dan operasional laboratorium melalui peran admin, dosen, mahasiswa, dan laboran.
- Fitur PWA/offline membantu akses saat jaringan tidak stabil.
- Hasil pengujian menunjukkan sistem layak secara fungsional, teknis, dan usability.

**Visual utama:**  
Tiga ikon kesimpulan:

```text
Terintegrasi | Akses PWA/Offline | Layak Digunakan
```

**Sumber narasi:**  
`docs/BAB4/BAB6-KESIMPULAN-DAN-SARAN.md`

## Slide 25 - Saran dan Penutup

**Isi utama saran:**
- Optimasi mekanisme background sync pada lebih banyak browser dan perangkat.
- Penambahan fitur analitik dan pelaporan praktikum.
- Integrasi dengan SIAKAD atau sistem akademik institusi.

**Visual utama:**  
Roadmap 3 langkah:

```text
1. Background Sync
2. Analitik Pelaporan
3. Integrasi SIAKAD
```

**Sumber narasi:**  
`docs/BAB4/BAB6-KESIMPULAN-DAN-SARAN.md`

**Catatan tampilan:**  
Tutup dengan kalimat singkat: "Terima kasih."

## Checklist Sebelum Dipresentasikan

- Semua angka pengujian sudah sama di seluruh slide.
- Slide pembatas BAB berada pada Slide 2, 6, 12, 16, dan 21.
- Slide pembatas BAB memakai judul besar, warna marun/emas, minim teks, dan berfungsi sebagai jeda antarbagian.
- Screenshot aplikasi memakai data atau tampilan yang rapi.
- Diagram DFD/ERD dibuat ringkas agar terbaca dari jarak sidang.
- Setiap slide maksimal 3 sampai 5 poin utama.
- Slide hasil pengujian menampilkan angka besar, bukan paragraf panjang.
- Slide kesimpulan menjawab tujuan penelitian, bukan mengulang fitur satu per satu.
