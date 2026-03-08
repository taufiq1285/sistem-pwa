# Rencana Implementasi Komprehensif UI/UX - Sistem Praktikum PWA

## 🎯 Tujuan
Menerapkan tema baru dan komponen UI custom ke **semua fitur aktual** aplikasi berdasarkan audit terhadap [`src/routes/index.tsx`](src/routes/index.tsx) dan seluruh halaman di [`src/pages/`](src/pages).

Dokumen ini menggantikan rencana sebelumnya yang belum mencakup semua fitur per role.

---

## ✅ Sumber Audit Fitur

Rencana ini disusun dari audit file berikut:
- [`src/routes/index.tsx`](src/routes/index.tsx)
- [`src/config/routes.config.ts`](src/config/routes.config.ts)
- seluruh halaman dalam [`src/pages/admin/`](src/pages/admin)
- seluruh halaman dalam [`src/pages/auth/`](src/pages/auth)
- seluruh halaman dalam [`src/pages/dosen/`](src/pages/dosen)
- seluruh halaman dalam [`src/pages/laboran/`](src/pages/laboran)
- seluruh halaman dalam [`src/pages/mahasiswa/`](src/pages/mahasiswa)
- seluruh halaman dalam [`src/pages/public/`](src/pages/public)
- halaman bersama di [`src/pages/shared/`](src/pages/shared)

---

## 🧭 Prinsip Implementasi

1. **Semua role tercakup**: admin, dosen, laboran, mahasiswa, auth, public, shared.
2. **Berbasis route aktual**: prioritas halaman yang benar-benar dipakai di router.
3. **Tetap aman**: komponen lama tidak dihapus, migrasi opt-in.
4. **Foundation lebih dulu**: tema, token, komponen UI reusable.
5. **Role-by-role rollout**: setelah foundation selesai, implementasi masuk per domain fitur.

---

## 📦 FASE 1 — FOUNDATION (Wajib Sebelum Semua Role)

### 1.1 Theme System
- [x] Update [`src/index.css`](src/index.css) dengan token warna baru
- [x] Tambahkan semantic color tokens: success, warning, info, danger
- [x] Tambahkan `--color-destructive-foreground` ke @theme inline
- [x] Tambahkan glassmorphism variables (bgDrift, section-shell, glass utility)
- [x] Tambahkan token chart color yang konsisten
- [x] Tambahkan motion tokens dan keyframes animasi (bgDrift, fadeIn, slideDown, shake)
- [ ] Verifikasi dark mode tidak regress

### 1.2 Custom UI Components
Buat/siapkan di [`src/components/ui/`](src/components/ui):
- [x] [`src/components/ui/glass-card.tsx`](src/components/ui/glass-card.tsx)
- [x] [`src/components/ui/animated-counter.tsx`](src/components/ui/animated-counter.tsx)
- [x] [`src/components/ui/status-badge.tsx`](src/components/ui/status-badge.tsx)
- [x] [`src/components/ui/dashboard-card.tsx`](src/components/ui/dashboard-card.tsx)
- [x] [`src/components/ui/dashboard-skeleton.tsx`](src/components/ui/dashboard-skeleton.tsx)
- [x] [`src/components/ui/button-enhanced.tsx`](src/components/ui/button-enhanced.tsx)
- [x] [`src/components/ui/stepper.tsx`](src/components/ui/stepper.tsx)

### 1.3 Hooks & Utilities
- [x] Buat [`src/lib/hooks/use-animation.ts`](src/lib/hooks/use-animation.ts)
- [x] Buat [`src/lib/toast-config.ts`](src/lib/toast-config.ts)
- [x] Update export aggregator [`src/components/ui/index.ts`](src/components/ui/index.ts)

### 1.4 Global Layout & Shared Experience
- [x] `Toaster` sudah terpasang via `NotificationProvider` di `App.tsx`
- [x] `AppLayout` — spacing, struktur, focus ring sudah konsisten
- [x] Toast, skeleton, loading, empty-state sudah punya pola konsisten

---

## 🔐 FASE 2 — AUTH & PUBLIC EXPERIENCE

### Auth Pages
- [x] [`src/pages/auth/LoginPage.tsx`](src/pages/auth/LoginPage.tsx) — GlassCard + floating bg
- [x] [`src/pages/auth/RegisterPage.tsx`](src/pages/auth/RegisterPage.tsx) — GlassCard, konsisten dengan LoginPage
- [x] [`src/pages/auth/ForgotPasswordPage.tsx`](src/pages/auth/ForgotPasswordPage.tsx) — GlassCard

