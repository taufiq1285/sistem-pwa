/**
 * Main Application Router - WITH CODE-SPLITTING
 *
 * CHANGES:
 * ✅ REFACTORED: All page imports converted to React.lazy() for code-splitting
 * ✅ ADDED: Suspense wrapper with PageLoader fallback
 * ✅ KEPT: All existing routes and role guards intact
 */

import { lazy, Suspense, useEffect, useMemo } from "react";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Navigate,
  Route,
  RouterProvider,
  useParams,
  useLocation,
  Outlet,
} from "react-router-dom";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { RoleGuard } from "@/components/common/RoleGuard";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageLoader } from "@/components/common/PageLoader";
import { RouteChunkBoundary } from "@/components/common/RouteChunkBoundary";
import { ROUTES } from "@/config/routes.config";
import { useAuth } from "@/lib/hooks/useAuth";
import type { UserRole } from "@/types/auth.types";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/common/PageTransition";

// =============================================================================
// LAZY-LOADED PAGES (Code-Splitting)
// =============================================================================

const routeModuleImporters = {
  login: () =>
    import("@/pages/auth/LoginPage").then((m) => ({ default: m.LoginPage })),
  register: () =>
    import("@/pages/auth/RegisterPage").then((m) => ({
      default: m.RegisterPage,
    })),
  forgotPassword: () =>
    import("@/pages/auth/ForgotPasswordPage").then((m) => ({
      default: m.ForgotPasswordPage,
    })),
  resetPassword: () =>
    import("@/pages/auth/ResetPasswordPage").then((m) => ({
      default: m.ResetPasswordPage,
    })),
  home: () =>
    import("@/pages/public/HomePage").then((m) => ({ default: m.HomePage })),
  notFound: () =>
    import("@/pages/public/NotFoundPage").then((m) => ({
      default: m.NotFoundPage,
    })),
  unauthorized: () =>
    import("@/pages/public/UnauthorizedPage").then((m) => ({
      default: m.UnauthorizedPage,
    })),
  adminDashboard: () =>
    import("@/pages/admin/DashboardPage").then((m) => ({
      default: m.DashboardPage,
    })),
  mataKuliah: () => import("@/pages/admin/MataKuliahPage"),
  kelasEnhanced: () => import("@/pages/admin/KelasPageEnhanced"),
  adminUsers: () => import("@/pages/admin/UsersPage"),
  adminLaboratories: () => import("@/pages/admin/LaboratoriesPage"),
  adminEquipments: () => import("@/pages/admin/EquipmentsPage"),
  adminAnnouncements: () => import("@/pages/admin/AnnouncementsPage"),
  adminNotifications: () => import("@/pages/admin/NotificationCenterPage"),
  peminjamanApproval: () => import("@/pages/admin/PeminjamanApprovalPage"),
  adminProfile: () => import("@/pages/admin/ProfilePage"),
  manajemenAssignment: () => import("@/pages/admin/ManajemenAssignmentPage"),
  kelasMataKuliah: () => import("@/pages/admin/KelasMataKuliahPage"),
  dosenDashboard: () =>
    import("@/pages/dosen/DashboardPage").then((m) => ({
      default: m.DashboardPage,
    })),
  dosenJadwal: () => import("@/pages/dosen/JadwalPage"),
  dosenKuisList: () => import("@/pages/dosen/kuis/KuisListPage"),
  dosenKuisCreate: () => import("@/pages/dosen/kuis/KuisCreatePage"),
  dosenKuisEdit: () => import("@/pages/dosen/kuis/KuisEditPage"),
  dosenKuisResults: () => import("@/pages/dosen/kuis/KuisResultsPage"),
  dosenAttemptDetail: () => import("@/pages/dosen/kuis/AttemptDetailPage"),
  dosenBankSoal: () => import("@/pages/dosen/BankSoalPage"),
  dosenMateri: () => import("@/pages/dosen/MateriPage"),
  dosenPenilaian: () => import("@/pages/dosen/PenilaianPage"),
  dosenPeminjaman: () => import("@/pages/dosen/PeminjamanPage"),
  dosenKehadiran: () => import("@/pages/dosen/KehadiranPage"),
  dosenPengumuman: () => import("@/pages/dosen/PengumumanPage"),
  dosenProfile: () => import("@/pages/dosen/ProfilePage"),
  dosenLogbookReview: () => import("@/pages/dosen/LogbookReviewPage"),
  mahasiswaDashboard: () =>
    import("@/pages/mahasiswa/DashboardPage").then((m) => ({
      default: m.DashboardPage,
    })),
  mahasiswaJadwal: () => import("@/pages/mahasiswa/JadwalPage"),
  mahasiswaLogbook: () => import("@/pages/mahasiswa/LogbookPage"),
  mahasiswaKuisAttempt: () => import("@/pages/mahasiswa/kuis/KuisAttemptPage"),
  mahasiswaKuisList: () => import("@/pages/mahasiswa/kuis/KuisListPage"),
  mahasiswaKuisResult: () => import("@/pages/mahasiswa/kuis/KuisResultPage"),
  mahasiswaMateri: () => import("@/pages/mahasiswa/MateriPage"),
  mahasiswaNilai: () => import("@/pages/mahasiswa/NilaiPage"),
  mahasiswaPresensi: () => import("@/pages/mahasiswa/PresensiPage"),
  mahasiswaPengumuman: () => import("@/pages/mahasiswa/PengumumanPage"),
  mahasiswaProfile: () => import("@/pages/mahasiswa/ProfilePage"),
  mahasiswaOfflineSync: () => import("@/pages/mahasiswa/OfflineSyncPage"),
  sharedOfflineSync: () => import("@/pages/shared/OfflineSyncPage"),
  laboranDashboard: () =>
    import("@/pages/laboran/DashboardPage").then((m) => ({
      default: m.DashboardPage,
    })),
  laboranInventaris: () => import("@/pages/laboran/InventarisPage"),
  laboranPersetujuan: () => import("@/pages/laboran/PersetujuanPage"),
  laboranPeminjamanAktif: () => import("@/pages/laboran/PeminjamanAktifPage"),
  laboranLaboratorium: () => import("@/pages/laboran/LaboratoriumPage"),
  laboranJadwalApproval: () => import("@/pages/laboran/JadwalApprovalPage"),
  laboranLaporan: () => import("@/pages/laboran/LaporanPage"),
  laboranPengumuman: () => import("@/pages/laboran/PengumumanPage"),
  laboranProfile: () => import("@/pages/laboran/ProfilePage"),
} as const;

