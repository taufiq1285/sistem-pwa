/**
 * Laboran DashboardPage Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { DashboardPage } from "@/pages/laboran/DashboardPage";

const {
  mockUseAuth,
  mockCacheAPI,
  mockInvalidateCache,
  mockNetworkDetector,
  mockProcessApproval,
  mockToast,
} = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockCacheAPI: vi.fn(),
  mockInvalidateCache: vi.fn(),
  mockNetworkDetector: { isOnline: vi.fn(() => true) },
  mockProcessApproval: vi.fn(),
  mockToast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/lib/offline/api-cache", () => ({
  cacheAPI: (...args: unknown[]) => mockCacheAPI(...args),
  invalidateCache: (...args: unknown[]) => mockInvalidateCache(...args),
}));

vi.mock("@/lib/offline/network-detector", () => ({
  networkDetector: mockNetworkDetector,
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => vi.fn() };
});

vi.mock("@/lib/api/laboran.api", () => ({
  getLaboranStats: vi.fn(),
  getPendingApprovals: vi.fn(),
  getInventoryAlerts: vi.fn(),
  getLabScheduleToday: vi.fn(),
  processApproval: (...args: unknown[]) => mockProcessApproval(...args),
}));

vi.mock("sonner", () => ({
  toast: mockToast,
}));

const mockStats = {
  totalLab: 3,
  totalInventaris: 150,
  pendingApprovals: 4,
  lowStockAlerts: 2,
};

const mockApprovals = [
  {
    id: "peminjaman-1",
    inventaris_nama: "Stetoskop",
    inventaris_kode: "INV-001",
    peminjam_nama: "Andi Pratama",
    peminjam_nim: "2201001",
    laboratorium_nama: "Lab Anatomi",
    jumlah_pinjam: 1,
    tanggal_pinjam: "2025-01-10",
    tanggal_kembali_rencana: "2025-01-12",
    keperluan: "Praktikum",
  },
];

const mockInventoryAlerts = [
  {
    id: "alat-1",
    nama_barang: "Stetoskop",
    kode_barang: "INV-001",
    kategori: "Alat Medis",
    laboratorium_nama: "Lab Anatomi",
    kondisi: "baik",
    jumlah_tersedia: 1,
    jumlah: 5,
  },
];

const mockSchedule = [
  {
    id: "jadwal-1",
    mata_kuliah_nama: "Anatomi",
    kelas_nama: "TI-1A",
    dosen_nama: "Dr. Budi",
    jam_mulai: "08:00:00",
    jam_selesai: "10:00:00",
    laboratorium_nama: "Lab Anatomi",
    topik: "Pengenalan Anatomi",
  },
];

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("Laboran DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    mockUseAuth.mockReturnValue({
      user: {
        id: "laboran-1",
        full_name: "Pak Laboran",
        email: "laboran@example.com",
        role: "laboran",
      },
    });

    // cacheAPI dipanggil untuk: stats, approvals, inventory, schedule
    mockCacheAPI
      .mockResolvedValueOnce(mockStats)
      .mockResolvedValueOnce(mockApprovals)
      .mockResolvedValueOnce(mockInventoryAlerts)
      .mockResolvedValueOnce(mockSchedule);
  });

  describe("loading state", () => {
    it("merender skeleton loading saat data dimuat", () => {
      mockCacheAPI.mockReturnValue(new Promise(() => {}));
      const { container } = renderWithRouter(<DashboardPage />);
      const pulseEls = container.querySelectorAll(".animate-pulse");
      expect(pulseEls.length).toBeGreaterThan(0);
    });
  });

  describe("loaded state dengan data", () => {
    it("menampilkan judul Dashboard Laboran", async () => {
      renderWithRouter(<DashboardPage />);
      await waitFor(() => {
        expect(screen.getByText(/Dashboard Laboran/i)).toBeInTheDocument();
      });
    });

    it("menampilkan total lab dari stats", async () => {
      renderWithRouter(<DashboardPage />);
      await waitFor(() => {
        expect(screen.getByText("3")).toBeInTheDocument();
      });
    });

    it("menampilkan jumlah pending approvals dari stats", async () => {
      renderWithRouter(<DashboardPage />);
      await waitFor(() => {
        expect(screen.getAllByText(/4/).length).toBeGreaterThan(0);
      });
    });

    it("memanggil cacheAPI setidaknya satu kali", async () => {
      renderWithRouter(<DashboardPage />);
      await waitFor(() => {
        expect(mockCacheAPI).toHaveBeenCalled();
      });
    });
  });

  describe("pending approvals", () => {
    it("menampilkan nama mahasiswa yang mengajukan peminjaman", async () => {
      renderWithRouter(<DashboardPage />);
      await waitFor(() => {
        expect(
          screen.getByText(/Andi Pratama \(2201001\)/i),
        ).toBeInTheDocument();
      });
    });

    it("menampilkan tombol Approve", async () => {
      renderWithRouter(<DashboardPage />);
      await waitFor(() => {
        expect(
          screen.getAllByRole("button", { name: /Setujui/i }).length,
        ).toBeGreaterThan(0);
      });
    });

    it("menampilkan tombol Reject", async () => {
      renderWithRouter(<DashboardPage />);
      await waitFor(() => {
        expect(
          screen.getAllByRole("button", { name: /Tolak/i }).length,
        ).toBeGreaterThan(0);
      });
    });

    it("membuka dialog reject saat tombol Reject diklik", async () => {
      renderWithRouter(<DashboardPage />);
      await waitFor(() => screen.getAllByRole("button", { name: /Tolak/i }));
      await userEvent.click(
        screen.getAllByRole("button", { name: /^Tolak$/i })[0],
      );
      await waitFor(() => {
        expect(
          screen.getByRole("textbox", { name: /Alasan Penolakan/i }),
        ).toBeInTheDocument();
      });
    });
  });

  describe("inventory alerts", () => {
    it("menampilkan nama alat dengan stok rendah", async () => {
      renderWithRouter(<DashboardPage />);
      await waitFor(() => {
        expect(screen.getAllByText("Stetoskop").length).toBeGreaterThan(1);
      });
    });
  });

  describe("jadwal lab hari ini", () => {
    it("menampilkan nama lab di jadwal", async () => {
      renderWithRouter(<DashboardPage />);
      await waitFor(() => {
        expect(screen.getAllByText(/Lab Anatomi/i).length).toBeGreaterThan(1);
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
      mockCacheAPI.mockReset().mockRejectedValue(new Error("API Error"));
      expect(() => renderWithRouter(<DashboardPage />)).not.toThrow();
      await new Promise((r) => setTimeout(r, 100));
    });

    it("menampilkan pesan error", async () => {
      mockCacheAPI.mockReset().mockRejectedValue(new Error("API Error"));
      renderWithRouter(<DashboardPage />);
      await waitFor(() => {
        expect(screen.getByText(/API Error|gagal|error/i)).toBeInTheDocument();
      });
    });
  });
});
