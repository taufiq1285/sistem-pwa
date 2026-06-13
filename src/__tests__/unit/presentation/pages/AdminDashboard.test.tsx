/**
 * Admin DashboardPage Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DashboardPage } from "@/pages/admin/DashboardPage";
import {
  ChartCard,
  DashboardSkeleton,
  EmptyState,
  ErrorFallback,
} from "@/components/common";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import * as recharts from "recharts";
import * as tabler from "@tabler/icons-react";

const { mockUseAuth, mockCacheAPI, mockGetCachedData, mockNetworkDetector } =
  vi.hoisted(() => ({
    mockUseAuth: vi.fn(),
    mockCacheAPI: vi.fn(),
    mockGetCachedData: vi.fn(),
    mockNetworkDetector: { isOnline: vi.fn(() => true) },
  }));

vi.mock("@/lib/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/lib/offline/api-cache", () => ({
  cacheAPI: (...args: unknown[]) => mockCacheAPI(...args),
  getCachedData: (...args: unknown[]) => mockGetCachedData(...args),
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
  LineChart: ({ children }: any) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => null,
  Area: () => null,
  AreaChart: ({ children }: any) => <div>{children}</div>,
  BarChart: ({ children }: any) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => null,
  PieChart: ({ children }: any) => (
    <div data-testid="pie-chart">{children}</div>
  ),
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

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

function renderWithRouter(ui: React.ReactElement) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Admin DashboardPage", () => {
  it("DEBUG IMPORTS", () => {
    console.warn("DEBUG: DashboardPage", typeof DashboardPage);
    console.warn("DEBUG: ChartCard", typeof ChartCard);
    console.warn("DEBUG: DashboardSkeleton", typeof DashboardSkeleton);
    console.warn("DEBUG: EmptyState", typeof EmptyState);
    console.warn("DEBUG: ErrorFallback", typeof ErrorFallback);
    console.warn("DEBUG: Avatar", typeof Avatar);
    console.warn("DEBUG: AvatarFallback", typeof AvatarFallback);
    console.warn("DEBUG: Badge", typeof Badge);
    console.warn("DEBUG: Button", typeof Button);
    console.warn("DEBUG: Card", typeof Card);
    console.warn("DEBUG: CardContent", typeof CardContent);
    console.warn("DEBUG: CardHeader", typeof CardHeader);
    console.warn("DEBUG: CardTitle", typeof CardTitle);
    console.warn("DEBUG: Alert", typeof Alert);
    console.warn("DEBUG: AlertDescription", typeof AlertDescription);
    console.warn("DEBUG: recharts Area", typeof recharts.Area);
    console.warn("DEBUG: recharts AreaChart", typeof recharts.AreaChart);
    console.warn(
      "DEBUG: recharts CartesianGrid",
      typeof recharts.CartesianGrid,
    );
    console.warn(
      "DEBUG: recharts ResponsiveContainer",
      typeof recharts.ResponsiveContainer,
    );
    console.warn("DEBUG: recharts Tooltip", typeof recharts.Tooltip);
    console.warn("DEBUG: recharts XAxis", typeof recharts.XAxis);
    console.warn("DEBUG: recharts YAxis", typeof recharts.YAxis);
    console.warn(
      "DEBUG: tabler IconAlertTriangle",
      typeof tabler.IconAlertTriangle,
    );
    console.warn("DEBUG: tabler IconWifiOff", typeof tabler.IconWifiOff);
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    // vi.spyOn(console, "error").mockImplementation(() => undefined);

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
    mockGetCachedData.mockResolvedValue(null);
    navigator.onLine = true;
  });

  describe("loading state", () => {
    it("merender loading skeleton saat data dimuat", () => {
      mockCacheAPI.mockReturnValue(new Promise(() => {}));
      const { container } = renderWithRouter(<DashboardPage />);
      const skeletonCards = container.querySelectorAll('[data-slot="card"]');
      expect(skeletonCards.length).toBeGreaterThan(0);
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
        // Stats card for mahasiswa rendered after data loads
        expect(screen.getAllByText(/Mahasiswa/i).length).toBeGreaterThan(0);
      });
    });

    it("menampilkan total dosen dari stats", async () => {
      renderWithRouter(<DashboardPage />);
      await waitFor(() => {
        expect(screen.getAllByText(/15/).length).toBeGreaterThan(0);
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

  describe("offline indicator", () => {
    it("menampilkan Mode Offline dan Snapshot lokal saat memakai cache perangkat", async () => {
      navigator.onLine = false;
      mockNetworkDetector.isOnline.mockReturnValue(false);
      mockGetCachedData.mockImplementation(async (key: unknown) => {
        if (String(key).includes("stats")) {
          return { data: mockStats, timestamp: Date.now() };
        }
        return { data: [], timestamp: Date.now() };
      });
      mockCacheAPI.mockReset().mockRejectedValue(new Error("offline"));

      renderWithRouter(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getAllByText(/Mode Offline/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Snapshot lokal/i).length).toBeGreaterThan(
          0,
        );
      });
    });
  });
});