### Target UI/UX
- [x] Gradient background konsisten
- [x] Glass card untuk auth container
- [x] Button loading state via ButtonEnhanced
- [x] Form validation state lebih jelas
- [ ] Dark mode nyaman untuk form auth (verifikasi visual)

### Public Pages
- [x] [`src/pages/public/HomePage.tsx`](src/pages/public/HomePage.tsx) — GlassCard + ButtonEnhanced
- [x] [`src/pages/public/UnauthorizedPage.tsx`](src/pages/public/UnauthorizedPage.tsx) — GlassCard
- [x] [`src/pages/public/NotFoundPage.tsx`](src/pages/public/NotFoundPage.tsx) — GlassCard
- [x] [`src/pages/public/OfflinePage.tsx`](src/pages/public/OfflinePage.tsx) — GlassCard

### Target UI/UX Public
- [x] Landing page hero diperkuat dengan visual theme baru
- [x] Error/empty/offline state lebih informatif
- [ ] CTA dan navigasi publik lebih konsisten

---

## 🛠️ FASE 3 — ADMIN ROLE: SELURUH FITUR

## 3.A Admin Core Navigation & Dashboard
- [x] [`src/pages/admin/DashboardPage.tsx`](src/pages/admin/DashboardPage.tsx) — DashboardCard + DashboardSkeleton
- [ ] [`src/pages/admin/ProfilePage.tsx`](src/pages/admin/ProfilePage.tsx) — belum diupgrade

### Target
- [x] Dashboard stats → `DashboardCard`
- [x] Counter animasi untuk KPI
- [x] Skeleton loading dashboard
- [ ] Kartu quick action lebih modern
- [ ] Profile page konsisten dengan theme baru

## 3.B Admin User, Role, dan Mahasiswa Management
- [ ] [`src/pages/admin/UsersPage.tsx`](src/pages/admin/UsersPage.tsx)
- [ ] [`src/pages/admin/MahasiswaManagementPage.tsx`](src/pages/admin/MahasiswaManagementPage.tsx)
- [ ] [`src/pages/admin/RolesPage.tsx`](src/pages/admin/RolesPage.tsx)
- [ ] [`src/pages/admin/RolesPage-ENHANCED.tsx`](src/pages/admin/RolesPage-ENHANCED.tsx)

### Target
- [ ] Table state, filter state, empty state lebih jelas
- [ ] Status user/role pakai `StatusBadge`
- [ ] Modal dan action button lebih konsisten
- [ ] Loading table gunakan skeleton

## 3.C Admin Academic Structure
- [ ] [`src/pages/admin/MataKuliahPage.tsx`](src/pages/admin/MataKuliahPage.tsx)
- [ ] [`src/pages/admin/KelasPage.tsx`](src/pages/admin/KelasPage.tsx)
- [ ] [`src/pages/admin/KelasPageEnhanced.tsx`](src/pages/admin/KelasPageEnhanced.tsx)
- [ ] [`src/pages/admin/KelasPageSimple.tsx`](src/pages/admin/KelasPageSimple.tsx)
- [ ] [`src/pages/admin/KelasMataKuliahPage.tsx`](src/pages/admin/KelasMataKuliahPage.tsx)
- [ ] [`src/pages/admin/AcademicAssignmentPage.tsx`](src/pages/admin/AcademicAssignmentPage.tsx)
- [ ] [`src/pages/admin/AssignmentManagementPage.tsx`](src/pages/admin/AssignmentManagementPage.tsx)
- [ ] [`src/pages/admin/ManajemenAssignmentPage.tsx`](src/pages/admin/ManajemenAssignmentPage.tsx)

### Target
- [ ] Data academic structure tampil lebih mudah dipindai
- [ ] Stepper untuk workflow assignment bila cocok
- [ ] Badge status untuk relasi kelas, MK, assignment
- [ ] Bulk actions dan form state lebih jelas

## 3.D Admin Lab & Asset Management
- [ ] [`src/pages/admin/LaboratoriesPage.tsx`](src/pages/admin/LaboratoriesPage.tsx)
- [ ] [`src/pages/admin/EquipmentsPage.tsx`](src/pages/admin/EquipmentsPage.tsx)
- [x] [`src/pages/admin/PeminjamanApprovalPage.tsx`](src/pages/admin/PeminjamanApprovalPage.tsx) — StatusBadge

### Target
- [ ] Card/list inventory lebih modern
- [ ] Status peralatan/peminjaman lebih jelas
- [x] Approval flow visual lebih kuat
- [ ] Empty/loading/error state dibakukan

