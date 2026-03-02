/**
 * RoleGuard Component Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { RoleGuard } from "@/components/common/RoleGuard";

const mockUseAuth = vi.fn();

vi.mock("@/lib/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/config/routes.config", () => ({
  ROUTES: { LOGIN: "/login", UNAUTHORIZED: "/403" },
}));

function renderWithRouter(
  ui: React.ReactElement,
  { initialEntries = ["/admin"] } = {},
) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/admin" element={ui} />
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/403" element={<div>Unauthorized Page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("RoleGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
  });

  describe("loading state", () => {
    it("menampilkan loading saat loading=true", () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        initialized: false,
      });

      renderWithRouter(
        <RoleGuard allowedRoles={["admin"]}>
          <div>Admin Panel</div>
        </RoleGuard>,
      );

      expect(screen.getByText("Verifying permissions...")).toBeInTheDocument();
      expect(screen.queryByText("Admin Panel")).not.toBeInTheDocument();
    });
  });

  describe("unauthenticated", () => {
    it("redirect ke /login saat user null", () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        initialized: true,
      });

      renderWithRouter(
        <RoleGuard allowedRoles={["admin"]}>
          <div>Admin Panel</div>
        </RoleGuard>,
      );

      expect(screen.getByText("Login Page")).toBeInTheDocument();
      expect(screen.queryByText("Admin Panel")).not.toBeInTheDocument();
    });
  });

  describe("role tidak sesuai", () => {
    it("redirect ke /403 saat role tidak termasuk allowedRoles", () => {
      mockUseAuth.mockReturnValue({
        user: { id: "1", role: "mahasiswa" },
        loading: false,
        initialized: true,
      });

      renderWithRouter(
        <RoleGuard allowedRoles={["admin", "dosen"]}>
          <div>Admin Panel</div>
        </RoleGuard>,
      );

      expect(screen.getByText("Unauthorized Page")).toBeInTheDocument();
      expect(screen.queryByText("Admin Panel")).not.toBeInTheDocument();
    });
  });

  describe("role sesuai", () => {
    it("merender children saat role ada di allowedRoles", () => {
      mockUseAuth.mockReturnValue({
        user: { id: "1", role: "admin" },
        loading: false,
        initialized: true,
      });

      renderWithRouter(
        <RoleGuard allowedRoles={["admin"]}>
          <div>Admin Panel</div>
        </RoleGuard>,
      );

      expect(screen.getByText("Admin Panel")).toBeInTheDocument();
    });

    it("merender children saat role adalah salah satu dari beberapa allowedRoles", () => {
      mockUseAuth.mockReturnValue({
        user: { id: "2", role: "dosen" },
        loading: false,
        initialized: true,
      });

      renderWithRouter(
        <RoleGuard allowedRoles={["admin", "dosen", "laboran"]}>
          <div>Multi-role Content</div>
        </RoleGuard>,
      );

      expect(screen.getByText("Multi-role Content")).toBeInTheDocument();
    });

    it("semua role valid (admin, dosen, mahasiswa, laboran)", () => {
      const roles = ["admin", "dosen", "mahasiswa", "laboran"] as const;

      roles.forEach((role) => {
        mockUseAuth.mockReturnValue({
          user: { id: "x", role },
          loading: false,
          initialized: true,
        });

        const { unmount } = renderWithRouter(
          <RoleGuard allowedRoles={[role]}>
            <div>{role} content</div>
          </RoleGuard>,
        );

        expect(screen.getByText(`${role} content`)).toBeInTheDocument();
        unmount();
      });
    });
  });
});
