# Rencana Implementasi Komprehensif UI/UX - Sistem Praktikum PWA

## 🎯 Tujuan
Menyusun rencana implementasi UI/UX yang **lebih akurat, lebih menarik, dan lebih konsisten** untuk seluruh aplikasi berdasarkan kondisi aktual di [`src/routes/index.tsx`](src/routes/index.tsx), struktur route di [`src/config/routes.config.ts`](src/config/routes.config.ts), fondasi tema di [`src/index.css`](src/index.css), komponen reusable di [`src/components/ui/index.ts`](src/components/ui/index.ts), serta halaman aktual di [`src/pages/`](src/pages).

Dokumen ini menggantikan versi sebelumnya yang masih mencampur:
- status implementasi nyata,
- target visual jangka panjang,
- dan route yang belum sepenuhnya sinkron dengan aplikasi saat ini.

---

## ✅ Sumber Audit Aktual
Rencana ini disusun dari audit file berikut:
- [`src/routes/index.tsx`](src/routes/index.tsx)
- [`src/config/routes.config.ts`](src/config/routes.config.ts)
- [`src/index.css`](src/index.css)
- [`src/components/ui/index.ts`](src/components/ui/index.ts)
- [`src/components/layout/AppLayout.tsx`](src/components/layout/AppLayout.tsx)
- seluruh halaman dalam [`src/pages/admin/`](src/pages/admin)
- seluruh halaman dalam [`src/pages/auth/`](src/pages/auth)
- seluruh halaman dalam [`src/pages/dosen/`](src/pages/dosen)
- seluruh halaman dalam [`src/pages/laboran/`](src/pages/laboran)
- seluruh halaman dalam [`src/pages/mahasiswa/`](src/pages/mahasiswa)
- seluruh halaman dalam [`src/pages/public/`](src/pages/public)
- halaman bersama di [`src/pages/shared/`](src/pages/shared)

---

## 🧭 Prinsip Implementasi Baru

1. **Berbasis route nyata** — halaman yang benar-benar dipakai di router menjadi prioritas utama.
2. **Visual harus menarik, bukan hanya rapi** — fokus pada hierarchy, clarity, motion, spacing, dan polish.
3. **Konsistensi lintas role** — admin, dosen, laboran, dan mahasiswa harus terasa satu produk yang sama.
4. **Token-first, hardcode-last** — warna, radius, shadow, dan state harus mengutamakan token dari [`src/index.css`](src/index.css).
5. **Progress bertingkat** — status halaman dibedakan agar tidak semua disederhanakan menjadi hanya “selesai” atau “belum”.
6. **Aman untuk migrasi bertahap** — primitive lama tetap boleh hidup, tetapi tampilan akhir harus menuju sistem visual tunggal.
7. **UX state wajib lengkap** — loading, empty, error, disabled, offline, success, warning harus konsisten.

---

## 🧪 Definisi Status Implementasi
Agar audit lebih presisi, semua halaman memakai 4 level status:

- **LEGACY** — masih dominan gaya lama / belum ikut sistem visual baru.
- **PARTIAL** — sudah memakai sebagian fondasi baru, tetapi belum konsisten.
- **MOSTLY ALIGNED** — sudah kuat secara visual, tinggal polishing atau penyeragaman detail.
- **FULLY ALIGNED** — sudah konsisten dengan fondasi tema, komponen, dan pola UX baru.

---

## 📦 FASE 1 — FOUNDATION SYSTEM (WAJIB)

## 1.1 Theme & Design Tokens
Status fondasi: **MOSTLY ALIGNED**

### Sudah ada
- [x] Token dasar dan semantic colors di [`src/index.css`](src/index.css)
- [x] Mapping token `@theme inline` termasuk [`--color-destructive-foreground`](src/index.css:26)
- [x] Semantic tokens `success`, `warning`, `info`, `danger` di [`src/index.css`](src/index.css)
- [x] Utility visual seperti [`section-shell`](src/index.css:226), [`glass-panel`](src/index.css:233), [`brand-gradient`](src/index.css:247)
- [x] Chart tokens konsisten di [`src/index.css`](src/index.css)

### Masih perlu diselesaikan
- [ ] Audit halaman yang masih banyak memakai warna hardcoded `blue-*`, `amber-*`, `slate-*`
- [ ] Tetapkan aturan kapan pakai token semantic dan kapan pakai accent dekoratif
- [ ] Verifikasi dark mode lintas auth, public, dashboard, form, tabel, alert, dialog
- [ ] Tetapkan standar shadow, border opacity, glass intensity, dan surface depth
- [ ] Pastikan focus ring dan accessibility state konsisten lintas input/button/link

### Target visual foundation
- Semua halaman terasa berada dalam satu keluarga visual
- Accent color dipakai sebagai penguat, bukan dekorasi acak
- Glass effect dipakai konsisten dan tidak berlebihan
- Contrast aman di light dan dark mode

---

## 1.2 Custom UI Components
Status fondasi komponen: **FULLY ALIGNED**

### Komponen tersedia di [`src/components/ui/index.ts`](src/components/ui/index.ts)
- [x] [`src/components/ui/glass-card.tsx`](src/components/ui/glass-card.tsx)
- [x] [`src/components/ui/animated-counter.tsx`](src/components/ui/animated-counter.tsx)
- [x] [`src/components/ui/status-badge.tsx`](src/components/ui/status-badge.tsx)
- [x] [`src/components/ui/dashboard-card.tsx`](src/components/ui/dashboard-card.tsx)
- [x] [`src/components/ui/dashboard-skeleton.tsx`](src/components/ui/dashboard-skeleton.tsx)
- [x] [`src/components/ui/button-enhanced.tsx`](src/components/ui/button-enhanced.tsx)
- [x] [`src/components/ui/stepper.tsx`](src/components/ui/stepper.tsx)