## 3.E Admin Communication, Monitoring, Cleanup
- [ ] [`src/pages/admin/AnnouncementsPage.tsx`](src/pages/admin/AnnouncementsPage.tsx)
- [ ] [`src/pages/admin/AnalyticsPage.tsx`](src/pages/admin/AnalyticsPage.tsx)
- [x] [`src/pages/admin/SyncManagementPage.tsx`](src/pages/admin/SyncManagementPage.tsx) — StatusBadge
- [ ] [`src/pages/admin/SyncMonitoringPage.tsx`](src/pages/admin/SyncMonitoringPage.tsx)
- [ ] [`src/pages/admin/CleanupPage.tsx`](src/pages/admin/CleanupPage.tsx)

### Target
- [ ] Monitoring cards & analytics chart ikuti token tema baru
- [ ] Announcements form/list lebih readable
- [x] Sync status memakai badge/indicator realtime
- [ ] Halaman utilitas tetap rapi walau teknis

---

## 👨‍🏫 FASE 4 — DOSEN ROLE: SELURUH FITUR

## 4.A Dosen Dashboard & Profil
- [x] [`src/pages/dosen/DashboardPage.tsx`](src/pages/dosen/DashboardPage.tsx) — DashboardCard + GlassCard
- [ ] [`src/pages/dosen/ProfilePage.tsx`](src/pages/dosen/ProfilePage.tsx) — belum diupgrade

### Target
- [x] Stats dan quick-action dashboard modern
- [ ] Summary aktivitas dengan badge status
- [ ] Profile page konsisten dan mudah diisi

## 4.B Dosen Academic Operations
- [x] [`src/pages/dosen/JadwalPage.tsx`](src/pages/dosen/JadwalPage.tsx) — StatusBadge + GlassCard
- [ ] [`src/pages/dosen/KehadiranPage.tsx`](src/pages/dosen/KehadiranPage.tsx)
- [ ] [`src/pages/dosen/PenilaianPage.tsx`](src/pages/dosen/PenilaianPage.tsx)
- [ ] [`src/pages/dosen/MateriPage.tsx`](src/pages/dosen/MateriPage.tsx)
- [ ] [`src/pages/dosen/BankSoalPage.tsx`](src/pages/dosen/BankSoalPage.tsx)
- [x] [`src/pages/dosen/LogbookReviewPage.tsx`](src/pages/dosen/LogbookReviewPage.tsx) — GlassCard

### Target
- [x] Jadwal lebih mudah dibaca dan discan
- [ ] Kehadiran & penilaian punya status visual konsisten
- [ ] Materi & bank soal gunakan card/list patterns seragam
- [ ] Logbook review butuh readability tinggi dan sticky info area bila perlu

## 4.C Dosen Kuis System
- [ ] [`src/pages/dosen/kuis/KuisListPage.tsx`](src/pages/dosen/kuis/KuisListPage.tsx)
- [ ] [`src/pages/dosen/kuis/KuisCreatePage.tsx`](src/pages/dosen/kuis/KuisCreatePage.tsx)
- [ ] [`src/pages/dosen/kuis/KuisBuilderPage.tsx`](src/pages/dosen/kuis/KuisBuilderPage.tsx)
- [ ] [`src/pages/dosen/kuis/KuisEditPage.tsx`](src/pages/dosen/kuis/KuisEditPage.tsx)
- [ ] [`src/pages/dosen/kuis/KuisResultsPage.tsx`](src/pages/dosen/kuis/KuisResultsPage.tsx)
- [ ] [`src/pages/dosen/kuis/AttemptDetailPage.tsx`](src/pages/dosen/kuis/AttemptDetailPage.tsx)

### Target
- [ ] Quiz builder lebih terstruktur
- [ ] Stepper untuk create/edit flow bila cocok
- [ ] Result analytics pakai chart colors konsisten
- [ ] Attempt detail fokus pada readability jawaban

## 4.D Dosen Peminjaman & Komunikasi
- [ ] [`src/pages/dosen/PeminjamanPage.tsx`](src/pages/dosen/PeminjamanPage.tsx)
- [ ] [`src/pages/dosen/PengumumanPage.tsx`](src/pages/dosen/PengumumanPage.tsx)

### Target
- [ ] Status pinjam dan approval lebih tegas
- [ ] Pengumuman/notifikasi konsisten dengan role lain

---

## 🧪 FASE 5 — LABORAN ROLE: SELURUH FITUR

