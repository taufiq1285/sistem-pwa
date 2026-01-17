/**
 * Main Application Router - COMPLETE WITH KUIS ROUTES
 *
 * CHANGES:
 * ✅ ADDED: Complete Kuis/Quiz system routes (Dosen & Mahasiswa)
 * ✅ KEPT: All other existing routes
 * ✅ All TypeScript errors resolved
 */

import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { RoleGuard } from "@/components/common/RoleGuard";
import { AppLayout } from "@/components/layout/AppLayout";
import { ROUTES } from "@/config/routes.config";

// Auth Pages
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage";

// Public Pages
import { NotFoundPage } from "@/pages/public/NotFoundPage";
import { UnauthorizedPage } from "@/pages/public/UnauthorizedPage";

// Admin Pages
import { DashboardPage as AdminDashboard } from "@/pages/admin/DashboardPage";
import MataKuliahPage from "@/pages/admin/MataKuliahPage";
import KelasPageEnhanced from "@/pages/admin/KelasPageEnhanced"; // ✅ ENHANCED: With Kelola Mahasiswa feature
import AdminUsersPage from "@/pages/admin/UsersPage";
import AdminLaboratoriesPage from "@/pages/admin/LaboratoriesPage";
import AdminEquipmentsPage from "@/pages/admin/EquipmentsPage";
import AdminAnnouncementsPage from "@/pages/admin/AnnouncementsPage";
// ❌ DISABLED: Analytics & Sync tidak dalam scope proposal penelitian
// import AdminAnalyticsPage from "@/pages/admin/AnalyticsPage";
// import AdminSyncManagementPage from "@/pages/admin/SyncManagementPage";
import PeminjamanApprovalPage from "@/pages/admin/PeminjamanApprovalPage";
import AdminProfilePage from "@/pages/admin/ProfilePage"; // ✅ NEW: Admin profile page
import ManajemenAssignmentPage from "@/pages/admin/ManajemenAssignmentPage"; // ✅ NEW: Unified assignment & jadwal management
import KelasMataKuliahPage from "@/pages/admin/KelasMataKuliahPage"; // ✅ NEW: Admin kelas-mata_kuliah assignment

// Dosen Pages
import { DashboardPage as DosenDashboard } from "@/pages/dosen/DashboardPage";
import DosenJadwalPage from "@/pages/dosen/JadwalPage";

// Dosen Kuis Pages - NEW! ✅
import KuisListPage from "@/pages/dosen/kuis/KuisListPage";
import KuisCreatePage from "@/pages/dosen/kuis/KuisCreatePage";
import KuisEditPage from "@/pages/dosen/kuis/KuisEditPage";
import KuisResultsPage from "@/pages/dosen/kuis/KuisResultsPage";
import AttemptDetailPage from "@/pages/dosen/kuis/AttemptDetailPage";

// Dosen Bank Soal - NEW! ✅
import BankSoalPage from "@/pages/dosen/BankSoalPage";

// Dosen Materi Page - NEW! ✅
import DosenMateriPage from "@/pages/dosen/MateriPage";

// Dosen Penilaian Page - NEW! ✅
import DosenPenilaianPage from "@/pages/dosen/PenilaianPage";
import DosenPeminjamanPage from "@/pages/dosen/PeminjamanPage";

// Dosen Kehadiran Page - NEW! ✅
import DosenKehadiranPage from "@/pages/dosen/KehadiranPage";
import DosenPengumumanPage from "@/pages/dosen/PengumumanPage";
import DosenProfilePage from "@/pages/dosen/ProfilePage";

// Mahasiswa Pages
import { DashboardPage as MahasiswaDashboard } from "@/pages/mahasiswa/DashboardPage";
import MahasiswaJadwalPage from "@/pages/mahasiswa/JadwalPage";

// Mahasiswa Kuis Pages - NEW! ✅
import KuisAttemptPage from "@/pages/mahasiswa/kuis/KuisAttemptPage";
import MahasiswaKuisListPage from "@/pages/mahasiswa/kuis/KuisListPage";
import KuisResultPage from "@/pages/mahasiswa/kuis/KuisResultPage";

// Mahasiswa Materi Page - NEW! ✅
import MahasiswaMateriPage from "@/pages/mahasiswa/MateriPage";

