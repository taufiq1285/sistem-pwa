# Analisis Notifikasi Wajib Berdasarkan Fitur Aplikasi

## 1. ADMIN ROLE

### Fitur: Manajemen Assignment & Jadwal
| Trigger | Penerima | Notifikasi | Priority | Status |
|---------|----------|------------|----------|--------|
| Admin edit assignment (ganti dosen/kelas/mk) | Dosen lama | "Assignment dialihkan ke dosen lain" | WAJIB | ✅ Ada |
| Admin edit assignment (ganti dosen/kelas/mk) | Dosen baru | "Anda ditugaskan untuk assignment baru" | WAJIB | ✅ Ada |
| Admin edit assignment (ganti dosen/kelas/mk) | Semua mahasiswa di kelas | "Dosen pengajar telah berubah" | WAJIB | ✅ Ada |
| Admin delete assignment | Dosen | "Assignment dihapus" | WAJIB | ✅ Ada |
| Admin delete assignment | Mahasiswa | "Kelas/jadwal dihapus" | WAJIB | ✅ Ada |

### Fitur: Manajemen Jadwal
| Trigger | Penerima | Notifikasi | Priority | Status |
|---------|----------|------------|----------|--------|
| Admin buat jadwal baru | Dosen | "Jadwal praktikum dibuat: {mk} - {kelas}" | WAJIB | ❓ Perlu cek |
| Admin update jadwal | Dosen | "Jadwal praktikum diupdate: {mk} - {kelas}" | WAJIB | ❓ Perlu cek |
| Admin update jadwal | Mahasiswa | "Jadwal praktikum diupdate" | WAJIB | ❓ Perlu cek |
| Admin cancel jadwal | Dosen | "Jadwal dibatalkan" | WAJIB | ❓ Perlu cek |
| Admin cancel jadwal | Mahasiswa | "Jadwal dibatalkan" | WAJIB | ❓ Perlu cek |

### Fitur: Approval Jadwal (jika ada)
| Trigger | Penerima | Notifikasi | Priority | Status |
|---------|----------|------------|----------|--------|
| Jadwal pending approval | Laboran | "Menunggu approval jadwal" | WAJIB | ❓ Perlu cek |
| Admin/laboran approve jadwal | Dosen | "Jadwal disetujui" | WAJIB | ❓ Perlu cek |
| Admin/laboran reject jadwal | Dosen | "Jadwal ditolak" | WAJIB | ❓ Perlu cek |

---

## 2. DOSEN ROLE

### Fitur: Kuis (Create, Grade)
| Trigger | Penerima | Notifikasi | Priority | Status |
|---------|----------|------------|----------|--------|
| Dosen buat kuis/tugas | Semua mahasiswa di kelas | "Kuis baru dibuat: {judul}" | WAJIB | ✅ Ada |
| Dosen publikasikan kuis | Semua mahasiswa di kelas | "Kuis tersedia: {judul}" | WAJIB | ❓ Perlu cek |
| Dosen beri nilai | Mahasiswa | "Tugas dinilai: {judul} - Nilai: {nilai}" | WAJIB | ✅ Ada |
| Dosen minta perbaikan | Mahasiswa | "Permintaan perbaikan: {judul}" | WAJIB | ❓ Perlu cek |

### Fitur: Materi
| Trigger | Penerima | Notifikasi | Priority | Status |
|---------|----------|------------|----------|--------|
| Dosen upload materi | Semua mahasiswa di kelas | "Materi baru: {judul}" | WAJIB | ❓ Perlu cek |

### Fitur: Logbook Review
| Trigger | Penerima | Notifikasi | Priority | Status |
|---------|----------|------------|----------|--------|
| Dosen approve logbook | Mahasiswa | "Logbook disetujui" | WAJIB | ❓ Perlu cek |
| Dosen reject logbook | Mahasiswa | "Logbook ditolak, silakan perbaiki" | WAJIB | ❓ Perlu cek |
| Dosen minta perbaikan logbook | Mahasiswa | "Logbook perlu diperbaiki" | WAJIB | ❓ Perlu cek |

### Fitur: Kehadiran (Presensi)
| Trigger | Penerima | Notifikasi | Priority | Status |
|---------|----------|------------|----------|--------|
| Dosen buka kehadiran | Mahasiswa | "Presensi dibuka untuk: {tanggal}" | WAJIB | ❓ Perlu cek |

---

## 3. MAHASISWA ROLE

### Fitur: Kuis Attempt
| Trigger | Penerima | Notifikasi | Priority | Status |
|---------|----------|------------|----------|--------|
| Mahasiswa submit kuis | Dosen | "Tugas dikirim: {nama} - {kuis}" | WAJIB | ✅ Ada |
| Mahasiswa submit sebelum deadline | - | - | OPSIONAL | - |

### Fitur: Logbook
| Trigger | Penerima | Notifikasi | Priority | Status |
|---------|----------|------------|----------|--------|
| Mahasiswa submit logbook | Dosen | "Logbook dikirim untuk review" | WAJIB | ❓ Perlu cek |
| Mahasiswa edit logbook | Dosen | "Logbook diperbarui" | OPTIONAL | ❓ Perlu cek |

---

## 3. DOSEN ROLE (LANJUTAN)

