/**
 * KehadiranHistory Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KehadiranHistory } from "@/components/features/kehadiran/KehadiranHistory";

const mockGetKehadiranHistory = vi.fn();

vi.mock("@/lib/api/kehadiran.api", () => ({
  getKehadiranHistory: (...args: unknown[]) => mockGetKehadiranHistory(...args),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

function makeRecord(overrides = {}) {
  return {
    tanggal: "2025-01-15",
    total_mahasiswa: 30,
    hadir: 25,
    izin: 2,
    sakit: 1,
    alpha: 2,
    ...overrides,
  };
}

describe("KehadiranHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  describe("loading state", () => {
    it("menampilkan loading spinner saat data dimuat", () => {
      mockGetKehadiranHistory.mockReturnValue(new Promise(() => {}));
      render(<KehadiranHistory kelasId="kelas-1" kelasNama="Kelas A" />);
      expect(screen.getByText("Memuat riwayat...")).toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("menampilkan pesan kosong saat tidak ada riwayat", async () => {
      mockGetKehadiranHistory.mockResolvedValue([]);
      render(<KehadiranHistory kelasId="kelas-1" kelasNama="Kelas A" />);
      await waitFor(() => {
        expect(
          screen.getByText("Belum ada riwayat kehadiran"),
        ).toBeInTheDocument();
      });
    });
  });

  describe("dengan data", () => {
    beforeEach(() => {
      mockGetKehadiranHistory.mockResolvedValue([makeRecord()]);
    });

    it("menampilkan judul Riwayat Kehadiran", async () => {
      render(<KehadiranHistory kelasId="kelas-1" kelasNama="Kelas A" />);
      await waitFor(() => {
        expect(screen.getByText("Riwayat Kehadiran")).toBeInTheDocument();
      });
    });

    it("menampilkan nama kelas dan jumlah pertemuan", async () => {
      render(<KehadiranHistory kelasId="kelas-1" kelasNama="Kelas A" />);
      await waitFor(() => {
        expect(screen.getByText(/Kelas A/)).toBeInTheDocument();
        expect(screen.getByText(/1 pertemuan/)).toBeInTheDocument();
      });
    });

    it("menampilkan badge jumlah hadir", async () => {
      render(<KehadiranHistory kelasId="kelas-1" kelasNama="Kelas A" />);
      await waitFor(() => {
        expect(screen.getByText(/Hadir 25/)).toBeInTheDocument();
      });
    });

    it("menampilkan konteks mata kuliah jika tersedia", async () => {
      mockGetKehadiranHistory.mockResolvedValue([
        makeRecord({
          mata_kuliah_id: "mk-1",
          mata_kuliah_nama: "Askeb Kehamilan",
          mata_kuliah_kode: "AK",
        }),
      ]);

      render(<KehadiranHistory kelasId="kelas-1" kelasNama="Kelas A" />);

      await waitFor(() => {
        expect(screen.getByText("Askeb Kehamilan (AK)")).toBeInTheDocument();
      });
    });

    it("menampilkan dua mata kuliah pada tanggal yang sama sebagai riwayat terpisah", async () => {
      mockGetKehadiranHistory.mockResolvedValue([
        makeRecord({
          mata_kuliah_id: "mk-1",
          mata_kuliah_nama: "Askeb Kehamilan",
          mata_kuliah_kode: "AK",
          hadir: 20,
        }),
        makeRecord({
          mata_kuliah_id: "mk-2",
          mata_kuliah_nama: "Kesehatan Reproduksi",
          mata_kuliah_kode: "KR",
          hadir: 18,
        }),
      ]);

      render(<KehadiranHistory kelasId="kelas-1" kelasNama="Kelas A" />);

      await waitFor(() => {
        expect(screen.getByText("Askeb Kehamilan (AK)")).toBeInTheDocument();
        expect(
          screen.getByText("Kesehatan Reproduksi (KR)"),
        ).toBeInTheDocument();
      });
    });

    it("menampilkan badge alpha saat ada mahasiswa alpha", async () => {
      render(<KehadiranHistory kelasId="kelas-1" kelasNama="Kelas A" />);
      await waitFor(() => {
        expect(screen.getByText(/Alpha 2/)).toBeInTheDocument();
      });
    });

    it("expand detail saat baris diklik", async () => {
      render(<KehadiranHistory kelasId="kelas-1" kelasNama="Kelas A" />);
      await waitFor(() => screen.getByText(/Hadir 25/));

      // Klik baris tanggal untuk expand
      const row = screen.getByRole("button", { name: /Rabu/ });
      await userEvent.click(row);

      await waitFor(() => {
        expect(screen.getByText("Hadir")).toBeInTheDocument();
        expect(screen.getByText("Alpha")).toBeInTheDocument();
      });
    });

    it("menampilkan tombol Lihat Detail saat onSelectDate diberikan", async () => {
      const onSelectDate = vi.fn();
      render(
        <KehadiranHistory
          kelasId="kelas-1"
          kelasNama="Kelas A"
          onSelectDate={onSelectDate}
        />,
      );
      await waitFor(() => screen.getByText(/Hadir 25/));

      const row = screen.getByRole("button", { name: /Rabu/ });
      await userEvent.click(row);

      await waitFor(() => {
        expect(
          screen.getByText("Lihat Detail / Edit Kehadiran"),
        ).toBeInTheDocument();
      });
    });

    it("memanggil onSelectDate saat tombol detail diklik", async () => {
      const onSelectDate = vi.fn();
      render(
        <KehadiranHistory
          kelasId="kelas-1"
          kelasNama="Kelas A"
          onSelectDate={onSelectDate}
        />,
      );
      await waitFor(() => screen.getByText(/Hadir 25/));

      const row = screen.getByRole("button", { name: /Rabu/ });
      await userEvent.click(row);

      await waitFor(() => screen.getByText("Lihat Detail / Edit Kehadiran"));
      await userEvent.click(screen.getByText("Lihat Detail / Edit Kehadiran"));

      expect(onSelectDate).toHaveBeenCalledWith("2025-01-15");
    });
  });

  describe("error handling", () => {
    it("menampilkan toast error saat gagal memuat", async () => {
      const { toast } = await import("sonner");
      mockGetKehadiranHistory.mockRejectedValue(new Error("Network error"));

      render(<KehadiranHistory kelasId="kelas-1" kelasNama="Kelas A" />);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Gagal memuat riwayat kehadiran",
        );
      });
    });
  });
});