const roleDashboardWarmup: Record<
  UserRole,
  readonly (() => Promise<unknown>)[]
> = {
  admin: [routeModuleImporters.adminDashboard],
  dosen: [routeModuleImporters.dosenDashboard],
  mahasiswa: [routeModuleImporters.mahasiswaDashboard],
  laboran: [routeModuleImporters.laboranDashboard],
};

const roleSecondaryRouteWarmup: Record<
  UserRole,
  readonly (() => Promise<unknown>)[]
> = {
  admin: [
    routeModuleImporters.mataKuliah,
    routeModuleImporters.kelasEnhanced,
    routeModuleImporters.adminUsers,
    routeModuleImporters.adminLaboratories,
    routeModuleImporters.adminEquipments,
    routeModuleImporters.peminjamanApproval,
    routeModuleImporters.laboranPeminjamanAktif,
    routeModuleImporters.adminAnnouncements,
    routeModuleImporters.manajemenAssignment,
    routeModuleImporters.adminProfile,
    routeModuleImporters.sharedOfflineSync,
    routeModuleImporters.kelasMataKuliah,
  ],
  dosen: [
    routeModuleImporters.dosenJadwal,
    routeModuleImporters.dosenKuisList,
    routeModuleImporters.dosenKuisCreate,
    routeModuleImporters.dosenKuisEdit,
    routeModuleImporters.dosenKuisResults,
    routeModuleImporters.dosenAttemptDetail,
    routeModuleImporters.dosenBankSoal,
    routeModuleImporters.dosenMateri,
    routeModuleImporters.dosenPenilaian,
    routeModuleImporters.dosenPeminjaman,
    routeModuleImporters.dosenKehadiran,
    routeModuleImporters.dosenPengumuman,
    routeModuleImporters.dosenProfile,
    routeModuleImporters.dosenLogbookReview,
    routeModuleImporters.sharedOfflineSync,
  ],
  mahasiswa: [
    routeModuleImporters.mahasiswaJadwal,
    routeModuleImporters.mahasiswaLogbook,
    routeModuleImporters.mahasiswaKuisAttempt,
    routeModuleImporters.mahasiswaKuisList,
    routeModuleImporters.mahasiswaKuisResult,
    routeModuleImporters.mahasiswaMateri,
    routeModuleImporters.mahasiswaNilai,
    routeModuleImporters.mahasiswaPresensi,
    routeModuleImporters.mahasiswaPengumuman,
    routeModuleImporters.mahasiswaProfile,
    routeModuleImporters.mahasiswaOfflineSync,
  ],
  laboran: [
    routeModuleImporters.laboranInventaris,
    routeModuleImporters.laboranPersetujuan,
    routeModuleImporters.laboranPeminjamanAktif,
    routeModuleImporters.laboranLaboratorium,
    routeModuleImporters.laboranJadwalApproval,
    routeModuleImporters.laboranLaporan,
    routeModuleImporters.laboranPengumuman,
    routeModuleImporters.laboranProfile,
    routeModuleImporters.sharedOfflineSync,
  ],
};