### Masih perlu diselesaikan
- [ ] Tetapkan guideline penggunaan komponen per konteks halaman
- [ ] Buat pola baku untuk page header, metric section, filter toolbar, empty state, action bar
- [ ] Kurangi variasi manual styling yang duplikatif di tiap page

---

## 1.3 Hooks, Utilities, dan Shared Experience
Status: **MOSTLY ALIGNED**

### Sudah ada
- [x] [`src/lib/hooks/use-animation.ts`](src/lib/hooks/use-animation.ts)
- [x] [`src/lib/toast-config.ts`](src/lib/toast-config.ts)
- [x] Export aggregator [`src/components/ui/index.ts`](src/components/ui/index.ts)
- [x] Layout utama di [`src/components/layout/AppLayout.tsx`](src/components/layout/AppLayout.tsx)

### Masih perlu diselesaikan
- [ ] Samakan pola empty/loading/error/offline state per jenis halaman
- [ ] Pastikan layout shell setiap role memakai spacing dan visual rhythm yang sama
- [ ] Rapikan penggunaan page hero vs card header agar tidak campur aduk

---

## 1.4 Aturan Visual Global yang Wajib Dipatuhi
Semua fase berikut harus mengikuti aturan ini:

- [ ] Header halaman harus punya hierarchy: eyebrow, title, description, action
- [ ] Section penting harus punya pemisahan visual yang jelas
- [ ] Tabel/list wajib punya state: loading, empty, error, filtered-empty
- [ ] Form wajib punya state: default, focus, error, success, disabled, submitting
- [ ] CTA primer wajib konsisten secara warna, ukuran, dan emphasis
- [ ] Status penting wajib memakai badge/indicator konsisten
- [ ] Semua halaman harus nyaman dibaca pada mobile dan desktop

---

## 🔐 FASE 2 — AUTH & PUBLIC EXPERIENCE

## 2.1 Auth Pages

| Halaman | Status | Catatan |
|---|---|---|
| [`src/pages/auth/LoginPage.tsx`](src/pages/auth/LoginPage.tsx) | MOSTLY ALIGNED | Visual kuat, tetapi masih banyak warna hardcoded |
| [`src/pages/auth/RegisterPage.tsx`](src/pages/auth/RegisterPage.tsx) | MOSTLY ALIGNED | Sudah konsisten dengan login, perlu tokenisasi lebih rapi |
| [`src/pages/auth/ForgotPasswordPage.tsx`](src/pages/auth/ForgotPasswordPage.tsx) | PARTIAL | Sudah ikut arah baru, perlu verifikasi detail visual dan dark mode |

### Target implementasi auth
- [x] Glass card sebagai container utama
- [x] Gradient/floating background
- [x] Loading button dengan [`ButtonEnhanced`](src/components/ui/button-enhanced.tsx)
- [ ] Samakan spacing, radius, dan shadow antar auth page
- [ ] Pastikan dark mode auth nyaman dan kontras
- [ ] Kurangi hardcoded color agar auth konsisten dengan theme token
- [ ] Samakan secondary actions: kembali, lupa password, daftar, login

## 2.2 Public Pages

| Halaman | Status | Catatan |
|---|---|---|
| [`src/pages/public/HomePage.tsx`](src/pages/public/HomePage.tsx) | MOSTLY ALIGNED | Menarik secara visual, tapi tokenisasi masih belum bersih |
| [`src/pages/public/UnauthorizedPage.tsx`](src/pages/public/UnauthorizedPage.tsx) | MOSTLY ALIGNED | Sudah searah dengan visual baru |
| [`src/pages/public/NotFoundPage.tsx`](src/pages/public/NotFoundPage.tsx) | MOSTLY ALIGNED | Tinggal penyamaan CTA dan spacing |
| [`src/pages/public/OfflinePage.tsx`](src/pages/public/OfflinePage.tsx) | PARTIAL | Perlu disamakan dengan pola empty/error modern |

### Target implementasi public
- [x] Hero landing modern dan lebih kuat
- [ ] CTA publik konsisten secara hierarchy dan emphasis
- [ ] Nav publik, auth action, dan error action memakai pola button yang sama
- [ ] Hardcoded gradient diganti bertahap ke token/theme utilities
- [ ] Error/offline state memakai pola visual satu keluarga

---

## 🛠️ FASE 3 — ADMIN ROLE

## 3.1 Admin Core: Dashboard & Profile

| Halaman | Status | Catatan |
|---|---|---|
| [`src/pages/admin/DashboardPage.tsx`](src/pages/admin/DashboardPage.tsx) | MOSTLY ALIGNED | Fondasi dashboard kuat, perlu penyamaan quick action dan chart surface |
| [`src/pages/admin/ProfilePage.tsx`](src/pages/admin/ProfilePage.tsx) | PARTIAL | Sudah modern, tetapi belum boleh dianggap legacy total maupun fully aligned |

### Target admin core
- [x] KPI memakai [`DashboardCard`](src/components/ui/dashboard-card.tsx)
- [x] Loading memakai [`DashboardSkeleton`](src/components/ui/dashboard-skeleton.tsx)
- [ ] Quick action cards lebih premium dan actionable
- [ ] Chart, recent activity, dan cards memakai surface depth yang konsisten
- [ ] Profile page memakai pola form profile lintas role
- [ ] Success/error feedback profile mengikuti pola app-wide

## 3.2 Admin User, Role, dan Data Management

| Halaman | Status |
|---|---|
| [`src/pages/admin/UsersPage.tsx`](src/pages/admin/UsersPage.tsx) | LEGACY |
| [`src/pages/admin/MahasiswaManagementPage.tsx`](src/pages/admin/MahasiswaManagementPage.tsx) | LEGACY |
| [`src/pages/admin/RolesPage.tsx`](src/pages/admin/RolesPage.tsx) | LEGACY |
| [`src/pages/admin/RolesPage-ENHANCED.tsx`](src/pages/admin/RolesPage-ENHANCED.tsx) | PARTIAL |

