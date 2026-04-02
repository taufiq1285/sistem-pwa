# Black Box Test Plan
## Sistem Praktikum PWA

**Metode**: Black Box Testing (tanpa melihat internal code)
**Approach**: Input → Output based testing
**Tanggal**: 2026-01-28

---

## Test Scenario Structure

| ID | Test Case | Input | Expected Output | Status | Catatan |
|----|-----------|-------|-----------------|--------|---------|

---

## MODULE 1: AUTHENTICATION

### TC-AUTH-001: Login dengan Kredensial Valid
| Field | Value |
|-------|-------|
| **Test Case** | Login sebagai Mahasiswa dengan email dan password benar |
| **Input** | Email: `mahasiswa@test.com`<br>Password: `password123` |
| **Expected Output** | - Redirect ke dashboard Mahasiswa<br>- Tampil nama user di header<br>- Tampil role badge "Mahasiswa" |
| **Status** | ⬜ Pass / ☐ Fail |
| **Catatan** | |

---

### TC-AUTH-002: Login dengan Password Salah
| Field | Value |
|-------|-------|
| **Test Case** | Login dengan password yang salah |
| **Input** | Email: `mahasiswa@test.com`<br>Password: `wrongpassword` |
| **Expected Output** | - Tampil error message "Email atau password salah"<br>- Tetap di halaman login |
| **Status** | ⬜ Pass / ☐ Fail |
| **Catatan** | |

---

### TC-AUTH-003: Login dengan Email Tidak Terdaftar
| Field | Value |
|-------|-------|
| **Test Case** | Login dengan email yang tidak terdaftar di database |
| **Input** | Email: `unknown@test.com`<br>Password: `password123` |
| **Expected Output** | - Tampil error message "Email atau password salah"<br>- Tetap di halaman login |
| **Status** | ⬜ Pass / ☐ Fail |
| **Catatan** | |

---

### TC-AUTH-004: Logout
| Field | Value |
|-------|-------|
| **Test Case** | Logout dari aplikasi |
| **Input** | Klik tombol "Logout" di menu |
| **Expected Output** | - Redirect ke halaman login<br>- Session cleared (tidak bisa langsung akses dashboard) |
| **Status** | ⬜ Pass / ☐ Fail |
| **Catatan** | |

---

## MODULE 2: OFFLINE MODE (PWA Feature)

### TC-OFF-001: Buka Aplikasi Saat Offline - Mahasiswa
| Field | Value |
|-------|-------|
| **Test Case** | Mahasiswa membuka jadwal praktikum saat offline |
| **Steps** | 1. Login sebagai Mahasiswa (online)<br>2. Buka halaman Jadwal<br>3. Matikan internet (DevTools → Offline)<br>4. Refresh halaman |
| **Expected Output** | - Aplikasi tetap bisa diakses<br>- Jadwal praktikum TETAP TAMPIL (dari cache)<br>- Tampil banner "Offline Mode" |
| **Status** | ⬜ Pass / ☐ Fail |
| **Catatan** | Ini test fitur caching yang baru diimplement |

---

### TC-OFF-002: Buka Aplikasi Saat Offline - Dosen
| Field | Value |
|-------|-------|
| **Test Case** | Dosen membuka materi saat offline |
| **Steps** | 1. Login sebagai Dosen (online)<br>2. Buka halaman Materi<br>3. Matikan internet<br>4. Refresh halaman |
| **Expected Output** | - Aplikasi tetap bisa diakses<br>- Daftar materi TETAP TAMPIL (dari cache)<br>- Tampil banner "Offline Mode" |
| **Status** | ⬜ Pass / ☐ Fail |
| **Catatan** | |

---

### TC-OFF-003: Kembali Online setelah Offline
| Field | Value |
|-------|-------|
| **Test Case** | Kembali online dan cek data terbaru |
| **Steps** | 1. Buka aplikasi offline<br>2. Nyalakan internet kembali<br>3. Tunggu 5 detik<br>4. Refresh halaman |
| **Expected Output** | - Banner "Offline Mode" hilang<br>- Data di-refresh dari server<br>- Tampilkan data terbaru |
| **Status** | ⬜ Pass / ☐ Fail |
| **Catatan** | |

---

## MODULE 3: JADWAL PRAKTIKUM (Mahasiswa)

### TC-JDW-001: Lihat Daftar Jadwal
| Field | Value |
|-------|-------|
| **Test Case** | Mahasiswa melihat daftar jadwal praktikum |
| **Input** | Klik menu "Jadwal" |
| **Expected Output** | - Tampil list jadwal praktikum<br>- Setiap jadwal tampilkan: Hari, Tanggal, Jam, Mata Kuliah, Laboratorium<br>- Jadwal diurutkan berdasarkan tanggal |
| **Status** | ⬜ Pass / ☐ Fail |
| **Catatan** | |

