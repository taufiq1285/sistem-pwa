/**
 * Main Application Router - WITH CODE-SPLITTING
 *
 * CHANGES:
 * ✅ REFACTORED: All page imports converted to React.lazy() for code-splitting
 * ✅ ADDED: Suspense wrapper with PageLoader fallback
 * ✅ KEPT: All existing routes and role guards intact
 */

import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { RoleGuard } from "@/components/common/RoleGuard";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageLoader } from "@/components/common/PageLoader";
import { ROUTES } from "@/config/routes.config";

// =============================================================================
// LAZY-LOADED PAGES (Code-Splitting)
// =============================================================================

// Auth Pages
const LoginPage = lazy(() =>
  import("@/pages/auth/LoginPage").then((m) => ({ default: m.LoginPage })),
);
const RegisterPage = lazy(() =>
  import("@/pages/auth/RegisterPage").then((m) => ({
    default: m.RegisterPage,
  })),
);
const ForgotPasswordPage = lazy(() =>
  import("@/pages/auth/ForgotPasswordPage").then((m) => ({
    default: m.ForgotPasswordPage,
  })),
);

// Public Pages
const HomePage = lazy(() =>
  import("@/pages/public/HomePage").then((m) => ({ default: m.HomePage })),
);
const NotFoundPage = lazy(() =>
  import("@/pages/public/NotFoundPage").then((m) => ({
    default: m.NotFoundPage,
  })),
);
const UnauthorizedPage = lazy(() =>
  import("@/pages/public/UnauthorizedPage").then((m) => ({
    default: m.UnauthorizedPage,
  })),
);

// Admin Pages
const AdminDashboard = lazy(() =>
  import("@/pages/admin/DashboardPage").then((m) => ({
    default: m.DashboardPage,
  })),
);
const MataKuliahPage = lazy(() => import("@/pages/admin/MataKuliahPage"));
const KelasPageEnhanced = lazy(
  () => import("@/pages/admin/KelasPageEnhanced"),
);
const AdminUsersPage = lazy(() => import("@/pages/admin/UsersPage"));
const AdminLaboratoriesPage = lazy(
  () => import("@/pages/admin/LaboratoriesPage"),
);
const AdminEquipmentsPage = lazy(
  () => import("@/pages/admin/EquipmentsPage"),
);
const AdminAnnouncementsPage = lazy(
  () => import("@/pages/admin/AnnouncementsPage"),
);
const PeminjamanApprovalPage = lazy(
  () => import("@/pages/admin/PeminjamanApprovalPage"),
);
const AdminProfilePage = lazy(() => import("@/pages/admin/ProfilePage"));
const ManajemenAssignmentPage = lazy(
  () => import("@/pages/admin/ManajemenAssignmentPage"),
);
const KelasMataKuliahPage = lazy(
  () => import("@/pages/admin/KelasMataKuliahPage"),
);

// Dosen Pages
const DosenDashboard = lazy(() =>
  import("@/pages/dosen/DashboardPage").then((m) => ({
    default: m.DashboardPage,
  })),
);
const DosenJadwalPage = lazy(() => import("@/pages/dosen/JadwalPage"));
const KuisListPage = lazy(() => import("@/pages/dosen/kuis/KuisListPage"));
const KuisCreatePage = lazy(() => import("@/pages/dosen/kuis/KuisCreatePage"));
const KuisEditPage = lazy(() => import("@/pages/dosen/kuis/KuisEditPage"));
const KuisResultsPage = lazy(
  () => import("@/pages/dosen/kuis/KuisResultsPage"),
);
const AttemptDetailPage = lazy(
  () => import("@/pages/dosen/kuis/AttemptDetailPage"),
);
const BankSoalPage = lazy(() => import("@/pages/dosen/BankSoalPage"));
const DosenMateriPage = lazy(() => import("@/pages/dosen/MateriPage"));
const DosenPenilaianPage = lazy(() => import("@/pages/dosen/PenilaianPage"));
const DosenPeminjamanPage = lazy(
  () => import("@/pages/dosen/PeminjamanPage"),
);
const DosenKehadiranPage = lazy(() => import("@/pages/dosen/KehadiranPage"));
const DosenPengumumanPage = lazy(
  () => import("@/pages/dosen/PengumumanPage"),
);
const DosenProfilePage = lazy(() => import("@/pages/dosen/ProfilePage"));
const DosenLogbookReviewPage = lazy(
  () => import("@/pages/dosen/LogbookReviewPage"),
);

