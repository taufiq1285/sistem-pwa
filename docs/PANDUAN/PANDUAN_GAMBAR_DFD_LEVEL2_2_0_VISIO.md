# Panduan Menggambar DFD Level 2 — 2.0 di Visio

Dokumen ini dibuat agar diagram [`2.0 Manajemen Akademik Praktikum`](docs/DFD.md:131) bisa digambar ulang secara manual di Microsoft Visio dengan lebih rapi dan tetap menjaga kaidah DFD Yourdon.

Dokumen ini juga sudah disesuaikan dengan catatan koreksi akademik berikut:
- entitas eksternal **tidak boleh** terhubung langsung ke data store;
- data store **tidak boleh** terhubung langsung ke data store;
- semua perpindahan data harus melalui proses;
- proses yang terlalu besar boleh dipecah secara konseptual saat dijelaskan, tetapi gambar utama tetap mengikuti struktur `2.1`–`2.5` yang sedang dipakai pada [`docs/DFD.md`](docs/DFD.md:131).

---

## 1. Prinsip Dasar DFD Yourdon yang Wajib Dijaga

Sebelum mulai menggambar, pegang 4 aturan ini:

### 1.1 Entitas eksternal tidak boleh langsung ke data store
Salah:
- `Dosen -> D1`
- `Mahasiswa -> D1`

Benar:
- `Dosen -> 2.3 -> D1`
- `Mahasiswa -> 2.2 -> D1`

### 1.2 Data store tidak boleh langsung ke data store
Salah:
- `D2 -> D1`
- `D3 -> D1`

Benar:
- `D2 -> proses sinkronisasi -> D1`
- `D3 -> proses sinkronisasi -> D1`

Catatan: pada diagram `2.0` yang sedang dipakai, proses sinkronisasi **tidak dimasukkan** ke gambar ini karena sinkronisasi sudah ditempatkan pada domain [`4.0`](docs/DFD.md:133). Jadi pada gambar `2.0`, cukup tampilkan relasi store yang memang langsung dipakai proses akademik, bukan relasi antar-store.

### 1.3 Entitas harus selalu berinteraksi melalui proses
Artinya:
- entitas hanya boleh terhubung ke proses;
- output ke entitas juga harus berasal dari proses.

### 1.4 Data store hanya boleh diakses proses
Artinya:
- proses baca/tulis store boleh;
- store ke store tidak boleh;
- entitas ke store tidak boleh.

---

## 2. Bentuk yang Dipakai di Visio

### 2.1 Entitas eksternal
Gunakan **Rectangle**.

Isi:
- `Admin`
- `Dosen`
- `Mahasiswa`
- `Laboran`

### 2.2 Proses
Gunakan **Ellipse**.

Isi proses utama yang dipakai pada gambar `2.0`:
- `2.1 Kelola Jadwal Praktikum`
- `2.2 Kelola Kuis dan Bank Soal`
- `2.3 Kelola Materi Praktikum`
- `2.4 Kelola Kelas, MK, dan Assignment`
- `2.5 Kehadiran dan Penilaian`

### 2.3 Data store
Untuk gaya Yourdon, buat manual dari:
- garis horizontal atas,
- label teks di tengah,
- garis horizontal bawah.

Isi:
- `D1 Data Akademik Praktikum`
- `D2 IndexedDB Cache`
- `D3 Offline Queue`
- `D4 Storage File`

---

## 3. Posisi Objek yang Disarankan di Visio

Gunakan layout 4 kolom.

### 3.1 Kolom
- Kolom A = Entitas
- Kolom B = Proses kiri
- Kolom C = Proses kanan
- Kolom D = Data store

### 3.2 Susunan vertikal

#### Kolom A — Entitas
- `Admin` di kiri atas
- `Dosen` di bawah `Admin`
- `Mahasiswa` di bawah `Dosen`
- `Laboran` di bawah `Mahasiswa`

#### Kolom B — Proses kiri
- `2.1 Kelola Jadwal Praktikum`
- `2.2 Kelola Kuis dan Bank Soal`
- `2.3 Kelola Materi Praktikum`

#### Kolom C — Proses kanan
- `2.4 Kelola Kelas, MK, dan Assignment`
- `2.5 Kehadiran dan Penilaian`

#### Kolom D — Data store
- `D1` paling atas
- `D2` di bawah `D1`
- `D3` di bawah `D2`
- `D4` di bawah `D3`

---

## 4. Aturan Panah Supaya Tidak Menumpuk

Masalah utama Anda memang panah bertemu di satu titik. Solusinya: **jangan biarkan semua panah memakai port dan koridor yang sama**.

### 4.1 Bagi jalur jadi 4 kelompok

#### A. Jalur input dari entitas ke proses
Contoh:
- `Admin -> 2.4`
- `Dosen -> 2.2`
- `Dosen -> 2.5`
- `Mahasiswa -> 2.3`
- `Laboran -> 2.1`

Aturan:
- semua input masuk dari sisi kiri proses;
- tiap proses punya titik masuk berbeda;
- untuk dua panah dari entitas yang sama, pakai jalur vertikal berbeda.

