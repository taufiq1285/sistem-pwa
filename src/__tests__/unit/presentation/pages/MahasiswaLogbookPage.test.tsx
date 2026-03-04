import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import MahasiswaLogbookPage from "@/pages/mahasiswa/LogbookPage";

const {
  mockUseAuth,
  mockToast,
  mockGetJadwal,
  mockGetLogbook,
  mockSupabaseFrom,
} = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockToast: { success: vi.fn(), error: vi.fn() },
  mockGetJadwal: vi.fn(),
  mockGetLogbook: vi.fn(),
  mockSupabaseFrom: vi.fn(),
}));

vi.mock("@/lib/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("sonner", () => ({
  toast: mockToast,
}));

vi.mock("@/lib/api/jadwal.api", () => ({
  getJadwal: (...args: unknown[]) => mockGetJadwal(...args),
}));

vi.mock("@/lib/api/logbook.api", () => ({
  getLogbook: (...args: unknown[]) => mockGetLogbook(...args),
  createLogbook: vi.fn(),
  updateLogbook: vi.fn(),
  submitLogbook: vi.fn(),
  deleteLogbook: vi.fn(),
}));

vi.mock("@/lib/api/kelas.api", () => ({
  getKelas: vi.fn(),
}));

vi.mock("@/lib/api/notification.api", () => ({
  notifyDosenLogbookSubmitted: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    from: (...args: unknown[]) => mockSupabaseFrom(...args),
  },
}));

describe("Mahasiswa LogbookPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAuth.mockReturnValue({
      user: {
        id: "user-mhs-1",
        full_name: "Mahasiswa Satu",
        role: "mahasiswa",
        mahasiswa: { id: "mhs-1" },
      },
    });
  });

  it("menampilkan daftar logbook ketika data tersedia", async () => {
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === "kelas_mahasiswa") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi
            .fn()
            .mockResolvedValue({ data: [{ kelas_id: "k1" }], error: null }),
        };
      }

      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    mockGetJadwal.mockResolvedValue([
      {
        id: "j1",
        kelas_id: "k1",
        status: "approved",
        topik: "Praktikum ANC",
        tanggal_praktikum: "2025-01-10",
        laboratorium: { nama_lab: "Lab Kebidanan" },
      },
    ]);

    mockGetLogbook.mockResolvedValue([
      {
        id: "l1",
        jadwal_id: "j1",
        status: "draft",
        prosedur_dilakukan: "Pemeriksaan dasar",
        hasil_observasi: "Normal",
        skill_dipelajari: ["Pemeriksaan TTV"],
        jadwal: {
          topik: "Praktikum ANC",
          tanggal_praktikum: "2025-01-10",
          laboratorium: { nama_lab: "Lab Kebidanan" },
        },
      },
    ]);

    render(<MahasiswaLogbookPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Logbook Praktikum/i }),
      ).toBeInTheDocument();
    });

    expect(screen.getByText(/Praktikum ANC/i)).toBeInTheDocument();
    expect(screen.getByText(/Pemeriksaan dasar/i)).toBeInTheDocument();
  });

  it("menampilkan empty state saat belum ada logbook", async () => {
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === "kelas_mahasiswa") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi
            .fn()
            .mockResolvedValue({ data: [{ kelas_id: "k1" }], error: null }),
        };
      }

      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    mockGetJadwal.mockResolvedValue([
      {
        id: "j1",
        kelas_id: "k1",
        status: "approved",
        topik: "Praktikum ANC",
        tanggal_praktikum: "2025-01-10",
        laboratorium: { nama_lab: "Lab Kebidanan" },
      },
    ]);

    mockGetLogbook.mockResolvedValue([]);

    render(<MahasiswaLogbookPage />);

    await waitFor(() => {
      expect(screen.getByText(/Belum ada logbook/i)).toBeInTheDocument();
    });
  });

  it("menampilkan toast error saat loadData gagal", async () => {
    mockSupabaseFrom.mockImplementation(() => {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockRejectedValue(new Error("supabase gagal")),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    mockGetJadwal.mockResolvedValue([]);
    mockGetLogbook.mockResolvedValue([]);

    render(<MahasiswaLogbookPage />);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalled();
    });
  });
});