// Mahasiswa Pages
const MahasiswaDashboard = lazy(() =>
  import("@/pages/mahasiswa/DashboardPage").then((m) => ({
    default: m.DashboardPage,
  })),
);
const MahasiswaJadwalPage = lazy(
  () => import("@/pages/mahasiswa/JadwalPage"),
);
const MahasiswaLogbookPage = lazy(
  () => import("@/pages/mahasiswa/LogbookPage"),
);
const KuisAttemptPage = lazy(
  () => import("@/pages/mahasiswa/kuis/KuisAttemptPage"),
);
const MahasiswaKuisListPage = lazy(
  () => import("@/pages/mahasiswa/kuis/KuisListPage"),
);
const KuisResultPage = lazy(
  () => import("@/pages/mahasiswa/kuis/KuisResultPage"),
);
const MahasiswaMateriPage = lazy(
  () => import("@/pages/mahasiswa/MateriPage"),
);
const MahasiswaNilaiPage = lazy(
  () => import("@/pages/mahasiswa/NilaiPage"),
);
const MahasiswaPresensiPage = lazy(
  () => import("@/pages/mahasiswa/PresensiPage"),
);
const MahasiswaPengumumanPage = lazy(
  () => import("@/pages/mahasiswa/PengumumanPage"),
);
const MahasiswaProfilePage = lazy(
  () => import("@/pages/mahasiswa/ProfilePage"),
);
const OfflineSyncPage = lazy(
  () => import("@/pages/mahasiswa/OfflineSyncPage"),
);
const SharedOfflineSyncPage = lazy(
  () => import("@/pages/shared/OfflineSyncPage"),
);

// Laboran Pages
const LaboranDashboard = lazy(() =>
  import("@/pages/laboran/DashboardPage").then((m) => ({
    default: m.DashboardPage,
  })),
);
const LaboranInventarisPage = lazy(
  () => import("@/pages/laboran/InventarisPage"),
);
const LaboranPersetujuanPage = lazy(
  () => import("@/pages/laboran/PersetujuanPage"),
);
const LaboranPeminjamanAktifPage = lazy(
  () => import("@/pages/laboran/PeminjamanAktifPage"),
);
const LaboranLaboratoriumPage = lazy(
  () => import("@/pages/laboran/LaboratoriumPage"),
);
const LaboranJadwalApprovalPage = lazy(
  () => import("@/pages/laboran/JadwalApprovalPage"),
);
const LaboranLaporanPage = lazy(
  () => import("@/pages/laboran/LaporanPage"),
);
const LaboranPengumumanPage = lazy(
  () => import("@/pages/laboran/PengumumanPage"),
);
const LaboranProfilePage = lazy(
  () => import("@/pages/laboran/ProfilePage"),
);

// =============================================================================
// APP ROUTER
// =============================================================================