type IdleCallbackHandle = number;
type IdleCallback = (deadline: {
  didTimeout: boolean;
  timeRemaining: () => number;
}) => void;

type WindowWithIdleCallback = Window & {
  requestIdleCallback?: (
    callback: IdleCallback,
    options?: { timeout?: number },
  ) => IdleCallbackHandle;
  cancelIdleCallback?: (handle: IdleCallbackHandle) => void;
};

function warmRouteModules(
  importers: readonly (() => Promise<unknown>)[],
  options: { delayMs?: number; idleTimeoutMs?: number } = {},
) {
  const { delayMs = 1200, idleTimeoutMs = 5000 } = options;
  const windowWithIdleCallback = window as WindowWithIdleCallback;
  let cancelled = false;
  let idleHandle: IdleCallbackHandle | null = null;

  const runWarmup = () => {
    if (cancelled) {
      return;
    }

    void Promise.allSettled(importers.map((load) => load()));
  };

  const timeoutHandle = window.setTimeout(() => {
    if (typeof windowWithIdleCallback.requestIdleCallback === "function") {
      idleHandle = windowWithIdleCallback.requestIdleCallback(
        () => {
          runWarmup();
        },
        { timeout: idleTimeoutMs },
      );
      return;
    }

    runWarmup();
  }, delayMs);

  return () => {
    cancelled = true;
    window.clearTimeout(timeoutHandle);
    if (idleHandle !== null) {
      windowWithIdleCallback.cancelIdleCallback?.(idleHandle);
    }
  };
}

// Auth Pages
const LoginPage = lazy(routeModuleImporters.login);
const RegisterPage = lazy(routeModuleImporters.register);
const ForgotPasswordPage = lazy(routeModuleImporters.forgotPassword);
const ResetPasswordPage = lazy(routeModuleImporters.resetPassword);

// Public Pages
const HomePage = lazy(routeModuleImporters.home);
const NotFoundPage = lazy(routeModuleImporters.notFound);
const UnauthorizedPage = lazy(routeModuleImporters.unauthorized);

// Admin Pages
const AdminDashboard = lazy(() =>
  import("@/pages/admin/DashboardPage").then((m) => ({
    default: m.DashboardPage,
  })),
);
const MataKuliahPage = lazy(() => import("@/pages/admin/MataKuliahPage"));
const KelasPageEnhanced = lazy(() => import("@/pages/admin/KelasPageEnhanced"));
const AdminUsersPage = lazy(() => import("@/pages/admin/UsersPage"));
const AdminLaboratoriesPage = lazy(
  () => import("@/pages/admin/LaboratoriesPage"),
);
const AdminEquipmentsPage = lazy(() => import("@/pages/admin/EquipmentsPage"));
const AdminAnnouncementsPage = lazy(
  () => import("@/pages/admin/AnnouncementsPage"),
);
const AdminNotificationCenterPage = lazy(
  () => import("@/pages/admin/NotificationCenterPage"),
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
const DosenPeminjamanPage = lazy(() => import("@/pages/dosen/PeminjamanPage"));
const DosenKehadiranPage = lazy(() => import("@/pages/dosen/KehadiranPage"));
const DosenPengumumanPage = lazy(() => import("@/pages/dosen/PengumumanPage"));
const DosenProfilePage = lazy(() => import("@/pages/dosen/ProfilePage"));

function LegacyDosenAttemptRedirect() {
  const { kuisId, attemptId } = useParams<{
    kuisId: string;
    attemptId: string;
  }>();

  if (!kuisId || !attemptId) {
    return <Navigate to="/dosen/kuis" replace />;
  }

  return (
    <Navigate
      to={`/dosen/kuis/${kuisId}/results?attempt=${attemptId}`}
      replace
    />
  );
}
const DosenLogbookReviewPage = lazy(
  () => import("@/pages/dosen/LogbookReviewPage"),
);

// Mahasiswa Pages
const MahasiswaDashboard = lazy(() =>
  import("@/pages/mahasiswa/DashboardPage").then((m) => ({
    default: m.DashboardPage,
  })),
);
const MahasiswaJadwalPage = lazy(() => import("@/pages/mahasiswa/JadwalPage"));
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
const MahasiswaMateriPage = lazy(() => import("@/pages/mahasiswa/MateriPage"));
const MahasiswaNilaiPage = lazy(() => import("@/pages/mahasiswa/NilaiPage"));
const MahasiswaPresensiPage = lazy(
  () => import("@/pages/mahasiswa/PresensiPage"),
);
const MahasiswaPengumumanPage = lazy(
  () => import("@/pages/mahasiswa/PengumumanPage"),
);
const MahasiswaProfilePage = lazy(
  () => import("@/pages/mahasiswa/ProfilePage"),
);
const OfflineSyncPage = lazy(() => import("@/pages/mahasiswa/OfflineSyncPage"));
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
const LaboranLaporanPage = lazy(() => import("@/pages/laboran/LaporanPage"));
const LaboranPengumumanPage = lazy(
  () => import("@/pages/laboran/PengumumanPage"),
);
const LaboranProfilePage = lazy(() => import("@/pages/laboran/ProfilePage"));

function routeHandle(breadcrumb: string): { breadcrumb: string } {
  return { breadcrumb };
}

function LayoutTransition() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <PageTransition key={location.pathname}>
        <Outlet />
      </PageTransition>
    </AnimatePresence>
  );
}