## 5.A Laboran Dashboard & Profil
- [x] [`src/pages/laboran/DashboardPage.tsx`](src/pages/laboran/DashboardPage.tsx) — DashboardCard + DashboardSkeleton
- [x] [`src/pages/laboran/ProfilePage.tsx`](src/pages/laboran/ProfilePage.tsx) — GlassCard

### Target
- [x] Ringkasan inventaris/persetujuan pakai dashboard cards
- [x] Profile page konsisten

## 5.B Laboran Operasional Inti
- [x] [`src/pages/laboran/InventarisPage.tsx`](src/pages/laboran/InventarisPage.tsx) — StatusBadge
- [x] [`src/pages/laboran/LaboratoriumPage.tsx`](src/pages/laboran/LaboratoriumPage.tsx) — StatusBadge + GlassCard
- [x] [`src/pages/laboran/JadwalApprovalPage.tsx`](src/pages/laboran/JadwalApprovalPage.tsx) — StatusBadge + GlassCard
- [x] [`src/pages/laboran/LaporanPage.tsx`](src/pages/laboran/LaporanPage.tsx) — GlassCard + DashboardCard

### Target
- [x] Kondisi inventaris pakai `StatusBadge`
- [x] Approval jadwal lebih mudah ditelusuri
- [x] Laporan dan chart selaras dengan tema baru

## 5.C Laboran Peminjaman & Approval
- [x] [`src/pages/laboran/PersetujuanPage.tsx`](src/pages/laboran/PersetujuanPage.tsx) — StatusBadge + GlassCard
- [x] [`src/pages/laboran/PeminjamanAktifPage.tsx`](src/pages/laboran/PeminjamanAktifPage.tsx) — StatusBadge
- [ ] [`src/pages/laboran/ApprovalPage.tsx`](src/pages/laboran/ApprovalPage.tsx) — belum diupgrade

### Target
- [x] Approval workflow visual lebih jelas
- [ ] Progress step dan status transisi lebih mudah dipahami
- [x] Active borrowing monitoring lebih ringkas

## 5.D Laboran Communication
- [x] [`src/pages/laboran/PengumumanPage.tsx`](src/pages/laboran/PengumumanPage.tsx) — GlassCard

---

## 🎓 FASE 6 — MAHASISWA ROLE: SELURUH FITUR

## 6.A Mahasiswa Dashboard & Profil
- [x] [`src/pages/mahasiswa/DashboardPage.tsx`](src/pages/mahasiswa/DashboardPage.tsx) — DashboardCard + DashboardSkeleton
- [ ] [`src/pages/mahasiswa/ProfilePage.tsx`](src/pages/mahasiswa/ProfilePage.tsx) — belum diupgrade

### Target
- [x] Ringkasan jadwal, nilai, presensi lebih menarik
- [ ] Card informasi harian lebih actionable

## 6.B Mahasiswa Pembelajaran Inti
- [x] [`src/pages/mahasiswa/JadwalPage.tsx`](src/pages/mahasiswa/JadwalPage.tsx) — StatusBadge + GlassCard
- [x] [`src/pages/mahasiswa/MateriPage.tsx`](src/pages/mahasiswa/MateriPage.tsx) — GlassCard
- [x] [`src/pages/mahasiswa/NilaiPage.tsx`](src/pages/mahasiswa/NilaiPage.tsx) — StatusBadge + DashboardCard
- [x] [`src/pages/mahasiswa/PresensiPage.tsx`](src/pages/mahasiswa/PresensiPage.tsx) — StatusBadge + GlassCard
- [x] [`src/pages/mahasiswa/LogbookPage.tsx`](src/pages/mahasiswa/LogbookPage.tsx) — GlassCard
- [ ] [`src/pages/mahasiswa/ConflictsPage.tsx`](src/pages/mahasiswa/ConflictsPage.tsx) — belum diupgrade

### Target
- [x] Timeline jadwal lebih jelas
- [x] Materi dan file download lebih usable
- [x] Nilai & presensi pakai status/summary card
- [x] Logbook fokus pada form usability
- [ ] Conflict page diberi warning UI yang kuat

## 6.C Mahasiswa Kuis System
- [x] [`src/pages/mahasiswa/kuis/KuisListPage.tsx`](src/pages/mahasiswa/kuis/KuisListPage.tsx) — StatusBadge
- [ ] [`src/pages/mahasiswa/kuis/KuisAttemptPage.tsx`](src/pages/mahasiswa/kuis/KuisAttemptPage.tsx)
- [ ] [`src/pages/mahasiswa/kuis/KuisResultPage.tsx`](src/pages/mahasiswa/kuis/KuisResultPage.tsx)

