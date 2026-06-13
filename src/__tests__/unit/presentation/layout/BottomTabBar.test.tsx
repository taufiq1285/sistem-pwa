import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { BottomTabBar } from "@/components/layout/BottomTabBar";

// Mock Hooks & Configuration
const mockUser = {
  role: "admin",
  full_name: "Admin User",
  email: "admin@example.com",
};

const mockUseAuth = vi.fn(() => ({
  user: mockUser,
  logout: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

const mockUnreadCount = vi.fn(() => 0);
vi.mock("@/lib/hooks/useUnreadNotifications", () => ({
  useUnreadNotifications: () => ({
    unreadCount: mockUnreadCount(),
  }),
}));

vi.mock("@/config/navigation.config", () => ({
  isRouteActive: (currentPath: string, href: string) => currentPath === href,
}));

describe("BottomTabBar Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render correct tabs for admin role", () => {
    mockUseAuth.mockReturnValue({
      user: { role: "admin", full_name: "Admin", email: "admin@example.com" },
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/admin/dashboard"]}>
        <BottomTabBar />
      </MemoryRouter>,
    );

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Pengguna")).toBeInTheDocument();
    expect(screen.getByText("Lab")).toBeInTheDocument();
    expect(screen.getByText("Peminjaman")).toBeInTheDocument();
    expect(screen.getByText("Lebih")).toBeInTheDocument();
  });

  it("should render correct tabs for dosen role", () => {
    mockUseAuth.mockReturnValue({
      user: { role: "dosen", full_name: "Dosen", email: "dosen@example.com" },
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/dosen/dashboard"]}>
        <BottomTabBar />
      </MemoryRouter>,
    );

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Jadwal")).toBeInTheDocument();
    expect(screen.getByText("Kuis")).toBeInTheDocument();
    expect(screen.getByText("Nilai")).toBeInTheDocument();
    expect(screen.getByText("Profil")).toBeInTheDocument();
  });

  it("should render correct tabs for mahasiswa role", () => {
    mockUseAuth.mockReturnValue({
      user: {
        role: "mahasiswa",
        full_name: "Mahasiswa",
        email: "mhs@example.com",
      },
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/mahasiswa/dashboard"]}>
        <BottomTabBar />
      </MemoryRouter>,
    );

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Jadwal")).toBeInTheDocument();
    expect(screen.getByText("Kuis")).toBeInTheDocument();
    expect(screen.getByText("Materi")).toBeInTheDocument();
    expect(screen.getByText("Nilai")).toBeInTheDocument();
  });

  it("should render correct tabs for laboran role", () => {
    mockUseAuth.mockReturnValue({
      user: { role: "laboran", full_name: "Laboran", email: "lab@example.com" },
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/laboran/dashboard"]}>
        <BottomTabBar />
      </MemoryRouter>,
    );

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Inventaris")).toBeInTheDocument();
    expect(screen.getByText("Persetujuan")).toBeInTheDocument();
    expect(screen.getByText("Jadwal")).toBeInTheDocument();
    expect(screen.getByText("Laporan")).toBeInTheDocument();
  });

  it("should render notification badge dot when unread count > 0", () => {
    mockUseAuth.mockReturnValue({
      user: { role: "admin", full_name: "Admin", email: "admin@example.com" },
      logout: vi.fn(),
    });
    mockUnreadCount.mockReturnValue(5);

    const { container } = render(
      <MemoryRouter initialEntries={["/admin/dashboard"]}>
        <BottomTabBar />
      </MemoryRouter>,
    );

    // Should find the animate-pulse badge inside BottomTabBar (the "Lebih" tab for Admin)
    const badge = container.querySelector(".animate-pulse");
    expect(badge).toBeInTheDocument();
  });

  it("should not render when user is not authenticated", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      logout: vi.fn(),
    });

    const { container } = render(
      <MemoryRouter>
        <BottomTabBar />
      </MemoryRouter>,
    );

    expect(container.firstChild).toBeNull();
  });
});
