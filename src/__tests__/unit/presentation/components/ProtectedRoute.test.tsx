/**
 * ProtectedRoute Component Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route, Outlet } from "react-router-dom";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";

const mockUseAuth = vi.fn();

vi.mock("@/lib/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/config/routes.config", () => ({
  ROUTES: { LOGIN: "/login" },
}));

function renderWithRouter(
  ui: React.ReactElement,
  { initialEntries = ["/dashboard"] } = {},
) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
  });

  describe("loading state", () => {
    it("menampilkan loading saat loading=true", () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        loading: true,
        initialized: false,
      });

      renderWithRouter(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
      );

      expect(screen.getByText("Loading...")).toBeInTheDocument();
      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });

    it("menampilkan loading saat initialized=false", () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        loading: false,
        initialized: false,
      });

      renderWithRouter(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
      );

      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });
  });

  describe("unauthenticated", () => {
    it("redirect ke /login saat tidak terautentikasi", () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        loading: false,
        initialized: true,
      });

      renderWithRouter(
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>,
      );

      expect(screen.getByText("Login Page")).toBeInTheDocument();
      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });
  });

  describe("authenticated", () => {
    it("merender children saat terautentikasi", () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        loading: false,
        initialized: true,
      });

      renderWithRouter(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
      );

      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });

    it("merender Outlet saat tidak ada children", () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        loading: false,
        initialized: true,
      });

      renderWithRouter(
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Dashboard via Outlet</div>} />
          </Route>
        </Routes>,
      );

      expect(screen.getByText("Dashboard via Outlet")).toBeInTheDocument();
    });
  });
});
