# Panduan Penjelasan ERD untuk Sidang Skripsi

Dokumen ini berisi panduan dan ringkasan penjelasan terkait **Entity Relationship Diagram (ERD)** pada skripsi Anda. Sama seperti DFD, ERD sering ditanyakan untuk menguji apakah Anda benar-benar paham bagaimana data dalam aplikasi Anda saling terhubung.

**Kunci Menjawab Pertanyaan ERD:**
Jangan sekadar membaca nama tabelnya ("Tabel A nyambung ke Tabel B"), tetapi jelaskan **relasi logisnya** ("Satu mahasiswa bisa mengambil banyak mata kuliah, dan satu mata kuliah diajar oleh satu dosen").

---

## 1. Konsep Utama ERD di Skripsi Anda

**Pertanyaan Dasar:** *"Apa fungsi ERD dalam skripsi Anda?"*
> 💡 **Cara Menjawab:**
> *"ERD berfungsi sebagai cetak biru (blueprint) struktur database sistem saya, Pak/Bu. Karena sistem ini sangat kompleks (melibatkan jadwal, nilai, logbook, inventaris, dan sinkronisasi offline), ERD memastikan bahwa semua tabel tersebut saling terhubung secara logis tanpa ada data yang tumpang tindih (redundant)."*

**Mengapa ERD Dibagi Menjadi Beberapa Domain?**
> 💡 **Cara Menjawab:**
> *"Karena sistem ini mencakup banyak sekali entitas/tabel, menggabungkan semuanya dalam satu gambar akan membuat diagram sangat padat dan sulit dibaca. Oleh karena itu, saya membaginya menjadi beberapa 'Domain' (kelompok fungsional) agar alur relasinya lebih fokus dan mudah dipahami, misalnya fokus pada domain akademik saja atau domain laboratorium saja."*

---

## 2. Rincian Penjelasan per Domain ERD

Berikut adalah panduan menjelaskan masing-masing domain ERD yang ada di skripsi Anda:

### A. Domain Pengguna dan Peran (Users & Roles)
**Fokus:** Mengatur siapa penggunanya dan apa jabatannya.
**Entitas Utama:** `users` (terhubung ke autentikasi Supabase), `roles`, `user_profiles`.
**Penjelasan Logis:** 
Setiap pengguna yang login (user) harus memiliki satu peran khusus (Role: Admin, Dosen, Laboran, atau Mahasiswa). Berdasarkan peran ini, profil mereka akan dilengkapi (misalnya: mahasiswa punya NIM, dosen punya NIDN). Domain ini adalah fondasi keamanan *Role-Based Access Control* (RBAC) pada aplikasi.

### B. Domain Akademik (Kelas dan Materi)
**Fokus:** Struktur pembelajaran dasar.
**Entitas Utama:** `mata_kuliah`, `kelas_praktikum`, `materi`, `kelas_enrollments`.
**Penjelasan Logis:** 
Satu mata kuliah bisa dibuka dalam beberapa kelas praktikum. Mahasiswa dan Dosen kemudian dimasukkan ke dalam kelas tersebut (`kelas_enrollments`). Dosen dapat mengunggah banyak materi, dan materi tersebut direlasikan langsung ke kelas tertentu agar hanya bisa dibaca oleh mahasiswa di kelas tersebut.

### C. Domain Praktikum (Jadwal, Kehadiran, Logbook)
**Fokus:** Pelaksanaan praktikum di lapangan.
**Entitas Utama:** `jadwal_praktikum`, `kehadiran`, `logbook`.
**Penjelasan Logis:**
Setiap jadwal terikat pada satu kelas dan satu laboratorium. Berdasarkan jadwal inilah, dosen membuat catatan `kehadiran` (presensi) untuk mahasiswa. Selama praktikum berjalan, mahasiswa wajib mengisi `logbook` harian, yang mana setiap entri logbook merujuk pada jadwal dan mahasiswa yang bersangkutan.

