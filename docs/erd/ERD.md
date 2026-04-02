# Entity Relationship Diagram (ERD) dan Ringkasan Skema Database
## Sistem Informasi Praktikum PWA

Dokumen ini disusun sebagai versi yang telah dirapikan untuk kebutuhan naskah skripsi, khususnya pada bagian hasil dan pembahasan. Isi dokumen mengacu pada implementasi basis data aktual aplikasi, dengan tetap disajikan dalam bentuk yang mudah dipahami secara akademik. Dengan demikian, dokumen ini berfungsi sebagai jembatan antara ERD konseptual dan skema database fisik yang benar-benar digunakan aplikasi.

---

## 1. Ruang Lingkup dan Dasar Penyusunan

Basis data utama aplikasi berada pada schema `public`, sedangkan schema sistem milik platform Supabase seperti `auth`, `storage`, `realtime`, `vault`, `supabase_migrations`, dan `extensions` tidak dijadikan fokus pembahasan entitas bisnis utama pada skripsi.

Dengan demikian, pembahasan ERD dan skema database dalam dokumen ini difokuskan pada tabel-tabel aplikasi yang mendukung modul pengguna, akademik, kuis, laboratorium, komunikasi, serta sinkronisasi offline.

---

## 2. Prinsip Penyajian ERD pada Skripsi

Pada konteks naskah skripsi, ERD tidak harus memuat seluruh detail teknis produksi secara mentah, tetapi harus mampu menunjukkan:
- entitas utama yang membentuk sistem;
- relasi antarentitas;
- atribut kunci seperti primary key dan foreign key;
- keterhubungan antar modul akademik, evaluasi, inventaris, dan sinkronisasi.

Karena itu, dokumen ini disajikan dalam dua lapisan:
1. **lapisan konseptual-akademik**, yaitu pengelompokan entitas dan relasinya;
2. **lapisan implementatif**, yaitu penyesuaian nama tabel dengan database aktual Supabase.

---

## 3. Kelompok Entitas Utama

Berdasarkan implementasi aktual aplikasi, entitas utama dalam schema `public` dapat dikelompokkan sebagai berikut.

### 3.1 Kelompok Identitas dan Peran Pengguna
- `users`
- `admin`
- `dosen`
- `mahasiswa`
- `laboran`

Kelompok ini merepresentasikan data akun dan pemisahan profil berdasarkan role. Pada implementasi aktual, sistem **tidak menggunakan satu tabel `profiles` tunggal**, melainkan memisahkan data role ke tabel spesifik seperti `admin`, `dosen`, `mahasiswa`, dan `laboran` yang terhubung ke `users`.

### 3.2 Kelompok Akademik dan Kelas
- `mata_kuliah`
- `kelas`
- `kelas_mahasiswa`
- `dosen_mata_kuliah`
- `kelas_dosen_assignment`
- `mahasiswa_semester_audit`

Kelompok ini mendukung pengelolaan struktur akademik, relasi dosen dengan mata kuliah, hubungan mahasiswa dengan kelas, serta assignment yang diperlukan pada implementasi sistem.

### 3.3 Kelompok Praktikum dan Pembelajaran
- `jadwal_praktikum`
- `kehadiran`
- `materi`
- `logbook_entries`
- `nilai`
- `permintaan_perbaikan_nilai`

Kelompok ini merepresentasikan proses inti pembelajaran praktikum, mulai dari jadwal, materi, absensi, logbook, hingga evaluasi nilai.

### 3.4 Kelompok Kuis dan Evaluasi
- `kuis`
- `soal`
- `bank_soal`
- `attempt_kuis`
- `jawaban`

Kelompok ini merupakan inti dari fitur evaluasi berbasis kuis. Implementasi aktual memisahkan data percobaan pengerjaan kuis mahasiswa ke `attempt_kuis` dan data jawaban per soal ke `jawaban`, sehingga model data lebih terstruktur daripada konsep lama `kuis_submission` tunggal.

### 3.5 Kelompok Laboratorium dan Inventaris
- `laboratorium`
- `inventaris`
- `peminjaman`

