/**
 * Dosen DashboardPage Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DashboardPage } from "@/pages/dosen/DashboardPage";

const { mockUseAuth, mockCacheAPI, mockNetworkDetector } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockCacheAPI: vi.fn(),
  mockNetworkDetector: { isOnline: vi.fn(() => true) },
}));

vi.mock("@/lib/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/lib/offline/api-cache", () => ({
  cacheAPI: (...args: unknown[]) => mockCacheAPI(...args),
  getCachedData: vi.fn().mockResolvedValue(null),
  invalidateCache: vi.fn(),
}));

vi.mock("@/lib/offline/network-detector", () => ({
  networkDetector: mockNetworkDetector,
}));

vi.mock("@/lib/api/dosen.api", () => ({
  getDosenStats: vi.fn(),
  getMyKelas: vi.fn(),
  getUpcomingPracticum: vi.fn(),
  getPendingGrading: vi.fn(),
  getActiveKuis: vi.fn(),
  refreshDosenData: vi.fn(),
  checkDosenAssignmentChanges: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
      unsubscribe: vi.fn(),
    })),
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}));

const mockStats = {
  totalKelas: 2,
  totalMahasiswa: 40,
  pendingGrading: 5,
  activeKuis: 1,
  completionRate: 80,
};

const mockKelas = [
  {
    id: "kelas-1",
    nama_kelas: "TI-1A",
    kode_kelas: "TIA",
    total_mahasiswa: 20,
    mata_kuliah: { kode_mk: "ANT101", nama_mk: "Anatomi" },
  },
];

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("Dosen DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    mockUseAuth.mockReturnValue({
      user: {
        id: "dosen-1",
        full_name: "Dr. Budi",
        email: "budi@example.com",
        role: "dosen",
      },
    });

    mockCacheAPI.mockImplementation(async (key: string) => {
      if (key.startsWith("dosen_assignments_")) {
        return [
          {
            dosen_id: "dosen-1",
            mata_kuliah_id: "mk-1",
            kelas_id: "kelas-1",
            total_jadwal: 2,
            total_mahasiswa: 20,
            tanggal_mulai: "2025-01-10",
            tanggal_selesai: "2025-01-17",
            mata_kuliah: {
              id: "mk-1",
              nama_mk: "Anatomi",
              kode_mk: "ANT101",
            },
            kelas: {
              id: "kelas-1",
              nama_kelas: "TI-1A",
              kode_kelas: "TIA",
              tahun_ajaran: "2024/2025",
              semester_ajaran: 2,
            },
          },
        ];
      }

      if (key.startsWith("dosen_stats_")) return mockStats;
      if (key.startsWith("dosen_kelas_")) return mockKelas;
      if (key.startsWith("dosen_practicum_")) return [];
      if (key.startsWith("dosen_grading_")) return [];
      if (key.startsWith("dosen_kuis_")) return [];

      return {};
    });
  });

  describe("loading state", () => {
    it("merender skeleton loading saat data belum dimuat", () => {
      mockCacheAPI.mockReturnValue(new Promise(() => {}));
      const { container } = renderWithRouter(<DashboardPage />);
      const skeletonCards = container.querySelectorAll('[data-slot="card"]');
      expect(skeletonCards.length).toBeGreaterThan(0);
    });
  });

  describe("loaded state", () => {
    it("menampilkan judul Dashboard Dosen", async () => {
      renderWithRouter(<DashboardPage />);
      await waitFor(() => {
        expect(screen.getByText(/Dashboard Dosen/i)).toBeInTheDocument();
      });
    });

    it("menampilkan nama dosen yang login", async () => {
      renderWithRouter(<DashboardPage />);
      await waitFor(() => {
        expect(screen.getByText(/Dr\. Budi/)).toBeInTheDocument();
      });
    });

    it("memanggil cacheAPI minimal satu kali", async () => {
      renderWithRouter(<DashboardPage />);
      await waitFor(() => {
        expect(mockCacheAPI).toHaveBeenCalled();
      });
    });
  });

  describe("tombol refresh", () => {
    it("menampilkan tombol Refresh Data", async () => {
      renderWithRouter(<DashboardPage />);
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /Refresh Data|Refresh/i }),
        ).toBeInTheDocument();
      });
    });
  });

  describe("tanpa user", () => {
    it("tidak memanggil cacheAPI saat user null", async () => {
      mockUseAuth.mockReturnValue({ user: null });
      renderWithRouter(<DashboardPage />);
      await new Promise((r) => setTimeout(r, 50));
      expect(mockCacheAPI).not.toHaveBeenCalled();
    });
  });

  describe("error state", () => {
    it("tidak crash saat cacheAPI reject", async () => {
      mockCacheAPI.mockRejectedValue(new Error("Server Error"));
      expect(() => renderWithRouter(<DashboardPage />)).not.toThrow();
      await new Promise((r) => setTimeout(r, 100));
    });

    it("menampilkan error message saat fetch gagal", async () => {
      mockCacheAPI.mockRejectedValue(new Error("Server Error"));
      renderWithRouter(<DashboardPage />);
      await waitFor(() => {
        expect(
          screen.getByText(/Server Error|gagal|error/i),
        ).toBeInTheDocument();
      });
    });
  });
});
