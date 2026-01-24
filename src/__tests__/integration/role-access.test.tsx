/**
 * Role-based Access Control Integration Tests - CORE LOGIC
 * Tests for RBAC authorization across all roles
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { RoleGuard } from "@/components/common/RoleGuard";
import { ROUTES } from "@/config/routes.config";
import type { AuthUser } from "@/types/auth.types";

// Mock useAuth hook
const mockUseAuth = vi.fn();
vi.mock("@/lib/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

// Test components for different roles
const MahasiswaPage = () => <div>Mahasiswa Dashboard</div>;
const DosenPage = () => <div>Dosen Dashboard</div>;
const LaboranPage = () => <div>Laboran Dashboard</div>;
const AdminPage = () => <div>Admin Dashboard</div>;
const LoginPage = () => <div>Login Page</div>;
const UnauthorizedPage = () => <div>Unauthorized - 403</div>;

describe("Role-based Access Control - CORE LOGIC", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Mahasiswa Role Access", () => {
    const mahasiswaUser: AuthUser = {
      id: "mhs-123",
      email: "mahasiswa@test.com",
      full_name: "Test Mahasiswa",
      role: "mahasiswa",
      is_active: true,
      avatar_url: null,
      last_seen_at: null,
      metadata: null,
      updated_at: null,
      mahasiswa: {
        id: "mhs-profile-123",
        nim: "BD2321001",
        program_studi: "Kebidanan",
        angkatan: 2023,
        semester: 1,
      },
      created_at: new Date().toISOString(),
    };

    it("should allow mahasiswa to access mahasiswa routes", async () => {
      mockUseAuth.mockReturnValue({
        user: mahasiswaUser,
        isAuthenticated: true,
        loading: false,
        initialized: true,
      });

      render(
        <MemoryRouter initialEntries={["/mahasiswa/dashboard"]}>
          <Routes>
            <Route
              path="/mahasiswa/dashboard"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={["mahasiswa"]}>
                    <MahasiswaPage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByText("Mahasiswa Dashboard")).toBeInTheDocument();
      });
    });

    it("should prevent mahasiswa from accessing dosen routes", async () => {
      mockUseAuth.mockReturnValue({
        user: mahasiswaUser,
        isAuthenticated: true,
        loading: false,
        initialized: true,
      });

      render(
        <MemoryRouter initialEntries={["/dosen/dashboard"]}>
          <Routes>
            <Route
              path="/dosen/dashboard"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={["dosen"]}>
                    <DosenPage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />
          </Routes>
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByText("Unauthorized - 403")).toBeInTheDocument();
      });
    });

    it("should prevent mahasiswa from accessing admin routes", async () => {
      mockUseAuth.mockReturnValue({
        user: mahasiswaUser,
        isAuthenticated: true,
        loading: false,
        initialized: true,
      });

      render(
        <MemoryRouter initialEntries={["/admin/dashboard"]}>
          <Routes>
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={["admin"]}>
                    <AdminPage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />
          </Routes>
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByText("Unauthorized - 403")).toBeInTheDocument();
      });
    });

    it("should prevent mahasiswa from accessing laboran routes", async () => {
      mockUseAuth.mockReturnValue({
        user: mahasiswaUser,
        isAuthenticated: true,
        loading: false,
        initialized: true,
      });

      render(
        <MemoryRouter initialEntries={["/laboran/dashboard"]}>
          <Routes>
            <Route
              path="/laboran/dashboard"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={["laboran"]}>
                    <LaboranPage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />
          </Routes>
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByText("Unauthorized - 403")).toBeInTheDocument();
      });
    });
  });

  describe("Dosen Role Access", () => {
    const dosenUser: AuthUser = {
      id: "dosen-123",
      email: "dosen@test.com",
      full_name: "Test Dosen",
      role: "dosen",
      is_active: true,
      avatar_url: null,
      last_seen_at: null,
      metadata: null,
      updated_at: null,
      dosen: {
        id: "dosen-profile-123",
        nip: "198001012020011001",
        nidn: "1234567890",
        gelar_depan: "Dr.",
        gelar_belakang: "M.Keb",
      },
      created_at: new Date().toISOString(),
    };

    it("should allow dosen to access dosen routes", async () => {
      mockUseAuth.mockReturnValue({
        user: dosenUser,
        isAuthenticated: true,
        loading: false,
        initialized: true,
      });

      render(
        <MemoryRouter initialEntries={["/dosen/dashboard"]}>
          <Routes>
            <Route
              path="/dosen/dashboard"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={["dosen"]}>
                    <DosenPage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByText("Dosen Dashboard")).toBeInTheDocument();
      });
    });

    it("should prevent dosen from accessing mahasiswa routes", async () => {
      mockUseAuth.mockReturnValue({
        user: dosenUser,
        isAuthenticated: true,
        loading: false,
        initialized: true,
      });

      render(
        <MemoryRouter initialEntries={["/mahasiswa/dashboard"]}>
          <Routes>
            <Route
              path="/mahasiswa/dashboard"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={["mahasiswa"]}>
                    <MahasiswaPage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />
          </Routes>
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByText("Unauthorized - 403")).toBeInTheDocument();
      });
    });

    it("should prevent dosen from accessing admin routes", async () => {
      mockUseAuth.mockReturnValue({
        user: dosenUser,
        isAuthenticated: true,
        loading: false,
        initialized: true,
      });

      render(
        <MemoryRouter initialEntries={["/admin/dashboard"]}>
          <Routes>
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={["admin"]}>
                    <AdminPage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />
          </Routes>
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByText("Unauthorized - 403")).toBeInTheDocument();
      });
    });
  });

  describe("Laboran Role Access", () => {
    const laboranUser: AuthUser = {
      id: "laboran-123",
      email: "laboran@test.com",
      full_name: "Test Laboran",
      role: "laboran",
      is_active: true,
      avatar_url: null,
      last_seen_at: null,
      metadata: null,
      updated_at: null,
      created_at: new Date().toISOString(),
    };

    it("should allow laboran to access laboran routes", async () => {
      mockUseAuth.mockReturnValue({
        user: laboranUser,
        isAuthenticated: true,
        loading: false,
        initialized: true,
      });

      render(
        <MemoryRouter initialEntries={["/laboran/dashboard"]}>
          <Routes>
            <Route
              path="/laboran/dashboard"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={["laboran"]}>
                    <LaboranPage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByText("Laboran Dashboard")).toBeInTheDocument();
      });
    });

    it("should prevent laboran from accessing mahasiswa routes", async () => {
      mockUseAuth.mockReturnValue({
        user: laboranUser,
        isAuthenticated: true,
        loading: false,
        initialized: true,
      });

      render(
        <MemoryRouter initialEntries={["/mahasiswa/dashboard"]}>
          <Routes>
            <Route
              path="/mahasiswa/dashboard"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={["mahasiswa"]}>
                    <MahasiswaPage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />
          </Routes>
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByText("Unauthorized - 403")).toBeInTheDocument();
      });
    });

    it("should prevent laboran from accessing dosen routes", async () => {
      mockUseAuth.mockReturnValue({
        user: laboranUser,
        isAuthenticated: true,
        loading: false,
        initialized: true,
      });

      render(
        <MemoryRouter initialEntries={["/dosen/dashboard"]}>
          <Routes>
            <Route
              path="/dosen/dashboard"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={["dosen"]}>
                    <DosenPage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />
          </Routes>
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByText("Unauthorized - 403")).toBeInTheDocument();
      });
    });
  });

  describe("Admin Role Access", () => {
    const adminUser: AuthUser = {
      id: "admin-123",
      email: "admin@test.com",
      full_name: "Test Admin",
      role: "admin",
      is_active: true,
      avatar_url: null,
      last_seen_at: null,
      metadata: null,
      updated_at: null,
      created_at: new Date().toISOString(),
    };

    it("should allow admin to access admin routes", async () => {
      mockUseAuth.mockReturnValue({
        user: adminUser,
        isAuthenticated: true,
        loading: false,
        initialized: true,
      });

      render(
        <MemoryRouter initialEntries={["/admin/dashboard"]}>
          <Routes>
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={["admin"]}>
                    <AdminPage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();
      });
    });

    it("should prevent admin from accessing mahasiswa routes (if not multi-role)", async () => {
      mockUseAuth.mockReturnValue({
        user: adminUser,
        isAuthenticated: true,
        loading: false,
        initialized: true,
      });

      render(
        <MemoryRouter initialEntries={["/mahasiswa/dashboard"]}>
          <Routes>
            <Route
              path="/mahasiswa/dashboard"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={["mahasiswa"]}>
                    <MahasiswaPage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />
          </Routes>
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByText("Unauthorized - 403")).toBeInTheDocument();
      });
    });
  });

  describe("Unauthenticated Access", () => {
    it("should redirect unauthenticated users to login", async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        loading: false,
        initialized: true,
      });

      render(
        <MemoryRouter initialEntries={["/mahasiswa/dashboard"]}>
          <Routes>
            <Route
              path="/mahasiswa/dashboard"
              element={
                <ProtectedRoute>
                  <MahasiswaPage />
                </ProtectedRoute>
              }
            />
            <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          </Routes>
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByText("Login Page")).toBeInTheDocument();
      });
    });

    it("should redirect from protected admin routes to login when not authenticated", async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        loading: false,
        initialized: true,
      });

      render(
        <MemoryRouter initialEntries={["/admin/dashboard"]}>
          <Routes>
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={["admin"]}>
                    <AdminPage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          </Routes>
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByText("Login Page")).toBeInTheDocument();
      });
    });
  });

  describe("Loading States", () => {
    it("should show loading state when auth is initializing", () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        loading: true,
        initialized: false,
      });

      render(
        <MemoryRouter initialEntries={["/mahasiswa/dashboard"]}>
          <Routes>
            <Route
              path="/mahasiswa/dashboard"
              element={
                <ProtectedRoute>
                  <MahasiswaPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("should show loading state in RoleGuard when verifying permissions", () => {
      // Set loading state for RoleGuard - ProtectedRoute must be done loading
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: true,
        loading: true,
        initialized: false,
      });

      // Test RoleGuard directly without ProtectedRoute to see its loading state
      render(
        <MemoryRouter initialEntries={["/mahasiswa/dashboard"]}>
          <Routes>
            <Route
              path="/mahasiswa/dashboard"
              element={
                <RoleGuard allowedRoles={["mahasiswa"]}>
                  <MahasiswaPage />
                </RoleGuard>
              }
            />
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.getByText("Verifying permissions...")).toBeInTheDocument();
    });
  });

  describe("Multi-Role Access", () => {
    it("should allow access when user role matches any allowed role", async () => {
      const dosenUser: AuthUser = {
        id: "dosen-123",
        email: "dosen@test.com",
        full_name: "Test Dosen",
        role: "dosen",
        is_active: true,
        avatar_url: null,
        last_seen_at: null,
        metadata: null,
        updated_at: null,
        created_at: new Date().toISOString(),
      };

      mockUseAuth.mockReturnValue({
        user: dosenUser,
        isAuthenticated: true,
        loading: false,
        initialized: true,
      });

      const MultiRolePage = () => <div>Multi-Role Page</div>;

      render(
        <MemoryRouter initialEntries={["/shared/resource"]}>
          <Routes>
            <Route
              path="/shared/resource"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={["dosen", "admin"]}>
                    <MultiRolePage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByText("Multi-Role Page")).toBeInTheDocument();
      });
    });

    it("should deny access when user role does not match any allowed roles", async () => {
      const mahasiswaUser: AuthUser = {
        id: "mhs-123",
        email: "mahasiswa@test.com",
        full_name: "Test Mahasiswa",
        role: "mahasiswa",
        is_active: true,
        avatar_url: null,
        last_seen_at: null,
        metadata: null,
        updated_at: null,
        created_at: new Date().toISOString(),
      };

      mockUseAuth.mockReturnValue({
        user: mahasiswaUser,
        isAuthenticated: true,
        loading: false,
        initialized: true,
      });

      const MultiRolePage = () => <div>Multi-Role Page</div>;

      render(
        <MemoryRouter initialEntries={["/shared/resource"]}>
          <Routes>
            <Route
              path="/shared/resource"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={["dosen", "admin", "laboran"]}>
                    <MultiRolePage />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
            <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />
          </Routes>
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByText("Unauthorized - 403")).toBeInTheDocument();
      });
    });
  });

  describe("RoleGuard without ProtectedRoute", () => {
    it("should redirect to login when user is null in RoleGuard", async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        loading: false,
        initialized: true,
      });

      render(
        <MemoryRouter initialEntries={["/mahasiswa/dashboard"]}>
          <Routes>
            <Route
              path="/mahasiswa/dashboard"
              element={
                <RoleGuard allowedRoles={["mahasiswa"]}>
                  <MahasiswaPage />
                </RoleGuard>
              }
            />
            <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          </Routes>
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByText("Login Page")).toBeInTheDocument();
      });
    });
  });
});