#### B. Jalur antarproses
Contoh:
- `2.4 -> 2.1`
- `2.4 -> 2.2`
- `2.4 -> 2.3`
- `2.1 -> 2.5`
- `2.2 -> 2.5`

Aturan:
- sediakan koridor tengah khusus;
- jangan pakai koridor kiri atau kanan;
- beda alur = beda tinggi waypoint.

#### C. Jalur proses ke data store
Contoh:
- `2.1 <-> D1`
- `2.1 <-> D2`
- `2.2 <-> D1`
- `2.2 <-> D2`
- `2.2 -> D3`
- `2.3 <-> D1`
- `2.3 <-> D2`
- `2.3 <-> D4`
- `2.4 <-> D1`
- `2.5 <-> D1`

Aturan:
- semua ke kanan;
- tiap store punya titik masuk berbeda secara vertikal;
- label jangan diletakkan di siku belokan.

#### D. Jalur output ke entitas
Contoh:
- `2.4 -> Admin`
- `2.4 -> Dosen`
- `2.4 -> Mahasiswa`
- `2.5 -> Dosen`
- `2.5 -> Mahasiswa`
- `2.2 -> Dosen`
- `2.2 -> Mahasiswa`
- `2.3 -> Dosen`
- `2.3 -> Mahasiswa`
- `2.1 -> Mahasiswa`
- `2.1 -> Laboran`

Aturan:
- semua output pulang lewat koridor kiri;
- tiap output punya nilai x berbeda;
- jangan ada dua output pulang di satu garis vertikal yang sama.

---

## 5. Alur Final yang Direkomendasikan untuk Gambar 2.0

Bagian ini adalah versi yang sudah diselaraskan dengan catatan koreksi Anda.

### 5.1 Proses 2.1 Kelola Jadwal Praktikum
Hubungkan:
- `Laboran -> 2.1` = persetujuan jadwal
- `2.1 -> Mahasiswa` = jadwal praktikum
- `2.1 -> Laboran` = jadwal laboratorium
- `2.1 <-> D1` = data jadwal
- `2.1 <-> D2` = cache jadwal
- `2.1 -> 2.5` = jadwal dan peserta

Catatan:
- tidak perlu gambar `Admin -> Mahasiswa` langsung;
- jadwal harus selalu lewat proses [`2.1`](docs/DFD.md:131).

### 5.2 Proses 2.2 Kelola Kuis dan Bank Soal
Hubungkan:
- `Dosen -> 2.2` = input kuis dan bank soal
- `2.2 -> Dosen` = hasil atau statistik kuis
- `2.2 -> Mahasiswa` = akses kuis
- `2.2 <-> D1` = data kuis dan soal
- `2.2 <-> D2` = cache kuis
- `2.2 -> D3` = queue jawaban offline
- `2.2 -> 2.5` = hasil kuis

Catatan:
- `D3` di sini cukup satu arah dari [`2.2`](docs/DFD.md:131), karena ini fungsi simpan jawaban offline;
- jangan gambar `Mahasiswa -> D1` langsung.

### 5.3 Proses 2.3 Kelola Materi Praktikum
Hubungkan:
- `Dosen -> 2.3` = upload atau kelola materi
- `Mahasiswa -> 2.3` = permintaan materi
- `2.3 -> Mahasiswa` = materi
- `2.3 -> Dosen` = materi terkelola
- `2.3 <-> D1` = metadata materi
- `2.3 <-> D2` = cache materi
- `2.3 <-> D4` = file materi

Catatan penting:
- ini mengikuti koreksi Anda bahwa alur materi harus jelas:
  - dosen masuk ke proses;
  - metadata ke [`D1`](docs/PANDUAN_GAMBAR_DFD_LEVEL2_2_0_VISIO.md);
  - file ke [`D4`](docs/PANDUAN_GAMBAR_DFD_LEVEL2_2_0_VISIO.md);
  - materi keluar ke mahasiswa.

### 5.4 Proses 2.4 Kelola Kelas, MK, dan Assignment
Hubungkan:
- `Admin -> 2.4` = data master
- `2.4 -> Admin` = rekap akademik
- `2.4 -> Dosen` = kelas yang diajar
- `2.4 -> Mahasiswa` = kelas yang diikuti
- `2.4 <-> D1` = data master kelas dan mata kuliah
- `2.4 -> 2.1` = relasi kelas dan jadwal
- `2.4 -> 2.2` = kelas dan MK aktif
- `2.4 -> 2.3` = kelas dan materi aktif

Catatan:
- benar bahwa proses ini cukup besar;
- bila ingin dijelaskan lebih rinci di naskah, Anda bisa menulis bahwa secara konseptual proses ini mencakup:
  - `2.4.1 Kelola Data Kelas`
  - `2.4.2 Kelola Mata Kuliah`
  - `2.4.3 Assignment Dosen ke Kelas`
- tetapi pada gambar utama `2.0`, tetap boleh dipertahankan sebagai [`2.4`](docs/DFD.md:131) agar tidak terlalu padat.