### Target
- [x] Quiz list lebih mudah difilter dan dibedakan statusnya
- [ ] Attempt page punya progress & timer clarity
- [ ] Result page lebih informatif dan tidak padat

## 6.D Mahasiswa Communication & Offline
- [ ] [`src/pages/mahasiswa/PengumumanPage.tsx`](src/pages/mahasiswa/PengumumanPage.tsx)
- [ ] [`src/pages/mahasiswa/OfflineSyncPage.tsx`](src/pages/mahasiswa/OfflineSyncPage.tsx)

### Target
- [ ] Pengumuman/notifikasi lebih nyaman dibaca
- [ ] Offline sync status lebih jelas dan edukatif

---

## 🔄 FASE 7 — SHARED & CROSS-ROLE EXPERIENCE

### Shared Pages
- [ ] [`src/pages/shared/OfflineSyncPage.tsx`](src/pages/shared/OfflineSyncPage.tsx)

### Cross-role route coverage dari router
Rute ini harus ikut diperhitungkan di rencana UI/UX walaupun memakai halaman yang sama atau shared page:
- [ ] `/admin/offline-sync`
- [ ] `/dosen/offline-sync`
- [ ] `/laboran/offline-sync`
- [ ] `/mahasiswa/offline-sync`
- [ ] `/admin/notifikasi`
- [ ] `/dosen/notifikasi`
- [ ] `/mahasiswa/notifikasi`
- [ ] `/laboran/notifikasi`
- [ ] `/dosen/pengumuman`

### Target
- [ ] Offline sync experience konsisten lintas role
- [ ] Notifikasi/pengumuman lintas role pakai pola visual seragam
- [ ] Alias route tidak menimbulkan UI berbeda yang membingungkan

---

## 🗺️ PETA FITUR BERDASARKAN ROUTER AKTUAL

## Public/Auth
- [x] `/`
- [x] `/login`
- [x] `/register`
- [x] `/forgot-password`
- [x] `/403`
- [x] `/404`

## Admin
- [x] `/admin`
- [x] `/admin/dashboard`
- [x] `/admin/mata-kuliah`
- [x] `/admin/kelas-mata-kuliah`
- [x] `/admin/kelas`
- [x] `/admin/users`
- [x] `/admin/laboratories`
- [x] `/admin/equipments`
- [x] `/admin/peminjaman`
- [x] `/admin/peminjaman-aktif`
- [x] `/admin/announcements`
- [x] `/admin/manajemen-assignment`
- [x] `/admin/notifikasi`
- [x] `/admin/profil`
- [x] `/admin/offline-sync`

## Dosen
- [x] `/dosen`
- [x] `/dosen/dashboard`
- [x] `/dosen/jadwal`
- [x] `/dosen/kuis`
- [x] `/dosen/kuis/create`
- [x] `/dosen/kuis/:kuisId/edit`
- [x] `/dosen/kuis/:kuisId/results`
- [x] `/dosen/kuis/:kuisId/attempt/:attemptId`
- [x] `/dosen/bank-soal`
- [x] `/dosen/materi`
- [x] `/dosen/penilaian`
- [x] `/dosen/logbook-review`
- [x] `/dosen/peminjaman`
- [x] `/dosen/kehadiran`
- [x] `/dosen/notifikasi`
- [x] `/dosen/profil`
- [x] `/dosen/pengumuman`
- [x] `/dosen/offline-sync`

## Mahasiswa
- [x] `/mahasiswa`
- [x] `/mahasiswa/dashboard`
- [x] `/mahasiswa/jadwal`
- [x] `/mahasiswa/logbook`
- [x] `/mahasiswa/kuis/:kuisId/attempt/:attemptId?`
- [x] `/mahasiswa/kuis/:kuisId/result/:attemptId`
- [x] `/mahasiswa/kuis`
- [x] `/mahasiswa/materi`
- [x] `/mahasiswa/nilai`
- [x] `/mahasiswa/presensi`
- [x] `/mahasiswa/notifikasi`
- [x] `/mahasiswa/profil`
- [x] `/mahasiswa/offline-sync`

## Laboran
- [x] `/laboran`
- [x] `/laboran/dashboard`
- [x] `/laboran/inventaris`
- [x] `/laboran/persetujuan`
- [x] `/laboran/peminjaman-aktif`
- [x] `/laboran/laboratorium`
- [x] `/laboran/jadwal`
- [x] `/laboran/laporan`
- [x] `/laboran/notifikasi`
- [x] `/laboran/profil`
- [x] `/laboran/offline-sync`

---

## 📁 STATUS IMPLEMENTASI HALAMAN PER ROLE