---

### TC-JDW-002: Filter Jadwal berdasarkan Laboratorium
| Field | Value |
|-------|-------|
| **Test Case** | Mahasiswa filter jadwal berdasarkan lab tertentu |
| **Input** | Pilih filter "Laboratorium: Lab Komputer 1" |
| **Expected Output** | - Hanya tampil jadwal di Lab Komputer 1<br>- Filter aktif terlihat di UI |
| **Status** | ⬜ Pass / ☐ Fail |
| **Catatan** | |

---

### TC-JDW-003: Filter Jadwal berdasarkan Hari
| Field | Value |
|-------|-------|
| **Test Case** | Mahasiswa filter jadwal berdasarkan hari |
| **Input** | Pilih filter "Hari: Senin" |
| **Expected Output** | - Hanya tampil jadwal hari Senin<br>- Filter aktif terlihat di UI |
| **Status** | ⬜ Pass / ☐ Fail |
| **Catatan** | |

---

## MODULE 4: KUIS (Dosen)

### TC-KUIS-001: Buat Kuis Baru
| Field | Value |
|-------|-------|
| **Test Case** | Dosen membuat kuis baru untuk praktikum |
| **Input** | - Judul: "Kuis React Basics"<br>- Mata Kuliah: "Pemrograman Web"<br>- Tanggal: Pilih tanggal besok<br>- Soal: "Apa itu React?" (essay) |
| **Expected Output** | - Kuis berhasil dibuat<br>- Muncul notifikasi "Kuis berhasil dibuat"<br>- Kuis baru muncul di daftar kuis |
| **Status** | ⬜ Pass / ☐ Fail |
| **Catatan** | |

---

### TC-KUIS-002: Edit Kuis yang Sudah Ada
| Field | Value |
|-------|-------|
| **Test Case** | Dosen mengubah judul kuis |
| **Input** | - Klik tombol "Edit" pada kuis<br>- Ubah judul menjadi "Kuis React Lanjutan"<br>- Klik "Simpan" |
| **Expected Output** | - Judul kuis berubah<br>- Muncul notifikasi "Kuis berhasil diupdate"<br>- Perubahan terlihat di daftar kuis |
| **Status** | ⬜ Pass / ☐ Fail |
| **Catatan** | |

---

### TC-KUIS-003: Hapus Kuis
| Field | Value |
|-------|-------|
| **Test Case** | Dosen menghapus kuis |
| **Input** | - Klik tombol "Hapus" pada kuis<br>- Konfirmasi penghapusan |
| **Expected Output** | - Kuis dihapus dari daftar<br>- Muncul notifikasi "Kuis berhasil dihapus" |
| **Status** | ⬜ Pass / ☐ Fail |
| **Catatan** | |

---

### TC-KUIS-004: Gunakan Soal dari Bank Soal
| Field | Value |
|-------|-------|
| **Test Case** | Dosen menambahkan soal dari bank soal ke kuis |
| **Input** | - Buat kuis baru<br>- Klik "Tambah dari Bank Soal"<br>- Pilih soal dari bank<br>- Klik "Tambah" |
| **Expected Output** | - Soal dari bank ditambahkan ke kuis<br>- Soal muncul di daftar soal kuis |
| **Status** | ⬜ Pass / ☐ Fail |
| **Catatan** | |

---

## MODULE 5: BANK SOAL (Dosen)

### TC-BS-001: Lihat Daftar Bank Soal
| Field | Value |
|-------|-------|
| **Test Case** | Dosen melihat daftar bank soal |
| **Input** | Klik menu "Bank Soal" |
| **Expected Output** | - Tampil list bank soal<br>- Setiap soal tampilkan: Pertanyaan, Tipe, Poin, Tags |
| **Status** | ⬜ Pass / ☐ Fail |
| **Catatan** | |

---

### TC-BS-002: Tambah Soal ke Bank
| Field | Value |
|-------|-------|
| **Test Case** | Dosen menambahkan soal baru ke bank soal |
| **Input** | - Tipe: Multiple Choice<br>- Pertanyaan: "Apa kepanjangan DOM?"<br>- Opsi: A. Document Object Model, B, C, D<br>- Jawaban benar: A<br>- Poin: 5 |
| **Expected Output** | - Soal berhasil ditambahkan<br>- Muncul notifikasi "Soal berhasil ditambahkan"<br>- Soal baru muncul di daftar |
| **Status** | ⬜ Pass / ☐ Fail |
| **Catatan** | |