Kelompok ini mendukung pengelolaan aset laboratorium, ketersediaan alat, dan transaksi peminjaman alat praktikum.

### 3.6 Kelompok Komunikasi
- `pengumuman`
- `notifications`

Kelompok ini mendukung distribusi informasi dan notifikasi ke pengguna sistem.

### 3.7 Kelompok Operasional Sistem dan Offline Sync
- `offline_queue`
- `sync_history`
- `conflict_log`
- `cache_metadata`
- `audit_logs`
- `audit_logs_archive`
- `sensitive_operations`

Kelompok ini tidak selalu ditampilkan penuh pada ERD konseptual sederhana, tetapi sangat penting pada implementasi aktual karena mendukung cache, sinkronisasi offline, audit, serta keamanan operasi sensitif.

---

## 4. Penyesuaian Nama Entitas dari Model Konseptual ke Implementasi Aktual

Agar konsisten dengan aplikasi yang berjalan, beberapa istilah konseptual lama perlu diselaraskan dengan nama tabel implementasi aktual sebagai berikut.

| Istilah Konseptual Lama | Implementasi Aktual |
|---|---|
| `JADWAL` | `jadwal_praktikum` |
| `LOGBOOK` | `logbook_entries` |
| `MAHASISWA_KELAS` | `kelas_mahasiswa` |
| `KUIS_SUBMISSION` | dipisah menjadi `attempt_kuis` dan `jawaban` |
| `PROFILES` | digantikan oleh tabel role: `admin`, `dosen`, `mahasiswa`, `laboran` |

Implikasi akademiknya adalah bahwa pada naskah skripsi, nama entitas yang digunakan pada pembahasan implementasi harus mengikuti nama implementasi aktual agar konsisten dengan sistem dan hasil pengujian.

---

## 5. Ringkasan Relasi Tingkat Tinggi

### 5.1 Relasi Pengguna dan Role
- `users` menjadi pusat identitas akun.
- `admin`, `dosen`, `mahasiswa`, dan `laboran` terhubung ke `users` sebagai pemisahan data role.
- Secara implementatif, relasi ini merepresentasikan perluasan data akun ke data profil spesifik peran.

### 5.2 Relasi Akademik
- `mata_kuliah` berelasi dengan `kelas`.
- `kelas` berelasi dengan `kelas_mahasiswa` untuk menunjukkan mahasiswa yang mengikuti kelas.
- `kelas_dosen_assignment` dan `dosen_mata_kuliah` mendukung penugasan dosen terhadap kelas atau mata kuliah.

### 5.3 Relasi Praktikum
- `jadwal_praktikum` menjadi dasar aktivitas praktikum.
- `kehadiran` berelasi dengan jadwal dan mahasiswa.
- `materi`, `logbook_entries`, dan `nilai` mendukung proses pembelajaran dan evaluasi praktikum.

### 5.4 Relasi Modul Kuis
- `kuis` berelasi dengan `soal`.
- `bank_soal` digunakan sebagai sumber soal reusable.
- `attempt_kuis` menyimpan data pengerjaan kuis mahasiswa.
- `jawaban` menyimpan jawaban detail per soal untuk setiap attempt.

### 5.5 Relasi Laboratorium dan Inventaris
- `laboratorium` berelasi dengan `inventaris`.
- `inventaris` berelasi dengan `peminjaman`.
- Struktur ini memungkinkan pengelolaan stok, kondisi barang, dan riwayat penggunaan alat.

### 5.6 Relasi Sinkronisasi dan Audit
- `offline_queue`, `sync_history`, `conflict_log`, dan `cache_metadata` mendukung mekanisme offline-first.
- `audit_logs`, `audit_logs_archive`, dan `sensitive_operations` mendukung aspek audit dan keamanan sistem.

---

## 6. Ringkasan Tabel yang Relevan untuk Bab IV

Bagian ini ditulis dalam format yang lebih ringkas agar dapat dimasukkan ke pembahasan hasil implementasi basis data pada Bab IV.

