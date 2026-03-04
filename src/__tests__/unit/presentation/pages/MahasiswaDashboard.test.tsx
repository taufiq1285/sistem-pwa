/**
 * Mahasiswa DashboardPage Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { DashboardPage } from "@/pages/mahasiswa/DashboardPage";

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
}));

vi.mock("@/lib/offline/network-detector", () => ({
  networkDetector: mockNetworkDetector,
}));

vi.mock("@/lib/api/mahasiswa.api", () => ({
  getMahasiswaStats: vi.fn(),
  getMyKelas: vi.fn(),
  getMyJadwal: vi.fn(),
}));

const mockStats = {
  totalKelasPraktikum: 3,
  totalTugasSelesai: 10,
  rataRataNilai: 85,
  tingkatKehadiran: 95,
};

const mockKelas = [
  {
    id: "kelas-1",
    nama_kelas: "Anatomi A",
    mata_kuliah: { kode_mk: "ANT101", nama_mk: "Anatomi Dasar" },
  },
];

const mockJadwal = [
  {
    id: "jadwal-1",
    hari: "senin",
    tanggal_praktikum: "2025-01-06",
    jam_mulai: "08:00",
    jam_selesai: "10:00",
    mata_kuliah_nama: "Anatomi",
    kelas_nama: "Anatomi A",
    lab_nama: "Lab 1",
  },
];

describe("Mahasiswa DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    mockUseAuth.mockReturnValue({
      user: {
        id: "mhs-1",
        full_name: "Siti Rahayu",
        email: "siti@example.com",
        role: "mahasiswa",
      },
    });

    // cacheAPI dipanggil 3x: stats, kelas, jadwal
    // Gunakan implementasi dinamis agar tidak habis antar test
    mockCacheAPI.mockImplementation((key: string) => {
      if (key.includes("stats")) return Promise.resolve(mockStats);
      if (key.includes("kelas")) return Promise.resolve(mockKelas);
      if (key.includes("jadwal")) return Promise.resolve(mockJadwal);
      return Promise.resolve({});
    });
  });

  describe("loading state", () => {
    it("merender loading skeleton dengan animate-pulse", () => {
      mockCacheAPI.mockReturnValue(new Promise(() => {}));
      const { container } = render(<DashboardPage />);
      const pulseEls = container.querySelectorAll(".animate-pulse");
      expect(pulseEls.length).toBeGreaterThan(0);
    });
  });

  describe("loaded state dengan data", () => {
    it("menampilkan judul Dashboard Mahasiswa", async () => {
      render(<DashboardPage />);
      await waitFor(() => {
        expect(screen.getByText("Dashboard Mahasiswa")).toBeInTheDocument();
      });
    });

    it("menampilkan nama user yang login", async () => {
      render(<DashboardPage />);
      await waitFor(() => {
        expect(screen.getByText("Siti Rahayu")).toBeInTheDocument();
      });
    });

    it("menampilkan total kelas dari stats", async () => {
      render(<DashboardPage />);
      await waitFor(() => {
        // stats.totalKelasPraktikum = 3 pada kartu "Total Kelas"
        expect(screen.getByText("Total Kelas")).toBeInTheDocument();
        expect(screen.getAllByText("3").length).toBeGreaterThanOrEqual(1);
      });
    });

    it("memanggil cacheAPI setidaknya 3 kali (stats, kelas, jadwal)", async () => {
      render(<DashboardPage />);
      await waitFor(() => {
        expect(mockCacheAPI.mock.calls.length).toBeGreaterThanOrEqual(3);
      });
    });

    it("memanggil cacheAPI dengan key yang mengandung user id", async () => {
      render(<DashboardPage />);
      await waitFor(() => {
        const firstCall = mockCacheAPI.mock.calls[0][0] as string;
        expect(firstCall).toContain("mhs-1");
      });
    });
  });

  describe("alert tidak ada kelas", () => {
    it("menampilkan alert saat mahasiswa belum terdaftar kelas", async () => {
      mockCacheAPI.mockImplementation((key: string) => {
        if (key.includes("stats")) return Promise.resolve(mockStats);
        if (key.includes("kelas")) return Promise.resolve([]);
        if (key.includes("jadwal")) return Promise.resolve([]);
        return Promise.resolve({});
      });
      render(<DashboardPage />);
      await waitFor(() => {
        expect(
          screen.getByText(/belum terdaftar di kelas praktikum/i),
        ).toBeInTheDocument();
      });
    });

    it("tidak menampilkan alert jika sudah terdaftar kelas", async () => {
      render(<DashboardPage />);
      await waitFor(() => screen.getByText("Dashboard Mahasiswa"));
      expect(
        screen.queryByText(/belum terdaftar di kelas praktikum/i),
      ).not.toBeInTheDocument();
    });
  });

  describe("tanpa user", () => {
    it("tidak memanggil cacheAPI jika user null", async () => {
      mockUseAuth.mockReturnValue({ user: null });
      render(<DashboardPage />);
      await new Promise((r) => setTimeout(r, 50));
      expect(mockCacheAPI).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("tidak crash saat cacheAPI reject", async () => {
      mockCacheAPI.mockReset().mockRejectedValue(new Error("Network Error"));
      expect(() => render(<DashboardPage />)).not.toThrow();
      await new Promise((r) => setTimeout(r, 100));
    });
  });
});