// Mahasiswa Nilai Page - NEW! ✅
import MahasiswaNilaiPage from "@/pages/mahasiswa/NilaiPage";
import MahasiswaPresensiPage from "@/pages/mahasiswa/PresensiPage";
import MahasiswaPengumumanPage from "@/pages/mahasiswa/PengumumanPage";
import MahasiswaProfilePage from "@/pages/mahasiswa/ProfilePage"; // ✅ NEW: Mahasiswa profile page

// Laboran Pages
import { DashboardPage as LaboranDashboard } from "@/pages/laboran/DashboardPage";
import LaboranInventarisPage from "@/pages/laboran/InventarisPage";
import LaboranPersetujuanPage from "@/pages/laboran/PersetujuanPage";
import LaboranPeminjamanAktifPage from "@/pages/laboran/PeminjamanAktifPage";
import LaboranLaboratoriumPage from "@/pages/laboran/LaboratoriumPage";
import LaboranJadwalApprovalPage from "@/pages/laboran/JadwalApprovalPage";
import LaboranLaporanPage from "@/pages/laboran/LaporanPage";
import LaboranPengumumanPage from "@/pages/laboran/PengumumanPage";
import LaboranProfilePage from "@/pages/laboran/ProfilePage";

export function AppRouter() {
  return (
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
      {/* ❌ DISABLED: Analytics route - tidak dalam scope proposal */}
      {/* <Route
        path="/admin/analytics"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={["admin"]}>
              <AppLayout>
                <AdminAnalyticsPage />
              </AppLayout>
            </RoleGuard>
          </ProtectedRoute>
        }
      /> */}
      {/* ❌ DISABLED: Sync Management route - tidak dalam scope proposal */}
      {/* <Route
        path="/admin/sync-management"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={["admin"]}>
              <AppLayout>
                <AdminSyncManagementPage />
              </AppLayout>
            </RoleGuard>
          </ProtectedRoute>
        }
      /> */}

      {/* ✅ NEW: Admin Profile Route */}
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

      {/* Kuis List - View all quizzes */}
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

      {/* Kuis Create - Build new quiz */}
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

      {/* Kuis Edit - Edit existing quiz */}
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

      {/* Kuis Results - View analytics & student scores */}
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

      {/* Kuis Attempt Detail - View individual student's answers */}
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

      {/* ================================================================== */}
      {/* DOSEN BANK SOAL ROUTES - QUESTION BANK ✅ */}
      {/* ================================================================== */}

      {/* Bank Soal - Manage reusable questions */}
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

      {/* ================================================================== */}
      {/* DOSEN MATERI ROUTES - LEARNING MATERIALS ✅ */}
      {/* ================================================================== */}

      {/* Materi List - Manage learning materials */}
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

      {/* ================================================================== */}
      {/* DOSEN PENILAIAN ROUTES - GRADING SYSTEM ✅ */}
      {/* ================================================================== */}

      {/* Penilaian - Manage student grades */}
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

      {/* ================================================================== */}
      {/* MAHASISWA KUIS ROUTES - QUIZ ATTEMPT ✅ */}
      {/* ================================================================== */}

      {/* Kuis Attempt - Take quiz */}
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

      {/* Kuis Result - View quiz results */}
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

      {/* Kuis List - Available quizzes */}
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

      {/* ================================================================== */}
      {/* MAHASISWA MATERI ROUTES - LEARNING MATERIALS ✅ */}
      {/* ================================================================== */}

      {/* Materi List - View and download learning materials */}
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

      {/* ================================================================== */}
      {/* MAHASISWA NILAI ROUTES - VIEW GRADES ✅ */}
      {/* ================================================================== */}

      {/* Nilai - View academic grades */}
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

      {/* ✅ NEW: Mahasiswa Profile Route */}
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

      {/* TODO: Add more mahasiswa routes as they are implemented
      <Route path="/mahasiswa/offline-sync" element={...} />
      */}

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

      {/* Laboran - Kelola Jadwal (Hybrid Approval Workflow) */}
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

      {/* ================================================================== */}
      {/* FALLBACK ROUTES */}
      {/* ================================================================== */}

      {/* Home route - redirect to login */}
      <Route
        path={ROUTES.HOME}
        element={<Navigate to={ROUTES.LOGIN} replace />}
      />

      {/* Catch-all route - 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