export function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ================================================================== */}
        {/* PUBLIC ROUTES (No authentication required) */}
        {/* ================================================================== */}
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
        <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />
        <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />

        {/* ================================================================== */}
        {/* ADMIN ROUTES (Require admin role) */}
        {/* ================================================================== */}
        <Route
          path={ROUTES.ADMIN.ROOT}
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["admin"]}>
                <Navigate to={ROUTES.ADMIN.DASHBOARD} replace />
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN.DASHBOARD}
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["admin"]}>
                <AppLayout>
                  <AdminDashboard />
                </AppLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* Mata Kuliah Management */}
        <Route
          path="/admin/mata-kuliah"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["admin"]}>
                <AppLayout>
                  <MataKuliahPage />
                </AppLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* Kelas Mata Kuliah Assignment */}
        <Route
          path="/admin/kelas-mata-kuliah"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["admin"]}>
                <AppLayout>
                  <KelasMataKuliahPage />
                </AppLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* Kelas Management */}
        <Route
          path="/admin/kelas"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["admin"]}>
                <AppLayout>
                  <KelasPageEnhanced />
                </AppLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* Admin - Users */}
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["admin"]}>
                <AppLayout>
                  <AdminUsersPage />
                </AppLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/laboratories"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["admin"]}>
                <AppLayout>
                  <AdminLaboratoriesPage />
                </AppLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/equipments"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["admin"]}>
                <AppLayout>
                  <AdminEquipmentsPage />
                </AppLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/peminjaman"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["admin"]}>
                <AppLayout>
                  <PeminjamanApprovalPage />
                </AppLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/peminjaman-aktif"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["admin"]}>
                <AppLayout>
                  <LaboranPeminjamanAktifPage />
                </AppLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/announcements"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["admin"]}>
                <AppLayout>
                  <AdminAnnouncementsPage />
                </AppLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/manajemen-assignment"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["admin"]}>
                <AppLayout>
                  <ManajemenAssignmentPage />
                </AppLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/notifikasi"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["admin"]}>
                <AppLayout>
                  <AdminAnnouncementsPage />
                </AppLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* ✅ Admin Profile Route */}
        <Route
          path="/admin/profil"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["admin"]}>
                <AppLayout>
                  <AdminProfilePage />
                </AppLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* Admin - Offline Sync */}
        <Route
          path="/admin/offline-sync"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["admin"]}>
                <AppLayout>
                  <SharedOfflineSyncPage />
                </AppLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* ================================================================== */}
        {/* DOSEN ROUTES */}
        {/* ================================================================== */}

        {/* Root redirect */}
        <Route
          path={ROUTES.DOSEN.ROOT}
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["dosen"]}>
                <Navigate to={ROUTES.DOSEN.DASHBOARD} replace />
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* Dashboard */}
        <Route
          path={ROUTES.DOSEN.DASHBOARD}
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["dosen"]}>
                <AppLayout>
                  <DosenDashboard />
                </AppLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* Jadwal Praktikum */}
        <Route
          path="/dosen/jadwal"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["dosen"]}>
                <AppLayout>
                  <DosenJadwalPage />
                </AppLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* ================================================================== */}
        {/* DOSEN KUIS ROUTES - COMPLETE QUIZ SYSTEM ✅ */}
        {/* ================================================================== */}

        {/* Kuis List */}
        <Route
          path="/dosen/kuis"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["dosen"]}>
                <AppLayout>
                  <KuisListPage />
                </AppLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* Kuis Create */}
        <Route
          path="/dosen/kuis/create"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["dosen"]}>
                <AppLayout>
                  <KuisCreatePage />
                </AppLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* Kuis Edit */}
        <Route
          path="/dosen/kuis/:kuisId/edit"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["dosen"]}>
                <AppLayout>
                  <KuisEditPage />
                </AppLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* Kuis Results */}
        <Route
          path="/dosen/kuis/:kuisId/results"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["dosen"]}>
                <AppLayout>
                  <KuisResultsPage />
                </AppLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* Kuis Attempt Detail */}
        <Route
          path="/dosen/kuis/:kuisId/attempt/:attemptId"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["dosen"]}>
                <AppLayout>
                  <AttemptDetailPage />
                </AppLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* Bank Soal */}
        <Route
          path="/dosen/bank-soal"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["dosen"]}>
                <AppLayout>
                  <BankSoalPage />
                </AppLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* Materi */}
        <Route
          path="/dosen/materi"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["dosen"]}>
                <AppLayout>
                  <DosenMateriPage />
                </AppLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* Penilaian */}
        <Route
          path="/dosen/penilaian"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["dosen"]}>
                <AppLayout>
                  <DosenPenilaianPage />
                </AppLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* Logbook Review */}
        <Route
          path="/dosen/logbook-review"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["dosen"]}>
                <AppLayout>
                  <DosenLogbookReviewPage />
                </AppLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* Dosen - Peminjaman */}
        <Route
          path="/dosen/peminjaman"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["dosen"]}>
                <AppLayout>
                  <DosenPeminjamanPage />
                </AppLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* Dosen - Kehadiran */}
        <Route
          path="/dosen/kehadiran"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["dosen"]}>
                <AppLayout>
                  <DosenKehadiranPage />
                </AppLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* Dosen - Notifikasi */}
        <Route
          path="/dosen/notifikasi"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["dosen"]}>
                <AppLayout>
                  <DosenPengumumanPage />
                </AppLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* Dosen - Profil */}
        <Route
          path="/dosen/profil"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["dosen"]}>
                <AppLayout>
                  <DosenProfilePage />
                </AppLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* Dosen - Pengumuman */}
        <Route
          path="/dosen/pengumuman"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["dosen"]}>
                <AppLayout>
                  <DosenPengumumanPage />
                </AppLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* Dosen - Offline Sync */}
        <Route
          path="/dosen/offline-sync"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["dosen"]}>
                <AppLayout>
                  <SharedOfflineSyncPage />
                </AppLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* ================================================================== */}
        {/* MAHASISWA ROUTES */}
        {/* ================================================================== */}

        {/* Root redirect */}
        <Route
          path={ROUTES.MAHASISWA.ROOT}
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["mahasiswa"]}>
                <Navigate to={ROUTES.MAHASISWA.DASHBOARD} replace />
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* Dashboard */}
        <Route
          path={ROUTES.MAHASISWA.DASHBOARD}
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["mahasiswa"]}>
                <AppLayout>
                  <MahasiswaDashboard />
                </AppLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* Jadwal Praktikum */}
        <Route
          path="/mahasiswa/jadwal"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["mahasiswa"]}>
                <AppLayout>
                  <MahasiswaJadwalPage />
                </AppLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* Logbook */}
        <Route
          path="/mahasiswa/logbook"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["mahasiswa"]}>
                <AppLayout>
                  <MahasiswaLogbookPage />
                </AppLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* Kuis Attempt */}
        <Route
          path="/mahasiswa/kuis/:kuisId/attempt/:attemptId?"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["mahasiswa"]}>
                <AppLayout>
                  <KuisAttemptPage />
                </AppLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* Kuis Result */}
        <Route
          path="/mahasiswa/kuis/:kuisId/result/:attemptId"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["mahasiswa"]}>
                <AppLayout>
                  <KuisResultPage />
                </AppLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* Kuis List */}
        <Route
          path="/mahasiswa/kuis"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["mahasiswa"]}>
                <AppLayout>
                  <MahasiswaKuisListPage />
                </AppLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* Materi */}
        <Route
          path="/mahasiswa/materi"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["mahasiswa"]}>
                <AppLayout>
                  <MahasiswaMateriPage />
                </AppLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* Nilai */}
        <Route
          path="/mahasiswa/nilai"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["mahasiswa"]}>
                <AppLayout>
                  <MahasiswaNilaiPage />
                </AppLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* Mahasiswa - Presensi */}
        <Route
          path="/mahasiswa/presensi"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["mahasiswa"]}>
                <AppLayout>
                  <MahasiswaPresensiPage />
                </AppLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* Mahasiswa - Notifikasi */}
        <Route
          path="/mahasiswa/notifikasi"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["mahasiswa"]}>
                <AppLayout>
                  <MahasiswaPengumumanPage />
                </AppLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* ✅ Mahasiswa Profile Route */}
        <Route
          path="/mahasiswa/profil"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["mahasiswa"]}>
                <AppLayout>
                  <MahasiswaProfilePage />
                </AppLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* ✅ Mahasiswa Offline Sync Route */}
        <Route
          path="/mahasiswa/offline-sync"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["mahasiswa"]}>
                <AppLayout>
                  <OfflineSyncPage />
                </AppLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* ================================================================== */}
        {/* LABORAN ROUTES */}
        {/* ================================================================== */}

        {/* Root redirect */}
        <Route
          path={ROUTES.LABORAN.ROOT}
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["laboran"]}>
                <Navigate to={ROUTES.LABORAN.DASHBOARD} replace />
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* Dashboard */}
        <Route
          path={ROUTES.LABORAN.DASHBOARD}
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["laboran"]}>
                <AppLayout>
                  <LaboranDashboard />
                </AppLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* Laboran - Inventaris */}
        <Route
          path="/laboran/inventaris"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["laboran"]}>
                <AppLayout>
                  <LaboranInventarisPage />
                </AppLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* Laboran - Persetujuan */}
        <Route
          path="/laboran/persetujuan"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["laboran"]}>
                <AppLayout>
                  <LaboranPersetujuanPage />
                </AppLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/laboran/peminjaman-aktif"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["laboran"]}>
                <AppLayout>
                  <LaboranPeminjamanAktifPage />
                </AppLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* Laboran - Laboratorium */}
        <Route
          path="/laboran/laboratorium"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["laboran"]}>
                <AppLayout>
                  <LaboranLaboratoriumPage />
                </AppLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* Laboran - Kelola Jadwal */}
        <Route
          path="/laboran/jadwal"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["laboran"]}>
                <AppLayout>
                  <LaboranJadwalApprovalPage />
                </AppLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* Laboran - Laporan */}
        <Route
          path="/laboran/laporan"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["laboran"]}>
                <AppLayout>
                  <LaboranLaporanPage />
                </AppLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* Laboran - Notifikasi */}
        <Route
          path="/laboran/notifikasi"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["laboran"]}>
                <AppLayout>
                  <LaboranPengumumanPage />
                </AppLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* Laboran - Profil */}
        <Route
          path="/laboran/profil"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["laboran"]}>
                <AppLayout>
                  <LaboranProfilePage />
                </AppLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* Laboran - Offline Sync */}
        <Route
          path="/laboran/offline-sync"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["laboran"]}>
                <AppLayout>
                  <SharedOfflineSyncPage />
                </AppLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* ================================================================== */}
        {/* FALLBACK ROUTES */}
        {/* ================================================================== */}

        {/* Home route - Landing page */}
        <Route path={ROUTES.HOME} element={<HomePage />} />

        {/* Catch-all route - 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