---

### TC-BS-003: Search Soal di Bank
| Field | Value |
|-------|-------|
| **Test Case** | Dosen mencari soal berdasarkan keyword |
| **Input** | Ketik "React" di search box |
| **Expected Output** | - Hanya tampil soal yang mengandung kata "React"<br>- Search keyword terlihat di UI |
| **Status** | ⬜ Pass / ☐ Fail |
| **Catatan** | |

---

### TC-BS-004: Filter Soal berdasarkan Mata Kuliah
| Field | Value |
|-------|-------|
| **Test Case** | Dosen filter bank soal berdasarkan mata kuliah |
| **Input** | Pilih filter "Mata Kuliah: Pemrograman Web" |
| **Expected Output** | - Hanya tampil soal dari mata kuliah tersebut<br>- Filter aktif terlihat di UI |
| **Status** | ⬜ Pass / ☐ Fail |
| **Catatan** | |

---

## MODULE 6: MATERI (Dosen & Mahasiswa)

### TC-MTR-001: Upload Materi (Dosen)
| Field | Value |
|-------|-------|
| **Test Case** | Dosen mengupload materi perkuliahan |
| **Input** | - Judul: "Pengenalan React"<br>- File: PDF (2MB)<br>- Deskripsi: "Slide pertemuan 1" |
| **Expected Output** | - Materi berhasil diupload<br>- Muncul notifikasi "Materi berhasil diupload"<br>- Materi baru muncul di daftar |
| **Status** | ⬜ Pass / ☐ Fail |
| **Catatan** | |

---

### TC-MTR-002: Download Materi (Mahasiswa)
| Field | Value |
|-------|-------|
| **Test Case** | Mahasiswa mendownload materi |
| **Input** | Klik tombol "Download" pada materi |
| **Expected Output** | - File terdownload<br>- Nama file sesuai dengan nama asli |
| **Status** | ⬜ Pass / ☐ Fail |
| **Catatan** | |

---

### TC-MTR-003: Hapus Materi (Dosen)
| Field | Value |
|-------|-------|
| **Test Case** | Dosen menghapus materi |
| **Input** | - Klik tombol "Hapus" pada materi<br>- Konfirmasi penghapusan |
| **Expected Output** | - Materi dihapus dari daftar<br>- Muncul notifikasi "Materi berhasil dihapus" |
| **Status** | ⬜ Pass / ☐ Fail |
| **Catatan** | |

---

## MODULE 7: KELAS (Admin & Dosen)

### TC-KLS-001: Buat Kelas Baru (Admin)
| Field | Value |
|-------|-------|
| **Test Case** | Admin membuat kelas baru |
| **Input** | - Nama: "Kelas Pemrograman Web A"<br>- Dosen: Pilih dosen<br>- Mata Kuliah: Pilih mata kuliah<br>- Jadwal: Pilih jadwal |
| **Expected Output** | - Kelas berhasil dibuat<br>- Muncul notifikasi "Kelas berhasil dibuat"<br>- Kelas baru muncul di daftar |
| **Status** | ⬜ Pass / ☐ Fail |
| **Catatan** | |

---

### TC-KLS-002: Tambah Mahasiswa ke Kelas
| Field | Value |
|-------|-------|
| **Test Case** | Admin/Dosen menambahkan mahasiswa ke kelas |
| **Input** | - Pilih kelas<br>- Klik "Tambah Mahasiswa"<br>- Pilih mahasiswa dari list<br>- Klik "Simpan" |
| **Expected Output** | - Mahasiswa ditambahkan ke kelas<br>- Mahasiswa muncul di daftar anggota kelas |
| **Status** | ⬜ Pass / ☐ Fail |
| **Catatan** | |

---

### TC-KLS-003: Hapus Kelas (Admin)
| Field | Value |
|-------|-------|
| **Test Case** | Admin menghapus kelas |
| **Input** | - Klik tombol "Hapus" pada kelas<br>- Konfirmasi penghapusan |
| **Expected Output** | - Kelas dihapus dari daftar<br>- Muncul notifikasi "Kelas berhasil dihapus" |
| **Status** | ⬜ Pass / ☐ Fail |
| **Catatan** | |

---

## MODULE 8: NOTIFIKASI

### TC-NTF-001: Lihat Daftar Notifikasi
| Field | Value |
|-------|-------|
| **Test Case** | User melihat daftar notifikasi |
| **Input** | Klik icon lonceng notifikasi |
| **Expected Output** | - Tampil dropdown/list notifikasi<br>- Setiap notifikasi tampilkan: Judul, Pesan, Waktu<br>- Notifikasi yang belum read diberi marker |
| **Status** | ⬜ Pass / ☐ Fail |
| **Catatan** | |