## Admin
- [ ] [`src/pages/admin/AcademicAssignmentPage.tsx`](src/pages/admin/AcademicAssignmentPage.tsx)
- [ ] [`src/pages/admin/AnalyticsPage.tsx`](src/pages/admin/AnalyticsPage.tsx)
- [ ] [`src/pages/admin/AnnouncementsPage.tsx`](src/pages/admin/AnnouncementsPage.tsx)
- [ ] [`src/pages/admin/AssignmentManagementPage.tsx`](src/pages/admin/AssignmentManagementPage.tsx)
- [ ] [`src/pages/admin/CleanupPage.tsx`](src/pages/admin/CleanupPage.tsx)
- [x] [`src/pages/admin/DashboardPage.tsx`](src/pages/admin/DashboardPage.tsx)
- [ ] [`src/pages/admin/EquipmentsPage.tsx`](src/pages/admin/EquipmentsPage.tsx)
- [ ] [`src/pages/admin/KelasMataKuliahPage.tsx`](src/pages/admin/KelasMataKuliahPage.tsx)
- [ ] [`src/pages/admin/KelasPage.tsx`](src/pages/admin/KelasPage.tsx)
- [ ] [`src/pages/admin/KelasPageEnhanced.tsx`](src/pages/admin/KelasPageEnhanced.tsx)
- [ ] [`src/pages/admin/KelasPageSimple.tsx`](src/pages/admin/KelasPageSimple.tsx)
- [ ] [`src/pages/admin/LaboratoriesPage.tsx`](src/pages/admin/LaboratoriesPage.tsx)
- [ ] [`src/pages/admin/MahasiswaManagementPage.tsx`](src/pages/admin/MahasiswaManagementPage.tsx)
- [ ] [`src/pages/admin/ManajemenAssignmentPage.tsx`](src/pages/admin/ManajemenAssignmentPage.tsx)
- [ ] [`src/pages/admin/MataKuliahPage.tsx`](src/pages/admin/MataKuliahPage.tsx)
- [x] [`src/pages/admin/PeminjamanApprovalPage.tsx`](src/pages/admin/PeminjamanApprovalPage.tsx)
- [ ] [`src/pages/admin/ProfilePage.tsx`](src/pages/admin/ProfilePage.tsx)
- [ ] [`src/pages/admin/RolesPage.tsx`](src/pages/admin/RolesPage.tsx)
- [ ] [`src/pages/admin/RolesPage-ENHANCED.tsx`](src/pages/admin/RolesPage-ENHANCED.tsx)
- [x] [`src/pages/admin/SyncManagementPage.tsx`](src/pages/admin/SyncManagementPage.tsx)
- [ ] [`src/pages/admin/SyncMonitoringPage.tsx`](src/pages/admin/SyncMonitoringPage.tsx)
- [ ] [`src/pages/admin/UsersPage.tsx`](src/pages/admin/UsersPage.tsx)

## Dosen
- [ ] [`src/pages/dosen/BankSoalPage.tsx`](src/pages/dosen/BankSoalPage.tsx)
- [x] [`src/pages/dosen/DashboardPage.tsx`](src/pages/dosen/DashboardPage.tsx)
- [x] [`src/pages/dosen/JadwalPage.tsx`](src/pages/dosen/JadwalPage.tsx)
- [ ] [`src/pages/dosen/KehadiranPage.tsx`](src/pages/dosen/KehadiranPage.tsx)
- [x] [`src/pages/dosen/LogbookReviewPage.tsx`](src/pages/dosen/LogbookReviewPage.tsx)
- [ ] [`src/pages/dosen/MateriPage.tsx`](src/pages/dosen/MateriPage.tsx)
- [ ] [`src/pages/dosen/PeminjamanPage.tsx`](src/pages/dosen/PeminjamanPage.tsx)
- [ ] [`src/pages/dosen/PengumumanPage.tsx`](src/pages/dosen/PengumumanPage.tsx)
- [ ] [`src/pages/dosen/PenilaianPage.tsx`](src/pages/dosen/PenilaianPage.tsx)
- [ ] [`src/pages/dosen/ProfilePage.tsx`](src/pages/dosen/ProfilePage.tsx)
- [ ] [`src/pages/dosen/kuis/AttemptDetailPage.tsx`](src/pages/dosen/kuis/AttemptDetailPage.tsx)
- [ ] [`src/pages/dosen/kuis/KuisBuilderPage.tsx`](src/pages/dosen/kuis/KuisBuilderPage.tsx)
- [ ] [`src/pages/dosen/kuis/KuisCreatePage.tsx`](src/pages/dosen/kuis/KuisCreatePage.tsx)
- [ ] [`src/pages/dosen/kuis/KuisEditPage.tsx`](src/pages/dosen/kuis/KuisEditPage.tsx)
- [ ] [`src/pages/dosen/kuis/KuisListPage.tsx`](src/pages/dosen/kuis/KuisListPage.tsx)
- [ ] [`src/pages/dosen/kuis/KuisResultsPage.tsx`](src/pages/dosen/kuis/KuisResultsPage.tsx)