### Target area ini
- [ ] Toolbar filter/search/action dibakukan
- [ ] Table state lebih jelas dan lebih ringan dibaca
- [ ] Status user/role wajib memakai [`StatusBadge`](src/components/ui/status-badge.tsx)
- [ ] Modal, bulk action, dan destructive action dibakukan
- [ ] Empty state tidak lagi sekadar teks datar

## 3.3 Admin Academic Structure

| Halaman | Status |
|---|---|
| [`src/pages/admin/MataKuliahPage.tsx`](src/pages/admin/MataKuliahPage.tsx) | LEGACY |
| [`src/pages/admin/KelasPage.tsx`](src/pages/admin/KelasPage.tsx) | LEGACY |
| [`src/pages/admin/KelasPageEnhanced.tsx`](src/pages/admin/KelasPageEnhanced.tsx) | PARTIAL |
| [`src/pages/admin/KelasPageSimple.tsx`](src/pages/admin/KelasPageSimple.tsx) | LEGACY |
| [`src/pages/admin/KelasMataKuliahPage.tsx`](src/pages/admin/KelasMataKuliahPage.tsx) | LEGACY |
| [`src/pages/admin/AcademicAssignmentPage.tsx`](src/pages/admin/AcademicAssignmentPage.tsx) | LEGACY |
| [`src/pages/admin/AssignmentManagementPage.tsx`](src/pages/admin/AssignmentManagementPage.tsx) | LEGACY |
| [`src/pages/admin/ManajemenAssignmentPage.tsx`](src/pages/admin/ManajemenAssignmentPage.tsx) | PARTIAL |

### Target area ini
- [ ] Struktur informasi akademik lebih mudah discan
- [ ] Workflow assignment kompleks dibagi menjadi steps/sections yang jelas
- [ ] Relasi kelas–mata kuliah–dosen divisualkan dengan badge, chips, dan summary blocks
- [ ] Form dan tabel panjang dipisah menjadi section yang lebih manusiawi

## 3.4 Admin Lab, Asset, dan Approval

| Halaman | Status |
|---|---|
| [`src/pages/admin/LaboratoriesPage.tsx`](src/pages/admin/LaboratoriesPage.tsx) | LEGACY |
| [`src/pages/admin/EquipmentsPage.tsx`](src/pages/admin/EquipmentsPage.tsx) | LEGACY |
| [`src/pages/admin/PeminjamanApprovalPage.tsx`](src/pages/admin/PeminjamanApprovalPage.tsx) | MOSTLY ALIGNED |

### Target area ini
- [ ] Inventory view lebih modern: card/list hybrid bila perlu
- [ ] Status alat dan peminjaman lebih tegas
- [ ] Approval flow tetap cepat, tetapi lebih informatif
- [ ] Empty/loading/error state dibakukan

## 3.5 Admin Communication (Aktif di Router)

| Halaman | Status | Catatan |
|---|---|---|
| [`src/pages/admin/AnnouncementsPage.tsx`](src/pages/admin/AnnouncementsPage.tsx) | MOSTLY ALIGNED | Dipakai untuk route [`/admin/announcements`](src/routes/index.tsx:243) dan alias [`/admin/notifikasi`](src/routes/index.tsx:267) |

### Target area ini
- [ ] Announcement/notifikasi admin harus readable dan ringkas
- [ ] List pengumuman perlu hierarchy yang jelas antara judul, waktu, status, dan aksi
- [ ] Form create/edit pengumuman harus konsisten dengan pola form modern role lain
- [ ] Alias route announcement dan notifikasi tidak boleh terasa seperti dua halaman berbeda

## 3.6 Admin Utility & Technical Pages (Tidak Aktif / Perlu Validasi Route)

| Halaman | Status | Catatan |
|---|---|---|
| [`src/pages/admin/AnalyticsPage.tsx`](src/pages/admin/AnalyticsPage.tsx) | BACKLOG | Import route dinonaktifkan di [`src/routes/index.tsx`](src/routes/index.tsx) |
| [`src/pages/admin/SyncManagementPage.tsx`](src/pages/admin/SyncManagementPage.tsx) | BACKLOG | Import route dinonaktifkan di [`src/routes/index.tsx`](src/routes/index.tsx) |
| [`src/pages/admin/SyncMonitoringPage.tsx`](src/pages/admin/SyncMonitoringPage.tsx) | BACKLOG | Belum termasuk fitur aktif admin yang harus diprioritaskan |
| [`src/pages/admin/CleanupPage.tsx`](src/pages/admin/CleanupPage.tsx) | BACKLOG | Belum termasuk fitur aktif admin yang harus diprioritaskan |

### Target area ini
- [ ] Halaman teknis tetap rapi, tidak terasa “mentah”
- [ ] Utility page memakai layout visual yang sama dengan halaman utama
- [ ] Implementasi hanya dilakukan setelah status route/fitur dipastikan aktif

---

## 👨‍🏫 FASE 4 — DOSEN ROLE

## 4.1 Dosen Dashboard & Profile

| Halaman | Status | Catatan |
|---|---|---|
| [`src/pages/dosen/DashboardPage.tsx`](src/pages/dosen/DashboardPage.tsx) | MOSTLY ALIGNED | Kaya data dan kuat secara UI, perlu penyederhanaan visual di area padat |
| [`src/pages/dosen/ProfilePage.tsx`](src/pages/dosen/ProfilePage.tsx) | LEGACY | Perlu dijadikan pasangan visual konsisten dengan admin/mahasiswa |