| Tabel / Kelompok Tabel | Kolom Utama | Keterangan |
|---|---|---|
| `users` | `id`, `email` | identitas akun utama |
| `admin`, `dosen`, `mahasiswa`, `laboran` | `id`, `user_id`, identitas role | data profil per role, menggantikan konsep `profiles` |
| `mata_kuliah` | `id`, `kode`, `nama` | data master mata kuliah |
| `kelas` | `id`, `nama`, relasi akademik | data kelas praktikum |
| `kelas_mahasiswa` | `id`, `kelas_id`, `mahasiswa_id` | relasi mahasiswa dengan kelas |
| `jadwal_praktikum` | `id`, `kelas_id`, `laboratorium_id`, `jam_mulai`, `jam_selesai` | jadwal kegiatan praktikum |
| `materi` | `id`, `kelas_id`, `file_url` | metadata materi pembelajaran |
| `kuis` | `id`, `kelas_id`, `judul`, `durasi_menit` | data kuis |
| `soal` | `id`, `kuis_id` | soal pada kuis |
| `bank_soal` | `id`, `dosen_id`, `pertanyaan`, `tipe_soal` | bank soal reusable |
| `attempt_kuis` | `id`, `kuis_id`, `mahasiswa_id`, `status` | data attempt pengerjaan kuis |
| `jawaban` | `id`, `attempt_id`, `soal_id` | jawaban detail per soal |
| `kehadiran` | `id`, `jadwal_id`, `mahasiswa_id`, `status` | data presensi |
| `nilai` | `id`, relasi mahasiswa | data nilai akademik |
| `logbook_entries` | `id`, relasi mahasiswa dan kelas | logbook kegiatan praktikum |
| `inventaris` | `id`, `laboratorium_id`, `nama_barang`, `jumlah`, `kondisi` | data alat laboratorium |
| `peminjaman` | `id`, `inventaris_id`, `status` | transaksi peminjaman alat |
| `pengumuman` | `id`, `judul`, `konten` | pengumuman yang dibuat admin |
| `notifications` | `id`, `user_id`, `is_read` | notifikasi pengguna |
| `offline_queue`, `conflict_log`, `cache_metadata`, `sync_history` | identitas sinkronisasi | tabel pendukung offline-first |

---

## 7. Narasi Siap Pakai untuk Hasil dan Pembahasan

Paragraf berikut dapat langsung dijadikan dasar penulisan pada Bab IV.

> Berdasarkan implementasi basis data aktual pada Supabase, sistem menggunakan schema `public` sebagai domain utama penyimpanan data aplikasi. Entitas yang digunakan tidak hanya mencakup data akademik seperti kelas, jadwal praktikum, materi, kehadiran, nilai, dan logbook, tetapi juga mendukung modul kuis, inventaris laboratorium, komunikasi pengguna, serta sinkronisasi offline. Pada implementasi akhir, beberapa istilah konseptual pada tahap perancangan mengalami penyesuaian agar sesuai dengan struktur database nyata, misalnya `jadwal_praktikum`, `logbook_entries`, `kelas_mahasiswa`, serta pemisahan data pengerjaan kuis ke dalam tabel `attempt_kuis` dan `jawaban`. Selain itu, data profil pengguna tidak disimpan dalam satu tabel `profiles`, melainkan dipisahkan ke tabel role seperti `admin`, `dosen`, `mahasiswa`, dan `laboran` yang terhubung ke `users`. Struktur ini menunjukkan bahwa basis data sistem telah dirancang untuk mendukung kebutuhan multi-role, proses pembelajaran praktikum, pengelolaan inventaris, serta mekanisme aplikasi offline-first.

---

## 8. Catatan Akademik Penggunaan ERD

Dokumen ini lebih tepat dipahami sebagai **ringkasan ERD dan skema database implementatif**, bukan sekadar daftar tabel mentah. Untuk keperluan gambar ERD pada skripsi, yang disarankan adalah menampilkan relasi utama antar entitas inti, sedangkan tabel operasional seperti audit dan offline sync dapat ditampilkan sebagai kelompok pendukung bila diagram utama terlalu padat.

---

## 9. Status Dokumen

- Versi: **revisi sinkron dengan implementasi aplikasi aktif**
- Status: **siap digunakan sebagai dasar pembahasan ERD dan skema database pada hasil dan pembahasan skripsi**