// =============================================================================
// APP ROUTER
// =============================================================================

export function AppRouter() {
  const { user, initialized } = useAuth();

  useEffect(() => {
    if (!initialized) {
      return;
    }

    const cleanupTasks: Array<(() => void) | undefined> = [];
    if (user?.role) {
      cleanupTasks.push(
        warmRouteModules(roleDashboardWarmup[user.role], {
          delayMs: 1000,
          idleTimeoutMs: 4000,
        }),
      );
      cleanupTasks.push(
        warmRouteModules(roleSecondaryRouteWarmup[user.role], {
          delayMs: 9000,
          idleTimeoutMs: 12000,
        }),
      );
    }

    return () => {
      cleanupTasks.forEach((cleanup) => cleanup?.());
    };
  }, [initialized, user?.role]);

  const router = useMemo(
    () =>
      createBrowserRouter(
        createRoutesFromElements(
          <Route element={<LayoutTransition />}>
            {/* ================================================================== */}
            {/* PUBLIC ROUTES (No authentication required) */}
            {/* ================================================================== */}
            <Route
              path={ROUTES.LOGIN}
              element={<LoginPage />}
              handle={routeHandle("Login")}
            />
            <Route
              path={ROUTES.REGISTER}
              element={<RegisterPage />}
              handle={routeHandle("Register")}
            />
            <Route
              path={ROUTES.FORGOT_PASSWORD}
              handle={routeHandle("Forgot Password")}
              element={<ForgotPasswordPage />}
            />
            <Route
              path={ROUTES.RESET_PASSWORD}
              element={<ResetPasswordPage />}
              handle={routeHandle("Reset Password")}
            />
            <Route
              path={ROUTES.UNAUTHORIZED}
              element={<UnauthorizedPage />}
              handle={routeHandle("Unauthorized")}
            />
            <Route
              path={ROUTES.NOT_FOUND}
              element={<NotFoundPage />}
              handle={routeHandle("Not Found")}
            />

            {/* ================================================================== */}
            {/* ADMIN ROUTES (Require admin role) */}
            {/* ================================================================== */}
            <Route
              path={ROUTES.ADMIN.ROOT}
              handle={routeHandle("Admin")}
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
              handle={routeHandle("Dashboard Admin")}
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
              handle={routeHandle("Mata Kuliah")}
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
              handle={routeHandle("Assignment Mata Kuliah")}
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
              handle={routeHandle("Kelas")}
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
              handle={routeHandle("Manajemen Pengguna")}
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
              handle={routeHandle("Laboratorium")}
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
              handle={routeHandle("Peralatan")}
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
              handle={routeHandle("Persetujuan Peminjaman")}
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
              handle={routeHandle("Peminjaman Aktif")}
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
              handle={routeHandle("Pengumuman")}
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
              handle={routeHandle("Manajemen Assignment")}
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
              handle={routeHandle("Notifikasi")}
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={["admin"]}>
                    <AppLayout>
                      <AdminNotificationCenterPage />
                    </AppLayout>
                  </RoleGuard>
                </ProtectedRoute>
              }
            />

            {/* ✅ Admin Profile Route */}
            <Route
              path="/admin/profil"
              handle={routeHandle("Profil Saya")}
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
              handle={routeHandle("Sinkronisasi Offline")}
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
              handle={routeHandle("Dosen")}
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
              handle={routeHandle("Dashboard Dosen")}
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
              path={ROUTES.DOSEN.JADWAL}
              handle={routeHandle("Jadwal Praktikum")}
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
              path={ROUTES.DOSEN.KUIS.LIST}
              handle={routeHandle("Tugas Praktikum")}
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
              handle={routeHandle("Buat Kuis")}
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
              handle={routeHandle("Edit Kuis")}
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
              handle={routeHandle("Hasil Kuis")}
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
              handle={routeHandle("Detail Attempt")}
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={["dosen"]}>
                    <AppLayout>
                      <LegacyDosenAttemptRedirect />
                    </AppLayout>
                  </RoleGuard>
                </ProtectedRoute>
              }
            />

            {/* Bank Soal */}
            <Route
              path={ROUTES.DOSEN.BANK_SOAL}
              handle={routeHandle("Bank Soal")}
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
              path={ROUTES.DOSEN.MATERI}
              handle={routeHandle("Materi")}
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
              path={ROUTES.DOSEN.PENILAIAN}
              handle={routeHandle("Penilaian")}
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
              path={ROUTES.DOSEN.LOGBOOK_REVIEW}
              handle={routeHandle("Review Logbook")}
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
              path={ROUTES.DOSEN.PEMINJAMAN}
              handle={routeHandle("Peminjaman")}
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
              path={ROUTES.DOSEN.KEHADIRAN}
              handle={routeHandle("Kehadiran")}
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
              path={ROUTES.DOSEN.NOTIFIKASI}
              handle={routeHandle("Notifikasi")}
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
              path={ROUTES.DOSEN.PROFILE}
              handle={routeHandle("Profil Saya")}
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
              path={ROUTES.DOSEN.PENGUMUMAN}
              handle={routeHandle("Pengumuman")}
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
              path={ROUTES.DOSEN.OFFLINE_SYNC}
              handle={routeHandle("Sinkronisasi Offline")}
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
              handle={routeHandle("Mahasiswa")}
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
              handle={routeHandle("Dashboard Mahasiswa")}
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
              handle={routeHandle("Jadwal Praktikum")}
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
              handle={routeHandle("Logbook Digital")}
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
              handle={routeHandle("Kerjakan Kuis")}
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
              handle={routeHandle("Hasil Kuis")}
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
              handle={routeHandle("Tugas Praktikum")}
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
              handle={routeHandle("Materi")}
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
              handle={routeHandle("Nilai")}
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
              handle={routeHandle("Presensi")}
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
              handle={routeHandle("Notifikasi")}
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
              handle={routeHandle("Profil Saya")}
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
              handle={routeHandle("Sinkronisasi Offline")}
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
              handle={routeHandle("Laboran")}
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
              handle={routeHandle("Dashboard Laboran")}
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
              path={ROUTES.LABORAN.INVENTARIS}
              handle={routeHandle("Inventaris")}
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

            {/* Laboran - Peminjaman Alat */}
            <Route
              path={ROUTES.LABORAN.PEMINJAMAN}
              handle={routeHandle("Peminjaman Alat")}
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
            <Route
              path={ROUTES.LABORAN.PERSETUJUAN}
              handle={routeHandle("Persetujuan")}
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
              handle={routeHandle("Peminjaman Aktif")}
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
              path={ROUTES.LABORAN.LABORATORIUM}
              handle={routeHandle("Laboratorium")}
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
              path={ROUTES.LABORAN.JADWAL}
              handle={routeHandle("Kelola Jadwal")}
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
              path={ROUTES.LABORAN.LAPORAN}
              handle={routeHandle("Laporan")}
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
              path={ROUTES.LABORAN.NOTIFIKASI}
              handle={routeHandle("Notifikasi")}
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
              path={ROUTES.LABORAN.PROFILE}
              handle={routeHandle("Profil Saya")}
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
              path={ROUTES.LABORAN.OFFLINE_SYNC}
              handle={routeHandle("Sinkronisasi Offline")}
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
            <Route
              path={ROUTES.HOME}
              element={<HomePage />}
              handle={routeHandle("Beranda")}
            />

            {/* Catch-all route - 404 */}
            <Route
              path="*"
              element={<NotFoundPage />}
              handle={routeHandle("Not Found")}
            />
          </Route>,
        ),
      ),
    [],
  );

  return (
    <RouteChunkBoundary>
      <Suspense fallback={<PageLoader />}>
        <RouterProvider router={router} />
      </Suspense>
    </RouteChunkBoundary>
  );
}
