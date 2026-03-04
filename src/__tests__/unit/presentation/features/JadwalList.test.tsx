/**
 * JadwalList Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import JadwalList from "@/components/features/jadwal/JadwalList";

// Mock useAuth
const mockUseAuth = vi.fn();
vi.mock("@/lib/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock jadwal API
const mockGetJadwalMingguIni = vi.fn();
vi.mock("@/lib/api/jadwal.api", () => ({
  getJadwalMingguIni: (...args: unknown[]) => mockGetJadwalMingguIni(...args),
}));

function makeJadwal(overrides = {}) {
  return {
    id: "jadwal-1",
    kelas_id: "kelas-1",
    hari: "senin",
    tanggal_praktikum: "2025-01-06",
    jam_mulai: "08:00",
    jam_selesai: "10:00",
    nama_mk: "Anatomi",
    kode_kelas: "A",
    nama_lab: "Lab 1",
    lokasi: "Gedung A",
    nama_dosen: "Dr. Budi",
    topik: "Pengenalan Anatomi",
    catatan: null,
    ...overrides,
  };
}

describe("JadwalList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockUseAuth.mockReturnValue({ user: { id: "user-1" } });
  });

  describe("loading state", () => {
    it("menampilkan skeleton loading saat data dimuat", () => {
      mockGetJadwalMingguIni.mockReturnValue(new Promise(() => {}));
      const { container } = render(<JadwalList />);
      // Skeleton cards exist (animate-pulse)
      const skeletons = container.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe("empty state", () => {
    it("menampilkan pesan tidak ada jadwal minggu ini", async () => {
      mockGetJadwalMingguIni.mockResolvedValue([]);
      render(<JadwalList />);
      await waitFor(() => {
        expect(
          screen.getByText("Tidak ada jadwal praktikum minggu ini"),
        ).toBeInTheDocument();
      });
    });

    it("menampilkan pesan nikmati waktu libur", async () => {
      mockGetJadwalMingguIni.mockResolvedValue([]);
      render(<JadwalList />);
      await waitFor(() => {
        expect(
          screen.getByText("Nikmati waktu libur Anda!"),
        ).toBeInTheDocument();
      });
    });
  });

  describe("tidak ada user", () => {
    it("tidak memanggil API saat user tidak ada", async () => {
      mockUseAuth.mockReturnValue({ user: null });
      render(<JadwalList />);
      // Wait a tick
      await new Promise((r) => setTimeout(r, 10));
      expect(mockGetJadwalMingguIni).not.toHaveBeenCalled();
    });
  });

  describe("dengan data jadwal", () => {
    beforeEach(() => {
      mockGetJadwalMingguIni.mockResolvedValue([makeJadwal()]);
    });

    it("menampilkan judul halaman", async () => {
      render(<JadwalList />);
      await waitFor(() => {
        expect(screen.getByText(/Jadwal Praktikum/)).toBeInTheDocument();
      });
    });

    it("menampilkan nama mata kuliah", async () => {
      render(<JadwalList />);
      await waitFor(() => {
        expect(screen.getByText("Anatomi")).toBeInTheDocument();
      });
    });

    it("menampilkan kode kelas", async () => {
      render(<JadwalList />);
      await waitFor(() => {
        expect(screen.getByText("A")).toBeInTheDocument();
      });
    });

    it("menampilkan jam praktikum", async () => {
      render(<JadwalList />);
      await waitFor(() => {
        expect(screen.getByText(/08:00 - 10:00/)).toBeInTheDocument();
      });
    });

    it("menampilkan nama lab dan lokasi", async () => {
      render(<JadwalList />);
      await waitFor(() => {
        expect(screen.getByText(/Lab 1 - Gedung A/)).toBeInTheDocument();
      });
    });

    it("menampilkan nama dosen", async () => {
      render(<JadwalList />);
      await waitFor(() => {
        expect(screen.getByText("Dr. Budi")).toBeInTheDocument();
      });
    });

    it("menampilkan topik jika ada", async () => {
      render(<JadwalList />);
      await waitFor(() => {
        expect(screen.getByText("Pengenalan Anatomi")).toBeInTheDocument();
      });
    });

    it("menampilkan catatan jika ada", async () => {
      mockGetJadwalMingguIni.mockResolvedValue([
        makeJadwal({ catatan: "Bawa alat tulis" }),
      ]);
      render(<JadwalList />);
      await waitFor(() => {
        expect(screen.getByText("Bawa alat tulis")).toBeInTheDocument();
      });
    });

    it("tidak menampilkan section topik jika tidak ada topik", async () => {
      mockGetJadwalMingguIni.mockResolvedValue([makeJadwal({ topik: null })]);
      render(<JadwalList />);
      await waitFor(() => screen.getByText("Anatomi"));
      expect(screen.queryByText("Topik:")).not.toBeInTheDocument();
    });
  });

  describe("error handling", () => {
    it("menampilkan pesan error saat gagal memuat jadwal", async () => {
      mockGetJadwalMingguIni.mockRejectedValue(new Error("Network Error"));
      render(<JadwalList />);
      await waitFor(() => {
        expect(
          screen.getByText("Gagal memuat jadwal praktikum"),
        ).toBeInTheDocument();
      });
    });
  });

  describe("memanggil API dengan user id yang benar", () => {
    it("memanggil getJadwalMingguIni dengan user.id", async () => {
      mockGetJadwalMingguIni.mockResolvedValue([]);
      render(<JadwalList />);
      await waitFor(() => {
        expect(mockGetJadwalMingguIni).toHaveBeenCalledWith("user-1");
      });
    });
  });
});
