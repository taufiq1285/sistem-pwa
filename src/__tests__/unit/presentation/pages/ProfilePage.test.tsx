import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminProfilePage from "@/pages/admin/ProfilePage";

const { mockUseAuth, mockCacheAPI } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockCacheAPI: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("@/lib/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/lib/offline/api-cache", () => ({
  cacheAPI: (...args: unknown[]) => mockCacheAPI(...args),
  invalidateCache: vi.fn(),
}));

vi.mock("@/lib/api/profile.api", () => ({
  getAdminProfile: vi.fn(),
  updateAdminProfile: vi.fn(),
}));

function renderWithRouter() {
  return render(
    <MemoryRouter>
      <AdminProfilePage />
    </MemoryRouter>,
  );
}

describe("Admin ProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAuth.mockReturnValue({
      user: {
        id: "admin-1",
        role: "admin",
        full_name: "Admin Sistem",
      },
    });

    mockCacheAPI.mockResolvedValue({
      full_name: "Admin Sistem",
      email: "admin@example.com",
      role: "admin",
    });
  });

  it("render profil admin", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /profil saya/i }),
      ).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue("Admin Sistem")).toBeInTheDocument();
    expect(screen.getByDisplayValue("admin@example.com")).toBeInTheDocument();
  });
});