### Target area ini
- [x] Stats dashboard modern
- [ ] Summary aktivitas, alert, dan refresh state lebih rapi
- [ ] Panel realtime/subscription tidak membuat UI terasa berat
- [ ] Profile page dosen ikut pola profile lintas role

## 4.2 Dosen Academic Operations

| Halaman | Status |
|---|---|
| [`src/pages/dosen/JadwalPage.tsx`](src/pages/dosen/JadwalPage.tsx) | MOSTLY ALIGNED |
| [`src/pages/dosen/KehadiranPage.tsx`](src/pages/dosen/KehadiranPage.tsx) | LEGACY |
| [`src/pages/dosen/PenilaianPage.tsx`](src/pages/dosen/PenilaianPage.tsx) | LEGACY |
| [`src/pages/dosen/MateriPage.tsx`](src/pages/dosen/MateriPage.tsx) | LEGACY |
| [`src/pages/dosen/BankSoalPage.tsx`](src/pages/dosen/BankSoalPage.tsx) | LEGACY |
| [`src/pages/dosen/LogbookReviewPage.tsx`](src/pages/dosen/LogbookReviewPage.tsx) | MOSTLY ALIGNED |

### Target area ini
- [ ] Jadwal, kehadiran, penilaian, materi, dan bank soal memakai pola toolbar yang sama
- [ ] Tabel/list akademik lebih mudah discan
- [ ] Status akademik memakai badge semantic yang konsisten
- [ ] Logbook review menonjolkan readability, sticky summary, dan density yang terkontrol

## 4.3 Dosen Kuis System

| Halaman | Status |
|---|---|
| [`src/pages/dosen/kuis/KuisListPage.tsx`](src/pages/dosen/kuis/KuisListPage.tsx) | LEGACY |
| [`src/pages/dosen/kuis/KuisCreatePage.tsx`](src/pages/dosen/kuis/KuisCreatePage.tsx) | MOSTLY ALIGNED |
| [`src/pages/dosen/kuis/KuisBuilderPage.tsx`](src/pages/dosen/kuis/KuisBuilderPage.tsx) | LEGACY |
| [`src/pages/dosen/kuis/KuisEditPage.tsx`](src/pages/dosen/kuis/KuisEditPage.tsx) | LEGACY |
| [`src/pages/dosen/kuis/KuisResultsPage.tsx`](src/pages/dosen/kuis/KuisResultsPage.tsx) | MOSTLY ALIGNED |
| [`src/pages/dosen/kuis/AttemptDetailPage.tsx`](src/pages/dosen/kuis/AttemptDetailPage.tsx) | MOSTLY ALIGNED |

### Target area ini
- [ ] Kuis list harus mudah difilter dan dipindai
- [ ] Create/edit/builder memakai flow bertahap yang jelas
- [ ] Result analytics memakai chart theme yang seragam
- [ ] Attempt detail fokus pada jawaban, skor, status, dan readability

## 4.4 Dosen Peminjaman & Komunikasi

| Halaman | Status |
|---|---|
| [`src/pages/dosen/PeminjamanPage.tsx`](src/pages/dosen/PeminjamanPage.tsx) | MOSTLY ALIGNED |
| [`src/pages/dosen/PengumumanPage.tsx`](src/pages/dosen/PengumumanPage.tsx) | MOSTLY ALIGNED |

### Target area ini
- [ ] Status pinjam dan approval lebih tegas
- [ ] Pengumuman dosen konsisten dengan role lain
- [ ] Action state lebih jelas di mobile

---

## 🧪 FASE 5 — LABORAN ROLE

## 5.1 Laboran Dashboard & Profile

| Halaman | Status |
|---|---|
| [`src/pages/laboran/DashboardPage.tsx`](src/pages/laboran/DashboardPage.tsx) | MOSTLY ALIGNED |
| [`src/pages/laboran/ProfilePage.tsx`](src/pages/laboran/ProfilePage.tsx) | MOSTLY ALIGNED |

### Target area ini
- [x] Dashboard laboran sudah menjadi role paling matang
- [ ] Polishing akhir untuk penyamaan spacing, state, dan CTA dengan role lain
- [ ] Profile laboran dijadikan baseline visual untuk profile role lain bila cocok

## 5.2 Laboran Operasional Inti

| Halaman | Status |
|---|---|
| [`src/pages/laboran/InventarisPage.tsx`](src/pages/laboran/InventarisPage.tsx) | FULLY ALIGNED |
| [`src/pages/laboran/LaboratoriumPage.tsx`](src/pages/laboran/LaboratoriumPage.tsx) | FULLY ALIGNED |
| [`src/pages/laboran/JadwalApprovalPage.tsx`](src/pages/laboran/JadwalApprovalPage.tsx) | FULLY ALIGNED |
| [`src/pages/laboran/LaporanPage.tsx`](src/pages/laboran/LaporanPage.tsx) | FULLY ALIGNED |

### Target area ini
- [x] Jadikan laboran sebagai benchmark kualitas UI operasional
- [ ] Audit ulang detail hardcoded color dan dark mode
- [ ] Pastikan pola ini bisa direplikasi ke admin dan dosen

## 5.3 Laboran Peminjaman & Approval

| Halaman | Status |
|---|---|
| [`src/pages/laboran/PersetujuanPage.tsx`](src/pages/laboran/PersetujuanPage.tsx) | FULLY ALIGNED |
| [`src/pages/laboran/PeminjamanAktifPage.tsx`](src/pages/laboran/PeminjamanAktifPage.tsx) | MOSTLY ALIGNED |
| [`src/pages/laboran/ApprovalPage.tsx`](src/pages/laboran/ApprovalPage.tsx) | LEGACY |

### Target area ini
- [x] Approval flow laboran menjadi referensi visual untuk peminjaman role lain
- [ ] Progress state dan status transisi dibuat lebih eksplisit
- [ ] Halaman approval lama ditinggalkan atau diselaraskan total

