# Audit Alur Role Dosen

Dokumen ini merangkum kontrak alur utama role dosen agar sinkronisasi lintas fitur lebih mudah diaudit dan dijaga saat refactor.

## Matriks Alur

| Fitur | Entrypoint UI | API / Helper utama | Cache / Refresh utama | Notifikasi terkait | Peran lain terdampak |
| --- | --- | --- | --- | --- | --- |
| Dashboard | `/dosen/dashboard` | `getDosenStats`, `getMyKelas`, `getUpcomingPracticum`, `getPendingGrading`, `getActiveKuis` | `dosen_stats_*`, `dosen_kelas_*`, `dosen_practicum_*`, `dosen_grading_*`, `dosen_kuis_*` | Tidak langsung, hanya ringkasan | Mahasiswa, laboran |
| Jadwal Praktikum | `/dosen/jadwal` | `getJadwal`, `createJadwal`, `updateJadwal`, `deleteJadwal` | invalidasi daftar jadwal dan event kalender | laboran approve, mahasiswa setelah approved | Mahasiswa, laboran |
| Tugas Praktikum / Kuis | `/dosen/kuis` | API kuis dosen, hasil attempt, builder | cache daftar kuis, hasil, attempt | submit mahasiswa, publish kuis, grading | Mahasiswa |
| Bank Soal | `/dosen/bank-soal` | `getBankSoal`, `getBankSoalStats`, CRUD bank soal | refresh daftar dan statistik bank soal | Tidak utama | Dosen sendiri |
| Review Logbook | `/dosen/logbook-review` | `getLogbook`, `getLogbookStats`, review/grade logbook | cache review logbook | submit/revisi/approve logbook | Mahasiswa |
| Peminjaman Alat | `/dosen/peminjaman` | `getMyBorrowing`, `createBorrowingRequest`, `updateBorrowingRequest`, `cancelBorrowingRequest`, `returnBorrowingRequest`, `getBorrowingScheduleOptions` | invalidasi borrowing dosen + panel laboran | `peminjaman_baru`, approve/reject/return | Laboran, admin |
| Kehadiran | `/dosen/kehadiran` | API kehadiran dosen + sumber kelas/jadwal | refresh kehadiran per kelas/jadwal | Biasanya tidak dominan | Mahasiswa |
| Materi | `/dosen/materi` | `getMateriByDosen`, CRUD materi, upload file | cache materi dosen / kelas | `materi_baru` ke mahasiswa | Mahasiswa |
| Penilaian | `/dosen/penilaian` | `getNilaiByKelas`, update nilai, batch update, perbaikan nilai | cache nilai per kelas | permintaan perbaikan nilai | Mahasiswa |
| Notifikasi | `/dosen/notifikasi` | `getNotifications`, `markAsRead`, `markAllAsRead`, `getNotificationNavigationTarget` | refresh notif aktif + fallback cache pengumuman | semua notifikasi dosen | Mahasiswa, laboran, admin |
| Profil | Header dropdown → `/dosen/profil` | `getDosenProfile`, `updateDosenProfile`, `updateUserProfile` | `dosen_profile_*` | Tidak utama | Dosen sendiri |
| Offline Sync | `/dosen/offline-sync` | `useSync`, `useNetworkStatus` | antrean offline lokal | Tidak langsung | Semua role via shared infra |

## Aturan Sinkronisasi Penting

- `jadwal_praktikum` yang `approved` adalah sumber konteks utama untuk praktikum normal.
- peminjaman alat dosen harus mengikuti jadwal approved, bukan validasi lab kedua.
- visibilitas mahasiswa untuk jadwal/material/notifikasi turunan tidak boleh mendahului status yang resmi.
- route dosen yang dipakai menu, header, notification center, dan router harus berasal dari kontrak yang sama agar tidak drift.

## Prioritas Audit Regresi

1. `Jadwal -> Mahasiswa/Laboran`
2. `Jadwal -> Peminjaman`
3. `Kuis/Logbook -> Penilaian/Notifikasi`
4. `Dashboard -> halaman detail`
5. `Notifikasi / Offline Sync / Profil` sebagai entrypoint lintas fitur
