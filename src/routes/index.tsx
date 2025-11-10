/**
 * Main Application Router - COMPLETE WITH KUIS ROUTES
 * 
 * CHANGES:
 * ✅ ADDED: Complete Kuis/Quiz system routes (Dosen & Mahasiswa)
 * ✅ KEPT: All other existing routes
 * ✅ All TypeScript errors resolved
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { RoleGuard } from '@/components/common/RoleGuard';
import { AppLayout } from '@/components/layout/AppLayout';
import { ROUTES } from '@/config/routes.config';

// Auth Pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';

// Public Pages
import { NotFoundPage } from '@/pages/public/NotFoundPage';
import { UnauthorizedPage } from '@/pages/public/UnauthorizedPage';

// Admin Pages
import { DashboardPage as AdminDashboard } from '@/pages/admin/DashboardPage';

// Dosen Pages
import { DashboardPage as DosenDashboard } from '@/pages/dosen/DashboardPage';
import DosenJadwalPage from '@/pages/dosen/JadwalPage';

// Dosen Kuis Pages - NEW! ✅
import KuisListPage from '@/pages/dosen/kuis/KuisListPage';
import KuisCreatePage from '@/pages/dosen/kuis/KuisCreatePage';
import KuisEditPage from '@/pages/dosen/kuis/KuisEditPage';
import KuisResultsPage from '@/pages/dosen/kuis/KuisResultsPage';
import AttemptDetailPage from '@/pages/dosen/kuis/AttemptDetailPage';

// Mahasiswa Pages
import { DashboardPage as MahasiswaDashboard } from '@/pages/mahasiswa/DashboardPage';
import MahasiswaJadwalPage from '@/pages/mahasiswa/JadwalPage';

// Mahasiswa Kuis Pages - NEW! ✅
import KuisAttemptPage from '@/pages/mahasiswa/kuis/KuisAttemptPage';

// Laboran Pages
import { DashboardPage as LaboranDashboard } from '@/pages/laboran/DashboardPage';

export function AppRouter() {
  return (
    <Routes>
      {/* ================================================================== */}
      {/* PUBLIC ROUTES (No authentication required) */}
      {/* ================================================================== */}
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />
      <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
      <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />
      <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />

      {/* ================================================================== */}
      {/* ADMIN ROUTES (Require admin role) */}
      {/* ================================================================== */}
      <Route
        path={ROUTES.ADMIN.ROOT}
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={['admin']}>
              <Navigate to={ROUTES.ADMIN.DASHBOARD} replace />
            </RoleGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN.DASHBOARD}
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={['admin']}>
              <AppLayout>
                <AdminDashboard />
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
            <RoleGuard allowedRoles={['dosen']}>
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
            <RoleGuard allowedRoles={['dosen']}>
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
            <RoleGuard allowedRoles={['dosen']}>
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
            <RoleGuard allowedRoles={['dosen']}>
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
            <RoleGuard allowedRoles={['dosen']}>
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
            <RoleGuard allowedRoles={['dosen']}>
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
            <RoleGuard allowedRoles={['dosen']}>
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
            <RoleGuard allowedRoles={['dosen']}>
              <AppLayout>
                <AttemptDetailPage />
              </AppLayout>
            </RoleGuard>
          </ProtectedRoute>
        }
      />

      {/* TODO: Add more dosen routes as they are implemented
      <Route path="/dosen/peminjaman" element={...} />
      <Route path="/dosen/mahasiswa" element={...} />
      <Route path="/dosen/materi" element={...} />
      <Route path="/dosen/penilaian" element={...} />
      */}

      {/* ================================================================== */}
      {/* MAHASISWA ROUTES */}
      {/* ================================================================== */}

      {/* Root redirect */}
      <Route
        path={ROUTES.MAHASISWA.ROOT}
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={['mahasiswa']}>
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
            <RoleGuard allowedRoles={['mahasiswa']}>
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
            <RoleGuard allowedRoles={['mahasiswa']}>
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
            <RoleGuard allowedRoles={['mahasiswa']}>
              <AppLayout>
                <KuisAttemptPage />
              </AppLayout>
            </RoleGuard>
          </ProtectedRoute>
        }
      />

      {/* TODO: Add more mahasiswa routes as they are implemented
      <Route path="/mahasiswa/kuis" element={...} /> (list available quizzes)
      <Route path="/mahasiswa/materi" element={...} />
      <Route path="/mahasiswa/nilai" element={...} />
      <Route path="/mahasiswa/pengumuman" element={...} />
      <Route path="/mahasiswa/profil" element={...} />
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
            <RoleGuard allowedRoles={['laboran']}>
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
            <RoleGuard allowedRoles={['laboran']}>
              <AppLayout>
                <LaboranDashboard />
              </AppLayout>
            </RoleGuard>
          </ProtectedRoute>
        }
      />

      {/* ================================================================== */}
      {/* FALLBACK ROUTES */}
      {/* ================================================================== */}

      {/* Home route - redirect to login */}
      <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.LOGIN} replace />} />

      {/* Catch-all route - 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}