### Fitur: Peminjaman Alat Praktikum
| Trigger | Penerima | Notifikasi | Priority | Status |
|---------|----------|------------|----------|--------|
| Dosen ajukan peminjaman | Laboran | "Pengajuan peminjaman baru" | WAJIB | ❓ Perlu cek |
| Laboran approve | Dosen | "Peminjaman disetujui" | WAJIB | ❓ Perlu cek |
| Laboran reject | Dosen | "Peminjaman ditolak" | WAJIB | ❓ Perlu cek |
| Dosen kembalikan terlambat | Laboran | "Peminjaman terlambat!" | WAJIB | ❓ Perlu cek |

---

## 4. LABORAN ROLE

### Fitur: Jadwal Approval
| Trigger | Penerima | Notifikasi | Priority | Status |
|---------|----------|------------|----------|--------|
| Jadwal baru diajukan | Laboran | "Menunggu approval jadwal" | WAJIB | ❓ Perlu cek |
| Laboran approve jadwal | Dosen | "Jadwal disetujui" | WAJIB | ❓ Perlu cek |
| Laboran reject jadwal | Dosen | "Jadwal ditolak: {alasan}" | WAJIB | ❓ Perlu cek |

### Fitur: Peminjaman Approval
| Trigger | Penerima | Notifikasi | Priority | Status |
|---------|----------|------------|----------|--------|
| Dosen ajukan peminjaman | Laboran | "Pengajuan peminjaman baru" | WAJIB | ❓ Perlu cek |
| Laboran approve | Dosen | "Peminjaman disetujui" | WAJIB | ❓ Perlu cek |
| Laboran reject | Dosen | "Peminjaman ditolak" | WAJIB | ❓ Perlu cek |
| Dosen kembalikan terlambat | Laboran | "Peminjaman terlambat!" | WAJIB | ❓ Perlu cek |
| Stok barang menipis | Laboran | "Stok menipis: {barang}" | WAJIB | ❓ Perlu cek |

---

## 5. UMUM (Semua Role)

### Fitur: Pengumuman
| Trigger | Penerima | Notifikasi | Priority | Status |
|---------|----------|------------|----------|--------|
| Admin/Dosen/Laboran buat pengumuman | Target audience | "{judul}: {pesan}" | WAJIB | ❓ Perlu cek |

### Fitur: System Notifications
| Trigger | Penerima | Notifikasi | Priority | Status |
|---------|----------|------------|----------|--------|
 | User baru register | Admin | "User baru menunggu approval" | WAJIB | ❓ Perlu cek |
| Admin approve user | User | "Akun Anda disetujui" | WAJIB | ❓ Perlu cek |
| Admin reject user | User | "Akun Anda ditolak" | WAJIB | ❓ Perlu cek |
| Password change | User | "Password berhasil diubah" | WAJIB | ❓ Perlu cek |
 | Reset password request | User | "Link reset password terkirim" | WAJIB | ❓ Perlu cek |
 | Maintenance schedule | All users | "Sistem maintenance" | WAJIB | ❓ Perlu cek |

---

## SUMMARY: Notifikasi yang SUDAH Ada vs PERLU Ditambahkan

### ✅ SUDAH ADA (6 notifikasi):
1. Dosen changed - ke dosen lama, dosen baru, mahasiswa
2. Dosen assignment - ke dosen baru
3. Tugas submitted - ke dosen
4. Tugas baru - ke mahasiswa
5. Tugas graded - ke mahasiswa

### ❌ PERLU DITAMBAHKAN ( estimasi 20+ notifikasi):

**HIGH PRIORITY (Wajib banget):**
- Jadwal created/updated/canceled (dosen, mahasiswa)
- Kuis published (mahasiswa)
- Logbook approved/rejected (mahasiswa)
- Peminjaman approved/rejected (dosen, laboran)
- User registration approved/rejected (user)
- Pengumuman published (target audience)

**MEDIUM PRIORITY (Penting):**
- Materi uploaded (mahasiswa)
- Presensi dibuka (mahasiswa)
- Permintaan perbaikan kuis (mahasiswa)
- Peminjaman terlambat (laboran)
- Stok menipis (laboran)

**LOW PRIORITY (Nice to have):**
- System maintenance (all)
- Password changed (user)
- Login dari device baru (user)

---

## REKOMENDASI:

1. **Prioritaskan HIGH PRIORITY dulu** - Ini notifikasi kritis untuk alur kerja
2. **Cek kode yang ada** - Mungkin beberapa notifikasi sudah ada tapi belum aktif
3. **Tambahkan secara bertahap** - Jangan semua sekaligus, test satu per satu
4. **Gunakan helper functions** - Di notification.api.ts sudah ada fungsi reusable

File yang perlu dicek implementasi notifikasinya:
- `ManajemenAssignmentPage.tsx` - SUDAH ADA untuk assignment
- `JadwalPage.tsx` (dosen) - Perlu cek
- `JadwalApprovalPage.tsx` (laboran) - Perlu cek
- `KuisCreatePage.tsx` / `KuisBuilderPage.tsx` - Perlu cek
- `PeminjamanPage.tsx` / `PeminjamanApprovalPage.tsx` - Perlu cek
- `LogbookPage.tsx` / `LogbookReviewPage.tsx` - Perlu cek