## Laboran
- [ ] [`src/pages/laboran/ApprovalPage.tsx`](src/pages/laboran/ApprovalPage.tsx)
- [x] [`src/pages/laboran/DashboardPage.tsx`](src/pages/laboran/DashboardPage.tsx)
- [x] [`src/pages/laboran/InventarisPage.tsx`](src/pages/laboran/InventarisPage.tsx)
- [x] [`src/pages/laboran/JadwalApprovalPage.tsx`](src/pages/laboran/JadwalApprovalPage.tsx)
- [x] [`src/pages/laboran/LaboratoriumPage.tsx`](src/pages/laboran/LaboratoriumPage.tsx)
- [x] [`src/pages/laboran/LaporanPage.tsx`](src/pages/laboran/LaporanPage.tsx)
- [x] [`src/pages/laboran/PeminjamanAktifPage.tsx`](src/pages/laboran/PeminjamanAktifPage.tsx)
- [x] [`src/pages/laboran/PengumumanPage.tsx`](src/pages/laboran/PengumumanPage.tsx)
- [x] [`src/pages/laboran/PersetujuanPage.tsx`](src/pages/laboran/PersetujuanPage.tsx)
- [x] [`src/pages/laboran/ProfilePage.tsx`](src/pages/laboran/ProfilePage.tsx)

## Mahasiswa
- [ ] [`src/pages/mahasiswa/ConflictsPage.tsx`](src/pages/mahasiswa/ConflictsPage.tsx)
- [x] [`src/pages/mahasiswa/DashboardPage.tsx`](src/pages/mahasiswa/DashboardPage.tsx)
- [x] [`src/pages/mahasiswa/JadwalPage.tsx`](src/pages/mahasiswa/JadwalPage.tsx)
- [x] [`src/pages/mahasiswa/LogbookPage.tsx`](src/pages/mahasiswa/LogbookPage.tsx)
- [x] [`src/pages/mahasiswa/MateriPage.tsx`](src/pages/mahasiswa/MateriPage.tsx)
- [x] [`src/pages/mahasiswa/NilaiPage.tsx`](src/pages/mahasiswa/NilaiPage.tsx)
- [ ] [`src/pages/mahasiswa/OfflineSyncPage.tsx`](src/pages/mahasiswa/OfflineSyncPage.tsx)
- [ ] [`src/pages/mahasiswa/PengumumanPage.tsx`](src/pages/mahasiswa/PengumumanPage.tsx)
- [x] [`src/pages/mahasiswa/PresensiPage.tsx`](src/pages/mahasiswa/PresensiPage.tsx)
- [ ] [`src/pages/mahasiswa/ProfilePage.tsx`](src/pages/mahasiswa/ProfilePage.tsx)
- [ ] [`src/pages/mahasiswa/kuis/KuisAttemptPage.tsx`](src/pages/mahasiswa/kuis/KuisAttemptPage.tsx)
- [x] [`src/pages/mahasiswa/kuis/KuisListPage.tsx`](src/pages/mahasiswa/kuis/KuisListPage.tsx)
- [ ] [`src/pages/mahasiswa/kuis/KuisResultPage.tsx`](src/pages/mahasiswa/kuis/KuisResultPage.tsx)

## Public
- [x] [`src/pages/public/HomePage.tsx`](src/pages/public/HomePage.tsx)
- [x] [`src/pages/public/NotFoundPage.tsx`](src/pages/public/NotFoundPage.tsx)
- [x] [`src/pages/public/OfflinePage.tsx`](src/pages/public/OfflinePage.tsx)
- [x] [`src/pages/public/UnauthorizedPage.tsx`](src/pages/public/UnauthorizedPage.tsx)

## Auth
- [x] [`src/pages/auth/LoginPage.tsx`](src/pages/auth/LoginPage.tsx)
- [x] [`src/pages/auth/RegisterPage.tsx`](src/pages/auth/RegisterPage.tsx)
- [x] [`src/pages/auth/ForgotPasswordPage.tsx`](src/pages/auth/ForgotPasswordPage.tsx)