## 5.4 Laboran Communication

| Halaman | Status |
|---|---|
| [`src/pages/laboran/PengumumanPage.tsx`](src/pages/laboran/PengumumanPage.tsx) | MOSTLY ALIGNED |

---

## 🎓 FASE 6 — MAHASISWA ROLE

## 6.1 Mahasiswa Dashboard & Profile

| Halaman | Status | Catatan |
|---|---|---|
| [`src/pages/mahasiswa/DashboardPage.tsx`](src/pages/mahasiswa/DashboardPage.tsx) | MOSTLY ALIGNED | Salah satu dashboard paling rapi secara hierarchy |
| [`src/pages/mahasiswa/ProfilePage.tsx`](src/pages/mahasiswa/ProfilePage.tsx) | LEGACY | Perlu dinaikkan minimal ke pola profile modern lintas role |

### Target area ini
- [x] Dashboard mahasiswa sudah menarik
- [ ] Card informasi harian dibuat lebih actionable
- [ ] Profile mahasiswa harus menjadi pasangan visual dari admin/dosen/laboran

## 6.2 Mahasiswa Pembelajaran Inti

| Halaman | Status |
|---|---|
| [`src/pages/mahasiswa/JadwalPage.tsx`](src/pages/mahasiswa/JadwalPage.tsx) | FULLY ALIGNED |
| [`src/pages/mahasiswa/MateriPage.tsx`](src/pages/mahasiswa/MateriPage.tsx) | FULLY ALIGNED |
| [`src/pages/mahasiswa/NilaiPage.tsx`](src/pages/mahasiswa/NilaiPage.tsx) | FULLY ALIGNED |
| [`src/pages/mahasiswa/PresensiPage.tsx`](src/pages/mahasiswa/PresensiPage.tsx) | FULLY ALIGNED |
| [`src/pages/mahasiswa/LogbookPage.tsx`](src/pages/mahasiswa/LogbookPage.tsx) | FULLY ALIGNED |
| [`src/pages/mahasiswa/ConflictsPage.tsx`](src/pages/mahasiswa/ConflictsPage.tsx) | MOSTLY ALIGNED |

### Target area ini
- [x] Jadwal, materi, nilai, presensi, logbook menjadi benchmark UI mahasiswa
- [ ] Conflict page harus punya warning UI paling kuat dan edukatif
- [ ] Pastikan seluruh learning pages konsisten di mobile

## 6.3 Mahasiswa Kuis System

| Halaman | Status |
|---|---|
| [`src/pages/mahasiswa/kuis/KuisListPage.tsx`](src/pages/mahasiswa/kuis/KuisListPage.tsx) | MOSTLY ALIGNED |
| [`src/pages/mahasiswa/kuis/KuisAttemptPage.tsx`](src/pages/mahasiswa/kuis/KuisAttemptPage.tsx) | LEGACY |
| [`src/pages/mahasiswa/kuis/KuisResultPage.tsx`](src/pages/mahasiswa/kuis/KuisResultPage.tsx) | LEGACY |

### Target area ini
- [ ] Attempt page wajib punya progress, timer clarity, dan reduced distraction
- [ ] Result page harus informatif tanpa terasa padat
- [ ] Quiz system mahasiswa dan dosen harus terasa satu ekosistem visual

## 6.4 Mahasiswa Communication & Offline

| Halaman | Status |
|---|---|
| [`src/pages/mahasiswa/PengumumanPage.tsx`](src/pages/mahasiswa/PengumumanPage.tsx) | MOSTLY ALIGNED |
| [`src/pages/mahasiswa/OfflineSyncPage.tsx`](src/pages/mahasiswa/OfflineSyncPage.tsx) | MOSTLY ALIGNED |

### Target area ini
- [ ] Pengumuman/notifikasi nyaman dibaca dan mudah dipindai
- [ ] Offline sync mahasiswa harus edukatif dan menenangkan

---

## 🔄 FASE 7 — SHARED & CROSS-ROLE EXPERIENCE

## 7.1 Shared Pages

| Halaman | Status | Catatan |
|---|---|---|
| [`src/pages/shared/OfflineSyncPage.tsx`](src/pages/shared/OfflineSyncPage.tsx) | PARTIAL | Sudah ada dan berfungsi, tetapi belum selevel polish dashboard modern |

### Target shared experience
- [ ] Offline sync lintas role harus terasa satu produk, bukan halaman utilitas terpisah
- [ ] Alias route tidak menimbulkan UI berbeda yang membingungkan
- [ ] Notifikasi/pengumuman lintas role memakai pola visual seragam

## 7.2 Route Alias dan Shared Coverage yang Harus Diperhatikan
Route berikut perlu diperlakukan sebagai satu keluarga UX:
- [ ] `/admin/notifikasi`
- [ ] `/dosen/notifikasi`
- [ ] `/mahasiswa/notifikasi`
- [ ] `/laboran/notifikasi`
- [ ] `/dosen/pengumuman`
- [ ] `/admin/offline-sync`
- [ ] `/dosen/offline-sync`
- [ ] `/laboran/offline-sync`
- [ ] `/mahasiswa/offline-sync`

---

## 🗺️ PETA FITUR BERDASARKAN ROUTER AKTUAL
Catatan penting: bagian ini mengikuti **router nyata** di [`src/routes/index.tsx`](src/routes/index.tsx). Bila berbeda dengan [`src/config/routes.config.ts`](src/config/routes.config.ts), maka router aktual menjadi acuan implementasi UI.

## Public/Auth
- [x] `/`
- [x] `/login`
- [x] `/register`
- [x] `/forgot-password`
- [x] `/403`
- [x] `/404`

## Admin
### Route admin aktif di router
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

