/**
 * Admin DashboardPage Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DashboardPage } from "@/pages/admin/DashboardPage";

const {
  mockUseAuth,
  mockCacheAPI,
  mockNetworkDetector,
} = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockCacheAPI: vi.fn(),
  mockNetworkDetector: { isOnline: vi.fn(() => true) },
}));

vi.mock("@/lib/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/lib/offline/api-cache", () => ({
  cacheAPI: (...args: unknown[]) => mockCacheAPI(...args),
}));

vi.mock("@/lib/offline/network-detector", () => ({
  networkDetector: mockNetworkDetector,
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => vi.fn() };
});

// Mock recharts agar tidak error di jsdom
vi.mock("recharts", () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => null,
  Area: () => null,
  AreaChart: ({ children }: any) => <div>{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => null,
  Cell: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/lib/api/admin.api", () => ({
  getDashboardStats: vi.fn(),
  getUserGrowth: vi.fn(),
  getUserDistribution: vi.fn(),
  getLabUsage: vi.fn(),
  getRecentUsers: vi.fn(),
  getRecentAnnouncements: vi.fn(),
}));

const mockStats = {
  totalMahasiswa: 120,
  totalDosen: 15,
  totalLaboran: 5,
  totalLab: 3,
  totalAlat: 200,
  pendingApprovals: 8,
  activeKuis: 4,
  lowStockAlerts: 2,
};

const mockUserGrowth = [
  { month: "Jan", count: 10 },
  { month: "Feb", count: 15 },
];

const mockDistribution = [
  { role: "mahasiswa", count: 100 },
  { role: "dosen", count: 15 },
];

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("Admin DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    mockUseAuth.mockReturnValue({
      user: {
        id: "admin-1",
        full_name: "Admin Sistem",
        email: "admin@example.com",
        role: "admin",
      },
    });

    // cacheAPI mock urutan: stats, growth, distribution, labUsage, recentUsers, recentAnnouncements
    mockCacheAPI
      .mockResolvedValueOnce(mockStats)
      .mockResolvedValueOnce(mockUserGrowth)
      .mockResolvedValueOnce(mockDistribution)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
  });

  describe("loading state", () => {
    it("merender loading skeleton saat data dimuat", () => {
      mockCacheAPI.mockReturnValue(new Promise(() => {}));
      const { container } = renderWithRouter(<DashboardPage />);
      const pulseEls = container.querySelectorAll(".animate-pulse");
      expect(pulseEls.length).toBeGreaterThan(0);
    });
  });

  describe("loaded state dengan data", () => {
    it("menampilkan judul Admin Dashboard atau Dashboard Admin", async () => {
      renderWithRouter(<DashboardPage />);
      await waitFor(() => {
        const headings = screen.getAllByRole("heading");
        const found = headings.some((h) =>
          /admin|dashboard/i.test(h.textContent || ""),
        );
        expect(found).toBe(true);
      });
    });

    it("menampilkan total mahasiswa dari stats", async () => {
      renderWithRouter(<DashboardPage />);
      await waitFor(() => {
        expect(screen.getByText("120")).toBeInTheDocument();
      });
    });

    it("menampilkan total dosen dari stats", async () => {
      renderWithRouter(<DashboardPage />);
      await waitFor(() => {
        expect(screen.getByText("15")).toBeInTheDocument();
      });
    });

    it("memanggil cacheAPI setidaknya satu kali", async () => {
      renderWithRouter(<DashboardPage />);
      await waitFor(() => {
        expect(mockCacheAPI).toHaveBeenCalled();
      });
    });
  });

  describe("quick actions", () => {
    it("menampilkan tombol navigasi seperti Tambah atau Kelola", async () => {
      renderWithRouter(<DashboardPage />);
      await waitFor(() => {
        const buttons = screen.getAllByRole("button");
        expect(buttons.length).toBeGreaterThan(0);
      });
    });
  });

  describe("error handling", () => {
    it("tidak crash saat cacheAPI reject", async () => {
      mockCacheAPI.mockReset().mockRejectedValue(new Error("Fetch failed"));
      expect(() => renderWithRouter(<DashboardPage />)).not.toThrow();
      await new Promise((r) => setTimeout(r, 100));
    });
  });

  describe("tanpa user", () => {
    it("tidak crash saat user null", () => {
      mockUseAuth.mockReturnValue({ user: null });
      expect(() => renderWithRouter(<DashboardPage />)).not.toThrow();
    });
  });
});