### 5.5 Proses 2.5 Kehadiran dan Penilaian
Hubungkan:
- `Dosen -> 2.5` = input nilai dan presensi
- `2.1 -> 2.5` = jadwal dan peserta
- `2.2 -> 2.5` = hasil kuis
- `2.5 -> Dosen` = rekap nilai dan presensi
- `2.5 -> Mahasiswa` = hasil nilai
- `2.5 <-> D1` = nilai dan presensi

Catatan akademik:
- koreksi Anda benar bahwa proses ini membutuhkan beberapa input sumber;
- tetapi pada gambar ringkas `2.0`, input yang paling aman ditampilkan adalah dari:
  - [`2.1`](docs/DFD.md:131)
  - [`2.2`](docs/DFD.md:131)
  - `Dosen`
- sedangkan data peserta dari database cukup direpresentasikan melalui hubungan [`2.5 <-> D1`](docs/PANDUAN_GAMBAR_DFD_LEVEL2_2_0_VISIO.md).

---

## 6. Tentang Cache dan Offline Queue

Koreksi Anda benar: dalam logika offline-first, sebetulnya ideal ada proses sinkronisasi tersendiri.

### 6.1 Secara teori DFD penuh
Secara teori bisa dibuat seperti ini:
- `Mahasiswa -> Cache`
- `Cache -> Offline Queue`
- `Offline Queue -> Proses Sinkronisasi`
- `Proses Sinkronisasi -> Database`

### 6.2 Tetapi untuk dokumen ini
Pada dokumen aktif, proses sinkronisasi offline **sudah ditempatkan pada** [`4.1 Sinkronisasi Offline PWA`](docs/DFD.md:133).

Jadi untuk gambar `2.0`:
- jangan tambahkan `2.6 Sinkronisasi Offline` di sini jika ingin tetap konsisten dengan [`docs/DFD.md`](docs/DFD.md:131);
- cukup tampilkan bahwa modul akademik dapat menulis ke [`D2`](docs/PANDUAN_GAMBAR_DFD_LEVEL2_2_0_VISIO.md) dan [`D3`](docs/PANDUAN_GAMBAR_DFD_LEVEL2_2_0_VISIO.md);
- proses sinkronisasi detail dijelaskan pada gambar `4.0`.

---

## 7. Urutan Menggambar di Visio yang Paling Aman

### Langkah 1
Gambar semua entitas di kiri.

### Langkah 2
Gambar semua proses di tengah.

### Langkah 3
Gambar semua data store di kanan.

### Langkah 4
Hubungkan input entitas ke proses.

### Langkah 5
Hubungkan antarproses.

### Langkah 6
Hubungkan proses ke data store.

### Langkah 7
Hubungkan output proses ke entitas.

Ini penting karena output ke kiri biasanya paling banyak dan paling rawan tabrakan.

---

## 8. Template Koridor Jalur

Supaya benar-benar rapi, pakai koridor tetap.

### 8.1 Koridor kiri untuk output
- L1 = output ke `Admin`
- L2 = output ke `Dosen`
- L3 = output ke `Mahasiswa`
- L4 = output ke `Laboran`

### 8.2 Koridor tengah untuk antarproses
- M1 = `2.4 -> 2.1`
- M2 = `2.4 -> 2.2`
- M3 = `2.4 -> 2.3`
- M4 = `2.1 -> 2.5`
- M5 = `2.2 -> 2.5`

### 8.3 Koridor kanan untuk store
- R1 = ke `D1`
- R2 = ke `D2`
- R3 = ke `D3`
- R4 = ke `D4`

Aturan utamanya:
- satu koridor untuk satu kelompok alur;
- jangan campur output kiri dengan antarproses tengah;
- jangan pakai satu koridor untuk banyak label berbeda.

---

## 9. Kesalahan yang Harus Dihindari

Hindari hal berikut:

1. Entitas langsung ke data store.
2. Data store langsung ke data store.
3. Semua panah masuk ke titik tengah proses.
4. Semua panah ke store masuk di satu titik tengah store.
5. Output ke banyak entitas lewat satu garis vertikal yang sama.
6. Label ditempatkan di area tikungan.
7. Menambahkan proses sinkronisasi ke gambar `2.0` jika Anda ingin tetap konsisten dengan struktur [`docs/DFD.md`](docs/DFD.md:133).

---

## 10. Rekomendasi Final

Kalau Anda ingin menggambar sendiri di Visio, pendekatan paling aman adalah:
- tetap pakai struktur proses [`2.1`](docs/DFD.md:131) sampai [`2.5`](docs/DFD.md:131) agar konsisten dengan dokumen aktif;
- ikuti koreksi DFD standar Yourdon;
- gunakan koridor panah tetap;
- bedakan titik masuk dan keluar pada setiap proses;
- jangan gambar hubungan yang dilarang, khususnya entitas ke store dan store ke store.

Dengan cara ini, hasil gambar manual Anda akan:
- lebih rapi;
- lebih mudah dibaca;
- lebih aman secara kaidah DFD;
- tetap konsisten dengan [`docs/DFD.md`](docs/DFD.md) dan pembahasan akademik yang sudah ada.