### Backlog admin yang file-nya ada tetapi route aktifnya belum dipakai
- [ ] `/admin/analytics`
- [ ] `/admin/sync-management`

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
### Halaman admin aktif di router
- [x] MOSTLY ALIGNED — [`src/pages/admin/DashboardPage.tsx`](src/pages/admin/DashboardPage.tsx)
- [ ] LEGACY — [`src/pages/admin/UsersPage.tsx`](src/pages/admin/UsersPage.tsx)
- [ ] LEGACY — [`src/pages/admin/MataKuliahPage.tsx`](src/pages/admin/MataKuliahPage.tsx)
- [ ] PARTIAL — [`src/pages/admin/KelasPageEnhanced.tsx`](src/pages/admin/KelasPageEnhanced.tsx)
- [ ] LEGACY — [`src/pages/admin/KelasMataKuliahPage.tsx`](src/pages/admin/KelasMataKuliahPage.tsx)
- [ ] LEGACY — [`src/pages/admin/LaboratoriesPage.tsx`](src/pages/admin/LaboratoriesPage.tsx)
- [ ] LEGACY — [`src/pages/admin/EquipmentsPage.tsx`](src/pages/admin/EquipmentsPage.tsx)
- [x] MOSTLY ALIGNED — [`src/pages/admin/PeminjamanApprovalPage.tsx`](src/pages/admin/PeminjamanApprovalPage.tsx)
- [x] MOSTLY ALIGNED — [`src/pages/admin/ManajemenAssignmentPage.tsx`](src/pages/admin/ManajemenAssignmentPage.tsx)
- [x] MOSTLY ALIGNED — [`src/pages/admin/AnnouncementsPage.tsx`](src/pages/admin/AnnouncementsPage.tsx)
- [x] MOSTLY ALIGNED — [`src/pages/shared/OfflineSyncPage.tsx`](src/pages/shared/OfflineSyncPage.tsx) — dipakai untuk route admin offline sync

### Halaman admin ada di codebase tetapi bukan prioritas fitur aktif
- [ ] LEGACY — [`src/pages/admin/MahasiswaManagementPage.tsx`](src/pages/admin/MahasiswaManagementPage.tsx)
- [ ] LEGACY — [`src/pages/admin/RolesPage.tsx`](src/pages/admin/RolesPage.tsx)
- [ ] PARTIAL — [`src/pages/admin/RolesPage-ENHANCED.tsx`](src/pages/admin/RolesPage-ENHANCED.tsx)
- [ ] LEGACY — [`src/pages/admin/KelasPage.tsx`](src/pages/admin/KelasPage.tsx)
- [ ] LEGACY — [`src/pages/admin/KelasPageSimple.tsx`](src/pages/admin/KelasPageSimple.tsx)
- [ ] LEGACY — [`src/pages/admin/AcademicAssignmentPage.tsx`](src/pages/admin/AcademicAssignmentPage.tsx)
- [ ] LEGACY — [`src/pages/admin/AssignmentManagementPage.tsx`](src/pages/admin/AssignmentManagementPage.tsx)
- [ ] BACKLOG — [`src/pages/admin/AnalyticsPage.tsx`](src/pages/admin/AnalyticsPage.tsx)
- [ ] BACKLOG — [`src/pages/admin/SyncManagementPage.tsx`](src/pages/admin/SyncManagementPage.tsx)
- [ ] BACKLOG — [`src/pages/admin/SyncMonitoringPage.tsx`](src/pages/admin/SyncMonitoringPage.tsx)
- [ ] BACKLOG — [`src/pages/admin/CleanupPage.tsx`](src/pages/admin/CleanupPage.tsx)

## Dosen
- [x] MOSTLY ALIGNED — [`src/pages/dosen/DashboardPage.tsx`](src/pages/dosen/DashboardPage.tsx)
- [x] MOSTLY ALIGNED — [`src/pages/dosen/JadwalPage.tsx`](src/pages/dosen/JadwalPage.tsx)
- [ ] LEGACY — [`src/pages/dosen/KehadiranPage.tsx`](src/pages/dosen/KehadiranPage.tsx)
- [ ] LEGACY — [`src/pages/dosen/PenilaianPage.tsx`](src/pages/dosen/PenilaianPage.tsx)
- [ ] LEGACY — [`src/pages/dosen/MateriPage.tsx`](src/pages/dosen/MateriPage.tsx)
- [ ] LEGACY — [`src/pages/dosen/BankSoalPage.tsx`](src/pages/dosen/BankSoalPage.tsx)
- [x] MOSTLY ALIGNED — [`src/pages/dosen/LogbookReviewPage.tsx`](src/pages/dosen/LogbookReviewPage.tsx)
- [x] MOSTLY ALIGNED — [`src/pages/dosen/PeminjamanPage.tsx`](src/pages/dosen/PeminjamanPage.tsx)
- [x] MOSTLY ALIGNED — [`src/pages/dosen/PengumumanPage.tsx`](src/pages/dosen/PengumumanPage.tsx)
- [ ] LEGACY — [`src/pages/dosen/ProfilePage.tsx`](src/pages/dosen/ProfilePage.tsx)
- [ ] LEGACY — [`src/pages/dosen/kuis/KuisListPage.tsx`](src/pages/dosen/kuis/KuisListPage.tsx)
- [x] MOSTLY ALIGNED — [`src/pages/dosen/kuis/KuisCreatePage.tsx`](src/pages/dosen/kuis/KuisCreatePage.tsx)
- [ ] LEGACY — [`src/pages/dosen/kuis/KuisBuilderPage.tsx`](src/pages/dosen/kuis/KuisBuilderPage.tsx)
- [ ] LEGACY — [`src/pages/dosen/kuis/KuisEditPage.tsx`](src/pages/dosen/kuis/KuisEditPage.tsx)
- [x] MOSTLY ALIGNED — [`src/pages/dosen/kuis/KuisResultsPage.tsx`](src/pages/dosen/kuis/KuisResultsPage.tsx)
- [x] MOSTLY ALIGNED — [`src/pages/dosen/kuis/AttemptDetailPage.tsx`](src/pages/dosen/kuis/AttemptDetailPage.tsx)

