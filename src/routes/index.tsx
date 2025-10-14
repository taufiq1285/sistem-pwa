/**
 * Main Application Router
 * Defines all routes with proper protection and role guards
 * 
 * Route Structure:
 * - Public routes (login, register, 404, etc.)
 * - Protected routes (require authentication)
 * - Role-specific routes (require specific roles)
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { RoleGuard } from '@/components/common/RoleGuard';
import { ROUTES } from '@/config/routes.config';

// Auth Pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';

// Public Pages
import { NotFoundPage } from '@/pages/public/NotFoundPage';
import { UnauthorizedPage } from '@/pages/public/UnauthorizedPage';//

// Admin Pages
import { DashboardPage as AdminDashboard } from '@/pages/admin/DashboardPage';

// Dosen Pages
import { DashboardPage as DosenDashboard } from '@/pages/dosen/DashboardPage';

// Mahasiswa Pages
import { DashboardPage as MahasiswaDashboard } from '@/pages/mahasiswa/DashboardPage';

// Laboran Pages
import { DashboardPage as LaboranDashboard } from '@/pages/laboran/DashboardPage';

export function AppRouter() {
  return (
    <Routes>
      {/* ============================================================ */}
      {/* PUBLIC ROUTES (No authentication required) */}
      {/* ============================================================ */}
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />
      <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
      <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />
      <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />

      {/* ============================================================ */}
      {/* ADMIN ROUTES (Require admin role) */}
      {/* ============================================================ */}
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
              <AdminDashboard />
            </RoleGuard>
          </ProtectedRoute>
        }
      />
      
      {/* Add more admin routes here as needed */}

      {/* ============================================================ */}
      {/* DOSEN ROUTES (Require dosen role) */}
      {/* ============================================================ */}
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
      <Route
        path={ROUTES.DOSEN.DASHBOARD}
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={['dosen']}>
              <DosenDashboard />
            </RoleGuard>
          </ProtectedRoute>
        }
      />
      
      {/* Add more dosen routes here as needed */}

      {/* ============================================================ */}
      {/* MAHASISWA ROUTES (Require mahasiswa role) */}
      {/* ============================================================ */}
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
      <Route
        path={ROUTES.MAHASISWA.DASHBOARD}
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={['mahasiswa']}>
              <MahasiswaDashboard />
            </RoleGuard>
          </ProtectedRoute>
        }
      />
      
      {/* Add more mahasiswa routes here as needed */}

      {/* ============================================================ */}
      {/* LABORAN ROUTES (Require laboran role) */}
      {/* ============================================================ */}
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
      <Route
        path={ROUTES.LABORAN.DASHBOARD}
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={['laboran']}>
              <LaboranDashboard />
            </RoleGuard>
          </ProtectedRoute>
        }
      />
      
      {/* Add more laboran routes here as needed */}

      {/* ============================================================ */}
      {/* FALLBACK ROUTES */}
      {/* ============================================================ */}
      
      {/* Home route - redirect to login */}
      <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.LOGIN} replace />} />
      
      {/* Catch-all route - 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}