### D. Domain Penilaian (Kuis dan Nilai)
**Fokus:** Evaluasi akademik mahasiswa.
**Entitas Utama:** `kuis`, `bank_soal`, `kuis_attempts` (percobaan kuis), `nilai_akhir`.
**Penjelasan Logis:**
Dosen membuat `kuis` dan mengambil soal dari `bank_soal`. Saat mahasiswa mengerjakan, sistem membuat rekaman `kuis_attempts` (riwayat pengerjaan). Jawaban mereka dinilai dan digabungkan dengan nilai tugas/logbook, yang pada akhirnya disimpan di tabel `nilai_akhir`.
*(Penting: Relasi ini sangat kuat untuk memastikan tidak ada nilai mahasiswa yang tertukar).*

### E. Domain Laboratorium dan Inventaris
**Fokus:** Urusan barang fisik dan peminjaman alat.
**Entitas Utama:** `inventaris_lab`, `peminjaman_alat`.
**Penjelasan Logis:**
Laboran mengelola master data barang di tabel `inventaris_lab`. Jika ada dosen yang meminjam alat untuk praktikum, datanya dicatat di `peminjaman_alat`. Relasi ini memastikan sistem tahu barang apa saja yang sedang dipinjam, oleh siapa, dan kapan harus dikembalikan.

### F. Domain Komunikasi (Pengumuman & Notifikasi)
**Fokus:** Distribusi informasi asinkron.
**Entitas Utama:** `pengumuman`, `notifikasi`.
**Penjelasan Logis:**
Admin dapat membuat pengumuman. Pengumuman ini memiliki relasi target/tujuan (misalnya hanya untuk 'Mahasiswa' atau 'Dosen'). Sistem kemudian men- *generate* (membuat) notifikasi personal untuk masing-masing pengguna sesuai dengan target pengumuman tersebut.

### G. Domain Sinkronisasi Offline (Offline Sync & PWA)
**Fokus:** Fitur utama PWA saat internet putus.
**Entitas Utama:** `offline_queue` (antrean offline), `sync_logs`.
**Penjelasan Logis:**
Ini adalah tabel teknis di lokal browser (IndexedDB) dan di server. Saat mahasiswa offline dan mensubmit logbook, data disimpan di tabel `offline_queue` (lengkap dengan *timestamp* lokal). Saat online, data dipindahkan ke tabel aslinya, dan riwayat sinkronisasinya dicatat di `sync_logs` untuk memastikan tidak ada data yang *corrupt* (rusak) atau berbenturan.

---

## 3. Pertanyaan Kritis ERD (Sering Menjadi "Jebakan")

### Q: "Mengapa Anda menggunakan relasi Many-to-Many pada mahasiswa dan kelas?"
> **Jawaban:** *"Karena dalam aturan akademik, satu mahasiswa bisa mengambil banyak kelas praktikum yang berbeda, dan satu kelas praktikum pastinya berisi banyak mahasiswa. Untuk menghubungkan keduanya, saya menggunakan tabel perantara/tabel pivot (biasanya bernama `kelas_enrollments`) agar relasinya menjadi bersih (One-to-Many pada masing-masing sisi)."*

### Q: "Bagaimana ERD Anda mendukung keamanan data nilai mahasiswa agar tidak bisa diubah sembarangan?"
> **Jawaban:** *"ERD sistem saya mengisolasi tabel nilai agar selalu berelasi dengan `dosen_id` sebagai pembuat nilai, dan `mahasiswa_id` sebagai pemilik nilai. Karena backend saya menggunakan Supabase, struktur ERD ini diikat dengan aturan Row Level Security (RLS) di database. Artinya, database secara otomatis akan menolak akses jika role 'Mahasiswa' mencoba mengubah baris data (Row) pada tabel nilai, karena secara struktural mereka hanya memiliki relasi 'Melihat' (Read), bukan 'Mengubah' (Update)."*

### Q: "Mengapa tidak semua entitas digabung saja jadi satu tabel besar biar mudah?"
> **Jawaban:** *"Menggabungkan semua data dalam satu tabel besar akan menyebabkan anomali data (seperti data yang berulang-ulang/redundant) dan membuat database menjadi sangat lambat. ERD ini dirancang dengan prinsip Normalisasi untuk memastikan data konsisten. Misalnya, jika nama mahasiswa berubah, sistem cukup mengubah satu baris di tabel `users`, tanpa perlu mengubah ribuan baris di tabel `nilai` atau `logbook`."*