## Laboran
- [x] MOSTLY ALIGNED — [`src/pages/laboran/DashboardPage.tsx`](src/pages/laboran/DashboardPage.tsx)
- [x] FULLY ALIGNED — [`src/pages/laboran/InventarisPage.tsx`](src/pages/laboran/InventarisPage.tsx)
- [x] FULLY ALIGNED — [`src/pages/laboran/JadwalApprovalPage.tsx`](src/pages/laboran/JadwalApprovalPage.tsx)
- [x] FULLY ALIGNED — [`src/pages/laboran/LaboratoriumPage.tsx`](src/pages/laboran/LaboratoriumPage.tsx)
- [x] FULLY ALIGNED — [`src/pages/laboran/LaporanPage.tsx`](src/pages/laboran/LaporanPage.tsx)
- [x] MOSTLY ALIGNED — [`src/pages/laboran/PeminjamanAktifPage.tsx`](src/pages/laboran/PeminjamanAktifPage.tsx)
- [x] MOSTLY ALIGNED — [`src/pages/laboran/PengumumanPage.tsx`](src/pages/laboran/PengumumanPage.tsx)
- [x] FULLY ALIGNED — [`src/pages/laboran/PersetujuanPage.tsx`](src/pages/laboran/PersetujuanPage.tsx)
- [x] MOSTLY ALIGNED — [`src/pages/laboran/ProfilePage.tsx`](src/pages/laboran/ProfilePage.tsx)
- [ ] LEGACY — [`src/pages/laboran/ApprovalPage.tsx`](src/pages/laboran/ApprovalPage.tsx)

## Mahasiswa
- [x] MOSTLY ALIGNED — [`src/pages/mahasiswa/DashboardPage.tsx`](src/pages/mahasiswa/DashboardPage.tsx)
- [x] FULLY ALIGNED — [`src/pages/mahasiswa/JadwalPage.tsx`](src/pages/mahasiswa/JadwalPage.tsx)
- [x] FULLY ALIGNED — [`src/pages/mahasiswa/LogbookPage.tsx`](src/pages/mahasiswa/LogbookPage.tsx)
- [x] FULLY ALIGNED — [`src/pages/mahasiswa/MateriPage.tsx`](src/pages/mahasiswa/MateriPage.tsx)
- [x] FULLY ALIGNED — [`src/pages/mahasiswa/NilaiPage.tsx`](src/pages/mahasiswa/NilaiPage.tsx)
- [x] FULLY ALIGNED — [`src/pages/mahasiswa/PresensiPage.tsx`](src/pages/mahasiswa/PresensiPage.tsx)
- [x] MOSTLY ALIGNED — [`src/pages/mahasiswa/ConflictsPage.tsx`](src/pages/mahasiswa/ConflictsPage.tsx)
- [x] MOSTLY ALIGNED — [`src/pages/mahasiswa/PengumumanPage.tsx`](src/pages/mahasiswa/PengumumanPage.tsx)
- [x] MOSTLY ALIGNED — [`src/pages/mahasiswa/OfflineSyncPage.tsx`](src/pages/mahasiswa/OfflineSyncPage.tsx)
- [ ] LEGACY — [`src/pages/mahasiswa/ProfilePage.tsx`](src/pages/mahasiswa/ProfilePage.tsx)
- [x] MOSTLY ALIGNED — [`src/pages/mahasiswa/kuis/KuisListPage.tsx`](src/pages/mahasiswa/kuis/KuisListPage.tsx)
- [ ] LEGACY — [`src/pages/mahasiswa/kuis/KuisAttemptPage.tsx`](src/pages/mahasiswa/kuis/KuisAttemptPage.tsx)
- [ ] LEGACY — [`src/pages/mahasiswa/kuis/KuisResultPage.tsx`](src/pages/mahasiswa/kuis/KuisResultPage.tsx)

## Public
- [x] MOSTLY ALIGNED — [`src/pages/public/HomePage.tsx`](src/pages/public/HomePage.tsx)
- [x] MOSTLY ALIGNED — [`src/pages/public/NotFoundPage.tsx`](src/pages/public/NotFoundPage.tsx)
- [ ] PARTIAL — [`src/pages/public/OfflinePage.tsx`](src/pages/public/OfflinePage.tsx)
- [x] MOSTLY ALIGNED — [`src/pages/public/UnauthorizedPage.tsx`](src/pages/public/UnauthorizedPage.tsx)

## Auth
- [x] MOSTLY ALIGNED — [`src/pages/auth/LoginPage.tsx`](src/pages/auth/LoginPage.tsx)
- [x] MOSTLY ALIGNED — [`src/pages/auth/RegisterPage.tsx`](src/pages/auth/RegisterPage.tsx)
- [ ] PARTIAL — [`src/pages/auth/ForgotPasswordPage.tsx`](src/pages/auth/ForgotPasswordPage.tsx)

## Shared
- [ ] PARTIAL — [`src/pages/shared/OfflineSyncPage.tsx`](src/pages/shared/OfflineSyncPage.tsx)

---

## 📊 PRIORITAS IMPLEMENTASI SELANJUTNYA

## PRIORITAS 1 — Konsistensi Visual Paling Terlihat
- [ ] Samakan profile pages semua role:
  - [`src/pages/admin/ProfilePage.tsx`](src/pages/admin/ProfilePage.tsx)
  - [`src/pages/dosen/ProfilePage.tsx`](src/pages/dosen/ProfilePage.tsx)
  - [`src/pages/mahasiswa/ProfilePage.tsx`](src/pages/mahasiswa/ProfilePage.tsx)
