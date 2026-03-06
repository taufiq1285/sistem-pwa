import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import DosenPengumumanPage from "@/pages/dosen/PengumumanPage";

const { mockUseAuth, mockCacheAPI, mockGetAllAnnouncements } = vi.hoisted(
  () => ({
    mockUseAuth: vi.fn(),
    mockCacheAPI: vi.fn(),
    mockGetAllAnnouncements: vi.fn(),
  }),
);

vi.mock("@/lib/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/lib/offline/api-cache", () => ({
  cacheAPI: (...args: unknown[]) => mockCacheAPI(...args),
}));

vi.mock("@/lib/api/announcements.api", () => ({
  getAllAnnouncements: (...args: unknown[]) => mockGetAllAnnouncements(...args),
}));

describe("DosenPengumumanPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAuth.mockReturnValue({
      user: { id: "dosen-1", role: "dosen" },
    });

    mockCacheAPI.mockImplementation(
      async (_key: string, fn: () => Promise<any>) => {
        return await fn();
      },
    );
  });

  it("memfilter pengumuman untuk dosen + umum dan menolak role lain", async () => {
    const now = Date.now();
    const tomorrow = new Date(now + 24 * 60 * 60 * 1000).toISOString();
    const yesterday = new Date(now - 24 * 60 * 60 * 1000).toISOString();

    mockGetAllAnnouncements.mockResolvedValue([
      {
        id: "a-umum",
        judul: "Umum",
        konten: "Pengumuman untuk semua",
        target_role: [],
        prioritas: "medium",
        tipe: "info",
        created_at: new Date(now).toISOString(),
        tanggal_mulai: null,
        tanggal_selesai: null,
      },
      {
        id: "a-dosen",
        judul: "Khusus Dosen",
        konten: "Pengumuman dosen",
        target_role: ["dosen"],
        prioritas: "high",
        tipe: "warning",
        created_at: new Date(now - 1000).toISOString(),
        tanggal_mulai: null,
        tanggal_selesai: tomorrow,
      },
      {
        id: "a-mahasiswa",
        judul: "Khusus Mahasiswa",
        konten: "Tidak boleh muncul",
        target_role: ["mahasiswa"],
        prioritas: "low",
        tipe: "event",
        created_at: new Date(now - 2000).toISOString(),
        tanggal_mulai: null,
        tanggal_selesai: null,
      },
      {
        id: "a-expired",
        judul: "Sudah Expired",
        konten: "Tidak boleh muncul",
        target_role: ["dosen"],
        prioritas: "low",
        tipe: "info",
        created_at: new Date(now - 3000).toISOString(),
        tanggal_mulai: null,
        tanggal_selesai: yesterday,
      },
    ]);

    render(<MemoryRouter><DosenPengumumanPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText("Khusus Dosen")).toBeInTheDocument();
      expect(screen.getByText("Umum")).toBeInTheDocument();
    });

    expect(screen.queryByText("Khusus Mahasiswa")).not.toBeInTheDocument();
    expect(screen.queryByText("Sudah Expired")).not.toBeInTheDocument();
    expect(screen.getByText(/2 Notifikasi Aktif/i)).toBeInTheDocument();
  });

  it("menampilkan empty state saat tidak ada notifikasi aktif", async () => {
    mockGetAllAnnouncements.mockResolvedValue([]);

    render(<MemoryRouter><DosenPengumumanPage /></MemoryRouter>);

    await waitFor(() => {
      expect(
        screen.getByText(/Tidak ada notifikasi aktif/i),
      ).toBeInTheDocument();
    });
  });

  it("menampilkan error state saat load gagal", async () => {
    mockCacheAPI.mockRejectedValue(new Error("load gagal"));

    render(<MemoryRouter><DosenPengumumanPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText(/load gagal/i)).toBeInTheDocument();
    });
  });
});