---

### TC-NTF-002: Tandai Notifikasi sebagai Read
| Field | Value |
|-------|-------|
| **Test Case** | User menandai notifikasi sebagai sudah dibaca |
| **Input** | Klik notifikasi yang belum dibaca |
| **Expected Output** | - Notifikasi ditandai sebagai read<br>- Marker "unread" hilang<br>- Counter unread berkurang |
| **Status** | ⬜ Pass / ☐ Fail |
| **Catatan** | |

---

### TC-NTF-003: Auto-Notification saat Tugas Dibuat
| Field | Value |
|-------|-------|
| **Test Case** | Mahasiswa menerima notifikasi saat dosen membuat tugas baru |
| **Steps** | 1. Login sebagai Dosen<br>2. Buat kuis baru untuk kelas<br>3. Logout<br>4. Login sebagai Mahasiswa anggota kelas tersebut |
| **Expected Output** | - Mahasiswa menerima notifikasi "Ada tugas baru: [Nama Kuis]"<br>- Counter notifikasi bertambah |
| **Status** | ⬜ Pass / ☐ Fail |
| **Catatan** | |

---

## MODULE 9: DASHBOARD (Semua Role)

### TC-DASH-001: Dashboard Mahasiswa
| Field | Value |
|-------|-------|
| **Test Case** | Mahasiswa melihat dashboard |
| **Input** | Login sebagai Mahasiswa, buka dashboard |
| **Expected Output** | - Tampil statistik: Total jadwal, Tugas pending, Tugas completed<br>- Tampil jadwal hari ini<br>- Tampil tugas yang mendekati deadline |
| **Status** | ⬜ Pass / ☐ Fail |
| **Catatan** | |

---

### TC-DASH-002: Dashboard Dosen
| Field | Value |
|-------|-------|
| **Test Case** | Dosen melihat dashboard |
| **Input** | Login sebagai Dosen, buka dashboard |
| **Expected Output** | - Tampil statistik: Total kelas, Total kuis, Total materi<br>- Tampil jadwal mengajar hari ini<br>- Tampil kuis yang perlu dinilai |
| **Status** | ⬜ Pass / ☐ Fail |
| **Catatan** | |

---

### TC-DASH-003: Dashboard Laboran
| Field | Value |
|-------|-------|
| **Test Case** | Laboran melihat dashboard |
| **Input** | Login sebagai Laboran, buka dashboard |
| **Expected Output** | - Tampil statistik: Total lab, Jadwal hari ini<br>- Tampil jadwal penggunaan lab hari ini<br>- Tampil conflict jika ada |
| **Status** | ⬜ Pass / ☐ Fail |
| **Catatan** | |

---

### TC-DASH-004: Dashboard Admin
| Field | Value |
|-------|-------|
| **Test Case** | Admin melihat dashboard |
| **Input** | Login sebagai Admin, buka dashboard |
| **Expected Output** | - Tampil statistik: Total user, Total kelas, Total kuis<br>- Tampil user baru yang perlu approval<br>- Tampil system logs/errors |
| **Status** | ⬜ Pass / ☐ Fail |
| **Catatan** | |

---

## SUMMARY

Total Test Cases: 30

| Module | Jumlah Test Case |
|--------|-----------------|
| Authentication | 4 |
| Offline Mode | 3 |
| Jadwal | 3 |
| Kuis | 4 |
| Bank Soal | 4 |
| Materi | 3 |
| Kelas | 3 |
| Notifikasi | 3 |
| Dashboard | 4 |

---

## CARA MENJALANKAN TEST

### 1. Setup Environment
```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

### 2. Siapkan Test Data
- Buat akun test untuk setiap role (Admin, Dosen, Mahasiswa, Laboran)
- Buat sample data: kelas, kuis, materi, jadwal

### 3. Jalankan Test Case
1. Buka browser: `http://localhost:5173`
2. Untuk test offline: Gunakan Chrome DevTools → Network → Offline
3. Follow steps di setiap test case
4. Centang (☑) Pass atau (☑) Fail
5. Isi catatan jika ada error/bug

### 4. Laporkan Hasil
- Hitung total Pass/Fail
- Dokumentasikan bug yang ditemukan
- Screenshot untuk evidence

---

## NOTES
- Test ini adalah **Black Box Testing** - hanya test dari perspective user tanpa lihat code
- Tidak perlu akses ke source code
- Test berfokus pada **functional requirements** dan **user experience**
- Test offline mode sangat penting untuk PWA feature yang baru diimplement