- [ ] Rapikan tokenisasi halaman auth dan public agar tidak terlalu bergantung pada warna hardcoded
- [ ] Standarkan page header, action bar, alert, dan section spacing lintas role

## PRIORITAS 2 — Area dengan Dampak UX Besar
- [ ] Admin management pages:
  - [`src/pages/admin/UsersPage.tsx`](src/pages/admin/UsersPage.tsx)
  - [`src/pages/admin/LaboratoriesPage.tsx`](src/pages/admin/LaboratoriesPage.tsx)
  - [`src/pages/admin/EquipmentsPage.tsx`](src/pages/admin/EquipmentsPage.tsx)
  - [`src/pages/admin/MataKuliahPage.tsx`](src/pages/admin/MataKuliahPage.tsx)
  - [`src/pages/admin/KelasPageEnhanced.tsx`](src/pages/admin/KelasPageEnhanced.tsx)
- [ ] Dosen academic operation pages:
  - [`src/pages/dosen/KehadiranPage.tsx`](src/pages/dosen/KehadiranPage.tsx)
  - [`src/pages/dosen/PenilaianPage.tsx`](src/pages/dosen/PenilaianPage.tsx)
  - [`src/pages/dosen/MateriPage.tsx`](src/pages/dosen/MateriPage.tsx)
  - [`src/pages/dosen/BankSoalPage.tsx`](src/pages/dosen/BankSoalPage.tsx)
- [x] Mahasiswa communication + offline pages:
  - [`src/pages/mahasiswa/PengumumanPage.tsx`](src/pages/mahasiswa/PengumumanPage.tsx)
  - [`src/pages/mahasiswa/OfflineSyncPage.tsx`](src/pages/mahasiswa/OfflineSyncPage.tsx)
  - [`src/pages/shared/OfflineSyncPage.tsx`](src/pages/shared/OfflineSyncPage.tsx)

## PRIORITAS 3 — Ekosistem Kuis yang Harus Seragam
- [ ] Dosen quiz system:
  - [`src/pages/dosen/kuis/KuisListPage.tsx`](src/pages/dosen/kuis/KuisListPage.tsx)
  - [x] [`src/pages/dosen/kuis/KuisCreatePage.tsx`](src/pages/dosen/kuis/KuisCreatePage.tsx)
  - [`src/pages/dosen/kuis/KuisBuilderPage.tsx`](src/pages/dosen/kuis/KuisBuilderPage.tsx)
  - [`src/pages/dosen/kuis/KuisEditPage.tsx`](src/pages/dosen/kuis/KuisEditPage.tsx)
  - [x] [`src/pages/dosen/kuis/KuisResultsPage.tsx`](src/pages/dosen/kuis/KuisResultsPage.tsx)
  - [x] [`src/pages/dosen/kuis/AttemptDetailPage.tsx`](src/pages/dosen/kuis/AttemptDetailPage.tsx)
- [ ] Mahasiswa quiz system:
  - [`src/pages/mahasiswa/kuis/KuisAttemptPage.tsx`](src/pages/mahasiswa/kuis/KuisAttemptPage.tsx)
  - [`src/pages/mahasiswa/kuis/KuisResultPage.tsx`](src/pages/mahasiswa/kuis/KuisResultPage.tsx)

## PRIORITAS 4 — Backlog yang Perlu Validasi Route Dulu
- [ ] [`src/pages/admin/AnalyticsPage.tsx`](src/pages/admin/AnalyticsPage.tsx)
- [ ] [`src/pages/admin/SyncManagementPage.tsx`](src/pages/admin/SyncManagementPage.tsx)
- [ ] [`src/pages/admin/SyncMonitoringPage.tsx`](src/pages/admin/SyncMonitoringPage.tsx)
- [ ] [`src/pages/admin/CleanupPage.tsx`](src/pages/admin/CleanupPage.tsx)

---

## ✅ CHECKLIST VALIDASI SETELAH TIAP FASE
- [ ] Semua route utama di [`src/routes/index.tsx`](src/routes/index.tsx) tetap bisa dibuka
- [ ] Tidak ada regresi pada komponen dasar di [`src/components/ui/index.ts`](src/components/ui/index.ts)
- [ ] Responsive aman pada mobile, tablet, dan desktop
- [ ] Dark mode aman dan nyaman dibaca
- [ ] Empty, loading, error, success, warning, offline state konsisten
- [ ] CTA primer dan sekunder konsisten lintas role
- [ ] Tidak ada halaman yang terlihat “asing” dari sistem visual utama
- [ ] Alias route shared/notifikasi/offline tidak menimbulkan UI yang membingungkan

---

## 📝 Catatan Penting
1. Acuan implementasi UI adalah **router aktual** di [`src/routes/index.tsx`](src/routes/index.tsx), bukan asumsi lama di dokumen lain.
2. [`src/config/routes.config.ts`](src/config/routes.config.ts) masih perlu sinkronisasi nomenklatur pada beberapa route seperti `profil/profile` dan parameter route kuis.
3. Fondasi visual aplikasi sudah kuat di [`src/index.css`](src/index.css) dan [`src/components/ui/index.ts`](src/components/ui/index.ts), tetapi banyak halaman masih perlu tokenisasi dan penyamaan detail.
4. Role **laboran** saat ini adalah benchmark kualitas UI operasional paling matang.
5. Dashboard **mahasiswa** dan **public landing page** sudah menarik, tetapi masih perlu perapian agar sepenuhnya konsisten dengan design system.
6. Halaman profile lintas role, admin management pages, dan seluruh ekosistem kuis adalah area paling penting untuk membuat aplikasi terasa benar-benar menarik dan konsisten.
7. Setelah dokumen ini, implementasi sebaiknya mengikuti urutan: **profile lintas role → admin management → dosen academic pages → kuis system → shared/offline/notifikasi**.