## Shared
- [ ] [`src/pages/shared/OfflineSyncPage.tsx`](src/pages/shared/OfflineSyncPage.tsx)

---

## 📊 PRIORITAS IMPLEMENTASI SELANJUTNYA

### ✅ Sudah Selesai — Foundation + Dashboard + Laboran + Mahasiswa Inti
- [x] Theme tokens + semantic colors
- [x] Semua custom UI components
- [x] Login/ForgotPassword
- [x] Admin, Dosen, Laboran, Mahasiswa Dashboard
- [x] Laboran: seluruh halaman operasional
- [x] Mahasiswa: jadwal, materi, nilai, presensi, logbook, kuis-list

### 🔴 Priority Berikutnya — Halaman yang Belum Diupgrade

#### Halaman Profile (semua role)
- [ ] `src/pages/admin/ProfilePage.tsx`
- [ ] `src/pages/dosen/ProfilePage.tsx`
- [ ] `src/pages/mahasiswa/ProfilePage.tsx`

#### Auth
- [ ] `src/pages/auth/RegisterPage.tsx`

#### Admin management pages
- [ ] `src/pages/admin/UsersPage.tsx`
- [ ] `src/pages/admin/MahasiswaManagementPage.tsx`
- [ ] `src/pages/admin/RolesPage.tsx`
- [ ] `src/pages/admin/LaboratoriesPage.tsx`
- [ ] `src/pages/admin/EquipmentsPage.tsx`
- [ ] `src/pages/admin/MataKuliahPage.tsx`
- [ ] `src/pages/admin/KelasPage.tsx`
- [ ] `src/pages/admin/KelasMataKuliahPage.tsx`
- [ ] `src/pages/admin/ManajemenAssignmentPage.tsx`
- [ ] `src/pages/admin/AnnouncementsPage.tsx`
- [ ] `src/pages/admin/AnalyticsPage.tsx`

#### Dosen fitur akademik
- [ ] `src/pages/dosen/KehadiranPage.tsx`
- [ ] `src/pages/dosen/PenilaianPage.tsx`
- [ ] `src/pages/dosen/MateriPage.tsx`
- [ ] `src/pages/dosen/BankSoalPage.tsx`
- [ ] `src/pages/dosen/PeminjamanPage.tsx`
- [ ] `src/pages/dosen/PengumumanPage.tsx`

#### Dosen kuis system
- [ ] `src/pages/dosen/kuis/KuisListPage.tsx`
- [ ] `src/pages/dosen/kuis/KuisCreatePage.tsx`
- [ ] `src/pages/dosen/kuis/KuisBuilderPage.tsx`
- [ ] `src/pages/dosen/kuis/KuisEditPage.tsx`
- [ ] `src/pages/dosen/kuis/KuisResultsPage.tsx`
- [ ] `src/pages/dosen/kuis/AttemptDetailPage.tsx`

#### Mahasiswa sisa
- [ ] `src/pages/mahasiswa/ConflictsPage.tsx`
- [ ] `src/pages/mahasiswa/PengumumanPage.tsx`
- [ ] `src/pages/mahasiswa/OfflineSyncPage.tsx`
- [ ] `src/pages/mahasiswa/kuis/KuisAttemptPage.tsx`
- [ ] `src/pages/mahasiswa/kuis/KuisResultPage.tsx`

#### Laboran sisa
- [ ] `src/pages/laboran/ApprovalPage.tsx`

#### Shared
- [ ] `src/pages/shared/OfflineSyncPage.tsx`

---

## ✅ CHECKLIST VALIDASI SETELAH TIAP FASE
- [ ] Semua route utama tetap bisa dibuka
- [ ] Tidak ada komponen shadcn/ui lama yang rusak
- [ ] Responsive tetap aman
- [ ] Dark mode aman
- [ ] Empty/loading/error states konsisten
- [ ] Aksesibilitas dasar tetap baik
- [ ] Tidak ada role yang tertinggal dari audit route

---

## 📝 Catatan Penting

1. Rencana ini sekarang sudah mencakup **fitur aktual dari router** dan **halaman aktual di setiap role**.
2. Ada beberapa file yang belum tentu terhubung langsung di router, tetapi tetap dimasukkan ke backlog agar tidak ada fitur internal yang tertinggal.
3. **Foundation (Fase 1) sudah 95% selesai** — tinggal `danger` token dan validasi dark mode.
4. **Laboran adalah role paling lengkap** — hampir semua halaman sudah diupgrade.
5. **Dosen kuis system** adalah kelompok halaman terbesar yang belum disentuh sama sekali.
